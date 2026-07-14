import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');

const idx = s.indexOf('return(<button type="button" key={i} onClick={()=>{const ty=trig.locs');
const close = s.indexOf('</div>)})}', idx);
if (idx < 0 || close < 0) {
  console.error('loc close miss', idx, close);
  process.exit(1);
}
console.log('loc', JSON.stringify(s.slice(close - 50, close + 15)));
s = s.slice(0, close) + '</button>)})}' + s.slice(close + '</div>)})}'.length);

const ss = s.indexOf('<button type="button" key={r.id}');
const c1 = s.indexOf('</div></div>)', ss);
if (ss < 0 || c1 < 0) {
  console.error('search close miss', ss, c1);
  process.exit(1);
}
console.log('search', JSON.stringify(s.slice(c1 - 40, c1 + 20)));
s = s.slice(0, c1) + '</div></button>)' + s.slice(c1 + '</div></div>)'.length);

fs.writeFileSync('src/RomanGlobe.jsx', s);
console.log('ok');
