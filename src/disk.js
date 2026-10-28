import fsp from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_RESERVE = 64 * 1024 * 1024;

/** Free bytes on the volume holding `dir` (nearest existing ancestor). Returns null if unknown. */
export async function freeBytes(dir) {
  let cur = path.resolve(dir);
  for (;;) {
    try {
      const st = await fsp.statfs(cur);
      return Number(st.bavail) * Number(st.bsize);
    } catch (e) {
      const parent = path.dirname(cur);
      if (parent === cur || (e.code !== 'ENOENT' && e.code !== 'ENOTDIR')) return null;
      cur = parent;
    }
  }
}

/**
 * @param {string} dir
 * @param {number} neededBytes  sum of known sizes (0 = unknown → always ok)
 * @returns {Promise<{ ok: boolean, free: number|null, needed: number }>}
 */
export async function checkDiskSpace(dir, neededBytes, { reserve = DEFAULT_RESERVE } = {}) {
  const needed = Math.max(0, Number(neededBytes) || 0);
  const free = await freeBytes(dir);
  if (free == null || needed === 0) return { ok: true, free, needed };
  return { ok: free - reserve >= needed, free, needed };
}
