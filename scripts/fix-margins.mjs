import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');
const n = (s.match(/margin: 0,\r?\n\s+marginBottom: 6,/g) || []).length;
s = s.replace(/margin: 0,\r?\n(\s+)marginBottom: 6,/g, 'margin: "0 0 6px 0",');
fs.writeFileSync('src/RomanGlobe.jsx', s);
console.log('fixed margins', n);
