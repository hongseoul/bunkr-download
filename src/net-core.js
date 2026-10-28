/**
 * Platform-neutral network helpers: retry/backoff, error types, size parsing and the
 * speed-limit token bucket. No Node or browser APIs, so the CLI, the Electron app and the
 * Chrome extension all share it.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36';

export const BROWSER_HEADERS = {
  'User-Agent': UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Doc': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Dest': 'document',
  'Upgrade-Insecure-Requests': '1',
};

export const sleep = (ms, signal) =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(t);
      reject(abortError());
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export function abortError() {
  const e = new Error('Aborted');
  e.name = 'AbortError';
  e.code = 'ABORT_ERR';
  return e;
}

export function isAbortError(e) {
  return !!e && (e.name === 'AbortError' || e.code === 'ABORT_ERR' || e.code === 'ERR_CANCELED' || e.name === 'CanceledError');
}

// ---------- errors / retry ----------

export class HttpError extends Error {
  constructor(status, url, { retryAfterMs = null } = {}) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
    this.url = url;
    this.retryAfterMs = retryAfterMs;
  }
}

/** Raised when a response is recognised as Bunkr maintenance. */
export class MaintenanceError extends Error {
  constructor(message = 'Bunkr is under maintenance') {
    super(message);
    this.name = 'MaintenanceError';
    this.retryable = false; // the download runner waits on maintenance itself, with long delays
    this.maintenance = true;
  }
}

export function parseRetryAfter(value) {
  if (value == null || value === '') return null;
  const s = Number(value);
  if (Number.isFinite(s)) return Math.max(0, s * 1000);
  const t = Date.parse(value);
  return Number.isFinite(t) ? Math.max(0, t - Date.now()) : null;
}

/** Convert an axios error with a response into an HttpError (draining the body stream). */
export function toHttpError(e, url) {
  const res = e?.response;
  if (!res) return e;
  try { res.data?.destroy?.(); } catch { /* ignore */ }
  return new HttpError(res.status, url, { retryAfterMs: parseRetryAfter(res.headers?.['retry-after']) });
}

const NET_CODES = new Set([
  'ECONNRESET', 'ECONNABORTED', 'ETIMEDOUT', 'ECONNREFUSED', 'EPIPE', 'EAI_AGAIN',
  'ENETUNREACH', 'EHOSTUNREACH', 'UND_ERR_SOCKET', 'UND_ERR_CONNECT_TIMEOUT',
  'ERR_STREAM_PREMATURE_CLOSE',
]);

export function isRetryable(e) {
  if (!e || isAbortError(e)) return false;
  if (e.retryable) return true;
  const s = e instanceof HttpError ? e.status : e.response?.status;
  if (s) return s === 403 || s === 408 || s === 425 || s === 429 || (s >= 500 && s <= 599);
  if (e.code && NET_CODES.has(e.code)) return true;
  return e.message === 'aborted';
}

export function backoffMs(attempt, e, baseMs = 800) {
  if (e?.retryAfterMs != null) return Math.min(e.retryAfterMs, 5 * 60_000);
  return baseMs * Math.pow(2, attempt) + Math.floor(Math.random() * baseMs * 0.5);
}

/**
 * Run fn(attempt) with retries. A 403 is retried once only; abort errors never retry.
 * @param {(attempt: number) => Promise<T>} fn
 * @param {{ max?: number, baseMs?: number, signal?: AbortSignal, onRetry?: (e: Error, attempt: number, delayMs: number) => void }} [opts]
 * @template T
 */
export async function retry(fn, { max = 4, baseMs = 800, signal, onRetry } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (e) {
      if (signal?.aborted || isAbortError(e)) throw e;
      const limit = e instanceof HttpError && e.status === 403 ? Math.min(max, 1) : max;
      if (!isRetryable(e) || attempt >= limit) throw e;
      const delay = backoffMs(attempt, e, baseMs);
      if (onRetry) onRetry(e, attempt + 1, delay);
      await sleep(delay, signal);
    }
  }
}

// ---------- speed limit ----------

/** Token bucket: one instance enforces one limit across every concurrent download. */
export class Bucket {
  constructor() {
    this.rate = 0;
    this.tokens = 0;
    this.last = Date.now();
  }

  setRate(rate) {
    this.rate = rate;
    this.tokens = rate;
    this.last = Date.now();
  }

  /** @returns {number} ms to wait before `n` bytes may pass */
  take(n) {
    if (!this.rate) return 0;
    const now = Date.now();
    this.tokens = Math.min(this.rate, this.tokens + ((now - this.last) / 1000) * this.rate);
    this.last = now;
    this.tokens -= n;
    return this.tokens >= 0 ? 0 : Math.ceil((-this.tokens / this.rate) * 1000);
  }
}

/** Parse "500k", "2M", "1.5G", "1048576" to a byte count. Returns 0 for empty input. */
export function parseSize(text) {
  if (text == null || text === '') return 0;
  if (typeof text === 'number') return Math.max(0, Math.floor(text));
  const m = /^\s*([\d.]+)\s*([kmgt]?)i?b?\s*(?:\/s)?\s*$/i.exec(String(text));
  if (!m) throw new Error(`Invalid size: "${text}" (examples: 500k, 2M, 1.5G)`);
  const mult = { '': 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3, t: 1024 ** 4 }[m[2].toLowerCase()];
  return Math.floor(parseFloat(m[1]) * mult);
}
