/**
 * Shared 2D map projection helpers (equirectangular view).
 */

export const MAP2D_CHROME = { bottomReserve: 140, topOffset: 60 };

export function createMapProjection(view, width, height) {
  const mapW = width;
  const mapH = height - MAP2D_CHROME.bottomReserve;
  const offY = MAP2D_CHROME.topOffset;
  const z = view.zoom;
  const toX = (lng) => mapW / 2 + ((lng - view.lng) / 360) * mapW * z;
  const toY = (lat) => offY + mapH / 2 - ((lat - view.lat) / 180) * mapH * z;
  return { mapW, mapH, offY, z, toX, toY };
}

/** Project a lat/lng into canvas pixels for the current 2D view. */
export function projectMapLatLng(lat, lng, view, width, height) {
  const { toX, toY } = createMapProjection(view, width, height);
  return { x: toX(lng), y: toY(lat) };
}

export function projectGlobePoint(worldPos, camera, renderer) {
  const ndc = worldPos.project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
    y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
  };
}
