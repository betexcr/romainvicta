import fs from 'fs';

const file = 'src/RomanGlobe.jsx';
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

function rep(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.warn('MISS', label);
    return false;
  }
  s = s.replace(oldStr, newStr);
  console.log('OK', label);
  return true;
}

rep(
  `function RomanGlobe(){
  const _qs=(()=>{try{return Object.fromEntries(new URLSearchParams(window.location.search))}catch(e){return{}}})();
  const _qEvt=_qs.event&&DATA.find(d=>d.id===_qs.event)?_qs.event:null;
  const _qCat=_qEvt?DATA.find(d=>d.id===_qEvt).cat:null;
  const _qYear=_qs.year!=null&&!isNaN(+_qs.year)?+_qs.year:null;
  const _defEvt="cam2";
  const _initEvt=_qEvt||_defEvt;
  const _initItem=DATA.find(d=>d.id===_initEvt);
  const[cat,setCat]=useState(_qCat||_initItem.cat);const[sel,setSel]=useState(_initEvt);const[year,setYear]=useState(_qYear!=null?_qYear:_initItem.y1);const[hover,setHover]=useState(null);const[tooltip,setTooltip]=useState(null);const[sideOpen,setSideOpen]=useState(()=>window.innerWidth>=768);const[playing,setPlaying]=useState(false);const[speed,setSpeed]=useState(1);const[wikiPanel,setWikiPanel]=useState(null);const[lightbox,setLightbox]=useState(null);const[eventWiki,setEventWiki]=useState(null);
  const[lang,setLang]=useState(()=>{if(_qs.lang==="es"||_qs.lang==="en")return _qs.lang;try{const saved=localStorage.getItem("roma_lang");if(saved)return saved}catch(e){}const bl=(navigator.language||navigator.userLanguage||"en").toLowerCase();return bl.startsWith("es")?"es":"en"});
  const[theme,setTheme]=useState(()=>{try{const saved=localStorage.getItem("roma_theme");if(saved)return saved}catch(e){}return window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"});
`,
  `function RomanGlobe(){
  const VALID_LANGS=new Set(["en","es"]);
  const VALID_THEMES=new Set(["dark","light"]);
  const clampYear=(y,item)=>{const n=Number(y);if(!Number.isFinite(n))return item?item.y1:-753;const lo=item?Math.min(item.y1,item.y2):-753;const hi=item?Math.max(item.y1,item.y2):476;return Math.max(lo,Math.min(hi,Math.round(n)))};
  const findItem=id=>id?(DATA.find(d=>d.id===id)||null):null;
  const safeTrItem=(item,ln)=>{if(!item)return null;const locs=Array.isArray(item.locs)?item.locs:[];const paths=Array.isArray(item.paths)?item.paths:[];const base={...item,locs,paths};if(ln!=="es"||typeof DATA_ES==="undefined"||!DATA_ES[item.id])return base;const es=DATA_ES[item.id];return{...base,name:es.name||item.name,desc:es.desc||item.desc,facts:es.facts||item.facts,imgAlt:es.imgAlt||item.imgAlt,locs:locs.map((l,i)=>({...l,n:es.locs?.[i]?.n||l.n,info:es.locs?.[i]?.info||l.info,wiki:es.locs?.[i]?.wiki||l.wiki,imgAlt:es.locs?.[i]?.imgAlt||l.imgAlt})),paths:paths.map((p,i)=>{const r=[...p];if(es.pathLabels?.[i])r[4]=es.pathLabels[i];if(es.pathWikis?.[i])r[5]=es.pathWikis[i];return r})}};
  const _qs=(()=>{try{return Object.fromEntries(new URLSearchParams(window.location.search))}catch(e){return{}}})();
  const _qEvt=_qs.event&&findItem(_qs.event)?_qs.event:null;
  const _qCat=_qEvt?findItem(_qEvt)?.cat:null;
  const _defEvt="cam2";
  const _initEvt=_qEvt||(findItem(_defEvt)?_defEvt:DATA[0]?.id);
  const _initItem=findItem(_initEvt)||DATA[0];
  const _rawYear=_qs.year!=null&&_qs.year!==""&&Number.isFinite(+_qs.year)?+_qs.year:null;
  const _initYear=clampYear(_rawYear!=null?_rawYear:_initItem.y1,_initItem);
  const[cat,setCat]=useState(_qCat||_initItem.cat);const[sel,setSel]=useState(_initEvt);const[year,setYear]=useState(_initYear);const[hover,setHover]=useState(null);const[tooltip,setTooltip]=useState(null);const[sideOpen,setSideOpen]=useState(()=>window.innerWidth>=768);const[playing,setPlaying]=useState(false);const[speed,setSpeed]=useState(1);const[wikiPanel,setWikiPanel]=useState(null);const[lightbox,setLightbox]=useState(null);const[eventWiki,setEventWiki]=useState(null);
  const[lang,setLang]=useState(()=>{if(VALID_LANGS.has(_qs.lang))return _qs.lang;try{const saved=localStorage.getItem("roma_lang");if(VALID_LANGS.has(saved))return saved}catch(e){}const bl=(navigator.language||navigator.userLanguage||"en").toLowerCase();return bl.startsWith("es")?"es":"en"});
  const[theme,setTheme]=useState(()=>{try{const saved=localStorage.getItem("roma_theme");if(VALID_THEMES.has(saved))return saved}catch(e){}return window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"});
  const[statusToast,setStatusToast]=useState(null);
  const[autoTips,setAutoTips]=useState(true);
  const[reduceMotion]=useState(()=>typeof window!=="undefined"&&!!window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const[tourPaused,setTourPaused]=useState(false);
`,
  'boot'
);

rep(
  'const TH=THEMES[theme];\n  const t=key=>I18N[lang][key]||I18N.en[key]||key;',
  'const TH=THEMES[theme]||THEMES.dark;\n  const t=key=>(I18N[lang]||I18N.en)[key]||I18N.en[key]||key;',
  'theme/lang safe'
);

rep(
  'const animRoutesRef=useRef(true);\n  const mapModeRef=useRef(mapMode);',
  'const animRoutesRef=useRef(true);\n  const tipKeyRef=useRef(null);\n  const tipDomRef=useRef(null);\n  const lerpTmp=useRef(new THREE.Vector3());\n  const autoTipsRef=useRef(true);\n  const reduceMotionRef=useRef(false);\n  const overlayCacheRef=useRef(new Map());\n  const mapModeRef=useRef(mapMode);',
  'refs'
);

rep(
  'const p=new THREE.Vector3().lerpVectors(pts[idx],pts[Math.min(idx+1,pts.length-1)],frac);dm.position.copy(p)})});',
  'lerpTmp.current.lerpVectors(pts[idx],pts[Math.min(idx+1,pts.length-1)],frac);dm.position.copy(lerpTmp.current)})});',
  'lerp reuse'
);

rep(
  'useEffect(()=>{const t=three.current;if(!t.overlay)return;const nt=genOverlay(year);t.overlay.material.map=nt;t.overlay.material.needsUpdate=true;if(t.overlayTex)t.overlayTex.dispose();t.overlayTex=nt;\n    if(t.tg){while(t.tg.children.length)t.tg.remove(t.tg.children[0]);territoryRef.current=[];',
  'useEffect(()=>{const t=three.current;if(!t.overlay)return;const bucket=Math.round(year/5)*5;let nt=overlayCacheRef.current.get(bucket);if(!nt){nt=genOverlay(bucket);overlayCacheRef.current.set(bucket,nt);if(overlayCacheRef.current.size>24){const first=overlayCacheRef.current.keys().next().value;const old=overlayCacheRef.current.get(first);overlayCacheRef.current.delete(first);if(old&&old!==t.overlayTex)old.dispose()}}if(t.overlay.material.map!==nt){t.overlay.material.map=nt;t.overlay.material.needsUpdate=true;t.overlayTex=nt}\n    if(t.tg){while(t.tg.children.length){const ch=t.tg.children[0];t.tg.remove(ch);if(ch.geometry)ch.geometry.dispose();if(ch.material)ch.material.dispose()}territoryRef.current=[];',
  'overlay cache'
);

rep(
  'const startTour=(tour)=>{setTourActive(tour);setTourStep(0);setPlaying(false);setSideOpen(true);const step=tour.steps[0];if(step){setCat(DATA.find(d=>d.id===step.eventId)?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};\n  const advanceTour=(dir)=>{if(!tourActive||typeof tourActive==="string")return;const ns=tourStep+dir;if(ns<0)return;if(ns>=tourActive.steps.length){setTourActive(null);return}setTourStep(ns);setSideOpen(true);const step=tourActive.steps[ns];if(step){setCat(DATA.find(d=>d.id===step.eventId)?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};\n  useEffect(()=>{if(!tourActive||typeof tourActive==="string")return;clearTimeout(tourTimerRef.current);const step=tourActive.steps[tourStep];if(!step)return;tourTimerRef.current=setTimeout(()=>advanceTour(1),step.durationMs||6000);return()=>clearTimeout(tourTimerRef.current)},[tourActive,tourStep]);',
  'const startTour=(tour)=>{setTourActive(tour);setTourStep(0);setTourPaused(false);setPlaying(false);setSideOpen(true);const step=tour.steps[0];if(step){const it=findItem(step.eventId);setCat(it?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};\n  const advanceTour=(dir)=>{if(!tourActive||typeof tourActive==="string")return;const ns=tourStep+dir;if(ns<0)return;if(ns>=tourActive.steps.length){setTourActive(null);return}setTourStep(ns);const step=tourActive.steps[ns];if(step){const it=findItem(step.eventId);setCat(it?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};\n  useEffect(()=>{if(!tourActive||typeof tourActive==="string"||tourPaused)return;clearTimeout(tourTimerRef.current);const step=tourActive.steps[tourStep];if(!step)return;tourTimerRef.current=setTimeout(()=>advanceTour(1),step.durationMs||6000);return()=>clearTimeout(tourTimerRef.current)},[tourActive,tourStep,tourPaused]);',
  'tour'
);

// Tip gate in anim loop only
if (!s.includes('setTipIfNew')) {
  const markerHover =
    'const _ti=trItem(findItem(md.itemId),langRef.current),_tl=_ti.locs[md.locIdx]||md.data;setTooltip({x:(ndc.x*0.5+0.5)*rect.width+rect.left,y:(-ndc.y*0.5+0.5)*rect.height+rect.top,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})';
  const markerHoverNew =
    'const _ti=trItem(findItem(md.itemId),langRef.current);if(_ti){const _tl=_ti.locs[md.locIdx]||md.data;const _x=(ndc.x*0.5+0.5)*rect.width+rect.left,_y=(-ndc.y*0.5+0.5)*rect.height+rect.top;setTipIfNew("m:"+md.itemId+":"+md.locIdx,{x:_x,y:_y,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})}';
  const pathHover =
    'const _ti2=trItem(findItem(pd.itemId),langRef.current),_tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;setTooltip({x:(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y:(-ndc2.y*0.5+0.5)*rect2.height+rect2.top,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})';
  const pathHoverNew =
    'const _ti2=trItem(findItem(pd.itemId),langRef.current);if(_ti2){const _tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;const _x=(ndc2.x*0.5+0.5)*rect2.width+rect2.left,_y=(-ndc2.y*0.5+0.5)*rect2.height+rect2.top;setTipIfNew("p:"+pd.itemId+":"+pd.pathIdx,{x:_x,y:_y,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}';

  const animStart = 'if(!d.on){raycaster.current.setFromCamera(mouse.current,cam);';
  const tipPrelude =
    'if(!d.on){const applyTipPos=(x,y)=>{if(tipDomRef.current){tipDomRef.current.style.left=x+"px";tipDomRef.current.style.top=y+"px"}};const setTipIfNew=(key,payload)=>{if(tipKeyRef.current!==key){tipKeyRef.current=key;setTooltip(payload)}else{applyTipPos(payload.x,payload.y)}};raycaster.current.setFromCamera(mouse.current,cam);';

  if (s.includes(animStart) && s.includes(markerHover)) {
    s = s.replace(animStart, tipPrelude);
    s = s.replace(markerHover, markerHoverNew);
    s = s.replace(pathHover, pathHoverNew);
    // territory hover in anim only — first occurrence after tip prelude is anim; click also has similar
    // Replace clear tip
    s = s.replace(
      'else if(!playRef.current&&!stickyTipRef.current)setTooltip(null)}}}\n      ren.render',
      'else if(!playRef.current&&!stickyTipRef.current){if(tipKeyRef.current!==null){tipKeyRef.current=null;setTooltip(null)}}}}\n      ren.render'
    );
    console.log('OK tip gate');
  } else {
    console.warn('MISS tip gate pieces', {
      anim: s.includes(animStart),
      marker: s.includes(markerHover),
      path: s.includes(pathHover),
    });
  }
}

fs.writeFileSync(file, s, 'utf8');
console.log('done', s.length);
