import fs from 'fs';
const file = 'src/RomanGlobe.jsx';
let s = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');

const tipPrelude =
  'if(!d.on){const applyTipPos=(x,y)=>{if(tipDomRef.current){tipDomRef.current.style.left=x+"px";tipDomRef.current.style.top=y+"px"}};const setTipIfNew=(key,payload)=>{if(tipKeyRef.current!==key){tipKeyRef.current=key;setTooltip(payload)}else{applyTipPos(payload.x,payload.y)}};raycaster.current.setFromCamera(mouse.current,cam);';

const animStart = 'if(!d.on){raycaster.current.setFromCamera(mouse.current,cam);';

const markerOld =
  'const _ti=trItem(DATA.find(x=>x.id===md.itemId),langRef.current),_tl=_ti.locs[md.locIdx]||md.data;setTooltip({x:(ndc.x*0.5+0.5)*rect.width+rect.left,y:(-ndc.y*0.5+0.5)*rect.height+rect.top,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})';
const markerNew =
  'const _ti=trItem(findItem(md.itemId),langRef.current);if(_ti){const _tl=_ti.locs[md.locIdx]||md.data;const _x=(ndc.x*0.5+0.5)*rect.width+rect.left,_y=(-ndc.y*0.5+0.5)*rect.height+rect.top;setTipIfNew("m:"+md.itemId+":"+md.locIdx,{x:_x,y:_y,name:_tl.n,info:_tl.info,type:"marker",hasWiki:!!_tl.wiki,wiki:_tl.wiki,img:_tl.img,imgAlt:_tl.imgAlt})}';

const pathOld =
  'const _ti2=trItem(DATA.find(x=>x.id===pd.itemId),langRef.current),_tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;setTooltip({x:(ndc2.x*0.5+0.5)*rect2.width+rect2.left,y:(-ndc2.y*0.5+0.5)*rect2.height+rect2.top,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})';
const pathNew =
  'const _ti2=trItem(findItem(pd.itemId),langRef.current);if(_ti2){const _tpLabel=_ti2.paths[pd.pathIdx]?.[4]||I18N[langRef.current].route;const _x=(ndc2.x*0.5+0.5)*rect2.width+rect2.left,_y=(-ndc2.y*0.5+0.5)*rect2.height+rect2.top;setTipIfNew("p:"+pd.itemId+":"+pd.pathIdx,{x:_x,y:_y,name:_tpLabel,info:_tpLabel,type:"path",hasWiki:true,itemId:pd.itemId,pathIdx:pd.pathIdx})}';

console.log({
  anim: s.includes(animStart),
  marker: s.includes(markerOld),
  path: s.includes(pathOld),
  already: s.includes('setTipIfNew'),
});

if (!s.includes('setTipIfNew')) {
  if (!s.includes(animStart) || !s.includes(markerOld) || !s.includes(pathOld)) process.exit(1);
  s = s.replace(animStart, tipPrelude);
  s = s.replace(markerOld, markerNew);
  s = s.replace(pathOld, pathNew);
  s = s.replace(
    'else if(!playRef.current&&!stickyTipRef.current)setTooltip(null)}}}\n      ren.render',
    'else if(!playRef.current&&!stickyTipRef.current){if(tipKeyRef.current!==null){tipKeyRef.current=null;setTooltip(null)}}}}\n      ren.render'
  );
}

fs.writeFileSync(file, s);
console.log('ok', s.includes('setTipIfNew'));
