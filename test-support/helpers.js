import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function serve(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        server,
        base: `http://127.0.0.1:${server.address().port}`,
        close: () => {
          server.closeAllConnections?.();
          return new Promise((r) => server.close(r));
        },
      });
    });
  });
}

export function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'bunkr-test-'));
}

export function rmDir(dir) {
  // Best effort: Windows may briefly hold a just-closed file. Never mask the real test failure.
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch { /* leftover temp dir is harmless */ }
}

/** Deterministic pseudo-random bytes, so tests can compare content. */
export function bytes(length, seed = 1) {
  const buf = Buffer.alloc(length);
  let x = seed;
  for (let i = 0; i < length; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    buf[i] = x & 0xff;
  }
  return buf;
}
