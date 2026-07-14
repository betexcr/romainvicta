import fs from 'fs';
const file = 'src/RomanGlobe.jsx';
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

function rep(a, b, label) {
  if (!s.includes(a)) {
    console.warn('MISS', label);
    return false;
  }
  s = s.replace(a, b);
  console.log('OK', label);
  return true;
}

// tipDomRef on tooltip
rep(
  '{tooltip&&(<div role="tooltip" aria-live="polite" style={{position:"fixed",left:tooltip.x,top:tooltip.y,',
  '{tooltip&&(<div ref={tipDomRef} role="tooltip" aria-live="polite" style={{position:"fixed",left:tooltip.x,top:tooltip.y,',
  'tipDomRef'
);

// status toast after shareToast
rep(
  '{shareToast&&(<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:300,background:TH.panelSolid,border:`1px solid ${TH.gold}`,borderRadius:8,padding:"10px 20px",color:TH.gold,fontSize:13,letterSpacing:1,boxShadow:`0 4px 20px rgba(0,0,0,0.4)`,animation:"fadeIn 0.2s ease"}}>{t("linkCopied")}</div>)}',
  '{shareToast&&(<div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:300,background:TH.panelSolid,border:`1px solid ${TH.gold}`,borderRadius:8,padding:"10px 20px",color:TH.gold,fontSize:13,letterSpacing:1,boxShadow:`0 4px 20px rgba(0,0,0,0.4)`,animation:"fadeIn 0.2s ease"}}>{t("linkCopied")}</div>)}{statusToast&&(<div role="status" style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",zIndex:300,background:TH.panelSolid,border:`1px solid ${TH.border}`,borderRadius:8,padding:"10px 20px",color:TH.text,fontSize:13,boxShadow:`0 4px 20px rgba(0,0,0,0.4)`}}>{statusToast}</div>)}',
  'statusToast UI'
);

// role application -> main
rep(
  'role="application" aria-label={t("appLabel")}',
  'role="main" aria-label={t("appLabel")}',
  'role main'
);

// km2 encoding
rep('kmÂ²', 'km²', 'km2');

// audio paths
rep(
  '["audio/theme.mp3","audio/campaign1.mp3","audio/campaign2.mp3","audio/campaign3.mp3","audio/campaign4.mp3"]',
  '["/audio/theme.mp3","/audio/campaign1.mp3","/audio/campaign2.mp3","/audio/campaign3.mp3","/audio/campaign4.mp3"]',
  'audio paths'
);

// Lazy-load Spanish wiki when lang switches to es
rep(
  'useEffect(()=>{try{localStorage.setItem("roma_lang",lang);document.documentElement.lang=lang}catch(e){}},[lang]);',
  'useEffect(()=>{try{localStorage.setItem("roma_lang",lang);document.documentElement.lang=lang}catch(e){}if(lang==="es"&&typeof DATA_WIKI_ES==="undefined"){import("./data/data_wiki_es.js").catch(err=>console.warn("Failed to load ES wiki",err))}},[lang]);',
  'lazy ES wiki'
);

// Quiz location type when qType===1 was category misuse of locs - change generation
rep(
  'const qType=questions.length%4;\n      if(qType===0){',
  'const qType=questions.length%4;\n      if(qType===3&&d.locs.length>0){const loc=trItem(d,lang).locs[0];const correct=loc.n;const pool=DATA.filter(x=>x.id!==d.id&&x.locs?.length).sort(()=>Math.random()-0.5).slice(0,3).map(x=>trItem(x,lang).locs[0].n);const opts=[correct,...pool].sort(()=>Math.random()-0.5);questions.push({type:"location",question:t("questionLocation"),context:stripYears(di.name),correct,options:opts});continue}\n      if(qType===0){',
  'quiz location'
);

// Dialog focus: only focus once (avoid RAF thrash interaction) - replace ref callbacks that always focus
s = s.replaceAll(
  'ref={el=>{if(el)el.focus()}}',
  'ref={el=>{if(el&&document.activeElement!==el){el.dataset.focused||(el.focus(),el.dataset.focused="1")}}}'
);
console.log('OK dialog focus once');

// Pause tour on wiki/search interaction
rep(
  'const handleTooltipClick=useCallback(()=>{if(!tooltip||!tooltip.hasWiki)return;setPlaying(false);',
  'const handleTooltipClick=useCallback(()=>{if(!tooltip||!tooltip.hasWiki)return;setPlaying(false);setTourPaused(true);',
  'pause tour on tip click'
);

fs.writeFileSync(file, s);
console.log('len', s.length);
