/**
 * Build the Chrome extension into dist/extension/ (load it via chrome://extensions →
 * Developer mode → Load unpacked).
 *
 * - extension/src/api.js and everything it imports from src/ are bundled for the browser;
 *   imports of src/net.js are redirected to extension/src/net-browser.js, and any other
 *   Node built-in fails the build.
 * - The desktop UI (electron/ui) is copied as is; app.html gets api.js before app.js and a
 *   CSP that lets the page reach https hosts.
 */

import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => path.join(root, ...p);

/** Redirect platform modules and refuse anything that needs Node. */
const browserPlatform = {
  name: 'browser-platform',
  setup(b) {
    b.onResolve({ filter: /^\.\/net\.js$/ }, (args) =>
      path.resolve(args.resolveDir) === r('src') ? { path: r('extension', 'src', 'net-browser.js') } : undefined
    );
    b.onResolve({ filter: /^node:url$/ }, () => ({ path: r('extension', 'shims', 'node-url.js') }));
    b.onResolve({ filter: /^node:/ }, (args) => ({
      errors: [{ text: `Node built-in "${args.path}" imported by ${path.relative(root, args.importer)}` }],
    }));
  },
};

function patchHtml(html) {
  const csp = /(<meta\s+http-equiv="Content-Security-Policy"\s+content=")([^"]*)(")/i;
  if (!csp.test(html)) throw new Error('index.html: Content-Security-Policy meta not found');
  html = html.replace(csp, (_, a, policy, c) => `${a}${policy.trim().replace(/;?$/, ';')} connect-src 'self' https:;${c}`);
  const appScript = '<script src="app.js"></script>';
  if (!html.includes(appScript)) throw new Error('index.html: app.js script tag not found');
  return html.replace(appScript, `<script src="api.js"></script>\n    ${appScript}`);
}

/**
 * @param {{ outDir?: string, minify?: boolean }} [opts]
 * @returns {Promise<string>} the output directory
 */
export async function buildExtension({ outDir = r('dist', 'extension'), minify = false } = {}) {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  await build({
    entryPoints: [r('extension', 'src', 'api.js')],
    outfile: path.join(outDir, 'api.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'chrome122',
    minify,
    legalComments: 'none',
    logLevel: 'silent',
    plugins: [browserPlatform],
  });

  for (const f of ['app.js', 'app.css', 'theme-boot.js']) {
    fs.copyFileSync(r('electron', 'ui', f), path.join(outDir, f));
  }
  fs.writeFileSync(path.join(outDir, 'app.html'), patchHtml(fs.readFileSync(r('electron', 'ui', 'index.html'), 'utf8')));
  fs.copyFileSync(r('extension', 'background.js'), path.join(outDir, 'background.js'));

  const pkg = JSON.parse(fs.readFileSync(r('package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(r('extension', 'manifest.base.json'), 'utf8'));
  manifest.version = pkg.version;
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return outDir;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  buildExtension({ minify: process.argv.includes('--minify') })
    .then((dir) => console.log(`Extension built: ${path.relative(root, dir)}`))
    .catch((e) => {
      console.error(e.errors?.length ? e.errors.map((x) => x.text).join('\n') : e.message);
      process.exit(1);
    });
}
