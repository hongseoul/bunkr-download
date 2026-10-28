/**
 * Record the README media from the real desktop app: `npm run readme-media`.
 *
 * Runs the Electron app against a local fake Bunkr (scripts/readme-media/demo-site.mjs) with
 * generated landscapes, drives the UI with a drawn pointer and writes into assets/:
 *   demo.gif        paste a link → preview → select → download
 *   check-disk.png  Check disk badges on a half-downloaded album
 *   queue.png       several albums in the download queue
 *   discreet.png    Discreet view with animal previews
 *
 * Needs ffmpeg on PATH and openssl (Git for Windows ships one), and port 443 free.
 * Nothing reaches the real Bunkr: bunkr.demo resolves to 127.0.0.1 inside this run only.
 * Downloads go to C:\Users\Public\Downloads\bunkr-demo (a folder name without the user
 * name, since it shows in the pictures), which is deleted at the end.
 * The app window appears for about a minute; don't click in it while it records.
 */

import { app, BrowserWindow, session } from 'electron';
import { spawnSync } from 'node:child_process';
import dns from 'node:dns';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import tls from 'node:tls';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ALBUMS, DEMO_HOST, fileHead, startDemoSite } from './demo-site.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');
const assets = path.join(root, 'assets');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'bunkr-readme-media-'));
// The download folder is visible in the pictures: keep the user name out of it.
const outDir = process.platform === 'win32'
  ? 'C:\\Users\\Public\\Downloads\\bunkr-demo'
  : path.join(os.tmpdir(), 'bunkr-demo');

const WIDTH = 1280;
const HEIGHT = 800;
const FRAME_MS = 1000 / 12;
const GIF_WIDTH = 960;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[readme-media]', ...a);
const isDemoHost = (host) => host === DEMO_HOST || String(host).endsWith('.' + DEMO_HOST);

// ---------- before the app is ready ----------

app.setPath('userData', path.join(work, 'userData'));
app.commandLine.appendSwitch('host-resolver-rules', `MAP ${DEMO_HOST} 127.0.0.1, MAP *.${DEMO_HOST} 127.0.0.1`);
app.commandLine.appendSwitch('force-device-scale-factor', '1');
// Keep painting at full speed even when another window covers the app.
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
// The thumbnail generator window closes before the app opens its own; don't quit then.
app.on('window-all-closed', () => {});

// The app's downloader runs in Node: send bunkr.demo to the local demo site there too.
const realLookup = dns.lookup;
dns.lookup = function (host, options, callback) {
  if (typeof options === 'function') { callback = options; options = {}; }
  if (isDemoHost(host)) {
    const all = typeof options === 'object' && options.all;
    return process.nextTick(() => (all ? callback(null, [{ address: '127.0.0.1', family: 4 }]) : callback(null, '127.0.0.1', 4)));
  }
  return realLookup.call(this, host, options, callback);
};

// ---------- helpers ----------

function makeCertificate() {
  const key = path.join(work, 'key.pem');
  const cert = path.join(work, 'cert.pem');
  const args = [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '2',
    '-subj', `/CN=${DEMO_HOST}`, '-addext', `subjectAltName=DNS:${DEMO_HOST},DNS:dl.${DEMO_HOST},DNS:cdn.${DEMO_HOST}`,
  ];
  const candidates = [
    'openssl',
    'C:\\Program Files\\Git\\usr\\bin\\openssl.exe',
    'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
  ];
  for (const bin of candidates) {
    if (spawnSync(bin, args, { stdio: 'ignore' }).status === 0) {
      return { key: fs.readFileSync(key, 'utf8'), cert: fs.readFileSync(cert, 'utf8') };
    }
  }
  throw new Error('openssl not found. Install Git for Windows (it includes openssl) or put openssl on PATH.');
}

/** Trust the demo certificate for bunkr.demo only (Chromium) and in Node's default CA list. */
function trustCertificate(certPem) {
  session.defaultSession.setCertificateVerifyProc((req, done) => done(isDemoHost(req.hostname) ? 0 : -3));
  if (typeof tls.setDefaultCACertificates === 'function') {
    tls.setDefaultCACertificates([...tls.getCACertificates('default'), certPem]);
  } else {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

async function makeThumbnails() {
  const gen = new BrowserWindow({ show: false, width: 500, height: 400 });
  await gen.loadURL('data:text/html,<!doctype html><title>scenery</title>');
  await gen.webContents.executeJavaScript(fs.readFileSync(path.join(here, 'scenery.js'), 'utf8'));
  const thumbs = new Map();
  for (const album of ALBUMS) {
    for (const f of album.files) {
      const dataUrl = await gen.webContents.executeJavaScript(`drawScenery(${f.seed}, 480, 360)`);
      thumbs.set(f.uuid, Buffer.from(dataUrl.split(',')[1], 'base64'));
    }
  }
  gen.destroy();
  return thumbs;
}

function writeSettings() {
  const dir = app.getPath('userData');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'settings.json'), JSON.stringify({
    outputDir: outDir,
    queueOutputDir: outDir,
    discreetThumbs: 'animals',
  }));
}

/**
 * Leave "Lake Weekend" half downloaded so Check disk has something to report:
 * five complete files, one size mismatch, one error page saved as a photo, one empty file.
 */
async function stageCheckDisk(thumbs) {
  const { albumOutputPath } = await import(pathToFileURL(path.join(root, 'src', 'local-index.js')).href);
  const album = ALBUMS.find((a) => a.id === 'lake-weekend');
  const dir = albumOutputPath(outDir, album.title, []);
  fs.mkdirSync(dir, { recursive: true });
  const write = (i, bytes) => fs.writeFileSync(path.join(dir, album.files[i].name), bytes);
  const full = (f) => {
    const buf = Buffer.alloc(f.size);
    fileHead(f, thumbs).copy(buf);
    return buf;
  };
  for (const i of [0, 1, 2, 3, 7]) write(i, full(album.files[i]));
  write(5, full(album.files[5]).subarray(0, Math.floor(album.files[5].size / 2)));
  const errorPage = Buffer.alloc(album.files[6].size, 0x20);
  Buffer.from('<!doctype html><title>502 Bad Gateway</title>').copy(errorPage);
  write(6, errorPage);
  write(8, Buffer.alloc(0));
}

function openApp() {
  return new Promise((resolve, reject) => {
    app.once('browser-window-created', (_e, win) => {
      win.webContents.once('did-finish-load', () => resolve(win));
      win.webContents.once('did-fail-load', (_ev, code, desc) => reject(new Error(`app page failed to load: ${desc}`)));
    });
    import(pathToFileURL(path.join(root, 'electron', 'main.js')).href).catch(reject);
  });
}

function recorder(win) {
  const js = (code) => win.webContents.executeJavaScript(code, true);

  async function waitFor(expr, { timeout = 30000, what = expr } = {}) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await js(`!!(${expr})`)) return;
      await sleep(100);
    }
    throw new Error(`timed out waiting for: ${what}`);
  }

  const gridReady = (n) => `(() => {
    const imgs = [...document.querySelectorAll('#grid .card .thumb img')];
    return document.querySelectorAll('#grid .card').length === ${n}
      && imgs.length === ${n} && imgs.every((i) => i.complete && i.naturalWidth > 0);
  })()`;

  async function loadAlbum(album) {
    await js(`(() => {
      const input = document.querySelector('#albumUrl');
      input.value = ${JSON.stringify(album.url)};
      input.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('#loadBtn').click();
    })()`);
    await waitFor(gridReady(album.files.length), { what: `${album.title} preview` });
    await sleep(500);
  }

  async function screenshot(name) {
    await js(`(() => {
      demo.hide();
      document.activeElement?.blur();
      document.querySelector('#toasts').replaceChildren();
    })()`);
    await sleep(300);
    const file = path.join(assets, name);
    fs.writeFileSync(file, (await win.webContents.capturePage()).toPNG());
    log('wrote', path.relative(root, file));
  }

  /** Capture frames while `action` runs; returns [{ t, png }]. */
  async function record(action) {
    const frames = [];
    let on = true;
    const t0 = Date.now();
    const loop = (async () => {
      while (on) {
        const started = Date.now();
        const img = await win.webContents.capturePage();
        frames.push({ t: started - t0, png: img.toPNG() });
        await sleep(Math.max(0, FRAME_MS - (Date.now() - started)));
      }
    })();
    try {
      await action();
    } finally {
      on = false;
      await loop;
    }
    return frames;
  }

  return { js, waitFor, gridReady, loadAlbum, screenshot, record };
}

function writeGif(frames, name) {
  const dir = path.join(work, 'frames');
  fs.mkdirSync(dir, { recursive: true });
  const lines = [];
  frames.forEach((f, i) => {
    const file = path.join(dir, `f${String(i).padStart(4, '0')}.png`).replace(/\\/g, '/');
    fs.writeFileSync(file, f.png);
    const next = frames[i + 1];
    lines.push(`file '${file}'`, `duration ${next ? ((next.t - f.t) / 1000).toFixed(3) : '1.500'}`);
    if (!next) lines.push(`file '${file}'`);
  });
  const list = path.join(dir, 'frames.txt');
  fs.writeFileSync(list, lines.join('\n'));
  const out = path.join(assets, name);
  const filter = `fps=12,scale=${GIF_WIDTH}:-2:flags=lanczos,split[a][b];` +
    '[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle';
  const r = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-vf', filter, '-loop', '0', out], { stdio: 'inherit' });
  if (r.error) throw new Error('ffmpeg not found. Install it and put it on PATH.');
  if (r.status !== 0) throw new Error(`ffmpeg failed (exit ${r.status})`);
  fs.rmSync(dir, { recursive: true, force: true });
  log('wrote', path.relative(root, out), `(${(fs.statSync(out).size / 1024 / 1024).toFixed(1)} MB, ${frames.length} frames)`);
}

// ---------- scenes ----------

/** Starts on the start screen: type a link, load, pick files, download. */
async function heroScene(r) {
  const album = ALBUMS.find((a) => a.id === 'mountain-trip');
  const card = (i) => `document.querySelectorAll('#grid .card')[${i}]`;
  const frames = await r.record(async () => {
    await sleep(600);
    await r.js(`demo.moveTo('#albumUrl', { dx: -120 })`);
    await r.js(`demo.type('#albumUrl', ${JSON.stringify(album.url)})`);
    await sleep(200);
    await r.js(`demo.click('#loadBtn', { after: 80 })`);
    await r.waitFor(r.gridReady(album.files.length), { what: 'hero album preview' });
    await sleep(700);
    // Every file starts selected: clear the selection, then pick some.
    await r.js(`demo.click('label.select-all', { after: 350 })`);
    for (const i of [0, 2]) await r.js(`demo.click(${card(i)}, { ms: 420, after: 160 })`);
    await r.js(`demo.click(${card(4)}, { ms: 420, after: 200 })`);
    await r.js(`demo.click(${card(9)}, { shift: true, ms: 480, after: 450 })`);
    await r.js(`demo.click('#downloadBtn', { after: 60 })`);
    await sleep(5000);
  });
  writeGif(frames, 'demo.gif');
  await r.js(`document.querySelector('#stopBtn').click()`);
  await sleep(1500);
}

async function checkDiskScene(r) {
  const album = ALBUMS.find((a) => a.id === 'lake-weekend');
  await r.loadAlbum(album);
  await r.js(`document.querySelector('#skipExisting').click()`);
  await r.waitFor(`document.querySelectorAll('#grid .card.local-complete, #grid .card.local-broken').length >= 8`, { what: 'Check disk badges' });
  await sleep(600);
  await r.screenshot('check-disk.png');
  await r.js(`document.querySelector('#skipExisting').click()`);
}

async function queueScene(r) {
  const urls = ['city-lights', 'coastal-drive', 'forest-walk', 'northern-sky'].map((id) => ALBUMS.find((a) => a.id === id).url);
  await r.js(`document.querySelector('#queueBtn').click()`);
  await r.js(`(() => {
    const box = document.querySelector('#queueUrls');
    box.value = ${JSON.stringify(urls.join('\n'))};
    box.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('#queueAddStartBtn').click();
  })()`);
  await r.waitFor(`document.querySelectorAll('.q-status.done').length >= 1 && document.querySelectorAll('.q-status.downloading').length === 1`,
    { timeout: 60000, what: 'first queued album finished, second downloading' });
  await sleep(4500);
  await r.js(`document.querySelector('#queueList').scrollIntoView({ block: 'end' })`);
  await r.screenshot('queue.png');
  await r.js(`document.querySelector('#stopBtn').click()`);
  await r.waitFor(`document.querySelectorAll('.q-status.downloading, .q-status.loading').length === 0`, { what: 'queue stopped' });
  await r.js(`document.querySelector('#navAlbum').click()`);
}

async function discreetScene(r) {
  const album = ALBUMS.find((a) => a.id === 'mountain-trip');
  await r.loadAlbum(album);
  await r.js(`(() => {
    const cards = document.querySelectorAll('#grid .card');
    for (const c of cards) if (c.classList.contains('selected')) c.click();
    for (const i of [0, 2, 5, 6, 9]) cards[i].click();
  })()`);
  await r.js(`document.querySelector('#discreetBtn').click()`);
  await sleep(1200);
  await r.screenshot('discreet.png');
  await r.js(`document.querySelector('#discreetBtn').click()`);
  // Back to the start screen for the GIF.
  await r.js(`document.querySelector('#resetBtn').click()`);
  await sleep(500);
}

// ---------- main ----------

async function main() {
  if (fs.existsSync(outDir)) throw new Error(`${outDir} already exists; move it away first (this script deletes it when done).`);
  fs.mkdirSync(outDir, { recursive: true });
  ownsOutDir = true;
  await app.whenReady();
  const { key, cert } = makeCertificate();
  trustCertificate(cert);
  log('drawing demo pictures…');
  const thumbs = await makeThumbnails();
  const site = await startDemoSite({ key, cert, thumbs });
  writeSettings();
  await stageCheckDisk(thumbs);

  const win = await openApp();
  win.setContentSize(WIDTH, HEIGHT);
  win.center();
  await sleep(800);
  await win.webContents.executeJavaScript(fs.readFileSync(path.join(here, 'cursor.js'), 'utf8'));
  await win.webContents.executeJavaScript(`document.querySelector('[data-density="compact"]').click()`);
  fs.mkdirSync(assets, { recursive: true });

  // Screenshots without downloads come first, so the dock shows no earlier progress.
  const r = recorder(win);
  log('check disk…');
  await checkDiskScene(r);
  log('discreet view…');
  await discreetScene(r);
  log('recording demo.gif…');
  await heroScene(r);
  log('queue…');
  await queueScene(r);

  await site.close();
}

let ownsOutDir = false;

function finish(code) {
  if (ownsOutDir) fs.rmSync(outDir, { recursive: true, force: true });
  app.exit(code);
}

const watchdog = setTimeout(() => {
  console.error('[readme-media] gave up after 4 minutes');
  finish(1);
}, 4 * 60 * 1000);

main().then(
  () => {
    clearTimeout(watchdog);
    log('done');
    finish(0);
  },
  (e) => {
    console.error('[readme-media]', e.stack || e.message);
    finish(1);
  },
);
