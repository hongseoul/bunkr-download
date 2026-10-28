import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { serve, tmpDir, rmDir, bytes } from '../test-support/helpers.js';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'index.js');

function run(args, { cwd } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI, ...args], { cwd, env: { ...process.env, NO_COLOR: '1' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

/** Direct media links are downloaded as-is (no Bunkr page to resolve). */
async function mediaServer() {
  const clip = bytes(4000, 21);
  const srv = await serve((req, res) => {
    if (req.url === '/clip.mp4') {
      res.writeHead(200, { 'content-length': clip.length, 'content-type': 'video/mp4' });
      return res.end(clip);
    }
    if (req.url === '/forbidden.mp4') {
      res.writeHead(403);
      return res.end('no');
    }
    res.writeHead(404);
    res.end();
  });
  return { ...srv, clip };
}

test('CLI downloads a direct link into <output>/Direct and exits 0', async () => {
  const srv = await mediaServer();
  const out = tmpDir();
  try {
    const r = await run([`${srv.base}/clip.mp4`, '-o', out, '--max-retries', '0']);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.deepEqual(fs.readFileSync(path.join(out, 'Direct', 'clip.mp4')), srv.clip);
  } finally {
    await srv.close();
    rmDir(out);
  }
});

test('CLI exits 1, logs the failure and leaves no file when the server answers 403', async () => {
  const srv = await mediaServer();
  const out = tmpDir();
  try {
    const r = await run([`${srv.base}/forbidden.mp4`, '-o', out, '--max-retries', '0']);
    assert.equal(r.code, 1);
    assert.equal(fs.existsSync(path.join(out, 'Direct', 'forbidden.mp4')), false);
    assert.match(fs.readFileSync(path.join(out, 'errors.log'), 'utf8'), /403/);
  } finally {
    await srv.close();
    rmDir(out);
  }
});

test('CLI --dry-run downloads nothing and --export writes the URL list', async () => {
  const srv = await mediaServer();
  const out = tmpDir();
  try {
    const list = path.join(out, 'urls.txt');
    const exportFile = path.join(out, 'export.txt');
    fs.writeFileSync(list, `# comment line\n\n${srv.base}/clip.mp4\n`);
    const r = await run(['-i', list, '-o', path.join(out, 'dl'), '--dry-run', '--export', exportFile]);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.equal(fs.existsSync(path.join(out, 'dl')), false, 'dry run must not create the output folder');
    assert.equal(fs.readFileSync(exportFile, 'utf8'), `${srv.base}/clip.mp4\n`);
    assert.doesNotMatch(r.stdout + r.stderr, /Invalid URL/);
  } finally {
    await srv.close();
    rmDir(out);
  }
});

test('CLI --ext filters direct links by extension', async () => {
  const srv = await mediaServer();
  const out = tmpDir();
  try {
    const r = await run([`${srv.base}/clip.mp4`, '-o', out, '--ext', 'jpg,png']);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.equal(fs.existsSync(path.join(out, 'Direct', 'clip.mp4')), false);
  } finally {
    await srv.close();
    rmDir(out);
  }
});

test('CLI rejects invalid option values with exit code 2', async () => {
  const bad = await run(['http://x/a.mp4', '--min-size', 'huge']);
  assert.equal(bad.code, 2);
  assert.match(bad.stderr, /Invalid size/);
  const retries = await run(['http://x/a.mp4', '--max-retries', 'many']);
  assert.equal(retries.code, 2);
  const proxy = await run(['http://x/a.mp4', '--proxy', 'ftp://nope']);
  assert.equal(proxy.code, 2);
  assert.match(proxy.stderr, /proxy/i);
});

test('CLI --limit-rate slows a download down', async () => {
  const srv = await mediaServer();
  const out = tmpDir();
  try {
    const started = Date.now();
    // 4000 bytes at 2 KB/s: the bucket starts full (2 KB), the rest has to wait ~1 s.
    const r = await run([`${srv.base}/clip.mp4`, '-o', out, '--limit-rate', '2k', '--max-retries', '0']);
    assert.equal(r.code, 0, r.stdout + r.stderr);
    assert.ok(Date.now() - started >= 900, `expected throttling, took ${Date.now() - started} ms`);
    assert.deepEqual(fs.readFileSync(path.join(out, 'Direct', 'clip.mp4')), srv.clip);
  } finally {
    await srv.close();
    rmDir(out);
  }
});
