import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFsIo, joinPath, basename, extname } from '../extension/src/fs-io.js';
import { runDownloadWith } from '../src/run-core.js';
import { FakeDir, fakePartials } from '../test-support/fake-fs-access.js';
import { serve, bytes } from '../test-support/helpers.js';

/** A picked folder labelled "Media" holding everything the test writes. */
function setup() {
  const root = new FakeDir('Media');
  const partials = fakePartials();
  const io = createFsIo({
    getRoot: async (label) => {
      if (label !== 'Media') throw new Error(`unknown folder ${label}`);
      return root;
    },
    partials,
  });
  return { root, partials, io };
}

test('path helpers behave like path.posix for album paths', () => {
  assert.equal(joinPath('Media', 'Album/', '/a.jpg'), 'Media/Album/a.jpg');
  assert.equal(basename('Media/Album/a.jpg'), 'a.jpg');
  assert.equal(extname('Media/Album/a.JPG'), '.JPG');
  assert.equal(extname('Media/.hidden'), '');
});

test('403 response is an error and never saved as a file', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(403, { 'content-type': 'text/html' });
    res.end('<html>Forbidden</html>');
  });
  const { root, io } = setup();
  try {
    await assert.rejects(io.downloadFile({ url: `${srv.base}/a.jpg`, dest: 'Media/Album/a.jpg', maxRetries: 0 }));
    assert.equal(root.read('Album/a.jpg'), null);
  } finally {
    await srv.close();
  }
});

test('429 with Retry-After is retried and then succeeds', async () => {
  let calls = 0;
  const body = Buffer.alloc(4096, 7);
  const srv = await serve((req, res) => {
    calls++;
    if (calls === 1) {
      res.writeHead(429, { 'retry-after': '0' });
      return res.end('slow down');
    }
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  const { root, partials, io } = setup();
  try {
    await io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', maxRetries: 2, retryBaseMs: 10 });
    assert.equal(calls, 2);
    assert.deepEqual(root.read('Album/a.bin'), body);
    assert.equal(partials.raw.size, 0, 'a finished file leaves the partials registry');
  } finally {
    await srv.close();
  }
});

test('truncated body is detected and resumed via Range', async () => {
  const body = Buffer.from(Array.from({ length: 10000 }, (_, i) => i % 251));
  const ranges = [];
  const srv = await serve((req, res) => {
    const range = /bytes=(\d+)-/.exec(req.headers.range || '');
    ranges.push(range ? Number(range[1]) : null);
    if (!range) {
      res.writeHead(200, { 'content-length': body.length, 'accept-ranges': 'bytes' });
      res.write(body.subarray(0, 4000));
      setTimeout(() => res.destroy(), 20);
      return;
    }
    const start = Number(range[1]);
    res.writeHead(206, {
      'content-length': body.length - start,
      'content-range': `bytes ${start}-${body.length - 1}/${body.length}`,
    });
    res.end(body.subarray(start));
  });
  const { root, io } = setup();
  try {
    await io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', maxRetries: 2, retryBaseMs: 10 });
    assert.deepEqual(root.read('Album/a.bin'), body);
    assert.ok(ranges.some((r) => r > 0), 'second request should carry a Range offset');
  } finally {
    await srv.close();
  }
});

test('server ignoring Range (200) restarts the file from scratch', async () => {
  const body = Buffer.alloc(6000, 3);
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  const { root, partials, io } = setup();
  root.write('Album/a.bin', Buffer.alloc(1000, 9));
  await partials.set('Media/Album/a.bin');
  try {
    await io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', maxRetries: 0 });
    assert.deepEqual(root.read('Album/a.bin'), body);
  } finally {
    await srv.close();
  }
});

test('Stop keeps the bytes that arrived and marks the file incomplete', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-length': 100000 });
    res.write(Buffer.alloc(2000, 1));
    // never finish
  });
  const { root, partials, io } = setup();
  const ac = new AbortController();
  try {
    const p = io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', maxRetries: 0, signal: ac.signal });
    setTimeout(() => ac.abort(), 150);
    await assert.rejects(p, (e) => e.name === 'AbortError');
    const kept = root.read('Album/a.bin');
    assert.ok(kept && kept.length > 0 && kept.length < 100000, `partial file expected, got ${kept?.length}`);
    assert.equal(await partials.has('Media/Album/a.bin'), true);
    assert.equal((await io.checkDestFile('Media/Album/a.bin', {})).status, 'incomplete');
  } finally {
    await srv.close();
  }
});

test('after Stop the next run resumes with Range and the bytes match', async () => {
  const big = bytes(300_000, 7);
  let stallFirst = true;
  const ranges = [];
  const srv = await serve((req, res) => {
    const range = /bytes=(\d+)-/.exec(req.headers.range || '');
    ranges.push(range ? Number(range[1]) : null);
    if (stallFirst && !range) {
      stallFirst = false;
      res.writeHead(200, { 'content-length': big.length });
      res.write(big.subarray(0, 100_000));
      return; // stall until the client goes away
    }
    const start = range ? Number(range[1]) : 0;
    res.writeHead(range ? 206 : 200, {
      'content-length': big.length - start,
      ...(range ? { 'content-range': `bytes ${start}-${big.length - 1}/${big.length}` } : {}),
    });
    res.end(big.subarray(start));
  });
  const { root, partials, io } = setup();
  const ac = new AbortController();
  try {
    await assert.rejects(io.downloadFile({
      url: `${srv.base}/big`,
      dest: 'Media/Album/big.bin',
      maxRetries: 0,
      signal: ac.signal,
      expectedSize: big.length,
      onProgress: (recv) => {
        if (recv >= 50_000 && !ac.signal.aborted) setTimeout(() => ac.abort(), 100);
      },
    }));
    await io.downloadFile({ url: `${srv.base}/big`, dest: 'Media/Album/big.bin', maxRetries: 0, expectedSize: big.length });
    assert.deepEqual(root.read('Album/big.bin'), big);
    assert.ok(ranges.at(-1) > 0, 'the second run must ask only for the rest');
    assert.equal(partials.raw.size, 0);
  } finally {
    await srv.close();
  }
});

test('speed limit slows the browser download down', async () => {
  const { setNetworkOptions } = await import('../extension/src/net-browser.js');
  const body = bytes(200_000, 3);
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  const { root, io } = setup();
  setNetworkOptions({ limitRate: 200_000 }); // the bucket starts full: ~200 KB pass at once
  try {
    const t0 = Date.now();
    await io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', maxRetries: 0 });
    // 200 KB at 200 KB/s with a full bucket finishes quickly; the second 200 KB must wait.
    await io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/b.bin', maxRetries: 0 });
    assert.ok(Date.now() - t0 >= 600, `expected the limit to slow things down, took ${Date.now() - t0} ms`);
    assert.deepEqual(root.read('Album/b.bin'), body);
  } finally {
    setNetworkOptions({ limitRate: 0 });
    await srv.close();
  }
});

test('an HTML page instead of a file is rejected and not saved', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end('<!doctype html><title>blocked</title>');
  });
  const { root, io } = setup();
  try {
    await assert.rejects(
      io.downloadFile({ url: `${srv.base}/a.jpg`, dest: 'Media/Album/a.jpg', maxRetries: 0 }),
      /instead of a file/
    );
    assert.equal(root.read('Album/a.jpg'), null);
  } finally {
    await srv.close();
  }
});

test('a body shorter than the expected size is reported as incomplete', async () => {
  const srv = await serve((req, res) => {
    res.writeHead(200); // no Content-Length: the expected size from the album listing is the reference
    res.end(Buffer.alloc(500, 4));
  });
  const { io } = setup();
  try {
    await assert.rejects(
      io.downloadFile({ url: `${srv.base}/a.bin`, dest: 'Media/Album/a.bin', expectedSize: 1000, maxRetries: 0 }),
      /Incomplete download/
    );
  } finally {
    await srv.close();
  }
});

test('runner + fs-io: same names get (1), complete files are skipped, mismatches re-downloaded', async () => {
  const one = bytes(3000, 1);
  const two = bytes(4000, 2);
  const fresh = bytes(2000, 3);
  const files = { '/one': one, '/two': two, '/fresh': fresh };
  const hits = new Map();
  const srv = await serve((req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    hits.set(p, (hits.get(p) || 0) + 1);
    res.writeHead(200, { 'content-length': files[p].length });
    res.end(files[p]);
  });
  const { root, io } = setup();
  root.write('Album/fresh.bin', bytes(10, 9)); // wrong size on disk
  const resolve = async (pageUrl) => ({ url: `${srv.base}/${pageUrl.split('/').pop()}` });
  try {
    const first = await runDownloadWith({
      io,
      albumDir: 'Media/Album',
      files: [
        { pageUrl: `${srv.base}/f/one`, fileName: 'same.bin', sizeBytes: one.length },
        { pageUrl: `${srv.base}/f/two`, fileName: 'same.bin', sizeBytes: two.length },
      ],
      resolve,
    });
    assert.deepEqual(first.map((r) => r.dest), ['Media/Album/same.bin', 'Media/Album/same (1).bin']);
    assert.deepEqual(root.read('Album/same.bin'), one);
    assert.deepEqual(root.read('Album/same (1).bin'), two);

    const second = await runDownloadWith({
      io,
      albumDir: 'Media/Album',
      files: [
        { pageUrl: `${srv.base}/f/one`, fileName: 'same.bin', sizeBytes: one.length },
        { pageUrl: `${srv.base}/f/fresh`, fileName: 'fresh.bin', sizeBytes: fresh.length },
      ],
      skipExisting: true,
      checkMagic: false,
      resolve,
    });
    assert.equal(second[0].skipped, true);
    assert.equal(second[1].skipped, false);
    assert.equal(hits.get('/one'), 1, 'a complete file must not be requested again');
    assert.deepEqual(root.read('Album/fresh.bin'), fresh);
  } finally {
    await srv.close();
  }
});

test('runner + fs-io: full chain file page → API → signature → CDN', async () => {
  const body = bytes(5000, 11);
  let base = '';
  const srv = await serve((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/f/abc') {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end(
        `<html><head><meta property="og:title" content="Fallback name.bin"></head><body>` +
        `<a href="${base}/file/42">Download</a><script>var SIGN_SERVICE_URL = '${base}/sign';</script></body></html>`
      );
    }
    if (url.pathname === '/api/_001_v2' && req.method === 'POST') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ mediafiles: `${base}/cdn`, path: '/files/abc.bin', original: 'Pic One.bin' }));
    }
    if (url.pathname === '/sign') {
      res.writeHead(200, { 'content-type': 'application/json' });
      return res.end(JSON.stringify({ token: 'tok', ex: '999' }));
    }
    if (url.pathname === '/cdn/files/abc.bin' && url.searchParams.get('token') === 'tok') {
      res.writeHead(200, { 'content-length': body.length, 'content-type': 'application/octet-stream' });
      return res.end(body);
    }
    res.writeHead(404);
    res.end();
  });
  base = srv.base;
  const { root, io } = setup();
  try {
    const results = await runDownloadWith({
      io,
      albumDir: 'Media/Album',
      albumUrl: `${base}/a/album`,
      files: [{ pageUrl: `${base}/f/abc`, fileName: '', sizeBytes: 0 }],
    });
    assert.equal(results[0].ok, true, results[0].error);
    assert.equal(results[0].dest, 'Media/Album/Pic One.bin');
    assert.deepEqual(root.read('Album/Pic One.bin'), body);
  } finally {
    await srv.close();
  }
});

test('Check disk: complete, size mismatch, corrupt, incomplete and missing files', async () => {
  const { root, partials, io } = setup();
  const jpg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), bytes(96, 1)]);
  root.write('Album/good.jpg', jpg);
  root.write('Album/short.jpg', jpg.subarray(0, 50));
  root.write('Album/page.jpg', Buffer.from('<!doctype html><html>nope</html>'));
  root.write('Album/half.jpg', jpg.subarray(0, 60));
  root.write('Album/half.jpg.crswap', jpg); // Chrome's in-progress swap file is not a download
  await partials.set('Media/Album/half.jpg');

  const r = await io.analyzeAlbumFiles('Media/Album', [
    { pageUrl: 'p1', fileName: 'good.jpg', sizeBytes: jpg.length },
    { pageUrl: 'p2', fileName: 'short.jpg', sizeBytes: jpg.length },
    { pageUrl: 'p3', fileName: 'page.jpg', sizeBytes: 0 },
    { pageUrl: 'p4', fileName: 'half.jpg', sizeBytes: jpg.length },
    { pageUrl: 'p5', fileName: 'gone.jpg', sizeBytes: 10 },
    { pageUrl: 'p6', fileName: '', sizeBytes: 10 },
  ]);
  assert.deepEqual(r.results.map((x) => x.status), ['complete', 'size_mismatch', 'corrupt', 'incomplete', 'missing', 'missing']);
  assert.equal(r.indexSize, 4);

  const none = await io.analyzeAlbumFiles('Media/No such album', [{ pageUrl: 'p', fileName: 'a.jpg' }]);
  assert.equal(none.results[0].status, 'missing');
});

test('appendText adds to errors.log without overwriting it', async () => {
  const { root, io } = setup();
  await io.appendText('Media/errors.log', 'first\n');
  await io.appendText('Media/errors.log', 'second\n');
  assert.equal(root.read('errors.log').toString(), 'first\nsecond\n');
});
