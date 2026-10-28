import { app, BrowserWindow, ipcMain, dialog, shell, clipboard } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';

import { fetchAlbumPreview, fetchAlbumMeta } from '../src/parser.js';
import { runDownload } from '../src/downloader.js';
import { analyzeAlbumFiles, albumOutputPath, findAlbumFolder } from '../src/local-index.js';
import { setNetworkOptions } from '../src/net.js';
import { checkDiskSpace } from '../src/disk.js';
import { randomCipherToken } from '../src/name-cipher.js';
import { searchAlbums } from '../src/search.js';
import * as store from './store.js';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
let mainWindow = null;

// Window chrome colors per UI theme (keep in sync with --bg / --text-2 in ui/app.css).
const THEME_CHROME = {
  acid: { bg: '#0B0B0C', symbol: '#8A8A92' },
  lavender: { bg: '#0F151E', symbol: '#D9D8DC' },
};
const TITLEBAR_HEIGHT = 52;

function chromeFor(theme) {
  return THEME_CHROME[theme] || THEME_CHROME.acid;
}

function createWindow() {
  const chrome = chromeFor(store.loadSettings().theme);
  const isMac = process.platform === 'darwin';
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 760,
    minHeight: 520,
    backgroundColor: chrome.bg,
    title: 'bunkr-download',
    titleBarStyle: 'hidden',
    ...(isMac
      ? { trafficLightPosition: { x: 18, y: 18 } }
      : { titleBarOverlay: { color: chrome.bg, symbolColor: chrome.symbol, height: TITLEBAR_HEIGHT } }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
  return mainWindow;
}

app.whenReady().then(() => {
  try {
    applyNetworkSettings(store.loadSettings());
  } catch (e) {
    console.error('Ignoring invalid network settings: ' + e.message);
  }
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC ----------

// Album listing only (no per-file page fetches). Used by the download queue.
ipcMain.handle('album:meta', async (_event, albumUrl) => {
  try {
    const album = await fetchAlbumMeta(albumUrl);
    return { ok: true, album };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Preview: fetch album meta + thumbnails per file, streaming progress to renderer
ipcMain.handle('album:preview', async (event, albumUrl) => {
  try {
    const preview = await fetchAlbumPreview(albumUrl, {
      concurrency: 2,
      onProgress: (done, total) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('preview:progress', { done, total });
        }
      },
    });
    return { ok: true, preview };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Album search on the index site (balbums.st by default). Only the query goes out.
ipcMain.handle('albums:search', async (_event, payload) => {
  try {
    const { query = '', mode, sort, per, page, host } = payload || {};
    const result = await searchAlbums(query, {
      mode,
      sort,
      per,
      page,
      host: host ?? store.loadSettings().searchHost,
    });
    return { ok: true, result };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Pick a download folder
ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select download folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
  return { ok: true, path: result.filePaths[0] };
});

// Local-only scan of the album output folder (privacy: never leaves the machine).
// payload: { outputDir, albumName, files: [{ pageUrl, fileName, sizeBytes }], nameRules }
ipcMain.handle('album:analyzeLocal', async (_event, payload) => {
  try {
    const { outputDir, albumName, files = [], nameRules = [] } = payload || {};
    if (!outputDir) return { ok: false, error: 'No output directory' };
    const albumDir = albumOutputPath(outputDir, albumName || 'Direct', nameRules);
    const analysis = await analyzeAlbumFiles(albumDir, files, { checkMagic: true, nameRules });
    const counts = { complete: 0, incomplete: 0, size_mismatch: 0, corrupt: 0, missing: 0 };
    for (const r of analysis.results) {
      if (counts[r.status] !== undefined) counts[r.status]++;
      else counts.missing++;
    }
    return { ok: true, ...analysis, counts };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Running downloads, so the renderer can stop them. Stopping keeps .part files for a later resume.
const jobs = new Map();

function fmtBytes(n) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n || 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Apply proxy and speed limit from saved settings. Throws on an invalid proxy URL. */
function applyNetworkSettings(settings) {
  setNetworkOptions({
    proxy: settings.proxy || '',
    limitRate: Math.round((Number(settings.limitRateMBps) || 0) * 1024 * 1024),
  });
}

// Download: takes {jobId, albumUrl, albumName, outputDir, selectedFiles, concurrency, skipExisting, redownloadMismatch, nameRules, fileMeta}
ipcMain.handle('album:download', async (event, payload) => {
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
  } = payload;
  if (!Array.isArray(selectedFiles) || selectedFiles.length === 0) {
    return { ok: false, error: 'No files selected' };
  }
  const controller = new AbortController();
  jobs.set(jobId, controller);
  try {
    const settings = store.loadSettings();
    applyNetworkSettings(settings);

    fs.mkdirSync(outputDir, { recursive: true });
    const albumDir = albumOutputPath(outputDir, albumName || 'Direct', nameRules);
    fs.mkdirSync(albumDir, { recursive: true });

    const files = selectedFiles.map((pageUrl) => ({
      pageUrl,
      fileName: fileMeta[pageUrl]?.fileName || '',
      sizeBytes: fileMeta[pageUrl]?.sizeBytes || 0,
    }));

    if (settings.diskCheck) {
      const needed = files.reduce((n, f) => n + f.sizeBytes, 0);
      const disk = await checkDiskSpace(outputDir, needed);
      if (!disk.ok) {
        return {
          ok: false,
          diskLow: true,
          error: `Not enough free disk space: need ${fmtBytes(needed)}, free ${fmtBytes(disk.free)}`,
        };
      }
    }

    const send = (channel, data) => {
      if (!event.sender.isDestroyed()) event.sender.send(channel, data);
    };

    const results = await runDownload({
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
        // Chunk events carry byte counts only; the renderer reads `total` there as file bytes.
        if (ev.stage === 'chunk') {
          send('download:progress', { index: ev.index, pageUrl: ev.pageUrl, stage: 'chunk', recv: ev.recv, total: ev.fileTotal });
        } else {
          send('download:progress', ev);
        }
      },
    });

    const stopped = controller.signal.aborted;
    const failedResults = results.filter((r) => !r.ok && !r.stopped);
    const failedUrls = failedResults.map((r) => r.url);
    const ok = results.filter((r) => r.ok).length;
    const failed = failedUrls.length;
    const skipped = results.filter((r) => r.ok && r.skipped).length;
    const failedLog = path.join(outputDir, 'errors.log');
    const stamp = new Date().toISOString();
    const failedLines = failedResults.map((r) => `[${stamp}] ${r.url} -> ${r.error}`).join('\n');
    if (failedLines) {
      try { fs.appendFileSync(failedLog, failedLines + '\n', 'utf8'); } catch { /* log is best-effort */ }
    }
    send('download:finished', { ok, failed, skipped, failedLog, total: files.length, stopped, failedUrls, albumDir });
    return { ok: true, count: ok, failed, skipped, failedLog, stopped, failedUrls, albumDir };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    jobs.delete(jobId);
  }
});

ipcMain.handle('download:stop', async (_event, jobId) => {
  if (jobId) {
    jobs.get(jobId)?.abort();
  } else {
    for (const c of jobs.values()) c.abort();
  }
  return { ok: true };
});

ipcMain.handle('bookmarks:list', async () => {
  try {
    return { ok: true, items: store.listBookmarks() };
  } catch (e) {
    return { ok: false, error: e.message, items: [] };
  }
});

ipcMain.handle('bookmarks:save', async (_event, payload) => {
  try {
    return store.saveBookmark(payload || {});
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('bookmarks:update', async (_event, payload) => {
  try {
    const { id, ...patch } = payload || {};
    if (!id) return { ok: false, error: 'id required' };
    return store.updateBookmark(id, patch);
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('bookmarks:remove', async (_event, payload) => {
  try {
    const id = payload && payload.id;
    if (!id) return { ok: false, error: 'id required' };
    return store.removeBookmark(id);
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('settings:get', async () => {
  try {
    return { ok: true, settings: store.loadSettings() };
  } catch (e) {
    return { ok: false, error: e.message, settings: store.loadSettings() };
  }
});

ipcMain.handle('settings:set', async (_event, partial) => {
  try {
    // Validate (e.g. proxy URL) before anything is written to disk.
    applyNetworkSettings({ ...store.loadSettings(), ...(partial || {}) });
    const settings = store.saveSettings(partial || {});
    return { ok: true, settings };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('cipher:random', async (_event, source) => {
  return { ok: true, token: randomCipherToken(String(source || '')) };
});

ipcMain.handle('queue:list', async () => {
  try {
    return { ok: true, items: store.loadQueue() };
  } catch (e) {
    return { ok: false, error: e.message, items: [] };
  }
});

ipcMain.handle('queue:save', async (_event, items) => {
  try {
    return { ok: true, items: store.saveQueue(items) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Recolor native window chrome when the UI theme changes.
ipcMain.handle('window:theme', async (event, theme) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return { ok: false };
  const chrome = chromeFor(theme);
  win.setBackgroundColor(chrome.bg);
  if (process.platform !== 'darwin' && typeof win.setTitleBarOverlay === 'function') {
    try {
      win.setTitleBarOverlay({ color: chrome.bg, symbolColor: chrome.symbol, height: TITLEBAR_HEIGHT });
    } catch { /* cosmetic only; some platforms reject the overlay update */ }
  }
  return { ok: true };
});

ipcMain.handle('clipboard:readText', async () => clipboard.readText());

// Open file/folder in OS explorer
ipcMain.handle('shell:openPath', async (event, p) => {
  try {
    if (fs.statSync(p).isDirectory()) {
      // openPath resolves to an error message instead of throwing.
      const err = await shell.openPath(p);
      if (err) return { ok: false, error: err };
    } else {
      shell.showItemInFolder(p);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// Open an album's folder in the OS file manager; falls back to the download folder
// when the album folder does not exist yet. payload: { albumDir?, outputDir, albumName, nameRules }
ipcMain.handle('shell:openAlbumFolder', async (_event, payload) => {
  try {
    const found = await findAlbumFolder(payload || {});
    if (!found) return { ok: false, error: 'The download folder does not exist' };
    const err = await shell.openPath(found.path);
    if (err) return { ok: false, error: err };
    return { ok: true, ...found };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});