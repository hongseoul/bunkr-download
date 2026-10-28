/**
 * A page cannot set Referer or Origin on its own requests, and requests from this
 * extension carry `Origin: chrome-extension://…`. Bunkr's file API expects the headers
 * its own pages send, so they are applied with declarativeNetRequest session rules,
 * one rule per host, scoped to requests this extension makes.
 */

/** host → rule id */
const ruleIds = new Map();
/** host → serialized headers of the current rule, to skip identical updates */
const current = new Map();
let nextId = 1;
let ready = null;

function dnr() {
  return globalThis.chrome?.declarativeNetRequest || null;
}

/** Session rules outlive a page reload; start from a clean slate. */
function init() {
  if (!ready) {
    ready = (async () => {
      const api = dnr();
      if (!api) return;
      const old = await api.getSessionRules();
      if (old.length) await api.updateSessionRules({ removeRuleIds: old.map((r) => r.id) });
    })().catch((e) => console.warn('header rules: reset failed', e));
  }
  return ready;
}

/**
 * Make requests from this extension to `url`'s host carry `referer` (and its origin as
 * Origin). Best effort: without the API (tests, other browsers) it does nothing.
 * @param {string} url
 * @param {{ referer?: string }} opts
 */
export async function applyRequestHeaders(url, { referer } = {}) {
  const api = dnr();
  if (!api || !referer) return;
  let host;
  let origin;
  try {
    host = new URL(url).hostname;
    origin = new URL(referer).origin;
  } catch {
    return;
  }
  const requestHeaders = [
    { header: 'referer', operation: 'set', value: referer },
    { header: 'origin', operation: 'set', value: origin },
  ];
  const key = JSON.stringify(requestHeaders);
  if (current.get(host) === key) return;

  await init();
  let id = ruleIds.get(host);
  if (!id) {
    id = nextId++;
    ruleIds.set(host, id);
  }
  try {
    await api.updateSessionRules({
      removeRuleIds: [id],
      addRules: [{
        id,
        priority: 1,
        action: { type: 'modifyHeaders', requestHeaders },
        condition: {
          requestDomains: [host],
          initiatorDomains: [globalThis.chrome.runtime.id],
          resourceTypes: ['xmlhttprequest', 'other'],
        },
      }],
    });
    current.set(host, key);
  } catch (e) {
    console.warn(`header rules: could not set headers for ${host}`, e);
  }
}
