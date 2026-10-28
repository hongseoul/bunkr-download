const { contextBridge, ipcRenderer } = require('electron');
const sensitiveWords = require('../src/sensitive-words.cjs');

contextBridge.exposeInMainWorld('api', {
  previewAlbum: (url) => ipcRenderer.invoke('album:preview', url),
  albumMeta: (url) => ipcRenderer.invoke('album:meta', url),
  /** Album title search via the index site: { query, mode, sort, per, page, host }. */
  searchAlbums: (payload) => ipcRenderer.invoke('albums:search', payload),
  onPreviewProgress: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('preview:progress', handler);
    return () => ipcRenderer.removeListener('preview:progress', handler);
  },
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  /** Local-only folder analysis (no network). */
  analyzeLocal: (payload) => ipcRenderer.invoke('album:analyzeLocal', payload),
  downloadAlbum: (payload) => ipcRenderer.invoke('album:download', payload),
  /** Abort a running download (omit jobId to stop all). Partial files are kept for resume. */
  stopDownload: (jobId) => ipcRenderer.invoke('download:stop', jobId),
  onDownloadProgress: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },
  onDownloadFinished: (cb) => {
    const handler = (_e, data) => cb(data);
    ipcRenderer.on('download:finished', handler);
    return () => ipcRenderer.removeListener('download:finished', handler);
  },
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  /** Album folder in the file manager: { albumDir?, outputDir, albumName, nameRules }. */
  openAlbumFolder: (payload) => ipcRenderer.invoke('shell:openAlbumFolder', payload),
  listBookmarks: () => ipcRenderer.invoke('bookmarks:list'),
  saveBookmark: (payload) => ipcRenderer.invoke('bookmarks:save', payload),
  updateBookmark: (payload) => ipcRenderer.invoke('bookmarks:update', payload),
  removeBookmark: (id) => ipcRenderer.invoke('bookmarks:remove', { id }),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial) => ipcRenderer.invoke('settings:set', partial),
  randomCipherToken: (source) => ipcRenderer.invoke('cipher:random', source),
  listQueue: () => ipcRenderer.invoke('queue:list'),
  saveQueue: (items) => ipcRenderer.invoke('queue:save', items),
  platform: process.platform,
  setWindowTheme: (theme) => ipcRenderer.invoke('window:theme', theme),
  readClipboard: () => ipcRenderer.invoke('clipboard:readText'),
});

// Sensitive-word masking for Discreet view. Runs locally in the preload; nothing leaves the machine.
contextBridge.exposeInMainWorld('discreetWords', {
  /** opts: { categories, custom, style: 'swap' | 'dots' } */
  mask: (text, opts) => sensitiveWords.maskText(text, opts),
  hasMatch: (text, opts) => sensitiveWords.hasMatch(text, opts),
  categories: () => sensitiveWords.categoryInfo(),
});
