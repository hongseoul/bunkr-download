import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extOf, inspectHeader, judgeLocalFile, shouldSkipLocal } from '../src/local-core.js';

const enc = (s) => new TextEncoder().encode(s);
const local = (name, size) => ({ name, path: name, size, mtimeMs: 0 });
const header = (h) => async () => h;

test('extOf: lowercased extension from a name or a path', () => {
  assert.equal(extOf('Clip.MP4'), '.mp4');
  assert.equal(extOf('dir/sub\\photo.jpeg'), '.jpeg');
  assert.equal(extOf('noext'), '');
  assert.equal(extOf('.hidden'), '');
});

test('inspectHeader: HTML or JSON error bodies are not media', () => {
  assert.equal(inspectHeader(enc('<!DOCTYPE html><html>'), '.mp4', 500).ok, false);
  assert.equal(inspectHeader(enc('{"error":"forbidden"}'), '.jpg', 500).ok, false);
});

test('inspectHeader: magic bytes are checked for known types, unknown types pass', () => {
  assert.equal(inspectHeader(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), '.jpg', 10).ok, true);
  assert.equal(inspectHeader(new Uint8Array([0x00, 0x01, 0x02, 0x03]), '.jpg', 10).ok, false);
  assert.equal(inspectHeader(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), '.png', 10).ok, true);
  assert.equal(inspectHeader(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]), '.webm', 10).ok, true);
  assert.equal(inspectHeader(new Uint8Array([0x00, 0x00, 0x00, 0x20]), '.mkv', 10).ok, false);
  assert.equal(inspectHeader(new Uint8Array([0x00, 0x00, 0x00, 0x20]), '.mp4', 10).ok, true);
  assert.equal(inspectHeader(new Uint8Array([1, 2, 3]), '.xyz', 10).ok, true);
});

test('inspectHeader: empty file or unreadable header fails', () => {
  assert.equal(inspectHeader(new Uint8Array([0xff]), '.jpg', 0).ok, false);
  assert.equal(inspectHeader(null, '.jpg', 10).ok, false);
});

test('judgeLocalFile: missing, empty, size mismatch, corrupt, complete', async () => {
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  assert.equal((await judgeLocalFile(null, { readHeader: header(jpg) })).status, 'missing');
  assert.equal((await judgeLocalFile(local('a.jpg', 0), { readHeader: header(jpg) })).status, 'incomplete');
  assert.equal((await judgeLocalFile(local('a.jpg', 10), { expectedSize: 20, readHeader: header(jpg) })).status, 'size_mismatch');
  assert.equal((await judgeLocalFile(local('a.jpg', 10), { readHeader: header(enc('<html>')) })).status, 'corrupt');
  assert.equal((await judgeLocalFile(local('a.jpg', 10), { expectedSize: 10, readHeader: header(jpg) })).status, 'complete');
  assert.equal(
    (await judgeLocalFile(local('a.jpg', 10), { checkMagic: false, readHeader: header(enc('<html>')) })).status,
    'complete',
    'no header read when magic checks are off'
  );
});

test('shouldSkipLocal: complete always skips; mismatches only when re-download is off', () => {
  const complete = { status: 'complete' };
  const mismatch = { status: 'size_mismatch' };
  assert.equal(shouldSkipLocal(complete, { skipExisting: false }), false);
  assert.equal(shouldSkipLocal(complete, { skipExisting: true }), true);
  assert.equal(shouldSkipLocal(mismatch, { skipExisting: true, redownloadMismatch: true }), false);
  assert.equal(shouldSkipLocal(mismatch, { skipExisting: true, redownloadMismatch: false }), true);
});
