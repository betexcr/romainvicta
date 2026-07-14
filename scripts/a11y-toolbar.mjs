import fs from 'fs';
let s = fs.readFileSync('src/RomanGlobe.jsx', 'utf8');

const mapBtn =
  '<button onClick={()=>setMapMode(m=>m==="3d"?"2d":"3d")} aria-label={mapMode==="3d"?t("mapMode2D"):t("mapMode3D")} title={mapMode==="3d"?t("mapMode2D"):t("mapMode3D")} style={{...sty.panel,padding:isMobile?"10px 14px":"5px 10px",cursor:"pointer",color:TH.gold,background:TH.panel,fontSize:11,letterSpacing:1,border:`1px solid ${TH.border}`,minWidth:isMobile?44:0,minHeight:isMobile?44:0}}>{mapMode==="3d"?"2D":"3D"}</button>';

const extraBtns =
  mapBtn +
  '<button onClick={()=>setAnimRoutes(v=>!v)} aria-label={t("animateRoutes")} title={t("animateRoutes")} aria-pressed={animRoutes} style={{...sty.panel,padding:isMobile?"10px 14px":"5px 10px",cursor:"pointer",color:TH.gold,background:animRoutes?TH.goldDim:TH.panel,fontSize:11,letterSpacing:1,border:`1px solid ${animRoutes?TH.gold:TH.border}`,minWidth:isMobile?44:0,minHeight:isMobile?44:0}}>⇄</button>' +
  '<button onClick={()=>setAutoTips(v=>!v)} aria-label={t("autoTips")} title={t("autoTips")} aria-pressed={autoTips} style={{...sty.panel,padding:isMobile?"10px 14px":"5px 10px",cursor:"pointer",color:TH.gold,background:autoTips?TH.goldDim:TH.panel,fontSize:11,letterSpacing:1,border:`1px solid ${autoTips?TH.gold:TH.border}`,minWidth:isMobile?44:0,minHeight:isMobile?44:0}}>💡</button>' +
  '<button onClick={()=>setShowStats(v=>!v)} aria-label={showStats?t("hideStats"):t("showStatsToggle")} title={showStats?t("hideStats"):t("showStatsToggle")} aria-pressed={showStats} style={{...sty.panel,padding:isMobile?"10px 14px":"5px 10px",cursor:"pointer",color:TH.gold,background:showStats?TH.goldDim:TH.panel,fontSize:11,letterSpacing:1,border:`1px solid ${showStats?TH.gold:TH.border}`,minWidth:isMobile?44:0,minHeight:isMobile?44:0}}>Σ</button>';

if (!s.includes('setAnimRoutes(v=>!v)')) {
  if (!s.includes(mapBtn)) {
    console.error('map button not found');
    process.exit(1);
  }
  s = s.replace(mapBtn, extraBtns);
  console.log('OK toolbar toggles');
}

s = s.replace(
  'aria-label={toolbarOpen?"Close toolbar":"Open toolbar"}',
  'aria-label={toolbarOpen?t("closeToolbar"):t("openToolbar")}'
);
console.log('OK toolbar i18n');

// Search results: div -> button
s = s.replace(
  'searchResults.map(r=>(<div key={r.id} onClick={()=>handleSearchSelect(r)} style={{padding:isMobile?"14px 16px":"10px 14px",cursor:"pointer",borderBottom:`1px solid ${TH.border}`,display:"flex",alignItems:"center",gap:10,transition:"background 0.15s",minHeight:isMobile?44:0}} onMouseEnter={e=>e.currentTarget.style.background=TH.glow} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>',
  'searchResults.map(r=>(<button type="button" key={r.id} onClick={()=>handleSearchSelect(r)} style={{padding:isMobile?"14px 16px":"10px 14px",cursor:"pointer",borderBottom:`1px solid ${TH.border}`,display:"flex",alignItems:"center",gap:10,transition:"background 0.15s",minHeight:isMobile?44:0,width:"100%",textAlign:"left",background:"transparent",fontFamily:"inherit",color:"inherit"}} onMouseEnter={e=>e.currentTarget.style.background=TH.glow} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>'
);
// Close search result buttons - find matching </div></div>) — fragile; look for pattern after search result content
s = s.replace(
  /searchResults\.map\(r=>\(<button type="button" key=\{r\.id\}[\s\S]*?<\/div><\/div>\)<\/div>\)/,
  (m) => m.replace(/<\/div><\/div>\)$/, '</div></button>)')
);
console.log('OK search buttons', s.includes('</button>)') && s.includes('handleSearchSelect'));

// Search input aria
s = s.replace(
  'placeholder={t("searchPlaceholder")} autoFocus',
  'placeholder={t("searchPlaceholder")} aria-label={t("search")} aria-controls="search-results" aria-expanded={searchQuery.length>=2} autoFocus'
);
s = s.replace(
  '{searchQuery.length>=2&&(<div style={{maxHeight:isMobile?"70vh":320,overflow:"auto",WebkitOverflowScrolling:"touch"}}>',
  '{searchQuery.length>=2&&(<div id="search-results" role="listbox" aria-label={t("search")} style={{maxHeight:isMobile?"70vh":320,overflow:"auto",WebkitOverflowScrolling:"touch"}}>'
);

// 2d canvas label
s = s.replace(
  'ref={map2dRef}',
  'ref={map2dRef} role="img" aria-label={t("globeLabel")}'
);

// showStats on mobile too (remove !isMobile gate) — show smaller panel
s = s.replace(
  '{showStats&&selData&&!isMobile&&(()=>{const st=interpStats(year);',
  '{showStats&&selData&&(()=>{const st=interpStats(year);'
);
s = s.replace(
  'return(<div style={{position:"absolute",bottom:110,right:12,zIndex:9,...sty.panel,background:TH.panelSolid,padding:"10px 14px",width:180,opacity:0.9}}>',
  'return(<div style={{position:"absolute",bottom:isMobile?150:110,right:12,zIndex:9,...sty.panel,background:TH.panelSolid,padding:"10px 14px",width:isMobile:150:180,opacity:0.9}}>'
);
// Fix typo isMobile:150 -> isMobile?150
s = s.replace('width:isMobile:150:180', 'width:isMobile?150:180');

// Loc rows -> button
s = s.replace(
  'return(<div key={i} onClick={()=>{const ty=trig.locs[i].ty;setYear(ty);setPlaying(false);if(l.wiki)setWikiPanel({name:l.n,info:l.info,wiki:l.wiki,img:l.img,imgAlt:l.imgAlt})}} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,opacity:vis?1:0.3,cursor:l.wiki?"pointer":"default"}}>',
  'return(<button type="button" key={i} onClick={()=>{const ty=trig.locs[i].ty;setYear(ty);setPlaying(false);if(l.wiki)setWikiPanel({name:l.n,info:l.info,wiki:l.wiki,img:l.img,imgAlt:l.imgAlt})}} style={{display:"flex",alignItems:"center",gap:7,marginBottom:5,opacity:vis?1:0.3,cursor:l.wiki?"pointer":"default",width:"100%",textAlign:"left",background:"transparent",border:"none",padding:0,fontFamily:"inherit",color:"inherit"}}>'
);
s = s.replace(
  '{l.wiki&&vis&&<span style={{fontSize:9,color:TH.gold,opacity:0.5,marginLeft:"auto"}}>→</span>}</div>)})}',
  '{l.wiki&&vis&&<span style={{fontSize:9,color:TH.gold,opacity:0.5,marginLeft:"auto"}}>→</span>}</button>)})}'
);

fs.writeFileSync('src/RomanGlobe.jsx', s);
console.log('done', s.length);
