/**
 * Local-only completeness / duplicate checks for already-downloaded album files.
 *
 * Privacy guarantees:
 *  - Reads only the chosen local output folder on the user's machine.
 *  - Never uploads file names, sizes, hashes, or paths anywhere.
 *  - Never contacts bunkr/CDN for the check itself (expected size comes from
 *    already-fetched preview metadata when available, or Content-Length at download time).
 *  - No persistent database — each scan is an ephemeral in-memory Map.
 */

import fsp from 'node:fs/promises';
import path from 'node:path';
import { sanitize } from './parser.js';
import { cipherAlbumName, cipherFileName } from './name-cipher.js';
import { MIN_VALID_BYTES, inspectHeader, judgeLocalFile } from './local-core.js';

export { isSkippable, shouldSkipLocal, needsDownload } from './local-core.js';

/** @typedef {import('./local-core.js').LocalFileInfo} LocalFileInfo */
/** @typedef {import('./local-core.js').MatchResult} MatchResult */

/**
 * Scan a directory (non-recursive by default — albums store files flat).
 * Ignores .part temp files, hidden files, and non-files.
 *
 * @param {string} dir
 * @param {{ recursive?: boolean }} [opts]
 * @returns {Promise<Map<string, LocalFileInfo>>} map keyed by lowercased basename
 */
export async function scanLocalDir(dir, { recursive = false } = {}) {
  /** @type {Map<string, LocalFileInfo>} */
  const index = new Map();
  if (!dir) return index;

  let entries;
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch (e) {
    if (e && (e.code === 'ENOENT' || e.code === 'ENOTDIR')) return index;
    throw e;
  }

  for (const ent of entries) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (recursive) {
        const nested = await scanLocalDir(full, { recursive: true });
        for (const [k, v] of nested) {
          // Prefer first match; nested keys stay basenames (same as flat albums)
          if (!index.has(k)) index.set(k, v);
        }
      }
      continue;
    }
    if (!ent.isFile()) continue;
    // Incomplete download leftovers from this tool
    if (ent.name.endsWith('.part')) continue;

    let st;
    try {
      st = await fsp.stat(full);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;

    const info = {
      name: ent.name,
      path: full,
      size: st.size,
      mtimeMs: st.mtimeMs,
    };
    // Key by exact basename and lowercased form for case-insensitive FS (Windows)
    index.set(ent.name, info);
    index.set(ent.name.toLowerCase(), info);
  }
  return index;
}

/**
 * Look up a planned download filename in a local index.
 * @param {Map<string, LocalFileInfo>} index
 * @param {string} fileName
 * @returns {LocalFileInfo | null}
 */
export function findLocalFile(index, fileName) {
  if (!fileName || !index || index.size === 0) return null;
  const name = path.basename(sanitize(fileName) || fileName);
  return index.get(name) || index.get(name.toLowerCase()) || null;
}

/**
 * Read a few header bytes for optional magic sniffing. Never leaves the machine.
 * @param {string} filePath
 * @param {number} [n=16]
 * @returns {Promise<Buffer | null>}
 */
async function readHeader(filePath, n = 16) {
  let fh;
  try {
    fh = await fsp.open(filePath, 'r');
    const buf = Buffer.alloc(n);
    const { bytesRead } = await fh.read(buf, 0, n, 0);
    return buf.subarray(0, bytesRead);
  } catch {
    return null;
  } finally {
    if (fh) await fh.close().catch(() => {});
  }
}

/**
 * Lightweight local integrity probe — no external calls.
 * @param {string} filePath
 * @param {number} size
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
export async function probeIntegrity(filePath, size) {
  if (size < MIN_VALID_BYTES) {
    return { ok: false, reason: 'empty file (0 bytes)' };
  }
  const header = await readHeader(filePath, 32);
  return inspectHeader(header, path.extname(filePath).toLowerCase(), size);
}

/**
 * Decide whether a remote album file is already present and usable locally.
 *
 * @param {Map<string, LocalFileInfo>} index
 * @param {object} opts
 * @param {string} opts.fileName          planned local basename
 * @param {number} [opts.expectedSize=0]  size from preview / Content-Length (0 = unknown)
 * @param {boolean} [opts.checkMagic=true] sniff file headers locally
 * @param {number} [opts.sizeTolerance=0] allowed absolute byte difference vs expectedSize
 * @returns {Promise<MatchResult>}
 */
export async function matchLocalFile(index, { fileName, ...opts } = {}) {
  return judgeLocalFile(findLocalFile(index, fileName), {
    ...opts,
    readHeader: (local, n) => readHeader(local.path, n),
  });
}

/**
 * Build album output path consistently with the downloader.
 * @param {string} outputDir
 * @param {string} albumName
 * @param {import('./name-cipher.js').NameRule[]} [nameRules]
 */
export function albumOutputPath(outputDir, albumName, nameRules = []) {
  return path.join(outputDir, cipherAlbumName(albumName || 'Direct', nameRules));
}

async function isDir(p) {
  try {
    return (await fsp.stat(p)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Folder to show for an album: the folder a download wrote (albumDir), else the one
 * outputDir + albumName map to, else the download folder itself (albumMissing: true).
 *
 * @param {{ albumDir?: string, outputDir?: string, albumName?: string, nameRules?: import('./name-cipher.js').NameRule[] }} [opts]
 * @returns {Promise<{ path: string, albumMissing: boolean } | null>} null when none of them exists
 */
export async function findAlbumFolder({ albumDir = '', outputDir = '', albumName = '', nameRules = [] } = {}) {
  const candidates = [albumDir, outputDir ? albumOutputPath(outputDir, albumName, nameRules) : ''];
  for (const p of candidates) {
    if (p && await isDir(p)) return { path: p, albumMissing: false };
  }
  if (outputDir && await isDir(outputDir)) return { path: outputDir, albumMissing: true };
  return null;
}

/**
 * Match a list of preview/remote files against a local folder.
 * Purely local; does not network.
 *
 * @param {string} albumDir
 * @param {Array<{ fileName?: string, sizeBytes?: number, pageUrl?: string }>} files
 * @param {{ checkMagic?: boolean, sizeTolerance?: number, nameRules?: import('./name-cipher.js').NameRule[] }} [opts]
 * @returns {Promise<{ indexSize: number, results: Array<object> }>}
 */
export async function analyzeAlbumFiles(albumDir, files, opts = {}) {
  const index = await scanLocalDir(albumDir, { recursive: false });
  // Unique physical files (index has duplicate case keys)
  const seenPaths = new Set();
  let physicalCount = 0;
  for (const info of index.values()) {
    if (seenPaths.has(info.path)) continue;
    seenPaths.add(info.path);
    physicalCount++;
  }

  const results = [];
  const nameRules = opts.nameRules || [];
  for (const f of files || []) {
    const fileName = f.fileName ? cipherFileName(f.fileName, nameRules) : '';
    const match = fileName
      ? await matchLocalFile(index, {
          fileName,
          expectedSize: f.sizeBytes || 0,
          checkMagic: opts.checkMagic !== false,
          sizeTolerance: opts.sizeTolerance || 0,
        })
      : { status: 'missing', local: null, reason: 'no filename from preview' };

    results.push({
      pageUrl: f.pageUrl || '',
      fileName,
      expectedSize: f.sizeBytes || 0,
      status: match.status,
      reason: match.reason,
      localSize: match.local?.size ?? 0,
      localPath: match.local?.path ?? '',
    });
  }

  return { indexSize: physicalCount, albumDir, results };
}

/**
 * Synchronous existence check used at download time (after name is resolved).
 * Prefer matchLocalFile when you need full status; this is a fast path.
 *
 * @param {string} dest absolute planned path
 * @param {{ expectedSize?: number, checkMagic?: boolean }} [opts]
 * @returns {Promise<MatchResult>}
 */
export async function checkDestFile(dest, { expectedSize = 0, checkMagic = true } = {}) {
  try {
    const st = await fsp.stat(dest);
    if (!st.isFile()) {
      return { status: 'missing', local: null, reason: 'path is not a file' };
    }
    const local = { name: path.basename(dest), path: dest, size: st.size, mtimeMs: st.mtimeMs };
    const index = new Map([[local.name, local], [local.name.toLowerCase(), local]]);
    return matchLocalFile(index, {
      fileName: local.name,
      expectedSize,
      checkMagic,
    });
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      return { status: 'missing', local: null, reason: 'not found' };
    }
    return { status: 'missing', local: null, reason: e.message || 'stat failed' };
  }
}

/**
 * Remove a leftover .part next to dest if present (best-effort, local only).
 * @param {string} dest
 */
export async function cleanupPartFile(dest) {
  const part = dest + '.part';
  try {
    await fsp.unlink(part);
  } catch {
    // ignore
  }
}

// Re-export sanitize helper consumers may need for path building
export { sanitize };
