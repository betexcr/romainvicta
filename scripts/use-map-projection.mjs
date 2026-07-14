import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');

// Replace first paint projection block pattern (repeated)
const oldPaint = `    const W = window.innerWidth,
      H = window.innerHeight;
    cv.width = W;
    cv.height = H;
    const mapW = W,
      mapH = H - 140,
      offY = 60;
    const v = map2dView.current,
      z = v.zoom;
    const toX = (lng) => mapW / 2 + ((lng - v.lng) / 360) * mapW * z,
      toY = (lat) => offY + mapH / 2 - ((lat - v.lat) / 180) * mapH * z;`;

const newPaint = `    const W = window.innerWidth,
      H = window.innerHeight;
    cv.width = W;
    cv.height = H;
    const v = map2dView.current;
    const { mapW, mapH, offY, toX, toY } = createMapProjection(v, W, H);`;

if (!s.includes(oldPaint)) {
  console.warn('paint block miss');
} else {
  s = s.replace(oldPaint, newPaint);
  console.log('OK paint projection');
}

fs.writeFileSync('src/RomanGlobe.jsx', s);
