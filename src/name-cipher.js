/**
 * Word-level name cipher for created album folders and file names.
 *
 * Replaces a case-insensitive substring in names before they are written to disk.
 * Rules never leave the machine; they only change local path strings.
 */

import { sanitize } from './parser.js';
import sensitiveWords from './sensitive-words.cjs';

/**
 * A plain rule replaces one word; a `words` rule swaps every sensitive word
 * (built-in categories + custom list) for a neutral one.
 * @typedef {{ find: string, replace: string } | { words: { categories: string[], custom: string } }} NameRule
 */

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Drop empty find-strings; keep empty replace (delete the word).
 * @param {NameRule[] | null | undefined} rules
 * @returns {NameRule[]}
 */
export function normalizeRules(rules) {
  if (!Array.isArray(rules)) return [];
  const out = [];
  const seen = new Set();
  for (const r of rules) {
    if (r && r.words) {
      if (seen.has('*words')) continue;
      seen.add('*words');
      out.push({
        words: {
          categories: Array.isArray(r.words.categories) ? r.words.categories.map(String) : [],
          custom: String(r.words.custom || ''),
          strict: !!r.words.strict,
        },
      });
      continue;
    }
    const find = String(r?.find ?? '').trim();
    if (!find) continue;
    const key = find.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ find, replace: String(r?.replace ?? '') });
  }
  return out;
}

/**
 * Pronounceable-ish token, length roughly matching the source word.
 * @param {string} [source]
 * @param {number} [length]
 */
export function randomCipherToken(source = '', length) {
  const cons = 'bcdfghjklmnpqrstvwxz';
  const vows = 'aeiou';
  const n = Number.isInteger(length)
    ? Math.max(4, Math.min(16, length))
    : Math.max(6, Math.min(10, String(source).replace(/\s+/g, '').length || 7));
  let s = '';
  for (let i = 0; i < n; i++) {
    const alphabet = i % 2 === 0 ? cons : vows;
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

/**
 * Apply all rules left-to-right, case-insensitive, all occurrences.
 * @param {string} name
 * @param {NameRule[] | null | undefined} rules
 */
export function applyNameCipher(name, rules) {
  const list = normalizeRules(rules);
  if (!name || list.length === 0) return name;
  let out = String(name);
  for (const rule of list) {
    if (rule.words) {
      out = sensitiveWords.maskText(out, { ...rule.words, style: 'swap' });
      continue;
    }
    out = out.replace(new RegExp(escapeRegExp(rule.find), 'gi'), rule.replace);
  }
  return out;
}

/**
 * Album folder name after cipher + filesystem sanitize.
 * @param {string} albumName
 * @param {NameRule[] | null | undefined} rules
 */
export function cipherAlbumName(albumName, rules) {
  const raw = String(albumName || 'Direct');
  const list = normalizeRules(rules);
  if (list.length === 0) return sanitize(raw) || 'Direct';
  return sanitize(applyNameCipher(raw, list)) || sanitize(raw) || 'Direct';
}

/**
 * File basename after cipher + filesystem sanitize.
 * Empty input stays empty so callers can treat it as "unknown".
 * @param {string} fileName
 * @param {NameRule[] | null | undefined} rules
 */
export function cipherFileName(fileName, rules) {
  const raw = String(fileName || '');
  if (!raw) return '';
  const list = normalizeRules(rules);
  if (list.length === 0) return sanitize(raw) || 'unknown';
  return sanitize(applyNameCipher(raw, list)) || sanitize(raw) || 'unknown';
}

/**
 * Build a single-rule list from UI/CLI fields.
 * @param {{ enabled?: boolean, find?: string, replace?: string }} opts
 */
export function rulesFromFields({ enabled = true, find = '', replace = '' } = {}) {
  if (!enabled) return [];
  const word = String(find || '').trim();
  if (!word) return [];
  return [{ find: word, replace: String(replace ?? '') }];
}
