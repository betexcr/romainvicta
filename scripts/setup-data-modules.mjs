/**
 * Convert legacy global data scripts into ESM modules under src/data/.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });

function write(name, contents) {
  const p = path.join(outDir, name);
  fs.writeFileSync(p, contents, 'utf8');
  console.log('wrote', path.relative(root, p), contents.length);
}

// --- app-core as ESM ---
let appCore = fs.readFileSync(path.join(root, 'app-core.js'), 'utf8');
appCore = appCore.replace(/^const\{useState,useEffect,useRef,useCallback,useMemo\}=React;\r?\n/, '');
appCore =
  `import * as THREE from 'three';\n` +
  appCore +
  `\nexport { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS };\n`;
write('app-core.js', appCore);

// Helper: wrap a const/let/var file as export + optional window assign
function wrapExport(srcName, exportNames, preamble = '', postamble = '') {
  let src = fs.readFileSync(path.join(root, srcName), 'utf8');
  // export top-level const/let for listed names
  for (const name of exportNames) {
    src = src.replace(new RegExp(`^(const|let|var)\\s+${name}\\b`, 'm'), `export $1 ${name}`);
  }
  // export function declarations
  for (const name of exportNames) {
    src = src.replace(new RegExp(`^function\\s+${name}\\b`, 'm'), `export function ${name}`);
  }
  const winAssign = exportNames
    .map((n) => `if (typeof window !== 'undefined') window.${n} = ${n};`)
    .join('\n');
  write(
    srcName.replace(/\.js$/, '') === srcName ? srcName : path.basename(srcName),
    `${preamble}${src}\n${postamble}\n${winAssign}\n`
  );
}

write(
  'data_es.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_es.js'), 'utf8');
    src = src.replace(/^const\s+DATA_ES\b/m, 'export const DATA_ES');
    return `${src}\nif (typeof window !== 'undefined') window.DATA_ES = DATA_ES;\n`;
  })()
);

write(
  'data_wiki.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_wiki.js'), 'utf8');
    src = src.replace(/^const\s+DATA_WIKI\b/m, 'export const DATA_WIKI');
    return `${src}\nif (typeof window !== 'undefined') window.DATA_WIKI = DATA_WIKI;\n`;
  })()
);

write(
  'data_wiki_es.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_wiki_es.js'), 'utf8');
    src = src.replace(/^const\s+DATA_WIKI_ES\b/m, 'export const DATA_WIKI_ES');
    return `${src}\nif (typeof window !== 'undefined') window.DATA_WIKI_ES = DATA_WIKI_ES;\n`;
  })()
);

write(
  'data_stats.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_stats.js'), 'utf8');
    src = src.replace(/^const\s+STATS_BY_YEAR\b/m, 'export const STATS_BY_YEAR');
    return `${src}\nif (typeof window !== 'undefined') window.STATS_BY_YEAR = STATS_BY_YEAR;\n`;
  })()
);

write(
  'data_tours.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_tours.js'), 'utf8');
    src = src.replace(/^const\s+TOURS\b/m, 'export const TOURS');
    return `${src}\nif (typeof window !== 'undefined') window.TOURS = TOURS;\n`;
  })()
);

write(
  'data_images.js',
  (() => {
    let src = fs.readFileSync(path.join(root, 'data_images.js'), 'utf8');
    src = src.replace(/^const\s+EVT_LOC_IMAGES\b/m, 'export const EVT_LOC_IMAGES');
    return `${src}\nif (typeof window !== 'undefined') window.EVT_LOC_IMAGES = EVT_LOC_IMAGES;\n`;
  })()
);

// data.js depends on EVT_LOC_IMAGES, THREE, ll2c, and uses typeof checks
{
  let src = fs.readFileSync(path.join(root, 'data.js'), 'utf8');
  src = src.replace(/^const\s+DATA\b/m, 'export const DATA');
  src = src.replace(/^const\s+ERA_T\b/m, 'export const ERA_T');
  src = src.replace(/^const\s+getT\b/m, 'export const getT');
  src = src.replace(/^const\s+TERR_ES\b/m, 'export const TERR_ES');
  src = src.replace(/^const\s+trTerr\b/m, 'export const trTerr');
  src = src.replace(/^const\s+ERAS\b/m, 'export const ERAS');
  src = src.replace(/^const\s+interpStats\b/m, 'export const interpStats');
  src = src.replace(/^const\s+fmtNum\b/m, 'export const fmtNum');
  src = src.replace(/^function\s+genOverlay\b/m, 'export function genOverlay');
  src = src.replace(/^function\s+mkArc\b/m, 'export function mkArc');
  src = src.replace(/^function\s+mkArrow\b/m, 'export function mkArrow');
  src = src.replace(/^const\s+getTriggerYears\b/m, 'export const getTriggerYears');
  // EVT_IMAGES is const then used — export it too if present
  src = src.replace(/^const\s+EVT_IMAGES\b/m, 'export const EVT_IMAGES');

  const preamble = `import * as THREE from 'three';
import { ll2c } from './app-core.js';
import { EVT_LOC_IMAGES } from './data_images.js';
`;
  const post = `
if (typeof window !== 'undefined') {
  window.DATA = DATA;
  window.ERA_T = ERA_T;
  window.getT = getT;
  window.TERR_ES = TERR_ES;
  window.trTerr = trTerr;
  window.ERAS = ERAS;
  window.interpStats = interpStats;
  window.fmtNum = fmtNum;
  window.genOverlay = genOverlay;
  window.mkArc = mkArc;
  window.mkArrow = mkArrow;
  window.getTriggerYears = getTriggerYears;
}
`;
  write('data.js', preamble + src + post);
}

// bootstrap that imports everything and re-exports app-core onto window
write(
  'bootstrap.js',
  `import * as THREE from 'three';
import { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS } from './app-core.js';
import './data_images.js';
import './data.js';
import './data_es.js';
import './data_wiki.js';
import './data_stats.js';
import './data_tours.js';

// Spanish wiki is large — load eagerly for now; lazy swap can import dynamically later
import './data_wiki_es.js';

if (typeof window !== 'undefined') {
  window.THREE = THREE;
  window.THEMES = THEMES;
  window.I18N = I18N;
  window.CAT_I18N_KEYS = CAT_I18N_KEYS;
  window.ERA_I18N_KEYS = ERA_I18N_KEYS;
  window.ll3 = ll3;
  window.ll2c = ll2c;
  window.yrL = yrL;
  window.yr = yr;
  window.CATS = CATS;
}

export { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS };
`
);

console.log('done');
