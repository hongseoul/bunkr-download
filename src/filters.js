/**
 * File filters shared by the CLI and the GUI.
 *
 * A "file" is { pageUrl, fileName?, sizeBytes?, ext? } as produced by the album parser.
 * Unknown values (no name, size 0) never exclude a file — we cannot judge what we do not know.
 */

import path from 'node:path';
import { parseSize } from './net.js';

export { parseSize };

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One entry per line; blank lines and lines starting with # are ignored. */
export function parseUrlList(text) {
  return String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

/** "text" → case-sensitive substring RegExp; "/pattern/flags" → RegExp (g/y flags dropped: stateful .test). */
export function regexOrSubstring(s) {
  const text = String(s).trim();
  const m = /^\/(.+)\/([gimsuy]*)$/.exec(text);
  if (m) {
    try {
      return new RegExp(m[1], m[2].replace(/[gy]/g, ''));
    } catch {
      // fall through to a literal match
    }
  }
  return new RegExp(escapeRegExp(text));
}

/** "jpg, .MP4,png" → Set { '.jpg', '.mp4', '.png' } */
export function parseExtList(input) {
  const list = Array.isArray(input) ? input : String(input || '').split(',');
  const out = new Set();
  for (const raw of list) {
    const e = String(raw).trim().toLowerCase().replace(/^\*?\.?/, '');
    if (e) out.add('.' + e);
  }
  return out;
}

function extOf(file) {
  const fromName = file.fileName ? path.extname(file.fileName).toLowerCase() : '';
  if (fromName) return fromName;
  const e = String(file.ext || '').toLowerCase();
  return e ? (e.startsWith('.') ? e : '.' + e) : '';
}

/**
 * @param {object} opts
 * @param {RegExp[]} [opts.patterns]  name/URL patterns; a file passes if any matches
 * @param {boolean} [opts.invert]     exclude files matching `patterns` instead
 * @param {Iterable<string>|string} [opts.exts]  allowed extensions
 * @param {number|string} [opts.minSize]
 * @param {number|string} [opts.maxSize]
 * @returns {((file: object) => boolean) | null}  null when nothing is configured
 */
export function buildFileFilter({ patterns = [], invert = false, exts = [], minSize = 0, maxSize = 0 } = {}) {
  const extSet = exts instanceof Set ? exts : parseExtList(typeof exts === 'string' ? exts : [...exts]);
  const min = parseSize(minSize);
  const max = parseSize(maxSize);
  if (!patterns.length && !extSet.size && !min && !max) return null;
  if (min && max && min > max) throw new Error('min-size is larger than max-size');

  return (file) => {
    if (patterns.length) {
      const name = file.fileName || '';
      const matched = patterns.some((re) => (name && re.test(name)) || re.test(file.pageUrl || ''));
      if (invert ? matched : !matched) return false;
    }
    if (extSet.size) {
      const e = extOf(file);
      if (e && !extSet.has(e)) return false;
    }
    const size = Number(file.sizeBytes) || 0;
    if (size > 0) {
      if (min && size < min) return false;
      if (max && size > max) return false;
    }
    return true;
  };
}
