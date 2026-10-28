/**
 * In-memory stand-in for the File System Access API (FileSystemDirectoryHandle,
 * FileSystemFileHandle, FileSystemWritableFileStream), enough to test extension/src/fs-io.js
 * in Node. Like Chrome, a writable works on a copy and commits it only on close().
 */

const domError = (name) => new DOMException(name, name);

class FakeFileHandle {
  constructor(dir, name) {
    this.kind = 'file';
    this.dir = dir;
    this.name = name;
  }

  async getFile() {
    if (!this.dir.files.has(this.name)) throw domError('NotFoundError');
    return new File([this.dir.files.get(this.name)], this.name, { lastModified: 0 });
  }

  async createWritable({ keepExistingData = false } = {}) {
    const dir = this.dir;
    const name = this.name;
    let buf = keepExistingData ? Uint8Array.from(dir.files.get(name) || []) : new Uint8Array(0);
    let pos = 0;
    const toBytes = (d) => (typeof d === 'string' ? new TextEncoder().encode(d) : new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d));
    const put = (bytes) => {
      const end = pos + bytes.length;
      if (end > buf.length) {
        const next = new Uint8Array(end);
        next.set(buf);
        buf = next;
      }
      buf.set(bytes, pos);
      pos = end;
    };
    const ws = new WritableStream({
      write(chunk) {
        put(toBytes(chunk));
      },
      close() {
        dir.files.set(name, buf);
      },
      abort() {
        // discarded, like Chrome's swap file
      },
    });
    ws.seek = async (p) => {
      pos = p;
    };
    ws.write = async (data) => {
      const w = ws.getWriter();
      try {
        await w.write(data);
      } finally {
        w.releaseLock();
      }
    };
    return ws;
  }
}

export class FakeDir {
  constructor(name = 'root') {
    this.kind = 'directory';
    this.name = name;
    /** @type {Map<string, Uint8Array>} */
    this.files = new Map();
    /** @type {Map<string, FakeDir>} */
    this.dirs = new Map();
  }

  async getDirectoryHandle(name, { create = false } = {}) {
    if (this.files.has(name)) throw domError('TypeMismatchError');
    let d = this.dirs.get(name);
    if (!d) {
      if (!create) throw domError('NotFoundError');
      d = new FakeDir(name);
      this.dirs.set(name, d);
    }
    return d;
  }

  async getFileHandle(name, { create = false } = {}) {
    if (this.dirs.has(name)) throw domError('TypeMismatchError');
    if (!this.files.has(name)) {
      if (!create) throw domError('NotFoundError');
      this.files.set(name, new Uint8Array(0));
    }
    return new FakeFileHandle(this, name);
  }

  async removeEntry(name) {
    if (!this.files.delete(name) && !this.dirs.delete(name)) throw domError('NotFoundError');
  }

  async *entries() {
    for (const [n, d] of this.dirs) yield [n, d];
    for (const n of this.files.keys()) yield [n, new FakeFileHandle(this, n)];
  }

  async queryPermission() {
    return 'granted';
  }

  async isSameEntry(other) {
    return other === this;
  }

  /** Test helper: the folder at a relative path ("a/b"), or null. */
  dirAt(rel) {
    let d = this;
    for (const seg of String(rel).split('/').filter(Boolean)) {
      d = d.dirs.get(seg);
      if (!d) return null;
    }
    return d;
  }

  /** Test helper: bytes of "a/b/file.bin" as a Buffer, or null. */
  read(rel) {
    const segs = String(rel).split('/').filter(Boolean);
    const d = this.dirAt(segs.slice(0, -1).join('/'));
    const bytes = d?.files.get(segs.at(-1));
    return bytes ? Buffer.from(bytes) : null;
  }

  /** Test helper: create "a/b/file.bin" with the given bytes. */
  write(rel, bytes) {
    const segs = String(rel).split('/').filter(Boolean);
    let d = this;
    for (const seg of segs.slice(0, -1)) {
      if (!d.dirs.has(seg)) d.dirs.set(seg, new FakeDir(seg));
      d = d.dirs.get(seg);
    }
    d.files.set(segs.at(-1), Uint8Array.from(bytes));
  }
}

/** A partials registry backed by a Set. */
export function fakePartials() {
  const set = new Set();
  return {
    set: async (p) => void set.add(p),
    has: async (p) => set.has(p),
    delete: async (p) => void set.delete(p),
    raw: set,
  };
}
