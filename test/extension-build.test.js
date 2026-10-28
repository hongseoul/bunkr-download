import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { buildExtension } from '../scripts/build-extension.mjs';
import { serve, tmpDir, rmDir } from '../test-support/helpers.js';

// The UI calls exactly these (electron/preload.cjs); the extension must offer all of them.
const API_METHODS = [
  'previewAlbum', 'albumMeta', 'searchAlbums', 'onPreviewProgress', 'pickFolder', 'analyzeLocal',
  'downloadAlbum', 'stopDownload', 'onDownloadProgress', 'onDownloadFinished', 'openPath',
  'openAlbumFolder', 'listBookmarks', 'saveBookmark', 'updateBookmark', 'removeBookmark', 'getSettings', 'setSettings',
  'randomCipherToken', 'listQueue', 'saveQueue', 'setWindowTheme', 'readClipboard',
];

/** In-memory chrome.storage.local. */
function fakeChrome() {
  const data = new Map();
  return {
    runtime: { id: 'testextensionid' },
    storage: {
      local: {
        async get(key) {
          return data.has(key) ? { [key]: structuredClone(data.get(key)) } : {};
        },
        async set(obj) {
          for (const [k, v] of Object.entries(obj)) data.set(k, structuredClone(v));
        },
      },
    },
  };
}

/** Run the bundled api.js the way an extension page would (no Node globals). */
function loadBundle(code) {
  const pass = [
    'console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'queueMicrotask',
    'URL', 'URLSearchParams', 'TextEncoder', 'TextDecoder', 'fetch', 'Request', 'Response', 'Headers',
    'FormData', 'Blob', 'ReadableStream', 'WritableStream', 'TransformStream', 'AbortController',
    'AbortSignal', 'crypto', 'structuredClone', 'atob', 'btoa', 'EventTarget', 'Event', 'DOMException',
    'performance',
  ];
  const ctx = {};
  for (const k of pass) ctx[k] = globalThis[k];
  ctx.chrome = fakeChrome();
  ctx.navigator = { clipboard: { readText: async () => 'https://bunkr.cr/a/x' } };
  ctx.window = ctx;
  ctx.self = ctx;
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: 'api.js' });
  return ctx;
}

let outDir;
let built;

test('extension builds: manifest, app.html and a browser-only bundle', async () => {
  outDir = tmpDir();
  built = await buildExtension({ outDir });

  for (const f of ['manifest.json', 'background.js', 'app.html', 'app.js', 'app.css', 'theme-boot.js', 'api.js']) {
    assert.ok(fs.existsSync(path.join(built, f)), `${f} is missing`);
  }

  const manifest = JSON.parse(fs.readFileSync(path.join(built, 'manifest.json'), 'utf8'));
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, pkg.version);
  assert.deepEqual(manifest.host_permissions, ['https://*/*']);

  const html = fs.readFileSync(path.join(built, 'app.html'), 'utf8');
  assert.match(html, /connect-src 'self' https:/);
  assert.match(html, /script-src 'self'/, 'no inline scripts may be allowed');
  const apiAt = html.indexOf('<script src="api.js">');
  const appAt = html.indexOf('<script src="app.js">');
  assert.ok(apiAt > 0 && apiAt < appAt, 'api.js must load before app.js');

  const bundle = fs.readFileSync(path.join(built, 'api.js'), 'utf8');
  assert.doesNotMatch(bundle, /require\(["']node:/);
  assert.doesNotMatch(bundle, /from ["']node:/);

  // Chrome loads any folder with a manifest.json; the source folder has no app.html and
  // would open "file not found", so only the build output may carry one.
  assert.equal(fs.existsSync(path.join('extension', 'manifest.json')), false);
});

test('bundle runs without Node globals and exposes the whole UI contract', async () => {
  const ctx = loadBundle(fs.readFileSync(path.join(built, 'api.js'), 'utf8'));
  try {
    for (const m of API_METHODS) assert.equal(typeof ctx.window.api[m], 'function', `window.api.${m}`);
    assert.equal(ctx.window.api.platform, 'extension');
    assert.equal(typeof ctx.window.discreetWords.mask, 'function');
    assert.ok(ctx.window.discreetWords.categories().length > 0);

    const s = await ctx.window.api.getSettings();
    assert.equal(s.ok, true);
    assert.equal(s.settings.diskCheck, false, 'free-space check is desktop-only');

    const saved = await ctx.window.api.setSettings({ proxy: 'socks5://127.0.0.1:1', concurrency: 6 });
    assert.equal(saved.ok, true);
    assert.equal(saved.settings.proxy, '', 'proxy is desktop-only');
    assert.equal((await ctx.window.api.getSettings()).settings.concurrency, 6);

    const bm = await ctx.window.api.saveBookmark({ url: 'https://bunkr.cr/a/abc', note: 'later' });
    assert.equal(bm.ok, true);
    const list = await ctx.window.api.listBookmarks();
    // Array.from: objects from the bundle's realm have their own Array prototype.
    assert.deepEqual(Array.from(list.items, (b) => b.title), ['abc']);

    const q = await ctx.window.api.saveQueue([{ url: 'https://bunkr.cr/a/q1' }]);
    assert.equal(q.items.length, 1);
    assert.equal((await ctx.window.api.listQueue()).items[0].url, 'https://bunkr.cr/a/q1');

    assert.equal((await ctx.window.api.albumMeta('https://example.com/x')).ok, false);
    assert.equal(await ctx.window.api.readClipboard(), 'https://bunkr.cr/a/x');
  } finally {
    rmDir(outDir);
  }
});

test('bundled network stack (axios + cheerio browser builds) performs a real search', async () => {
  const srv = await serve((req, res) => {
    const u = new URL(req.url, 'http://x');
    assert.equal(u.searchParams.get('search'), 'trip');
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(
      '<html><body><form><input name="search"></form><p>page 1 of 3</p>' +
      '<a class="card" href="https://bunkr.cr/a/abc"><img src="/t.jpg"><h3>Trip</h3><span>12 files</span></a>' +
      '</body></html>'
    );
  });
  const dir = tmpDir();
  try {
    const ctx = loadBundle(fs.readFileSync(path.join(await buildExtension({ outDir: dir }), 'api.js'), 'utf8'));
    const r = await ctx.window.api.searchAlbums({ query: 'trip', host: srv.base });
    assert.equal(r.ok, true, r.error);
    assert.equal(r.result.totalPages, 3);
    assert.equal(r.result.results.length, 1);
    assert.equal(r.result.results[0].url, 'https://bunkr.cr/a/abc');
    assert.equal(r.result.results[0].title, 'Trip');
    assert.equal(r.result.results[0].fileCount, 12);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});
