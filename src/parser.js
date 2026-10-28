import * as cheerio from 'cheerio';
import { parse } from 'node:url';
import {
  BROWSER_HEADERS,
  mediaClient,
  albumClient,
  retry,
  sleep,
  isAbortError,
  MaintenanceError,
} from './net.js';

const ALBUM_URL_PATTERN = /^https?:\/\/(?:[\w-]+\.)?bunkr\.[a-z]{2,}(?:\.[a-z]{2,})?\/a\/([^/?#]+)/i;
const MEDIA_HOST_PATTERN = /(?:^|[\w-]+\.)?bunkr\.[a-z]{2,}(?:\.[a-z]{2,})?|bunkr-cdn\.[a-z]{2,}/i;
const CDN_LIKE_HOST = /(?:^|[\w-]+\.)?(?:cdn|media|web|mega)\.[a-z]{2,}/i;

const FILE_PAGE_PATTERN = /(?:^|[\w-]+\.)?bunkr\.[a-z]{2,}(?:\.[a-z]{2,})?\/(?:d|f)\/[^/?#]+/i;

/** A bunkr /f/<slug> or /d/<slug> page that must be resolved to a CDN link (unlike a direct media URL). */
export function isFilePageUrl(url) {
  return FILE_PAGE_PATTERN.test(url || '');
}

export function isAlbumUrl(url) {
  return ALBUM_URL_PATTERN.test(url);
}

const MEDIA_EXT_RE = /\.(?:mp4|mkv|webm|m4v|mov|avi|mp3|m4a|wav|flac|ogg|jpg|jpeg|png|gif|webp|bmp|tiff|zip|rar|7z|pdf)$/i;
const NON_MEDIA_EXT_RE = /\.(?:svg|ico|css|js|json|webmanifest)(?:[?#]|$)/i;

export function isMediaUrl(url) {
  if (!url || NON_MEDIA_EXT_RE.test(url)) return false;
  if (/\.(?:svg|ico)$/i.test(url)) return false;
  // Exclude album pages themselves from being treated as direct media
  if (ALBUM_URL_PATTERN.test(url)) return false;
  if (MEDIA_EXT_RE.test(url)) return true;
  // bunkr file-page paths look like media for traversal purposes
  if (/(?:^|[\w-]+\.)?bunkr\.[a-z]{2,}(?:\.[a-z]{2,})?\/(?:d|f)\/[^/?#]+/i.test(url)) return true;
  // CDN hosts (cdn.*, media.* etc.) are acceptable media sources
  if (CDN_LIKE_HOST.test(url)) return true;
  // Fallback: any bunkr host that is NOT an album and NOT clearly an html page
  if (MEDIA_HOST_PATTERN.test(url) && ! /\.(?:html?|php|aspx?|svg|ico)$/i.test(url)) return true;
  return false;
}

let debugLog = () => {};
/** Route non-fatal parser diagnostics (e.g. API fallbacks) to a logger. */
export function setParserDebug(fn) {
  debugLog = typeof fn === 'function' ? fn : () => {};
}

const MAINTENANCE_RE = /under maintenance|scheduled maintenance|we(?:'|\u2019)ll be back|temporarily unavailable|server maintenance/i;
const CF_CHALLENGE_RE = /attention required|checking your browser|cf-browser-verification|cdn-cgi\/challenge|Just a moment/i;

/** Throws MaintenanceError if a response looks like Bunkr's maintenance page. */
export function assertNotMaintenance(status, body) {
  if (typeof body !== 'string') return;
  // Maintenance pages are tiny; a large 200 page is a real album or file page.
  const plausible = status >= 500 || (status === 200 && body.length < 20000);
  if (plausible && MAINTENANCE_RE.test(body.slice(0, 4000))) throw new MaintenanceError();
}

/**
 * GET with retries. Statuses below 500 are returned by the client, so rate limits
 * (429) and 5xx are inspected here and retried with backoff. Cloudflare challenges are
 * not retried (they will not clear on their own); callers report them.
 */
async function fetchWithRetries(client, url, { referer, max = 4, signal } = {}) {
  return retry(async () => {
    const headers = referer ? { Referer: referer } : {};
    // These clients only treat 5xx as errors; read the response off the error to inspect it.
    const r = await client.get(url, { headers, signal }).catch((e) => {
      if (e.response) return e.response;
      throw e;
    });
    const body = typeof r.data === 'string' ? r.data : '';
    if (r.status === 429 || r.status >= 500) {
      assertNotMaintenance(r.status, body);
      const err = new Error(`HTTP ${r.status} for ${url}`);
      err.retryable = true;
      err.retryAfterMs = parseRetryAfterHeader(r.headers?.['retry-after']);
      throw err;
    }
    assertNotMaintenance(r.status, body);
    return r;
  }, { max, signal });
}

function parseRetryAfterHeader(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, n * 1000) : null;
}

const WINDOWS_RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
const MAX_NAME_LENGTH = 200;

/** Make a string safe as a single file/folder name on Windows, macOS and Linux. */
function sanitize(s) {
  let out = String(s ?? '')
    // eslint-disable-next-line no-control-regex -- control characters are exactly what we strip
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  if (out.length > MAX_NAME_LENGTH) {
    const dot = out.lastIndexOf('.');
    const ext = dot > 0 && out.length - dot <= 12 ? out.slice(dot) : '';
    out = out.slice(0, MAX_NAME_LENGTH - ext.length).trimEnd() + ext;
  }
  const stem = out.includes('.') ? out.slice(0, out.indexOf('.')) : out;
  if (WINDOWS_RESERVED.test(stem)) out = '_' + out;
  return out;
}

function filenameFromResponse(response, url) {
  let name = '';
  const cd = response.headers['content-disposition'];
  if (cd) {
    const match = /filename\*?=(?:UTF-8'')?['"]?([^'";]+)/i.exec(cd);
    if (match) name = decodeURIComponent(match[1]);
  }
  if (!name) {
    name = parse(url).pathname.split('/').filter(Boolean).pop() || 'unknown';
  }
  return decodeURIComponent(name).replace(/\+/g, ' ');
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const THUMB_IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)(?:\?[^#]*)?(?:#.*)?$/i;
const PLACEHOLDER_THUMB_RE = /no-image|placeholder|default[-_]?thumb|\/images\/(?:image|video|file|icon)\.svg/i;
// Bunkr often embeds the media ext into thumb paths: UUID.jpg.png, UUID.mp4.png, UUID.zip.003.png
const THUMB_MEDIA_SUFFIX_RE =
  /\.(?:jpe?g|png|gif|webp|bmp|tiff|mp4|m4v|mkv|webm|mov|avi|mpg|mpeg|ts|m2ts|mp3|m4a|wav|flac|ogg|zip|rar|7z|pdf|tar|gz|xz|iso)(?:\.\d+)?\.(png|jpe?g|webp|gif)(\?[^#]*)?(?:#.*)?$/i;

/**
 * Fix common bunkr thumbnail URL mistakes.
 * og:image frequently points at `…/thumbs/<uuid>.jpg.png` (404) while the real file is
 * `…/thumbs/<uuid>.png` (works for images, videos, and most other types that have thumbs).
 */
export function normalizeBunkrThumbUrl(url) {
  if (!url) return '';
  let u = String(url).trim();
  // Prefer UUID-anchored rewrite: keep host/path, strip any media suffix before the image ext.
  u = u.replace(
    new RegExp(
      `(/thumbs/)(${UUID_RE.source})(?:\\.[^/?#]+)*?(\\.(?:png|jpe?g|webp|gif))(\\?[^#]*)?(?:#.*)?$`,
      'i'
    ),
    '$1$2$3$4'
  );
  // Generic double-extension fallback (non-UUID thumb names)
  u = u.replace(THUMB_MEDIA_SUFFIX_RE, '.$1$2');
  return u;
}

function isUsableThumbUrl(url) {
  if (!url) return false;
  if (PLACEHOLDER_THUMB_RE.test(url)) return false;
  if (/\.(?:svg|ico)(?:[?#]|$)/i.test(url)) return false;
  // Must look like an image URL (path or query), not a raw video/CDN media file
  if (THUMB_IMAGE_EXT_RE.test(url) || /\/thumbs\//i.test(url)) return true;
  if (/\.(?:mp4|mkv|webm|m4v|mov|avi|mp3|zip|rar|7z|pdf)(?:[?#]|$)/i.test(url)) return false;
  return /^https?:\/\//i.test(url);
}

/** Parse human sizes like "32.91 KB" / "1.23 GB" from the album grid (approx; exact size still from file page). */
export function parseHumanSize(text) {
  if (!text) return 0;
  const m = String(text).replace(/,/g, '').trim().match(/^([\d.]+)\s*(B|KB|MB|GB|TB|KiB|MiB|GiB|TiB)?$/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n)) return 0;
  const unit = (m[2] || 'B').toUpperCase();
  const mult = {
    B: 1,
    KB: 1024,
    KIB: 1024,
    MB: 1024 ** 2,
    MIB: 1024 ** 2,
    GB: 1024 ** 3,
    GIB: 1024 ** 3,
    TB: 1024 ** 4,
    TIB: 1024 ** 4,
  }[unit] || 1;
  return Math.round(n * mult);
}

function extFromName(name) {
  if (!name) return '';
  const m = /\.([a-z0-9]{1,8})$/i.exec(name);
  return m ? m[1].toLowerCase() : '';
}

/**
 * Extract a usable thumbnail URL from a file page HTML (+ optional album-grid seed).
 * Covers images, mp4/mkv/webm/etc. via og:image, video poster, /thumbs/ paths, and UUID rebuild.
 */
export function extractThumbnailFromFilePage(html, pageUrl, albumThumb = '') {
  const $ = cheerio.load(html || '');
  const candidates = [];

  const push = (raw) => {
    if (!raw) return;
    let abs;
    try {
      abs = new URL(String(raw).replace(/\\\//g, '/'), pageUrl).href;
    } catch {
      return;
    }
    // Always prefer the normalized form — bunkr og:image often 404s until the
    // media suffix is stripped (UUID.jpg.png → UUID.png).
    candidates.push(normalizeBunkrThumbUrl(abs) || abs);
  };

  if (albumThumb) push(albumThumb);

  push($('meta[property="og:image"]').attr('content'));
  push($('meta[property="og:image:secure_url"]').attr('content'));
  push($('meta[name="twitter:image"]').attr('content'));
  push($('meta[property="twitter:image"]').attr('content'));
  push($('video').attr('poster'));
  push($('video source').attr('poster'));

  // Rebuild UUID.png thumb from media UUID + any /thumbs/ host prefix on the page
  // (do this before related-file thumb strips so we don't pick a neighbor's preview)
  const jsCdn =
    (html.match(/var\s+jsCDN\s*=\s*['"]([^'"]+)['"]/i) || [])[1]?.replace(/\\\//g, '/') || '';
  const uuid =
    (jsCdn.match(UUID_RE) || [])[0] ||
    ($('meta[property="og:image"]').attr('content') || '').match(UUID_RE)?.[0] ||
    '';
  if (uuid) {
    const prefixMatch =
      html.match(new RegExp(`https?:\\/\\/[^"'\\s]+\\/thumbs\\/(?=${uuid})`, 'i')) ||
      html.match(/https?:\/\/[^"'\s]+\/thumbs\//i);
    if (prefixMatch) {
      push(`${prefixMatch[0]}${uuid}.png`);
      push(`${prefixMatch[0]}${uuid}.jpg`);
    }
  }

  // Last resort: page images under /thumbs/ (prefer ones matching this file's UUID)
  const pageThumbs = [];
  $('img.grid-images_box-img, img[src*="/thumbs/"], img[data-src*="/thumbs/"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    if (src) pageThumbs.push(src);
  });
  if (uuid) {
    for (const src of pageThumbs) {
      if (src.includes(uuid)) push(src);
    }
  }
  for (const src of pageThumbs) push(src);

  for (const c of candidates) {
    if (isUsableThumbUrl(c)) return c;
  }
  return '';
}

/**
 * Pull rich card data from the album grid (name, human size, working thumbnail).
 * Current bunkr layout: .theItem → img.grid-images_box-img + .theName + .theSize + a[href^="/f/"].
 */
function extractAlbumGridItems($, albumUrl) {
  const byUrl = new Map();

  const consider = (pageUrl, patch) => {
    if (!pageUrl) return;
    const prev = byUrl.get(pageUrl) || {
      pageUrl,
      fileName: '',
      sizeBytes: 0,
      thumbnailUrl: '',
      ext: '',
    };
    if (patch.fileName && !prev.fileName) prev.fileName = patch.fileName;
    if (patch.sizeBytes && !prev.sizeBytes) prev.sizeBytes = patch.sizeBytes;
    if (patch.thumbnailUrl && !prev.thumbnailUrl) prev.thumbnailUrl = patch.thumbnailUrl;
    if (patch.ext && !prev.ext) prev.ext = patch.ext;
    byUrl.set(pageUrl, prev);
  };

  // Preferred: card containers
  $('.theItem, .grid-images_box, [class*="theItem"]').each((_, el) => {
    const root = $(el);
    const href =
      root.find('a[href*="/f/"], a[href*="/d/"], a[href*="/v/"], a[href*="/i/"]').first().attr('href') ||
      '';
    if (!href) return;
    let pageUrl;
    try {
      pageUrl = new URL(href, albumUrl).href;
    } catch {
      return;
    }
    if (!/\/(?:d|f|v|i)\/[^/?#]+/i.test(new URL(pageUrl).pathname) && !MEDIA_EXT_RE.test(pageUrl)) {
      return;
    }

    const rawThumb =
      root.find('img.grid-images_box-img').attr('src') ||
      root.find('img[src*="/thumbs/"]').attr('src') ||
      root.find('img[data-src*="/thumbs/"]').attr('data-src') ||
      root.find('img').not('[src$=".svg"]').attr('src') ||
      '';
    const thumb = normalizeBunkrThumbUrl(
      (() => {
        try {
          return rawThumb ? new URL(rawThumb, albumUrl).href : '';
        } catch {
          return '';
        }
      })()
    );

    const fileName =
      root.find('.theName').text().trim() ||
      root.attr('title') ||
      root.find('p.truncate').first().text().trim() ||
      '';
    const sizeText = root.find('.theSize').text().trim() || '';
    const sizeBytes = parseHumanSize(sizeText);
    const ext = extFromName(fileName);

    consider(pageUrl, {
      fileName,
      sizeBytes,
      thumbnailUrl: isUsableThumbUrl(thumb) ? thumb : '',
      ext,
    });
  });

  // Fallback / supplement: any file-page link, walk up for nearby img
  $([
    'a[href*="/d/"]',
    'a[href*="/f/"]',
    'a[href*="/v/"]',
    'a[href*="/i/"]',
  ].join(', ')).each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    let pageUrl;
    try {
      pageUrl = new URL(href, albumUrl).href;
    } catch {
      return;
    }
    if (!/\/(?:d|f|v|i)\/[^/?#]+/i.test(new URL(pageUrl).pathname) && !MEDIA_EXT_RE.test(pageUrl)) {
      return;
    }

    if (byUrl.has(pageUrl) && byUrl.get(pageUrl).thumbnailUrl) {
      // already rich
      consider(pageUrl, {});
      return;
    }

    const root = $(el).closest('.theItem, .grid-images_box, [class*="item"], [class*="card"]');
    const scope = root.length ? root : $(el).parent().parent();
    const rawThumb =
      scope.find('img.grid-images_box-img').attr('src') ||
      scope.find('img[src*="/thumbs/"]').attr('src') ||
      scope.find('img').not('[src$=".svg"]').attr('src') ||
      $(el).find('img').attr('src') ||
      '';
    let thumb = '';
    if (rawThumb) {
      try {
        thumb = normalizeBunkrThumbUrl(new URL(rawThumb, albumUrl).href);
      } catch {
        thumb = '';
      }
    }
    const fileName =
      scope.find('.theName').text().trim() ||
      scope.attr('title') ||
      $(el).attr('title') ||
      $(el).attr('aria-label') ||
      '';
    const sizeBytes = parseHumanSize(scope.find('.theSize').text().trim() || '');
    consider(pageUrl, {
      fileName,
      sizeBytes,
      thumbnailUrl: isUsableThumbUrl(thumb) ? thumb : '',
      ext: extFromName(fileName),
    });
  });

  return [...byUrl.values()];
}

const DEFAULT_ALBUM_PAGE_SIZE = 100;
const MAX_ALBUM_PAGES = 50;

function isAdvancedAlbumUrl(albumUrl) {
  try {
    return new URL(albumUrl).searchParams.get('advanced') === '1';
  } catch {
    return false;
  }
}

/** Bunkr's default album grid caps at 100 files; `?advanced=1` embeds the full list. */
export function withAdvancedAlbumUrl(albumUrl) {
  const u = new URL(albumUrl);
  u.searchParams.delete('page');
  u.searchParams.set('advanced', '1');
  return u.href;
}

function maxPageFromHtml(html) {
  let max = 1;
  for (const m of String(html || '').matchAll(/[?&]page=(\d+)/g)) {
    const n = parseInt(m[1], 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

function extractDeclaredFileCount(html, $) {
  const og =
    ($ && $('meta[property="og:description"]').attr('content')) ||
    ($ && $('meta[name="description"]').attr('content')) ||
    '';
  const fromOg = /(?:with\s+)?(\d+)\s+files/i.exec(og);
  if (fromOg) return parseInt(fromOg[1], 10) || 0;

  const notice = ($ && $('.advanced-notice').text()) || '';
  const fromNotice = /All\s+(\d+)\s+files/i.exec(notice);
  if (fromNotice) return parseInt(fromNotice[1], 10) || 0;

  const fromHtml = /(?:Explore this album with|All)\s+(\d+)\s+files/i.exec(html || '');
  return fromHtml ? parseInt(fromHtml[1], 10) || 0 : 0;
}

function albumHasEmbeddedFileDump(html) {
  return /window\.albumFiles\s*=/.test(html || '');
}

function albumLooksTruncated(html, files, declaredCount, { fromAlbumFiles = false } = {}) {
  if (declaredCount > 0 && files.length >= declaredCount) return false;
  if (fromAlbumFiles) return declaredCount > files.length;
  if (declaredCount > 0 && files.length < declaredCount) return true;
  if (maxPageFromHtml(html) > 1) return true;
  if (/\?advanced=1/.test(html || '') && files.length >= DEFAULT_ALBUM_PAGE_SIZE) return true;
  return false;
}

function extractJsStringField(chunk, key) {
  const re = new RegExp(
    '(?:^|[\\s,{])' + key + '\\s*:\\s*("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')'
  );
  const m = re.exec(chunk);
  if (!m) return '';
  const lit = m[1];
  try {
    if (lit.startsWith("'")) {
      return JSON.parse(
        '"' + lit.slice(1, -1).replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/"/g, '\\"') + '"'
      );
    }
    return JSON.parse(lit);
  } catch {
    return lit.slice(1, -1);
  }
}

function extractJsRawField(chunk, key) {
  const m = new RegExp('(?:^|[\\s,{])' + key + '\\s*:\\s*([^,\\n}]+)').exec(chunk);
  return m ? m[1].trim() : '';
}

function extractWindowAlbumFilesLiteral(html) {
  const marker = 'window.albumFiles';
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const eq = html.indexOf('=', start);
  const bracket = html.indexOf('[', start);
  if (eq < 0 || bracket < 0 || eq > bracket || bracket - start > 40) return '';
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (let i = bracket; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (esc) {
        esc = false;
        continue;
      }
      if (c === '\\') {
        esc = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'") {
      inStr = c;
      continue;
    }
    if (c === '[') depth++;
    else if (c === ']') {
      depth--;
      if (depth === 0) return html.slice(bracket, i + 1);
    }
  }
  return '';
}

function filePageUrlFromSlug(slug, albumUrl) {
  const path = '/f/' + String(slug || '').replace(/^\/+/, '');
  return new URL(path, albumUrl).href;
}

function albumItemFromWindowFile(obj, albumUrl) {
  const slug = obj.slug || '';
  if (!slug) return null;
  let pageUrl;
  try {
    pageUrl = filePageUrlFromSlug(slug, albumUrl);
  } catch {
    return null;
  }
  const fileName = obj.original || obj.name || '';
  const sizeBytes = Number(obj.size) || 0;
  let thumbnailUrl = '';
  if (obj.thumbnail) {
    try {
      thumbnailUrl = normalizeBunkrThumbUrl(new URL(obj.thumbnail, albumUrl).href);
    } catch {
      thumbnailUrl = normalizeBunkrThumbUrl(obj.thumbnail);
    }
  }
  return {
    pageUrl,
    fileName,
    sizeBytes,
    thumbnailUrl: isUsableThumbUrl(thumbnailUrl) ? thumbnailUrl : '',
    ext: extFromName(fileName) || extFromName(obj.name || ''),
  };
}

/**
 * Parse bunkr Advanced View's `window.albumFiles = [ ... ]` dump.
 * That array is the full album (not the default 100-file grid cap).
 */
export function extractWindowAlbumFiles(html, albumUrl) {
  const literal = extractWindowAlbumFilesLiteral(html || '');
  if (!literal) return [];

  const inner = literal.replace(/^\s*\[/, '').replace(/\]\s*$/, '');
  const chunks = inner.split(/\n\}\s*,\s*\n/);
  const files = [];
  const seen = new Set();
  for (let chunk of chunks) {
    chunk = chunk.trim();
    if (!chunk) continue;
    if (!chunk.startsWith('{')) chunk = '{' + chunk;
    if (!chunk.endsWith('}')) chunk += '}';
    const item = albumItemFromWindowFile(
      {
        slug: extractJsStringField(chunk, 'slug'),
        original: extractJsStringField(chunk, 'original'),
        name: extractJsStringField(chunk, 'name'),
        thumbnail: extractJsStringField(chunk, 'thumbnail'),
        size: extractJsRawField(chunk, 'size'),
      },
      albumUrl
    );
    if (!item || seen.has(item.pageUrl)) continue;
    seen.add(item.pageUrl);
    files.push(item);
  }
  return files;
}

function extractLegacyAlbumLinks($, albumUrl, seen) {
  const files = [];
  const links = $([
    'a[href*="/d/"]',
    'a[href*="/f/"]',
    'a[href*="/v/"]',
    'a[href*="/i/"]',
    'a.grid-images_box',
    'a.grid-images__item',
    'a[class*="grid-images"]',
    'a[data-download]',
    'a[class*="card"]',
  ].join(', '));

  links.each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    let absolute;
    try {
      absolute = new URL(href, albumUrl).href;
    } catch {
      return;
    }
    if (seen.has(absolute)) return;
    if (!/\/(?:d|f|v|i)\/[^/?#]+/i.test(new URL(absolute).pathname)) {
      if (!MEDIA_EXT_RE.test(absolute)) return;
    }
    seen.add(absolute);
    files.push({
      pageUrl: absolute,
      fileName: '',
      sizeBytes: 0,
      thumbnailUrl: '',
      ext: '',
    });
  });
  return files;
}

function collectAlbumFiles($, html, albumUrl) {
  const fromScript = extractWindowAlbumFiles(html, albumUrl);
  if (fromScript.length) return fromScript;

  const files = [];
  const seen = new Set();
  for (const item of extractAlbumGridItems($, albumUrl)) {
    if (seen.has(item.pageUrl)) continue;
    seen.add(item.pageUrl);
    files.push(item);
  }
  if (files.length) return files;
  return extractLegacyAlbumLinks($, albumUrl, seen);
}

function mergeAlbumFiles(base, extra) {
  const seen = new Set(base.map((f) => f.pageUrl));
  const out = [...base];
  for (const item of extra) {
    if (!item?.pageUrl || seen.has(item.pageUrl)) continue;
    seen.add(item.pageUrl);
    out.push(item);
  }
  return out;
}

async function fetchAlbumPage(albumUrl) {
  let response;
  try {
    response = await fetchWithRetries(albumClient, albumUrl);
  } catch (e) {
    if (e.maintenance) throw e;
    throw new Error(`Network error fetching ${albumUrl}: ${e.message}`);
  }
  const { data, status } = response;
  // Node exposes the post-redirect URL on request.res, a browser XHR on request.responseURL.
  const finalUrl = response.request?.res?.responseUrl || response.request?.responseURL || response.config?.url || albumUrl;
  const html = typeof data === 'string' ? data : String(data || '');

  if (status === 404) {
    const snippet = html.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Album not found (404). Final URL: ${finalUrl}. Body: "${snippet}"`);
  }
  if (status !== 200) {
    const snippet = html.slice(0, 200).replace(/\s+/g, ' ');
    throw new Error(`Failed to fetch album (status ${status}). Final URL: ${finalUrl}. Body: "${snippet}"`);
  }
  if (CF_CHALLENGE_RE.test(html)) {
    throw new Error(`Page is behind a Cloudflare/bot challenge, cannot parse: ${finalUrl}`);
  }

  return { html, finalUrl, $: cheerio.load(data) };
}

async function fetchPaginatedAlbumFiles(albumUrl, html, existing) {
  const maxPage = Math.min(maxPageFromHtml(html), MAX_ALBUM_PAGES);
  if (maxPage <= 1) return existing;
  let files = existing;
  for (let page = 2; page <= maxPage; page++) {
    const u = new URL(albumUrl);
    u.searchParams.delete('advanced');
    u.searchParams.set('page', String(page));
    try {
      const p = await fetchAlbumPage(u.href);
      files = mergeAlbumFiles(files, collectAlbumFiles(p.$, p.html, albumUrl));
    } catch {
      break;
    }
  }
  return files;
}

export async function fetchAlbumMeta(albumUrl) {
  const match = ALBUM_URL_PATTERN.exec(albumUrl);
  if (!match) throw new Error(`Not an album URL: ${albumUrl}`);
  const albumId = match[1];

  const first = await fetchAlbumPage(albumUrl);
  const title =
    first.$('meta[property="og:title"]').attr('content') ||
    first.$('title').first().text() ||
    albumId;
  const albumName = sanitize(title) || sanitize(albumId);

  let files = collectAlbumFiles(first.$, first.html, albumUrl);
  let fromAlbumFiles = albumHasEmbeddedFileDump(first.html) && files.length > 0;
  const declared = extractDeclaredFileCount(first.html, first.$);
  const alreadyAdvanced = isAdvancedAlbumUrl(albumUrl) || fromAlbumFiles;

  // Default album view only renders 100 cards (+ pagination). Advanced View
  // embeds every file in window.albumFiles (https://bunkr.cr/a/<id>?advanced=1).
  if (!alreadyAdvanced && albumLooksTruncated(first.html, files, declared, { fromAlbumFiles })) {
    try {
      const adv = await fetchAlbumPage(withAdvancedAlbumUrl(first.finalUrl || albumUrl));
      const advFiles = collectAlbumFiles(adv.$, adv.html, albumUrl);
      if (advFiles.length > files.length) {
        files = advFiles;
        fromAlbumFiles = albumHasEmbeddedFileDump(adv.html) && advFiles.length > 0;
      }
    } catch {
      // Keep the default-view files; pagination below may still fill the rest.
    }
  }

  if (albumLooksTruncated(first.html, files, declared, { fromAlbumFiles })) {
    files = await fetchPaginatedAlbumFiles(albumUrl, first.html, files);
  }

  return { albumUrl, albumId, albumName, files };
}

// Resolve a file page (e.g. /d/<id> or /f/<id>) to a direct CDN media url.
// referer should be the album URL so the request looks like a click from it.
// Returns { url, filename } where filename is the ORIGINAL file name if known.
//
// Bunkr's current download flow:
//   1. /f/<slug> page has data-file-id="<numericId>" and a Download button
//      linking to https://dl.<host>/file/<numericId>.
//   2. dl.bunkr.cr/file/<id> interstitial page calls
//        POST /api/_001_v2 { id } -> { mediafiles, original, path }
//   3. Build rawUrl = new URL(mediafiles + path), set ?n=<original>
//   4. GET https://glb-apisign.cdn.cr/sign?path=<encoded pathname> -> { token, ex }
//   5. Append ?token=...&ex=... to rawUrl -> signed CDN URL.
// We replicate that flow here.
export async function resolveMediaUrl(filePageUrl, referer, { signal } = {}) {
  const response = await fetchWithRetries(mediaClient, filePageUrl, { referer, signal });
  const { data, status } = response;
  if (status !== 200 && status !== 302) {
    throw new Error(`Failed to resolve file page (${status}): ${filePageUrl}`);
  }
  const htmlStr = typeof data === 'string' ? data : '';
  const $ = cheerio.load(data);

  // Original filename from og:title / <title>
  let originalName =
    $('meta[property="og:title"]').attr('content') ||
    $('title').first().text().replace(/\s*\|\s*Bunkr.*$/i, '').trim() ||
    '';
  // Strip trailing "Download " prefix seen on some interstitials
  originalName = originalName.replace(/^Download\s+/i, '').trim();
  const ognameMatch = /var\s+ogname\s*=\s*['"]([^'"]+)['"]/i.exec(htmlStr);
  if (!originalName && ognameMatch) originalName = ognameMatch[1];

  // Locate numeric file id: prefer Download button href, then data-file-id
  let dlHref = null;
  $('a[href*="/file/"]').each((_, el) => {
    const h = $(el).attr('href');
    if (h && /\/file\/[^/?#]+/i.test(h)) { dlHref = h; return false; }
  });
  const fileId =
    (dlHref && /\/file\/([^/?#]+)/i.exec(dlHref)?.[1]) ||
    $('script[data-file-id]').attr('data-file-id') ||
    $('div[data-file-id]').attr('data-file-id') ||
    '';

  // Extract signing service URL from inline JS (fall back to known constant)
  let signService = 'https://glb-apisign.cdn.cr/sign';
  const signMatch = /(?:SIGN_SERVICE_URL|signService|sign_service)\s*=\s*['"]([^'"]+)/i.exec(htmlStr);
  if (signMatch) signService = signMatch[1];
  const inlineSignMatch = /(https?:\/\/[\w.-]+\/sign)\b/i.exec(htmlStr);
  if (!signMatch && inlineSignMatch) signService = inlineSignMatch[1];

  // Extract the dl host (origin) from dlHref if present
  const dlOrigin = dlHref ? new URL(dlHref, filePageUrl).origin : null;

  // Try the API flow if we have a numeric id and a dl host
  if (fileId && /^\d+$/.test(fileId) && dlOrigin) {
    try {
      const apiResp = await retry(async () => {
        const r = await albumClient.post(`${dlOrigin}/api/_001_v2`, { id: String(fileId) }, {
          headers: { 'Content-Type': 'application/json', Referer: `${dlOrigin}/file/${fileId}` },
          signal,
        }).catch((e) => {
          if (e.response) return e.response;
          throw e;
        });
        assertNotMaintenance(r.status, typeof r.data === 'string' ? r.data : '');
        if (r.status === 429 || r.status >= 500) {
          const err = new Error(`HTTP ${r.status} from file API`);
          err.retryable = true;
          err.retryAfterMs = parseRetryAfterHeader(r.headers?.['retry-after']);
          throw err;
        }
        if (r.status >= 400) throw new Error(`File API returned ${r.status}`);
        return r;
      }, { signal });
      const meta = apiResp.data || {};
      if (meta.mediafiles && meta.path) {
        const rawUrl = new URL(meta.mediafiles + meta.path);
        const origName = (meta.original || originalName || '').trim();
        if (origName) rawUrl.searchParams.set('n', origName);
        // Sign
        let signed = rawUrl;
        try {
          const signResp = await retry(() => albumClient.get(signService, {
            params: { path: decodeURIComponent(rawUrl.pathname) },
            headers: { Referer: `${dlOrigin}/` },
            signal,
          }), { max: 2, signal });
          const { token, ex } = signResp.data || {};
          if (token && ex) {
            rawUrl.searchParams.set('token', String(token));
            rawUrl.searchParams.set('ex', String(ex));
          }
          signed = rawUrl;
        } catch (e) {
          // If signing fails, try the unsigned URL (may work for some files)
          debugLog(`sign failed for ${filePageUrl}: ${e.message}`);
        }
        return { url: signed.href, filename: origName || undefined };
      }
    } catch (e) {
      if (e.maintenance || isAbortError(e) || signal?.aborted) throw e;
      // fall through to scraping
      debugLog(`file API failed for ${filePageUrl}: ${e.message}; falling back to page scraping`);
    }
  }

  // ---- Fallback: scrape direct CDN links from the /f/ page ----
  // Inline jsCDN variable: var jsCDN = "https://..."
  const jsCdnMatch = /var\s+jsCDN\s*=\s*['"]([^'"]+)['"]/i.exec(htmlStr);
  if (jsCdnMatch) {
    const u = jsCdnMatch[1].replace(/\\\//g, '/');
    if (isMediaUrl(u) && !/\.(?:svg|ico)$/i.test(u)) {
      return { url: u, filename: originalName || undefined };
    }
  }

  const candidates = [
    $('a[download]').attr('href'),
    $('a[download]').attr('data-href'),
    $('meta[property="og:video"]').attr('content'),
    $('meta[property="og:video:url"]').attr('content'),
    ...$('video').toArray().map((el) => $(el).attr('src')),
    ...$('source').toArray().map((el) => $(el).attr('src')),
    ...$('a[href*=".mp4"]').toArray().map((el) => $(el).attr('href')),
    ...$('a[href*="/d/"]').toArray().map((el) => $(el).attr('href')),
    ...$('a[href*="cdn"]').toArray().map((el) => $(el).attr('href')),
  ].filter(Boolean);

  const tried = [];
  for (const c of candidates) {
    let abs;
    try { abs = new URL(c, filePageUrl).href; } catch { continue; }
    if (ALBUM_URL_PATTERN.test(abs)) continue;
    if (NON_MEDIA_EXT_RE.test(abs)) continue;
    if (/\.(?:svg|ico)$/i.test(abs)) continue;
    if (!isMediaUrl(abs)) { tried.push(abs); continue; }
    return { url: abs, filename: originalName || undefined };
  }

  // Fallback: scan raw text for a CDN url with a real media extension
  const m = /https?:\/\/[^\s'"<>]+\.(?:mp4|mkv|webm|m4v|mov|avi|mp3|m4a|wav|flac|ogg|jpg|jpeg|png|gif|webp|bmp|tiff|zip|rar|7z|pdf)(?:[/?#]|$)/i.exec(
    data
  );
  if (m) return { url: m[0], filename: originalName || undefined };

  throw new Error(
    `Could not resolve a direct media URL from ${filePageUrl}` +
      (tried.length ? ` (tried: ${tried.slice(0, 3).join(', ')}${tried.length > 3 ? '...' : ''})` : '')
  );
}

// Compute final filename (possibly with album folder) without streaming yet
export function planFile(pageUrl, albumName) {
  return { pageUrl, albumName };
}

// Resolve thumbnails + metadata for all files in an album.
// Returns { albumName, files: [{ pageUrl, fileName, sizeBytes, thumbnailUrl, ext }] }
// Does NOT yet resolve the signed CDN download URL — that's the job of resolveMediaUrl.
//
// Strategy:
//  1. Album grid already has correct thumbs for images + most videos (mp4/mkv/webm…).
//  2. Per-file pages refine name/exact size and recover thumbs when the grid had none
//     (normalize broken og:image double-extensions like UUID.jpg.png → UUID.png).
export async function fetchAlbumPreview(albumUrl, { onProgress, concurrency = 2 } = {}) {
  const album = await fetchAlbumMeta(albumUrl);
  const pLimit = (await import('p-limit')).default;
  const limit = pLimit(Math.max(1, concurrency));

  let done = 0;
  const previews = await Promise.all(
    album.files.map((f) =>
      limit(async () => {
        const item = {
          pageUrl: f.pageUrl,
          fileName: f.fileName || '',
          sizeBytes: f.sizeBytes || 0,
          thumbnailUrl: isUsableThumbUrl(f.thumbnailUrl) ? f.thumbnailUrl : '',
          ext: f.ext || extFromName(f.fileName || ''),
        };
        try {
          const resp = await fetchWithRetries(mediaClient, f.pageUrl, { referer: album.albumUrl });
          const html = typeof resp.data === 'string' ? resp.data : '';
          const $ = cheerio.load(html);

          // Original name
          let name =
            $('meta[property="og:title"]').attr('content') ||
            $('title').first().text().replace(/\s*\|\s*Bunkr.*$/i, '').trim() ||
            '';
          name = name.replace(/^Download\s+/i, '').trim();
          if (!name) {
            const m = /var\s+ogname\s*=\s*['"]([^'"]+)['"]/i.exec(html);
            if (m) name = m[1];
          }
          if (name) item.fileName = name;

          // Thumbnail: album-grid seed first, then file-page sources with bunkr URL fixes.
          // Never fall back to raw media (jsCDN mp4/jpg) — <img> cannot render those.
          const thumb = extractThumbnailFromFilePage(html, f.pageUrl, item.thumbnailUrl);
          if (thumb) item.thumbnailUrl = thumb;

          // Size bytes (bunkr leaks it in a `Debug: Original=…, Size=N` comment)
          const sz = /Size\s*=\s*(\d+)/i.exec(html);
          if (sz) item.sizeBytes = parseInt(sz[1], 10) || 0;

          // Extension for icon fallback
          if (item.fileName) {
            item.ext = extFromName(item.fileName) || item.ext;
          }
        } catch (e) {
          // leave album-grid defaults — we'll still try to download on user selection
        } finally {
          done++;
          if (onProgress) onProgress(done, album.files.length);
        }
        return item;
      })
    )
  );

  return { albumUrl: album.albumUrl, albumName: album.albumName, files: previews };
}

export { mediaClient, albumClient, filenameFromResponse, sanitize, fetchWithRetries, BROWSER_HEADERS, sleep };
export default { fetchAlbumMeta, resolveMediaUrl, fetchAlbumPreview, withAdvancedAlbumUrl };