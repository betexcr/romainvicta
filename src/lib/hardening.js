/**
 * Shared pure helpers for URL bootstrap + data integrity checks (unit-tested).
 */

export const VALID_LANGS = new Set(['en', 'es']);
export const VALID_THEMES = new Set(['dark', 'light']);

export function clampYear(y, item) {
  const n = Number(y);
  if (!Number.isFinite(n)) return item ? item.y1 : -753;
  const lo = item ? Math.min(item.y1, item.y2) : -753;
  const hi = item ? Math.max(item.y1, item.y2) : 476;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function resolveLang(qsLang, saved, navigatorLang = 'en') {
  if (VALID_LANGS.has(qsLang)) return qsLang;
  if (VALID_LANGS.has(saved)) return saved;
  const bl = String(navigatorLang || 'en').toLowerCase();
  return bl.startsWith('es') ? 'es' : 'en';
}

export function resolveTheme(saved, prefersLight = false) {
  if (VALID_THEMES.has(saved)) return saved;
  return prefersLight ? 'light' : 'dark';
}

export function resolveEventId(qsEvent, data, fallback = 'cam2') {
  if (qsEvent && data.some((d) => d.id === qsEvent)) return qsEvent;
  if (data.some((d) => d.id === fallback)) return fallback;
  return data[0]?.id || null;
}

export function assertDataParity(data, dataEs) {
  const missing = [];
  const locMismatch = [];
  for (const item of data) {
    const es = dataEs[item.id];
    if (!es) {
      missing.push(item.id);
      continue;
    }
    const enLocs = item.locs?.length || 0;
    const esLocs = es.locs?.length || 0;
    if (enLocs !== esLocs) locMismatch.push({ id: item.id, enLocs, esLocs });
  }
  return { missing, locMismatch };
}

export function assertTourEventIds(tours, data) {
  const ids = new Set(data.map((d) => d.id));
  const bad = [];
  for (const tour of tours) {
    for (const step of tour.steps || []) {
      if (!ids.has(step.eventId)) bad.push({ tour: tour.id, eventId: step.eventId });
    }
  }
  return bad;
}

export function getTriggerYears(item) {
  const locs = (item.locs || []).map((l, i) => ({
    ...l,
    ty:
      item.y1 === item.y2
        ? item.y1
        : Math.round(item.y1 + (i / Math.max(1, item.locs.length - 1)) * (item.y2 - item.y1)),
  }));
  const paths = (item.paths || []).map((p, i) => ({
    p,
    ty:
      item.y1 === item.y2
        ? item.y1
        : Math.round(item.y1 + ((i + 0.5) / Math.max(1, item.paths.length)) * (item.y2 - item.y1)),
  }));
  return { locs, paths };
}
