import fs from 'fs';
const s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');
const i = s.indexOf('setMapMode(m');
const j = s.indexOf('onClick={()=>setMapMode');
console.log('j', j);
console.log(s.slice(j - 80, j + 1200));

const k = s.indexOf('Open toolbar');
console.log('open toolbar', k);
const label = s.indexOf('aria-label={toolbarOpen');
console.log(s.slice(label, label + 80));
