import { describe, it, expect } from 'vitest';
import {
  createMapProjection,
  projectMapLatLng,
  MAP2D_CHROME,
} from '../src/lib/mapProjection.js';

describe('mapProjection', () => {
  it('keeps chrome offsets and centers view lng/lat', () => {
    const view = { lat: 41.9, lng: 12.5, zoom: 2 };
    const { mapW, mapH, offY, z, toX, toY } = createMapProjection(view, 800, 600);
    expect(mapW).toBe(800);
    expect(mapH).toBe(600 - MAP2D_CHROME.bottomReserve);
    expect(offY).toBe(MAP2D_CHROME.topOffset);
    expect(z).toBe(2);
    expect(toX(12.5)).toBe(400);
    expect(toY(41.9)).toBe(offY + mapH / 2);
  });

  it('projectMapLatLng matches createMapProjection helpers', () => {
    const view = { lat: 0, lng: 0, zoom: 1 };
    const { toX, toY } = createMapProjection(view, 1000, 500);
    const pt = projectMapLatLng(10, 20, view, 1000, 500);
    expect(pt.x).toBe(toX(20));
    expect(pt.y).toBe(toY(10));
  });
});
