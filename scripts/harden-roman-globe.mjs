/**
 * Apply M1–M4 hardening patches to src/RomanGlobe.jsx
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const file = path.join(root, 'src', 'RomanGlobe.jsx');
let s = fs.readFileSync(file, 'utf8');

function mustReplace(oldStr, newStr, label) {
  if (!s.includes(oldStr)) {
    console.warn('MISS:', label);
    return false;
  }
  s = s.replace(oldStr, newStr);
  console.log('OK:', label);
  return true;
}

// --- Imports: drop unused Component ---
mustReplace(
  `import React, { useState, useEffect, useRef, useCallback, useMemo, Component } from 'react';\nimport * as THREE from 'three';\n`,
  `import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';\nimport * as THREE from 'three';\nimport './data/bootstrap.js';\n`,
  'imports + bootstrap'
);

// --- M1: URL bootstrap / allowlists / year clamp ---
mustReplace(
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
  const safeTrItem=(item,ln)=>{if(!item)return null;const locs=Array.isArray(item.locs)?item.locs:[];const paths=Array.isArray(item.paths)?item.paths:[];const base={...item,locs,paths};if(ln!=="es"||typeof DATA_ES==="undefined"||!DATA_ES[item.id])return base;const es=DATA_ES[item.id];return{...base,name:es.name||item.name,desc:es.desc||item.desc,facts:es.facts||item.facts,imgAlt:es.imgAlt||item.imgAlt,locs:locs.map((l,i)=>({...l,n:es.locs?.[i]?.n||l.n,info:es.locs?.[i]?.info||l.info,wiki:es.locs?.[i]?.wiki||l.wiki,imgAlt:es.locs?.[i]?.imgAlt||l.imgAlt})),paths:paths.map((p,i)=>{const r=[...p];if(es.pathLabels?.[i])r[4]=es.pathLabels[i];if(es.pathWikis?.[i])r[5]=es.pathWikis[i];return r})}};
  const findItem=id=>id?DATA.find(d=>d.id===id)||null:null;
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
  const[reduceMotion]=useState(()=>typeof window!=="undefined"&&window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const[tourPaused,setTourPaused]=useState(false);
`,
  'boot allowlists clamp year'
);

// Replace old trItem with safeTrItem usage
mustReplace(
  `const TH=THEMES[theme];
  const t=key=>I18N[lang][key]||I18N.en[key]||key;`,
  `const TH=THEMES[theme]||THEMES.dark;
  const t=key=>(I18N[lang]||I18N.en)[key]||I18N.en[key]||key;`,
  'safe THEMES/I18N'
);

mustReplace(
  `const trItem=(item,ln)=>{if(ln!=="es"||typeof DATA_ES==="undefined"||!DATA_ES[item.id])return item;const es=DATA_ES[item.id];return{...item,name:es.name||item.name,desc:es.desc||item.desc,facts:es.facts||item.facts,imgAlt:es.imgAlt||item.imgAlt,locs:item.locs.map((l,i)=>({...l,n:es.locs?.[i]?.n||l.n,info:es.locs?.[i]?.info||l.info,wiki:es.locs?.[i]?.wiki||l.wiki,imgAlt:es.locs?.[i]?.imgAlt||l.imgAlt})),paths:item.paths.map((p,i)=>{const r=[...p];if(es.pathLabels?.[i])r[4]=es.pathLabels[i];if(es.pathWikis?.[i])r[5]=es.pathWikis[i];return r})}};`,
  `const trItem=(item,ln)=>safeTrItem(item,ln);`,
  'trItem -> safeTrItem'
);

mustReplace(
  `useEffect(()=>{try{localStorage.setItem("roma_theme",theme);document.body.style.background=THEMES[theme].bg}catch(e){}},[theme]);`,
  `useEffect(()=>{try{localStorage.setItem("roma_theme",theme);document.body.style.background=(THEMES[theme]||THEMES.dark).bg}catch(e){}},[theme]);
  const showToast=(msg)=>{setStatusToast(msg);clearTimeout(showToast._t);showToast._t=setTimeout(()=>setStatusToast(null),2200)};`,
  'theme safe + toast helper'
);

mustReplace(
  `const selData=useMemo(()=>{const d=sel?DATA.find(x=>x.id===sel):null;return d?trItem(d,lang):null},[sel,lang]);`,
  `const selData=useMemo(()=>{const d=findItem(sel);return d?trItem(d,lang):null},[sel,lang]);
  useEffect(()=>{if(!selData)return;setYear(y=>clampYear(y,selData))},[selData?.id]);`,
  'selData null-safe + year clamp on sel'
);

// tip position refs for RAF
mustReplace(
  `const animRoutesRef=useRef(true);
  const mapModeRef=useRef(mapMode);`,
  `const animRoutesRef=useRef(true);
  const tipKeyRef=useRef(null);
  const tipDomRef=useRef(null);
  const lerpTmp=useRef(new THREE.Vector3());
  const autoTipsRef=useRef(true);
  const reduceMotionRef=useRef(false);
  const mapModeRef=useRef(mapMode);`,
  'tip + lerp refs'
);

mustReplace(
  `yearRef.current=year;playRef.current=playing;speedRef.current=speed;langRef.current=lang;animRoutesRef.current=animRoutes;mapModeRef.current=mapMode;`,
  `yearRef.current=year;playRef.current=playing;speedRef.current=speed;langRef.current=lang;animRoutesRef.current=animRoutes;mapModeRef.current=mapMode;autoTipsRef.current=autoTips;reduceMotionRef.current=reduceMotion;`,
  'sync autoTips reduceMotion refs'
);

// Remove ancientbrain earth fallback (3d)
mustReplace(
  `ldr.load("earth.jpg",t=>{globe.material.map=t;globe.material.color=null;globe.material.needsUpdate=true},undefined,()=>{ldr.load("https://ancientbrain.com/uploads/threejs/earth_atmos_2048.jpg",t=>{globe.material.map=t;globe.material.color=null;globe.material.needsUpdate=true})});`,
  `ldr.load("/earth.jpg",t=>{globe.material.map=t;globe.material.color=null;globe.material.needsUpdate=true},undefined,()=>{console.warn("earth.jpg failed to load")});`,
  'remove ancientbrain 3d'
);

// Fix click handlers that use trItem(DATA.find...) without null check - use safe patterns
mustReplace(
  `const _ci=trItem(DATA.find(x=>x.id===md.itemId),langRef.current),_cl=_ci.locs[md.locIdx]||md.data;`,
  `const _ci=trItem(findItem(md.itemId),langRef.current);if(!_ci)return;const _cl=_ci.locs[md.locIdx]||md.data;`,
  'click marker null guard'
);

mustReplace(
  `const _ti2=trItem(DATA.find(x=>x.id===pd.itemId),langRef.current),_tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;setTooltip({x:(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y:(-ndc2.y*0.5+0.5)*rect2.height+rect2.top,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}}else{const th2=raycaster.current.intersectObjects(territoryRef.current.map(t=>t.mesh),false);if(th2.length>0){const td=territoryRef.current.find(t=>t.mesh===th2[0].object);if(td?.data?.n){stickyTipRef.current=true;const _tr=trTerr(td.data,langRef.current);const pt3=th2[0].point.clone(),ndc3=pt3.project(cam),rect3=ren.domElement.getBoundingClientRect();setTooltip({x:(ndc3.x*0.5+0.5)*rect3.width+rect3.left,y:(-ndc3.y*0.5+0.5)*rect3.height+rect3.top,name:_tr.n,info:_tr.info,type:"territory",hasWiki:true,terrData:td.data})}}}}}clickRef.current=false;d.on=false};`,
  `const _ti2=trItem(findItem(pd.itemId),langRef.current);if(!_ti2)return;const _tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;setTooltip({x:(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y:(-ndc2.y*0.5+0.5)*rect2.height+rect2.top,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}}else{const th2=raycaster.current.intersectObjects(territoryRef.current.map(t=>t.mesh),false);if(th2.length>0){const td=territoryRef.current.find(t=>t.mesh===th2[0].object);if(td?.data?.n){stickyTipRef.current=true;const _tr=trTerr(td.data,langRef.current);const pt3=th2[0].point.clone(),ndc3=pt3.project(cam),rect3=ren.domElement.getBoundingClientRect();setTooltip({x:(ndc3.x*0.5+0.5)*rect3.width+rect3.left,y:(-ndc3.y*0.5+0.5)*rect3.height+rect3.top,name:_tr.n,info:_tr.info,type:"territory",hasWiki:true,terrData:td.data})}}}}}clickRef.current=false;d.on=false};`,
  'click path null guard'
);

// RAF: vector reuse + tip identity gate + reduced motion glow
mustReplace(
  `const p=new THREE.Vector3().lerpVectors(pts[idx],pts[Math.min(idx+1,pts.length-1)],frac);dm.position.copy(p)})});
      if(!d.on){raycaster.current.setFromCamera(mouse.current,cam);const hits=raycaster.current.intersectObjects(markersRef.current.filter(m=>m.mesh.visible).map(m=>m.mesh),false);if(hits.length>0){const md=markersRef.current.find(m=>m.mesh===hits[0].object);if(md){const v=md.mesh.position.clone();v.applyMatrix4(grp.matrixWorld);const ndc=v.project(cam),rect=ren.domElement.getBoundingClientRect();const _ti=trItem(DATA.find(x=>x.id===md.itemId),langRef.current),_tl=_ti.locs[md.locIdx]||md.data;setTooltip({x:(ndc.x*0.5+0.5)*rect.width+rect.left,y:(-ndc.y*0.5+0.5)*rect.height+rect.top,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})}}else{const ph=raycaster.current.intersectObjects(pathsRef.current.filter(p=>p.hitMesh.visible).map(p=>p.hitMesh),false);if(ph.length>0){const pd=pathsRef.current.find(p=>p.hitMesh===ph[0].object);if(pd){const pt2=ph[0].point.clone(),ndc2=pt2.project(cam),rect2=ren.domElement.getBoundingClientRect();const _ti2=trItem(DATA.find(x=>x.id===pd.itemId),langRef.current),_tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;setTooltip({x:(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y:(-ndc2.y*0.5+0.5)*rect2.height+rect2.top,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}}else{const th2=raycaster.current.intersectObjects(territoryRef.current.map(t=>t.mesh),false);if(th2.length>0){const td=territoryRef.current.find(t=>t.mesh===th2[0].object);if(td?.data?.n){const _tr=trTerr(td.data,langRef.current);const pt3=th2[0].point.clone(),ndc3=pt3.project(cam),rect3=ren.domElement.getBoundingClientRect();setTooltip({x:(ndc3.x*0.5+0.5)*rect3.width+rect3.left,y:(-ndc3.y*0.5+0.5)*rect3.height+rect3.top,name:_tr.n,info:_tr.info,type:"territory",hasWiki:true,terrData:td.data})}}else if(!playRef.current&&!stickyTipRef.current)setTooltip(null)}}}`,
  `lerpTmp.current.lerpVectors(pts[idx],pts[Math.min(idx+1,pts.length-1)],frac);dm.position.copy(lerpTmp.current)})});
      if(!d.on){raycaster.current.setFromCamera(mouse.current,cam);const hits=raycaster.current.intersectObjects(markersRef.current.filter(m=>m.mesh.visible).map(m=>m.mesh),false);const applyTipPos=(x,y)=>{if(tipDomRef.current){tipDomRef.current.style.left=x+"px";tipDomRef.current.style.top=y+"px"}};const setTipIfNew=(key,payload)=>{const x=payload.x,y=payload.y;if(tipKeyRef.current!==key){tipKeyRef.current=key;setTooltip(payload)}else{applyTipPos(x,y)}};if(hits.length>0){const md=markersRef.current.find(m=>m.mesh===hits[0].object);if(md){const v=md.mesh.position.clone();v.applyMatrix4(grp.matrixWorld);const ndc=v.project(cam),rect=ren.domElement.getBoundingClientRect();const _ti=trItem(findItem(md.itemId),langRef.current);if(!_ti)return;const _tl=_ti.locs[md.locIdx]||md.data;const x=(ndc.x*0.5+0.5)*rect.width+rect.left,y=(-ndc.y*0.5+0.5)*rect.height+rect.top;setTipIfNew("m:"+md.itemId+":"+md.locIdx,{x,y,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})}}else{const ph=raycaster.current.intersectObjects(pathsRef.current.filter(p=>p.hitMesh.visible).map(p=>p.hitMesh),false);if(ph.length>0){const pd=pathsRef.current.find(p=>p.hitMesh===ph[0].object);if(pd){const pt2=ph[0].point.clone(),ndc2=pt2.project(cam),rect2=ren.domElement.getBoundingClientRect();const _ti2=trItem(findItem(pd.itemId),langRef.current);if(!_ti2)return;const _tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;const x=(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y=(-ndc2.y*0.5+0.5)*rect2.height+rect2.top;setTipIfNew("p:"+pd.itemId+":"+pd.pathIdx,{x,y,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}}else{const th2=raycaster.current.intersectObjects(territoryRef.current.map(t=>t.mesh),false);if(th2.length>0){const td=territoryRef.current.find(t=>t.mesh===th2[0].object);if(td?.data?.n){const _tr=trTerr(td.data,langRef.current);const pt3=th2[0].point.clone(),ndc3=pt3.project(cam),rect3=ren.domElement.getBoundingClientRect();const x=(ndc3.x*0.5+0.5)*rect3.width+rect3.left,y=(-ndc3.y*0.5+0.5)*rect3.height+rect3.top;setTipIfNew("t:"+_tr.n,{x,y,name:_tr.n,info:_tr.info,type:"territory",hasWiki:true,terrData:td.data})}}else if(!playRef.current&&!stickyTipRef.current){if(tipKeyRef.current!==null){tipKeyRef.current=null;setTooltip(null)}}}}}`,
  'RAF tip gate + vector reuse'
);

// Glow respects reduced motion
mustReplace(
  `mg.children.forEach(m=>{if(m.userData?.isGlow){const s=1+0.35*Math.sin(Date.now()*0.003+m.userData.idx*1.5);m.scale.set(s,s,s)}});`,
  `if(!reduceMotionRef.current)mg.children.forEach(m=>{if(m.userData?.isGlow){const s=1+0.35*Math.sin(Date.now()*0.003+m.userData.idx*1.5);m.scale.set(s,s,s)}});`,
  'reduced motion glow'
);

mustReplace(
  `routeDotsRef.current.forEach(rd=>{if(!rd.path.arrowGrp.visible||!animRoutesRef.current){`,
  `routeDotsRef.current.forEach(rd=>{if(!rd.path.arrowGrp.visible||!animRoutesRef.current||reduceMotionRef.current){`,
  'reduced motion route dots'
);

// Full Three.js cleanup
mustReplace(
  `return()=>{cancelAnimationFrame(af);window.removeEventListener("resize",onR);window.removeEventListener("mousemove",onM);window.removeEventListener("mouseup",onU);ren.domElement.removeEventListener("gesturestart",onGS);ren.domElement.removeEventListener("gesturechange",onGC);ren.domElement.removeEventListener("gestureend",onGS);document.removeEventListener("gesturestart",onGS);document.removeEventListener("gesturechange",onGC);el.removeChild(ren.domElement);ren.dispose()};`,
  `return()=>{cancelAnimationFrame(af);window.removeEventListener("resize",onR);window.removeEventListener("mousemove",onM);window.removeEventListener("mouseup",onU);ren.domElement.removeEventListener("mousedown",onD);ren.domElement.removeEventListener("wheel",onW);ren.domElement.removeEventListener("touchstart",onTD);ren.domElement.removeEventListener("touchmove",onTM);ren.domElement.removeEventListener("touchend",onTE);ren.domElement.removeEventListener("gesturestart",onGS);ren.domElement.removeEventListener("gesturechange",onGC);ren.domElement.removeEventListener("gestureend",onGS);document.removeEventListener("gesturestart",onGS);document.removeEventListener("gesturechange",onGC);const disposeObj=o=>{if(!o)return;if(o.geometry)o.geometry.dispose();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}if(o.children)[...o.children].forEach(disposeObj)};disposeObj(sc);if(el.contains(ren.domElement))el.removeChild(ren.domElement);ren.dispose();three.current={}};`,
  'three cleanup'
);

// 2d earth fallback remove
mustReplace(
  `useEffect(()=>{if(!map2dImgRef.current){const img=new Image();img.crossOrigin="anonymous";img.src="earth.jpg";img.onload=()=>{map2dImgRef.current=img};img.onerror=()=>{const img2=new Image();img2.crossOrigin="anonymous";img2.src="https://ancientbrain.com/uploads/threejs/earth_atmos_2048.jpg";img2.onload=()=>{map2dImgRef.current=img2}}}},[]);`,
  `useEffect(()=>{if(!map2dImgRef.current){const img=new Image();img.crossOrigin="anonymous";img.src="/earth.jpg";img.onload=()=>{map2dImgRef.current=img};img.onerror=()=>{console.warn("earth.jpg failed for 2D map")}}},[]);`,
  'remove ancientbrain 2d'
);

// genOverlay throttle/cache
mustReplace(
  `useEffect(()=>{const t=three.current;if(!t.overlay)return;const nt=genOverlay(year);t.overlay.material.map=nt;t.overlay.material.needsUpdate=true;if(t.overlayTex)t.overlayTex.dispose();t.overlayTex=nt;
    if(t.tg){while(t.tg.children.length)t.tg.remove(t.tg.children[0]);territoryRef.current=[];
      getT(year).forEach(r=>{const segLa=6,segLo=8,verts=[],indices=[];for(let i=0;i<=segLa;i++)for(let j=0;j<=segLo;j++){const la=r.la[0]+(r.la[1]-r.la[0])*i/segLa,lo=r.lo[0]+(r.lo[1]-r.lo[0])*j/segLo,p=ll3(la,lo,2.009);verts.push(p.x,p.y,p.z)}for(let i=0;i<segLa;i++)for(let j=0;j<segLo;j++){const a=i*(segLo+1)+j,b=a+segLo+1;indices.push(a,b,a+1,b,b+1,a+1)}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xC9A84C,transparent:true,opacity:0.001,side:THREE.DoubleSide}));t.tg.add(mesh);territoryRef.current.push({mesh,data:r})})}
  },[year]);`,
  `const overlayCacheRef=useRef(new Map());
  useEffect(()=>{const t=three.current;if(!t.overlay)return;const bucket=Math.round(year/5)*5;let nt=overlayCacheRef.current.get(bucket);if(!nt){nt=genOverlay(bucket);overlayCacheRef.current.set(bucket,nt);if(overlayCacheRef.current.size>24){const first=overlayCacheRef.current.keys().next().value;const old=overlayCacheRef.current.get(first);overlayCacheRef.current.delete(first);if(old&&old!==t.overlayTex)old.dispose()}}if(t.overlay.material.map!==nt){t.overlay.material.map=nt;t.overlay.material.needsUpdate=true;t.overlayTex=nt}
    if(t.tg){while(t.tg.children.length){const ch=t.tg.children[0];t.tg.remove(ch);if(ch.geometry)ch.geometry.dispose();if(ch.material)ch.material.dispose()}territoryRef.current=[];
      getT(year).forEach(r=>{const segLa=6,segLo=8,verts=[],indices=[];for(let i=0;i<=segLa;i++)for(let j=0;j<=segLo;j++){const la=r.la[0]+(r.la[1]-r.la[0])*i/segLa,lo=r.lo[0]+(r.lo[1]-r.lo[0])*j/segLo,p=ll3(la,lo,2.009);verts.push(p.x,p.y,p.z)}for(let i=0;i<segLa;i++)for(let j=0;j<segLo;j++){const a=i*(segLo+1)+j,b=a+segLo+1;indices.push(a,b,a+1,b,b+1,a+1)}const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingSphere();const mesh=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xC9A84C,transparent:true,opacity:0.001,side:THREE.DoubleSide}));t.tg.add(mesh);territoryRef.current.push({mesh,data:r})})}
  },[year]);`,
  'overlay cache + dispose territories'
);

// auto tooltip null guards
mustReplace(
  `const showAutoTooltip=useCallback((loc,itemId,locIdx)=>{let _n=loc.n,_inf=loc.info,_ia=loc.imgAlt,_hw=!!loc.wiki,_wk=loc.wiki;if(itemId!==undefined){const _ai=trItem(DATA.find(x=>x.id===itemId),langRef.current),_al=_ai.locs[locIdx];if(_al){_n=_al.n;_inf=_al.info;_ia=_al.imgAlt;_hw=!!_al.wiki;_wk=_al.wiki}}`,
  `const showAutoTooltip=useCallback((loc,itemId,locIdx)=>{if(!autoTipsRef.current)return;let _n=loc.n,_inf=loc.info,_ia=loc.imgAlt,_hw=!!loc.wiki,_wk=loc.wiki;if(itemId!==undefined){const _ai=trItem(findItem(itemId),langRef.current);const _al=_ai?.locs?.[locIdx];if(_al){_n=_al.n;_inf=_al.info;_ia=_al.imgAlt;_hw=!!_al.wiki;_wk=_al.wiki}}`,
  'auto tip null + toggle'
);

mustReplace(
  `const showAutoPathTooltip=useCallback((pa,itemId,pathIdx)=>{let _pn=pa[4]||I18N[langRef.current].route;if(itemId!==undefined){const _pi=trItem(DATA.find(x=>x.id===itemId),langRef.current);_pn=_pi.paths[pathIdx]?.[4]||I18N[langRef.current].route}`,
  `const showAutoPathTooltip=useCallback((pa,itemId,pathIdx)=>{if(!autoTipsRef.current)return;let _pn=pa[4]||I18N[langRef.current].route;if(itemId!==undefined){const _pi=trItem(findItem(itemId),langRef.current);_pn=_pi?.paths?.[pathIdx]?.[4]||I18N[langRef.current].route}`,
  'auto path tip null'
);

// marker rebuild dispose
mustReplace(
  `useEffect(()=>{const t=three.current;if(!t.mg)return;while(t.mg.children.length)t.mg.remove(t.mg.children[0]);while(t.pg.children.length)t.pg.remove(t.pg.children[0]);markersRef.current=[];pathsRef.current=[];routeDotsRef.current=[];lastRevealRef.current=-1;lastPathRevealRef.current=-1;const item=DATA.find(d=>d.id===sel);if(!item)return;const trig=getTriggerYears(item);`,
  `useEffect(()=>{const t=three.current;if(!t.mg)return;const disposeGrp=g=>{while(g.children.length){const ch=g.children[0];g.remove(ch);if(ch.geometry)ch.geometry.dispose();if(ch.material){const ms=Array.isArray(ch.material)?ch.material:[ch.material];ms.forEach(m=>{if(m.map)m.map.dispose();m.dispose()})}if(ch.children)disposeGrp(ch)}};disposeGrp(t.mg);disposeGrp(t.pg);markersRef.current=[];pathsRef.current=[];routeDotsRef.current=[];lastRevealRef.current=-1;lastPathRevealRef.current=-1;const item=findItem(sel);if(!item)return;const trig=getTriggerYears(item);`,
  'dispose markers on sel change'
);

// Share feedback
mustReplace(
  `const handleShare=()=>{const url=window.location.href;if(navigator.share){navigator.share({title:"Imperium Romanum",text:selData?dName(selData):"",url}).catch(()=>{})}else{navigator.clipboard.writeText(url).then(()=>{setShareToast(true);setTimeout(()=>setShareToast(false),2000)}).catch(()=>{})}};`,
  `const handleShare=()=>{const url=window.location.href;const done=()=>{setShareToast(true);setTimeout(()=>setShareToast(false),2000)};if(navigator.share){navigator.share({title:"Imperium Romanum",text:selData?dName(selData):"",url}).then(done).catch(err=>{if(err&&err.name==="AbortError")return;navigator.clipboard.writeText(url).then(done).catch(()=>showToast(t("copyLink")||"Copy failed"))})}else{navigator.clipboard.writeText(url).then(done).catch(()=>showToast("Copy failed"))}};`,
  'share feedback'
);

// audio failure feedback
mustReplace(
  `a.src=tracks[next];a.play().catch(()=>{});},[]);`,
  `a.src=tracks[next];a.play().catch(()=>{showToast(t("soundOff")||"Audio blocked")});},[t]);`,
  'audio feedback'
);

// Tour pause on interaction + don't force sidebar every advance unless mobile needs it
mustReplace(
  `const startTour=(tour)=>{setTourActive(tour);setTourStep(0);setPlaying(false);setSideOpen(true);const step=tour.steps[0];if(step){setCat(DATA.find(d=>d.id===step.eventId)?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};
  const advanceTour=(dir)=>{if(!tourActive||typeof tourActive==="string")return;const ns=tourStep+dir;if(ns<0)return;if(ns>=tourActive.steps.length){setTourActive(null);return}setTourStep(ns);setSideOpen(true);const step=tourActive.steps[ns];if(step){setCat(DATA.find(d=>d.id===step.eventId)?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};
  useEffect(()=>{if(!tourActive||typeof tourActive==="string")return;clearTimeout(tourTimerRef.current);const step=tourActive.steps[tourStep];if(!step)return;tourTimerRef.current=setTimeout(()=>advanceTour(1),step.durationMs||6000);return()=>clearTimeout(tourTimerRef.current)},[tourActive,tourStep]);`,
  `const startTour=(tour)=>{setTourActive(tour);setTourStep(0);setTourPaused(false);setPlaying(false);setSideOpen(true);const step=tour.steps[0];if(step){const it=findItem(step.eventId);setCat(it?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};
  const advanceTour=(dir)=>{if(!tourActive||typeof tourActive==="string")return;const ns=tourStep+dir;if(ns<0)return;if(ns>=tourActive.steps.length){setTourActive(null);return}setTourStep(ns);const step=tourActive.steps[ns];if(step){const it=findItem(step.eventId);setCat(it?.cat||"expansion");setSel(step.eventId);setYear(step.year)}};
  useEffect(()=>{if(!tourActive||typeof tourActive==="string"||tourPaused)return;clearTimeout(tourTimerRef.current);const step=tourActive.steps[tourStep];if(!step)return;tourTimerRef.current=setTimeout(()=>advanceTour(1),step.durationMs||6000);return()=>clearTimeout(tourTimerRef.current)},[tourActive,tourStep,tourPaused]);`,
  'tour pause + no force sidebar'
);

// Category change: keep selection if still in cat, else clear to empty with clear UI
mustReplace(
  `onClick={()=>{setCat(c.id);setSel(null);setPlaying(false);`,
  `onClick={()=>{setCat(c.id);setPlaying(false);setSel(prev=>{const cur=findItem(prev);return cur&&cur.cat===c.id?prev:null});`,
  'category keep selection'
);

fs.writeFileSync(file, s);
console.log('Patched RomanGlobe.jsx, length', s.length);
