import { useMemo } from 'react';
import { translateItem } from '../lib/i18n.js';

export function useEventSearch(query, lang, data, dataEs) {
  return useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return data
      .map((d) => {
        const di = translateItem(d, lang, dataEs);
        const nm = di.name.toLowerCase();
        const ds = di.desc.toLowerCase();
        const locMatch = di.locs.find((l) => l.n.toLowerCase().includes(q));
        const factMatch = di.facts?.find((f) => f.toLowerCase().includes(q));
        if (nm.includes(q) || ds.includes(q) || locMatch || factMatch) {
          return {
            ...di,
            matchType: nm.includes(q) ? 'name' : locMatch ? 'location' : 'desc',
          };
        }
        return null;
      })
      .filter(Boolean)
      .slice(0, 10);
  }, [query, lang, data, dataEs]);
}
