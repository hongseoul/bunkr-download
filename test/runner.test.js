import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runDownload } from '../src/downloader.js';
import { MaintenanceError } from '../src/net.js';
import { serve, tmpDir, rmDir, bytes } from '../test-support/helpers.js';

/** Static body store served by a tiny file server; also counts requests per path. */
async function fileServer(files, { onRequest } = {}) {
  const hits = new Map();
  const srv = await serve((req, res) => {
    const p = new URL(req.url, 'http://x').pathname;
    hits.set(p, (hits.get(p) || 0) + 1);
    if (onRequest && onRequest(req, res, p, hits.get(p)) === true) return;
    const body = files[p];
    if (!body) {
      res.writeHead(404);
      return res.end('nope');
    }
    const range = /bytes=(\d+)-/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1]);
      res.writeHead(206, {
        'content-length': body.length - start,
        'content-range': `bytes ${start}-${body.length - 1}/${body.length}`,
      });
      return res.end(body.subarray(start));
    }
    res.writeHead(200, { 'content-length': body.length, 'content-type': 'application/octet-stream' });
    res.end(body);
  });
  return { ...srv, hits };
}

const events = () => {
  const list = [];
  return { list, onEvent: (e) => list.push(e), stages: (s) => list.filter((e) => e.stage === s) };
};

test('same-named files get (1), (2) suffixes in album order, never overwrite each other', async () => {
  const a = bytes(500, 1);
  const b = bytes(600, 2);
  const c = bytes(700, 3);
  const srv = await fileServer({ '/a': a, '/b': b, '/c': c });
  const dir = tmpDir();
  try {
    const files = ['a', 'b', 'c'].map((n) => ({ pageUrl: `${srv.base}/f/${n}`, fileName: 'photo.jpg' }));
    const results = await runDownload({
      albumDir: dir,
      files,
      concurrency: 3,
      // Resolve in reverse order of completion to prove naming does not depend on timing.
      resolve: async (pageUrl) => {
        const n = pageUrl.split('/').pop();
        await new Promise((r) => setTimeout(r, n === 'a' ? 40 : n === 'b' ? 20 : 0));
        return { url: `${srv.base}/${n}`, filename: 'photo.jpg' };
      },
    });
    assert.ok(results.every((r) => r.ok));
    assert.deepEqual(fs.readFileSync(path.join(dir, 'photo.jpg')), a);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'photo (1).jpg')), b);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'photo (2).jpg')), c);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});

test('one failing file does not stop the others; counters are consistent', async () => {
  const srv = await fileServer({ '/ok1': bytes(300, 1), '/ok2': bytes(300, 2) });
  const dir = tmpDir();
  const ev = events();
  try {
    const files = ['ok1', 'missing', 'ok2'].map((n) => ({ pageUrl: `${srv.base}/f/${n}`, fileName: `${n}.bin` }));
    const results = await runDownload({
      albumDir: dir,
      files,
      concurrency: 2,
      maxRetries: 0,
      onEvent: ev.onEvent,
      resolve: async (pageUrl) => ({ url: `${srv.base}/${pageUrl.split('/').pop()}` }),
    });
    assert.deepEqual(results.map((r) => r.ok), [true, false, true]);
    assert.match(results[1].error, /404/);
    assert.equal(fs.existsSync(path.join(dir, 'missing.bin')), false, 'error body must not be saved');
    const last = ev.list.at(-1);
    assert.equal(last.completed, 3);
    assert.equal(last.failed, 1);
    assert.equal(last.total, 3);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});

test('maintenance: waits and retries with backoff, then succeeds', async () => {
  const srv = await fileServer({ '/x': bytes(200, 9) });
  const dir = tmpDir();
  const ev = events();
  let attempts = 0;
  try {
    const results = await runDownload({
      albumDir: dir,
      files: [{ pageUrl: `${srv.base}/f/x`, fileName: 'x.bin' }],
      maintenanceDelaysMs: [5, 5],
      onEvent: ev.onEvent,
      resolve: async () => {
        if (++attempts <= 2) throw new MaintenanceError();
        return { url: `${srv.base}/x` };
      },
    });
    assert.equal(results[0].ok, true);
    assert.equal(ev.stages('waiting').length, 2);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});

test('maintenance: "skip" strategy fails fast with a clear message; budget exhaustion too', async () => {
  const dir = tmpDir();
  try {
    const skip = await runDownload({
      albumDir: dir,
      files: [{ pageUrl: 'http://x/f/1', fileName: '1.bin' }],
      maintenanceStrategy: 'skip',
      resolve: async () => { throw new MaintenanceError(); },
    });
    assert.equal(skip[0].ok, false);
    assert.match(skip[0].error, /maintenance/i);

    const exhausted = await runDownload({
      albumDir: dir,
      files: [{ pageUrl: 'http://x/f/2', fileName: '2.bin' }],
      maintenanceDelaysMs: [1, 1],
      resolve: async () => { throw new MaintenanceError(); },
    });
    assert.equal(exhausted[0].ok, false);
    assert.match(exhausted[0].error, /maintenance/i);
  } finally {
    rmDir(dir);
  }
});

test('stop keeps .part files; the next run resumes them and the bytes match', async () => {
  const big = bytes(300_000, 7);
  let stallFirst = true;
  const srv = await fileServer({ '/big': big }, {
    onRequest: (req, res) => {
      // First request: send a prefix, then stall until the client goes away.
      if (stallFirst && !req.headers.range) {
        stallFirst = false;
        res.writeHead(200, { 'content-length': big.length });
        res.write(big.subarray(0, 100_000));
        return true;
      }
      return false;
    },
  });
  const dir = tmpDir();
  const ac = new AbortController();
  let stopTimer = null;
  const ev = events();
  const files = [{ pageUrl: `${srv.base}/f/big`, fileName: 'big.bin', sizeBytes: big.length }];
  const resolve = async () => ({ url: `${srv.base}/big` });
  try {
    const first = await runDownload({
      albumDir: dir,
      files,
      signal: ac.signal,
      maxRetries: 0,
      resolve,
      onEvent: (e) => {
        ev.onEvent(e);
        // Let the received bytes reach the disk before stopping, like a user pressing Stop mid-download.
        if (e.stage === 'chunk' && e.recv >= 50_000 && !ac.signal.aborted && !stopTimer) {
          stopTimer = setTimeout(() => ac.abort(), 150);
        }
      },
    });
    assert.equal(first[0].stopped, true);
    assert.equal(first[0].ok, false);
    assert.equal(fs.existsSync(path.join(dir, 'big.bin')), false);
    const partSize = fs.statSync(path.join(dir, 'big.bin.part')).size;
    assert.ok(partSize > 0 && partSize < big.length, `partial file expected, got ${partSize}`);

    const second = await runDownload({ albumDir: dir, files, maxRetries: 0, resolve });
    assert.equal(second[0].ok, true);
    assert.deepEqual(fs.readFileSync(path.join(dir, 'big.bin')), big);
    assert.equal(fs.existsSync(path.join(dir, 'big.bin.part')), false);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});

test('skipExisting skips complete files and re-downloads size mismatches', async () => {
  const good = Buffer.concat([Buffer.from([1, 2, 3, 4]), bytes(996, 5)]);
  const fresh = Buffer.concat([Buffer.from([1, 2, 3, 4]), bytes(1996, 6)]);
  const srv = await fileServer({ '/good': good, '/fresh': fresh });
  const dir = tmpDir();
  const ev = events();
  try {
    fs.writeFileSync(path.join(dir, 'good.bin'), good);
    fs.writeFileSync(path.join(dir, 'fresh.bin'), good); // wrong size on disk
    const results = await runDownload({
      albumDir: dir,
      files: [
        { pageUrl: `${srv.base}/f/good`, fileName: 'good.bin', sizeBytes: good.length },
        { pageUrl: `${srv.base}/f/fresh`, fileName: 'fresh.bin', sizeBytes: fresh.length },
      ],
      skipExisting: true,
      checkMagic: false,
      onEvent: ev.onEvent,
      resolve: async (pageUrl) => ({ url: `${srv.base}/${pageUrl.split('/').pop()}` }),
    });
    assert.equal(results[0].skipped, true);
    assert.equal(results[1].skipped, false);
    assert.equal(srv.hits.get('/good'), undefined, 'complete file must not be requested');
    assert.deepEqual(fs.readFileSync(path.join(dir, 'fresh.bin')), fresh);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});

test('full chain: file page → API → signature → CDN download', async () => {
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
    if (url.pathname === '/cdn/files/abc.bin') {
      if (url.searchParams.get('token') !== 'tok') {
        res.writeHead(403);
        return res.end('unsigned');
      }
      res.writeHead(200, { 'content-length': body.length, 'content-type': 'application/octet-stream' });
      return res.end(body);
    }
    res.writeHead(404);
    res.end();
  });
  base = srv.base;
  const dir = tmpDir();
  try {
    const results = await runDownload({
      albumDir: dir,
      albumUrl: `${base}/a/album`,
      files: [{ pageUrl: `${base}/f/abc`, fileName: '', sizeBytes: 0 }],
    });
    assert.equal(results[0].ok, true, results[0].error);
    assert.equal(path.basename(results[0].dest), 'Pic One.bin');
    assert.deepEqual(fs.readFileSync(results[0].dest), body);
  } finally {
    await srv.close();
    rmDir(dir);
  }
});
