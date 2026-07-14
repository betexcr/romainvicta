/**
 * Content localization helpers (EN base + ES overlays).
 * Spanish locs/paths are index-aligned with English entries.
 */

export function findItem(data, id) {
  return id ? data.find((d) => d.id === id) || null : null;
}

export function translateItem(item, lang, dataEs) {
  if (!item) return null;
  const locs = Array.isArray(item.locs) ? item.locs : [];
  const paths = Array.isArray(item.paths) ? item.paths : [];
  const base = { ...item, locs, paths };
  if (lang !== 'es' || !dataEs?.[item.id]) return base;
  const es = dataEs[item.id];
  return {
    ...base,
    name: es.name || item.name,
    desc: es.desc || item.desc,
    facts: es.facts || item.facts,
    imgAlt: es.imgAlt || item.imgAlt,
    locs: locs.map((l, i) => ({
      ...l,
      n: es.locs?.[i]?.n || l.n,
      info: es.locs?.[i]?.info || l.info,
      wiki: es.locs?.[i]?.wiki || l.wiki,
      imgAlt: es.locs?.[i]?.imgAlt || l.imgAlt,
    })),
    paths: paths.map((p, i) => {
      const r = [...p];
      if (es.pathLabels?.[i]) r[4] = es.pathLabels[i];
      if (es.pathWikis?.[i]) r[5] = es.pathWikis[i];
      return r;
    }),
  };
}

export function createTranslator(lang, i18n, catKeys) {
  const dict = i18n[lang] || i18n.en;
  const t = (key) => dict[key] || i18n.en[key] || key;
  const catName = (id) => t(catKeys[id]) || id;
  return { t, catName };
}

export function localizedName(item, lang, dataEs) {
  return (lang === 'es' && dataEs?.[item.id]?.name) || item.name;
}

export function localizedDesc(item, lang, dataEs) {
  return (lang === 'es' && dataEs?.[item.id]?.desc) || item.desc;
}

export function localizedFacts(item, lang, dataEs) {
  return (lang === 'es' && dataEs?.[item.id]?.facts) || item.facts;
}

export function getWikiArticle(itemId, lang, wikiEn, wikiEs) {
  if (lang === 'es' && wikiEs?.[itemId]) return wikiEs[itemId];
  if (wikiEn?.[itemId]) return wikiEn[itemId];
  return null;
}

export function renderBoldText(React, text, accentColor) {
  return text.split(/\*\*(.*?)\*\*/).map((part, i) =>
    i % 2 === 1
      ? React.createElement(
          'span',
          { key: i, style: { fontWeight: 700, color: accentColor } },
          part,
        )
      : React.createElement('span', { key: i }, part),
  );
}
