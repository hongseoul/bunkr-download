#!/usr/bin/env node
import fsp from 'node:fs/promises';
import path from 'node:path';
import { Command, Option } from 'commander';
import { fetchAlbumMeta, isAlbumUrl, isFilePageUrl, isMediaUrl, setParserDebug } from './parser.js';
import { downloadAlbum, ensureDir } from './downloader.js';
import { Logger, ensureLogWritable } from './logger.js';
import { randomCipherToken, cipherAlbumName } from './name-cipher.js';
import { buildFileFilter, parseExtList, parseSize, parseUrlList, regexOrSubstring } from './filters.js';
import { setNetworkOptions } from './net.js';
import { checkDiskSpace } from './disk.js';
import { analyzeAlbumFiles } from './local-index.js';
import {
  searchAlbums,
  DEFAULT_SEARCH_HOST,
  SEARCH_MODES,
  SEARCH_SORTS,
  SEARCH_PER_PAGE,
} from './search.js';

const program = new Command();

function fileNameFromUrl(url) {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last);
  } catch {
    return '';
  }
}

function fmtBytes(n) {
  if (!n) return '?';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

program
  .name('bunkr-download')
  .description('Download media from bunkr file storage (albums + URL lists, concurrent, resumable, filterable).')
  .version('1.0.0')
  .argument('[urls...]', 'album or direct media URLs')
  .option('-i, --input <file>', 'path to a text file containing URLs (one per line, # starts a comment)')
  .option('-o, --output <dir>', 'output directory', './downloads')
  .option('-c, --concurrency <n>', 'number of concurrent downloads', '4')
  .option('-f, --filter <pattern>', 'only download files whose name (or URL) matches this substring or /RegExp/')
  .option('-F, --filter-file <file>', 'filter file: one pattern per line (a file passes if any pattern matches)')
  .option('--invert', 'invert the name filter (exclude matching files)')
  .option('--ext <list>', 'only these extensions, comma separated (e.g. jpg,png,mp4)')
  .option('--min-size <size>', 'skip files smaller than this (e.g. 500k, 2M); files of unknown size are kept')
  .option('--max-size <size>', 'skip files larger than this (e.g. 1.5G); files of unknown size are kept')
  .option('--max-retries <n>', 'retries per file on network errors, 429 and 5xx', '5')
  .option('--proxy <url>', 'http://, https:// or socks5:// proxy for every request')
  .option('--limit-rate <size>', 'total download speed limit per second (e.g. 2M)')
  .option('--dry-run', 'list what would be downloaded (names, sizes, on-disk status) and exit', false)
  .option('--export <file>', 'write the file page URLs that passed the filters to this file')
  .option('--no-disk-check', 'do not refuse to start when free disk space looks too small')
  .addOption(
    new Option('--maintenance <mode>', 'when Bunkr reports maintenance: wait and retry, or skip the file')
      .choices(['backoff', 'skip'])
      .default('backoff')
  )
  .option('--error-log <file>', 'path to append URLs that fail (default: <output>/errors.log)')
  .option(
    '-s, --skip-existing',
    'skip files already present in the album folder that look complete (local-only check; re-downloads empty, size-mismatched, or corrupt files)',
    false
  )
  .option('--no-magic', 'with --skip-existing, skip media magic-byte integrity sniff')
  .option(
    '--ignore-size-mismatch',
    'with --skip-existing, treat size-mismatched files as complete and do not re-download them'
  )
  .option('--replace-word <word>', 'replace this word in created folder and file names (case-insensitive substring)')
  .option('--replace-with <text>', 'replacement for --replace-word (random token if omitted)')
  .option('-v, --verbose', 'verbose logging', false)
  .action(async (urls, opts) => {
    const logger = new Logger({ verbose: opts.verbose });
    setParserDebug((m) => logger.debug(m));

    // Gather URLs
    const collected = [...(urls || [])];
    if (opts.input) {
      collected.push(...parseUrlList(await fsp.readFile(opts.input, 'utf8')));
    }
    if (collected.length === 0) {
      console.error('No URLs provided. Pass URLs as args, or use --input <file>.');
      program.help({ error: true });
    }

    const output = path.resolve(opts.output);
    const dryRun = !!opts.dryRun;

    const errorLogPath = path.resolve(opts.errorLog || path.join(output, 'errors.log'));
    logger.errorLogPath = errorLogPath;

    const concurrency = Math.max(1, parseInt(opts.concurrency, 10) || 4);
    const maxRetries = parseInt(opts.maxRetries, 10);
    if (!Number.isFinite(maxRetries) || maxRetries < 0) {
      console.error('--max-retries must be a non-negative number');
      process.exit(2);
    }

    let fileFilter;
    try {
      setNetworkOptions({
        proxy: opts.proxy || '',
        limitRate: opts.limitRate ? parseSize(opts.limitRate) : 0,
      });
      const patterns = [];
      if (opts.filter) patterns.push(regexOrSubstring(opts.filter));
      if (opts.filterFile) {
        for (const line of parseUrlList(await fsp.readFile(opts.filterFile, 'utf8'))) {
          patterns.push(regexOrSubstring(line));
        }
      }
      fileFilter = buildFileFilter({
        patterns,
        invert: !!opts.invert,
        exts: opts.ext ? parseExtList(opts.ext) : [],
        minSize: opts.minSize || 0,
        maxSize: opts.maxSize || 0,
      });
    } catch (e) {
      console.error(`\x1b[31m${e.message}\x1b[0m`);
      process.exit(2);
    }

    const skipExisting = !!opts.skipExisting;
    // commander --no-magic sets opts.magic = false
    const checkMagic = opts.magic !== false;
    const redownloadMismatch = !opts.ignoreSizeMismatch;

    /** @type {import('./name-cipher.js').NameRule[]} */
    const nameRules = [];
    if (opts.replaceWord) {
      const find = String(opts.replaceWord).trim();
      if (find) {
        const replace = opts.replaceWith != null
          ? String(opts.replaceWith)
          : randomCipherToken(find);
        nameRules.push({ find, replace });
      }
    }

    // Only touch the disk once every option has been validated.
    if (!dryRun) {
      ensureDir(output);
      ensureLogWritable(errorLogPath);
    }

    logger.info(`Output dir   : ${output}`);
    logger.info(`Concurrency  : ${concurrency} (retries: ${maxRetries})`);
    if (!dryRun) logger.info(`Error log    : ${errorLogPath}`);
    logger.info(`Skip existing: ${skipExisting ? `on (magic=${checkMagic}, mismatch=${redownloadMismatch ? 'redownload' : 'skip'})` : 'off'}`);
    if (nameRules.length) {
      logger.info(`Name cipher  : "${nameRules[0].find}" → "${nameRules[0].replace}"${opts.replaceWith == null ? ' (random)' : ''}`);
    }
    if (fileFilter) logger.info('Filters      : active');
    if (opts.proxy) logger.info(`Proxy        : ${opts.proxy}`);
    if (opts.limitRate) logger.info(`Speed limit  : ${fmtBytes(parseSize(opts.limitRate))}/s`);
    if (dryRun) logger.info('Dry run      : nothing will be downloaded');
    logger.info(`URLs found   : ${collected.length}`);

    const grouped = { albums: [], direct: [] };
    for (const url of collected) {
      try {
        new URL(url);
        if (isAlbumUrl(url)) grouped.albums.push(url);
        else if (isMediaUrl(url)) grouped.direct.push(url);
        else logger.warn(`Unrecognized URL, skipping: ${JSON.stringify(url)}`);
      } catch {
        logger.warn(`Invalid URL, skipping: ${JSON.stringify(url)}`);
      }
    }

    logger.info(`Albums: ${grouped.albums.length} | Direct files: ${grouped.direct.length}`);

    // First Ctrl+C stops gracefully and keeps .part files so the next run resumes them.
    const abort = new AbortController();
    let interrupted = false;
    process.on('SIGINT', () => {
      if (interrupted) process.exit(130);
      interrupted = true;
      abort.abort();
      console.error('\n\x1b[33mStopping... partial files are kept and will resume next run. Press Ctrl+C again to force quit.\x1b[0m');
    });

    const exportUrls = [];
    const allResults = [];

    /** Shared per-album flow: filter → export / dry-run → disk check → download. */
    const processAlbum = async (album) => {
      const files = fileFilter ? album.files.filter((f) => fileFilter(f)) : album.files;
      if (fileFilter) logger.info(`  ${files.length} of ${album.files.length} file(s) pass the filters`);
      exportUrls.push(...files.map((f) => f.pageUrl));

      const knownBytes = files.reduce((n, f) => n + (f.sizeBytes || 0), 0);

      if (dryRun) {
        await printDryRun(album, files, { output, nameRules, checkMagic, skipExisting });
        if (opts.diskCheck !== false) {
          const disk = await checkDiskSpace(output, knownBytes);
          if (!disk.ok) logger.warn(`Not enough free space: need ${fmtBytes(knownBytes)}, free ${fmtBytes(disk.free)}`);
        }
        return;
      }

      if (opts.diskCheck !== false) {
        const disk = await checkDiskSpace(output, knownBytes);
        if (!disk.ok) {
          const msg = `Not enough free disk space for "${album.albumName}": need ${fmtBytes(knownBytes)}, free ${fmtBytes(disk.free)} (use --no-disk-check to ignore)`;
          logger.fail(msg);
          allResults.push({ url: album.albumUrl, ok: false, error: msg });
          return;
        }
      }

      const results = await downloadAlbum({
        album: { ...album, files },
        outputDir: output,
        concurrency,
        logger,
        skipExisting,
        checkMagic,
        redownloadMismatch,
        nameRules,
        maxRetries,
        maintenanceStrategy: opts.maintenance,
        signal: abort.signal,
      });
      allResults.push(...results);
    };

    // Albums
    for (const albumUrl of grouped.albums) {
      if (abort.signal.aborted) break;
      let album;
      try {
        logger.info(`Fetching album: ${albumUrl}`);
        album = await fetchAlbumMeta(albumUrl);
        logger.info(`  "${album.albumName}" - ${album.files.length} file(s)`);
      } catch (e) {
        logger.fail(`${albumUrl} -> ${e.message}`);
        allResults.push({ url: albumUrl, ok: false, error: e.message });
        continue;
      }
      await processAlbum(album);
    }

    // Direct URLs (download as a synthetic album named "Direct")
    if (grouped.direct.length && !abort.signal.aborted) {
      await processAlbum({
        albumUrl: '(direct)',
        albumId: 'direct',
        albumName: 'Direct',
        files: grouped.direct.map((pageUrl) =>
          isFilePageUrl(pageUrl)
            ? { pageUrl }
            : { pageUrl, direct: true, fileName: fileNameFromUrl(pageUrl) }
        ),
      });
    }

    if (opts.export) {
      const body = exportUrls.join('\n') + (exportUrls.length ? '\n' : '');
      await fsp.writeFile(path.resolve(opts.export), body, 'utf8');
      logger.info(`Exported ${exportUrls.length} URL(s) to ${path.resolve(opts.export)}`);
    }

    if (dryRun) {
      logger.info(`Dry run complete: ${exportUrls.length} file(s) would be considered.`);
      if (allResults.some((r) => !r.ok)) process.exitCode = 1;
      return;
    }

    const stopped = allResults.filter((r) => r.stopped).length;
    const real = allResults.filter((r) => !r.stopped);
    const ok = real.filter((r) => r.ok).length;
    const fail = real.filter((r) => !r.ok).length;
    const skipped = real.filter((r) => r.ok && r.skipped).length;
    const downloaded = ok - skipped;
    const flushed = await logger.flushErrors();

    console.log('');
    logger.info(`Done. OK=${ok} (downloaded=${downloaded}, skipped=${skipped}) FAILED=${fail}${stopped ? ` STOPPED=${stopped}` : ''}`);
    if (flushed.failed.length > 0) {
      logger.info(`Failed URLs written to: ${errorLogPath}`);
    } else {
      try { await fsp.unlink(errorLogPath); } catch { /* nothing to remove */ }
    }
    if (fail > 0) process.exitCode = 1;
    if (interrupted) process.exitCode = 130;
  });

async function printDryRun(album, files, { output, nameRules, checkMagic, skipExisting }) {
  let statusByUrl = new Map();
  if (skipExisting) {
    const albumDir = path.join(output, cipherAlbumName(album.albumName, nameRules));
    const analysis = await analyzeAlbumFiles(albumDir, files, { checkMagic, nameRules });
    statusByUrl = new Map(analysis.results.map((r) => [r.pageUrl, r.status]));
  }
  let total = 0;
  for (const f of files) {
    total += f.sizeBytes || 0;
    const status = statusByUrl.get(f.pageUrl);
    const tag = status ? `[${status}] ` : '';
    console.log(`  ${fmtBytes(f.sizeBytes).padStart(9)}  ${tag}${f.fileName || f.pageUrl}`);
  }
  console.log(`  ${files.length} file(s), ${fmtBytes(total)} known size`);
}

program
  .command('search')
  .description('search bunkr album titles via an album index site (default: balbums.st)')
  .argument('[query...]', 'words to search for (empty lists the newest albums)')
  .addOption(new Option('-m, --mode <mode>', 'match mode').choices(SEARCH_MODES).default('broad'))
  .addOption(new Option('--sort <order>', 'result order').choices(SEARCH_SORTS).default('latest'))
  .addOption(
    new Option('--per <n>', 'results per page').choices(SEARCH_PER_PAGE.map(String)).default('20')
  )
  .option('-p, --page <n>', 'first page to fetch', '1')
  .option('--pages <n>', 'how many pages to fetch, starting at --page', '1')
  .option('--host <url>', 'album index site', DEFAULT_SEARCH_HOST)
  .option('--urls', 'print only album URLs, one per line (pipe into a file for --input)')
  .option('--json', 'print results as JSON')
  .action(async (words, opts) => {
    const query = (words || []).join(' ').trim();
    const firstPage = Math.max(1, parseInt(opts.page, 10) || 1);
    const pageCount = Math.max(1, Math.min(50, parseInt(opts.pages, 10) || 1));

    const results = [];
    let last = null;
    for (let page = firstPage; page < firstPage + pageCount; page++) {
      last = await searchAlbums(query, {
        mode: opts.mode,
        sort: opts.sort,
        per: opts.per,
        page,
        host: opts.host,
      });
      results.push(...last.results);
      if (page >= last.totalPages) break;
    }

    if (opts.json) {
      console.log(JSON.stringify({ ...last, page: firstPage, lastPage: last.page, results }, null, 2));
      return;
    }
    if (opts.urls) {
      for (const r of results) console.log(r.url);
      return;
    }

    const label = query ? `"${query}"` : 'all albums';
    const pages = last.totalPages
      ? `page ${firstPage}${last.page > firstPage ? `–${last.page}` : ''} of ${last.totalPages}, `
      : '';
    console.log(`\x1b[36mSearch ${label} on ${last.host} (${pages}mode ${last.mode}, sort ${last.sort})\x1b[0m`);
    if (!results.length) {
      console.log(firstPage > 1 && last.totalPages ? 'No albums on this page.' : 'No albums found.');
      if (!last.totalPages && last.mode !== 'fuzzy' && query) console.log('Try --mode fuzzy (tolerates typos) or --mode substring.');
      return;
    }
    const width = String(Math.max(...results.map((r) => r.fileCount))).length;
    for (const r of results) {
      const files = `${String(r.fileCount || '?').padStart(width)} ${r.fileCount === 1 ? 'file ' : 'files'}`;
      console.log(`  ${files}  ${r.url}  ${r.title || r.albumId}`);
    }
    if (last.page < last.totalPages) {
      console.log(`\x1b[2mMore: --page ${last.page + 1}\x1b[0m`);
    }
  });

program.parseAsync(process.argv).catch((e) => {
  console.error(`\x1b[31mFatal: ${e.message}\x1b[0m`);
  process.exit(1);
});
