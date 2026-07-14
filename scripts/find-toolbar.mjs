import fs from 'fs';
const s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');
for (const term of ['setAnimRoutes(', 'setShowStats(', 'setMapMode(', 'setAudioOn(', 'animateRoutes', 'soundOn', 'mapMode3D']) {
  console.log(term, s.indexOf(term), (s.split(term).length - 1));
}
const i = s.indexOf('setMapMode');
console.log(s.slice(Math.max(0, i - 150), i + 900));
