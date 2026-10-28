import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  albumIdFromUrl,
  emptyBookmarks,
  listBookmarksFrom,
  mergeSettings,
  normalizeAlbumUrl,
  removeBookmarkIn,
  sanitizeQueueItems,
  saveBookmarkIn,
  settingsFrom,
  updateBookmarkIn,
} from '../src/store-core.js';

let n = 0;
const stamp = (now = '2026-10-11T10:00:00.000Z') => ({ now, uuid: () => `id-${++n}` });

test('album URLs are normalised and their id extracted', () => {
  assert.equal(normalizeAlbumUrl(' https://bunkr.cr/a/AbC/#top '), 'https://bunkr.cr/a/AbC');
  assert.equal(normalizeAlbumUrl(''), '');
  assert.equal(albumIdFromUrl('https://bunkr.cr/a/AbC?advanced=1'), 'AbC');
  assert.equal(albumIdFromUrl('not a url'), '');
});

test('bookmarks: same URL updates the entry instead of adding a second one', () => {
  let data = emptyBookmarks();
  const first = saveBookmarkIn(data, { url: 'https://bunkr.cr/a/one', note: 'n1' }, stamp());
  assert.equal(first.result.ok, true);
  assert.equal(first.result.updated, false);
  assert.equal(first.result.item.title, 'one');
  data = first.data;

  const again = saveBookmarkIn(data, { url: 'https://bunkr.cr/a/one/', title: 'Renamed' }, stamp('2026-10-12T00:00:00.000Z'));
  assert.equal(again.result.updated, true);
  assert.equal(again.data.items.length, 1);
  assert.equal(again.data.items[0].title, 'Renamed');
  assert.equal(again.data.items[0].note, '', 'note is reset when the caller passes the default');
});

test('bookmarks: missing URL or id is refused without anything to write', () => {
  assert.deepEqual(saveBookmarkIn(emptyBookmarks(), { url: '  ' }, stamp()), {
    data: null,
    result: { ok: false, error: 'URL is required' },
  });
  assert.equal(updateBookmarkIn(emptyBookmarks(), 'nope', { title: 'x' }, stamp()).data, null);
  assert.equal(removeBookmarkIn(emptyBookmarks(), 'nope').data, null);
});

test('bookmarks: list is newest first; update and remove work by id', () => {
  let data = saveBookmarkIn(emptyBookmarks(), { url: 'https://bunkr.cr/a/old' }, stamp('2026-01-01T00:00:00.000Z')).data;
  data = saveBookmarkIn(data, { url: 'https://bunkr.cr/a/new' }, stamp('2026-02-01T00:00:00.000Z')).data;
  assert.deepEqual(listBookmarksFrom(data).map((b) => b.title), ['new', 'old']);

  const oldId = data.items.find((b) => b.title === 'old').id;
  data = updateBookmarkIn(data, oldId, { note: 'later' }, stamp('2026-03-01T00:00:00.000Z')).data;
  assert.deepEqual(listBookmarksFrom(data).map((b) => b.title), ['old', 'new']);

  data = removeBookmarkIn(data, oldId).data;
  assert.deepEqual(listBookmarksFrom(data).map((b) => b.title), ['new']);
});

test('settings: stored values override defaults and every field is validated', () => {
  const s = settingsFrom({ theme: 'lavender', concurrency: 8 });
  assert.equal(s.theme, 'lavender');
  assert.equal(s.concurrency, 8);
  assert.equal(s.maxRetries, DEFAULT_SETTINGS.maxRetries);

  const m = mergeSettings(s, {
    concurrency: 99,
    maxRetries: 'x',
    theme: 'neon',
    searchPer: 33,
    discreetCategories: ['sites', 'bogus'],
    maintenanceStrategy: 'whatever',
  });
  assert.equal(m.concurrency, 16);
  assert.equal(m.maxRetries, 5);
  assert.equal(m.theme, 'acid');
  assert.equal(m.searchPer, 20);
  assert.deepEqual(m.discreetCategories, ['sites']);
  assert.equal(m.maintenanceStrategy, 'backoff');
});

test('settings: a platform can supply its own defaults', () => {
  const s = settingsFrom({}, { ...DEFAULT_SETTINGS, diskCheck: false });
  assert.equal(s.diskCheck, false);
});

test('queue: junk is dropped, statuses are reset to a known set, ids are kept or minted', () => {
  const items = sanitizeQueueItems([
    null,
    { url: '' },
    { id: 'keep', url: 'https://bunkr.cr/a/x/', status: 'downloading', fileCount: '3' },
    { url: 'https://bunkr.cr/a/y', status: 'done', selectedFiles: ['a', '', 'b'] },
  ], stamp());
  assert.equal(items.length, 2);
  assert.equal(items[0].id, 'keep');
  assert.equal(items[0].url, 'https://bunkr.cr/a/x');
  assert.equal(items[0].status, 'queued');
  assert.equal(items[0].fileCount, 3);
  assert.match(items[1].id, /^id-/);
  assert.equal(items[1].status, 'done');
  assert.deepEqual(items[1].selectedFiles, ['a', 'b']);
});
