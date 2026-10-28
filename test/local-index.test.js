import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { albumOutputPath, findAlbumFolder } from '../src/local-index.js';
import { tmpDir, rmDir } from '../test-support/helpers.js';

test('findAlbumFolder: the album folder when it exists', async () => {
  const out = tmpDir();
  try {
    const albumDir = albumOutputPath(out, 'Trip 2024');
    fs.mkdirSync(albumDir);
    assert.deepEqual(await findAlbumFolder({ outputDir: out, albumName: 'Trip 2024' }), { path: albumDir, albumMissing: false });
  } finally {
    rmDir(out);
  }
});

test('findAlbumFolder: follows the name cipher like the downloader', async () => {
  const out = tmpDir();
  try {
    const nameRules = [{ find: 'secret', replace: 'x' }];
    const albumDir = albumOutputPath(out, 'My secret album', nameRules);
    fs.mkdirSync(albumDir);
    const r = await findAlbumFolder({ outputDir: out, albumName: 'My secret album', nameRules });
    assert.equal(r.path, albumDir);
    assert.equal(r.albumMissing, false);
  } finally {
    rmDir(out);
  }
});

test('findAlbumFolder: the folder a download reported wins over the computed one', async () => {
  const out = tmpDir();
  try {
    const written = path.join(out, 'renamed later');
    fs.mkdirSync(written);
    fs.mkdirSync(albumOutputPath(out, 'Trip'));
    const r = await findAlbumFolder({ albumDir: written, outputDir: out, albumName: 'Trip' });
    assert.equal(r.path, written);
  } finally {
    rmDir(out);
  }
});

test('findAlbumFolder: falls back to the download folder, null when that is gone too', async () => {
  const out = tmpDir();
  try {
    assert.deepEqual(await findAlbumFolder({ outputDir: out, albumName: 'Not yet' }), { path: out, albumMissing: true });
  } finally {
    rmDir(out);
  }
  assert.equal(await findAlbumFolder({ outputDir: out, albumName: 'Not yet' }), null);
  assert.equal(await findAlbumFolder({}), null);
});
