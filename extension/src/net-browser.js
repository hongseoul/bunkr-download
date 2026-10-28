/**
 * Browser replacement for src/net.js inside the extension bundle (the build redirects
 * `./net.js` here). Same exports: the shared helpers from net-core plus axios clients,
 * the speed limit and network options — without proxy support, which a page cannot do.
 */

import axios from 'axios';
import { BROWSER_HEADERS, Bucket } from '../../src/net-core.js';
import { applyRequestHeaders } from './header-rules.js';

export * from '../../src/net-core.js';

// Headers a page may not set; the browser supplies its own (Referer/Origin go through
// header-rules.js instead).
const FORBIDDEN = /^(?:user-agent|accept-encoding|referer|origin|cookie|host|connection|content-length|upgrade-insecure-requests|sec-.*)$/i;

function headerValue(headers, name) {
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === name) return v;
  }
  return undefined;
}

async function prepareRequest(config) {
  const headers = config.headers?.toJSON ? config.headers.toJSON() : { ...(config.headers || {}) };
  const referer = headerValue(headers, 'referer');
  for (const name of Object.keys(headers)) {
    if (!FORBIDDEN.test(name)) continue;
    if (typeof config.headers.delete === 'function') config.headers.delete(name);
    else delete config.headers[name];
  }
  if (referer) await applyRequestHeaders(axios.getUri(config), { referer: String(referer) });
  return config;
}

function makeClient(extra = {}) {
  const client = axios.create({
    timeout: 45000,
    headers: { ...BROWSER_HEADERS },
    // Bunkr may sit behind a Cloudflare check that the user passed in a normal tab.
    withCredentials: true,
    ...extra,
  });
  client.interceptors.request.use(prepareRequest);
  return client;
}

/** Pages / JSON: any status below 500 is returned to the caller. */
export const mediaClient = makeClient({ validateStatus: (s) => s < 500 });
export const albumClient = makeClient({
  headers: { ...BROWSER_HEADERS, Referer: 'https://www.google.com/' },
  validateStatus: (s) => s < 500,
});

// ---------- runtime options (speed limit only) ----------

const options = { proxy: '', limitRate: 0 };
const bucket = new Bucket();

/** @param {{ limitRate?: number }} next  limitRate in bytes/second, 0 = unlimited; proxy is ignored */
export function setNetworkOptions(next = {}) {
  if (next.limitRate !== undefined) {
    options.limitRate = Math.max(0, Number(next.limitRate) || 0);
    bucket.setRate(options.limitRate);
  }
}

export function getNetworkOptions() {
  return { ...options };
}

/** TransformStream that enforces the shared limit; a pass-through when no limit is set. */
export function createThrottle() {
  return new TransformStream({
    async transform(chunk, controller) {
      const wait = bucket.take(chunk.byteLength);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      controller.enqueue(chunk);
    },
  });
}
