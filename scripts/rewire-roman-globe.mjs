/**
 * Rewire RomanGlobe.jsx to use extracted modules (behavior-preserving).
 */
import fs from 'fs';

const path = 'src/RomanGlobe.jsx';
let s = fs.readFileSync(path, 'utf8');

const newImports = `import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import { DATA, getTriggerYears as dataGetTriggerYears, genOverlay, mkArc, mkArrow, getT, ERAS, interpStats, fmtNum, trTerr } from "./data/data.js";
import { DATA_ES } from "./data/data_es.js";
import { DATA_WIKI } from "./data/data_wiki.js";
import { TOURS } from "./data/data_tours.js";
import { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, yrL, CATS } from "./data/app-core.js";
import {
  clampYear,
  resolveLang,
  resolveTheme,
  resolveEventId,
  getTriggerYears as hardeningGetTriggerYears,
} from "./lib/hardening.js";
import {
  findItem as findItemInData,
  translateItem,
  createTranslator,
  localizedName,
  localizedDesc,
  localizedFacts,
  getWikiArticle,
  renderBoldText,
} from "./lib/i18n.js";
import { makeThemeStyles } from "./lib/styles.js";
import { generateQuizQuestions, isQuizAnswerCorrect } from "./lib/quiz.js";
import { useToast } from "./hooks/useToast.js";
import { useSheetDrag } from "./hooks/useSheetDrag.js";
import { useAmbientAudio } from "./hooks/useAmbientAudio.js";
import { useGuidedTour } from "./hooks/useGuidedTour.js";
import { useEventSearch } from "./hooks/useEventSearch.js";
import ToastBanner from "./components/ToastBanner.jsx";

// Prefer data.js implementation (includes path trigger midpoints used by globe).
const getTriggerYears = dataGetTriggerYears || hardeningGetTriggerYears;
`;

// Replace old import block through bootstrap
s = s.replace(
  /import React,[\s\S]*?import "\.\/data\/bootstrap\.js";\n/,
  newImports,
);

// Replace boot helpers through theme/lang init with shared resolvers
const bootStart = 'function RomanGlobe() {\n  const VALID_LANGS = new Set(["en", "es"]);';
const bootEndMarker = '  const [statusToast, setStatusToast] = useState(null);';

const bootIdx = s.indexOf(bootStart);
const statusIdx = s.indexOf(bootEndMarker);
if (bootIdx < 0 || statusIdx < 0) {
  console.error('boot markers missing', bootIdx, statusIdx);
  process.exit(1);
}

const newBoot = `function RomanGlobe() {
  const findItem = (id) => findItemInData(DATA, id);
  const safeTrItem = (item, ln) => translateItem(item, ln, DATA_ES);
  const trItem = (item, ln) => safeTrItem(item, ln);
  const _qs = (() => {
    try {
      return Object.fromEntries(new URLSearchParams(window.location.search));
    } catch (e) {
      return {};
    }
  })();
  const _initEvt = resolveEventId(_qs.event, DATA, "cam2");
  const _initItem = findItem(_initEvt) || DATA[0];
  const _qCat = _qs.event && findItem(_qs.event) ? findItem(_qs.event).cat : null;
  const _rawYear =
    _qs.year != null && _qs.year !== "" && Number.isFinite(+_qs.year)
      ? +_qs.year
      : null;
  const _initYear = clampYear(
    _rawYear != null ? _rawYear : _initItem.y1,
    _initItem,
  );
  const [cat, setCat] = useState(_qCat || _initItem.cat);
  const [sel, setSel] = useState(_initEvt);
  const [year, setYear] = useState(_initYear);
  const [hover, setHover] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth >= 768);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [wikiPanel, setWikiPanel] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [eventWiki, setEventWiki] = useState(null);
  const [lang, setLang] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("roma_lang");
    } catch (e) {}
    return resolveLang(
      _qs.lang,
      saved,
      navigator.language || navigator.userLanguage || "en",
    );
  });
  const [theme, setTheme] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("roma_theme");
    } catch (e) {}
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    return resolveTheme(saved, prefersLight);
  });
  const { message: statusToast, showToast } = useToast();
`;

s = s.slice(0, bootIdx) + newBoot + s.slice(statusIdx + bootEndMarker.length);

// Remove autoTips line that immediately followed statusToast — it should still be there after slice.
// After our cut we land on `const [autoTips...` — verify
if (!s.includes('const [autoTips, setAutoTips]')) {
  console.error('autoTips lost');
  process.exit(1);
}

// Replace i18n helpers block: from `const TH = THEMES` through renderBold
const thStart = s.indexOf('  const TH = THEMES[theme] || THEMES.dark;');
const langEffect = s.indexOf('  useEffect(() => {\n    try {\n      localStorage.setItem("roma_lang", lang);');
if (thStart < 0 || langEffect < 0) {
  console.error('i18n block markers', thStart, langEffect);
  process.exit(1);
}

const i18nBlock = `  const TH = THEMES[theme] || THEMES.dark;
  const { t, catName } = createTranslator(lang, I18N, CAT_I18N_KEYS);
  const yrf = (y) => yrL(y, lang);
  const dName = (item) => localizedName(item, lang, DATA_ES);
  const dDesc = (item) => localizedDesc(item, lang, DATA_ES);
  const dFacts = (item) => localizedFacts(item, lang, DATA_ES);
  const getArticle = (itemId) =>
    getWikiArticle(
      itemId,
      lang,
      typeof DATA_WIKI !== "undefined" ? DATA_WIKI : null,
      typeof DATA_WIKI_ES !== "undefined" ? DATA_WIKI_ES : null,
    );
  const renderBold = (text) => renderBoldText(React, text, TH.gold);
`;

s = s.slice(0, thStart) + i18nBlock + s.slice(langEffect);

// Remove old showToast after theme effect
s = s.replace(
  /  const showToast = \(msg\) => \{\n    setStatusToast\(msg\);\n    clearTimeout\(showToast\._t\);\n    showToast\._t = setTimeout\(\(\) => setStatusToast\(null\), 2200\);\n  \};\n/,
  '',
);

// Replace sheet drag block with hook
const sheetStart = s.indexOf('  const sheetDrag = useRef({ startY: 0, dy: 0, active: false });');
const sheetEnd = s.indexOf('  const map2dView = useRef({ lat: 41.9, lng: 12.5, zoom: 2 });');
if (sheetStart < 0 || sheetEnd < 0) {
  console.error('sheet markers', sheetStart, sheetEnd);
  process.exit(1);
}
s =
  s.slice(0, sheetStart) +
  `  const { sheetTouchStart, mkSheetMove, mkSheetEnd } = useSheetDrag();\n` +
  s.slice(sheetEnd);

// Replace sty
s = s.replace(
  /  const sty = \{\n    panel: \{[\s\S]*?textAlign: "left",\n    \}\),\n  \};/,
  '  const sty = makeThemeStyles(TH);',
);

// Replace searchResults useMemo
s = s.replace(
  /  const searchResults = useMemo\(\(\) => \{[\s\S]*?\}, \[searchQuery, lang\]\);/,
  '  const searchResults = useEventSearch(searchQuery, lang, DATA, DATA_ES);',
);

// Replace audio block through audioOn effect with hook — keep audioOn state
const audioStart = s.indexOf('  const audioElRef = useRef(null);');
const audioEnd = s.indexOf('  const tourTimerRef = useRef(null);');
if (audioStart < 0 || audioEnd < 0) {
  console.error('audio markers', audioStart, audioEnd);
  process.exit(1);
}
s =
  s.slice(0, audioStart) +
  `  useAmbientAudio({\n    audioOn,\n    onBlocked: () => showToast(t("soundOff") || "Audio blocked"),\n  });\n` +
  s.slice(audioEnd);

// Replace tour block with hook — need to remove tour state declarations earlier and use hook return
s = s.replace(
  /  const \[tourActive, setTourActive\] = useState\(null\);\n  const \[tourStep, setTourStep\] = useState\(0\);/,
  '',
);
s = s.replace(
  /  const \[tourPaused, setTourPaused\] = useState\(false\);\n/,
  '',
);

const tourHookInsertAfter = s.indexOf('  const [audioOn, setAudioOn] = useState(true);');
if (tourHookInsertAfter < 0) {
  console.error('audioOn state missing');
  process.exit(1);
}
const insertAt = s.indexOf('\n', tourHookInsertAfter) + 1;
const tourHookCall = `  const {
    tourActive,
    setTourActive,
    tourStep,
    setTourStep,
    tourPaused,
    setTourPaused,
    startTour,
    advanceTour,
  } = useGuidedTour({
    findItem,
    setCat,
    setSel,
    setYear,
    setPlaying,
    setSideOpen,
  });
`;
// Only insert if not already present
if (!s.includes('useGuidedTour(')) {
  s = s.slice(0, insertAt) + tourHookCall + s.slice(insertAt);
}

// Remove old tour functions and effect
s = s.replace(
  /  const tourTimerRef = useRef\(null\);\n  const startTour = \(tour\) => \{[\s\S]*?\}, \[tourActive, tourStep, tourPaused\]\);\n/,
  '',
);

// Replace generateQuiz / stripYears / answerQuiz
s = s.replace(
  /  const stripYears = \(s\) =>\n    s\n      \.replace\([\s\S]*?\.trim\(\);\n  const generateQuiz = \(\) => \{[\s\S]*?return questions;\n  \};/,
  `  const generateQuiz = () =>
    generateQuizQuestions({
      data: DATA,
      cats: CATS,
      lang,
      translateItem: (item, ln) => translateItem(item, ln, DATA_ES),
      t,
      catName,
      formatYear: yrf,
    });`,
);

s = s.replace(
  /    const isCorrect =\n      q\.type === "category" \? answer === q\.correct : answer === q\.correct;/,
  '    const isCorrect = isQuizAnswerCorrect(q, answer);',
);

// Toast UI replacement for status + share — keep shareToast state but use ToastBanner
s = s.replace(
  /\{shareToast&&\([\s\S]*?\{t\("linkCopied"\)\}<\/div>\)\}\{statusToast&&\([\s\S]*?\{statusToast\}<\/div>\)\}/,
  `{shareToast && (
        <ToastBanner message={t("linkCopied")} theme={TH} goldBorder />
      )}
      <ToastBanner message={statusToast} theme={TH} />`,
);

// Fix corrupted em dashes (restore intended glyph)
s = s.replace(/â€”/g, '—');
s = s.replace(/â†’/g, '→');
s = s.replace(/âœ¦/g, '✦');
s = s.replace(/â—‚/g, '◀');
s = s.replace(/â–¸/g, '▶');
s = s.replace(/â˜°/g, '☰');
s = s.replace(/âœ•/g, '✕');
s = s.replace(/Ã—/g, '×');

// Ensure DATA_WIKI_ES referenced as global for lazy load — keep typeof checks
// Lazy import still assigns window in data_wiki_es.js

// Remove unused initFromUrl if present
// Keep TOURS / ERA_I18N_KEYS available via imports

fs.writeFileSync(path, s);
console.log('rewired', {
  len: s.length,
  useToast: s.includes('useToast'),
  useGuidedTour: s.includes('useGuidedTour'),
  useAmbientAudio: s.includes('useAmbientAudio'),
  generateQuizQuestions: s.includes('generateQuizQuestions'),
  ToastBanner: s.includes('ToastBanner'),
  bootstrap: s.includes('bootstrap'),
  tourStateDup: (s.match(/useState\(null\).*tour/g) || []).length,
});
