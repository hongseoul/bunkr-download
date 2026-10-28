/**
 * Download folders chosen by the user.
 *
 * The UI keeps a folder as a plain string (settings.outputDir, queue items), so each
 * folder gets a label — its name, or "name (2)" when two folders share one — and the
 * handle itself lives in IndexedDB. A browser never reveals the full path.
 *
 * Chrome asks once per session before a page may write to a stored folder, and only
 * right after a user action. Clicking a button that needs a folder asks for every
 * folder in use; the API calls then find the permission already granted.
 */

import { idbEntries, idbGet, idbPut } from './idb.js';

const STORE = 'folders';

/** Let the user choose a folder. @returns {Promise<{ ok: boolean, path?: string, canceled?: boolean }>} */
export async function pickFolder() {
  let handle;
  try {
    handle = await window.showDirectoryPicker({ id: 'bunkr-download', mode: 'readwrite' });
  } catch (e) {
    if (e?.name === 'AbortError') return { ok: false, canceled: true };
    throw e;
  }
  const label = await labelFor(handle);
  await idbPut(STORE, label, handle);
  return { ok: true, path: label };
}

async function labelFor(handle) {
  const known = await idbEntries(STORE);
  for (const { key, value } of known) {
    if (value && (await value.isSameEntry(handle).catch(() => false))) return key;
  }
  const taken = new Set(known.map((k) => k.key));
  let label = handle.name;
  for (let n = 2; taken.has(label); n++) label = `${handle.name} (${n})`;
  return label;
}

async function granted(handle) {
  return (await handle.queryPermission({ mode: 'readwrite' })) === 'granted';
}

/**
 * The stored folder for `label`, with write permission.
 * @param {string} label
 * @returns {Promise<FileSystemDirectoryHandle>}
 */
export async function folderHandle(label) {
  const handle = label ? await idbGet(STORE, label) : null;
  if (!handle) {
    throw new Error(`Choose the download folder again — "${label || '(none)'}" is not known to this browser`);
  }
  if (await granted(handle)) return handle;
  if (navigator.userActivation?.isActive
    && (await handle.requestPermission({ mode: 'readwrite' })) === 'granted') {
    return handle;
  }
  throw new Error(`Chrome needs your permission to save into “${label}”. Click the button again and choose Allow.`);
}

/**
 * Ask for every listed folder that still needs permission. Call it straight from a click.
 * @param {string[]} labels
 */
export async function requestFolders(labels) {
  for (const label of new Set(labels.filter(Boolean))) {
    const handle = await idbGet(STORE, label).catch(() => null);
    if (!handle || (await granted(handle))) continue;
    try {
      await handle.requestPermission({ mode: 'readwrite' });
    } catch {
      // The user activation may have run out; folderHandle reports it on use.
    }
  }
}
