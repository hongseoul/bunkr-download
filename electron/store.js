/**
 * Local JSON persistence for bookmarks and UI settings.
 * Lives under Electron userData — never uploaded. The rules live in src/store-core.js.
 */

import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';
import { randomUUID } from 'node:crypto';
import {
  emptyBookmarks,
  emptyQueue,
  listBookmarksFrom,
  saveBookmarkIn,
  updateBookmarkIn,
  removeBookmarkIn,
  settingsFrom,
  mergeSettings,
  sanitizeQueueItems,
} from '../src/store-core.js';

export { albumIdFromUrl } from '../src/store-core.js';

function filePath(name) {
  return path.join(app.getPath('userData'), name);
}

function readJson(file, fallback) {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

const stamp = () => ({ now: new Date().toISOString(), uuid: randomUUID });

// ---------- bookmarks ----------

const BOOKMARKS = 'bookmarks.json';

/** Apply a store-core change and write it when there is one. */
function applyBookmarks(change) {
  const { data, result } = change(readJson(filePath(BOOKMARKS), emptyBookmarks()));
  if (data) writeJson(filePath(BOOKMARKS), data);
  return result;
}

export function listBookmarks() {
  return listBookmarksFrom(readJson(filePath(BOOKMARKS), emptyBookmarks()));
}

/**
 * Add or update a bookmark by URL (same URL overwrites title/note).
 */
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

export function loadSettings() {
  return settingsFrom(readJson(filePath('settings.json'), {}));
}

export function saveSettings(partial = {}) {
  const next = mergeSettings(loadSettings(), partial);
  writeJson(filePath('settings.json'), next);
  return next;
}

// ---------- download queue ----------

export function loadQueue() {
  const data = readJson(filePath('queue.json'), emptyQueue());
  return sanitizeQueueItems(data.items, stamp());
}

export function saveQueue(items) {
  const cleaned = sanitizeQueueItems(items, stamp());
  writeJson(filePath('queue.json'), { version: 1, items: cleaned });
  return cleaned;
}
