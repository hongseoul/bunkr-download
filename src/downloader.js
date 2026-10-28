import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';
import cliProgress from 'cli-progress';
import { filenameFromResponse, sanitize } from './parser.js';
import { checkDestFile } from './local-index.js';
import { cipherAlbumName } from './name-cipher.js';
import { filenameFromUrl, runDownloadWith } from './run-core.js';
import {
  downloadClient,
  createThrottle,
  getNetworkOptions,
  isAbortError,
  retry,
  toHttpError,
} from './net.js';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

async function sizeOf(file) {
  try {
    return (await fsp.stat(file)).size;
  } catch {
    return 0;
  }
}

/** Transient failure whose partial data is still usable for a Range resume. */
function retryable(message) {
  const e = new Error(message);
  e.retryable = true;
  return e;
}

const NON_HTML_EXT = /\.(?:html?|json|txt|xml)$/i;

/**
 * Download one file to `dest`, writing `dest.part` first.
 *
 * - Anything outside 2xx is an error; error bodies are never written to disk.
 * - Interrupted downloads (network error, abort, truncated body) keep `.part`, and the
 *   next attempt resumes with an HTTP Range request.
 * - The finished size is checked against Content-Length / `expectedSize` before the
 *   `.part` is renamed.
 *
 * @param {object} p
 * @param {string} p.url
 * @param {string} p.dest
 * @param {string} [p.referer]
 * @param {(received: number, total: number) => void} [p.onProgress]
 * @param {(err: Error, attempt: number, delayMs: number) => void} [p.onRetry]
 * @param {AbortSignal} [p.signal]
 * @param {number} [p.maxRetries=5]
 * @param {number} [p.retryBaseMs=800]
 * @param {number} [p.expectedSize=0]  size from the album listing, 0 = unknown
 * @returns {Promise<string>} final path
 */
async function downloadFile({
  url,
  dest,
  referer,
  onProgress,
  onRetry,
  signal,
  maxRetries = 5,
  retryBaseMs = 800,
  expectedSize = 0,
}) {
  return retry(
    () => attemptDownload({ url, dest, referer, onProgress, signal, expectedSize }),
    { max: maxRetries, baseMs: retryBaseMs, signal, onRetry }
  );
}

async function attemptDownload({ url, dest, referer, onProgress, signal, expectedSize }, allowRange = true) {
  const tmp = dest + '.part';
  let existing = allowRange ? await sizeOf(tmp) : 0;
  if (!allowRange) await fsp.unlink(tmp).catch(() => {});
  if (existing > 0 && expectedSize > 0 && existing > expectedSize) {
    await fsp.unlink(tmp).catch(() => {});
    existing = 0;
  }

  // Bodies are streamed as-is: with gzip, Content-Length would not match the bytes we write.
  const headers = { 'Accept-Encoding': 'identity' };
  if (referer) headers.Referer = referer;
  if (existing > 0) headers.Range = `bytes=${existing}-`;

  let response;
  try {
    response = await downloadClient.get(url, { responseType: 'stream', signal, headers });
  } catch (e) {
    if (isAbortError(e) || signal?.aborted) throw e;
    if (e.response?.status === 416) {
      const total = Number(/\/(\d+)\s*$/.exec(e.response.headers?.['content-range'] || '')?.[1] || 0);
      try { e.response.data?.destroy?.(); } catch { /* ignore */ }
      if (existing > 0 && total === existing) return finalizeDownload(tmp, dest, url, null);
      return attemptDownload({ url, dest, referer, onProgress, signal, expectedSize }, false);
    }
    throw toHttpError(e, url);
  }

  const stream = response.data;
  const contentType = String(response.headers['content-type'] || '');
  if (/text\/html|application\/json/i.test(contentType) && !NON_HTML_EXT.test(dest)) {
    stream.destroy();
    await fsp.unlink(tmp).catch(() => {});
    throw retryable(`Server returned ${contentType.split(';')[0]} instead of a file: ${url}`);
  }

  let append = false;
  if (response.status === 206 && existing > 0) {
    const start = Number(/bytes\s+(\d+)-/i.exec(response.headers['content-range'] || '')?.[1]);
    if (start !== existing) {
      stream.destroy();
      return attemptDownload({ url, dest, referer, onProgress, signal, expectedSize }, false);
    }
    append = true;
  } else {
    existing = 0;
  }

  const length = Number(response.headers['content-length']) || 0;
  const total = length > 0 ? existing + length : expectedSize;

  let received = existing;
  stream.on('data', (chunk) => {
    received += chunk.length;
    if (onProgress) onProgress(received, total);
  });

  const stages = [stream];
  if (getNetworkOptions().limitRate) stages.push(createThrottle());
  stages.push(fs.createWriteStream(tmp, { flags: append ? 'a' : 'w' }));
  // On error or abort the .part stays on disk so the next attempt can resume it.
  await pipeline(...stages, { signal });

  return finalizeDownload(tmp, dest, url, total, response);
}

async function finalizeDownload(tmp, dest, url, total, response) {
  const size = await sizeOf(tmp);
  if (total > 0 && size < total) {
    throw retryable(`Incomplete download: got ${size} of ${total} bytes (${url})`);
  }
  if (total > 0 && size > total) {
    await fsp.unlink(tmp).catch(() => {});
    throw retryable(`Downloaded ${size} bytes but expected ${total} (${url})`);
  }

  let finalName = path.basename(dest);
  if (!finalName || finalName === 'unknown' || finalName.startsWith('__')) {
    finalName = sanitize(response ? filenameFromResponse(response, url) : filenameFromUrl(url)) || 'unknown';
  }
  const finalDest = path.join(path.dirname(dest), finalName);
  // Replace any previous broken copy
  await fsp.unlink(finalDest).catch(() => {});
  await fsp.rename(tmp, finalDest);
  return finalDest;
}

/** Node file-system side of the shared runner (run-core.js). */
const nodeIo = {
  ensureDir,
  join: path.join,
  basename: path.basename,
  extname: path.extname,
  checkDestFile,
  downloadFile,
};

/**
 * Shared download engine for the CLI and the GUI, writing to the local file system.
 * Options and events: see runDownloadWith in run-core.js.
 * @param {Omit<Parameters<typeof runDownloadWith>[0], 'io'>} opts
 */
export function runDownload(opts) {
  return runDownloadWith({ ...opts, io: nodeIo });
}

/**
 * CLI wrapper: download an album (or the synthetic "Direct" album) with console progress.
 * @param {object} opts
 * @param {object} opts.album
 * @param {string} opts.outputDir
 * @param {number} opts.concurrency
 * @param {((file: object) => boolean) | null} [opts.filterFn]  receives { pageUrl, fileName, sizeBytes, ext }
 * @param {import('./logger.js').Logger} opts.logger
 */
export async function downloadAlbum({
  album,
  outputDir,
  concurrency,
  filterFn,
  logger,
  skipExisting = false,
  checkMagic = true,
  redownloadMismatch = true,
  nameRules = [],
  maxRetries = 5,
  maintenanceStrategy = 'backoff',
  signal,
}) {
  ensureDir(outputDir);
  const albumDir = path.join(outputDir, cipherAlbumName(album.albumName, nameRules));

  let files = album.files;
  if (filterFn) files = files.filter((f) => filterFn(f));

  const useBars = process.stdout.isTTY && !!files.length;
  const multibar = useBars
    ? new cliProgress.MultiBar(
        {
          format: ' {bar} {percentage}% | {value}/{total} | {name}',
          hideCursor: true,
          clearOnComplete: true,
          barsize: 24,
          autopadding: true,
          forceRedraw: false,
        },
        cliProgress.Presets.shades_classic
      )
    : null;
  const overall = multibar ? multibar.create(files.length, 0, { name: 'album' }) : null;
  const bars = new Map();
  const prevSink = logger.sink;
  if (multibar) logger.sink = (text) => multibar.log(text + '\n');

  const closeBar = (index) => {
    const b = bars.get(index);
    if (b) {
      multibar.remove(b);
      bars.delete(index);
    }
  };

  const onEvent = (ev) => {
    const label = ev.fileName || ev.pageUrl;
    switch (ev.stage) {
      case 'chunk': {
        if (!multibar) break;
        let b = bars.get(ev.index);
        if (!b && ev.fileTotal > 1024) {
          b = multibar.create(ev.fileTotal, 0, { name: label.slice(-40) });
          bars.set(ev.index, b);
        }
        if (b) b.update(ev.recv);
        break;
      }
      case 'done':
        closeBar(ev.index);
        logger.ok(`OK  ${ev.dest}`);
        break;
      case 'skipped':
        logger.ok(`SKIP ${ev.dest} (${ev.reason})`);
        break;
      case 'failed':
        closeBar(ev.index);
        logger.fail(`${ev.pageUrl} -> ${ev.error}`);
        break;
      case 'retry':
        if (ev.attempt) logger.warn(`Retry ${ev.attempt} for ${label}: ${ev.reason}`);
        else logger.warn(`${label}: ${ev.reason}`);
        break;
      case 'waiting':
        logger.warn(`Bunkr maintenance detected, waiting ${Math.round(ev.delayMs / 1000)}s before retrying`);
        break;
      default:
        break;
    }
    if (overall && ev.completed !== undefined) overall.update(ev.completed);
  };

  try {
    return await runDownload({
      albumDir,
      albumUrl: album.albumUrl,
      files,
      concurrency,
      onEvent,
      signal,
      skipExisting,
      checkMagic,
      redownloadMismatch,
      nameRules,
      maxRetries,
      maintenanceStrategy,
    });
  } finally {
    if (multibar) multibar.stop();
    logger.sink = prevSink;
  }
}

export { ensureDir, downloadFile };
export default { downloadAlbum, runDownload };
