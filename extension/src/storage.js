/**
 * Bookmarks, settings and the download queue in chrome.storage.local.
 * Same rules as the desktop app (src/store-core.js); only the storage differs.
 */

import {
  DEFAULT_SETTINGS,
  emptyBookmarks,
  emptyQueue,
  listBookmarksFrom,
  mergeSettings,
  removeBookmarkIn,
  sanitizeQueueItems,
  saveBookmarkIn,
  settingsFrom,
  updateBookmarkIn,
} from '../../src/store-core.js';

/** Desktop-only features are off: a page has no proxy and cannot measure free disk space. */
export const EXTENSION_DEFAULTS = { ...DEFAULT_SETTINGS, proxy: '', diskCheck: false };

async function read(key, fallback) {
  const got = await chrome.storage.local.get(key);
  return got[key] ?? fallback;
}

function write(key, value) {
  return chrome.storage.local.set({ [key]: value });
}

const stamp = () => ({ now: new Date().toISOString(), uuid: () => crypto.randomUUID() });

// ---------- bookmarks ----------

async function applyBookmarks(change) {
  const { data, result } = change(await read('bookmarks', emptyBookmarks()));
  if (data) await write('bookmarks', data);
  return result;
}

export async function listBookmarks() {
  return listBookmarksFrom(await read('bookmarks', emptyBookmarks()));
}

export function saveBookmark(payload = {}) {
  return applyBookmarks((data) => saveBookmarkIn(data, payload, stamp()));
}

export function updateBookmark(id, patch = {}) {
  return applyBookmarks((data) => updateBookmarkIn(data, id, patch, stamp()));
}

export function removeBookmark(id) {
  return applyBookmarks((data) => removeBookmarkIn(data, id));
}

// ---------- settings ----------

export async function loadSettings() {
  return settingsFrom(await read('settings', {}), EXTENSION_DEFAULTS);
}

export async function saveSettings(partial = {}) {
  const next = mergeSettings(await loadSettings(), partial);
  next.proxy = '';
  next.diskCheck = false;
  await write('settings', next);
  return next;
}

// ---------- download queue ----------

export async function loadQueue() {
  const data = await read('queue', emptyQueue());
  return sanitizeQueueItems(data.items, stamp());
}

export async function saveQueue(items) {
  const cleaned = sanitizeQueueItems(items, stamp());
  await write('queue', { version: 1, items: cleaned });
  return cleaned;
}
