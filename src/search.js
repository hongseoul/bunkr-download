import * as cheerio from 'cheerio';
import { isAlbumUrl } from './parser.js';
import { mediaClient, sleep } from './net.js';

// Bunkr has no public album search. Album indexes such as balbums.st list bunkr
// albums by title as plain server-rendered HTML:
//   GET /?search=<query>&mode=<mode>&per=<n>&sort=<sort>&page=<p>
// Each hit is <a class="card" href="https://bunkr.cr/a/<id>"> holding a thumbnail,
// an <h3> title and an "N files" label; the header says "page X of Y".

export const DEFAULT_SEARCH_HOST = 'https://balbums.st';
export const SEARCH_MODES = ['broad', 'strict', 'fuzzy', 'substring', 'whole'];
export const SEARCH_SORTS = ['latest', 'oldest', 'files'];
export const SEARCH_PER_PAGE = [20, 40, 60, 100];

/** "balbums.st", "https://balbums.st/", "" → "https://balbums.st" */
export function normalizeSearchHost(host) {
  const raw = String(host || '').trim();
  if (!raw) return DEFAULT_SEARCH_HOST;
  let u;
  try {
    u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    throw new Error(`Invalid search site address: ${raw}`);
  }
  if (!u.hostname.includes('.')) throw new Error(`Invalid search site address: ${raw}`);
  return u.origin;
}

function pick(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

export function normalizeSearchOptions({ mode, sort, per, page } = {}) {
  return {
    mode: pick(mode, SEARCH_MODES, 'broad'),
    sort: pick(sort, SEARCH_SORTS, 'latest'),
    per: pick(Number(per), SEARCH_PER_PAGE, 20),
    page: Math.max(1, parseInt(page, 10) || 1),
  };
}

export function buildSearchUrl(query, opts = {}) {
  const { mode, sort, per, page } = normalizeSearchOptions(opts);
  const u = new URL('/', normalizeSearchHost(opts.host));
  u.searchParams.set('search', String(query || '').trim());
  u.searchParams.set('mode', mode);
  u.searchParams.set('per', String(per));
  u.searchParams.set('sort', sort);
  u.searchParams.set('page', String(page));
  return u.href;
}

function albumIdFromUrl(url) {
  const m = /\/a\/([^/?#]+)/i.exec(new URL(url).pathname);
  return m ? decodeURIComponent(m[1]) : '';
}

function absUrl(raw, base) {
  if (!raw) return '';
  try {
    return new URL(raw, base).href;
  } catch {
    return '';
  }
}

/**
 * Parse one results page. Selectors are deliberately loose — any link to a bunkr
 * album counts as a hit — so small layout changes on the index site don't break it.
 */
export function parseSearchResults(html, baseUrl) {
  const $ = cheerio.load(html || '');
  const results = [];
  const seen = new Set();

  $('a[href*="/a/"]').each((_, el) => {
    const a = $(el);
    const url = absUrl(a.attr('href'), baseUrl);
    if (!url || !isAlbumUrl(url) || seen.has(url)) return;
    seen.add(url);

    const img = a
      .find('img')
      .filter((_, i) => {
        const src = $(i).attr('src') || $(i).attr('data-src') || '';
        return src && !/\.svg(?:[?#]|$)/i.test(src);
      })
      .first();
    const title =
      a.find('h3, h2').first().text().replace(/\s+/g, ' ').trim() ||
      (img.attr('alt') || '').trim();
    // Count the "N files" label outside the title, so a title like "5 files" can't win.
    const rest = a.clone().find('h3, h2').remove().end().text().replace(/\s+/g, ' ');
    const files = /(\d[\d,]*)\s*files?\b/i.exec(rest);

    results.push({
      url,
      albumId: albumIdFromUrl(url),
      title,
      fileCount: files ? parseInt(files[1].replace(/,/g, ''), 10) || 0 : 0,
      thumbnailUrl: absUrl(img.attr('src') || img.attr('data-src'), baseUrl),
    });
  });

  const text = $('body').text().replace(/\s+/g, ' ');
  const pager = /\bpage\s+(\d+)\s+of\s+(\d+)/i.exec(text);
  let totalPages = pager ? parseInt(pager[2], 10) : 0;
  if (!pager) {
    for (const m of String(html || '').matchAll(/[?&](?:amp;)?page=(\d+)/g)) {
      totalPages = Math.max(totalPages, parseInt(m[1], 10) || 0);
    }
    if (!totalPages && results.length) totalPages = 1;
  }

  const hasSearchForm = $('input[name="search"]').length > 0;
  return { results, totalPages, recognized: hasSearchForm || !!pager || results.length > 0 };
}

async function fetchSearchPage(url) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // The shared client: browser headers, the proxy setting, status < 500 returned as is.
      return await mediaClient.get(url, { timeout: 30000 });
    } catch (e) {
      lastErr = e;
      if (attempt === 0) await sleep(800);
    }
  }
  throw lastErr;
}

/**
 * Search album titles on the index site.
 * @returns {Promise<{ query, mode, sort, per, page, totalPages, host, searchUrl,
 *   results: { url, albumId, title, fileCount, thumbnailUrl }[] }>}
 */
export async function searchAlbums(query, opts = {}) {
  const searchUrl = buildSearchUrl(query, opts);
  const { host } = new URL(searchUrl);

  let response;
  try {
    response = await fetchSearchPage(searchUrl);
  } catch (e) {
    throw new Error(`Album search on ${host} failed: ${e.message}`);
  }
  const html = typeof response.data === 'string' ? response.data : String(response.data || '');

  if (response.status !== 200) {
    throw new Error(
      `Album search on ${host} failed (status ${response.status}). ` +
        'The site may have moved — check the search site address.'
    );
  }
  if (/attention required|checking your browser|cf-browser-verification|cdn-cgi\/challenge|Just a moment/i.test(html)) {
    throw new Error(`Album search on ${host} is behind a Cloudflare/bot challenge.`);
  }

  const parsed = parseSearchResults(html, searchUrl);
  if (!parsed.recognized) {
    throw new Error(
      `Unexpected page from ${host} — it does not look like an album index. ` +
        'The site may have changed or moved.'
    );
  }

  return {
    query: String(query || '').trim(),
    ...normalizeSearchOptions(opts),
    totalPages: parsed.totalPages,
    host,
    searchUrl,
    results: parsed.results,
  };
}

export default { searchAlbums, buildSearchUrl, parseSearchResults, normalizeSearchHost };
