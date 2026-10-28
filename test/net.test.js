import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import {
  HttpError,
  MaintenanceError,
  retry,
  isRetryable,
  isAbortError,
  parseRetryAfter,
  setNetworkOptions,
  getNetworkOptions,
  createThrottle,
  parseSize,
  sleep,
} from '../src/net.js';
import { checkDiskSpace, freeBytes } from '../src/disk.js';

test('retry: retries retryable errors up to the budget, then throws the last one', async () => {
  let calls = 0;
  await assert.rejects(
    retry(async () => { calls++; throw new HttpError(503, 'u', { retryAfterMs: 0 }); }, { max: 3, baseMs: 1 }),
    /HTTP 503/
  );
  assert.equal(calls, 4);
});

test('retry: succeeds after transient failures and reports each retry', async () => {
  let calls = 0;
  const seen = [];
  const out = await retry(async () => {
    if (++calls < 3) throw new HttpError(429, 'u', { retryAfterMs: 0 });
    return 'done';
  }, { max: 5, baseMs: 1, onRetry: (e, attempt) => seen.push(attempt) });
  assert.equal(out, 'done');
  assert.deepEqual(seen, [1, 2]);
});

test('retry: 403 is retried once, 404 never', async () => {
  let forbidden = 0;
  await assert.rejects(retry(async () => { forbidden++; throw new HttpError(403, 'u'); }, { max: 5, baseMs: 1 }));
  assert.equal(forbidden, 2);

  let missing = 0;
  await assert.rejects(retry(async () => { missing++; throw new HttpError(404, 'u'); }, { max: 5, baseMs: 1 }));
  assert.equal(missing, 1);
});

test('retry: abort stops immediately and is never retried', async () => {
  const ac = new AbortController();
  let calls = 0;
  const p = retry(async () => { calls++; throw new HttpError(503, 'u', { retryAfterMs: 60_000 }); }, { max: 5, signal: ac.signal });
  setTimeout(() => ac.abort(), 20);
  await assert.rejects(p, (e) => isAbortError(e));
  assert.equal(calls, 1);
});

test('isRetryable classification', () => {
  assert.equal(isRetryable(new HttpError(500, 'u')), true);
  assert.equal(isRetryable(new HttpError(404, 'u')), false);
  assert.equal(isRetryable(Object.assign(new Error('x'), { code: 'ECONNRESET' })), true);
  assert.equal(isRetryable(new Error('aborted')), true);
  assert.equal(isRetryable(new TypeError('bug')), false);
  assert.equal(isRetryable(new MaintenanceError()), false);
  assert.equal(isRetryable(Object.assign(new Error('x'), { response: { status: 502 } })), true);
});

test('parseRetryAfter handles seconds, dates and junk', () => {
  assert.equal(parseRetryAfter('2'), 2000);
  assert.equal(parseRetryAfter(''), null);
  assert.equal(parseRetryAfter('soon'), null);
  const inFive = new Date(Date.now() + 5000).toUTCString();
  const ms = parseRetryAfter(inFive);
  assert.ok(ms > 3000 && ms <= 5000);
});

test('sleep rejects when aborted', async () => {
  const ac = new AbortController();
  const p = sleep(10_000, ac.signal);
  ac.abort();
  await assert.rejects(p, (e) => isAbortError(e));
});

test('setNetworkOptions validates proxies', () => {
  assert.throws(() => setNetworkOptions({ proxy: 'ftp://nope' }), /proxy/i);
  assert.throws(() => setNetworkOptions({ proxy: 'not a url' }), /Invalid proxy/);
  setNetworkOptions({ proxy: 'socks5://127.0.0.1:1080', limitRate: 0 });
  assert.equal(getNetworkOptions().proxy, 'socks5://127.0.0.1:1080');
  setNetworkOptions({ proxy: 'http://127.0.0.1:8080' });
  setNetworkOptions({ proxy: '' });
  assert.equal(getNetworkOptions().proxy, '');
});

test('throttle caps throughput across a stream', async () => {
  setNetworkOptions({ limitRate: 20_000 }); // 20 KB/s, bucket starts full
  try {
    const started = Date.now();
    const chunks = Array.from({ length: 8 }, () => Buffer.alloc(5_000, 1)); // 40 KB total
    let got = 0;
    await pipeline(
      Readable.from(chunks),
      createThrottle(),
      async function consume(source) {
        for await (const c of source) got += c.length;
      }
    );
    const elapsed = Date.now() - started;
    assert.equal(got, 40_000);
    assert.ok(elapsed >= 800, `expected ~1s of throttling, took ${elapsed} ms`);
  } finally {
    setNetworkOptions({ limitRate: 0 });
  }
});

test('throttle is a no-op without a limit', async () => {
  setNetworkOptions({ limitRate: 0 });
  const started = Date.now();
  await pipeline(Readable.from([Buffer.alloc(1_000_000)]), createThrottle(), async function drain(s) {
    for await (const c of s) void c;
  });
  assert.ok(Date.now() - started < 500);
});

test('parseSize accepts numbers and rejects negatives/garbage', () => {
  assert.equal(parseSize(2048), 2048);
  assert.equal(parseSize('1 GB'), 1024 ** 3);
  assert.throws(() => parseSize('-5'));
});

test('disk space: ok when unknown or small, refuses when clearly too big', async () => {
  const free = await freeBytes(process.cwd());
  assert.ok(free === null || free > 0);
  assert.equal((await checkDiskSpace(process.cwd(), 0)).ok, true);
  assert.equal((await checkDiskSpace(process.cwd(), 1024)).ok, true);
  if (free !== null) {
    const huge = await checkDiskSpace(process.cwd(), free * 4);
    assert.equal(huge.ok, false);
    assert.equal(huge.free, free);
  }
});

test('disk space: a not-yet-created output folder is measured through its parent', async () => {
  const free = await freeBytes(`${process.cwd()}/does/not/exist/yet`);
  assert.ok(free === null || free > 0);
});
