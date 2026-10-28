/**
 * window.api for the Chrome extension: the same contract the desktop UI gets from
 * electron/preload.cjs + electron/main.js, implemented in the page itself.
 * The UI (electron/ui/app.js) runs unchanged on top of it.
 */

import { fetchAlbumPreview, fetchAlbumMeta } from '../../src/parser.js';
import { searchAlbums } from '../../src/search.js';
import { cipherAlbumName, randomCipherToken } from '../../src/name-cipher.js';
import { runDownloadWith } from '../../src/run-core.js';
import sensitiveWords from '../../src/sensitive-words.cjs';
import { setNetworkOptions } from './net-browser.js';
import { createFsIo } from './fs-io.js';
import { folderHandle, pickFolder, requestFolders } from './folders.js';
import { idbPartials } from './idb.js';
import * as store from './storage.js';

const listeners = {
  preview: new Set(),
  progress: new Set(),
  finished: new Set(),
};

function subscribe(set, cb) {
  set.add(cb);
  return () => set.delete(cb);
}

function emit(set, data) {
  for (const cb of set) {
    try {
      cb(data);
    } catch (e) {
      console.error(e);
    }
  }
}

/** Run fn and turn a thrown error into the { ok: false, error } shape the UI expects. */
async function guard(fn) {
  try {
    return await fn();
  } catch (e) {
    return { ok: false, error: e?.message || String(e) };
  }
}

function applyNetworkSettings(settings) {
  setNetworkOptions({ limitRate: Math.round((Number(settings.limitRateMBps) || 0) * 1024 * 1024) });
}

const io = createFsIo({ getRoot: folderHandle, partials: idbPartials });

/** Running downloads, so the UI can stop them. Stopping keeps what arrived for a later resume. */
const jobs = new Map();

async function analyzeLocal({ outputDir, albumName, files = [], nameRules = [] } = {}) {
  if (!outputDir) return { ok: false, error: 'No output directory' };
  await folderHandle(outputDir);
  const albumDir = io.join(outputDir, cipherAlbumName(albumName || 'Direct', nameRules));
  const analysis = await io.analyzeAlbumFiles(albumDir, files, { checkMagic: true, nameRules });
  const counts = { complete: 0, incomplete: 0, size_mismatch: 0, corrupt: 0, missing: 0 };
  for (const r of analysis.results) {
    if (counts[r.status] !== undefined) counts[r.status]++;
    else counts.missing++;
  }
  return { ok: true, ...analysis, counts };
}

/** Same payload and results as the desktop 'album:download' handler (electron/main.js). */
async function downloadAlbum(payload) {
  const {
    jobId = `job-${Date.now()}`,
    albumUrl,
    albumName,
    outputDir,
    selectedFiles,
    concurrency = 4,
    skipExisting = false,
    redownloadMismatch = true,
    nameRules = [],
    fileMeta = {},
  } = payload || {};
  if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
    return { ok: false, error: 'No files selected' };
  }
  await folderHandle(outputDir);
  const controller = new AbortController();
  jobs.set(jobId, controller);
  try {
    const settings = await store.loadSettings();
    applyNetworkSettings(settings);
    const albumDir = io.join(outputDir, cipherAlbumName(albumName || 'Direct', nameRules));
    const files = selectedFiles.map((pageUrl) => ({
      pageUrl,
      fileName: fileMeta[pageUrl]?.fileName || '',
      sizeBytes: fileMeta[pageUrl]?.sizeBytes || 0,
    }));

    const results = await runDownloadWith({
      io,
      albumDir,
      albumUrl,
      files,
      concurrency,
      signal: controller.signal,
      skipExisting,
      redownloadMismatch,
      nameRules,
      maxRetries: settings.maxRetries,
      maintenanceStrategy: settings.maintenanceStrategy,
      onEvent: (ev) => {
        // Chunk events carry byte counts only; the UI reads `total` there as file bytes.
        if (ev.stage === 'chunk') {
          emit(listeners.progress, { index: ev.index, pageUrl: ev.pageUrl, stage: 'chunk', recv: ev.recv, total: ev.fileTotal });
        } else {
          emit(listeners.progress, ev);
        }
      },
    });

    const stopped = controller.signal.aborted;
    const failedResults = results.filter((r) => !r.ok && !r.stopped);
    const failedUrls = failedResults.map((r) => r.url);
    const ok = results.filter((r) => r.ok).length;
    const failed = failedUrls.length;
    const skipped = results.filter((r) => r.ok && r.skipped).length;
    let failedLog = '';
    if (failedResults.length) {
      const stamp = new Date().toISOString();
      const lines = failedResults.map((r) => `[${stamp}] ${r.url} -> ${r.error}\n`).join('');
      const logPath = io.join(outputDir, 'errors.log');
      try {
        await io.appendText(logPath, lines);
        failedLog = logPath;
      } catch { /* the log is best-effort */ }
    }
    emit(listeners.finished, { ok, failed, skipped, failedLog, total: files.length, stopped, failedUrls, albumDir });
    return { ok: true, count: ok, failed, skipped, failedLog, stopped, failedUrls, albumDir };
  } finally {
    jobs.delete(jobId);
  }
}

window.api = {
  platform: 'extension',

  previewAlbum: (url) => guard(async () => {
    const preview = await fetchAlbumPreview(url, {
      concurrency: 2,
      onProgress: (done, total) => emit(listeners.preview, { done, total }),
    });
    return { ok: true, preview };
  }),
  albumMeta: (url) => guard(async () => ({ ok: true, album: await fetchAlbumMeta(url) })),
  searchAlbums: (payload) => guard(async () => {
    const { query = '', mode, sort, per, page, host } = payload || {};
    const result = await searchAlbums(query, {
      mode,
      sort,
      per,
      page,
      host: host ?? (await store.loadSettings()).searchHost,
    });
    return { ok: true, result };
  }),
  onPreviewProgress: (cb) => subscribe(listeners.preview, cb),

  pickFolder: () => guard(pickFolder),
  analyzeLocal: (payload) => guard(() => analyzeLocal(payload)),
  downloadAlbum: (payload) => guard(() => downloadAlbum(payload)),
  stopDownload: async (jobId) => {
    if (jobId) jobs.get(jobId)?.abort();
    else for (const c of jobs.values()) c.abort();
    return { ok: true };
  },
  onDownloadProgress: (cb) => subscribe(listeners.progress, cb),
  onDownloadFinished: (cb) => subscribe(listeners.finished, cb),
  // A web page cannot open a folder in the system file manager.
  openPath: async () => ({ ok: false, error: 'Open the folder from your file manager' }),
  openAlbumFolder: async () => ({ ok: false, error: 'Open the folder from your file manager' }),

  listBookmarks: () => guard(async () => ({ ok: true, items: await store.listBookmarks() })),
  saveBookmark: (payload) => guard(() => store.saveBookmark(payload || {})),
  updateBookmark: (payload) => guard(() => {
    const { id, ...patch } = payload || {};
    if (!id) return { ok: false, error: 'id required' };
    return store.updateBookmark(id, patch);
  }),
  removeBookmark: (id) => guard(() => (id ? store.removeBookmark(id) : { ok: false, error: 'id required' })),

  getSettings: () => guard(async () => ({ ok: true, settings: await store.loadSettings() })),
  setSettings: (partial) => guard(async () => {
    const settings = await store.saveSettings(partial || {});
    applyNetworkSettings(settings);
    return { ok: true, settings };
  }),
  randomCipherToken: async (source) => ({ ok: true, token: randomCipherToken(String(source || '')) }),

  listQueue: () => guard(async () => ({ ok: true, items: await store.loadQueue() })),
  saveQueue: (items) => guard(async () => ({ ok: true, items: await store.saveQueue(items) })),

  // A tab has no native window chrome to recolor.
  setWindowTheme: async () => ({ ok: true }),
  readClipboard: () => navigator.clipboard.readText(),
};

window.discreetWords = {
  mask: (text, opts) => sensitiveWords.maskText(text, opts),
  hasMatch: (text, opts) => sensitiveWords.hasMatch(text, opts),
  categories: () => sensitiveWords.categoryInfo(),
};

store.loadSettings().then(applyNetworkSettings, () => {});

// Chrome lets a page write to a stored folder only after the user allows it, once per
// session, right after a click. Ask when a button that needs the folders is pressed.
const NEEDS_FOLDERS = '#downloadBtn, #retryFailedBtn, #queueStartBtn, #queueAddStartBtn, #skipExisting, #selectMissingBtn';
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target?.closest?.(NEEDS_FOLDERS)) return;
    Promise.all([store.loadSettings(), store.loadQueue()])
      .then(([s, queue]) => requestFolders([s.outputDir, s.queueOutputDir, ...queue.map((q) => q.outputDir)]))
      .catch(() => {});
  }, true);
}
