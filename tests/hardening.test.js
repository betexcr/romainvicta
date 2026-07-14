import { describe, it, expect } from 'vitest';
import {
  clampYear,
  resolveLang,
  resolveTheme,
  resolveEventId,
  assertDataParity,
  assertTourEventIds,
  getTriggerYears,
} from '../src/lib/hardening.js';
import { DATA } from '../src/data/data.js';
import { DATA_ES } from '../src/data/data_es.js';
import { TOURS } from '../src/data/data_tours.js';

describe('URL / prefs validation', () => {
  it('clamps year to event bounds', () => {
    const item = { y1: -58, y2: -50 };
    expect(clampYear(9999, item)).toBe(-50);
    expect(clampYear(-1000, item)).toBe(-58);
    expect(clampYear('abc', item)).toBe(-58);
    expect(clampYear(-55.4, item)).toBe(-55);
  });

  it('allowlists lang and theme', () => {
    expect(resolveLang('es', 'en')).toBe('es');
    expect(resolveLang('fr', 'es')).toBe('es');
    expect(resolveLang(null, 'xx', 'es-MX')).toBe('es');
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('neon', true)).toBe('light');
    expect(resolveTheme('neon', false)).toBe('dark');
  });

  it('resolves deep-link event IDs against DATA', () => {
    expect(resolveEventId('cam2', DATA)).toBe('cam2');
    expect(resolveEventId('nope', DATA)).toBe('cam2');
  });
});

describe('timeline helpers', () => {
  it('getTriggerYears is monotonic within [y1,y2]', () => {
    const item = DATA.find((d) => d.id === 'cam2');
    const { locs, paths } = getTriggerYears(item);
    for (const l of locs) {
      expect(l.ty).toBeGreaterThanOrEqual(Math.min(item.y1, item.y2));
      expect(l.ty).toBeLessThanOrEqual(Math.max(item.y1, item.y2));
    }
    for (const p of paths) {
      expect(p.ty).toBeGreaterThanOrEqual(Math.min(item.y1, item.y2));
      expect(p.ty).toBeLessThanOrEqual(Math.max(item.y1, item.y2));
    }
  });
});

describe('content integrity', () => {
  it('DATA ↔ DATA_ES key parity and loc counts', () => {
    const { missing, locMismatch } = assertDataParity(DATA, DATA_ES);
    expect(missing).toEqual([]);
    expect(locMismatch).toEqual([]);
  });

  it('tour step eventIds exist in DATA', () => {
    expect(assertTourEventIds(TOURS, DATA)).toEqual([]);
  });

  it('quiz pool always has enough events', () => {
    expect(DATA.length).toBeGreaterThanOrEqual(10);
    const withLocs = DATA.filter((d) => d.locs?.length > 0);
    expect(withLocs.length).toBeGreaterThanOrEqual(4);
  });
});
