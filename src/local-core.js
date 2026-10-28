/**
 * Platform-neutral decisions for "is this album file already on disk and usable?".
 * The caller supplies what it read from its file system (name, size, header bytes),
 * so the Node scanner (local-index.js) and the Chrome extension share every rule.
 */

/** Minimum bytes to treat a file as non-empty (catches truncated 0-byte writes). */
export const MIN_VALID_BYTES = 1;

/**
 * Known media magic-byte prefixes for a light integrity sniff.
 * Files that are clearly not media (e.g. HTML error pages saved as .jpg) fail.
 * Unknown extensions skip this check.
 */
const MAGIC = [
  { ext: ['.jpg', '.jpeg'], bytes: [[0xff, 0xd8, 0xff]] },
  { ext: ['.png'], bytes: [[0x89, 0x50, 0x4e, 0x47]] },
  { ext: ['.gif'], bytes: [[0x47, 0x49, 0x46, 0x38]] },
  { ext: ['.webp'], bytes: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF….WEBP
  { ext: ['.bmp'], bytes: [[0x42, 0x4d]] },
  { ext: ['.zip'], bytes: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]] },
  { ext: ['.pdf'], bytes: [[0x25, 0x50, 0x44, 0x46]] }, // %PDF
  { ext: ['.rar'], bytes: [[0x52, 0x61, 0x72, 0x21]] },
  { ext: ['.7z'], bytes: [[0x37, 0x7a, 0xbc, 0xaf]] },
];

/**
 * @typedef {'missing' | 'complete' | 'incomplete' | 'size_mismatch' | 'corrupt'} LocalStatus
 */

/**
 * @typedef {object} LocalFileInfo
 * @property {string} name          basename
 * @property {string} path          platform path (absolute on Node, relative in the extension)
 * @property {number} size          bytes on disk
 * @property {number} mtimeMs
 */

/**
 * @typedef {object} MatchResult
 * @property {LocalStatus} status
 * @property {LocalFileInfo | null} local
 * @property {string} reason
 */

/** Lowercased extension with the dot (".mp4"), or "" when there is none. */
export function extOf(name) {
  const base = String(name || '').split(/[\\/]/).pop();
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(dot).toLowerCase() : '';
}

/** First `n` header bytes as lowercase ASCII (bytes masked to 7 bits, like Buffer's 'ascii'). */
function asciiPrefix(header, n) {
  let s = '';
  for (let i = 0; i < Math.min(header.length, n); i++) s += String.fromCharCode(header[i] & 0x7f);
  return s.toLowerCase();
}

/**
 * Judge a file from its size and first bytes — no I/O.
 * @param {Uint8Array | null} header  first bytes of the file (32 is plenty)
 * @param {string} ext                lowercased extension with the dot
 * @param {number} size
 * @returns {{ ok: boolean, reason?: string }}
 */
export function inspectHeader(header, ext, size) {
  if (size < MIN_VALID_BYTES) {
    return { ok: false, reason: 'empty file (0 bytes)' };
  }
  if (!header || header.length === 0) {
    return { ok: false, reason: 'unreadable / empty header' };
  }

  // HTML/JSON error pages sometimes get saved with a media extension after a failed CDN response.
  const ascii = asciiPrefix(header, 16);
  if (
    ascii.startsWith('<!doctype') ||
    ascii.startsWith('<html') ||
    ascii.startsWith('<?xml') ||
    ascii.startsWith('{') ||
    ascii.startsWith('error')
  ) {
    return { ok: false, reason: 'looks like HTML/JSON error body, not media' };
  }

  const rule = MAGIC.find((m) => m.ext.includes(ext));
  if (rule) {
    const matches = rule.bytes.some((sig) => {
      if (header.length < sig.length) return false;
      for (let i = 0; i < sig.length; i++) {
        if (header[i] !== sig[i]) return false;
      }
      return true;
    });
    if (!matches) {
      return { ok: false, reason: `header does not match ${ext} magic bytes` };
    }
  }

  // WebM/MKV: EBML header 0x1A45DFA3
  if ((ext === '.webm' || ext === '.mkv')
    && !(header[0] === 0x1a && header[1] === 0x45 && header[2] === 0xdf && header[3] === 0xa3)) {
    return { ok: false, reason: `header does not match ${ext} EBML signature` };
  }

  return { ok: true };
}

/**
 * Decide whether a remote album file is already present and usable locally.
 *
 * @param {LocalFileInfo | null} local  the matching local file, or null when there is none
 * @param {object} opts
 * @param {number} [opts.expectedSize=0]  size from preview / Content-Length (0 = unknown)
 * @param {boolean} [opts.checkMagic=true] sniff file headers locally
 * @param {number} [opts.sizeTolerance=0] allowed absolute byte difference vs expectedSize
 * @param {(local: LocalFileInfo, n: number) => Promise<Uint8Array | null>} opts.readHeader
 * @returns {Promise<MatchResult>}
 */
export async function judgeLocalFile(local, {
  expectedSize = 0,
  checkMagic = true,
  sizeTolerance = 0,
  readHeader,
} = {}) {
  if (!local) {
    return { status: 'missing', local: null, reason: 'not found in output folder' };
  }

  if (local.size < MIN_VALID_BYTES) {
    return { status: 'incomplete', local, reason: 'empty / zero-byte file' };
  }

  if (expectedSize > 0) {
    const delta = Math.abs(local.size - expectedSize);
    if (delta > sizeTolerance) {
      return {
        status: 'size_mismatch',
        local,
        reason: `local ${local.size} B ≠ expected ${expectedSize} B`,
      };
    }
  }

  if (checkMagic) {
    const header = await readHeader(local, 32);
    const probe = inspectHeader(header, extOf(local.name), local.size);
    if (!probe.ok) {
      return { status: 'corrupt', local, reason: probe.reason || 'integrity probe failed' };
    }
  }

  return { status: 'complete', local, reason: 'present and looks complete' };
}

/**
 * True when the file should not be re-downloaded.
 * @param {MatchResult} match
 */
export function isSkippable(match) {
  return match && match.status === 'complete';
}

/**
 * Skip decision used at download time.
 * Complete files are always skipped when skip-existing is on.
 * Size mismatches are skipped unless redownloadMismatch is true.
 * @param {MatchResult} match
 * @param {{ skipExisting?: boolean, redownloadMismatch?: boolean }} [opts]
 */
export function shouldSkipLocal(match, { skipExisting = false, redownloadMismatch = true } = {}) {
  if (!skipExisting || !match) return false;
  if (match.status === 'complete') return true;
  if (match.status === 'size_mismatch' && !redownloadMismatch) return true;
  return false;
}

/**
 * True when a re-download is warranted (missing or broken).
 * @param {MatchResult} match
 */
export function needsDownload(match) {
  return !isSkippable(match);
}
