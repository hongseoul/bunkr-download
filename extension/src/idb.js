/**
 * Tiny promise wrapper over one IndexedDB database. chrome.storage cannot hold folder
 * handles, IndexedDB can.
 *
 * Stores: `folders` (label → FileSystemDirectoryHandle), `partials` (path → { at }).
 */

const DB_NAME = 'bunkr-download';
const STORES = ['folders', 'partials'];

let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        for (const s of STORES) {
          if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run(store, mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve(req?.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export const idbGet = (store, key) => run(store, 'readonly', (s) => s.get(key));
export const idbPut = (store, key, value) => run(store, 'readwrite', (s) => s.put(value, key));
export const idbDelete = (store, key) => run(store, 'readwrite', (s) => s.delete(key));

/** @returns {Promise<Array<{ key: string, value: any }>>} */
export async function idbEntries(store) {
  const [keys, values] = await Promise.all([
    run(store, 'readonly', (s) => s.getAllKeys()),
    run(store, 'readonly', (s) => s.getAll()),
  ]);
  return keys.map((key, i) => ({ key, value: values[i] }));
}

/** Registry of files whose download has not finished, for fs-io.js. */
export const idbPartials = {
  has: async (path) => (await idbGet('partials', path)) !== undefined,
  set: (path) => idbPut('partials', path, { at: Date.now() }),
  delete: (path) => idbDelete('partials', path),
};
