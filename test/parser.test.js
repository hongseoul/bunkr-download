import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitize,
  extractWindowAlbumFiles,
  parseHumanSize,
  normalizeBunkrThumbUrl,
  assertNotMaintenance,
  fetchWithRetries,
  mediaClient,
  isAlbumUrl,
  isMediaUrl,
} from '../src/parser.js';
import { serve } from '../test-support/helpers.js';

test('sanitize: forbidden characters, reserved names, trailing dots, length', () => {
  assert.equal(sanitize('a<b>:c"/d\\e|f?g*h'), 'a_b__c__d_e_f_g_h');
  assert.equal(sanitize('  spaced   out  '), 'spaced out');
  assert.equal(sanitize('CON'), '_CON');
  assert.equal(sanitize('nul.txt'), '_nul.txt');
  assert.equal(sanitize('com1'), '_com1');
  assert.equal(sanitize('console.log'), 'console.log');
  assert.equal(sanitize('name.'), 'name');
  assert.equal(sanitize('x'.repeat(300) + '.mp4').length, 200);
  assert.ok(sanitize('x'.repeat(300) + '.mp4').endsWith('.mp4'));
  assert.equal(sanitize(undefined), '');
});

test('URL classification', () => {
  assert.equal(isAlbumUrl('https://bunkr.si/a/AbC123'), true);
  assert.equal(isAlbumUrl('https://bunkr.si/f/AbC123'), false);
  assert.equal(isMediaUrl('https://bunkr.si/f/AbC123'), true);
  assert.equal(isMediaUrl('https://bunkr.si/a/AbC123'), false);
  assert.equal(isMediaUrl('https://cdn.example.com/x/pic.jpg'), true);
});

test('normalizeBunkrThumbUrl repairs the doubled extension', () => {
  assert.equal(
    normalizeBunkrThumbUrl('https://i.bunkr.si/thumbs/11111111-2222-3333-4444-555555555555.jpg.png'),
    'https://i.bunkr.si/thumbs/11111111-2222-3333-4444-555555555555.png'
  );
});

test('parseHumanSize', () => {
  assert.equal(parseHumanSize('1.5 MB'), Math.round(1.5 * 1024 * 1024));
  assert.equal(parseHumanSize('300 KB'), 300 * 1024);
});

test('window.albumFiles dump yields every file, de-duplicated', () => {
  const rows = [];
  for (let i = 1; i <= 150; i++) {
    rows.push(`{\n  name: "img${i}.jpg",\n  original: "Holiday ${i}.jpg",\n  slug: "slug${i}",\n  size: ${i * 1000},\n  thumbnail: "/thumbs/t${i}.png"\n}`);
  }
  rows.push(rows[0]); // duplicate
  const html = `<html><script>window.albumFiles = [\n${rows.join(',\n')}\n];</script></html>`;
  const files = extractWindowAlbumFiles(html, 'https://bunkr.si/a/abc?advanced=1');
  assert.equal(files.length, 150);
  assert.equal(files[0].pageUrl, 'https://bunkr.si/f/slug1');
  assert.equal(files[0].fileName, 'Holiday 1.jpg');
  assert.equal(files[0].sizeBytes, 1000);
  assert.equal(files[149].sizeBytes, 150000);
});

test('window.albumFiles handles quotes and braces inside strings', () => {
  const html = `<script>window.albumFiles = [\n{\n  name: "a.jpg",\n  original: "He said \\"hi\\" {ok}.jpg",\n  slug: "s1",\n  size: 5\n}\n];</script>`;
  const files = extractWindowAlbumFiles(html, 'https://bunkr.si/a/abc');
  assert.equal(files.length, 1);
  assert.equal(files[0].fileName, 'He said "hi" {ok}.jpg');
});

test('maintenance pages are recognised, big real pages are not', () => {
  assert.throws(() => assertNotMaintenance(503, '<h1>Server under maintenance</h1>'), { name: 'MaintenanceError' });
  assert.throws(() => assertNotMaintenance(200, '<p>We are under maintenance, please come back later</p>'), { maintenance: true });
  assert.doesNotThrow(() => assertNotMaintenance(200, 'x'.repeat(30000) + 'under maintenance'));
  assert.doesNotThrow(() => assertNotMaintenance(200, '<html>album</html>'));
});

test('fetchWithRetries retries 429 and 5xx, honours Retry-After, returns 404 to the caller', async () => {
  const seen = [];
  const srv = await serve((req, res) => {
    seen.push(req.url);
    const n = seen.filter((u) => u === req.url).length;
    if (req.url === '/limited') {
      if (n < 3) {
        res.writeHead(429, { 'retry-after': '0' });
        return res.end('slow down');
      }
      return res.end('ok');
    }
    if (req.url === '/flaky') {
      if (n < 2) {
        res.writeHead(502);
        return res.end('bad gateway');
      }
      return res.end('ok');
    }
    res.writeHead(404);
    res.end('missing');
  });
  try {
    const a = await fetchWithRetries(mediaClient, `${srv.base}/limited`);
    assert.equal(a.data, 'ok');
    assert.equal(seen.filter((u) => u === '/limited').length, 3);

    const b = await fetchWithRetries(mediaClient, `${srv.base}/flaky`);
    assert.equal(b.data, 'ok');

    const c = await fetchWithRetries(mediaClient, `${srv.base}/gone`);
    assert.equal(c.status, 404);
    assert.equal(seen.filter((u) => u === '/gone').length, 1, '404 is not retried');
  } finally {
    await srv.close();
  }
});

test('fetchWithRetries gives up after the retry budget', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(503, { 'retry-after': '0' });
    res.end('busy');
  });
  try {
    await assert.rejects(fetchWithRetries(mediaClient, `${srv.base}/x`, { max: 2 }), /HTTP 503/);
  } finally {
    await srv.close();
  }
});

test('fetchWithRetries surfaces Bunkr maintenance instead of retrying forever', async () => {
  let calls = 0;
  const srv = await serve((req, res) => {
    calls++;
    res.writeHead(503, { 'content-type': 'text/html' });
    res.end('<h1>Bunkr is under maintenance</h1>');
  });
  try {
    await assert.rejects(fetchWithRetries(mediaClient, `${srv.base}/x`), { maintenance: true });
    assert.equal(calls, 1);
  } finally {
    await srv.close();
  }
});
