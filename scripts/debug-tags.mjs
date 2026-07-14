import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');

// Fix location rows: opened as button but closed as div
const locCloseOld =
  '{l.wiki&&vis&&<span style={{fontSize:9,color:TH.gold,opacity:0.5,marginLeft:"auto"}}>';
const idx = s.indexOf('return(<button type="button" key={i} onClick={()=>{const ty=trig.locs[i].ty');
console.log('loc button at', idx);
if (idx > 0) {
  const slice = s.slice(idx, idx + 800);
  console.log(slice.slice(-200));
  // Find first </div>) after loc button start that closes the row
  const closeAt = s.indexOf('</div>)})}', idx);
  // might be wrong - find the loc-specific close
  const marker = 'marginLeft:"auto"}}>';
  const m = s.indexOf(marker, idx);
  if (m > 0) {
    const after = s.slice(m, m + 80);
    console.log('after marker', after);
  }
}

// Search results: ensure closing tag is button
const searchStart = s.indexOf('<button type="button" key={r.id}');
console.log('search button', searchStart);
if (searchStart > 0) {
  console.log(s.slice(searchStart, searchStart + 100));
  // find end of this map item - look for pattern around 400 chars
  const chunk = s.slice(searchStart, searchStart + 700);
  console.log('CHUNK END', chunk.slice(-120));
}
