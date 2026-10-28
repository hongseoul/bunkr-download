/**
 * File-system side of the shared runner (src/run-core.js) for the extension: writes into
 * a folder the user picked (File System Access API) with the same guarantees as the
 * desktop downloader (src/downloader.js):
 *
 * - Anything outside 2xx is an error; error bodies are never written to disk.
 * - An interrupted download (network error, Stop, truncated body) keeps the bytes that
 *   arrived, and the next attempt resumes with an HTTP Range request.
 * - The finished size is checked against Content-Length / the expected size.
 *
 * Paths are "<folder label>/<album>/<file>". A browser cannot rename local files reliably,
 * so a file is written under its final name and listed in a `partials` registry until it
 * is complete; Check disk reports such files as incomplete.
 */

import { HttpError, isAbortError, parseRetryAfter, retry } from '../../src/net-core.js';
import { judgeLocalFile } from '../../src/local-core.js';
import { cipherFileName } from '../../src/name-cipher.js';
import { sanitize } from '../../src/parser.js';
import { createThrottle, getNetworkOptions } from './net-browser.js';
import { applyRequestHeaders } from './header-rules.js';

const NON_HTML_EXT = /\.(?:html?|json|txt|xml)$/i;

export function joinPath(...parts) {
  return parts.flatMap((p) => String(p ?? '').split('/')).filter(Boolean).join('/');
}

export function basename(p) {
  return String(p).split('/').filter(Boolean).pop() || '';
}

export function extname(p) {
  const b = basename(p);
  const i = b.lastIndexOf('.');
  return i > 0 ? b.slice(i) : '';
}

/** Transient failure whose partial data is still usable for a Range resume. */
function retryable(message) {
  const e = new Error(message);
  e.retryable = true;
  return e;
}

const isMissing = (e) => e?.name === 'NotFoundError' || e?.name === 'TypeMismatchError';

/**
 * @param {object} deps
 * @param {(label: string) => Promise<FileSystemDirectoryHandle>} deps.getRoot  folder for a label
 * @param {{ has: (p: string) => Promise<boolean>, set: (p: string) => Promise<void>, delete: (p: string) => Promise<void> }} deps.partials
 */
export function createFsIo({ getRoot, partials }) {
  async function dirAt(segments, { create }) {
    let dir = await getRoot(segments[0]);
    for (const seg of segments.slice(1)) dir = await dir.getDirectoryHandle(seg, { create });
    return dir;
  }

  /** Parent folder handle and file name of a path. */
  async function locate(p, { create }) {
    const segments = String(p).split('/').filter(Boolean);
    const name = segments.pop();
    return { dir: await dirAt(segments, { create }), name };
  }

  async function ensureDir(p) {
    await dirAt(String(p).split('/').filter(Boolean), { create: true });
  }

  async function sizeIn(dir, name) {
    try {
      return (await (await dir.getFileHandle(name)).getFile()).size;
    } catch (e) {
      if (isMissing(e)) return 0;
      throw e;
    }
  }

  async function checkDestFile(dest, { expectedSize = 0, checkMagic = true } = {}) {
    let file;
    try {
      const { dir, name } = await locate(dest, { create: false });
      file = await (await dir.getFileHandle(name)).getFile();
    } catch (e) {
      if (isMissing(e)) return { status: 'missing', local: null, reason: 'not found' };
      throw e;
    }
    const local = { name: basename(dest), path: dest, size: file.size, mtimeMs: file.lastModified };
    if (await partials.has(dest)) return { status: 'incomplete', local, reason: 'download did not finish' };
    return judgeLocalFile(local, {
      expectedSize,
      checkMagic,
      readHeader: async (_l, n) => new Uint8Array(await file.slice(0, n).arrayBuffer()),
    });
  }

  async function finish(dir, name, dest, total) {
    const size = await sizeIn(dir, name);
    if (total > 0 && size < total) {
      throw retryable(`Incomplete download: got ${size} of ${total} bytes (${dest})`);
    }
    if (total > 0 && size > total) {
      await dir.removeEntry(name).catch(() => {});
      await partials.delete(dest);
      throw retryable(`Downloaded ${size} bytes but expected ${total} (${dest})`);
    }
    await partials.delete(dest);
    return dest;
  }

  async function attempt(p, allowRange = true) {
    const { url, dest, referer, onProgress, signal, expectedSize } = p;
    const { dir, name } = await locate(dest, { create: true });

    let existing = 0;
    if (allowRange && (await partials.has(dest))) {
      existing = await sizeIn(dir, name);
      if (existing > 0 && expectedSize > 0 && existing > expectedSize) existing = 0;
    }

    const headers = {};
    if (existing > 0) headers.Range = `bytes=${existing}-`;
    if (referer) await applyRequestHeaders(url, { referer });

    let res;
    try {
      res = await fetch(url, { headers, signal, cache: 'no-store' });
    } catch (e) {
      if (isAbortError(e) || signal?.aborted) throw e;
      throw retryable(`Network error: ${e.message} (${url})`);
    }
    const drop = () => res.body?.cancel().catch(() => {});

    if (res.status === 416) {
      const total = Number(/\/(\d+)\s*$/.exec(res.headers.get('content-range') || '')?.[1] || 0);
      await drop();
      if (existing > 0 && total === existing) return finish(dir, name, dest, null);
      return attempt(p, false);
    }
    if (!res.ok) {
      await drop();
      throw new HttpError(res.status, url, { retryAfterMs: parseRetryAfter(res.headers.get('retry-after')) });
    }
    const contentType = res.headers.get('content-type') || '';
    if (/text\/html|application\/json/i.test(contentType) && !NON_HTML_EXT.test(dest)) {
      await drop();
      throw retryable(`Server returned ${contentType.split(';')[0]} instead of a file: ${url}`);
    }

    let append = false;
    if (res.status === 206 && existing > 0) {
      const start = Number(/bytes\s+(\d+)-/i.exec(res.headers.get('content-range') || '')?.[1]);
      if (start !== existing) {
        await drop();
        return attempt(p, false);
      }
      append = true;
    } else {
      existing = 0;
    }

    // A compressed body arrives decoded, so Content-Length would not match the bytes written.
    const length = res.headers.get('content-encoding') ? 0 : Number(res.headers.get('content-length')) || 0;
    const total = length > 0 ? existing + length : expectedSize;

    await partials.set(dest);
    const handle = await dir.getFileHandle(name, { create: true });
    const writable = await handle.createWritable({ keepExistingData: append });
    if (append) await writable.seek(existing);

    let received = existing;
    let body = res.body.pipeThrough(new TransformStream({
      transform(chunk, controller) {
        received += chunk.byteLength;
        if (onProgress) onProgress(received, total);
        controller.enqueue(chunk);
      },
    }));
    if (getNetworkOptions().limitRate) body = body.pipeThrough(createThrottle());

    let pipeError = null;
    try {
      await body.pipeTo(writable, { signal, preventClose: true, preventAbort: true });
    } catch (e) {
      pipeError = e;
    }
    // Commit what arrived, so Stop or a dropped connection resumes from here.
    try {
      await writable.close();
    } catch (e) {
      // After a complete transfer this is Chrome refusing the file (e.g. a blocked type):
      // retrying cannot help, so say so instead of reporting a short download.
      if (!pipeError) throw new Error(`Chrome could not save ${name}: ${e.message}`);
    }
    if (pipeError) {
      if (isAbortError(pipeError) || signal?.aborted) throw pipeError;
      throw retryable(`Download interrupted: ${pipeError.message} (${url})`);
    }
    return finish(dir, name, dest, total);
  }

  /**
   * Download one file to `dest` (same contract as downloader.js downloadFile).
   * @returns {Promise<string>} the path written
   */
  function downloadFile({ url, dest, referer, onProgress, onRetry, signal, maxRetries = 5, retryBaseMs = 800, expectedSize = 0 }) {
    return retry(
      () => attempt({ url, dest, referer, onProgress, signal, expectedSize }),
      { max: maxRetries, baseMs: retryBaseMs, signal, onRetry }
    );
  }

  /** Append text to a file, creating it (errors.log). */
  async function appendText(p, text) {
    const { dir, name } = await locate(p, { create: true });
    const handle = await dir.getFileHandle(name, { create: true });
    const size = (await handle.getFile()).size;
    const w = await handle.createWritable({ keepExistingData: true });
    await w.seek(size);
    await w.write(text);
    await w.close();
  }

  /**
   * Match album files against the album folder (Check disk), like local-index.js
   * analyzeAlbumFiles. Reads only the chosen folder.
   */
  async function analyzeAlbumFiles(albumDir, files, { checkMagic = true, nameRules = [], sizeTolerance = 0 } = {}) {
    const index = new Map();
    let physical = 0;
    let dir = null;
    try {
      dir = await dirAt(String(albumDir).split('/').filter(Boolean), { create: false });
    } catch (e) {
      if (!isMissing(e)) throw e;
    }
    if (dir) {
      for await (const [name, h] of dir.entries()) {
        if (h.kind !== 'file' || name.startsWith('.') || name.endsWith('.crswap')) continue;
        const file = await h.getFile();
        const info = { name, path: joinPath(albumDir, name), size: file.size, mtimeMs: file.lastModified, file };
        physical++;
        index.set(name, info);
        index.set(name.toLowerCase(), info);
      }
    }

    const results = [];
    for (const f of files || []) {
      const fileName = f.fileName ? cipherFileName(f.fileName, nameRules) : '';
      let match;
      if (!fileName) {
        match = { status: 'missing', local: null, reason: 'no filename from preview' };
      } else {
        const key = sanitize(fileName) || fileName;
        const local = index.get(key) || index.get(key.toLowerCase()) || null;
        match = local && (await partials.has(local.path))
          ? { status: 'incomplete', local, reason: 'download did not finish' }
          : await judgeLocalFile(local, {
            expectedSize: f.sizeBytes || 0,
            checkMagic,
            sizeTolerance,
            readHeader: async (l, n) => new Uint8Array(await l.file.slice(0, n).arrayBuffer()),
          });
      }
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
    return { indexSize: physical, albumDir, results };
  }

  return {
    ensureDir,
    join: joinPath,
    basename,
    extname,
    checkDestFile,
    downloadFile,
    appendText,
    analyzeAlbumFiles,
  };
}
