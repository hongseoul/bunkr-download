import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFileFilter, parseExtList, parseSize, parseUrlList, regexOrSubstring } from '../src/filters.js';

const f = (fileName, sizeBytes, extra = {}) => ({ pageUrl: `https://bunkr.si/f/${fileName}`, fileName, sizeBytes, ...extra });

test('parseSize understands units and rejects junk', () => {
  assert.equal(parseSize('500k'), 500 * 1024);
  assert.equal(parseSize('2M'), 2 * 1024 * 1024);
  assert.equal(parseSize('1.5G'), Math.floor(1.5 * 1024 ** 3));
  assert.equal(parseSize('1024'), 1024);
  assert.equal(parseSize(''), 0);
  assert.throws(() => parseSize('big'), /Invalid size/);
});

test('parseExtList normalises dots, case and spaces', () => {
  assert.deepEqual([...parseExtList('JPG, .mp4 ,*.png,,')].sort(), ['.jpg', '.mp4', '.png']);
});

test('parseUrlList ignores blank lines and # comments', () => {
  assert.deepEqual(parseUrlList('# my list\nhttps://a/a/1\n\n  https://a/a/2  \n#https://a/a/3\r\n'), [
    'https://a/a/1',
    'https://a/a/2',
  ]);
});

test('regexOrSubstring treats plain text literally and drops stateful flags', () => {
  assert.equal(regexOrSubstring('a.b').test('axb'), false);
  assert.equal(regexOrSubstring('a.b').test('a.b'), true);
  const re = regexOrSubstring('/^img_\\d+/gi');
  assert.equal(re.test('IMG_01.jpg'), true);
  assert.equal(re.test('IMG_01.jpg'), true, 'a g flag would make the second test fail');
});

test('no options → no filter', () => {
  assert.equal(buildFileFilter({}), null);
});

test('name patterns match the file name, not only the page URL', () => {
  const fn = buildFileFilter({ patterns: [regexOrSubstring('/^IMG_\\d+\\.(jpg|png)$/')] });
  assert.equal(fn(f('IMG_001.jpg', 10)), true);
  assert.equal(fn(f('clip.mp4', 10)), false);
});

test('invert excludes matches', () => {
  const fn = buildFileFilter({ patterns: [regexOrSubstring('.zip')], invert: true });
  assert.equal(fn(f('a.zip', 1)), false);
  assert.equal(fn(f('a.jpg', 1)), true);
});

test('extension filter uses file name, falls back to ext, keeps unknowns', () => {
  const fn = buildFileFilter({ exts: 'jpg,mp4' });
  assert.equal(fn(f('a.JPG', 1)), true);
  assert.equal(fn(f('a.png', 1)), false);
  assert.equal(fn({ pageUrl: 'https://bunkr.si/f/x', ext: 'mp4' }), true);
  assert.equal(fn({ pageUrl: 'https://bunkr.si/f/x' }), true, 'unknown extension must not drop a file');
});

test('size filter keeps files of unknown size', () => {
  const fn = buildFileFilter({ minSize: '1k', maxSize: '1M' });
  assert.equal(fn(f('a', 500)), false);
  assert.equal(fn(f('a', 2048)), true);
  assert.equal(fn(f('a', 5 * 1024 * 1024)), false);
  assert.equal(fn(f('a', 0)), true);
});

test('min larger than max is rejected', () => {
  assert.throws(() => buildFileFilter({ minSize: '2M', maxSize: '1M' }), /min-size/);
});
