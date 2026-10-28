/**
 * A local stand-in for Bunkr, used only to record the README screenshots and GIF.
 *
 * Serves made-up albums of generated landscapes over HTTPS on 127.0.0.1:443 for the
 * host names bunkr.demo, dl.bunkr.demo and cdn.bunkr.demo, with the same page shapes the
 * parser reads from the real site (album grid, file page, file API, signing service, CDN).
 * File bodies start with a real header (the thumbnail JPEG, or an mp4 `ftyp` box) and are
 * padded with zeros to the declared size; downloads are throttled so progress is visible.
 */

import https from 'node:https';

export const DEMO_HOST = 'bunkr.demo';
const SITE = `https://${DEMO_HOST}`;
const DL = `https://dl.${DEMO_HOST}`;
const CDN = `https://cdn.${DEMO_HOST}`;

const MB = 1024 * 1024;

/**
 * The demo albums. `rate` is bytes per second per download connection.
 * File sizes are in MB; names look like camera files so nothing hints at real content.
 */
const ALBUM_SPECS = [
  {
    id: 'mountain-trip',
    title: 'Mountain Trip 2026',
    rate: 2.2 * MB,
    files: [
      ['IMG_4101.jpg', 4.2], ['IMG_4102.jpg', 3.8], ['IMG_4103.jpg', 5.1], ['IMG_4104.jpg', 4.6],
      ['IMG_4105.jpg', 3.3], ['VID_4106.mp4', 186], ['IMG_4107.jpg', 6.2], ['IMG_4108.jpg', 4.9],
      ['IMG_4109.jpg', 3.6], ['IMG_4110.jpg', 5.4], ['VID_4111.mp4', 74], ['IMG_4112.jpg', 4.4],
      ['IMG_4113.jpg', 5.8], ['IMG_4114.jpg', 3.9], ['VID_4115.mp4', 312], ['IMG_4116.jpg', 4.7],
      ['IMG_4117.jpg', 6.6], ['IMG_4118.jpg', 3.4], ['IMG_4119.jpg', 5.2], ['VID_4120.mp4', 128],
    ],
  },
  {
    id: 'lake-weekend',
    title: 'Lake Weekend',
    rate: 4 * MB,
    files: [
      ['DSC_0201.jpg', 6.1], ['DSC_0202.jpg', 5.7], ['DSC_0203.jpg', 6.4], ['DSC_0204.jpg', 5.2],
      ['MOV_0205.mp4', 96], ['DSC_0206.jpg', 6.8], ['DSC_0207.jpg', 5.9], ['DSC_0208.jpg', 6.3],
      ['DSC_0209.jpg', 5.5], ['MOV_0210.mp4', 142], ['DSC_0211.jpg', 6.0], ['DSC_0212.jpg', 5.8],
    ],
  },
  {
    id: 'city-lights',
    title: 'City Lights',
    rate: 6 * MB,
    files: [['PXL_7001.jpg', 1.2], ['PXL_7002.jpg', 0.9], ['PXL_7003.jpg', 1.4], ['PXL_7004.jpg', 1.1]],
  },
  {
    id: 'coastal-drive',
    title: 'Coastal Drive',
    rate: 2 * MB,
    files: [
      ['IMG_0301.jpg', 3.1], ['IMG_0302.jpg', 2.8], ['IMG_0303.jpg', 3.4], ['GOPR0304.mp4', 48],
      ['IMG_0305.jpg', 2.9], ['GOPR0306.mp4', 56], ['IMG_0307.jpg', 3.2], ['GOPR0308.mp4', 61],
    ],
  },
  {
    id: 'forest-walk',
    title: 'Forest Walk',
    rate: 3 * MB,
    files: [['IMG_5501.jpg', 4.1], ['IMG_5502.jpg', 3.7], ['IMG_5503.jpg', 4.4], ['IMG_5504.jpg', 3.9], ['IMG_5505.jpg', 4.0]],
  },
  {
    id: 'northern-sky',
    title: 'Northern Sky',
    rate: 3 * MB,
    files: [['IMG_9001.jpg', 5.2], ['IMG_9002.jpg', 4.8], ['VID_9003.mp4', 88], ['IMG_9004.jpg', 5.5], ['IMG_9005.jpg', 4.9], ['IMG_9006.jpg', 5.1]],
  },
];

/** Deterministic xorshift, so every run produces the same slugs, ids and pictures. */
function rng(seed) {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

function token(rand, length, alphabet) {
  let s = '';
  for (let i = 0; i < length; i++) s += alphabet[Math.floor(rand() * alphabet.length)];
  return s;
}

function uuid(rand) {
  const h = token(rand, 32, '0123456789abcdef');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20)}`;
}

function buildAlbums() {
  const rand = rng(20261028);
  let nextId = 31_000_000;
  let sceneSeed = 1;
  return ALBUM_SPECS.map((spec) => ({
    ...spec,
    url: `${SITE}/a/${spec.id}`,
    files: spec.files.map(([name, sizeMb]) => ({
      name,
      size: Math.round(sizeMb * MB) + Math.floor(rand() * 4096),
      kind: /\.mp4$/i.test(name) ? 'video' : 'image',
      slug: token(rand, 8, 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'),
      uuid: uuid(rand),
      id: nextId++,
      seed: sceneSeed++,
    })),
  }));
}

export const ALBUMS = buildAlbums();

const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function humanSize(n) {
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GB`;
  if (n >= MB) return `${(n / MB).toFixed(2)} MB`;
  return `${(n / 1024).toFixed(2)} KB`;
}

function albumPage(album) {
  const cards = album.files.map((f) =>
    `<div class="theItem"><a href="/f/${f.slug}"><img class="grid-images_box-img" src="${CDN}/thumbs/${f.uuid}.jpg"></a>` +
    `<p class="theName">${escapeHtml(f.name)}</p><p class="theSize">${humanSize(f.size)}</p></div>`
  );
  return `<!doctype html><html><head><title>${escapeHtml(album.title)} | Bunkr</title>
<meta property="og:title" content="${escapeHtml(album.title)}">
<meta property="og:description" content="Explore this album with ${album.files.length} files">
</head><body><div class="grid-images">
${cards.join('\n')}
</div></body></html>`;
}

function filePage(f) {
  return `<!doctype html><html><head><title>${escapeHtml(f.name)} | Bunkr</title>
<meta property="og:title" content="${escapeHtml(f.name)}">
<meta property="og:image" content="${CDN}/thumbs/${f.uuid}.jpg">
</head><body>
<!-- Debug: Original=${escapeHtml(f.name)}, Size=${f.size} -->
<a class="btn" href="${DL}/file/${f.id}">Download</a>
<script>var SIGN_SERVICE_URL = '${SITE}/sign';</script>
</body></html>`;
}

/** An mp4 file type box: enough for the app's header check to accept the file. */
const MP4_HEAD = Buffer.from([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d, 0x00, 0x00, 0x02, 0x00,
  0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32, 0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
]);

/**
 * The first bytes of a demo file; the rest of the file is zeros.
 * @param {object} file  an entry of ALBUMS[n].files
 * @param {Map<string, Buffer>} thumbs  uuid → JPEG
 */
export function fileHead(file, thumbs) {
  return file.kind === 'video' ? MP4_HEAD : thumbs.get(file.uuid);
}

/** Bytes [start, end] of a demo file. */
function fileSlice(head, start, end) {
  const out = Buffer.alloc(end - start + 1);
  if (start < head.length) head.copy(out, 0, start, Math.min(head.length, end + 1));
  return out;
}

/**
 * Start the demo site.
 * @param {{ key: string, cert: string, thumbs: Map<string, Buffer> }} opts
 * @returns {Promise<{ close: () => Promise<void> }>}
 */
export function startDemoSite({ key, cert, thumbs }) {
  const bySlug = new Map();
  const byId = new Map();
  const byAlbum = new Map();
  for (const album of ALBUMS) {
    byAlbum.set(album.id, album);
    for (const f of album.files) {
      bySlug.set(f.slug, { album, file: f });
      byId.set(String(f.id), { album, file: f });
    }
  }
  const byUuid = new Map([...bySlug.values()].map((e) => [e.file.uuid, e]));

  const send = (res, status, type, body) => {
    res.writeHead(status, { 'content-type': type, 'content-length': Buffer.byteLength(body) });
    res.end(body);
  };

  const server = https.createServer({ key, cert }, (req, res) => {
    const url = new URL(req.url, SITE);
    const parts = url.pathname.split('/').filter(Boolean);

    if (parts[0] === 'a' && byAlbum.has(parts[1])) {
      return send(res, 200, 'text/html; charset=utf-8', albumPage(byAlbum.get(parts[1])));
    }
    if (parts[0] === 'f' && bySlug.has(parts[1])) {
      return send(res, 200, 'text/html; charset=utf-8', filePage(bySlug.get(parts[1]).file));
    }
    if (url.pathname === '/api/_001_v2' && req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let id = '';
        try { id = String(JSON.parse(body).id); } catch { /* answered below */ }
        const hit = byId.get(id);
        if (!hit) return send(res, 404, 'application/json', '{}');
        const ext = hit.file.name.split('.').pop();
        send(res, 200, 'application/json', JSON.stringify({
          mediafiles: CDN, path: `/files/${hit.file.slug}.${ext}`, original: hit.file.name,
        }));
      });
      return;
    }
    if (url.pathname === '/sign') {
      return send(res, 200, 'application/json', JSON.stringify({ token: 'demo', ex: '9999999999' }));
    }
    if (parts[0] === 'thumbs') {
      const hit = byUuid.get((parts[1] || '').replace(/\.jpg$/, ''));
      if (!hit) return send(res, 404, 'text/plain', 'not found');
      const jpeg = thumbs.get(hit.file.uuid);
      res.writeHead(200, { 'content-type': 'image/jpeg', 'content-length': jpeg.length, 'cache-control': 'max-age=3600' });
      return res.end(jpeg);
    }
    if (parts[0] === 'files') {
      const hit = bySlug.get((parts[1] || '').replace(/\.[^.]+$/, ''));
      if (!hit) return send(res, 404, 'text/plain', 'not found');
      return streamFile(req, res, hit.file, hit.album.rate, fileHead(hit.file, thumbs));
    }
    send(res, 404, 'text/plain', 'not found');
  });

  return new Promise((resolve, reject) => {
    server.once('error', (e) => reject(e.code === 'EADDRINUSE'
      ? new Error('Port 443 is busy. Close the program that uses it (a local web server, Skype, VMware…) and try again.')
      : e));
    server.listen(443, '127.0.0.1', () => resolve({
      close: () => {
        server.closeAllConnections();
        return new Promise((r) => server.close(() => r()));
      },
    }));
  });
}

/** Send a demo file (or the requested range of it) at `rate` bytes per second. */
function streamFile(req, res, file, rate, head) {
  let start = 0;
  let end = file.size - 1;
  const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    start = Number(range[1]);
    if (range[2]) end = Math.min(end, Number(range[2]));
    if (start > end) {
      res.writeHead(416, { 'content-range': `bytes */${file.size}` });
      return res.end();
    }
  }
  const headers = {
    'content-type': file.kind === 'video' ? 'video/mp4' : 'image/jpeg',
    'content-length': end - start + 1,
    'accept-ranges': 'bytes',
  };
  if (range) headers['content-range'] = `bytes ${start}-${end}/${file.size}`;
  res.writeHead(range ? 206 : 200, headers);
  if (req.method === 'HEAD') return res.end();

  // Pace by wall-clock time, not by timer delays: the recorder blocks this process while it
  // grabs frames, and the bytes owed for that time are sent on the next tick.
  const MAX_CHUNK = 512 * 1024;
  const began = Date.now();
  let pos = start;
  let closed = false;
  res.on('close', () => { closed = true; });
  const pump = () => {
    if (closed) return;
    if (pos > end) return res.end();
    const owed = Math.floor(((Date.now() - began) / 1000) * rate) - (pos - start);
    if (owed <= 0) return setTimeout(pump, 20);
    const last = Math.min(end, pos + Math.min(owed, MAX_CHUNK) - 1);
    const ok = res.write(fileSlice(head, pos, last));
    pos = last + 1;
    if (ok) setTimeout(pump, 20);
    else res.once('drain', pump);
  };
  pump();
}
