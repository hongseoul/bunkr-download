import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

export class Logger {
  constructor({ verbose = false, errorLogPath } = {}) {
    this.verbose = verbose;
    this.errorLogPath = errorLogPath;
    this.failed = [];
    /** Optional (text) => void that replaces console output, e.g. while progress bars are drawn. */
    this.sink = null;
  }

  _out(text, toStderr = false) {
    if (this.sink) this.sink(text);
    else if (toStderr) console.error(text);
    else console.log(text);
  }

  ok(msg) {
    if (this.verbose) this._out(`\x1b[32m[${new Date().toISOString()}] OK    ${msg}\x1b[0m`);
  }

  debug(msg) {
    if (this.verbose) this._out(`[${new Date().toISOString()}] DBG   ${msg}`);
  }

  info(msg) {
    this._out(`\x1b[36m${msg}\x1b[0m`);
  }

  warn(msg) {
    this._out(`\x1b[33mWARN  ${msg}\x1b[0m`, true);
  }

  fail(msg) {
    this._out(`\x1b[31mFAIL  ${msg}\x1b[0m`, true);
    this.failed.push(msg);
  }

  async flushErrors() {
    const failedLines = [...this.failed];
    if (this.errorLogPath && failedLines.length > 0) {
      const stamp = new Date().toISOString();
      const body = failedLines.map((l) => `[${stamp}] ${l}`).join('\n') + '\n';
      await fsp.appendFile(this.errorLogPath, body, 'utf8');
    }
    return { failed: failedLines };
  }
}

export function ensureLogWritable(p) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
}
