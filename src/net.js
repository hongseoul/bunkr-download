/**
 * Node network layer: axios clients, proxy and speed limiting.
 * Platform-neutral helpers (retry, errors, size parsing) live in net-core.js and are
 * re-exported here, so callers keep importing from './net.js'.
 */

import axios from 'axios';
import { Transform } from 'node:stream';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { BROWSER_HEADERS, Bucket } from './net-core.js';

export {
  BROWSER_HEADERS,
  sleep,
  abortError,
  isAbortError,
  HttpError,
  MaintenanceError,
  parseRetryAfter,
  toHttpError,
  isRetryable,
  backoffMs,
  retry,
  parseSize,
} from './net-core.js';

// ---------- runtime options (proxy / rate limit) ----------

const options = { proxy: '', limitRate: 0 };
let proxyAgent = null;

/** @param {{ proxy?: string, limitRate?: number }} next  limitRate in bytes/second, 0 = unlimited */
export function setNetworkOptions(next = {}) {
  if (next.proxy !== undefined) {
    options.proxy = String(next.proxy || '').trim();
    proxyAgent = options.proxy ? makeProxyAgent(options.proxy) : null;
  }
  if (next.limitRate !== undefined) {
    options.limitRate = Math.max(0, Number(next.limitRate) || 0);
    bucket.setRate(options.limitRate);
  }
}

export function getNetworkOptions() {
  return { ...options };
}

function makeProxyAgent(url) {
  let u;
  try {
    u = new URL(url);
  } catch {
    throw new Error(`Invalid proxy URL: ${url}`);
  }
  if (/^socks/i.test(u.protocol)) return new SocksProxyAgent(url);
  if (/^https?:$/i.test(u.protocol)) return new HttpsProxyAgent(url);
  throw new Error(`Unsupported proxy protocol: ${u.protocol}`);
}

function applyProxy(config) {
  if (proxyAgent) {
    config.httpAgent = proxyAgent;
    config.httpsAgent = proxyAgent;
    config.proxy = false;
  }
  return config;
}

function makeClient(extra = {}) {
  const client = axios.create({
    timeout: 45000,
    maxRedirects: 10,
    headers: { ...BROWSER_HEADERS },
    ...extra,
  });
  client.interceptors.request.use(applyProxy);
  return client;
}

/** Pages / JSON: any status below 500 is returned to the caller. */
export const mediaClient = makeClient({ validateStatus: (s) => s < 500 });
export const albumClient = makeClient({
  headers: { ...BROWSER_HEADERS, Referer: 'https://www.google.com/' },
  validateStatus: (s) => s < 500,
});
/** File bodies: anything outside 2xx is an error, never written to disk. */
export const downloadClient = makeClient({ validateStatus: (s) => s >= 200 && s < 300 });

// ---------- speed limit ----------

/** Shared token bucket: one limit across every concurrent download. */
const bucket = new Bucket();

/** Transform that enforces the shared limit; a pass-through when no limit is set. */
export function createThrottle() {
  return new Transform({
    transform(chunk, _enc, cb) {
      const wait = bucket.take(chunk.length);
      if (wait <= 0) return cb(null, chunk);
      setTimeout(() => cb(null, chunk), wait);
    },
  });
}
