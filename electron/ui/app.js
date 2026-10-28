const els = {
  urlInput: document.getElementById('albumUrl'),
  loadBtn: document.getElementById('loadBtn'),
  resetBtn: document.getElementById('resetBtn'),
  navAlbum: document.getElementById('navAlbum'),
  navSettings: document.getElementById('navSettings'),
  heroPasteBtn: document.getElementById('heroPasteBtn'),
  recentWrap: document.getElementById('recentWrap'),
  recentList: document.getElementById('recentList'),
  recentAllBtn: document.getElementById('recentAllBtn'),
  albumScroller: document.getElementById('albumScroller'),
  albumTitle: document.getElementById('albumTitle'),
  albumStats: document.getElementById('albumStats'),
  loadBar: document.getElementById('loadBar'),
  loadFill: document.getElementById('loadFill'),
  typeFilter: document.getElementById('typeFilter'),
  searchInput: document.getElementById('searchInput'),
  searchClear: document.getElementById('searchClear'),
  sortSelect: document.getElementById('sortSelect'),
  densitySeg: document.getElementById('densitySeg'),
  filteredEmptyText: document.getElementById('filteredEmptyText'),
  resetFiltersBtn: document.getElementById('resetFiltersBtn'),
  concDown: document.getElementById('concDown'),
  concUp: document.getElementById('concUp'),
  downloadLabel: document.getElementById('downloadLabel'),
  downloadMeta: document.getElementById('downloadMeta'),
  dpBytes: document.getElementById('dpBytes'),
  dpSpeed: document.getElementById('dpSpeed'),
  dpEta: document.getElementById('dpEta'),
  toggleDetailsBtn: document.getElementById('toggleDetailsBtn'),
  activity: document.getElementById('activity'),
  activityLabel: document.getElementById('activityLabel'),
  activityFill: document.getElementById('activityFill'),
  activityCount: document.getElementById('activityCount'),
  activitySpeed: document.getElementById('activitySpeed'),
  themeName: document.getElementById('themeName'),
  bookmarksBtn: document.getElementById('bookmarksBtn'),
  bmCount: document.getElementById('bmCount'),
  queueBtn: document.getElementById('queueBtn'),
  queueCount: document.getElementById('queueCount'),
  queueAddBtn: document.getElementById('queueAddBtn'),
  queueRunStatus: document.getElementById('queueRunStatus'),
  queueRunLabel: document.getElementById('queueRunLabel'),
  queuePanel: document.getElementById('queuePanel'),
  queueForm: document.getElementById('queueForm'),
  queueUrls: document.getElementById('queueUrls'),
  queueAddStartBtn: document.getElementById('queueAddStartBtn'),
  queueStartBtn: document.getElementById('queueStartBtn'),
  queueStopBtn: document.getElementById('queueStopBtn'),
  queueClearDoneBtn: document.getElementById('queueClearDoneBtn'),
  queueHint: document.getElementById('queueHint'),
  queueList: document.getElementById('queueList'),
  queueOutputDir: document.getElementById('queueOutputDir'),
  queueBrowseBtn: document.getElementById('queueBrowseBtn'),
  queueApplyFolderBtn: document.getElementById('queueApplyFolderBtn'),
  empty: document.getElementById('emptyState'),
  previewSection: document.getElementById('previewSection'),
  grid: document.getElementById('grid'),
  selectAll: document.getElementById('selectAll'),
  hideDownloaded: document.getElementById('hideDownloaded'),
  hideDownloadedOpt: document.getElementById('hideDownloadedOpt'),
  filteredCount: document.getElementById('filteredCount'),
  filteredEmpty: document.getElementById('filteredEmpty'),
  selectMissingBtn: document.getElementById('selectMissingBtn'),
  selectMismatchBtn: document.getElementById('selectMismatchBtn'),
  selectedCount: document.getElementById('selectedCount'),
  previewProgress: document.getElementById('previewProgress'),
  localScanStatus: document.getElementById('localScanStatus'),
  albumMeta: document.getElementById('albumMeta'),
  saveAlbumBtn: document.getElementById('saveAlbumBtn'),
  bottomBar: document.getElementById('bottomBar'),
  outputDir: document.getElementById('outputDir'),
  browseBtn: document.getElementById('browseBtn'),
  openFolderBtn: document.getElementById('openFolderBtn'),
  concurrency: document.getElementById('concurrency'),
  skipExisting: document.getElementById('skipExisting'),
  redownloadMismatch: document.getElementById('redownloadMismatch'),
  mismatchLabel: document.getElementById('mismatchLabel'),
  cipherEnabled: document.getElementById('cipherEnabled'),
  cipherFields: document.getElementById('cipherFields'),
  cipherFind: document.getElementById('cipherFind'),
  cipherReplace: document.getElementById('cipherReplace'),
  cipherRandom: document.getElementById('cipherRandom'),
  cipherPreview: document.getElementById('cipherPreview'),
  downloadBtn: document.getElementById('downloadBtn'),
  summary: document.getElementById('summary'),
  progressSection: document.getElementById('progressSection'),
  totalFill: document.getElementById('totalFill'),
  totalLabel: document.getElementById('totalLabel'),
  fileProgress: document.getElementById('fileProgress'),
  bookmarksPanel: document.getElementById('bookmarksPanel'),
  bmForm: document.getElementById('bmForm'),
  bmUrl: document.getElementById('bmUrl'),
  bmTitle: document.getElementById('bmTitle'),
  bmNote: document.getElementById('bmNote'),
  bmList: document.getElementById('bmList'),
  bmAddToggle: document.getElementById('bmAddToggle'),
  bmCancel: document.getElementById('bmCancel'),
  bmToolbar: document.getElementById('bmToolbar'),
  bmSearch: document.getElementById('bmSearch'),
  bmSearchClear: document.getElementById('bmSearchClear'),
  bmShown: document.getElementById('bmShown'),
  bmSort: document.getElementById('bmSort'),
  navSearch: document.getElementById('navSearch'),
  heroSearchBtn: document.getElementById('heroSearchBtn'),
  srScroller: document.getElementById('srScroller'),
  srHostLabel: document.getElementById('srHostLabel'),
  srForm: document.getElementById('srForm'),
  srQuery: document.getElementById('srQuery'),
  srClear: document.getElementById('srClear'),
  srSubmit: document.getElementById('srSubmit'),
  srMode: document.getElementById('srMode'),
  srSort: document.getElementById('srSort'),
  srPer: document.getElementById('srPer'),
  srStatus: document.getElementById('srStatus'),
  srGrid: document.getElementById('srGrid'),
  srEmpty: document.getElementById('srEmpty'),
  srEmptyText: document.getElementById('srEmptyText'),
  srRetryBtn: document.getElementById('srRetryBtn'),
  srPager: document.getElementById('srPager'),
  srPrev: document.getElementById('srPrev'),
  srNext: document.getElementById('srNext'),
  srPageLabel: document.getElementById('srPageLabel'),
  searchHost: document.getElementById('searchHost'),
  cipherSensitive: document.getElementById('cipherSensitive'),
  discreetBtn: document.getElementById('discreetBtn'),
  discreetOn: document.getElementById('discreetOn'),
  dvThumbs: document.getElementById('dvThumbs'),
  dvNames: document.getElementById('dvNames'),
  dvNamesPreview: document.getElementById('dvNamesPreview'),
  dvCats: document.getElementById('dvCats'),
  discreetWords: document.getElementById('discreetWords'),
  discreetPeek: document.getElementById('discreetPeek'),
  discreetVeil: document.getElementById('discreetVeil'),
  discreetStartOn: document.getElementById('discreetStartOn'),
  discreetButton: document.getElementById('discreetButton'),
  discreetStrict: document.getElementById('discreetStrict'),
  stopBtn: document.getElementById('stopBtn'),
  retryFailedBtn: document.getElementById('retryFailedBtn'),
  retryFailedCount: document.getElementById('retryFailedCount'),
  extFilter: document.getElementById('extFilter'),
  minSizeFilter: document.getElementById('minSizeFilter'),
  maxSizeFilter: document.getElementById('maxSizeFilter'),
  setMaxRetries: document.getElementById('setMaxRetries'),
  setLimitRate: document.getElementById('setLimitRate'),
  setProxy: document.getElementById('setProxy'),
  setMaintenance: document.getElementById('setMaintenance'),
  setDiskCheck: document.getElementById('setDiskCheck'),
};

let state = {
  album: null,
  files: [],
  selected: new Set(),
  outputDir: '',
  queueOutputDir: '',
  downloading: false,
  loadingAlbum: false,
  queue: [],
  queueRunning: false,
  queueStopRequested: false,
  queueActiveId: '',
  perFile: new Map(),
  /** @type {Map<string, { status: string, reason: string, localSize: number }>} */
  localStatus: new Map(),
  scanningLocal: false,
  bookmarks: [],
  theme: 'acid',
  /** pageUrl → position in album order (camera-style names). */
  fileIndex: new Map(),
  /** Id of the running download job (for Stop). */
  jobId: '',
  /** Page URLs that failed in the last run, for "Retry failed". */
  lastFailed: [],
  /** Where the last download went: { albumUrl, outputDir, albumName, nameRules, albumDir }. */
  lastSave: null,
};

/** Discreet view — on-screen masking only; persisted with the other settings. */
const discreet = {
  on: false,
  thumbs: 'type', // show | type | blur | animals | scenery | abstract
  names: 'swap', // off | dots | swap | generic
  categories: ['explicit', 'anatomy', 'genres', 'sites'],
  words: '',
  strict: false,
  peek: true,
  veil: false,
  startOn: false,
  button: true,
  peeking: false,
};

/** Grid filters — view-only; reset whenever a different album is shown. */
const view = {
  current: 'album',
  type: 'all',
  search: '',
  sort: 'album',
  anchorUrl: '',
  exts: new Set(),
  minSize: 0,
  maxSize: 0,
};

/** Saved albums list: search query and sort order. */
const bmView = { query: '', sort: 'recent', formOpen: false };
let bmSearchTimer = 0;

/** Album search (index site) — kept while switching views. */
const search = {
  query: '',
  mode: 'broad',
  sort: 'latest',
  per: 20,
  page: 1,
  totalPages: 0,
  results: [],
  searched: false,
  loading: false,
  error: '',
  seq: 0,
};

/** Byte accounting for the running download (speed / ETA). */
const run = {
  active: false,
  bytesDone: 0,
  bytesPlanned: 0,
  unknownSizes: 0,
  speed: 0,
  lastBytes: 0,
  lastAt: 0,
  timer: 0,
  completed: 0,
  total: 0,
  sizes: new Map(),
};

let scanTimer = 0;
let localScanVersion = 0;
let settingsTimer = 0;
let queueTimer = 0;

const THEMES = {
  acid: { label: 'Acid Lime' },
  lavender: { label: 'Midnight Lavender' },
};

const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'heic', 'heif', 'tif', 'tiff', 'jfif', 'svg']);
const VIDEO_EXT = new Set(['mp4', 'mkv', 'webm', 'mov', 'avi', 'm4v', 'wmv', 'flv', 'ts', 'mpg', 'mpeg', '3gp', 'm2ts']);

const SVG_NS = 'http://www.w3.org/2000/svg';

// A browser tab cannot open a folder in the system file manager.
const CAN_OPEN_FOLDERS = window.api.platform !== 'extension';

function icon(name, cls = 'i') {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', '#i-' + name);
  svg.appendChild(use);
  return svg;
}

function makeBtn({ label = '', iconName = '', cls = 'btn btn-sm', title = '', disabled = false, onClick } = {}) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  if (iconName) b.appendChild(icon(iconName));
  if (label) b.appendChild(document.createTextNode(label));
  if (title) { b.title = title; if (!label) b.setAttribute('aria-label', title); }
  b.disabled = disabled;
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function toast(msg, kind = 'ok', ms = 3000) {
  const wrap = document.getElementById('toasts');
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  wrap.appendChild(t);
  while (wrap.children.length > 4) wrap.firstChild.remove();
  setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 220); }, ms);
}

function fmtBytes(n) {
  if (!n) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '';
  sec = Math.round(sec);
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${String(sec % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
}

function fileKind(f) {
  const ext = String(f.ext || '').toLowerCase();
  if (IMAGE_EXT.has(ext)) return 'image';
  if (VIDEO_EXT.has(ext)) return 'video';
  return 'other';
}

// ---------- discreet view ----------

const WORD_CATEGORIES = {
  explicit: 'Explicit terms',
  anatomy: 'Anatomy',
  genres: 'Genres & tags',
  sites: 'Sites & platforms',
};

// Falls back to "no masking" if the preload bridge is missing.
const sensitiveWords = window.discreetWords || { mask: (t) => t, categories: () => [] };

function wordOptions(style) {
  return { categories: discreet.categories, custom: discreet.words, strict: discreet.strict, style };
}

function namesMasked() {
  return discreet.on && discreet.names !== 'off';
}

/** Free text (titles, notes, queries) with sensitive words masked. Camera-style falls back to dots. */
function maskText(s) {
  if (!s || !namesMasked()) return s;
  return sensitiveWords.mask(String(s), wordOptions(discreet.names === 'swap' ? 'swap' : 'dots'));
}

function fileExt(f) {
  const ext = String(f.ext || '').toLowerCase()
    || (/\.([a-z0-9]{1,5})$/i.exec(f.fileName || '')?.[1] || '').toLowerCase();
  return ext || 'bin';
}

/** IMG_0007.jpg / VID_0012.mp4 / FILE_0003.zip by position in the album. */
function genericFileName(f) {
  const n = (state.fileIndex.get(f.pageUrl) ?? 0) + 1;
  const kind = fileKind(f);
  const prefix = kind === 'image' ? 'IMG' : kind === 'video' ? 'VID' : 'FILE';
  return `${prefix}_${String(n).padStart(4, '0')}.${fileExt(f)}`;
}

/** Name shown on a card: disk name after cipher, then Discreet view masking. */
function shownFileName(f) {
  const base = displayFileName(f.fileName);
  if (!namesMasked()) return base;
  if (discreet.names === 'generic') return genericFileName(f);
  return maskText(base);
}

function shownAlbumTitle(title, url) {
  if (!namesMasked()) return title;
  if (discreet.names === 'generic') {
    const id = albumIdFromUrl(url || '');
    return id ? `Album ${id}` : 'Album';
  }
  return maskText(title);
}

/** Fills a name element; while masked, keeps the real text in a hidden span for Alt-peek. */
function fillName(nameEl, shown, real) {
  nameEl.replaceChildren();
  if (namesMasked() && real && shown !== real) {
    nameEl.appendChild(el('span', 'shown', shown));
    nameEl.appendChild(el('span', 'real', real));
  } else {
    nameEl.textContent = shown;
  }
}

/**
 * Input or textarea that shows masked text and switches to the real value while focused.
 * `onCommit(next)` runs on blur when the value changed; it returns the saved value or null.
 */
function bindMaskedField(field, getRaw, mask, onCommit) {
  field.value = mask(getRaw());
  field.addEventListener('focus', () => { field.value = getRaw(); });
  field.addEventListener('blur', async () => {
    const next = field.value;
    field.value = mask(getRaw());
    if (next === getRaw()) return;
    const saved = await onCommit(next);
    if (saved != null && document.activeElement !== field) field.value = mask(saved);
  });
}

// Deterministic randomness: the same file always gets the same decoy.
function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seedText) {
  let a = hashString(String(seedText));
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(r, list) {
  return list[Math.floor(r() * list.length)];
}

const ANIMALS = ['🐱', '🐶', '🦊', '🐼', '🐨', '🐰', '🐹', '🐻', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐧', '🐤',
  '🦉', '🦔', '🦦', '🦥', '🐢', '🐙', '🦄', '🐳', '🐬', '🦜', '🐝', '🐞', '🦋', '🐌', '🦭', '🐑', '🦙', '🐥'];
const PASTELS = [
  ['#FFD6E0', '#FFEFD6'], ['#D6EEFF', '#E6F6E1'], ['#E7DCFF', '#FFE0F0'], ['#FFF0C7', '#FFD9C4'],
  ['#D2F4EA', '#DCE6FF'], ['#FBE0C9', '#F5D3E6'], ['#DCF2D0', '#FFF4CC'], ['#D7E1FF', '#F0DCFF'],
];
const SCENES = [
  { sky: ['#4B3F72', '#FF9A76'], sun: '#FFD27A', land: ['#C0607A', '#7E3F6E', '#3A2A52'] },
  { sky: ['#5FA8F0', '#D2EEFB'], sun: '#FFF6D5', land: ['#8CC47E', '#55935D', '#2F6040'] },
  { sky: ['#0B1A2A', '#2C4F6A'], sun: '#F2EFE2', land: ['#22405A', '#172E44', '#0C1A2B'], night: true },
  { sky: ['#9D8BC9', '#FBD3C4'], sun: '#FFF4E6', land: ['#C9A0BE', '#9479A4', '#5E5487'] },
  { sky: ['#F7B267', '#FCE3B0'], sun: '#FFF6D8', land: ['#E09F6B', '#C0714F', '#86452F'] },
  { sky: ['#BFD7EA', '#F4F8FB'], sun: '#FFFFFF', land: ['#D3DEE6', '#9DB3C4', '#61798D'] },
  { sky: ['#4FACFE', '#B8F3FF'], sun: '#FFFFFF', land: ['#6CC5A8', '#2F9A86', '#1C625E'] },
];
const GRADIENTS = [
  ['#FF9A8B', '#FF6A88', '#FFC3A0'], ['#A18CD1', '#FBC2EB', '#8EC5FC'], ['#43E97B', '#38F9D7', '#4FACFE'],
  ['#FAD961', '#F76B1C', '#FF5E62'], ['#667EEA', '#764BA2', '#6B8DD6'], ['#F093FB', '#F5576C', '#FFD1FF'],
  ['#30CFD0', '#330867', '#5EE7DF'], ['#FDDB92', '#D1FDFF', '#96E6A1'], ['#0BA360', '#3CBA92', '#C5F9D7'],
];

function animalDecoy(seed) {
  const r = seededRandom(seed);
  const [a, b] = pick(r, PASTELS);
  const box = el('div', 'decoy decoy-animal');
  box.style.background = `linear-gradient(${Math.round(r() * 360)}deg, ${a}, ${b})`;
  const pet = el('span', 'decoy-emoji', pick(r, ANIMALS));
  pet.style.transform = `rotate(${Math.round((r() - 0.5) * 18)}deg)`;
  box.appendChild(pet);
  return box;
}

function svgEl(tag, attrs) {
  const n = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
}

let sceneSerial = 0;

/** A small generated landscape: sky gradient, sun or moon, three ridges. */
function sceneryDecoy(seed) {
  const r = seededRandom(seed);
  const scene = pick(r, SCENES);
  const id = `scene-${++sceneSerial}`;
  const svg = svgEl('svg', { class: 'decoy', viewBox: '0 0 100 100', preserveAspectRatio: 'xMidYMid slice', 'aria-hidden': 'true' });
  const grad = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.appendChild(svgEl('stop', { offset: '0', 'stop-color': scene.sky[0] }));
  grad.appendChild(svgEl('stop', { offset: '1', 'stop-color': scene.sky[1] }));
  const defs = svgEl('defs', {});
  defs.appendChild(grad);
  svg.appendChild(defs);
  svg.appendChild(svgEl('rect', { x: 0, y: 0, width: 100, height: 100, fill: `url(#${id})` }));

  if (scene.night) {
    for (let i = 0; i < 14; i++) {
      svg.appendChild(svgEl('circle', { cx: (r() * 100).toFixed(1), cy: (r() * 45).toFixed(1), r: (0.3 + r() * 0.5).toFixed(2), fill: '#fff', opacity: (0.4 + r() * 0.5).toFixed(2) }));
    }
  }
  const cx = 18 + r() * 64;
  const cy = 18 + r() * 20;
  const rad = 6 + r() * 5;
  svg.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: (rad * 2.2).toFixed(1), fill: scene.sun, opacity: 0.18 }));
  svg.appendChild(svgEl('circle', { cx: cx.toFixed(1), cy: cy.toFixed(1), r: rad.toFixed(1), fill: scene.sun, opacity: 0.92 }));

  scene.land.forEach((color, i) => {
    const base = 50 + i * 14 + (r() - 0.5) * 6;
    const amp = 12 - i * 3.5;
    const step = 14 + i * 6;
    const pts = [];
    for (let x = -10; x <= 110 + step; x += step) pts.push([x, base + (r() * 2 - 1) * amp]);
    let d = `M${pts[0][0]},${pts[0][1].toFixed(1)}`;
    for (let k = 1; k < pts.length; k++) {
      const [px, py] = pts[k - 1];
      const [x, y] = pts[k];
      d += i === 0
        ? ` L${x},${y.toFixed(1)}` // jagged mountains at the back
        : ` Q${px},${py.toFixed(1)} ${((px + x) / 2).toFixed(1)},${((py + y) / 2).toFixed(1)}`;
    }
    d += ' L120,110 L-10,110 Z';
    svg.appendChild(svgEl('path', { d, fill: color }));
  });
  return svg;
}

function abstractDecoy(seed) {
  const r = seededRandom(seed);
  const [a, b, c] = pick(r, GRADIENTS);
  const p = () => Math.round(r() * 100);
  const box = el('div', 'decoy');
  box.style.background = [
    `radial-gradient(circle at ${p()}% ${p()}%, ${a} 0%, transparent ${50 + p() / 5}%)`,
    `radial-gradient(circle at ${p()}% ${p()}%, ${b} 0%, transparent ${55 + p() / 5}%)`,
    `linear-gradient(${Math.round(r() * 360)}deg, ${c}, ${a})`,
  ].join(', ');
  return box;
}

function decoyFor(mode, seed) {
  if (mode === 'animals') return animalDecoy(seed);
  if (mode === 'scenery') return sceneryDecoy(seed);
  return abstractDecoy(seed);
}

function thumbImage(url, onError) {
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.decoding = 'async';
  img.src = url;
  img.referrerPolicy = 'no-referrer';
  img.alt = '';
  img.draggable = false;
  img.onerror = () => { img.remove(); onError?.(); };
  return img;
}

/**
 * Fill a card thumb. With Discreet view on, covered styles never load the real
 * image; the URL is kept on the card so Alt-peek can fetch it on demand.
 */
function fillThumb(card, thumb, { url, seed, placeholder }) {
  const fallback = () => {
    if (!thumb.querySelector('.placeholder, .decoy')) thumb.insertBefore(placeholder(), thumb.firstChild);
  };
  const mode = discreet.on ? discreet.thumbs : 'show';
  // Files without a preview look like plain files in every style.
  if (!url) { thumb.appendChild(placeholder()); return; }
  card.dataset.thumb = url;
  if (mode === 'show' || mode === 'blur') {
    const img = thumbImage(url, fallback);
    if (mode === 'blur') img.classList.add('veiled');
    thumb.appendChild(img);
    return;
  }
  thumb.appendChild(mode === 'type' ? placeholder() : decoyFor(mode, seed));
}

// ----- Alt-peek -----

let hoverCard = null;

function peekActive() {
  return discreet.on && discreet.peek && discreet.peeking;
}

function applyPeek() {
  for (const c of document.querySelectorAll('.card.peek')) {
    if (c !== hoverCard || !peekActive()) c.classList.remove('peek');
  }
  if (!hoverCard || !peekActive()) return;
  hoverCard.classList.add('peek');
  const thumb = hoverCard.querySelector('.thumb');
  const url = hoverCard.dataset.thumb;
  if (url && thumb && !thumb.querySelector('img')) {
    const img = thumbImage(url);
    img.loading = 'eager';
    img.classList.add('peek-img');
    const cover = thumb.querySelector('.decoy, .placeholder');
    thumb.insertBefore(img, cover ? cover.nextSibling : thumb.firstChild);
  }
}

function endPeek() {
  discreet.peeking = false;
  applyPeek();
}

document.addEventListener('mouseover', (e) => {
  const card = e.target instanceof Element ? e.target.closest('.card:not(.skeleton)') : null;
  if (card === hoverCard) return;
  hoverCard = card;
  if (discreet.peeking) applyPeek();
});
document.addEventListener('keyup', (e) => { if (e.key === 'Alt') endPeek(); });

// ----- window blur -----

function updateWindowVeil() {
  document.documentElement.classList.toggle('veiled', discreet.veil && !document.hasFocus());
}
window.addEventListener('blur', () => { endPeek(); updateWindowVeil(); });
window.addEventListener('focus', updateWindowVeil);

// ----- on / off and settings -----

function setDiscreet(on, { persist = true, render = true } = {}) {
  discreet.on = !!on;
  document.documentElement.classList.toggle('discreet', discreet.on);
  els.discreetOn.checked = discreet.on;
  els.discreetBtn.setAttribute('aria-pressed', String(discreet.on));
  els.discreetBtn.querySelector('use').setAttribute('href', discreet.on ? '#i-eye-off' : '#i-eye');
  if (!discreet.on) endPeek();
  if (persist) persistSettingsSoon();
  if (render) refreshDiscreetViews();
}

/** Re-render every surface that shows names or previews. */
function refreshDiscreetViews() {
  if (state.album) renderAlbumHeader();
  if (state.files.length) renderGrid();
  if (!search.loading) renderSearch();
  renderBookmarks();
  renderQueue();
  updateCipherUi();
  refreshFileProgressNames();
  updateDiscreetSettingsUi();
}

function updateDiscreetSettingsUi() {
  els.discreetBtn.hidden = !discreet.button;
  for (const b of els.dvThumbs.querySelectorAll('.dv-card')) {
    b.setAttribute('aria-checked', String(b.dataset.thumbs === discreet.thumbs));
  }
  for (const b of els.dvNames.querySelectorAll('.seg-btn')) {
    const on = b.dataset.names === discreet.names;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  }
  for (const input of els.dvCats.querySelectorAll('input')) {
    input.checked = discreet.categories.includes(input.value);
  }
  const sample = 'summer_trip_nsfw_04.mp4';
  let after = sample;
  if (discreet.names === 'generic') after = 'VID_0004.mp4';
  else if (discreet.names !== 'off') after = sensitiveWords.mask(sample, wordOptions(discreet.names));
  els.dvNamesPreview.textContent = discreet.names === 'off'
    ? 'Names are shown unchanged.'
    : `e.g. ${sample} → ${after}`;
}

function renderDiscreetSettings() {
  els.dvCats.replaceChildren();
  for (const { id, count } of sensitiveWords.categories()) {
    const chip = el('label', 'dv-chip');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = id;
    chip.appendChild(input);
    chip.appendChild(icon('check'));
    chip.appendChild(document.createTextNode(WORD_CATEGORIES[id] || id));
    chip.appendChild(el('span', 'num', String(count)));
    els.dvCats.appendChild(chip);
  }

  // Three sample tiles per preview style, drawn with the real generators.
  const seeds = ['a-1', 'b-2', 'c-3'];
  const exts = ['jpg', 'mp4', 'png'];
  for (const card of els.dvThumbs.querySelectorAll('.dv-card')) {
    const sample = card.querySelector('.dv-sample');
    sample.replaceChildren();
    seeds.forEach((seed, i) => {
      const tile = el('span', 'dv-tile');
      const mode = card.dataset.thumbs;
      if (mode === 'type') tile.appendChild(thumbPlaceholder({ ext: exts[i] }));
      else if (mode === 'show' || mode === 'blur') {
        const pic = sceneryDecoy('sample-' + seed);
        if (mode === 'blur') pic.classList.add('dv-blurred');
        tile.appendChild(pic);
      } else tile.appendChild(decoyFor(mode, `sample-${mode}-${seed}`));
      sample.appendChild(tile);
    });
  }
  updateDiscreetSettingsUi();
}

/** Word lists changed: refresh masked text and, if names on disk use them, the disk check. */
function onWordListChange() {
  persistSettingsSoon();
  refreshDiscreetViews();
  if (els.cipherSensitive.checked) onCipherChange();
}

// ---------- views & theme ----------

function setView(name) {
  view.current = name;
  for (const v of document.querySelectorAll('.view')) v.hidden = v.dataset.view !== name;
  for (const b of document.querySelectorAll('.nav-item')) {
    const on = b.dataset.view === name;
    b.classList.toggle('active', on);
    if (on) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
  if (name === 'search') updateSearchMarks();
}

function applyTheme(name, { persist = true } = {}) {
  const theme = THEMES[name] ? name : 'acid';
  state.theme = theme;
  const root = document.documentElement;
  root.classList.add('theme-switching');
  root.dataset.theme = theme;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  try { localStorage.setItem('theme', theme); } catch {}
  for (const b of document.querySelectorAll('[data-theme-set]')) {
    b.setAttribute('aria-checked', String(b.dataset.themeSet === theme));
  }
  els.themeName.textContent = THEMES[theme].label;
  window.api.setWindowTheme?.(theme);
  if (persist) persistSettingsSoon();
}

function setOutputDirLabel(p) {
  els.outputDir.textContent = p || 'Choose a folder…';
  els.outputDir.classList.toggle('empty', !p);
  els.browseBtn.title = p ? `Saving to ${p} — click to change` : 'Choose the download folder';
  els.browseBtn.classList.toggle('needs-folder', !p);
  els.openFolderBtn.hidden = !CAN_OPEN_FOLDERS || !p;
}

/** Folder to open for the album on screen: where it was last downloaded, else where it would go. */
function shownAlbumFolder() {
  const last = state.lastSave;
  if (last && state.album && normalizeAlbumUrl(last.albumUrl) === normalizeAlbumUrl(state.album.albumUrl)) return last;
  return { outputDir: state.outputDir, albumName: state.album?.albumName || '', nameRules: getNameRules() };
}

async function openAlbumFolder(target) {
  const r = await window.api.openAlbumFolder(target);
  if (!r.ok) toast(r.error || 'Could not open the folder', 'err', 5000);
  else if (r.albumMissing) toast('Nothing downloaded from this album yet — opened the download folder', 'warn', 4000);
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function applyNameCipher(name, rules) {
  if (!name || !rules || !rules.length) return name;
  let out = String(name);
  for (const rule of rules) {
    if (rule.words) {
      out = sensitiveWords.mask(out, { ...rule.words, style: 'swap' });
      continue;
    }
    if (!rule.find) continue;
    out = out.replace(new RegExp(escapeRegExp(rule.find), 'gi'), rule.replace ?? '');
  }
  return out;
}

/** Rules for names written to disk (mirrors src/name-cipher.js). */
function getNameRules() {
  const rules = [];
  const find = els.cipherFind.value.trim();
  if (els.cipherEnabled.checked && find) rules.push({ find, replace: els.cipherReplace.value });
  if (els.cipherSensitive.checked) {
    rules.push({ words: { categories: [...discreet.categories], custom: discreet.words, strict: discreet.strict } });
  }
  return rules;
}

function displayFileName(fileName) {
  const rules = getNameRules();
  if (!rules.length || !fileName) return fileName || '(unknown)';
  return applyNameCipher(fileName, rules) || fileName;
}

function displayAlbumName(albumName) {
  const raw = albumName || '';
  const rules = getNameRules();
  if (!rules.length || !raw) return raw;
  return applyNameCipher(raw, rules) || raw;
}

function mismatchCount() {
  let n = 0;
  for (const v of state.localStatus.values()) {
    if (v.status === 'size_mismatch') n++;
  }
  return n;
}

function updateMismatchUi() {
  const n = mismatchCount();
  els.mismatchLabel.textContent = n
    ? `Re-download size mismatches (${n})`
    : 'Re-download size mismatches';
  els.redownloadMismatch.disabled = !els.skipExisting.checked;
  els.selectMismatchBtn.hidden = n === 0;
}

function updateCipherUi() {
  els.cipherFields.hidden = !els.cipherEnabled.checked;
  const rules = getNameRules();
  if (!els.cipherEnabled.checked) {
    els.cipherPreview.textContent = '';
  } else if (!els.cipherFind.value.trim()) {
    els.cipherPreview.textContent = 'Enter a word to replace in folder and file names';
  } else if (state.album) {
    const from = state.album.albumName || '';
    const to = displayAlbumName(from);
    els.cipherPreview.textContent = from && from !== to
      ? `Folder: ${maskText(from)} → ${maskText(to)}`
      : `Folder: ${maskText(to || from)}`;
  } else {
    const sample = 'AlbumName_file.mp4';
    els.cipherPreview.textContent = `e.g. ${sample} → ${applyNameCipher(sample, rules)}`;
  }
  if (state.album) {
    const shown = displayAlbumName(state.album.albumName);
    els.albumMeta.textContent = shown && shown !== state.album.albumName
      ? `Saves to folder “${maskText(shown)}”`
      : '';
  }
}

function persistSettingsSoon() {
  clearTimeout(settingsTimer);
  settingsTimer = setTimeout(() => {
    window.api.setSettings({
      outputDir: state.outputDir,
      queueOutputDir: state.queueOutputDir,
      concurrency: Math.max(1, parseInt(els.concurrency.value, 10) || 4),
      maxRetries: Number.isFinite(parseInt(els.setMaxRetries.value, 10)) ? parseInt(els.setMaxRetries.value, 10) : 5,
      limitRateMBps: Number(els.setLimitRate.value) || 0,
      proxy: els.setProxy.value.trim(),
      maintenanceStrategy: els.setMaintenance.value,
      diskCheck: !!els.setDiskCheck.checked,
      skipExisting: !!els.skipExisting.checked,
      redownloadMismatch: !!els.redownloadMismatch.checked,
      cipherEnabled: !!els.cipherEnabled.checked,
      cipherFind: els.cipherFind.value,
      cipherReplace: els.cipherReplace.value,
      cipherSensitive: !!els.cipherSensitive.checked,
      theme: state.theme,
      searchHost: els.searchHost.value.trim(),
      searchMode: search.mode,
      searchSort: search.sort,
      searchPer: search.per,
      discreet: discreet.on,
      discreetThumbs: discreet.thumbs,
      discreetNames: discreet.names,
      discreetCategories: discreet.categories,
      discreetWords: discreet.words,
      discreetStrict: discreet.strict,
      discreetPeek: discreet.peek,
      discreetVeil: discreet.veil,
      discreetStartOn: discreet.startOn,
      discreetButton: discreet.button,
    }).then((res) => {
      if (res && res.ok === false) toast(res.error || 'Could not save settings', 'err', 6000);
    });
  }, 200);
}

function normalizeAlbumUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    u.hash = '';
    let href = u.href;
    if (href.endsWith('/')) href = href.slice(0, -1);
    return href;
  } catch {
    return s.replace(/\/+$/, '');
  }
}

function looksLikeAlbumUrl(url) {
  try {
    return /\/a\/[^/?#]+/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function parseUrlList(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

function pendingQueueCount() {
  return state.queue.filter((q) =>
    q.status === 'queued' || q.status === 'loading' || q.status === 'downloading'
  ).length;
}

function queueHasActiveUrl(url) {
  const n = normalizeAlbumUrl(url);
  return state.queue.some((q) =>
    normalizeAlbumUrl(q.url) === n
    && (q.status === 'queued' || q.status === 'loading' || q.status === 'downloading')
  );
}

function persistQueueSoon() {
  clearTimeout(queueTimer);
  queueTimer = setTimeout(() => {
    window.api.saveQueue(state.queue.map((q) => ({
      id: q.id,
      url: q.url,
      title: q.title || '',
      selectedFiles: q.selectedFiles,
      outputDir: q.outputDir || '',
      fileCount: q.fileCount || 0,
      status: q.status === 'done' || q.status === 'failed' ? q.status : 'queued',
      error: q.error || '',
      result: q.result || null,
      addedAt: q.addedAt,
    })));
  }, 200);
}

function closeDrawers() {
  if (view.current !== 'album') setView('album');
}

function setQueueOpen(open) {
  setView(open ? 'queue' : 'album');
}

function queueDefaultDir() {
  return state.queueOutputDir || state.outputDir || '';
}

function resolveQueueItemOutputDir(item) {
  if (!item) return queueDefaultDir();
  return item.outputDir || queueDefaultDir();
}

function syncQueueFolderInput() {
  els.queueOutputDir.value = state.queueOutputDir || '';
  els.queueOutputDir.placeholder = state.outputDir
    ? `Using Output folder: ${state.outputDir}`
    : 'Pick a folder for the queue…';
  els.queueOutputDir.title = state.queueOutputDir
    ? 'Default save location for queued albums without their own folder'
    : (state.outputDir
      ? `No queue folder set — albums without a custom folder use ${state.outputDir}`
      : 'Default save location for queued albums that do not have their own folder');
}

function queueAlbumPrefix() {
  if (!state.queueRunning || !state.queueActiveId) return '';
  const idx = state.queue.findIndex((q) => q.id === state.queueActiveId) + 1;
  if (idx <= 0) return '';
  return `Album ${idx}/${state.queue.length} · `;
}

function queueItemMeta(item) {
  if (item.status === 'downloading' || item.status === 'loading') {
    if (item.total) {
      const extra = [];
      if (item.failed) extra.push(`failed ${item.failed}`);
      if (item.skipped) extra.push(`skipped ${item.skipped}`);
      return `${item.completed || 0} / ${item.total} files`
        + (extra.length ? ` (${extra.join(', ')})` : '');
    }
    if (item.status === 'loading') return 'Fetching album…';
    return 'Starting…';
  }
  if (item.status === 'done' && item.result) {
    const skipped = item.result.skipped || 0;
    const ok = item.result.count ?? item.result.ok ?? 0;
    return `OK ${ok}`
      + (skipped ? ` · skipped ${skipped}` : '')
      + (item.result.failed ? ` · failed ${item.result.failed}` : '');
  }
  if (item.status === 'failed') return item.error || 'Failed';
  if (item.selectedFiles) return `${item.selectedFiles.length} selected file(s)`;
  if (item.fileCount) return `${item.fileCount} file(s) · all files`;
  return 'All files';
}

function updateQueueBadge() {
  const n = pendingQueueCount();
  els.queueCount.textContent = String(n);
  els.queueCount.hidden = n === 0;
}

function updateQueueRunStatus() {
  updateResetButton();
  updateActivity();
  const running = state.queueRunning;
  els.queueRunStatus.hidden = !running;
  els.queueStopBtn.hidden = !running;
  const hasPaste = !!els.queueUrls.value.trim();
  els.queueStartBtn.disabled = running || (pendingQueueCount() === 0 && !hasPaste);
  els.loadBtn.disabled = running || state.loadingAlbum;

  if (!running) {
    els.queueRunLabel.textContent = '';
    els.queueHint.textContent = pendingQueueCount()
      ? `${pendingQueueCount()} album(s) waiting — click Start queue.`
      : '';
    return;
  }

  const item = state.queue.find((q) => q.id === state.queueActiveId);
  const idx = item ? state.queue.findIndex((q) => q.id === item.id) + 1 : 0;
  const title = item ? shownAlbumTitle(item.title || item.url, item.url) : '';
  const fileBit = item && item.total ? ` · ${item.completed || 0}/${item.total} files` : '';
  const dest = resolveQueueItemOutputDir(item);
  const folderBit = dest ? ` → ${dest}` : '';
  const stopBit = state.queueStopRequested ? ' · stopping after this album' : '';
  els.queueRunLabel.textContent = `Queue ${idx}/${state.queue.length}: ${title}${fileBit}${folderBit}${stopBit}`;
  els.queueHint.textContent = state.queueStopRequested
    ? 'Will stop after the current album finishes.'
    : `Downloading album ${idx} of ${state.queue.length}. New links added now will run next.`;
}

function updateActiveQueueCard() {
  const item = state.queue.find((q) => q.id === state.queueActiveId);
  if (!item) return;
  const card = els.queueList.querySelector(`.q-card[data-id="${item.id}"]`);
  if (!card) return;
  const meta = card.querySelector('.q-meta');
  if (meta) meta.textContent = queueItemMeta(item);
  const status = card.querySelector('.q-status');
  if (status) {
    status.className = 'q-status ' + item.status;
    status.textContent = item.status;
  }
  const fill = card.querySelector('.q-progress .fill');
  if (fill && item.total) fill.style.width = `${Math.min(100, ((item.completed || 0) / item.total) * 100)}%`;
}

function renderQueue() {
  updateQueueBadge();
  updateQueueRunStatus();
  const items = state.queue || [];
  els.queueList.innerHTML = '';
  if (!items.length) {
    els.queueList.appendChild(el('div', 'list-empty', 'Queue is empty. Paste album URLs above, or use “Add to queue” on an open album.'));
    return;
  }

  items.forEach((item, index) => {
    const busy = item.status === 'loading' || item.status === 'downloading';
    const card = document.createElement('article');
    card.className = 'q-card'
      + (item.id === state.queueActiveId ? ' active' : '')
      + (item.status === 'done' ? ' done' : '')
      + (item.status === 'failed' ? ' failed' : '');
    card.dataset.id = item.id;

    card.appendChild(el('div', 'q-index', String(index + 1).padStart(2, '0')));

    const body = el('div', 'q-body');
    const head = el('div', 'q-head');
    const qTitle = shownAlbumTitle(item.title || albumIdFromUrl(item.url) || item.url, item.url);
    const title = el('div', 'q-title', qTitle);
    title.title = namesMasked() ? qTitle : (item.title || item.url);
    head.appendChild(title);
    head.appendChild(el('span', 'q-status ' + item.status, item.status));
    body.appendChild(head);
    body.appendChild(el('div', 'q-url', item.url));

    const line = el('div', 'q-line');
    line.appendChild(el('span', 'q-meta', queueItemMeta(item)));
    const dest = resolveQueueItemOutputDir(item);
    const folderEl = el('span', 'q-folder' + (item.outputDir ? ' custom' : '') + (dest ? '' : ' none'));
    folderEl.appendChild(icon('folder'));
    const folderText = el('span');
    if (item.outputDir) {
      folderText.textContent = dest;
      folderEl.title = `Custom folder: ${dest}`;
    } else if (dest) {
      folderText.textContent = dest;
      folderEl.title = `Uses the queue folder: ${dest}`;
    } else {
      folderText.textContent = 'No folder yet — set the queue folder above';
    }
    folderEl.appendChild(folderText);
    line.appendChild(folderEl);
    body.appendChild(line);

    if (busy) {
      const bar = el('div', 'bar q-progress');
      const fill = el('div', 'fill');
      fill.style.width = item.total ? `${Math.min(100, ((item.completed || 0) / item.total) * 100)}%` : '0%';
      bar.appendChild(fill);
      body.appendChild(bar);
    }
    card.appendChild(body);

    const actions = el('div', 'q-actions');

    if (item.status === 'done' && CAN_OPEN_FOLDERS) {
      actions.appendChild(makeBtn({
        label: 'Open folder', iconName: 'folder-open', cls: 'btn btn-sm btn-ghost',
        title: 'Open this album’s folder in the file manager',
        onClick: () => openAlbumFolder({
          albumDir: item.result?.albumDir || '',
          outputDir: dest,
          albumName: item.title || '',
          nameRules: getNameRules(),
        }),
      }));
    }

    if (item.status === 'failed' || (item.status === 'done' && item.result && item.result.failed)) {
      actions.appendChild(makeBtn({
        label: 'Retry', iconName: 'retry', cls: 'btn btn-sm btn-accent',
        onClick: () => retryQueueItem(item.id),
      }));
    }

    if (item.status === 'queued') {
      actions.appendChild(makeBtn({
        iconName: 'up', cls: 'btn btn-sm btn-ghost btn-icon', title: 'Move up',
        disabled: index === 0
          || items[index - 1].status === 'loading'
          || items[index - 1].status === 'downloading',
        onClick: () => moveQueueItem(item.id, -1),
      }));
      actions.appendChild(makeBtn({
        iconName: 'down', cls: 'btn btn-sm btn-ghost btn-icon', title: 'Move down',
        disabled: index === items.length - 1
          || items[index + 1].status === 'loading'
          || items[index + 1].status === 'downloading',
        onClick: () => moveQueueItem(item.id, 1),
      }));
    }

    if (!busy) {
      actions.appendChild(makeBtn({
        iconName: 'folder', cls: 'btn btn-sm btn-ghost btn-icon',
        title: item.outputDir ? 'Pick a different folder for this album only' : 'Pick a folder for this album only',
        onClick: () => pickQueueItemFolder(item.id),
      }));

      if (item.outputDir) {
        actions.appendChild(makeBtn({
          label: 'Use default', cls: 'btn btn-sm btn-ghost',
          title: queueDefaultDir()
            ? `Use the queue folder (${queueDefaultDir()})`
            : 'Use the queue folder (set above or the album view folder)',
          onClick: () => clearQueueItemFolder(item.id),
        }));
      }

      actions.appendChild(makeBtn({
        iconName: 'trash', cls: 'btn btn-sm btn-ghost btn-icon btn-danger', title: 'Remove from queue',
        onClick: () => removeQueueItem(item.id),
      }));
    }

    card.appendChild(actions);
    els.queueList.appendChild(card);
  });
}

function moveQueueItem(id, dir) {
  const i = state.queue.findIndex((q) => q.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= state.queue.length) return;
  const a = state.queue[i];
  const b = state.queue[j];
  if (a.status === 'loading' || a.status === 'downloading') return;
  if (b.status === 'loading' || b.status === 'downloading') return;
  state.queue[i] = b;
  state.queue[j] = a;
  persistQueueSoon();
  renderQueue();
}

function removeQueueItem(id) {
  const item = state.queue.find((q) => q.id === id);
  if (!item) return;
  if (item.status === 'loading' || item.status === 'downloading') return;
  state.queue = state.queue.filter((q) => q.id !== id);
  persistQueueSoon();
  renderQueue();
}

function retryQueueItem(id) {
  const item = state.queue.find((q) => q.id === id);
  if (!item) return;
  item.status = 'queued';
  item.error = '';
  item.result = null;
  item.completed = 0;
  item.total = 0;
  persistQueueSoon();
  renderQueue();
}

async function pickQueueDefaultFolder({ quiet = false } = {}) {
  const r = await window.api.pickFolder();
  if (!r.ok) return '';
  state.queueOutputDir = r.path;
  syncQueueFolderInput();
  persistSettingsSoon();
  renderQueue();
  if (!quiet) toast(`Queue folder: ${r.path}`, 'ok');
  return r.path;
}

async function pickQueueItemFolder(id) {
  const item = state.queue.find((q) => q.id === id);
  if (!item) return;
  if (item.status === 'loading' || item.status === 'downloading') return;
  const r = await window.api.pickFolder();
  if (!r.ok) return;
  item.outputDir = r.path;
  persistQueueSoon();
  renderQueue();
  toast(`Folder for this album: ${r.path}`, 'ok');
}

function clearQueueItemFolder(id) {
  const item = state.queue.find((q) => q.id === id);
  if (!item) return;
  if (item.status === 'loading' || item.status === 'downloading') return;
  item.outputDir = '';
  persistQueueSoon();
  renderQueue();
}

async function applyQueueFolderToAllQueued() {
  let dir = queueDefaultDir();
  if (!dir) {
    dir = await pickQueueDefaultFolder({ quiet: true });
    if (!dir) {
      toast('Pick a queue folder first', 'warn');
      return;
    }
  }
  let cleared = 0;
  for (const q of state.queue) {
    if (q.status === 'loading' || q.status === 'downloading') continue;
    if (q.status !== 'queued' && q.status !== 'failed') continue;
    if (q.outputDir) {
      q.outputDir = '';
      cleared++;
    }
  }
  persistQueueSoon();
  renderQueue();
  toast(
    cleared
      ? `Cleared ${cleared} custom folder(s). Queued albums use ${dir}`
      : `Queued albums use ${dir}`,
    'ok'
  );
}

function clearFinishedQueue() {
  const before = state.queue.length;
  state.queue = state.queue.filter((q) => q.status !== 'done' && q.status !== 'failed');
  if (state.queue.length === before) {
    toast('Nothing finished to clear', 'warn');
    return;
  }
  persistQueueSoon();
  renderQueue();
}

function addUrlsToQueue(text, extras = {}) {
  const lines = parseUrlList(text);
  const single = lines.length === 1;
  let added = 0;
  let dupes = 0;
  let skipped = 0;
  for (const line of lines) {
    if (!looksLikeAlbumUrl(line)) {
      skipped++;
      continue;
    }
    const url = normalizeAlbumUrl(line);
    if (queueHasActiveUrl(url)) {
      dupes++;
      continue;
    }
    state.queue.push({
      id: crypto.randomUUID(),
      url,
      title: (single && extras.title) || albumIdFromUrl(url) || url,
      selectedFiles: single && extras.selectedFiles ? extras.selectedFiles : null,
      outputDir: single && extras.outputDir ? extras.outputDir : '',
      fileCount: single ? (extras.fileCount || 0) : 0,
      status: 'queued',
      error: '',
      result: null,
      addedAt: new Date().toISOString(),
      filesCache: single ? extras.filesCache || null : null,
    });
    added++;
  }
  if (added) persistQueueSoon();
  renderQueue();
  return { added, dupes, skipped, total: lines.length };
}

function announceQueueAdd(r) {
  if (!r || (!r.added && !r.dupes && !r.skipped && !r.total)) {
    toast('No URLs to add', 'warn');
    return;
  }
  const bits = [];
  if (r.added) bits.push(`Added ${r.added}`);
  if (r.dupes) bits.push(`${r.dupes} already queued`);
  if (r.skipped) bits.push(`${r.skipped} skipped (not album URLs)`);
  toast(bits.join(' · ') || 'No URLs to add', r.added ? 'ok' : 'warn');
}

function addCurrentAlbumToQueue() {
  if (!state.album) { toast('Load an album first', 'warn'); return 0; }
  const selectedFiles = selectedVisibleFiles().map((f) => f.pageUrl);
  if (!selectedFiles.length) { toast('Select at least one file', 'warn'); return 0; }
  const url = state.album.albumUrl || currentUrl();
  if (!url) { toast('Album URL missing', 'warn'); return 0; }
  const all = selectedFiles.length === state.files.length;
  const r = addUrlsToQueue(url, {
    title: state.album.albumName || albumIdFromUrl(url),
    selectedFiles: all ? null : selectedFiles,
    fileCount: selectedFiles.length,
    filesCache: state.files,
  });
  if (r.added) {
    toast(
      state.queueRunning
        ? 'Added to queue — starts after the current album'
        : 'Added to queue. Open Queue and click Start queue when ready.',
      'ok'
    );
  } else {
    announceQueueAdd(r);
  }
  return r.added;
}

function isScreenBusy() {
  return state.loadingAlbum || state.downloading || state.queueRunning || state.scanningLocal;
}

function updateResetButton() {
  els.hideDownloaded.disabled = !state.album || !state.outputDir || !els.skipExisting.checked
    || state.loadingAlbum || state.scanningLocal;
  els.hideDownloadedOpt.title = !state.outputDir || !els.skipExisting.checked
    ? 'Turn on Check disk and choose a download folder first'
    : 'Hide files marked On disk. Missing, incomplete and damaged files stay visible.';
  els.resetBtn.disabled = isScreenBusy();
  els.resetBtn.title = els.resetBtn.disabled
    ? 'Wait for the current operation to finish before clearing the screen'
    : 'Clear the current album and return to the start screen';
}

function resetViewFilters() {
  view.type = 'all';
  view.search = '';
  view.exts = new Set();
  view.minSize = 0;
  view.maxSize = 0;
  for (const el of [els.extFilter, els.minSizeFilter, els.maxSizeFilter]) {
    el.value = '';
    el.classList.remove('invalid');
  }
  view.anchorUrl = '';
  els.searchInput.value = '';
  els.searchClear.hidden = true;
  for (const b of els.typeFilter.querySelectorAll('.seg-btn')) {
    const on = b.dataset.type === 'all';
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  }
}

function setLoadProgress(fraction) {
  if (fraction == null) {
    els.loadBar.hidden = true;
    els.loadBar.classList.remove('indeterminate');
    return;
  }
  els.loadBar.hidden = false;
  els.loadBar.classList.toggle('indeterminate', fraction < 0);
  els.loadFill.style.width = fraction < 0 ? '' : `${Math.round(fraction * 100)}%`;
}

function renderSkeleton(n = 12) {
  els.grid.replaceChildren();
  for (let i = 0; i < n; i++) {
    const card = el('div', 'card skeleton');
    card.appendChild(el('div', 'thumb'));
    const info = el('div', 'info');
    info.appendChild(el('div', 'sk-line'));
    info.appendChild(el('div', 'sk-line short'));
    card.appendChild(info);
    els.grid.appendChild(card);
  }
}

function renderAlbumHeader() {
  if (!state.album) {
    els.albumTitle.textContent = 'Loading album…';
    els.albumStats.replaceChildren();
    return;
  }
  const name = shownAlbumTitle(
    state.album.albumName || albumIdFromUrl(state.album.albumUrl) || 'Album',
    state.album.albumUrl
  );
  els.albumTitle.textContent = name;
  els.albumTitle.title = name;
  const counts = { image: 0, video: 0, other: 0 };
  let bytes = 0;
  let unknown = 0;
  for (const f of state.files) {
    counts[fileKind(f)]++;
    if (f.sizeBytes) bytes += f.sizeBytes; else unknown++;
  }
  const parts = [];
  parts.push(`<b>${state.files.length}</b> file${state.files.length === 1 ? '' : 's'}`);
  if (bytes) parts.push(`<b>${fmtBytes(bytes)}</b>${unknown ? '+' : ''}`);
  const kinds = [];
  if (counts.image) kinds.push(`${counts.image} images`);
  if (counts.video) kinds.push(`${counts.video} videos`);
  if (counts.other) kinds.push(`${counts.other} other`);
  if (kinds.length > 1) parts.push(kinds.join(' · '));
  els.albumStats.innerHTML = parts.join('  ·  ');

  for (const k of ['all', 'image', 'video', 'other']) {
    const n = k === 'all' ? state.files.length : counts[k];
    const countEl = els.typeFilter.querySelector(`[data-count="${k}"]`);
    if (countEl) countEl.textContent = String(n);
    const btn = els.typeFilter.querySelector(`[data-type="${k}"]`);
    if (btn && k !== 'all') btn.hidden = n === 0 && view.type !== k;
  }
  els.typeFilter.hidden = state.files.length === 0;
}

function resetScreen() {
  if (isScreenBusy()) return;
  clearTimeout(scanTimer);
  state.album = null;
  state.files = [];
  state.fileIndex = new Map();
  state.selected.clear();
  state.localStatus.clear();
  state.perFile.clear();
  resetViewFilters();
  els.hideDownloaded.checked = false;
  els.filteredCount.hidden = true;
  els.filteredEmpty.hidden = true;
  els.urlInput.value = '';
  els.grid.replaceChildren();
  els.fileProgress.replaceChildren();
  els.previewProgress.textContent = '';
  els.localScanStatus.textContent = '';
  els.albumMeta.textContent = '';
  els.summary.textContent = '';
  els.summary.className = 'dock-summary';
  els.totalFill.style.width = '0%';
  els.totalLabel.textContent = '0 / 0';
  els.previewSection.hidden = true;
  els.bottomBar.hidden = true;
  els.progressSection.hidden = true;
  els.saveAlbumBtn.hidden = true;
  els.selectMissingBtn.hidden = true;
  setLoadProgress(null);
  els.empty.hidden = false;
  closeDrawers();
  document.getElementById('toasts').replaceChildren();
  els.albumScroller.scrollTop = 0;
  updateCipherUi();
  updateMismatchUi();
  updateQueueRunStatus();
  setSelectedCount();
  els.urlInput.focus();
}

function showAlbum(album, { selectedUrls = null } = {}) {
  invalidateLocalScan();
  const sameAlbum = state.album && album
    && normalizeAlbumUrl(state.album.albumUrl) === normalizeAlbumUrl(album.albumUrl);
  state.album = album;
  state.files = album.files || [];
  state.fileIndex = new Map(state.files.map((f, i) => [f.pageUrl, i]));
  if (selectedUrls) {
    const allow = new Set(selectedUrls);
    state.selected = new Set(state.files.filter((f) => allow.has(f.pageUrl)).map((f) => f.pageUrl));
  } else {
    state.selected = new Set(state.files.map((f) => f.pageUrl));
  }
  if (!sameAlbum) {
    resetViewFilters();
    els.albumScroller.scrollTop = 0;
  }
  els.empty.hidden = true;
  els.previewSection.hidden = false;
  els.bottomBar.hidden = false;
  els.saveAlbumBtn.hidden = false;
  els.previewProgress.textContent = state.files.length ? '' : 'No files found';
  setLoadProgress(null);
  renderAlbumHeader();
  updateCipherUi();
  renderGrid();
  setSelectedCount();
}

function getDownloadOptions() {
  return {
    outputDir: state.outputDir,
    concurrency: clampConcurrency(els.concurrency.value),
    skipExisting: !!els.skipExisting.checked,
    redownloadMismatch: !!els.redownloadMismatch.checked,
    nameRules: getNameRules(),
  };
}

function clampConcurrency(v) {
  return Math.max(1, Math.min(16, parseInt(v, 10) || 4));
}

// ---------- run stats (speed / ETA) ----------

function startRunStats(files, selectedUrls) {
  const byUrl = new Map(files.map((f) => [f.pageUrl, f.sizeBytes || 0]));
  run.active = true;
  run.bytesDone = 0;
  run.bytesPlanned = 0;
  run.unknownSizes = 0;
  run.sizes = new Map();
  for (const u of selectedUrls) {
    const size = byUrl.get(u) || 0;
    run.sizes.set(u, size);
    run.bytesPlanned += size;
    if (!size) run.unknownSizes++;
  }
  run.speed = 0;
  run.lastBytes = 0;
  run.lastAt = performance.now();
  run.completed = 0;
  run.total = selectedUrls.length;
  clearInterval(run.timer);
  run.timer = setInterval(sampleRunSpeed, 1000);
  els.progressSection.classList.remove('finished');
  renderRunStats();
}

function sampleRunSpeed() {
  const now = performance.now();
  const dt = (now - run.lastAt) / 1000;
  if (dt <= 0) return;
  const inst = (run.bytesDone - run.lastBytes) / dt;
  run.speed = run.speed ? run.speed * 0.7 + inst * 0.3 : inst;
  run.lastBytes = run.bytesDone;
  run.lastAt = now;
  renderRunStats();
}

function stopRunStats() {
  clearInterval(run.timer);
  run.timer = 0;
  run.active = false;
  run.speed = 0;
  els.progressSection.classList.add('finished');
  renderRunStats();
}

function renderRunStats() {
  const planned = Math.max(run.bytesPlanned, run.bytesDone);
  els.dpBytes.textContent = run.bytesDone || planned
    ? (!run.unknownSizes && planned
      ? `${fmtBytes(run.bytesDone || 0)} of ${fmtBytes(planned)}`
      : `${fmtBytes(run.bytesDone)} received`)
    : '';
  els.dpSpeed.textContent = run.active && run.speed > 1024 ? `${fmtBytes(run.speed)}/s` : '';
  const remaining = planned - run.bytesDone;
  els.dpEta.textContent = run.active && !run.unknownSizes && run.speed > 1024 && remaining > 0
    ? `~${fmtDuration(remaining / run.speed)} left`
    : '';
  updateActivity();
}

function updateActivity() {
  const busy = state.downloading || state.queueRunning;
  els.activity.hidden = !busy;
  if (!busy) return;
  let label = 'Downloading';
  if (state.queueRunning) {
    const idx = state.queue.findIndex((q) => q.id === state.queueActiveId) + 1;
    label = idx > 0 ? `Queue · album ${idx}/${state.queue.length}` : 'Queue running';
  }
  els.activityLabel.textContent = label;
  const pct = run.total ? (run.completed / run.total) * 100 : 0;
  els.activityFill.style.width = `${pct}%`;
  els.activityCount.textContent = run.total ? `${run.completed}/${run.total} files` : 'Preparing…';
  els.activitySpeed.textContent = run.active && run.speed > 1024 ? `${fmtBytes(run.speed)}/s` : '';
}

async function downloadFiles({ albumUrl, albumName, files, selectedUrls, summaryPrefix = '', outputDir = '' }) {
  const opts = getDownloadOptions();
  const jobId = `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const dest = outputDir || opts.outputDir;
  if (!dest) return { ok: false, error: 'No output directory' };
  const fileMeta = {};
  for (const f of files) {
    fileMeta[f.pageUrl] = { fileName: f.fileName || '', sizeBytes: f.sizeBytes || 0 };
  }

  els.progressSection.hidden = false;
  els.totalFill.style.width = '0%';
  els.totalLabel.textContent = `${summaryPrefix}0 / ${selectedUrls.length} files`;
  els.fileProgress.innerHTML = '';
  state.perFile.clear();
  for (const card of els.grid.querySelectorAll('.card.is-active')) card.classList.remove('is-active');
  startRunStats(files, selectedUrls);

  els.summary.className = 'dock-summary';
  els.summary.textContent = opts.skipExisting
    ? `${summaryPrefix}Downloading ${selectedUrls.length} file(s) · skipping complete files on disk`
    : `${summaryPrefix}Downloading ${selectedUrls.length} file(s)…`;

  const unsubProg = window.api.onDownloadProgress((data) => {
    updateFileProgress(data);
    if (!state.queueActiveId || data.completed === undefined) return;
    const item = state.queue.find((q) => q.id === state.queueActiveId);
    if (!item) return;
    item.completed = data.completed;
    item.failed = data.failed || 0;
    item.skipped = data.skipped || 0;
    item.total = data.total;
    updateQueueRunStatus();
    updateActiveQueueCard();
  });

  state.jobId = jobId;
  state.lastSave = { albumUrl, outputDir: dest, albumName, nameRules: opts.nameRules, albumDir: '' };
  els.stopBtn.disabled = false;
  els.stopBtn.hidden = false;
  try {
    const r = await window.api.downloadAlbum({
      jobId,
      albumUrl,
      albumName,
      outputDir: dest,
      selectedFiles: selectedUrls,
      concurrency: opts.concurrency,
      skipExisting: opts.skipExisting,
      redownloadMismatch: opts.redownloadMismatch,
      nameRules: opts.nameRules,
      fileMeta,
    });
    if (r.albumDir) state.lastSave.albumDir = r.albumDir;
    return r;
  } finally {
    unsubProg && unsubProg();
    stopRunStats();
    state.jobId = '';
    els.stopBtn.hidden = true;
  }
}

async function prepareQueueAlbum(item) {
  let album;
  let files;
  const sameOpen = state.album
    && normalizeAlbumUrl(state.album.albumUrl) === normalizeAlbumUrl(item.url)
    && state.files.length;

  if (item.filesCache && item.filesCache.length) {
    files = item.filesCache;
    album = {
      albumUrl: item.url,
      albumName: item.title || (sameOpen ? state.album.albumName : '') || albumIdFromUrl(item.url),
      files,
    };
  } else if (sameOpen) {
    album = state.album;
    files = state.files;
  } else {
    els.previewProgress.textContent = 'Fetching album…';
    const r = await window.api.albumMeta(item.url);
    if (!r.ok) throw new Error(r.error || 'Failed to load album');
    album = r.album;
    files = r.album.files || [];
  }

  item.title = album.albumName || item.title;
  item.fileCount = files.length;
  item.filesCache = files;

  const selectedUrls = item.selectedFiles
    ? files.map((f) => f.pageUrl).filter((u) => item.selectedFiles.includes(u))
    : files.map((f) => f.pageUrl);

  if (!selectedUrls.length) {
    throw new Error(files.length ? 'None of the selected files are in this album' : 'Album has no files');
  }

  showAlbum(album, { selectedUrls });
  return { album, files, selectedUrls };
}

async function startQueue() {
  const pasted = els.queueUrls.value.trim();
  if (pasted) {
    const r = addUrlsToQueue(pasted);
    els.queueUrls.value = '';
    announceQueueAdd(r);
  } else if (pendingQueueCount() === 0 && looksLikeAlbumUrl(currentUrl())) {
    addUrlsToQueue(currentUrl());
  }

  if (state.queueRunning) {
    if (pendingQueueCount()) toast('Already running — new albums will start next', 'ok');
    return;
  }
  if (pendingQueueCount() === 0) {
    toast('Queue is empty — paste album URLs first', 'warn');
    return;
  }
  const needsFolder = state.queue.some((q) =>
    (q.status === 'queued' || q.status === 'loading') && !resolveQueueItemOutputDir(q)
  );
  if (needsFolder) {
    const picked = await pickQueueDefaultFolder();
    if (!picked) {
      toast('Pick a folder for the queue first', 'warn');
      return;
    }
    if (!state.outputDir) {
      state.outputDir = picked;
      setOutputDirLabel(picked);
      persistSettingsSoon();
    }
  }

  state.queueRunning = true;
  state.queueStopRequested = false;
  state.downloading = true;
  els.downloadBtn.disabled = true;
  els.empty.hidden = true;
  els.bottomBar.hidden = false;
  setQueueOpen(true);
  renderQueue();

  const runTotals = { ok: 0, failed: 0, skipped: 0, albumsOk: 0, albumsFailed: 0 };

  try {
    while (!state.queueStopRequested) {
      const item = state.queue.find((q) => q.status === 'queued');
      if (!item) break;

      state.queueActiveId = item.id;
      item.status = 'loading';
      item.error = '';
      item.completed = 0;
      item.total = 0;
      renderQueue();

      try {
        const prepared = await prepareQueueAlbum(item);
        if (state.queueStopRequested) {
          item.status = 'queued';
          break;
        }
        item.status = 'downloading';
        item.total = prepared.selectedUrls.length;
        item.completed = 0;
        renderQueue();

        const dest = resolveQueueItemOutputDir(item);
        if (!dest) throw new Error('No output folder for this album');
        if (els.skipExisting.checked) {
          await runLocalScan({ autoSelectMissing: false, outputDir: dest });
        }
        const r = await downloadFiles({
          albumUrl: prepared.album.albumUrl,
          albumName: prepared.album.albumName,
          files: prepared.files,
          selectedUrls: prepared.selectedUrls,
          summaryPrefix: queueAlbumPrefix(),
          outputDir: dest,
        });

        if (r.ok && r.stopped) {
          item.status = 'queued';
          item.error = '';
          state.queueStopRequested = true;
          toast('Stopped. Partial files are kept and resume when the queue runs again.', 'warn', 5000);
          persistQueueSoon();
          state.queueActiveId = '';
          renderQueue();
          break;
        }
        if (!r.ok) {
          item.status = 'failed';
          item.error = r.error || 'Download failed';
          runTotals.albumsFailed++;
          toast(`${shownAlbumTitle(item.title, item.url) || 'Album'}: ${item.error}`, 'err', 5000);
        } else {
          item.status = 'done';
          item.result = r;
          runTotals.ok += r.count || 0;
          runTotals.failed += r.failed || 0;
          runTotals.skipped += r.skipped || 0;
          runTotals.albumsOk++;
          if (r.failed) {
            toast(`${shownAlbumTitle(item.title, item.url) || 'Album'}: ${r.failed} file(s) failed`, 'warn', 4000);
          }
        }
        if (els.skipExisting.checked) {
          await runLocalScan({ autoSelectMissing: false, outputDir: dest });
        }
      } catch (e) {
        item.status = 'failed';
        item.error = e.message || String(e);
        runTotals.albumsFailed++;
        toast(`${shownAlbumTitle(item.title, item.url) || 'Album'}: ${item.error}`, 'err', 5000);
      }

      persistQueueSoon();
      state.queueActiveId = '';
      renderQueue();
    }
  } finally {
    const stopped = state.queueStopRequested;
    state.queueRunning = false;
    state.queueStopRequested = false;
    state.queueActiveId = '';
    state.downloading = false;
    setSelectedCount();
    persistQueueSoon();
    renderQueue();

    const remaining = pendingQueueCount();
    if (stopped && remaining) {
      els.summary.className = 'dock-summary warn';
      els.summary.textContent = `Queue paused · ${remaining} album(s) still waiting`;
      toast(`Stopped after current album. ${remaining} left in queue.`, 'warn', 5000);
    } else {
      const hadErrors = runTotals.albumsFailed || runTotals.failed;
      els.summary.className = 'dock-summary ' + (hadErrors ? 'warn' : 'ok');
      els.summary.textContent =
        `Queue done · ${runTotals.albumsOk} album(s) ok`
        + (runTotals.albumsFailed ? `, ${runTotals.albumsFailed} failed` : '')
        + ` · ${runTotals.ok} file(s)`
        + (runTotals.skipped ? ` (${runTotals.skipped} skipped)` : '')
        + (runTotals.failed ? ` · ${runTotals.failed} failed` : '');
      toast(
        `Queue finished. ${runTotals.albumsOk} album(s) ok, ${runTotals.albumsFailed} failed.`,
        runTotals.albumsFailed || runTotals.failed ? 'warn' : 'ok',
        7000
      );
    }
  }
}

function requestStopQueue() {
  if (!state.queueRunning) return;
  state.queueStopRequested = true;
  updateQueueRunStatus();
  toast('Will stop after the current album finishes', 'ok');
}

function hidingOnDisk() {
  return els.hideDownloaded.checked && els.skipExisting.checked;
}

/** "500k", "2M", "1.5 GB" → bytes; empty → 0; unparsable → NaN. */
function parseSizeInput(text) {
  const t = String(text || '').trim();
  if (!t) return 0;
  const m = /^([\d.]+)\s*([kmgt]?)i?b?$/i.exec(t);
  if (!m || !Number.isFinite(parseFloat(m[1]))) return NaN;
  const mult = { '': 1, k: 1024, m: 1024 ** 2, g: 1024 ** 3, t: 1024 ** 4 }[m[2].toLowerCase()];
  return Math.floor(parseFloat(m[1]) * mult);
}

function parseExtInput(text) {
  return new Set(
    String(text || '')
      .split(',')
      .map((e) => e.trim().toLowerCase().replace(/^\*?\./, ''))
      .filter(Boolean)
  );
}

function hasAdvancedFilters() {
  return view.exts.size > 0 || view.minSize > 0 || view.maxSize > 0;
}

/** Extension and size filters. Unknown extension or size never hides a file. */
function passesAdvancedFilters(f) {
  if (view.exts.size) {
    const name = String(f.fileName || '');
    const dot = name.lastIndexOf('.');
    const ext = String(f.ext || '').toLowerCase().replace(/^\./, '') || (dot > 0 ? name.slice(dot + 1).toLowerCase() : '');
    if (ext && !view.exts.has(ext)) return false;
  }
  const size = f.sizeBytes || 0;
  if (size > 0) {
    if (view.minSize && size < view.minSize) return false;
    if (view.maxSize && size > view.maxSize) return false;
  }
  return true;
}

/** Files shown in the grid: hide-on-disk, type, name, extension and size filters, then sort. */
function visibleFiles() {
  const hideDone = hidingOnDisk();
  const q = view.search.trim().toLowerCase();
  const filtering = hideDone || view.type !== 'all' || q || hasAdvancedFilters();
  let list = !filtering ? state.files : state.files.filter((f) => {
    if (hideDone && state.localStatus.get(f.pageUrl)?.status === 'complete') return false;
    if (view.type !== 'all' && fileKind(f) !== view.type) return false;
    if (q) {
      const raw = String(f.fileName || '').toLowerCase();
      if (!raw.includes(q)
        && !String(displayFileName(f.fileName)).toLowerCase().includes(q)
        && !(namesMasked() && String(shownFileName(f)).toLowerCase().includes(q))) return false;
    }
    if (!passesAdvancedFilters(f)) return false;
    return true;
  });
  if (view.sort !== 'album') {
    const byName = (a, b) => String(a.fileName || '').localeCompare(String(b.fileName || ''), undefined, { numeric: true, sensitivity: 'base' });
    const cmp = {
      name: byName,
      'size-desc': (a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0) || byName(a, b),
      'size-asc': (a, b) => (a.sizeBytes || 0) - (b.sizeBytes || 0) || byName(a, b),
      type: (a, b) => fileKind(a).localeCompare(fileKind(b)) || String(a.ext || '').localeCompare(String(b.ext || '')) || byName(a, b),
    }[view.sort];
    if (cmp) list = [...list].sort(cmp);
  }
  return list;
}

function selectedVisibleFiles() {
  return visibleFiles().filter((f) => state.selected.has(f.pageUrl));
}

function setSelectedCount() {
  updateResetButton();
  const visible = visibleFiles();
  const selectedFiles = visible.filter((f) => state.selected.has(f.pageUrl));
  const selected = selectedFiles.length;
  const selectedBytes = selectedFiles.reduce((n, f) => n + (f.sizeBytes || 0), 0);
  const unknownSize = selectedFiles.some((f) => !f.sizeBytes);

  els.selectedCount.textContent = `${selected} / ${visible.length} selected`;

  const onDisk = hidingOnDisk()
    ? state.files.filter((f) => state.localStatus.get(f.pageUrl)?.status === 'complete').length
    : 0;
  const selectedTotal = state.files.filter((f) => state.selected.has(f.pageUrl)).length;
  const selectedHidden = selectedTotal - selected;
  const notes = [];
  if (onDisk) notes.push(`${onDisk} on disk hidden`);
  if (selectedHidden > 0) notes.push(`${selectedHidden} selected file(s) hidden by filters won’t download`);
  els.filteredCount.textContent = notes.join(' · ');
  els.filteredCount.hidden = notes.length === 0;

  const filtered = hidingOnDisk() || view.type !== 'all' || view.search.trim() || hasAdvancedFilters();
  els.filteredEmpty.hidden = !(state.files.length && !visible.length && filtered);
  if (!els.filteredEmpty.hidden) {
    els.filteredEmptyText.textContent = hidingOnDisk() && view.type === 'all' && !view.search.trim() && !hasAdvancedFilters()
      ? 'All files are already on disk. Turn off Hide on disk to show the full album.'
      : 'No files match the current filters.';
  }

  els.downloadBtn.disabled = state.downloading || selected === 0 || !state.outputDir;
  updateRetryFailed();
  els.downloadBtn.classList.toggle('is-busy', state.downloading);
  els.downloadLabel.textContent = state.downloading
    ? 'Downloading…'
    : (!state.outputDir && selected ? 'Choose a folder' : 'Download');
  els.downloadMeta.textContent = selected
    ? `${selected}${selectedBytes ? ' · ' + fmtBytes(selectedBytes) + (unknownSize ? '+' : '') : ''}`
    : '';
  els.queueAddBtn.disabled = !state.album || selected === 0;
  els.selectAll.checked = visible.length > 0 && selected === visible.length;
  els.selectAll.indeterminate = selected > 0 && selected < visible.length;
  els.selectAll.disabled = visible.length === 0;
  els.grid.classList.toggle('partial', selected > 0 && selected < visible.length);
  els.concDown.disabled = clampConcurrency(els.concurrency.value) <= 1;
  els.concUp.disabled = clampConcurrency(els.concurrency.value) >= 16;
  updateActivity();
}

function localBadge(status) {
  if (!status || status === 'missing') return null;
  if (status === 'complete') return { cls: 'local-complete', text: 'On disk' };
  if (status === 'size_mismatch') return { cls: 'local-broken', text: 'Size mismatch' };
  if (status === 'corrupt') return { cls: 'local-broken', text: 'Corrupt' };
  if (status === 'incomplete') return { cls: 'local-broken', text: 'Incomplete' };
  return { cls: 'local-broken', text: status };
}

function shouldAutoSelect(status) {
  if (status === 'missing' || status === 'incomplete' || status === 'corrupt') return true;
  if (status === 'size_mismatch') return !!els.redownloadMismatch.checked;
  return false;
}

function cardFor(pageUrl) {
  return els.grid.querySelector(`.card[data-url="${cssEscape(pageUrl)}"]`);
}

function setFileSelected(pageUrl, on) {
  if (on) state.selected.add(pageUrl);
  else state.selected.delete(pageUrl);
  const card = cardFor(pageUrl);
  if (card) {
    card.classList.toggle('selected', on);
    card.setAttribute('aria-checked', String(on));
  }
}

/** Click toggles one file; Shift+click applies the new state to the range from the last clicked file. */
function toggleCard(pageUrl, { range = false } = {}) {
  const next = !state.selected.has(pageUrl);
  if (range && view.anchorUrl && view.anchorUrl !== pageUrl) {
    const urls = visibleFiles().map((f) => f.pageUrl);
    const a = urls.indexOf(view.anchorUrl);
    const b = urls.indexOf(pageUrl);
    if (a >= 0 && b >= 0) {
      const [from, to] = a < b ? [a, b] : [b, a];
      for (let i = from; i <= to; i++) setFileSelected(urls[i], next);
      view.anchorUrl = pageUrl;
      setSelectedCount();
      return;
    }
  }
  setFileSelected(pageUrl, next);
  view.anchorUrl = pageUrl;
  setSelectedCount();
}

function thumbPlaceholder(f) {
  const ph = el('div', 'placeholder');
  const kind = fileKind(f);
  ph.appendChild(icon(kind === 'image' ? 'image' : kind === 'video' ? 'film' : 'file'));
  ph.appendChild(el('span', '', (f.ext || 'file').toUpperCase()));
  return ph;
}

function renderGrid() {
  els.grid.innerHTML = '';
  const rules = getNameRules();
  const frag = document.createDocumentFragment();
  for (const f of visibleFiles()) {
    const local = state.localStatus.get(f.pageUrl);
    const badge = local ? localBadge(local.status) : null;
    const shown = displayFileName(f.fileName);
    const onScreen = shownFileName(f);
    const isSelected = state.selected.has(f.pageUrl);

    const card = document.createElement('div');
    card.className = 'card'
      + (isSelected ? ' selected' : '')
      + (badge ? ` local-${local.status === 'complete' ? 'complete' : 'broken'}` : '');
    card.dataset.url = f.pageUrl;
    card.tabIndex = 0;
    card.setAttribute('role', 'checkbox');
    card.setAttribute('aria-checked', String(isSelected));
    card.setAttribute('aria-label', onScreen || f.pageUrl);
    card.addEventListener('click', (e) => toggleCard(f.pageUrl, { range: e.shiftKey }));
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        toggleCard(f.pageUrl, { range: e.shiftKey });
      }
    });

    const thumb = el('div', 'thumb');
    fillThumb(card, thumb, { url: f.thumbnailUrl, seed: f.pageUrl, placeholder: () => thumbPlaceholder(f) });

    const pill = el('span', 'type-pill');
    if (fileKind(f) === 'video') pill.appendChild(icon('play'));
    pill.appendChild(document.createTextNode((f.ext || 'file').toUpperCase()));
    thumb.appendChild(pill);

    const cbox = el('span', 'cbox');
    cbox.setAttribute('aria-hidden', 'true');
    cbox.appendChild(icon('check'));
    thumb.appendChild(cbox);

    const status = el('div', 'status');
    status.dataset.url = f.pageUrl;
    if (badge) {
      status.className = 'status ' + badge.cls;
      status.textContent = badge.text;
      status.title = local.reason || '';
    }
    thumb.appendChild(status);

    const prog = el('div', 'card-progress');
    prog.appendChild(el('span', 'fill'));
    thumb.appendChild(prog);
    card.appendChild(thumb);

    const info = el('div', 'info');
    const name = el('div', 'name');
    name.title = namesMasked() ? onScreen : (f.fileName || f.pageUrl);
    if (namesMasked()) {
      fillName(name, onScreen, f.fileName || '');
    } else if (rules.length && f.fileName && shown !== f.fileName) {
      name.appendChild(el('span', 'ciphered', shown));
      name.appendChild(el('span', 'original', f.fileName));
    } else {
      name.textContent = shown || '(unknown)';
    }
    info.appendChild(name);
    info.appendChild(el('div', 'meta', fmtBytes(f.sizeBytes)));
    card.appendChild(info);

    frag.appendChild(card);
  }
  els.grid.appendChild(frag);
  if (run.active) restoreCardProgress();
  setSelectedCount();
}

/** Card badge for a per-file download state. */
function cardStatus(item) {
  if (item.stage === 'done') return { cls: 'done', text: 'Done' };
  if (item.stage === 'skipped') return { cls: 'skipped', text: 'Skipped' };
  if (item.stage === 'failed') return { cls: 'failed', text: 'Failed' };
  if (item.stage === 'resolving') return { cls: 'downloading', text: 'Resolving…' };
  if (item.total > 0) return { cls: 'downloading', text: Math.round((item.recv / item.total) * 100) + '%', active: true };
  return { cls: 'downloading', text: item.recv ? fmtBytes(item.recv) : 'Starting…', active: true };
}

/** A re-render mid-download (filters, Discreet view) would otherwise drop the live card badges. */
function restoreCardProgress() {
  for (const item of state.perFile.values()) {
    if (!item.stage) continue;
    const card = cardFor(item.pageUrl);
    if (!card) continue;
    const st = cardStatus(item);
    const statusEl = card.querySelector('.status');
    statusEl.className = 'status ' + st.cls;
    statusEl.textContent = st.text;
    card.classList.toggle('is-active', !!st.active);
    const fill = card.querySelector('.card-progress .fill');
    if (fill && item.total > 0) fill.style.width = Math.min(100, (item.recv / item.total) * 100) + '%';
  }
}

function invalidateLocalScan() {
  localScanVersion++;
  state.scanningLocal = false;
  state.localStatus.clear();
  els.localScanStatus.textContent = '';
  els.selectMissingBtn.hidden = true;
  updateMismatchUi();
}

/**
 * Privacy-first: asks main process to scan only the local album folder.
 * No data is sent to the network for this check.
 */
async function runLocalScan({ autoSelectMissing = false, outputDir = '' } = {}) {
  invalidateLocalScan();
  const scanVersion = localScanVersion;
  renderGrid();
  const dir = outputDir || state.outputDir;
  if (!state.album || !dir || !els.skipExisting.checked) {
    state.localStatus.clear();
    els.selectMissingBtn.hidden = true;
    els.selectMismatchBtn.hidden = true;
    els.localScanStatus.textContent = state.album && !dir && els.skipExisting.checked
      ? 'Choose a download folder to check what’s already on disk'
      : '';
    updateMismatchUi();
    if (state.files.length) renderGrid();
    return;
  }

  state.scanningLocal = true;
  updateResetButton();
  els.localScanStatus.replaceChildren(el('span', 'spinner'), document.createTextNode('Scanning local folder…'));
  els.selectMissingBtn.hidden = false;

  try {
    const r = await window.api.analyzeLocal({
      outputDir: dir,
      albumName: state.album.albumName,
      nameRules: getNameRules(),
      files: state.files.map((f) => ({
        pageUrl: f.pageUrl,
        fileName: f.fileName,
        sizeBytes: f.sizeBytes || 0,
      })),
    });
    if (scanVersion !== localScanVersion) return;
    if (!r.ok) {
      els.localScanStatus.textContent = r.error || 'Local scan failed';
      toast(r.error || 'Local scan failed', 'err');
      return;
    }

    state.localStatus.clear();
    for (const item of r.results || []) {
      state.localStatus.set(item.pageUrl, {
        status: item.status,
        reason: item.reason,
        localSize: item.localSize,
      });
    }

    const c = r.counts || {};
    const complete = c.complete || 0;
    const broken = (c.incomplete || 0) + (c.size_mismatch || 0) + (c.corrupt || 0);
    const missing = c.missing || 0;
    const chip = (cls, n, label) => {
      const c = el('span', 'scan-chip ' + cls);
      c.appendChild(el('b', '', String(n)));
      c.appendChild(document.createTextNode(' ' + label));
      return c;
    };
    els.localScanStatus.replaceChildren(
      chip('ok', complete, 'on disk'),
      chip('warn', broken, 'broken'),
      chip('missing', missing, 'missing'),
    );
    if (r.indexSize != null) {
      els.localScanStatus.appendChild(el('span', 'muted-note', `${r.indexSize} files in folder`));
    }

    if (autoSelectMissing) {
      state.selected = new Set(
        state.files
          .filter((f) => shouldAutoSelect(state.localStatus.get(f.pageUrl)?.status || 'missing'))
          .map((f) => f.pageUrl)
      );
    }

    updateMismatchUi();
    renderGrid();
    setSelectedCount();
  } catch (e) {
    if (scanVersion !== localScanVersion) return;
    els.localScanStatus.textContent = 'Local scan failed';
    toast(e.message || 'Local scan failed', 'err');
  } finally {
    if (scanVersion === localScanVersion) {
      state.scanningLocal = false;
      updateResetButton();
    }
  }
}

function scheduleLocalScan() {
  clearTimeout(scanTimer);
  invalidateLocalScan();
  renderGrid();
  scanTimer = setTimeout(() => {
    if (els.skipExisting.checked) runLocalScan({ autoSelectMissing: false });
  }, 280);
}

function currentUrl() {
  return els.urlInput.value.trim();
}

function albumIdFromUrl(url) {
  try {
    const u = new URL(url);
    const m = /\/a\/([^/?#]+)/i.exec(u.pathname);
    return m ? decodeURIComponent(m[1]) : '';
  } catch {
    return '';
  }
}

function sameAlbum(a, b) {
  const ida = albumIdFromUrl(a);
  return ida ? ida === albumIdFromUrl(b) : normalizeAlbumUrl(a) === normalizeAlbumUrl(b);
}

/** Title we already know for an album URL, without hitting the network. */
function knownAlbumTitle(url) {
  if (!url) return '';
  if (state.album?.albumUrl && sameAlbum(state.album.albumUrl, url)) return state.album.albumName || '';
  const saved = (state.bookmarks || []).find((b) => sameAlbum(b.url, url));
  return saved?.title || '';
}

// The Save form's title follows its URL until the user types a title of their own.
const bmForm = { titleAuto: true, lookupTimer: 0, lookupSeq: 0 };

function setBmTitle(title, { auto = true } = {}) {
  els.bmTitle.value = title;
  els.bmTitle.placeholder = 'Album title';
  bmForm.titleAuto = auto;
}

function cancelBmTitleLookup() {
  clearTimeout(bmForm.lookupTimer);
  return ++bmForm.lookupSeq;
}

/** Clear the Save form; with prefill, start it on the loaded album unless that one is already saved. */
function resetBookmarkForm({ prefill = false } = {}) {
  cancelBmTitleLookup();
  const url = prefill ? currentUrl() : '';
  const fresh = url && !isSavedAlbum(url);
  els.bmUrl.value = fresh ? url : '';
  setBmTitle(fresh ? (knownAlbumTitle(url) || albumIdFromUrl(url)) : '');
  els.bmNote.value = '';
}

/** An album saved elsewhere (star, search) should not linger in the Save form. */
function clearBookmarkFormFor(url) {
  const draft = els.bmUrl.value.trim();
  if (draft && sameAlbum(draft, url)) resetBookmarkForm();
}

function onBmUrlInput() {
  const seq = cancelBmTitleLookup();
  if (!bmForm.titleAuto) return;
  const url = els.bmUrl.value.trim();
  const known = knownAlbumTitle(url);
  setBmTitle(known);
  if (known || !albumIdFromUrl(url)) return;
  els.bmTitle.placeholder = 'Fetching title…';
  bmForm.lookupTimer = setTimeout(async () => {
    const r = await window.api.albumMeta(url).catch(() => null);
    if (seq !== bmForm.lookupSeq) return;
    setBmTitle(r?.ok ? (r.album?.albumName || '') : '');
  }, 500);
}

function onBmTitleInput() {
  cancelBmTitleLookup();
  els.bmTitle.placeholder = 'Album title';
  bmForm.titleAuto = !els.bmTitle.value.trim();
}

/** The add form is tucked away once there is a list to search; an empty list shows it outright. */
function updateBmFormUi() {
  const empty = !(state.bookmarks || []).length;
  const show = bmView.formOpen || empty;
  els.bmForm.hidden = !show;
  els.bmAddToggle.hidden = empty;
  els.bmCancel.hidden = empty;
  els.bmAddToggle.setAttribute('aria-expanded', String(show));
}

function setBmFormOpen(open, { clear = false } = {}) {
  if (clear) resetBookmarkForm();
  bmView.formOpen = open;
  updateBmFormUi();
  if (open) els.bmUrl.focus();
}

function setBookmarksOpen(open) {
  if (open) {
    resetBookmarkForm({ prefill: true });
    // Coming from an album that is not saved yet: the form is ready to save it.
    bmView.formOpen = Boolean(els.bmUrl.value);
    updateBmFormUi();
  }
  setView(open ? 'saved' : 'album');
}

function foldText(s) {
  return String(s || '').normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
}

/** Every query word must appear in the title, link or note — as stored or as shown in Discreet view. */
function bookmarkMatches(item, words) {
  if (!words.length) return true;
  const title = item.title || '';
  const hay = foldText([title, item.url, item.note, shownAlbumTitle(title, item.url), maskText(item.note || '')].join('\n'));
  return words.every((w) => hay.includes(w));
}

const bmCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

function sortedBookmarks(items) {
  const by = {
    'added-desc': (a, b) => String(b.addedAt || '').localeCompare(String(a.addedAt || '')),
    'added-asc': (a, b) => String(a.addedAt || '').localeCompare(String(b.addedAt || '')),
    title: (a, b) => bmCollator.compare(a.title || a.url, b.title || b.url),
  }[bmView.sort];
  // 'recent' is the store's own order.
  return by ? items.slice().sort(by) : items;
}

/** The album link a search query is, if it is one. */
function albumLinkFromQuery(query) {
  const q = String(query || '').trim();
  if (!q || /\s/.test(q) || !looksLikeLink(q)) return '';
  const url = /^https?:\/\//i.test(q) ? q : `https://${q}`;
  return albumIdFromUrl(url) ? url : '';
}

/** Open the add form on a link; the search stays, so the new card shows up right after saving. */
function startBookmarkFrom(url) {
  resetBookmarkForm();
  els.bmUrl.value = url;
  onBmUrlInput();
  setBmFormOpen(true);
}

function clearBmSearch() {
  clearTimeout(bmSearchTimer);
  els.bmSearch.value = '';
  els.bmSearchClear.hidden = true;
  bmView.query = '';
  renderBookmarks();
  els.bmSearch.focus();
}

function loadAlbumUrl(url) {
  els.urlInput.value = url;
  setView('album');
  els.loadBtn.click();
}

function renderRecent() {
  const items = (state.bookmarks || []).slice(0, 5);
  els.recentWrap.hidden = items.length === 0;
  els.recentList.replaceChildren();
  for (const item of items) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'recent-item';
    row.title = `Load ${item.url}`;
    const main = el('span', 'recent-main');
    main.appendChild(el('span', 'recent-title', shownAlbumTitle(item.title || albumIdFromUrl(item.url) || item.url, item.url)));
    main.appendChild(el('span', 'recent-url', item.url));
    row.appendChild(main);
    if (item.note) row.appendChild(el('span', 'recent-note', maskText(item.note)));
    row.appendChild(icon('arrow-right', 'i recent-go'));
    row.addEventListener('click', () => loadAlbumUrl(item.url));
    els.recentList.appendChild(row);
  }
}

function renderBookmarks() {
  const all = state.bookmarks || [];
  els.bmCount.textContent = String(all.length);
  els.bmCount.hidden = all.length === 0;
  els.bmList.innerHTML = '';
  renderRecent();
  els.bmToolbar.hidden = all.length === 0;
  updateBmFormUi();
  if (!all.length) {
    els.bmShown.textContent = '';
    els.bmList.appendChild(el('div', 'list-empty', 'Nothing saved yet. Use the form above, or Save on an open album.'));
    return;
  }

  const words = foldText(bmView.query).split(/\s+/).filter(Boolean);
  const link = albumLinkFromQuery(bmView.query);
  // A pasted link finds its album on any mirror domain; a word search would miss those.
  const items = sortedBookmarks(all.filter((it) => (link ? sameAlbum(it.url, link) : bookmarkMatches(it, words))));
  els.bmShown.textContent = words.length
    ? `${items.length} of ${all.length}`
    : `${all.length} ${all.length === 1 ? 'album' : 'albums'}`;
  if (!items.length) {
    const empty = el('div', 'list-empty', link ? 'This album is not saved yet.' : 'No saved albums match this search.');
    const actions = el('div', 'bm-empty-clear');
    if (link) {
      actions.appendChild(makeBtn({
        label: 'Save this link', iconName: 'star', cls: 'btn btn-sm btn-primary',
        onClick: () => startBookmarkFrom(link),
      }));
    }
    actions.appendChild(makeBtn({ label: 'Clear search', iconName: 'x', onClick: clearBmSearch }));
    empty.appendChild(actions);
    els.bmList.appendChild(empty);
    return;
  }

  const current = normalizeAlbumUrl(currentUrl());
  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'bm-card' + (current && normalizeAlbumUrl(item.url) === current ? ' active' : '');
    card.dataset.id = item.id;

    const main = el('div', 'bm-main');
    const title = document.createElement('input');
    title.className = 'bm-title';
    title.type = 'text';
    title.title = 'Album title — click to rename';
    title.addEventListener('keydown', (e) => { if (e.key === 'Enter') title.blur(); });
    bindMaskedField(title, () => item.title || item.url, (v) => shownAlbumTitle(v, item.url), async (value) => {
      const next = value.trim();
      if (!next || next === (item.title || '')) return null;
      const r = await window.api.updateBookmark({ id: item.id, title: next });
      if (!r.ok) { toast(r.error || 'Could not save title', 'err'); return null; }
      item.title = next;
      renderRecent();
      return next;
    });
    main.appendChild(title);
    main.appendChild(el('div', 'bm-url', item.url));
    card.appendChild(main);

    const side = el('div', 'bm-side');
    const actions = el('div', 'bm-actions');
    actions.appendChild(makeBtn({
      label: 'Load', iconName: 'download', cls: 'btn btn-sm',
      title: 'Load this album',
      onClick: () => loadAlbumUrl(item.url),
    }));
    actions.appendChild(makeBtn({
      label: 'Queue', iconName: 'queue', cls: 'btn btn-sm btn-ghost',
      title: 'Add this album to the download queue',
      onClick: () => {
        const r = addUrlsToQueue(item.url, { title: item.title || '' });
        announceQueueAdd(r);
        if (r.added) setQueueOpen(true);
      },
    }));
    actions.appendChild(makeBtn({
      iconName: 'link', cls: 'btn btn-sm btn-ghost btn-icon',
      title: 'Put the URL in the link field without loading',
      onClick: () => {
        els.urlInput.value = item.url;
        setView('album');
        els.urlInput.focus();
        toast('URL filled — press Enter to load', 'ok');
      },
    }));
    actions.appendChild(makeBtn({
      iconName: 'trash', cls: 'btn btn-sm btn-ghost btn-icon btn-danger',
      title: 'Remove from saved',
      onClick: async () => {
        const r = await window.api.removeBookmark(item.id);
        if (!r.ok) { toast(r.error || 'Could not remove', 'err'); return; }
        await refreshBookmarks();
      },
    }));
    side.appendChild(actions);
    const when = item.updatedAt || item.addedAt;
    side.appendChild(el('div', 'bm-meta', when ? `Saved ${when.slice(0, 10)}` : ''));
    card.appendChild(side);

    const note = document.createElement('textarea');
    note.className = 'bm-note';
    note.rows = 1;
    note.placeholder = 'Add a note…';
    bindMaskedField(note, () => item.note || '', maskText, async (next) => {
      const r = await window.api.updateBookmark({ id: item.id, note: next });
      if (!r.ok) { toast(r.error || 'Could not save note', 'err'); return null; }
      item.note = next;
      renderRecent();
      toast('Note saved', 'ok', 1600);
      return next;
    });
    card.appendChild(note);

    els.bmList.appendChild(card);
  }
}

async function refreshBookmarks() {
  const r = await window.api.listBookmarks();
  state.bookmarks = r.ok ? (r.items || []) : [];
  renderBookmarks();
  updateSearchMarks();
}

async function saveCurrentAlbum({ openPanel = true } = {}) {
  const url = currentUrl() || state.album?.albumUrl || '';
  if (!url) { toast('Enter an album URL to save', 'warn'); return; }
  const r = await window.api.saveBookmark({
    url,
    title: state.album?.albumName || albumIdFromUrl(url),
    note: '',
  });
  if (!r.ok) { toast(r.error || 'Could not save album', 'err'); return; }
  await refreshBookmarks();
  clearBookmarkFormFor(url);
  toast(r.updated ? 'Album already saved — updated' : 'Album saved for later', 'ok');
  if (openPanel) {
    setBookmarksOpen(true);
    const card = els.bmList.querySelector(`.bm-card[data-id="${r.item?.id}"]`);
    const note = card?.querySelector('.bm-note');
    if (note) {
      note.focus();
      note.placeholder = 'Add a note for later…';
    }
  }
}

// ---------- album search ----------

const DEFAULT_SEARCH_HOST = 'balbums.st';

function searchHostLabel() {
  const raw = els.searchHost.value.trim();
  if (!raw) return DEFAULT_SEARCH_HOST;
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).host;
  } catch {
    return raw;
  }
}

/** Link-field text that is not a link is treated as a search query. */
function looksLikeLink(text) {
  return /^https?:\/\//i.test(text) || /^[\w-]+(?:\.[\w-]+)+\/\S*$/.test(text);
}

function isSavedAlbum(url) {
  const n = normalizeAlbumUrl(url);
  return (state.bookmarks || []).some((b) => normalizeAlbumUrl(b.url) === n);
}

function setSearchMode(mode) {
  search.mode = mode;
  for (const b of els.srMode.querySelectorAll('.seg-btn')) {
    const on = b.dataset.mode === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  }
}

function updateSearchClear() {
  els.srClear.hidden = !els.srQuery.value;
}

function openSearch({ query = null, focus = true } = {}) {
  if (query != null) els.srQuery.value = query;
  updateSearchClear();
  setView('search');
  if (focus) {
    els.srQuery.focus();
    els.srQuery.select();
  }
}

async function runSearch({ page = 1, query = els.srQuery.value } = {}) {
  const seq = ++search.seq;
  search.query = String(query || '').trim();
  els.srQuery.value = search.query;
  updateSearchClear();
  search.page = page;
  search.searched = true;
  search.loading = true;
  search.error = '';
  renderSearch();
  els.srScroller.scrollTop = 0;

  const r = await window.api.searchAlbums({
    query: search.query,
    mode: search.mode,
    sort: search.sort,
    per: search.per,
    page,
    host: els.searchHost.value.trim(),
  });
  if (seq !== search.seq) return; // superseded by a newer search
  search.loading = false;
  if (r.ok) {
    search.results = r.result.results || [];
    search.totalPages = r.result.totalPages || 0;
    search.page = r.result.page || page;
  } else {
    search.results = [];
    search.totalPages = 0;
    search.error = r.error || 'Search failed';
  }
  renderSearch();
}

function openSearchResult(item) {
  loadAlbumUrl(item.url);
}

function queueSearchResult(item) {
  const r = addUrlsToQueue(item.url, { title: item.title || item.albumId, fileCount: item.fileCount });
  if (r.added) {
    toast(
      state.queueRunning
        ? 'Queued — starts after the current album'
        : 'Queued. Open Queue and click Start queue when ready.',
      'ok'
    );
  } else {
    announceQueueAdd(r);
  }
  updateSearchMarks();
}

async function saveSearchResult(item) {
  // Re-saving would overwrite an existing note, so leave saved albums alone.
  if (isSavedAlbum(item.url)) { toast('Already in Saved', 'ok'); return; }
  const r = await window.api.saveBookmark({ url: item.url, title: item.title || item.albumId, note: '' });
  if (!r.ok) { toast(r.error || 'Could not save album', 'err'); return; }
  await refreshBookmarks();
  clearBookmarkFormFor(item.url);
  toast('Album saved for later', 'ok');
}

function searchPlaceholder() {
  const ph = el('div', 'placeholder');
  ph.appendChild(icon('grid'));
  ph.appendChild(el('span', '', 'ALBUM'));
  return ph;
}

function searchCard(item) {
  const card = el('article', 'card sr-card');
  card.dataset.url = item.url;
  card.tabIndex = 0;
  card.title = `Open ${item.url}`;
  card.addEventListener('click', () => openSearchResult(item));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target === card) {
      e.preventDefault();
      openSearchResult(item);
    }
  });

  const thumb = el('div', 'thumb');
  fillThumb(card, thumb, { url: item.thumbnailUrl, seed: item.url, placeholder: searchPlaceholder });
  if (item.fileCount) {
    thumb.appendChild(el('span', 'type-pill', `${item.fileCount.toLocaleString()} ${item.fileCount === 1 ? 'file' : 'files'}`));
  }
  thumb.appendChild(el('div', 'status sr-mark'));
  card.appendChild(thumb);

  const info = el('div', 'info');
  const realTitle = item.title || item.albumId;
  const shownTitle = shownAlbumTitle(realTitle, item.url);
  const name = el('div', 'name sr-title');
  fillName(name, shownTitle, realTitle);
  name.title = shownTitle;
  info.appendChild(name);
  info.appendChild(el('div', 'meta', item.albumId));

  const actions = el('div', 'sr-actions');
  actions.appendChild(makeBtn({
    label: 'Open', iconName: 'arrow-right', cls: 'btn btn-sm',
    title: 'Load this album with previews',
    onClick: (e) => { e.stopPropagation(); openSearchResult(item); },
  }));
  actions.appendChild(makeBtn({
    iconName: 'queue', cls: 'btn btn-sm btn-ghost btn-icon sr-queue',
    title: 'Add the whole album to the download queue',
    onClick: (e) => { e.stopPropagation(); queueSearchResult(item); },
  }));
  actions.appendChild(makeBtn({
    iconName: 'star', cls: 'btn btn-sm btn-ghost btn-icon sr-save',
    title: 'Save for later',
    onClick: (e) => { e.stopPropagation(); saveSearchResult(item); },
  }));
  info.appendChild(actions);
  card.appendChild(info);
  return card;
}

/** Refresh "Saved" / "Queued" marks on result cards without re-rendering them. */
function updateSearchMarks() {
  for (const card of els.srGrid.querySelectorAll('.sr-card')) {
    const url = card.dataset.url;
    const saved = isSavedAlbum(url);
    const queued = queueHasActiveUrl(url);
    const mark = card.querySelector('.sr-mark');
    mark.textContent = [saved && 'Saved', queued && 'Queued'].filter(Boolean).join(' · ');
    mark.className = 'status sr-mark' + (mark.textContent ? ' done' : '');
    const save = card.querySelector('.sr-save');
    save.classList.toggle('is-on', saved);
    save.title = saved ? 'Already in Saved' : 'Save for later';
  }
}

function renderSearchSkeleton(n) {
  els.srGrid.replaceChildren();
  for (let i = 0; i < n; i++) {
    const card = el('div', 'card skeleton sr-card');
    card.appendChild(el('div', 'thumb'));
    const info = el('div', 'info');
    info.appendChild(el('div', 'sk-line'));
    info.appendChild(el('div', 'sk-line short'));
    card.appendChild(info);
    els.srGrid.appendChild(card);
  }
}

function renderSearch() {
  els.srHostLabel.textContent = searchHostLabel();
  els.srSubmit.disabled = search.loading;
  els.srSubmit.classList.toggle('is-busy', search.loading);
  els.srRetryBtn.hidden = true;
  els.srPager.hidden = true;

  if (search.loading) {
    els.srStatus.replaceChildren(el('span', 'spinner'), document.createTextNode(`Searching ${searchHostLabel()}…`));
    els.srEmpty.hidden = true;
    renderSearchSkeleton(Math.min(search.per, 12));
    return;
  }

  const { results, page, totalPages } = search;
  els.srGrid.replaceChildren(...results.map(searchCard));
  updateSearchMarks();

  let emptyText = '';
  if (search.error) {
    emptyText = search.error;
    els.srRetryBtn.hidden = false;
  } else if (!search.searched) {
    emptyText = 'Type an album title and press Enter. Leave it empty to browse the newest albums.';
  } else if (!results.length) {
    emptyText = page > 1 && totalPages
      ? 'No albums on this page.'
      : `No albums match “${maskText(search.query)}”.`
        + (search.mode !== 'fuzzy' ? ' Try Fuzzy (tolerates typos) or Substring.' : '');
  }
  els.srEmpty.hidden = !emptyText;
  els.srEmptyText.textContent = emptyText;

  els.srStatus.textContent = results.length
    ? `${results.length} album${results.length === 1 ? '' : 's'} · page ${page.toLocaleString()} of ${totalPages.toLocaleString()}`
    : '';

  if (totalPages > 1 || page > 1) {
    els.srPager.hidden = false;
    els.srPrev.disabled = page <= 1;
    els.srNext.disabled = page >= totalPages;
    els.srPageLabel.textContent = `Page ${page.toLocaleString()} of ${totalPages.toLocaleString()}`;
  }
}

els.srForm.addEventListener('submit', (e) => {
  e.preventDefault();
  runSearch();
});
els.srQuery.addEventListener('input', updateSearchClear);
els.srClear.addEventListener('click', () => {
  els.srQuery.value = '';
  updateSearchClear();
  els.srQuery.focus();
});
els.srMode.addEventListener('click', (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b || b.dataset.mode === search.mode) return;
  setSearchMode(b.dataset.mode);
  persistSettingsSoon();
  if (search.searched) runSearch();
});
els.srSort.addEventListener('change', () => {
  search.sort = els.srSort.value;
  persistSettingsSoon();
  if (search.searched) runSearch();
});
els.srPer.addEventListener('change', () => {
  search.per = parseInt(els.srPer.value, 10) || 20;
  persistSettingsSoon();
  if (search.searched) runSearch();
});
els.srPrev.addEventListener('click', () => runSearch({ page: search.page - 1, query: search.query }));
els.srNext.addEventListener('click', () => runSearch({ page: search.page + 1, query: search.query }));
els.srRetryBtn.addEventListener('click', () => runSearch({ page: search.page, query: search.query }));
els.searchHost.addEventListener('input', () => {
  els.srHostLabel.textContent = searchHostLabel();
  persistSettingsSoon();
});
els.heroSearchBtn.addEventListener('click', () => openSearch());
els.navSearch.addEventListener('click', () => openSearch({ focus: !search.searched }));

els.resetBtn.addEventListener('click', resetScreen);

els.loadBtn.addEventListener('click', async () => {
  const url = currentUrl();
  if (!url) { toast('Paste an album URL first', 'warn'); els.urlInput.focus(); return; }
  if (!looksLikeLink(url)) {
    // Plain words: search album titles instead of loading.
    els.urlInput.value = state.album?.albumUrl || '';
    openSearch({ focus: false });
    runSearch({ query: url });
    return;
  }
  if (state.queueRunning) { toast('Queue is running — wait or stop after the current album', 'warn'); return; }
  setView('album');
  invalidateLocalScan();
  els.filteredEmpty.hidden = true;
  els.filteredCount.hidden = true;
  state.loadingAlbum = true;
  updateResetButton();
  els.loadBtn.disabled = true;
  els.loadBtn.innerHTML = '<span class="spinner"></span> Loading…';
  els.albumTitle.textContent = albumIdFromUrl(url) || 'Loading album…';
  els.albumStats.replaceChildren();
  els.previewProgress.replaceChildren(el('span', 'spinner'), document.createTextNode('Fetching album…'));
  els.localScanStatus.textContent = '';
  els.empty.hidden = true;
  els.previewSection.hidden = false;
  els.albumScroller.scrollTop = 0;
  setLoadProgress(-1);
  renderSkeleton();
  els.albumMeta.textContent = '';
  els.saveAlbumBtn.hidden = true;
  state.selected.clear();
  state.localStatus.clear();

  const unsub = window.api.onPreviewProgress(({ done, total }) => {
    els.previewProgress.replaceChildren(el('span', 'spinner'), document.createTextNode(`Resolving previews ${done}/${total}…`));
    if (total) setLoadProgress(done / total);
  });

  try {
    const result = await window.api.previewAlbum(url);
    if (!result.ok) {
      toast(result.error || 'Failed to load album', 'err', 5000);
      els.grid.replaceChildren();
      setLoadProgress(null);
      els.empty.hidden = false;
      els.previewSection.hidden = true;
      return;
    }
    showAlbum(result.preview);
    await runLocalScan({ autoSelectMissing: els.skipExisting.checked });
  } finally {
    unsub && unsub();
    state.loadingAlbum = false;
    setLoadProgress(null);
    updateResetButton();
    els.loadBtn.disabled = state.queueRunning;
    els.loadBtn.innerHTML = 'Load album';
  }
});

els.urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') els.loadBtn.click();
});

els.heroPasteBtn.addEventListener('click', async () => {
  let text = '';
  try {
    text = window.api.readClipboard ? await window.api.readClipboard() : await navigator.clipboard.readText();
  } catch {}
  const url = String(text || '').trim().split(/\s+/)[0] || '';
  if (!/^https?:\/\//i.test(url)) {
    els.urlInput.focus();
    toast('Clipboard has no link — paste one into the field above', 'warn');
    return;
  }
  els.urlInput.value = url;
  els.loadBtn.click();
});

els.selectAll.addEventListener('change', () => {
  for (const f of visibleFiles()) {
    if (els.selectAll.checked) state.selected.add(f.pageUrl);
    else state.selected.delete(f.pageUrl);
  }
  renderGrid();
  setSelectedCount();
});

els.hideDownloaded.addEventListener('change', renderGrid);

// ---------- grid filters ----------

els.typeFilter.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  view.type = btn.dataset.type;
  for (const b of els.typeFilter.querySelectorAll('.seg-btn')) {
    const on = b === btn;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  }
  renderGrid();
});

let searchTimer = 0;
els.searchInput.addEventListener('input', () => {
  els.searchClear.hidden = !els.searchInput.value;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    view.search = els.searchInput.value;
    renderGrid();
  }, 120);
});
els.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.searchInput.value) {
    e.stopPropagation();
    els.searchClear.click();
  }
});
els.searchClear.addEventListener('click', () => {
  els.searchInput.value = '';
  els.searchClear.hidden = true;
  view.search = '';
  renderGrid();
  els.searchInput.focus();
});

let advTimer = 0;
function onAdvancedFilterInput() {
  clearTimeout(advTimer);
  advTimer = setTimeout(() => {
    view.exts = parseExtInput(els.extFilter.value);
    const min = parseSizeInput(els.minSizeFilter.value);
    const max = parseSizeInput(els.maxSizeFilter.value);
    els.minSizeFilter.classList.toggle('invalid', Number.isNaN(min));
    els.maxSizeFilter.classList.toggle('invalid', Number.isNaN(max));
    view.minSize = Number.isNaN(min) ? 0 : min;
    view.maxSize = Number.isNaN(max) ? 0 : max;
    renderGrid();
  }, 150);
}
for (const el of [els.extFilter, els.minSizeFilter, els.maxSizeFilter]) {
  el.addEventListener('input', onAdvancedFilterInput);
}

els.sortSelect.addEventListener('change', () => {
  view.sort = els.sortSelect.value;
  renderGrid();
});

function setDensity(d) {
  const density = d === 'compact' ? 'compact' : 'comfortable';
  els.grid.dataset.density = density;
  for (const b of els.densitySeg.querySelectorAll('.seg-btn')) {
    const on = b.dataset.density === density;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  }
  try { localStorage.setItem('density', density); } catch {}
}
els.densitySeg.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (btn) setDensity(btn.dataset.density);
});

els.resetFiltersBtn.addEventListener('click', () => {
  resetViewFilters();
  els.hideDownloaded.checked = false;
  renderGrid();
});

els.selectMissingBtn.addEventListener('click', async () => {
  if (!els.skipExisting.checked) {
    els.skipExisting.checked = true;
    persistSettingsSoon();
  }
  await runLocalScan({ autoSelectMissing: true });
  const n = state.selected.size;
  toast(
    n ? `Selected ${n} missing/broken file(s)` : 'Nothing to download — all complete locally',
    n ? 'ok' : 'warn'
  );
});

els.selectMismatchBtn.addEventListener('click', () => {
  const urls = state.files
    .filter((f) => state.localStatus.get(f.pageUrl)?.status === 'size_mismatch')
    .map((f) => f.pageUrl);
  state.selected = new Set(urls);
  if (!els.redownloadMismatch.checked) {
    els.redownloadMismatch.checked = true;
    persistSettingsSoon();
  }
  renderGrid();
  setSelectedCount();
  toast(
    urls.length ? `Selected ${urls.length} size-mismatch file(s)` : 'No size mismatches',
    urls.length ? 'ok' : 'warn'
  );
});

els.browseBtn.addEventListener('click', async () => {
  const r = await window.api.pickFolder();
  if (!r.ok) return;
  state.outputDir = r.path;
  setOutputDirLabel(r.path);
  persistSettingsSoon();
  syncQueueFolderInput();
  renderQueue();
  setSelectedCount();
  await runLocalScan({ autoSelectMissing: els.skipExisting.checked });
});

els.openFolderBtn.addEventListener('click', () => openAlbumFolder(shownAlbumFolder()));

function setConcurrency(v) {
  els.concurrency.value = String(clampConcurrency(v));
  persistSettingsSoon();
  setSelectedCount();
}
els.concurrency.addEventListener('change', () => setConcurrency(els.concurrency.value));
els.concDown.addEventListener('click', () => setConcurrency(clampConcurrency(els.concurrency.value) - 1));
els.concUp.addEventListener('click', () => setConcurrency(clampConcurrency(els.concurrency.value) + 1));

els.skipExisting.addEventListener('change', async () => {
  persistSettingsSoon();
  updateMismatchUi();
  if (els.skipExisting.checked) {
    await runLocalScan({ autoSelectMissing: true });
    if (state.localStatus.size) {
      toast('Disk checked — selected missing and broken files only', 'ok');
    }
  } else {
    invalidateLocalScan();
    els.selectMissingBtn.hidden = true;
    els.selectMismatchBtn.hidden = true;
    els.localScanStatus.textContent = '';
    updateMismatchUi();
    if (state.files.length) {
      state.selected = new Set(state.files.map((f) => f.pageUrl));
      renderGrid();
      setSelectedCount();
    }
  }
});

els.redownloadMismatch.addEventListener('change', () => {
  persistSettingsSoon();
  if (!state.files.length) return;
  for (const f of state.files) {
    if (state.localStatus.get(f.pageUrl)?.status !== 'size_mismatch') continue;
    if (els.redownloadMismatch.checked) state.selected.add(f.pageUrl);
    else state.selected.delete(f.pageUrl);
  }
  renderGrid();
  setSelectedCount();
});

function onCipherChange() {
  persistSettingsSoon();
  updateCipherUi();
  if (state.files.length) renderGrid();
  scheduleLocalScan();
}

els.cipherEnabled.addEventListener('change', onCipherChange);
els.cipherFind.addEventListener('input', onCipherChange);
els.cipherReplace.addEventListener('input', onCipherChange);

els.cipherRandom.addEventListener('click', async () => {
  const source = els.cipherFind.value.trim() || 'token';
  const r = await window.api.randomCipherToken(source);
  if (!r.ok) return;
  els.cipherReplace.value = r.token;
  if (!els.cipherEnabled.checked) {
    els.cipherEnabled.checked = true;
  }
  onCipherChange();
});

els.cipherSensitive.addEventListener('change', onCipherChange);

// ---------- discreet view settings ----------

els.discreetBtn.addEventListener('click', () => setDiscreet(!discreet.on));
els.discreetOn.addEventListener('change', () => setDiscreet(els.discreetOn.checked));

els.dvThumbs.addEventListener('click', (e) => {
  const b = e.target.closest('.dv-card');
  if (!b || b.dataset.thumbs === discreet.thumbs) return;
  discreet.thumbs = b.dataset.thumbs;
  persistSettingsSoon();
  refreshDiscreetViews();
});

els.dvNames.addEventListener('click', (e) => {
  const b = e.target.closest('.seg-btn');
  if (!b || b.dataset.names === discreet.names) return;
  discreet.names = b.dataset.names;
  persistSettingsSoon();
  refreshDiscreetViews();
});

els.dvCats.addEventListener('change', () => {
  discreet.categories = [...els.dvCats.querySelectorAll('input:checked')].map((i) => i.value);
  onWordListChange();
});

let wordsTimer = 0;
els.discreetWords.addEventListener('input', () => {
  clearTimeout(wordsTimer);
  wordsTimer = setTimeout(() => {
    discreet.words = els.discreetWords.value;
    onWordListChange();
  }, 300);
});

els.discreetStrict.addEventListener('change', () => {
  discreet.strict = els.discreetStrict.checked;
  onWordListChange();
});

els.discreetPeek.addEventListener('change', () => {
  discreet.peek = els.discreetPeek.checked;
  if (!discreet.peek) endPeek();
  persistSettingsSoon();
});
els.discreetVeil.addEventListener('change', () => {
  discreet.veil = els.discreetVeil.checked;
  updateWindowVeil();
  persistSettingsSoon();
});
els.discreetStartOn.addEventListener('change', () => {
  discreet.startOn = els.discreetStartOn.checked;
  persistSettingsSoon();
});
els.discreetButton.addEventListener('change', () => {
  discreet.button = els.discreetButton.checked;
  updateDiscreetSettingsUi();
  persistSettingsSoon();
});

async function runSelectedDownload(selectedUrls) {
  state.downloading = true;
  updateResetButton();
  setSelectedCount();

  try {
    const r = await downloadFiles({
      albumUrl: state.album.albumUrl,
      albumName: state.album.albumName,
      files: state.files,
      selectedUrls,
    });
    state.lastFailed = r.ok ? (r.failedUrls || []) : [];
    if (!r.ok) {
      els.summary.className = 'dock-summary warn';
      els.summary.textContent = r.error || 'Download failed';
      toast(r.error || 'Download failed', 'err', 6000);
    } else {
      const skipped = r.skipped || 0;
      const got = r.count - skipped;
      els.summary.className = 'dock-summary ' + (r.failed || r.stopped ? 'warn' : 'ok');
      els.summary.textContent =
        (r.stopped ? 'Stopped' : 'Done') + ` · ${got} downloaded`
        + (skipped ? ` · ${skipped} skipped` : '')
        + (r.failed ? ` · ${r.failed} failed` + (r.failedLog ? ' (see errors.log)' : '') : '')
        + (r.stopped ? ' · partial files resume next time' : '');
      toast(
        r.stopped
          ? `Stopped. ${got} downloaded; partial files resume next time.`
          : `Downloaded ${got}, skipped ${skipped}, failed ${r.failed}`,
        r.failed || r.stopped ? 'warn' : 'ok',
        6000
      );
    }
    if (els.skipExisting.checked) await runLocalScan({ autoSelectMissing: false });
  } finally {
    state.downloading = false;
    setSelectedCount();
  }
}

function updateRetryFailed() {
  const present = new Set(state.files.map((f) => f.pageUrl));
  const n = state.lastFailed.filter((u) => present.has(u)).length;
  els.retryFailedBtn.hidden = !(n && state.album && !state.downloading && !state.queueRunning);
  els.retryFailedCount.textContent = n ? String(n) : '';
}

els.downloadBtn.addEventListener('click', async () => {
  if (!state.album) return;
  if (state.queueRunning) return;
  if (!state.outputDir) { toast('Pick an output folder first', 'warn'); return; }
  const selectedUrls = selectedVisibleFiles().map((f) => f.pageUrl);
  if (selectedUrls.length === 0) { toast('Select at least one file', 'warn'); return; }
  await runSelectedDownload(selectedUrls);
});

els.retryFailedBtn.addEventListener('click', async () => {
  if (!state.album || state.downloading || state.queueRunning) return;
  if (!state.outputDir) { toast('Pick an output folder first', 'warn'); return; }
  const present = new Set(state.files.map((f) => f.pageUrl));
  const urls = state.lastFailed.filter((u) => present.has(u));
  if (urls.length === 0) return;
  await runSelectedDownload(urls);
});

els.stopBtn.addEventListener('click', async () => {
  if (state.queueRunning) state.queueStopRequested = true;
  els.stopBtn.disabled = true;
  await window.api.stopDownload(state.jobId);
});

function updateFileProgress(data) {
  const { index, pageUrl, stage } = data;
  let item = state.perFile.get(index);
  if (!item) {
    item = { pageUrl, stage: '', fileName: '', recv: 0, total: 0, sizeFixed: false };
    state.perFile.set(index, item);
    const row = document.createElement('div');
    row.className = 'fp-item';
    row.dataset.index = index;
    row.innerHTML = '<div class="fp-name"></div><div class="fp-meta"></div><div class="fp-bar"><div class="fp-fill"></div></div>';
    els.fileProgress.appendChild(row);
  }

  const card = cardFor(pageUrl);
  const statusEl = card?.querySelector('.status');
  const cardFill = card?.querySelector('.card-progress .fill');
  const expected = run.sizes.get(pageUrl) || 0;

  if (stage === 'resolving') {
    item.stage = 'resolving';
    if (statusEl) { statusEl.className = 'status downloading'; statusEl.textContent = 'Resolving…'; }
  } else if (stage === 'downloading') {
    item.stage = 'downloading';
    item.fileName = data.fileName || item.fileName;
    card?.classList.add('is-active');
    if (statusEl) { statusEl.className = 'status downloading'; statusEl.textContent = 'Starting…'; }
  } else if (stage === 'chunk') {
    const recv = data.recv || item.recv;
    item.note = '';
    if (recv > item.recv) run.bytesDone += recv - item.recv;
    item.recv = recv;
    item.total = data.total || item.total;
    // Content-Length is authoritative — correct the plan when the preview size was missing or off.
    if (!item.sizeFixed && item.total > 0) {
      item.sizeFixed = true;
      run.bytesPlanned += item.total - expected;
      if (!expected) run.unknownSizes--;
    }
    card?.classList.add('is-active');
    if (cardFill && item.total > 0) cardFill.style.width = Math.min(100, (item.recv / item.total) * 100) + '%';
    if (statusEl) {
      statusEl.className = 'status downloading';
      statusEl.textContent = item.total > 0
        ? Math.round((item.recv / item.total) * 100) + '%'
        : fmtBytes(item.recv);
    }
  } else if (stage === 'retry' || stage === 'waiting') {
    item.fileName = data.fileName || item.fileName;
    item.note = stage === 'waiting'
      ? `Bunkr maintenance, waiting ${Math.round((data.delayMs || 0) / 1000)}s`
      : (data.attempt ? `Retry ${data.attempt}: ${data.reason || ''}` : (data.reason || ''));
    if (statusEl) { statusEl.className = 'status downloading'; statusEl.textContent = stage === 'waiting' ? 'Waiting…' : 'Retrying…'; }
  } else if (stage === 'skipped') {
    item.stage = 'skipped';
    item.fileName = data.fileName || item.fileName;
    run.bytesPlanned -= expected;
    if (!expected) run.unknownSizes--;
    if (statusEl) { statusEl.className = 'status skipped'; statusEl.textContent = 'Skipped'; }
  } else if (stage === 'done') {
    item.stage = 'done';
    card?.classList.remove('is-active');
    if (statusEl) { statusEl.className = 'status done'; statusEl.textContent = 'Done'; }
  } else if (stage === 'failed') {
    item.stage = 'failed';
    run.bytesPlanned -= Math.max(0, (item.sizeFixed ? item.total : expected) - item.recv);
    if (!expected && !item.sizeFixed) run.unknownSizes--;
    card?.classList.remove('is-active');
    if (statusEl) { statusEl.className = 'status failed'; statusEl.textContent = 'Failed'; statusEl.title = data.error || ''; }
  }

  if (stage === 'done' || stage === 'failed' || stage === 'skipped') item.note = '';
  const row = els.fileProgress.querySelector(`.fp-item[data-index="${index}"]`);
  if (row) {
    row.className = 'fp-item ' + (item.stage || '');
    row.querySelector('.fp-name').textContent = fpName(item);
    row.querySelector('.fp-name').title = fpName(item);
    const fill = row.querySelector('.fp-fill');
    if (item.stage === 'skipped' || item.stage === 'done') {
      fill.style.width = '100%';
    } else if (item.total > 0) {
      fill.style.width = Math.min(100, (item.recv / item.total) * 100) + '%';
    }
    row.querySelector('.fp-meta').textContent = item.note ? item.note : item.stage === 'done'
      ? 'Done'
      : item.stage === 'skipped'
        ? 'Already complete'
        : item.stage === 'failed'
          ? 'Failed'
          : item.total > 0
            ? `${fmtBytes(item.recv)} / ${fmtBytes(item.total)}`
            : (item.stage === 'resolving' ? 'Resolving…' : item.stage || '');
  }

  if (data.completed !== undefined && data.total !== undefined) {
    const done = data.completed;
    run.completed = done;
    run.total = data.total;
    const extra = [];
    if (data.skipped) extra.push(`${data.skipped} skipped`);
    if (data.failed) extra.push(`${data.failed} failed`);
    const prefix = queueAlbumPrefix();
    els.totalLabel.textContent = `${prefix}${done} / ${data.total} files` + (extra.length ? ` · ${extra.join(' · ')}` : '');
    els.totalFill.style.width = (done / data.total) * 100 + '%';
    renderRunStats();
  }
}

/** Per-file row label: the name on disk, masked in Discreet view. */
function fpName(item) {
  const raw = item.fileName || item.pageUrl;
  if (!namesMasked()) return raw;
  const i = state.fileIndex.get(item.pageUrl);
  const f = i == null ? null : state.files[i];
  if (f && discreet.names === 'generic') return genericFileName(f);
  return maskText(raw);
}

function refreshFileProgressNames() {
  for (const [index, item] of state.perFile) {
    const nameEl = els.fileProgress.querySelector(`.fp-item[data-index="${index}"] .fp-name`);
    if (!nameEl) continue;
    nameEl.textContent = fpName(item);
    nameEl.title = fpName(item);
  }
}

function cssEscape(s) {
  return String(s).replace(/[^a-zA-Z0-9_-]/g, (m) => '\\' + m);
}

els.toggleDetailsBtn.addEventListener('click', () => {
  const open = els.fileProgress.hidden;
  els.fileProgress.hidden = !open;
  els.toggleDetailsBtn.setAttribute('aria-expanded', String(open));
  els.toggleDetailsBtn.textContent = open ? 'Hide per-file' : 'Per-file';
  try { localStorage.setItem('fileDetails', open ? '1' : '0'); } catch {}
});

els.saveAlbumBtn.addEventListener('click', () => saveCurrentAlbum({ openPanel: false }));

// ---------- navigation ----------

els.navAlbum.addEventListener('click', () => setView('album'));
els.navSettings.addEventListener('click', () => setView('settings'));
els.bookmarksBtn.addEventListener('click', () => setBookmarksOpen(true));
els.queueBtn.addEventListener('click', () => setQueueOpen(true));
els.activity.addEventListener('click', () => setView(state.queueRunning && view.current === 'album' ? 'queue' : 'album'));
els.recentAllBtn.addEventListener('click', () => setBookmarksOpen(true));

for (const b of document.querySelectorAll('[data-theme-set]')) {
  b.addEventListener('click', () => applyTheme(b.dataset.themeSet));
}

function isTyping(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
}

document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  // e.code, not e.key: works the same on any keyboard layout.
  if (mod && e.shiftKey && e.code === 'KeyH') {
    e.preventDefault();
    setDiscreet(!discreet.on);
    return;
  }
  if (e.key === 'Alt' && discreet.on && discreet.peek && !isTyping(e.target)) {
    e.preventDefault();
    if (!discreet.peeking) {
      discreet.peeking = true;
      applyPeek();
    }
    return;
  }
  if (mod && (e.key === 'l' || e.key === 'L')) {
    e.preventDefault();
    els.urlInput.focus();
    els.urlInput.select();
    return;
  }
  if (mod && (e.key === 'k' || e.key === 'K' || ((e.key === 'f' || e.key === 'F') && view.current === 'search'))) {
    e.preventDefault();
    openSearch();
    return;
  }
  if (mod && (e.key === 'f' || e.key === 'F') && view.current === 'saved' && !els.bmToolbar.hidden) {
    e.preventDefault();
    els.bmSearch.focus();
    els.bmSearch.select();
    return;
  }
  if (mod && (e.key === 'f' || e.key === 'F') && state.files.length) {
    e.preventDefault();
    setView('album');
    els.searchInput.focus();
    els.searchInput.select();
    return;
  }
  if (mod && (e.key === 'a' || e.key === 'A') && view.current === 'album' && state.files.length && !isTyping(e.target)) {
    e.preventDefault();
    if (els.selectAll.disabled) return;
    els.selectAll.checked = !els.selectAll.checked;
    els.selectAll.dispatchEvent(new Event('change'));
    return;
  }
  if (e.key === 'Escape' && view.current !== 'album' && !isTyping(e.target)) {
    closeDrawers();
  }
});

els.queueAddBtn.addEventListener('click', () => addCurrentAlbumToQueue());
els.queueForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = els.queueUrls.value.trim() || currentUrl();
  if (!text) { toast('Paste album URLs first', 'warn'); return; }
  const r = addUrlsToQueue(text);
  els.queueUrls.value = '';
  announceQueueAdd(r);
});
els.queueAddStartBtn.addEventListener('click', () => startQueue());
els.queueStartBtn.addEventListener('click', () => startQueue());
els.queueStopBtn.addEventListener('click', () => requestStopQueue());
els.queueClearDoneBtn.addEventListener('click', () => clearFinishedQueue());
els.queueUrls.addEventListener('input', () => updateQueueRunStatus());
els.queueBrowseBtn.addEventListener('click', () => pickQueueDefaultFolder());
els.queueApplyFolderBtn.addEventListener('click', () => applyQueueFolderToAllQueued());

els.bmForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = els.bmUrl.value.trim();
  if (!url) { toast('Enter an album URL', 'warn'); return; }
  const r = await window.api.saveBookmark({
    url,
    title: els.bmTitle.value.trim() || albumIdFromUrl(url),
    note: els.bmNote.value,
  });
  if (!r.ok) { toast(r.error || 'Could not save', 'err'); return; }
  resetBookmarkForm();
  bmView.formOpen = false;
  await refreshBookmarks();
  toast(r.updated ? 'Updated saved album' : 'Saved for later', 'ok');
});
els.bmForm.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !els.bmCancel.hidden) {
    e.stopPropagation();
    setBmFormOpen(false, { clear: true });
  }
});
els.bmUrl.addEventListener('input', onBmUrlInput);
els.bmTitle.addEventListener('input', onBmTitleInput);
els.bmAddToggle.addEventListener('click', () => setBmFormOpen(!bmView.formOpen));
els.bmCancel.addEventListener('click', () => setBmFormOpen(false, { clear: true }));

els.bmSearch.addEventListener('input', () => {
  els.bmSearchClear.hidden = !els.bmSearch.value;
  clearTimeout(bmSearchTimer);
  bmSearchTimer = setTimeout(() => {
    bmView.query = els.bmSearch.value;
    renderBookmarks();
  }, 120);
});
els.bmSearch.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && els.bmSearch.value) {
    e.stopPropagation();
    clearBmSearch();
  }
});
els.bmSearchClear.addEventListener('click', clearBmSearch);
try {
  const saved = localStorage.getItem('bmSort');
  if (saved && [...els.bmSort.options].some((o) => o.value === saved)) bmView.sort = saved;
} catch {}
els.bmSort.value = bmView.sort;
els.bmSort.addEventListener('change', () => {
  bmView.sort = els.bmSort.value;
  try { localStorage.setItem('bmSort', bmView.sort); } catch {}
  renderBookmarks();
});

for (const el of [els.setMaxRetries, els.setLimitRate, els.setProxy, els.setMaintenance, els.setDiskCheck]) {
  el.addEventListener('change', persistSettingsSoon);
}

async function init() {
  if (window.api.platform) document.body.classList.add('platform-' + window.api.platform);
  try {
    setDensity(localStorage.getItem('density') || 'comfortable');
    if (localStorage.getItem('fileDetails') === '1') els.toggleDetailsBtn.click();
  } catch {
    setDensity('comfortable');
  }
  const r = await window.api.getSettings();
  const s = r.settings || {};
  applyTheme(s.theme || document.documentElement.dataset.theme, { persist: false });
  state.outputDir = s.outputDir || '';
  setOutputDirLabel(state.outputDir);
  state.queueOutputDir = s.queueOutputDir || '';
  syncQueueFolderInput();
  if (s.concurrency) els.concurrency.value = String(clampConcurrency(s.concurrency));
  els.setMaxRetries.value = String(Number.isFinite(parseInt(s.maxRetries, 10)) ? parseInt(s.maxRetries, 10) : 5);
  els.setLimitRate.value = String(Number(s.limitRateMBps) || 0);
  els.setProxy.value = s.proxy || '';
  els.setMaintenance.value = s.maintenanceStrategy === 'skip' ? 'skip' : 'backoff';
  els.setDiskCheck.checked = s.diskCheck !== false;
  els.skipExisting.checked = !!s.skipExisting;
  els.redownloadMismatch.checked = s.redownloadMismatch !== false;
  els.cipherEnabled.checked = !!s.cipherEnabled;
  els.cipherFind.value = s.cipherFind || '';
  els.cipherReplace.value = s.cipherReplace || '';
  els.cipherSensitive.checked = !!s.cipherSensitive;
  discreet.thumbs = s.discreetThumbs || discreet.thumbs;
  discreet.names = s.discreetNames || discreet.names;
  if (Array.isArray(s.discreetCategories)) discreet.categories = s.discreetCategories;
  discreet.words = s.discreetWords || '';
  discreet.strict = !!s.discreetStrict;
  els.discreetStrict.checked = discreet.strict;
  discreet.peek = s.discreetPeek !== false;
  discreet.veil = !!s.discreetVeil;
  discreet.startOn = !!s.discreetStartOn;
  discreet.button = s.discreetButton !== false;
  els.discreetWords.value = discreet.words;
  els.discreetPeek.checked = discreet.peek;
  els.discreetVeil.checked = discreet.veil;
  els.discreetStartOn.checked = discreet.startOn;
  els.discreetButton.checked = discreet.button;
  renderDiscreetSettings();
  setDiscreet(discreet.startOn || !!s.discreet, { persist: false, render: false });
  updateWindowVeil();
  els.searchHost.value = s.searchHost || '';
  setSearchMode(s.searchMode || 'broad');
  els.srSort.value = search.sort = s.searchSort || 'latest';
  search.per = parseInt(s.searchPer, 10) || 20;
  els.srPer.value = String(search.per);
  renderSearch();
  updateCipherUi();
  updateMismatchUi();
  await refreshBookmarks();
  const q = await window.api.listQueue();
  state.queue = q.ok ? (q.items || []) : [];
  renderQueue();
  setSelectedCount();
  els.urlInput.focus();
  // The Chrome extension opens this page as app.html?album=<url> from a Bunkr tab.
  const albumParam = new URLSearchParams(location.search).get('album');
  if (albumParam) loadAlbumUrl(albumParam);
}

init();
