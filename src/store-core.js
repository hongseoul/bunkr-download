/**
 * Storage-neutral rules for bookmarks, UI settings and the download queue.
 * Every function works on plain data; the Electron app (electron/store.js, JSON files)
 * and the Chrome extension (chrome.storage) only read and write the results.
 */

export function normalizeAlbumUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    u.hash = '';
    let href = u.href;
    if (href.endsWith('/')) href = href.slice(0, -1);
    return href;
  } catch {
    return s.replace(/\/+$/, '');
  }
}

export function albumIdFromUrl(url) {
  try {
    const u = new URL(String(url || '').trim());
    const m = /\/a\/([^/?#]+)/i.exec(u.pathname);
    return m ? decodeURIComponent(m[1]) : '';
  } catch {
    return '';
  }
}

// ---------- bookmarks ----------

export function emptyBookmarks() {
  return { version: 1, items: [] };
}

/** @param {object} data  stored bookmarks document */
export function listBookmarksFrom(data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  return items
    .filter((it) => it && it.url)
    .sort((a, b) => String(b.updatedAt || b.addedAt || '').localeCompare(String(a.updatedAt || a.addedAt || '')));
}

/**
 * Add or update a bookmark by URL (same URL overwrites title/note).
 * @returns {{ data: object | null, result: object }}  data is null when nothing must be written
 */
export function saveBookmarkIn(data, { url, title = '', note = '' } = {}, { now, uuid }) {
  const normalized = normalizeAlbumUrl(url);
  if (!normalized) {
    return { data: null, result: { ok: false, error: 'URL is required' } };
  }
  const items = Array.isArray(data?.items) ? data.items : [];

  const existing = items.find((it) => normalizeAlbumUrl(it.url) === normalized);
  const cleanTitle = String(title || '').trim();
  const cleanNote = String(note ?? '');

  if (existing) {
    if (cleanTitle) existing.title = cleanTitle;
    if (note !== undefined) existing.note = cleanNote;
    existing.url = normalized;
    existing.updatedAt = now;
    return { data: { version: 1, items }, result: { ok: true, item: existing, updated: true } };
  }

  const item = {
    id: uuid(),
    url: normalized,
    title: cleanTitle || albumIdFromUrl(normalized) || normalized,
    note: cleanNote,
    addedAt: now,
    updatedAt: now,
  };
  items.unshift(item);
  return { data: { version: 1, items }, result: { ok: true, item, updated: false } };
}

/** @returns {{ data: object | null, result: object }} */
export function updateBookmarkIn(data, id, patch = {}, { now }) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const item = items.find((it) => it.id === id);
  if (!item) return { data: null, result: { ok: false, error: 'Bookmark not found' } };

  if (patch.url != null) {
    const normalized = normalizeAlbumUrl(patch.url);
    if (!normalized) return { data: null, result: { ok: false, error: 'URL is required' } };
    item.url = normalized;
  }
  if (patch.title != null) item.title = String(patch.title).trim();
  if (patch.note != null) item.note = String(patch.note);
  item.updatedAt = now;
  return { data: { version: 1, items }, result: { ok: true, item } };
}

/** @returns {{ data: object | null, result: object }} */
export function removeBookmarkIn(data, id) {
  const items = Array.isArray(data?.items) ? data.items : [];
  const next = items.filter((it) => it.id !== id);
  if (next.length === items.length) return { data: null, result: { ok: false, error: 'Bookmark not found' } };
  return { data: { version: 1, items: next }, result: { ok: true } };
}

// ---------- settings ----------

export const DEFAULT_SETTINGS = {
  outputDir: '',
  queueOutputDir: '',
  concurrency: 4,
  maxRetries: 5,
  proxy: '',
  limitRateMBps: 0,
  maintenanceStrategy: 'backoff',
  diskCheck: true,
  skipExisting: false,
  redownloadMismatch: true,
  cipherEnabled: false,
  cipherFind: '',
  cipherReplace: '',
  cipherSensitive: false,
  theme: 'acid',
  searchHost: '',
  searchMode: 'broad',
  searchSort: 'latest',
  searchPer: 20,
  // Discreet view: on-screen masking only (cipherSensitive covers names on disk).
  discreet: false,
  discreetThumbs: 'type',
  discreetNames: 'swap',
  discreetCategories: ['explicit', 'anatomy', 'genres', 'sites'],
  discreetWords: '',
  discreetStrict: false,
  discreetPeek: true,
  discreetVeil: false,
  discreetStartOn: false,
  discreetButton: true,
};

const THEMES = new Set(['acid', 'lavender']);
const SEARCH_MODES = new Set(['broad', 'strict', 'fuzzy', 'substring', 'whole']);
const SEARCH_SORTS = new Set(['latest', 'oldest', 'files']);
const SEARCH_PER_PAGE = new Set([20, 40, 60, 100]);
const DISCREET_THUMBS = new Set(['show', 'type', 'blur', 'animals', 'scenery', 'abstract']);
const DISCREET_NAMES = new Set(['off', 'dots', 'swap', 'generic']);
const WORD_CATEGORIES = ['explicit', 'anatomy', 'genres', 'sites'];

/** Stored settings over the defaults. */
export function settingsFrom(data, defaults = DEFAULT_SETTINGS) {
  return { ...defaults, ...(data && typeof data === 'object' ? data : {}) };
}

/** Merge a partial update into the current settings and validate every field. */
export function mergeSettings(current, partial = {}) {
  const next = { ...current, ...partial };
  next.concurrency = Math.max(1, Math.min(16, parseInt(next.concurrency, 10) || 4));
  const retries = parseInt(next.maxRetries, 10);
  next.maxRetries = Number.isFinite(retries) ? Math.max(0, Math.min(10, retries)) : 5;
  next.proxy = String(next.proxy || '').trim();
  next.limitRateMBps = Math.max(0, Math.min(10000, Number(next.limitRateMBps) || 0));
  next.maintenanceStrategy = next.maintenanceStrategy === 'skip' ? 'skip' : 'backoff';
  next.diskCheck = next.diskCheck !== false;
  next.skipExisting = !!next.skipExisting;
  next.redownloadMismatch = next.redownloadMismatch !== false;
  next.cipherEnabled = !!next.cipherEnabled;
  next.cipherFind = String(next.cipherFind || '');
  next.cipherReplace = String(next.cipherReplace ?? '');
  next.outputDir = String(next.outputDir || '');
  next.queueOutputDir = String(next.queueOutputDir || '');
  next.theme = THEMES.has(next.theme) ? next.theme : 'acid';
  next.searchHost = String(next.searchHost || '').trim();
  next.searchMode = SEARCH_MODES.has(next.searchMode) ? next.searchMode : 'broad';
  next.searchSort = SEARCH_SORTS.has(next.searchSort) ? next.searchSort : 'latest';
  next.searchPer = SEARCH_PER_PAGE.has(Number(next.searchPer)) ? Number(next.searchPer) : 20;
  next.cipherSensitive = !!next.cipherSensitive;
  next.discreet = !!next.discreet;
  next.discreetThumbs = DISCREET_THUMBS.has(next.discreetThumbs) ? next.discreetThumbs : 'type';
  next.discreetNames = DISCREET_NAMES.has(next.discreetNames) ? next.discreetNames : 'swap';
  next.discreetCategories = Array.isArray(next.discreetCategories)
    ? WORD_CATEGORIES.filter((c) => next.discreetCategories.includes(c))
    : [...WORD_CATEGORIES];
  next.discreetWords = String(next.discreetWords || '');
  next.discreetStrict = !!next.discreetStrict;
  next.discreetPeek = next.discreetPeek !== false;
  next.discreetVeil = !!next.discreetVeil;
  next.discreetStartOn = !!next.discreetStartOn;
  next.discreetButton = next.discreetButton !== false;
  return next;
}

// ---------- download queue ----------

export function emptyQueue() {
  return { version: 1, items: [] };
}

function sanitizeQueueItem(it, { uuid, now }) {
  if (!it || !it.url) return null;
  const url = normalizeAlbumUrl(it.url);
  if (!url) return null;
  const status = it.status === 'done' || it.status === 'failed' ? it.status : 'queued';
  return {
    id: it.id || uuid(),
    url,
    title: String(it.title || ''),
    selectedFiles: Array.isArray(it.selectedFiles) ? it.selectedFiles.filter(Boolean) : null,
    outputDir: String(it.outputDir || ''),
    fileCount: Math.max(0, parseInt(it.fileCount, 10) || 0),
    status,
    error: String(it.error || ''),
    result: it.result && typeof it.result === 'object' ? it.result : null,
    addedAt: it.addedAt || now,
  };
}

/** Clean queue items (from storage or from the UI) into their stored shape. */
export function sanitizeQueueItems(items, { uuid, now }) {
  const list = Array.isArray(items) ? items : [];
  return list.map((it) => sanitizeQueueItem(it, { uuid, now })).filter(Boolean);
}
