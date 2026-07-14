import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');

const marker =
  '<button onClick={()=>advanceTour(-1)} disabled={tourStep===0}';
const insert =
  '<button onClick={()=>setTourPaused(p=>!p)} aria-label={tourPaused?t("resumeTour"):t("pauseTour")} style={{background:"none",border:`1px solid ${TH.border}`,borderRadius:4,width:isMobile?44:28,height:isMobile?44:28,color:TH.gold,cursor:"pointer",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{tourPaused?"▶":"❚❚"}</button>' +
  marker;

if (!s.includes('setTourPaused(p=>!p)') && s.includes(marker)) {
  s = s.replace(marker, insert);
  fs.writeFileSync('src/RomanGlobe.jsx', s);
  console.log('OK tour pause button');
} else {
  console.log('skip', s.includes('setTourPaused(p=>!p)'));
}
