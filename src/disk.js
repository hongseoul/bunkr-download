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

/** Nearest existing ancestor of `dir` (statfs/stat need a real path). Returns null if none. */
async function existingAncestor(dir) {
  let cur = path.resolve(dir);
  for (;;) {
    try {
      await fsp.stat(cur);
      return cur;
    } catch (e) {
      const parent = path.dirname(cur);
      if (parent === cur || (e.code !== 'ENOENT' && e.code !== 'ENOTDIR')) return null;
      cur = parent;
    }
  }
}

/**
 * Free space for each folder, grouped by the drive/volume it lives on.
 * @param {string[]} dirs
 * @returns {Promise<Record<string, { free: number, volume: string, label: string } | null>>}
 *   `volume` is the same for folders on one drive; `label` is "D:" on Windows, else the folder.
 */
export async function diskInfo(dirs) {
  const out = {};
  for (const dir of new Set((dirs || []).filter(Boolean).map(String))) {
    try {
      const real = await existingAncestor(dir);
      if (!real) { out[dir] = null; continue; }
      const [st, fsSt] = await Promise.all([fsp.stat(real), fsp.statfs(real)]);
      const root = path.parse(real).root;
      const label = process.platform === 'win32' ? root.replace(/[\\/]+$/, '').toUpperCase() : real;
      out[dir] = {
        free: Number(fsSt.bavail) * Number(fsSt.bsize),
        volume: String(st.dev),
        label: label || real,
      };
    } catch {
      out[dir] = null;
    }
  }
  return out;
}
