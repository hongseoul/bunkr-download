import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { downloadFile } from '../src/downloader.js';

function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, base: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bunkr-test-'));
}

test('403 response is an error and never saved as a file', async () => {
  const { server, base } = await serve((req, res) => {
    res.writeHead(403, { 'content-type': 'text/html' });
    res.end('<html>Forbidden</html>');
  });
  const dir = tmpDir();
  const dest = path.join(dir, 'a.jpg');
  try {
    await assert.rejects(downloadFile({ url: `${base}/a.jpg`, dest, maxRetries: 0 }));
    assert.equal(fs.existsSync(dest), false);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('429 with Retry-After is retried and then succeeds', async () => {
  let calls = 0;
  const body = Buffer.alloc(4096, 7);
  const { server, base } = await serve((req, res) => {
    calls++;
    if (calls === 1) {
      res.writeHead(429, { 'retry-after': '0' });
      return res.end('slow down');
    }
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  const dir = tmpDir();
  const dest = path.join(dir, 'a.bin');
  try {
    await downloadFile({ url: `${base}/a.bin`, dest, maxRetries: 2, retryBaseMs: 10 });
    assert.equal(calls, 2);
    assert.deepEqual(fs.readFileSync(dest), body);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('truncated body is detected and resumed via Range', async () => {
  const body = Buffer.from(Array.from({ length: 10000 }, (_, i) => i % 251));
  const ranges = [];
  const { server, base } = await serve((req, res) => {
    const range = /bytes=(\d+)-/.exec(req.headers.range || '');
    ranges.push(range ? Number(range[1]) : null);
    if (!range) {
      // First attempt: promise full length but cut the connection halfway.
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
  const dir = tmpDir();
  const dest = path.join(dir, 'a.bin');
  try {
    await downloadFile({ url: `${base}/a.bin`, dest, maxRetries: 2, retryBaseMs: 10 });
    assert.deepEqual(fs.readFileSync(dest), body);
    assert.ok(ranges.some((r) => r > 0), 'second request should carry a Range offset');
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('server ignoring Range (200) restarts the file from scratch', async () => {
  const body = Buffer.alloc(6000, 3);
  const { server, base } = await serve((req, res) => {
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  const dir = tmpDir();
  const dest = path.join(dir, 'a.bin');
  fs.writeFileSync(dest + '.part', Buffer.alloc(1000, 9));
  try {
    await downloadFile({ url: `${base}/a.bin`, dest, maxRetries: 0 });
    assert.deepEqual(fs.readFileSync(dest), body);
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('abort keeps the .part file for a later resume', async () => {
  const { server, base } = await serve((req, res) => {
    res.writeHead(200, { 'content-length': 100000 });
    res.write(Buffer.alloc(2000, 1));
    // never finish
  });
  const dir = tmpDir();
  const dest = path.join(dir, 'a.bin');
  const ac = new AbortController();
  try {
    const p = downloadFile({ url: `${base}/a.bin`, dest, maxRetries: 0, signal: ac.signal });
    setTimeout(() => ac.abort(), 100);
    await assert.rejects(p);
    assert.equal(fs.existsSync(dest), false);
    assert.equal(fs.existsSync(dest + '.part'), true);
  } finally {
    server.closeAllConnections?.();
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('placeholder file name does not crash (sanitize import)', async () => {
  const body = Buffer.alloc(100, 5);
  const { server, base } = await serve((req, res) => {
    res.writeHead(200, { 'content-length': body.length, 'content-disposition': 'attachment; filename="real.bin"' });
    res.end(body);
  });
  const dir = tmpDir();
  try {
    const out = await downloadFile({ url: `${base}/x`, dest: path.join(dir, 'unknown'), maxRetries: 0 });
    assert.equal(path.basename(out), 'real.bin');
  } finally {
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
