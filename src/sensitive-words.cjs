/**
 * Sensitive-word matcher shared by the desktop UI (Discreet view, via preload)
 * and the main process (name cipher for files written to disk).
 *
 * CommonJS so the sandbox-free preload can require() it; ESM code imports it too.
 *
 * Term syntax (built-in lists and the user's own words):
 *   word     whole word only — "ass" does not match "class" or "passport"
 *   word*    word start, any ending — "nude*" matches nudes, nudity
 *   *word*   anywhere inside a word — "*boob*" matches BigBoobs
 *   two words  any of space _ . - between them — "cam girl" matches cam_girl
 * Word boundaries are non-letters (digits, _ - . count as separators) and
 * camelCase humps, so "hot_sex_04", "HotSexVideo" and "SpermMania" all split.
 * Lowercase words glued together ("spermmania") only match *word* terms —
 * or every term in strict mode.
 */

'use strict';

const TERMS = {
  explicit: [
    'sex', 'sexy', 'sexting', 'sextape*', '*porn*', 'xxx', 'nsfw', '18+',
    '*fuck*', 'nude*', 'nudity', 'naked', '*erotic*', 'lewd*', 'horny',
    '*orgasm*', '*masturbat*', '*handjob*', '*blowjob*', '*deepthroat*',
    'cum', 'cumming', '*cumshot*', '*creampie*', 'anal', '*gangbang*',
    'threesome*', 'orgy', 'orgies', 'bdsm', 'bondage', 'fetish*', 'kinky',
    'hardcore', 'softcore', '*striptease*', 'squirt*', 'fap*', '*dildo*',
    '*sperm*', 'semen', '*jizz*', '*bukkake*', 'spunk', '*cumslut*',
    'секс*', '*порн*', '*эрот*', 'голая', 'голые', 'голый', 'обнаж*',
    'трах*', '*минет*', '*мастурб*', '*оргазм*', 'еба*', 'ебл*', 'ебут*',
    '*сперм*', '*малоф*',
  ],
  anatomy: [
    '*boob*', 'tit', 'tits', 'titty', 'titties', 'ass', 'asses', 'butt',
    'butts', 'booty', '*pussy*', 'pussies', 'cock', 'cocks', 'dick', 'dicks',
    '*penis*', '*vagina*', 'nipple*', 'breasts', 'clit*', 'topless',
    'bottomless', 'braless', '*upskirt*', 'downblouse', '*cameltoe*',
    '*сиськ*', '*сисек*', 'жоп*', '*письк*', '*пизд*', '*хуй*', 'хуе*',
  ],
  genres: [
    'milf*', 'gilf*', 'teen', 'teens', 'stepsis*', 'stepsister*', 'stepmom*',
    'stepbro*', 'stepdad*', '*hentai*', 'rule34', 'r34', 'futa*', 'ahegao',
    'ecchi', 'femboy*', 'camgirl*', 'cam girl', 'slut*', 'whore*', 'thot',
    'thots', 'bimbo*', 'bbw', 'cuck*', 'femdom', 'incest', 'leak', 'leaks',
    'leaked', 'jav', 'uncensored', 'lingerie', 'joi', 'gonewild',
    'шлюх*', 'шалав*', 'милф*', 'хентай*',
  ],
  sites: [
    '*onlyfan*', '*fansly*', '*manyvids*', '*chaturbate*', '*xvideos*',
    '*xhamster*', '*xnxx*', '*brazzers*', '*bangbros*', '*fanvue*',
    '*loyalfans*', '*justforfans*', '*clips4sale*', '*stripchat*',
    '*camsoda*', '*myfreecams*', 'mfc', '*bongacams*', 'cam4', 'erome',
    '*coomer*', 'kemono', '*thothub*', '*simpcity*', '*nudostar*',
    '*spankbang*', '*redgifs*',
  ],
};

const CATEGORY_IDS = Object.keys(TERMS);

/** Bland stand-ins; the same matched word always maps to the same one. */
const NEUTRAL_WORDS = [
  'maple', 'cedar', 'harbor', 'meadow', 'pebble', 'willow', 'amber', 'comet',
  'orbit', 'pixel', 'canvas', 'summit', 'lagoon', 'breeze', 'ember', 'quartz',
  'velvet', 'coral', 'falcon', 'cobalt', 'lotus', 'nimbus', 'prism', 'sierra',
  'tundra', 'violet', 'birch', 'delta', 'echo', 'fjord', 'glacier', 'hazel',
  'indigo', 'juniper', 'kelp', 'lumen', 'marble', 'nectar', 'opal', 'pine',
  'quill', 'ripple', 'saffron', 'timber', 'umber', 'vista', 'wren', 'zephyr',
  'aspen', 'basil', 'citrus', 'dune', 'fern', 'grove', 'heron', 'iris',
  'jasper', 'kite', 'linen', 'moss', 'nova', 'olive', 'sparrow', 'tidal',
];

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The regex runs without the `i` flag: under /iu, \p{Lu} and \p{Ll} match both
// cases, which would break camelCase boundaries. Terms spell out [sS][eE][xX] instead.
const HUMP = '(?<=\\p{Ll})(?=\\p{Lu})';
const WORD_START = `(?:(?<!\\p{L})|${HUMP})`;
const WORD_END = `(?:(?!\\p{L})|${HUMP})`;
/** Rest of the word, stopping at the next camelCase hump: Porn|Mania. */
const WORD_TAIL = '(?:(?!(?<=\\p{Ll})\\p{Lu})\\p{L})*';

function caseless(ch) {
  const lo = ch.toLowerCase();
  const up = ch.toUpperCase();
  if (lo === up || [...lo].length !== 1 || [...up].length !== 1) return escapeRegExp(ch);
  return `[${lo}${up}]`;
}

/**
 * Regex source for one term, or '' when the term is empty.
 * Strict mode drops the word boundaries, so every term also matches inside words.
 */
function termSource(term, strict = false) {
  let t = String(term || '').trim().toLowerCase();
  const anyStart = strict || t.startsWith('*');
  const anyEnd = t.endsWith('*');
  t = t.replace(/^\*+|\*+$/g, '').trim();
  if (!t) return '';
  const body = t
    .split(/\s+/)
    .map((w) => [...w].map(caseless).join(''))
    .join('[\\s_.\\-]*');
  const tail = anyEnd ? WORD_TAIL : strict ? '' : WORD_END;
  return (anyStart ? '' : WORD_START) + body + tail;
}

/** User words from a textarea: comma, semicolon or line separated. */
function parseCustomWords(text) {
  return String(text || '')
    .split(/[\n,;]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return CATEGORY_IDS.filter((id) => categories.includes(id));
}

const cache = new Map();

/** One case-insensitive regex for the chosen categories plus custom words, or null. */
function matcherFor(categories, custom, strict = false) {
  const cats = normalizeCategories(categories);
  const extra = parseCustomWords(custom);
  const key = (strict ? 'S' : 'W') + cats.join(',') + '|' + extra.join('\n');
  if (cache.has(key)) return cache.get(key);

  const sources = new Set();
  for (const id of cats) for (const t of TERMS[id]) sources.add(termSource(t, strict));
  for (const t of extra) sources.add(termSource(t, strict));
  sources.delete('');
  // Longer alternatives first, so "sexting" wins over "sex" at the same position.
  const list = [...sources].sort((a, b) => b.length - a.length);
  const re = list.length ? new RegExp(list.join('|'), 'gu') : null;

  if (cache.size > 16) cache.clear();
  cache.set(key, re);
  return re;
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Keep the look of the original: SEX → MAPLE, Sex → Maple, sex → maple. */
function matchCase(source, word) {
  const letters = source.replace(/[^\p{L}]/gu, '');
  if (letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase()) {
    return word.toUpperCase();
  }
  const first = letters.charAt(0);
  if (first && first === first.toUpperCase() && first !== first.toLowerCase()) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }
  return word;
}

function neutralWord(token) {
  return NEUTRAL_WORDS[hash(String(token).toLowerCase()) % NEUTRAL_WORDS.length];
}

/**
 * Replace every sensitive word in `text`.
 * @param {string} text
 * @param {{ categories?: string[], custom?: string, strict?: boolean, style?: 'swap' | 'dots' }} [opts]
 *   swap — a neutral word with matching case; dots — a short run of bullets;
 *   strict — terms also match inside lowercase words glued together.
 */
function maskText(text, opts = {}) {
  const s = String(text ?? '');
  if (!s) return s;
  const re = matcherFor(opts.categories, opts.custom, !!opts.strict);
  if (!re) return s;
  re.lastIndex = 0;
  if (opts.style === 'dots') {
    return s.replace(re, (m) => '•'.repeat(Math.min(8, Math.max(3, [...m].length))));
  }
  return s.replace(re, (m) => matchCase(m, neutralWord(m)));
}

/** True when `text` contains at least one sensitive word. */
function hasMatch(text, opts = {}) {
  const re = matcherFor(opts.categories, opts.custom, !!opts.strict);
  if (!re || !text) return false;
  re.lastIndex = 0;
  return re.test(String(text));
}

/** Category ids with their term counts, in display order. */
function categoryInfo() {
  return CATEGORY_IDS.map((id) => ({ id, count: TERMS[id].length }));
}

module.exports = {
  CATEGORY_IDS,
  categoryInfo,
  hasMatch,
  maskText,
  neutralWord,
  parseCustomWords,
  termSource,
};
