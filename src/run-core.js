/**
 * Platform-neutral download runner shared by the CLI, the Electron app and the Chrome
 * extension. Everything that touches a file system goes through `io`, so each platform
 * plugs in its own writer while the scheduling, retries, maintenance waits, name
 * de-duplication and progress events stay identical.
 */

import pLimit from 'p-limit';
import { resolveMediaUrl, sanitize } from './parser.js';
import { shouldSkipLocal } from './local-core.js';
import { cipherFileName } from './name-cipher.js';
import { isAbortError, sleep } from './net-core.js';

/**
 * @typedef {object} RunIo
 * @property {(dir: string) => (void | Promise<void>)} ensureDir
 * @property {(...parts: string[]) => string} join
 * @property {(p: string) => string} basename
 * @property {(p: string) => string} extname
 * @property {(dest: string, o: { expectedSize: number, checkMagic: boolean }) => Promise<import('./local-core.js').MatchResult>} checkDestFile
 * @property {(p: object) => Promise<string>} downloadFile  same contract as downloader.js downloadFile
 */

/** Last path segment of a URL, decoded ("" when there is none). */
export function filenameFromUrl(url) {
  let pathname;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = String(url || '').split(/[?#]/)[0];
  }
  const base = pathname.split('/').filter(Boolean).pop();
  if (!base) return '';
  try {
    return decodeURIComponent(base).replace(/\+/g, ' ');
  } catch {
    return base;
  }
}

/**
 * Pick a file name that does not collide with another file of the same run.
 * @param {RunIo} io
 * @param {string} albumDir
 * @param {string} name
 * @param {Set<string>} taken  lowercased full paths already used in this run
 */
function uniqueDest(io, albumDir, name, taken) {
  const ext = io.extname(name);
  const stem = ext ? name.slice(0, -ext.length) : name;
  let candidate = name;
  for (let n = 1; taken.has(io.join(albumDir, candidate).toLowerCase()); n++) {
    candidate = `${stem} (${n})${ext}`;
  }
  const full = io.join(albumDir, candidate);
  taken.add(full.toLowerCase());
  return full;
}

/**
 * Shared download engine.
 *
 * Files go through a small resolve pool (Bunkr rate-limits file-page requests hard) and
 * a larger download pool. Progress is reported through `onEvent`; every event carries
 * running counters, so a UI can render it without keeping state.
 *
 * Event stages: resolving | waiting | downloading | chunk | retry | skipped | done | failed
 *
 * @param {object} opts
 * @param {RunIo} opts.io
 * @param {string} opts.albumDir
 * @param {string} [opts.albumUrl]  used as Referer when resolving
 * @param {Array<{ pageUrl: string, fileName?: string, sizeBytes?: number, direct?: boolean }>} opts.files
 * @param {number} [opts.concurrency=4]
 * @param {(ev: object) => void} [opts.onEvent]
 * @param {AbortSignal} [opts.signal]
 * @param {boolean} [opts.skipExisting=false]
 * @param {boolean} [opts.checkMagic=true]
 * @param {boolean} [opts.redownloadMismatch=true]
 * @param {import('./name-cipher.js').NameRule[]} [opts.nameRules]
 * @param {number} [opts.maxRetries=5]
 * @param {number} [opts.retryBaseMs=800]
 * @param {'backoff'|'skip'} [opts.maintenanceStrategy='backoff']
 * @param {number[]} [opts.maintenanceDelaysMs]
 * @param {(pageUrl: string, referer: string, o: { signal?: AbortSignal }) => Promise<string|{url: string, filename?: string}>} [opts.resolve]
 * @returns {Promise<Array<{ url: string, ok: boolean, dest?: string, skipped?: boolean, stopped?: boolean, error?: string, reason?: string }>>}
 */
export async function runDownloadWith({
  io,
  albumDir,
  albumUrl = '',
  files,
  concurrency = 4,
  onEvent = () => {},
  signal,
  skipExisting = false,
  checkMagic = true,
  redownloadMismatch = true,
  nameRules = [],
  maxRetries = 5,
  retryBaseMs = 800,
  maintenanceStrategy = 'backoff',
  maintenanceDelaysMs = [120_000, 300_000, 600_000],
  resolve = resolveMediaUrl,
}) {
  await io.ensureDir(albumDir);
  const resolveLimit = pLimit(Math.min(2, concurrency));
  const downloadLimit = pLimit(concurrency);

  const total = files.length;
  const counters = { completed: 0, failed: 0, skipped: 0 };
  const emit = (index, file, stage, info = {}) =>
    onEvent({ index, pageUrl: file.pageUrl, stage, total, ...counters, ...info });

  // Names known from the listing are de-duplicated in album order, so repeated runs give
  // the same `name (1).ext` to the same file regardless of which request finishes first.
  const taken = new Set();
  const planned = files.map((f) => {
    if (!f.fileName) return null;
    const base = cipherFileName(sanitize(f.fileName), nameRules);
    return { base, dest: uniqueDest(io, albumDir, base, taken) };
  });

  const settle = (index, file, result) => {
    if (result.stopped) return result;
    counters.completed++;
    if (!result.ok) counters.failed++;
    else if (result.skipped) counters.skipped++;
    return result;
  };

  const tasks = files.map((file, index) =>
    resolveLimit(async () => {
      if (signal?.aborted) return { url: file.pageUrl, ok: false, stopped: true };

      emit(index, file, 'resolving');
      let resolved;
      try {
        resolved = await resolveWithMaintenance();
      } catch (e) {
        if (signal?.aborted || isAbortError(e)) return { url: file.pageUrl, ok: false, stopped: true };
        const r = settle(index, file, { url: file.pageUrl, ok: false, error: e.message });
        emit(index, file, 'failed', { error: e.message });
        return r;
      }

      async function resolveWithMaintenance() {
        // Direct CDN links are not Bunkr file pages: there is nothing to resolve.
        if (file.direct) return { url: file.pageUrl };
        for (let i = 0; ; i++) {
          try {
            return await resolve(file.pageUrl, albumUrl, { signal });
          } catch (e) {
            if (!e.maintenance) throw e;
            if (maintenanceStrategy === 'skip' || i >= maintenanceDelaysMs.length) {
              throw new Error('Bunkr is under maintenance - try again later');
            }
            emit(index, file, 'waiting', { reason: 'maintenance', delayMs: maintenanceDelaysMs[i] });
            await sleep(maintenanceDelaysMs[i], signal);
          }
        }
      }

      const directUrl = typeof resolved === 'string' ? resolved : resolved.url;
      const resolvedName = typeof resolved === 'object' && resolved.filename ? resolved.filename : '';

      return downloadLimit(async () => {
        if (signal?.aborted) return { url: file.pageUrl, ok: false, stopped: true };
        try {
          const wanted = cipherFileName(
            sanitize(resolvedName || file.fileName || filenameFromUrl(directUrl) || 'unknown'),
            nameRules
          );
          const plan = planned[index];
          const dest = plan && plan.base === wanted ? plan.dest : uniqueDest(io, albumDir, wanted, taken);
          const name = io.basename(dest);

          if (skipExisting) {
            const match = await io.checkDestFile(dest, { expectedSize: file.sizeBytes || 0, checkMagic });
            if (shouldSkipLocal(match, { skipExisting, redownloadMismatch })) {
              const r = settle(index, file, { url: file.pageUrl, ok: true, dest, skipped: true, reason: match.reason });
              emit(index, file, 'skipped', { fileName: name, dest, reason: match.reason });
              return r;
            }
            if (match.local && match.status !== 'missing') {
              emit(index, file, 'retry', { fileName: name, reason: `re-download: ${match.reason}` });
            }
          }

          emit(index, file, 'downloading', { fileName: name });
          const finalDest = await io.downloadFile({
            url: directUrl,
            referer: file.pageUrl,
            dest,
            expectedSize: file.sizeBytes || 0,
            maxRetries,
            retryBaseMs,
            signal,
            onProgress: (recv, sizeTotal) => emit(index, file, 'chunk', { recv, fileTotal: sizeTotal }),
            onRetry: (err, attempt, delayMs) =>
              emit(index, file, 'retry', { fileName: name, attempt, delayMs, reason: err.message }),
          });
          const r = settle(index, file, { url: file.pageUrl, ok: true, dest: finalDest, skipped: false });
          emit(index, file, 'done', { dest: finalDest });
          return r;
        } catch (e) {
          if (signal?.aborted || isAbortError(e)) return { url: file.pageUrl, ok: false, stopped: true };
          const r = settle(index, file, { url: file.pageUrl, ok: false, error: e.message });
          emit(index, file, 'failed', { error: e.message });
          return r;
        }
      });
    })
  );

  return Promise.all(tasks);
}
