import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import * as THREE from "three";
import {
  DATA,
  getTriggerYears,
  genOverlay,
  getT,
  ERAS,
  interpStats,
  fmtNum,
  trTerr,
  mkArc,
  mkArrow,
} from "./data/data.js";
import { DATA_ES } from "./data/data_es.js";
import { DATA_WIKI } from "./data/data_wiki.js";
import { TOURS } from "./data/data_tours.js";
import {
  THEMES,
  I18N,
  CAT_I18N_KEYS,
  ERA_I18N_KEYS,
  ll3,
  yrL,
  CATS,
} from "./data/app-core.js";
import {
  clampYear,
  resolveLang,
  resolveTheme,
  resolveEventId,
} from "./lib/hardening.js";
import {
  findItem as findItemInData,
  translateItem,
  createTranslator,
  localizedName,
  localizedDesc,
  localizedFacts,
  getWikiArticle,
  renderBoldText,
} from "./lib/i18n.js";
import { makeThemeStyles } from "./lib/styles.js";
import { generateQuizQuestions, isQuizAnswerCorrect } from "./lib/quiz.js";
import { createMapProjection, projectMapLatLng } from "./lib/mapProjection.js";
import {
  loadImageWithRetry,
  loadTextureWithRetry,
} from "./lib/assetRetry.js";
import { useToast } from "./hooks/useToast.js";
import { useSheetDrag } from "./hooks/useSheetDrag.js";
import { useAmbientAudio } from "./hooks/useAmbientAudio.js";
import { useGuidedTour } from "./hooks/useGuidedTour.js";
import { useEventSearch } from "./hooks/useEventSearch.js";
import ToastBanner from "./components/ToastBanner.jsx";
import ModalShell from "./components/ModalShell.jsx";
function RomanGlobe() {
  const findItem = (id) => findItemInData(DATA, id);
  const safeTrItem = (item, ln) => translateItem(item, ln, DATA_ES);
  const trItem = (item, ln) => safeTrItem(item, ln);
  const _qs = (() => {
    try {
      return Object.fromEntries(new URLSearchParams(window.location.search));
    } catch (e) {
      return {};
    }
  })();
  const _initEvt = resolveEventId(_qs.event, DATA, "cam2");
  const _initItem = findItem(_initEvt) || DATA[0];
  const _urlEvent = findItem(_qs.event);
  const _qCat = _urlEvent?.cat ?? null;
  const _rawYear =
    _qs.year != null && _qs.year !== "" && Number.isFinite(+_qs.year)
      ? +_qs.year
      : null;
  const _initYear = clampYear(
    _rawYear != null ? _rawYear : _initItem.y1,
    _initItem,
  );
  const [cat, setCat] = useState(_qCat || _initItem.cat);
  const [sel, setSel] = useState(_initEvt);
  const [year, setYear] = useState(_initYear);
  const [hover, setHover] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [sideOpen, setSideOpen] = useState(() => window.innerWidth >= 768);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [wikiPanel, setWikiPanel] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [eventWiki, setEventWiki] = useState(null);
  const [lang, setLang] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("roma_lang");
    } catch (e) {}
    return resolveLang(
      _qs.lang,
      saved,
      navigator.language || navigator.userLanguage || "en",
    );
  });
  const [theme, setTheme] = useState(() => {
    let saved = null;
    try {
      saved = localStorage.getItem("roma_theme");
    } catch (e) {}
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    return resolveTheme(saved, prefersLight);
  });
  const { message: statusToast, showToast } = useToast();

  const [autoTips, setAutoTips] = useState(true);
  const [wikiEs, setWikiEs] = useState(null);
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      !!window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [showHelp, setShowHelp] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareToast, setShareToast] = useState(false);
  const [animRoutes, setAnimRoutes] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showFigures, setShowFigures] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mapMode, setMapMode] = useState("3d");

  const [audioOn, setAudioOn] = useState(true);
  const {
    tourActive,
    setTourActive,
    tourStep,
    setTourStep,
    tourPaused,
    setTourPaused,
    startTour,
    advanceTour,
  } = useGuidedTour({
    findItem,
    setCat,
    setSel,
    setYear,
    setPlaying,
    setSideOpen,
  });
  const [quizActive, setQuizActive] = useState(false);
  const [quizState, setQuizState] = useState(null);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [map2dTick, setMap2dTick] = useState(0);
  const [detailMin, setDetailMin] = useState(false);
  const TH = THEMES[theme] || THEMES.dark;
  const { t, catName } = createTranslator(lang, I18N, CAT_I18N_KEYS);
  const yrf = (y) => yrL(y, lang);
  const dName = (item) => localizedName(item, lang, DATA_ES);
  const dDesc = (item) => localizedDesc(item, lang, DATA_ES);
  const dFacts = (item) => localizedFacts(item, lang, DATA_ES);
  const getArticle = (itemId) =>
    getWikiArticle(itemId, lang, DATA_WIKI, wikiEs);
  const renderBold = (text) => renderBoldText(React, text, TH.gold);
  useEffect(() => {
    try {
      localStorage.setItem("roma_lang", lang);
      document.documentElement.lang = lang;
    } catch (e) {}
    if (lang === "es" && !wikiEs) {
      import("./data/data_wiki_es.js")
        .then((m) => setWikiEs(m.DATA_WIKI_ES))
        .catch((err) => console.warn("Failed to load ES wiki", err));
    }
  }, [lang, wikiEs]);
  useEffect(() => {
    try {
      localStorage.setItem("roma_theme", theme);
      document.body.style.background = (THEMES[theme] || THEMES.dark).bg;
    } catch (e) {}
  }, [theme]);
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    const p = new URLSearchParams();
    if (lang !== "en") p.set("lang", lang);
    if (sel) {
      p.set("event", sel);
      p.set("year", String(year));
    }
    const qs = p.toString();
    const url = qs
      ? window.location.pathname + "?" + qs
      : window.location.pathname;
    try {
      window.history.replaceState(null, "", url);
    } catch (e) {}
  }, [lang, sel, year]);
  const initFromUrl = useRef(!!_urlEvent);
  const mountRef = useRef(null);
  const map2dRef = useRef(null);
  const map2dImgRef = useRef(null);
  const three = useRef({});
  const drag = useRef({
    on: false,
    px: 0,
    py: 0,
    ry: (-(12.5 + 90) * Math.PI) / 180,
    rx: (41.9 * Math.PI) / 180,
    try: (-(12.5 + 90) * Math.PI) / 180,
    trx: (41.9 * Math.PI) / 180,
    auto: false,
  });
  const markersRef = useRef([]);
  const pathsRef = useRef([]);
  const territoryRef = useRef([]);
  const routeDotsRef = useRef([]);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2(-5, -5));
  const yearRef = useRef(-753);
  const playRef = useRef(false);
  const speedRef = useRef(1);
  const langRef = useRef(lang);
  const lastRevealRef = useRef(-1);
  const lastPathRevealRef = useRef(-1);
  const autoTipTimer = useRef(null);
  const clickRef = useRef(false);
  const stickyTipRef = useRef(false);
  const kbScrubRef = useRef(false);
  const animRoutesRef = useRef(true);
  const tipKeyRef = useRef(null);
  const tipDomRef = useRef(null);
  const lerpTmp = useRef(new THREE.Vector3());
  const autoTipsRef = useRef(true);
  const reduceMotionRef = useRef(false);
  const overlayCacheRef = useRef(new Map());
  const mapModeRef = useRef(mapMode);
  const prevSelRef = useRef(sel);
  const selItemRef = useRef(null);
  const sideSheetRef = useRef(null);
  const detailSheetRef = useRef(null);
  const { sheetTouchStart, mkSheetMove, mkSheetEnd } = useSheetDrag();
  const map2dView = useRef({ lat: 41.9, lng: 12.5, zoom: 2 });
  yearRef.current = year;
  playRef.current = playing;
  speedRef.current = speed;
  langRef.current = lang;
  animRoutesRef.current = animRoutes;
  mapModeRef.current = mapMode;
  autoTipsRef.current = autoTips;
  reduceMotionRef.current = reduceMotion;
  useEffect(() => {
    if (sel !== prevSelRef.current) {
      prevSelRef.current = sel;
      setDetailMin(false);
      if (selItemRef.current)
        selItemRef.current.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
    }
  }, [sel]);
  useEffect(() => {
    if (isMobile && sideOpen) setTooltip(null);
  }, [sideOpen, isMobile]);
  const selData = useMemo(() => {
    const d = findItem(sel);
    return d ? trItem(d, lang) : null;
  }, [sel, lang]);
  useEffect(() => {
    if (!selData) return;
    setYear((y) => clampYear(y, selData));
  }, [selData?.id]);
  const ewArticle = useMemo(
    () => (eventWiki ? getArticle(eventWiki.id) : null),
    [eventWiki, lang],
  );

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    const W = el.clientWidth || window.innerWidth,
      H = el.clientHeight || window.innerHeight;
    const sc = new THREE.Scene(),
      cam = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    cam.position.set(0, 0, 3.8);
    cam.lookAt(0, 0, 0);
    let ren;
    try {
      ren = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (err) {
      console.warn("WebGL unavailable, falling back to 2D map", err);
      setMapMode("2d");
      showToast(t("map2d") || "3D unavailable — switched to 2D map");
      return;
    }
    ren.setSize(W, H);
    ren.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ren.setClearColor(0x06060f);
    el.appendChild(ren.domElement);
    const onContextLost = (e) => {
      e.preventDefault();
      console.warn("WebGL context lost");
      setMapMode("2d");
      showToast(t("map2d") || "3D context lost — switched to 2D map");
    };
    ren.domElement.addEventListener("webglcontextlost", onContextLost, false);
    const grp = new THREE.Group();
    sc.add(grp);
    const globe = new THREE.Mesh(
      new THREE.SphereGeometry(2, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0x111122 }),
    );
    grp.add(globe);
    const ldr = new THREE.TextureLoader();
    ldr.crossOrigin = "anonymous";
    loadTextureWithRetry(
      ldr,
      "/earth.jpg",
      (tex) => {
        globe.material.map = tex;
        globe.material.color = null;
        globe.material.needsUpdate = true;
      },
      () => {
        console.warn("earth.jpg failed to load");
      },
    );
    const overlayTex = genOverlay(-753),
      overlay = new THREE.Mesh(
        new THREE.SphereGeometry(2.005, 64, 64),
        new THREE.MeshBasicMaterial({
          map: overlayTex,
          transparent: true,
          depthWrite: false,
        }),
      );
    grp.add(overlay);
    grp.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2.06, 64, 64),
        new THREE.MeshBasicMaterial({
          color: 0xc9a84c,
          transparent: true,
          opacity: 0.025,
          side: THREE.BackSide,
        }),
      ),
    );
    const sg = new THREE.BufferGeometry(),
      sp = [];
    for (let i = 0; i < 2500; i++) {
      const th = Math.random() * Math.PI * 2,
        ph = Math.acos(2 * Math.random() - 1),
        r = 18 + Math.random() * 30;
      sp.push(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.sin(ph) * Math.sin(th),
        r * Math.cos(ph),
      );
    }
    sg.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3));
    sc.add(
      new THREE.Points(
        sg,
        new THREE.PointsMaterial({
          color: 0xc9a84c,
          size: 0.06,
          transparent: true,
          opacity: 0.4,
        }),
      ),
    );
    const mg = new THREE.Group(),
      pg = new THREE.Group(),
      tg = new THREE.Group();
    grp.add(mg);
    grp.add(pg);
    grp.add(tg);
    three.current = {
      sc,
      cam,
      ren,
      grp,
      globe,
      overlay,
      overlayTex,
      mg,
      pg,
      tg,
    };
    const d = drag.current;
    let camDist = 3.8;
    three.current.setCamDist = (v) => {
      camDist = v;
    };
    three.current.getCamDist = () => camDist;
    const onD = (e) => {
      d.on = true;
      d.px = e.clientX;
      d.py = e.clientY;
      d.auto = false;
      clickRef.current = true;
      stickyTipRef.current = false;
    };
    const onM = (e) => {
      if (d.on) {
        if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 3)
          clickRef.current = false;
        d.try += (e.clientX - d.px) * 0.005;
        d.trx += (e.clientY - d.py) * 0.005;
        d.trx = Math.max(-1.4, Math.min(1.4, d.trx));
        d.px = e.clientX;
        d.py = e.clientY;
      }
      const rect = ren.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };
    const onU = (e) => {
      if (clickRef.current) {
        raycaster.current.setFromCamera(mouse.current, cam);
        const hits = raycaster.current.intersectObjects(
          markersRef.current.filter((m) => m.mesh.visible).map((m) => m.mesh),
          false,
        );
        if (hits.length > 0) {
          const md = markersRef.current.find((m) => m.mesh === hits[0].object);
          if (md) {
            stickyTipRef.current = true;
            const _ci = trItem(findItem(md.itemId), langRef.current);
            if (!_ci) return;
            const _cl = _ci.locs[md.locIdx] || md.data;
            const v = md.mesh.position.clone();
            v.applyMatrix4(grp.matrixWorld);
            const ndc = v.project(cam),
              rect = ren.domElement.getBoundingClientRect();
            setTooltip({
              x: (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
              y: (-ndc.y * 0.5 + 0.5) * rect.height + rect.top,
              name: _cl.n,
              info: _cl.info,
              type: "marker",
              hasWiki: !!_cl.wiki,
              wiki: _cl.wiki,
              img: _cl.img,
              imgAlt: _cl.imgAlt,
            });
          }
        } else {
          const ph = raycaster.current.intersectObjects(
            pathsRef.current
              .filter((p) => p.hitMesh.visible)
              .map((p) => p.hitMesh),
            false,
          );
          if (ph.length > 0) {
            const pd = pathsRef.current.find((p) => p.hitMesh === ph[0].object);
            if (pd) {
              stickyTipRef.current = true;
              const pt2 = ph[0].point.clone(),
                ndc2 = pt2.project(cam),
                rect2 = ren.domElement.getBoundingClientRect();
              const _ti2 = trItem(findItem(pd.itemId), langRef.current);
              if (!_ti2) return;
              const _tpLabel =
                _ti2.paths[pd.pathIdx]?.[4] || I18N[langRef.current].route;
              setTooltip({
                x: (ndc2.x * 0.5 + 0.5) * rect2.width + rect2.left,
                y: (-ndc2.y * 0.5 + 0.5) * rect2.height + rect2.top,
                name: _tpLabel,
                info: _tpLabel,
                type: "path",
                hasWiki: true,
                itemId: pd.itemId,
                pathIdx: pd.pathIdx,
              });
            }
          } else {
            const th2 = raycaster.current.intersectObjects(
              territoryRef.current.map((t) => t.mesh),
              false,
            );
            if (th2.length > 0) {
              const td = territoryRef.current.find(
                (t) => t.mesh === th2[0].object,
              );
              if (td?.data?.n) {
                stickyTipRef.current = true;
                const _tr = trTerr(td.data, langRef.current);
                const pt3 = th2[0].point.clone(),
                  ndc3 = pt3.project(cam),
                  rect3 = ren.domElement.getBoundingClientRect();
                setTooltip({
                  x: (ndc3.x * 0.5 + 0.5) * rect3.width + rect3.left,
                  y: (-ndc3.y * 0.5 + 0.5) * rect3.height + rect3.top,
                  name: _tr.n,
                  info: _tr.info,
                  type: "territory",
                  hasWiki: true,
                  terrData: td.data,
                });
              }
            }
          }
        }
      }
      clickRef.current = false;
      d.on = false;
    };
    const onW = (e) => {
      e.preventDefault();
      const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      camDist = Math.max(
        2.8,
        Math.min(
          12,
          camDist + Math.sign(dy) * Math.min(Math.abs(dy), 120) * 0.002,
        ),
      );
    };
    const onTD = (e) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
        d.on = false;
      }
      if (e.touches.length === 1) {
        d.on = true;
        d.px = e.touches[0].clientX;
        d.py = e.touches[0].clientY;
        d.auto = false;
        clickRef.current = true;
        stickyTipRef.current = false;
      }
    };
    const onTM = (e) => {
      if (e.touches.length >= 2) {
        e.preventDefault();
      }
      if (!d.on || e.touches.length !== 1) return;
      e.preventDefault();
      const dx = e.touches[0].clientX - d.px,
        dy = e.touches[0].clientY - d.py;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) clickRef.current = false;
      d.try += dx * 0.004;
      d.trx += dy * 0.004;
      d.trx = Math.max(-1.4, Math.min(1.4, d.trx));
      d.px = e.touches[0].clientX;
      d.py = e.touches[0].clientY;
    };
    const onTE = () => {
      d.on = false;
    };
    let pinchDist = 0;
    const onTS2 = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        d.on = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX,
          dy = e.touches[0].clientY - e.touches[1].clientY;
        pinchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const onTM2 = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX,
          dy = e.touches[0].clientY - e.touches[1].clientY,
          nd = Math.sqrt(dx * dx + dy * dy),
          delta = nd - pinchDist;
        camDist = Math.max(2.8, Math.min(12, camDist - delta * 0.008));
        pinchDist = nd;
      }
    };
    const onGS = (e) => e.preventDefault();
    const onGC = (e) => e.preventDefault();
    ren.domElement.addEventListener("mousedown", onD);
    window.addEventListener("mousemove", onM);
    window.addEventListener("mouseup", onU);
    ren.domElement.addEventListener("wheel", onW, { passive: false });
    ren.domElement.addEventListener(
      "touchstart",
      (e) => {
        onTD(e);
        onTS2(e);
      },
      { passive: false },
    );
    ren.domElement.addEventListener(
      "touchmove",
      (e) => {
        onTM(e);
        onTM2(e);
      },
      { passive: false },
    );
    ren.domElement.addEventListener("touchend", onTE);
    ren.domElement.addEventListener("gesturestart", onGS);
    ren.domElement.addEventListener("gesturechange", onGC);
    ren.domElement.addEventListener("gestureend", onGS);
    document.addEventListener("gesturestart", onGS);
    document.addEventListener("gesturechange", onGC);
    let af;
    let pageHidden = typeof document !== "undefined" && document.hidden;
    const onVisibility = () => {
      pageHidden = document.hidden;
      if (!pageHidden && !af) anim();
    };
    document.addEventListener("visibilitychange", onVisibility);
    const anim = () => {
      if (pageHidden) {
        af = null;
        return;
      }
      af = requestAnimationFrame(anim);
      if (d.auto) d.try += 0.0008;
      d.ry += (d.try - d.ry) * 0.09;
      d.rx += (d.trx - d.rx) * 0.09;
      grp.rotation.y = d.ry;
      grp.rotation.x = d.rx;
      cam.position.z += (camDist - cam.position.z) * 0.1;
      if (!reduceMotionRef.current)
        mg.children.forEach((m) => {
          if (m.userData?.isGlow) {
            const s =
              1 + 0.35 * Math.sin(Date.now() * 0.003 + m.userData.idx * 1.5);
            m.scale.set(s, s, s);
          }
        });
      routeDotsRef.current.forEach((rd) => {
        if (
          !rd.path.arrowGrp.visible ||
          !animRoutesRef.current ||
          reduceMotionRef.current
        ) {
          rd.dots.forEach((dm) => {
            dm.visible = false;
          });
          return;
        }
        const pts = rd.arcPts;
        const now = Date.now();
        rd.dots.forEach((dm, di) => {
          dm.visible = playRef.current;
          if (!playRef.current) {
            dm.material.opacity = Math.max(0, dm.material.opacity - 0.02);
            dm.visible = dm.material.opacity > 0.01;
            return;
          }
          dm.material.opacity = 0.9;
          const spd = 0.0004 * speedRef.current;
          const tt = (now * spd + di * 0.33) % 1;
          const idx = Math.min(Math.floor(tt * pts.length), pts.length - 2);
          const frac = tt * pts.length - idx;
          lerpTmp.current.lerpVectors(
            pts[idx],
            pts[Math.min(idx + 1, pts.length - 1)],
            frac,
          );
          dm.position.copy(lerpTmp.current);
        });
      });
      if (!d.on) {
        const applyTipPos = (x, y) => {
          if (tipDomRef.current) {
            tipDomRef.current.style.left = x + "px";
            tipDomRef.current.style.top = y + "px";
          }
        };
        const setTipIfNew = (key, payload) => {
          if (tipKeyRef.current !== key) {
            tipKeyRef.current = key;
            setTooltip(payload);
          } else {
            applyTipPos(payload.x, payload.y);
          }
        };
        raycaster.current.setFromCamera(mouse.current, cam);
        const hits = raycaster.current.intersectObjects(
          markersRef.current.filter((m) => m.mesh.visible).map((m) => m.mesh),
          false,
        );
        if (hits.length > 0) {
          const md = markersRef.current.find((m) => m.mesh === hits[0].object);
          if (md) {
            const v = md.mesh.position.clone();
            v.applyMatrix4(grp.matrixWorld);
            const ndc = v.project(cam),
              rect = ren.domElement.getBoundingClientRect();
            const _ti = trItem(findItem(md.itemId), langRef.current);
            if (_ti) {
              const _tl = _ti.locs[md.locIdx] || md.data;
              const _x = (ndc.x * 0.5 + 0.5) * rect.width + rect.left,
                _y = (-ndc.y * 0.5 + 0.5) * rect.height + rect.top;
              setTipIfNew("m:" + md.itemId + ":" + md.locIdx, {
                x: _x,
                y: _y,
                name: _tl.n,
                info: _tl.info,
                type: "marker",
                hasWiki: !!_tl.wiki,
                wiki: _tl.wiki,
                img: _tl.img,
                imgAlt: _tl.imgAlt,
              });
            }
          }
        } else {
          const ph = raycaster.current.intersectObjects(
            pathsRef.current
              .filter((p) => p.hitMesh.visible)
              .map((p) => p.hitMesh),
            false,
          );
          if (ph.length > 0) {
            const pd = pathsRef.current.find((p) => p.hitMesh === ph[0].object);
            if (pd) {
              const pt2 = ph[0].point.clone(),
                ndc2 = pt2.project(cam),
                rect2 = ren.domElement.getBoundingClientRect();
              const _ti2 = trItem(findItem(pd.itemId), langRef.current);
              if (_ti2) {
                const _tpLabel =
                  _ti2.paths[pd.pathIdx]?.[4] || I18N[langRef.current].route;
                const _x = (ndc2.x * 0.5 + 0.5) * rect2.width + rect2.left,
                  _y = (-ndc2.y * 0.5 + 0.5) * rect2.height + rect2.top;
                setTipIfNew("p:" + pd.itemId + ":" + pd.pathIdx, {
                  x: _x,
                  y: _y,
                  name: _tpLabel,
                  info: _tpLabel,
                  type: "path",
                  hasWiki: true,
                  itemId: pd.itemId,
                  pathIdx: pd.pathIdx,
                });
              }
            }
          } else {
            const th2 = raycaster.current.intersectObjects(
              territoryRef.current.map((t) => t.mesh),
              false,
            );
            if (th2.length > 0) {
              const td = territoryRef.current.find(
                (t) => t.mesh === th2[0].object,
              );
              if (td?.data?.n) {
                const _tr = trTerr(td.data, langRef.current);
                const pt3 = th2[0].point.clone(),
                  ndc3 = pt3.project(cam),
                  rect3 = ren.domElement.getBoundingClientRect();
                setTooltip({
                  x: (ndc3.x * 0.5 + 0.5) * rect3.width + rect3.left,
                  y: (-ndc3.y * 0.5 + 0.5) * rect3.height + rect3.top,
                  name: _tr.n,
                  info: _tr.info,
                  type: "territory",
                  hasWiki: true,
                  terrData: td.data,
                });
              }
            } else if (!playRef.current && !stickyTipRef.current) {
              if (tipKeyRef.current !== null) {
                tipKeyRef.current = null;
                setTooltip(null);
              }
            }
          }
        }
      }
      ren.render(sc, cam);
    };
    anim();
    const onR = () => {
      const w = el.clientWidth || window.innerWidth,
        h = el.clientHeight || window.innerHeight;
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
      ren.setSize(w, h);
    };
    window.addEventListener("resize", onR);
    return () => {
      cancelAnimationFrame(af);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onR);
      window.removeEventListener("mousemove", onM);
      window.removeEventListener("mouseup", onU);
      ren.domElement.removeEventListener("mousedown", onD);
      ren.domElement.removeEventListener("wheel", onW);
      ren.domElement.removeEventListener("touchstart", onTD);
      ren.domElement.removeEventListener("touchmove", onTM);
      ren.domElement.removeEventListener("touchend", onTE);
      ren.domElement.removeEventListener("gesturestart", onGS);
      ren.domElement.removeEventListener("gesturechange", onGC);
      ren.domElement.removeEventListener("gestureend", onGS);
      ren.domElement.removeEventListener("webglcontextlost", onContextLost);
      document.removeEventListener("gesturestart", onGS);
      document.removeEventListener("gesturechange", onGC);
      const disposeObj = (o) => {
        if (!o) return;
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
        if (o.children) [...o.children].forEach(disposeObj);
      };
      disposeObj(sc);
      for (const tex of overlayCacheRef.current.values()) {
        try {
          tex.dispose();
        } catch (e) {}
      }
      overlayCacheRef.current.clear();
      if (el.contains(ren.domElement)) el.removeChild(ren.domElement);
      try {
        ren.forceContextLoss?.();
      } catch (e) {}
      ren.dispose();
      three.current = {};
    };
  }, []);
  useEffect(() => {
    if (mapMode !== "3d") return;
    const t = three.current;
    if (!t.ren || !t.cam) return;
    const el = mountRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      const w = el.clientWidth || window.innerWidth,
        h = el.clientHeight || window.innerHeight;
      t.cam.aspect = w / h;
      t.cam.updateProjectionMatrix();
      t.ren.setSize(w, h);
    });
  }, [mapMode]);

  useEffect(() => {
    if (!map2dImgRef.current) {
      loadImageWithRetry("/earth.jpg")
        .then((img) => {
          map2dImgRef.current = img;
          setMap2dTick((n) => n + 1);
        })
        .catch(() => {
          console.warn("earth.jpg failed for 2D map");
        });
    }
  }, []);
  useEffect(() => {
    const cv = map2dRef.current;
    if (!cv || mapMode !== "2d") return;
    const cx = cv.getContext("2d");
    const W = window.innerWidth,
      H = window.innerHeight;
    cv.width = W;
    cv.height = H;
    const v = map2dView.current;
    const { mapW, mapH, offY, z, toX, toY } = createMapProjection(v, W, H);
    cx.fillStyle = TH.bg;
    cx.fillRect(0, 0, W, H);
    cx.save();
    cx.beginPath();
    cx.rect(0, offY, mapW, mapH);
    cx.clip();
    const imgX = mapW / 2 - ((v.lng + 180) / 360) * mapW * z,
      imgY = offY + mapH / 2 - ((90 - v.lat) / 180) * mapH * z,
      imgW = mapW * z,
      imgH = mapH * z;
    if (map2dImgRef.current)
      cx.drawImage(map2dImgRef.current, imgX, imgY, imgW, imgH);
    else {
      cx.fillStyle = theme === "dark" ? "#111122" : "#556677";
      cx.fillRect(imgX, imgY, imgW, imgH);
    }
    getT(year).forEach((r) => {
      const x1 = toX(r.lo[0]),
        y1 = toY(r.la[1]),
        x2 = toX(r.lo[1]),
        y2 = toY(r.la[0]);
      const g = cx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, "rgba(155,35,53,0.28)");
      g.addColorStop(1, "rgba(180,120,40,0.15)");
      cx.fillStyle = g;
      cx.fillRect(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.abs(x2 - x1),
        Math.abs(y2 - y1),
      );
      cx.strokeStyle = "rgba(201,168,76,0.2)";
      cx.lineWidth = 1;
      cx.strokeRect(
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.abs(x2 - x1),
        Math.abs(y2 - y1),
      );
    });
    const item = DATA.find((d) => d.id === sel);
    if (item) {
      const trig = getTriggerYears(item);
      const visLocs = trig.locs.filter((l) => year >= l.ty);
      const visPaths = trig.paths.filter((p) => year >= p.ty);
      const isPlaying = playRef.current;
      const latestLocIdx =
        visLocs.length > 0
          ? trig.locs.indexOf(visLocs[visLocs.length - 1])
          : -1;
      const latestPathIdx =
        visPaths.length > 0
          ? trig.paths.indexOf(visPaths[visPaths.length - 1])
          : -1;
      const qBez = (x0, y0, cpx, cpy, x1, y1, t) => {
        const u = 1 - t;
        return {
          x: u * u * x0 + 2 * u * t * cpx + t * t * x1,
          y: u * u * y0 + 2 * u * t * cpy + t * t * y1,
        };
      };
      trig.paths.forEach(({ p: pa, ty }, pi) => {
        if (year < ty) return;
        const isLatest = isPlaying && pi === latestPathIdx;
        const sx = toX(pa[1]),
          sy = toY(pa[0]),
          ex = toX(pa[3]),
          ey = toY(pa[2]);
        const cpx = toX((pa[1] + pa[3]) / 2),
          cpy = toY((pa[0] + pa[2]) / 2 - 5);
        cx.beginPath();
        cx.moveTo(sx, sy);
        cx.quadraticCurveTo(cpx, cpy, ex, ey);
        cx.strokeStyle = isLatest
          ? "rgba(196,30,58,0.9)"
          : "rgba(196,30,58,0.6)";
        cx.lineWidth = isLatest ? 3 : 2;
        cx.stroke();
        if (isLatest) {
          cx.save();
          cx.setLineDash([6, 4]);
          cx.beginPath();
          cx.moveTo(sx, sy);
          cx.quadraticCurveTo(cpx, cpy, ex, ey);
          cx.strokeStyle = "rgba(201,168,76,0.5)";
          cx.lineWidth = 1;
          cx.stroke();
          cx.restore();
          const nextLocTy = trig.locs[pi + 1]
            ? trig.locs[pi + 1].ty
            : pi + 1 < trig.paths.length
              ? trig.paths[pi + 1].ty
              : selData.y2;
          const span = Math.max(1, nextLocTy - ty);
          const prog = Math.min(1, Math.max(0, (year - ty) / span));
          for (let di = 0; di < 3; di++) {
            const dt = Math.max(0, Math.min(1, prog - di * 0.12));
            if (dt <= 0) continue;
            const dp = qBez(sx, sy, cpx, cpy, ex, ey, dt);
            const alpha = di === 0 ? 1 : 0.5 - di * 0.15;
            const rad = di === 0 ? 6 : 4;
            cx.beginPath();
            cx.arc(dp.x, dp.y, rad, 0, Math.PI * 2);
            cx.fillStyle = `rgba(201,168,76,${alpha})`;
            cx.fill();
            if (di === 0) {
              cx.beginPath();
              cx.arc(dp.x, dp.y, 10, 0, Math.PI * 2);
              cx.fillStyle = "rgba(201,168,76,0.15)";
              cx.fill();
            }
          }
        }
      });
      trig.locs.forEach((l, i) => {
        if (year < l.ty) return;
        const lx = toX(l.lng),
          ly = toY(l.lat);
        const isLatest = isPlaying && i === latestLocIdx;
        if (isLatest) {
          const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.005);
          cx.beginPath();
          cx.arc(lx, ly, 22 + pulse * 4, 0, Math.PI * 2);
          cx.fillStyle = "rgba(201,168,76,0.06)";
          cx.fill();
          cx.beginPath();
          cx.arc(lx, ly, 16 + pulse * 2, 0, Math.PI * 2);
          cx.fillStyle = "rgba(201,168,76,0.12)";
          cx.fill();
          cx.strokeStyle = `rgba(201,168,76,${0.3 + pulse * 0.3})`;
          cx.lineWidth = 1.5;
          cx.stroke();
        }
        cx.beginPath();
        cx.arc(lx, ly, isLatest ? 8 : 5, 0, Math.PI * 2);
        cx.fillStyle = "#C9A84C";
        cx.fill();
        cx.strokeStyle = "rgba(201,168,76,0.5)";
        cx.lineWidth = 1;
        cx.stroke();
        cx.beginPath();
        cx.arc(lx, ly, isLatest ? 13 : 10, 0, Math.PI * 2);
        cx.fillStyle = "rgba(201,168,76,0.15)";
        cx.fill();
        if (l.n) {
          cx.font = isLatest ? "bold 12px Georgia,serif" : "10px Georgia,serif";
          cx.fillStyle = TH.gold;
          cx.textAlign = "center";
          cx.fillText(l.n, lx, ly - (isLatest ? 18 : 12));
        }
      });
    }
    cx.restore();
  }, [mapMode, year, sel, theme, map2dTick, playing]);
  useEffect(() => {
    if (!playing || mapMode !== "2d") return;
    let af;
    const tick = () => {
      setMap2dTick((t) => t + 1);
      af = requestAnimationFrame(tick);
    };
    af = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(af);
  }, [playing, mapMode]);
  useEffect(() => {
    const cv = map2dRef.current;
    if (!cv || mapMode !== "2d") return;
    let dragging = false,
      clicked = false,
      startX = 0,
      startY = 0,
      startLat = 0,
      startLng = 0;
    const check2dClick = (cx, cy) => {
      const W = window.innerWidth,
        H = window.innerHeight,
        v = map2dView.current,
        { toX, toY } = createMapProjection(v, W, H);
      const sid = prevSelRef.current,
        item = sid ? DATA.find((d) => d.id === sid) : null;
      let cl = null,
        md = 25;
      if (item) {
        const trig = getTriggerYears(item);
        trig.locs.forEach((l, i) => {
          if (yearRef.current < l.ty) return;
          const d = Math.hypot(cx - toX(l.lng), cy - toY(l.lat));
          if (d < md) {
            md = d;
            cl = { t: "loc", l, i };
          }
        });
        if (!cl)
          trig.paths.forEach(({ p: pa, ty }, pi) => {
            if (yearRef.current < ty) return;
            [
              [toX((pa[1] + pa[3]) / 2), toY((pa[0] + pa[2]) / 2)],
              [toX(pa[1]), toY(pa[0])],
              [toX(pa[3]), toY(pa[2])],
            ].forEach(([px, py]) => {
              const d = Math.hypot(cx - px, cy - py);
              if (d < md) {
                md = d;
                cl = { t: "path", pa, i: pi };
              }
            });
          });
      }
      if (!cl) {
        const terrs = getT(yearRef.current);
        for (let ti = 0; ti < terrs.length; ti++) {
          const r = terrs[ti];
          const x1 = toX(r.lo[0]),
            x2 = toX(r.lo[1]),
            y1 = toY(r.la[1]),
            y2 = toY(r.la[0]);
          const minX = Math.min(x1, x2),
            maxX = Math.max(x1, x2),
            minY = Math.min(y1, y2),
            maxY = Math.max(y1, y2);
          if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) {
            cl = { t: "terr", r };
            break;
          }
        }
      }
      if (!cl) return;
      stickyTipRef.current = true;
      if (cl.t === "loc" && item) {
        const _ti = trItem(item, langRef.current);
        const _tl = _ti.locs[cl.i] || cl.l;
        setTooltip({
          x: cx,
          y: cy,
          name: _tl.n,
          info: _tl.info,
          type: "marker",
          hasWiki: !!_tl.wiki,
          wiki: _tl.wiki,
          img: _tl.img,
          imgAlt: _tl.imgAlt,
        });
      } else if (cl.t === "path" && item) {
        const _ti = trItem(item, langRef.current);
        const _tpLabel = _ti.paths[cl.i]?.[4] || I18N[langRef.current].route;
        setTooltip({
          x: cx,
          y: cy,
          name: _tpLabel,
          info: _tpLabel,
          type: "path",
          hasWiki: true,
          itemId: item.id,
          pathIdx: cl.i,
        });
      } else if (cl.t === "terr") {
        const _ctr = trTerr(cl.r, langRef.current);
        setTooltip({
          x: cx,
          y: cy,
          name: _ctr.n,
          info: _ctr.info,
          type: "territory",
          hasWiki: true,
          terrData: cl.r,
        });
      }
    };
    const onDown = (e) => {
      dragging = true;
      clicked = true;
      stickyTipRef.current = false;
      startX = e.clientX;
      startY = e.clientY;
      startLat = map2dView.current.lat;
      startLng = map2dView.current.lng;
      e.preventDefault();
    };
    const onMove = (e) => {
      if (!dragging) {
        const rect = cv.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        )
          return;
        const W2 = window.innerWidth,
          H2 = window.innerHeight,
          mW = W2,
          mH = H2 - 140,
          oY = 60,
          vv = map2dView.current,
          zz = vv.zoom,
          tX = (lng) => mW / 2 + ((lng - vv.lng) / 360) * mW * zz,
          tY = (lat) => oY + mH / 2 - ((lat - vv.lat) / 180) * mH * zz;
        const sid = prevSelRef.current,
          item = sid ? DATA.find((d) => d.id === sid) : null;
        let hov = null,
          hd = 25;
        if (item) {
          const trig = getTriggerYears(item);
          trig.locs.forEach((l, i) => {
            if (yearRef.current < l.ty) return;
            const d = Math.hypot(e.clientX - tX(l.lng), e.clientY - tY(l.lat));
            if (d < hd) {
              hd = d;
              hov = { l, i };
            }
          });
        }
        if (hov) {
          cv.style.cursor = "pointer";
          const _ti = trItem(item, langRef.current),
            _tl = _ti.locs[hov.i] || hov.l;
          setTooltip({
            x: tX(hov.l.lng),
            y: tY(hov.l.lat),
            name: _tl.n,
            info: _tl.info,
            type: "marker",
            hasWiki: !!_tl.wiki,
            wiki: _tl.wiki,
            img: _tl.img,
            imgAlt: _tl.imgAlt,
          });
        } else {
          let terrHov = null;
          const terrs = getT(yearRef.current);
          for (let ti = 0; ti < terrs.length; ti++) {
            const r = terrs[ti];
            const x1 = tX(r.lo[0]),
              x2 = tX(r.lo[1]),
              y1 = tY(r.la[1]),
              y2 = tY(r.la[0]);
            const minX = Math.min(x1, x2),
              maxX = Math.max(x1, x2),
              minY = Math.min(y1, y2),
              maxY = Math.max(y1, y2);
            if (
              e.clientX >= minX &&
              e.clientX <= maxX &&
              e.clientY >= minY &&
              e.clientY <= maxY
            ) {
              terrHov = r;
              break;
            }
          }
          if (terrHov) {
            cv.style.cursor = "pointer";
            const _tr = trTerr(terrHov, langRef.current);
            const cx2 = (tX(terrHov.lo[0]) + tX(terrHov.lo[1])) / 2,
              cy2 = (tY(terrHov.la[0]) + tY(terrHov.la[1])) / 2;
            setTooltip({
              x: cx2,
              y: cy2,
              name: _tr.n,
              info: _tr.info,
              type: "territory",
              hasWiki: true,
              terrData: terrHov,
            });
          } else {
            cv.style.cursor = "grab";
            if (!playRef.current && !stickyTipRef.current) setTooltip(null);
          }
        }
        return;
      }
      if (Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 3)
        clicked = false;
      const W = window.innerWidth,
        H = window.innerHeight - 140,
        v = map2dView.current,
        z = v.zoom;
      const dlng = (((e.clientX - startX) / W) * 360) / z,
        dlat = (((e.clientY - startY) / H) * 180) / z;
      v.lng = startLng - dlng;
      v.lat = startLat + dlat;
      v.lat = Math.max(-85, Math.min(85, v.lat));
      setMap2dTick((t) => t + 1);
    };
    const onUp = (e) => {
      if (clicked) check2dClick(e.clientX, e.clientY);
      dragging = false;
      clicked = false;
    };
    const onWheel = (e) => {
      e.preventDefault();
      const v = map2dView.current;
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      v.zoom = Math.max(1, Math.min(20, v.zoom * factor));
      setMap2dTick((t) => t + 1);
    };
    const onGS = (e) => e.preventDefault();
    let lastPinchDist = 0,
      pinchStartZoom = 1;
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX,
          dy = e.touches[0].clientY - e.touches[1].clientY;
        lastPinchDist = Math.hypot(dx, dy);
        pinchStartZoom = map2dView.current.zoom;
        e.preventDefault();
      } else if (e.touches.length === 1) {
        dragging = true;
        clicked = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        startLat = map2dView.current.lat;
        startLng = map2dView.current.lng;
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX,
          dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        if (lastPinchDist > 0) {
          map2dView.current.zoom = Math.max(
            1,
            Math.min(20, pinchStartZoom * (dist / lastPinchDist)),
          );
          setMap2dTick((t) => t + 1);
        }
        e.preventDefault();
      } else if (e.touches.length === 1 && dragging) {
        if (
          Math.abs(e.touches[0].clientX - startX) +
            Math.abs(e.touches[0].clientY - startY) >
          3
        )
          clicked = false;
        const W = window.innerWidth,
          H = window.innerHeight - 140,
          v = map2dView.current,
          z = v.zoom;
        const dlng = (((e.touches[0].clientX - startX) / W) * 360) / z,
          dlat = (((e.touches[0].clientY - startY) / H) * 180) / z;
        v.lng = startLng - dlng;
        v.lat = startLat + dlat;
        v.lat = Math.max(-85, Math.min(85, v.lat));
        setMap2dTick((t) => t + 1);
      }
    };
    const onTouchEnd = (e) => {
      if (clicked) {
        const ct = e.changedTouches?.[0];
        check2dClick(ct ? ct.clientX : startX, ct ? ct.clientY : startY);
      }
      dragging = false;
      clicked = false;
      lastPinchDist = 0;
    };
    cv.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    cv.addEventListener("wheel", onWheel, { passive: false });
    cv.addEventListener("gesturestart", onGS);
    cv.addEventListener("touchstart", onTouchStart, { passive: false });
    cv.addEventListener("touchmove", onTouchMove, { passive: false });
    cv.addEventListener("touchend", onTouchEnd);
    return () => {
      cv.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      cv.removeEventListener("wheel", onWheel);
      cv.removeEventListener("gesturestart", onGS);
      cv.removeEventListener("touchstart", onTouchStart);
      cv.removeEventListener("touchmove", onTouchMove);
      cv.removeEventListener("touchend", onTouchEnd);
    };
  }, [mapMode]);
  useEffect(() => {
    const tc = three.current;
    if (!tc.ren || !tc.globe) return;
    tc.ren.setClearColor(TH.sceneBg);
    if (!tc.globe.material.map) {
      tc.globe.material.color = new THREE.Color(TH.globeBase);
      tc.globe.material.needsUpdate = true;
    }
  }, [theme]);
  useEffect(() => {
    const t = three.current;
    if (!t.overlay) return;
    const bucket = Math.round(year / 5) * 5;
    let nt = overlayCacheRef.current.get(bucket);
    if (!nt) {
      nt = genOverlay(bucket);
      overlayCacheRef.current.set(bucket, nt);
      if (overlayCacheRef.current.size > 24) {
        const first = overlayCacheRef.current.keys().next().value;
        const old = overlayCacheRef.current.get(first);
        overlayCacheRef.current.delete(first);
        if (old && old !== t.overlayTex) old.dispose();
      }
    }
    if (t.overlay.material.map !== nt) {
      t.overlay.material.map = nt;
      t.overlay.material.needsUpdate = true;
      t.overlayTex = nt;
    }
    if (t.tg) {
      while (t.tg.children.length) {
        const ch = t.tg.children[0];
        t.tg.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) ch.material.dispose();
      }
      territoryRef.current = [];
      getT(year).forEach((r) => {
        const segLa = 6,
          segLo = 8,
          verts = [],
          indices = [];
        for (let i = 0; i <= segLa; i++)
          for (let j = 0; j <= segLo; j++) {
            const la = r.la[0] + ((r.la[1] - r.la[0]) * i) / segLa,
              lo = r.lo[0] + ((r.lo[1] - r.lo[0]) * j) / segLo,
              p = ll3(la, lo, 2.009);
            verts.push(p.x, p.y, p.z);
          }
        for (let i = 0; i < segLa; i++)
          for (let j = 0; j < segLo; j++) {
            const a = i * (segLo + 1) + j,
              b = a + segLo + 1;
            indices.push(a, b, a + 1, b, b + 1, a + 1);
          }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute(
          "position",
          new THREE.Float32BufferAttribute(verts, 3),
        );
        geo.setIndex(indices);
        geo.computeVertexNormals();
        geo.computeBoundingSphere();
        const mesh = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({
            color: 0xc9a84c,
            transparent: true,
            opacity: 0.001,
            side: THREE.DoubleSide,
          }),
        );
        t.tg.add(mesh);
        territoryRef.current.push({ mesh, data: r });
      });
    }
  }, [year]);

  const showAutoTooltip = useCallback((loc, itemId, locIdx) => {
    if (!autoTipsRef.current) return;
    let _n = loc.n,
      _inf = loc.info,
      _ia = loc.imgAlt,
      _hw = !!loc.wiki,
      _wk = loc.wiki;
    if (itemId !== undefined) {
      const _ai = trItem(findItem(itemId), langRef.current);
      const _al = _ai?.locs?.[locIdx];
      if (_al) {
        _n = _al.n;
        _inf = _al.info;
        _ia = _al.imgAlt;
        _hw = !!_al.wiki;
        _wk = _al.wiki;
      }
    }
    let tx, ty;
    if (mapModeRef.current === "2d") {
      const pt = projectMapLatLng(
        loc.lat,
        loc.lng,
        map2dView.current,
        window.innerWidth,
        window.innerHeight,
      );
      tx = pt.x;
      ty = pt.y;
    } else {
      const t = three.current;
      if (!t.cam || !t.ren || !t.grp) return;
      const p = ll3(loc.lat, loc.lng, 2.02),
        v = p.clone();
      v.applyMatrix4(t.grp.matrixWorld);
      const ndc = v.project(t.cam),
        rect = t.ren.domElement.getBoundingClientRect();
      tx = (ndc.x * 0.5 + 0.5) * rect.width + rect.left;
      ty = (-ndc.y * 0.5 + 0.5) * rect.height + rect.top;
    }
    setTooltip({
      x: tx,
      y: ty,
      name: _n,
      info: _inf,
      type: "marker",
      auto: true,
      hasWiki: _hw,
      wiki: _wk,
      img: loc.img,
      imgAlt: _ia,
    });
  }, []);
  const showAutoPathTooltip = useCallback((pa, itemId, pathIdx) => {
    if (!autoTipsRef.current) return;
    let _pn = pa[4] || I18N[langRef.current].route;
    if (itemId !== undefined) {
      const _pi = trItem(findItem(itemId), langRef.current);
      _pn = _pi?.paths?.[pathIdx]?.[4] || I18N[langRef.current].route;
    }
    const midLa = (pa[0] + pa[2]) / 2,
      midLo = (pa[1] + pa[3]) / 2;
    let tx, ty;
    if (mapModeRef.current === "2d") {
      const pt = projectMapLatLng(
        midLa,
        midLo,
        map2dView.current,
        window.innerWidth,
        window.innerHeight,
      );
      tx = pt.x;
      ty = pt.y;
    } else {
      const t = three.current;
      if (!t.cam || !t.ren || !t.grp) return;
      const p = ll3(midLa, midLo, 2.15),
        v = p.clone();
      v.applyMatrix4(t.grp.matrixWorld);
      const ndc = v.project(t.cam),
        rect = t.ren.domElement.getBoundingClientRect();
      tx = (ndc.x * 0.5 + 0.5) * rect.width + rect.left;
      ty = (-ndc.y * 0.5 + 0.5) * rect.height + rect.top;
    }
    setTooltip({
      x: tx,
      y: ty,
      name: _pn,
      info: _pn,
      type: "path",
      auto: true,
      hasWiki: true,
      itemId,
      pathIdx,
    });
  }, []);
  const handleTooltipClick = useCallback(() => {
    if (!tooltip || !tooltip.hasWiki) return;
    setPlaying(false);
    setTourPaused(true);
    if (tooltip.type === "marker" && tooltip.wiki) {
      setWikiPanel({
        name: tooltip.name,
        info: tooltip.info,
        wiki: tooltip.wiki,
        img: tooltip.img,
        imgAlt: tooltip.imgAlt,
      });
    } else if (tooltip.type === "path" && tooltip.itemId !== undefined) {
      const _item = DATA.find((d) => d.id === tooltip.itemId);
      if (!_item) return;
      const _cti = trItem(_item, lang),
        li = I18N[lang],
        _ctp = _cti.paths[tooltip.pathIdx],
        _ctLabel = _ctp?.[4] || li.route,
        _ctWiki = _ctp?.[5] || null;
      if (_ctWiki) {
        const pImg = _cti.locs.find((l) => l.img);
        setWikiPanel({
          name: _ctLabel,
          info: li.route,
          wiki: _ctWiki,
          img: pImg?.img,
          imgAlt: pImg?.imgAlt,
        });
      } else {
        const getL = (la, lo) =>
          _cti.locs.find(
            (l) => Math.abs(l.lat - la) < 2 && Math.abs(l.lng - lo) < 2,
          );
        const from = _ctp ? getL(_ctp[0], _ctp[1]) : null,
          to = _ctp ? getL(_ctp[2], _ctp[3]) : null;
        const wk = [
          `**${_ctLabel}**`,
          from ? `\n\n${li.origin} — ${from.n}: ${from.info}` : "",
          to ? `\n\n${li.destination} — ${to.n}: ${to.info}` : "",
          `\n\n${_cti.desc}`,
          from?.wiki ? `\n\n${from.wiki}` : "",
          to?.wiki ? `\n\n${to.wiki}` : "",
        ]
          .join("")
          .trim();
        setWikiPanel({
          name: _ctLabel,
          info: from && to ? `${from.n} → ${to.n}` : li.route,
          wiki: wk,
          img: from?.img || to?.img,
          imgAlt: from?.imgAlt || to?.imgAlt,
        });
      }
    } else if (tooltip.type === "territory" && tooltip.terrData) {
      const _ctr = trTerr(tooltip.terrData, lang),
        era = ERA_T.find((e) => year >= e.s && year <= e.e),
        en = era ? `${yrL(era.s, lang)} – ${yrL(era.e, lang)}` : "",
        li = I18N[lang];
      setWikiPanel({
        name: _ctr.n,
        info: `${li.romanProvince} — ${en}`,
        wiki: `**${_ctr.n}**\n\n${_ctr.info}\n\n${li.territoryOf} ${en}. ${li.territoryGov}`,
      });
    }
    setTooltip(null);
  }, [tooltip, lang, year]);
  useEffect(() => {
    if (!selData) return;
    const active = playing || kbScrubRef.current;
    if (kbScrubRef.current) kbScrubRef.current = false;
    if (!active) return;
    const trig = getTriggerYears(selData);
    const visLocs = trig.locs.filter((l) => yearRef.current >= l.ty);
    const visPaths = trig.paths.filter((p) => yearRef.current >= p.ty);
    if (visLocs.length > 0 && visLocs.length !== lastRevealRef.current) {
      lastRevealRef.current = visLocs.length;
      const n = visLocs[visLocs.length - 1],
        d = drag.current;
      d.try = (-(n.lng + 90) * Math.PI) / 180;
      d.trx = (n.lat * Math.PI) / 180;
      d.auto = false;
      map2dView.current.lat = n.lat;
      map2dView.current.lng = n.lng;
      clearTimeout(autoTipTimer.current);
      autoTipTimer.current = setTimeout(
        () => showAutoTooltip(n, selData.id, trig.locs.indexOf(n)),
        300,
      );
    } else if (
      visPaths.length > 0 &&
      visPaths.length !== lastPathRevealRef.current
    ) {
      lastPathRevealRef.current = visPaths.length;
      const _vp = visPaths[visPaths.length - 1];
      const midLa = (_vp.p[0] + _vp.p[2]) / 2,
        midLo = (_vp.p[1] + _vp.p[3]) / 2;
      map2dView.current.lat = midLa;
      map2dView.current.lng = midLo;
      clearTimeout(autoTipTimer.current);
      autoTipTimer.current = setTimeout(
        () => showAutoPathTooltip(_vp.p, selData.id, trig.paths.indexOf(_vp)),
        400,
      );
    } else if (!playing && visLocs.length > 0) {
      const n = visLocs[visLocs.length - 1];
      clearTimeout(autoTipTimer.current);
      autoTipTimer.current = setTimeout(
        () => showAutoTooltip(n, selData.id, trig.locs.indexOf(n)),
        150,
      );
    }
  }, [year, playing, selData, showAutoTooltip, showAutoPathTooltip]);

  useEffect(() => {
    const t = three.current;
    if (!t.mg) return;
    const disposeGrp = (g) => {
      while (g.children.length) {
        const ch = g.children[0];
        g.remove(ch);
        if (ch.geometry) ch.geometry.dispose();
        if (ch.material) {
          const ms = Array.isArray(ch.material) ? ch.material : [ch.material];
          ms.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
        if (ch.children) disposeGrp(ch);
      }
    };
    disposeGrp(t.mg);
    disposeGrp(t.pg);
    markersRef.current = [];
    pathsRef.current = [];
    routeDotsRef.current = [];
    lastRevealRef.current = -1;
    lastPathRevealRef.current = -1;
    const item = findItem(sel);
    if (!item) return;
    const trig = getTriggerYears(item);
    const spqrC = document.createElement("canvas");
    spqrC.width = 256;
    spqrC.height = 96;
    const spqrCx = spqrC.getContext("2d");
    spqrCx.clearRect(0, 0, 256, 96);
    spqrCx.font = "bold 52px Georgia,serif";
    spqrCx.textAlign = "center";
    spqrCx.textBaseline = "middle";
    spqrCx.shadowColor = "rgba(201,168,76,0.7)";
    spqrCx.shadowBlur = 10;
    spqrCx.fillStyle = "#C9A84C";
    spqrCx.fillText("S\u00B7P\u00B7Q\u00B7R", 128, 48);
    const spqrTex = new THREE.CanvasTexture(spqrC);
    trig.locs.forEach((l, i) => {
      const p = ll3(l.lat, l.lng, 2.02);
      const isRome =
        l.n === "Rome" &&
        Math.abs(l.lat - 41.9) < 0.2 &&
        Math.abs(l.lng - 12.5) < 0.2;
      let m;
      if (isRome) {
        const sm = new THREE.SpriteMaterial({
          map: spqrTex,
          transparent: true,
          depthTest: false,
          depthWrite: false,
          sizeAttenuation: true,
        });
        m = new THREE.Sprite(sm);
        m.position.copy(ll3(l.lat, l.lng, 2.07));
        m.scale.set(0.18, 0.07, 1);
        m.renderOrder = 999;
      } else {
        m = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 12, 12),
          new THREE.MeshBasicMaterial({ color: 0xc9a84c }),
        );
        m.position.copy(p);
      }
      m.visible = false;
      t.mg.add(m);
      markersRef.current.push({
        mesh: m,
        data: l,
        ty: l.ty,
        itemId: item.id,
        locIdx: i,
      });
      const gl = new THREE.Mesh(
        new THREE.SphereGeometry(isRome ? 0.05 : 0.035, 12, 12),
        new THREE.MeshBasicMaterial({
          color: 0xc9a84c,
          transparent: true,
          opacity: isRome ? 0.15 : 0.25,
        }),
      );
      gl.position.copy(p);
      gl.userData = { isGlow: true, idx: i };
      gl.visible = false;
      t.mg.add(gl);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(
          isRome ? 0.04 : 0.025,
          isRome ? 0.06 : 0.035,
          24,
        ),
        new THREE.MeshBasicMaterial({
          color: 0xc9a84c,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide,
        }),
      );
      ring.position.copy(p);
      ring.lookAt(0, 0, 0);
      ring.visible = false;
      t.mg.add(ring);
    });
    const pCol = 0xc41e3a;
    const dotCatColors = {
      economy: 0xc9a84c,
      campaigns: 0xc41e3a,
      military: 0xc41e3a,
    };
    const dotColor = dotCatColors[item.cat] || 0xe8dcc8;
    trig.paths.forEach(({ p: pa, ty }, i) => {
      const p1 = ll3(pa[0], pa[1], 2.01),
        p2 = ll3(pa[2], pa[3], 2.01),
        pts = mkArc(p1, p2),
        ag = mkArrow(pts, pCol);
      ag.visible = false;
      t.pg.add(ag);
      const tubePts = pts.filter((_, j) => j % 3 === 0 || j === pts.length - 1),
        curve = new THREE.CatmullRomCurve3(tubePts),
        hitMesh = new THREE.Mesh(
          new THREE.TubeGeometry(curve, 32, 0.06, 8, false),
          new THREE.MeshBasicMaterial({
            visible: false,
            side: THREE.DoubleSide,
          }),
        );
      hitMesh.visible = false;
      t.pg.add(hitMesh);
      const pd = {
        arrowGrp: ag,
        hitMesh,
        ty,
        label: pa[4] || "Route",
        wiki: pa[5] || null,
        itemId: item.id,
        pathIdx: i,
      };
      pathsRef.current.push(pd);
      const dots = [];
      for (let di = 0; di < 3; di++) {
        const dm = new THREE.Mesh(
          new THREE.SphereGeometry(0.012, 8, 8),
          new THREE.MeshBasicMaterial({
            color: dotColor,
            transparent: true,
            opacity: 0,
          }),
        );
        dm.visible = false;
        t.pg.add(dm);
        dots.push(dm);
      }
      routeDotsRef.current.push({ path: pd, arcPts: pts, dots });
    });
    if (item.locs.length > 0) {
      const d = drag.current,
        fLat = item.locs[0].lat,
        fLng = item.locs[0].lng;
      const tY = (-(fLng + 90) * Math.PI) / 180,
        tX = (fLat * Math.PI) / 180;
      d.try = tY;
      d.trx = tX;
      d.ry = tY;
      d.rx = tX;
      d.auto = false;
      if (three.current.grp) {
        three.current.grp.rotation.y = tY;
        three.current.grp.rotation.x = tX;
      }
      let newZoom;
      if (item.locs.length > 1) {
        const lats = item.locs.map((l) => l.lat),
          lngs = item.locs.map((l) => l.lng);
        const span = Math.max(
          Math.max(...lats) - Math.min(...lats),
          Math.max(...lngs) - Math.min(...lngs),
        );
        newZoom =
          span < 5
            ? 3.2
            : span < 15
              ? 3.5
              : span < 30
                ? 3.8
                : span < 50
                  ? 4.3
                  : 4.8;
      } else {
        newZoom = 3.2;
      }
      if (three.current.setCamDist) three.current.setCamDist(newZoom);
      if (three.current.cam) three.current.cam.position.z = newZoom;
      const allLats = item.locs
          .map((l) => l.lat)
          .concat(item.paths.map((p) => [p[0], p[2]]).flat()),
        allLngs = item.locs
          .map((l) => l.lng)
          .concat(item.paths.map((p) => [p[1], p[3]]).flat());
      const cLat = (Math.min(...allLats) + Math.max(...allLats)) / 2,
        cLng = (Math.min(...allLngs) + Math.max(...allLngs)) / 2;
      let z2d;
      if (item.locs.length > 1 || item.paths.length > 0) {
        const sp = Math.max(
          Math.max(...allLats) - Math.min(...allLats),
          Math.max(...allLngs) - Math.min(...allLngs),
        );
        z2d = sp < 5 ? 8 : sp < 15 ? 5 : sp < 30 ? 3.5 : sp < 50 ? 2.5 : 1.8;
      } else {
        z2d = 6;
      }
      map2dView.current = { lat: cLat, lng: cLng, zoom: z2d };
    }
    if (initFromUrl.current) {
      initFromUrl.current = false;
    } else {
      setYear(item.y1);
    }
    setPlaying(false);
    setWikiPanel(null);
    setEventWiki(null);
    stickyTipRef.current = false;
  }, [sel]);

  useEffect(() => {
    const t = three.current;
    if (!t.mg) return;
    const item = DATA.find((d) => d.id === sel);
    if (!item) return;
    const trig = getTriggerYears(item);
    let mIdx = 0;
    trig.locs.forEach((l) => {
      const vis = year >= l.ty,
        ms = t.mg.children;
      if (mIdx * 3 + 2 < ms.length) {
        ms[mIdx * 3].visible = vis;
        ms[mIdx * 3 + 1].visible = vis;
        ms[mIdx * 3 + 2].visible = vis;
      }
      if (markersRef.current[mIdx]) markersRef.current[mIdx].mesh.visible = vis;
      mIdx++;
    });
    pathsRef.current.forEach((p) => {
      const vis = year >= p.ty;
      p.arrowGrp.visible = vis;
      p.hitMesh.visible = vis;
    });
  }, [year, sel]);
  useEffect(() => {
    if (!playing || !selData) return;
    const mn = selData.y1,
      mx = selData.y1 === selData.y2 ? selData.y1 : selData.y2;
    if (mn === mx) {
      setPlaying(false);
      return;
    }
    const span = mx - mn;
    const msPerYear = Math.max(90, 18000 / span) / speed;
    const iv = setInterval(() => {
      if (yearRef.current >= mx) {
        setPlaying(false);
        clearInterval(iv);
        // Show last point tooltip when playback completes
        const trig = getTriggerYears(selData);
        const lastLoc = trig.locs[trig.locs.length - 1];
        if (lastLoc) {
          const d = drag.current;
          d.try = (-(lastLoc.lng + 90) * Math.PI) / 180;
          d.trx = (lastLoc.lat * Math.PI) / 180;
          d.auto = false;
          stickyTipRef.current = true;
          clearTimeout(autoTipTimer.current);
          autoTipTimer.current = setTimeout(
            () => showAutoTooltip(lastLoc),
            400,
          );
        }
        return;
      }
      setYear((prev) => Math.min(mx, prev + 1));
    }, msPerYear);
    return () => clearInterval(iv);
  }, [playing, sel, speed, selData]);

  const items = DATA.filter((d) => d.cat === cat);
  const sty = makeThemeStyles(TH);
  const handlePlay = () => {
    if (!selData || selData.y1 === selData.y2) return;
    stickyTipRef.current = false;
    if (year >= selData.y2) {
      setYear(selData.y1);
      lastRevealRef.current = -1;
      lastPathRevealRef.current = -1;
      if (isMobile) setDetailMin(true);
      setTimeout(() => setPlaying(true), 100);
    } else {
      if (!playing && isMobile) setDetailMin(true);
      setPlaying(!playing);
    }
  };
  const searchResults = useEventSearch(searchQuery, lang, DATA, DATA_ES);
  const handleSearchSelect = (item) => {
    setCat(item.cat);
    setSel(item.id);
    setSearchOpen(false);
    setSearchQuery("");
  };
  const handleShare = () => {
    const url = window.location.href;
    const done = () => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    };
    if (navigator.share) {
      navigator
        .share({
          title: "Imperium Romanum",
          text: selData ? dName(selData) : "",
          url,
        })
        .then(done)
        .catch((err) => {
          if (err && err.name === "AbortError") return;
          navigator.clipboard
            .writeText(url)
            .then(done)
            .catch(() => showToast(t("copyLink") || "Copy failed"));
        });
    } else {
      navigator.clipboard
        .writeText(url)
        .then(done)
        .catch(() => showToast("Copy failed"));
    }
  };
  useAmbientAudio({
    audioOn,
    onBlocked: () => showToast(t("soundOff") || "Audio blocked"),
  });
  const handleDownloadImage = () => {
    const tc = three.current;
    if (!tc.ren) return;
    tc.ren.render(tc.sc, tc.cam);
    const c = document.createElement("canvas");
    c.width = 1200;
    c.height = 630;
    const cx = c.getContext("2d");
    cx.drawImage(tc.ren.domElement, 0, 0, 1200, 630);
    cx.fillStyle = "rgba(0,0,0,0.5)";
    cx.fillRect(0, 560, 1200, 70);
    cx.font = "bold 24px Georgia,serif";
    cx.fillStyle = "#C9A84C";
    cx.textAlign = "center";
    if (selData) cx.fillText(`${dName(selData)} — ${yrf(year)}`, 600, 595);
    const a = document.createElement("a");
    a.download = `imperium-romanum-${sel || "globe"}.png`;
    a.href = c.toDataURL("image/png");
    a.click();
  };
  const generateQuiz = () =>
    generateQuizQuestions({
      data: DATA,
      cats: CATS,
      lang,
      translateItem: (item, ln) => translateItem(item, ln, DATA_ES),
      t,
      catName,
      formatYear: yrf,
    });
  const startQuiz = () => {
    const qs = generateQuiz();
    setQuizState({
      questions: qs,
      current: 0,
      score: 0,
      answered: null,
      showResult: false,
    });
    setQuizActive(true);
  };
  const answerQuiz = (answer) => {
    if (!quizState || quizState.answered !== null) return;
    const q = quizState.questions[quizState.current];
    const isCorrect = isQuizAnswerCorrect(q, answer);
    setQuizState({
      ...quizState,
      answered: answer,
      score: quizState.score + (isCorrect ? 1 : 0),
    });
  };
  const nextQuizQuestion = () => {
    if (!quizState) return;
    const next = quizState.current + 1;
    if (next >= quizState.questions.length) {
      setQuizState({
        ...quizState,
        current: next,
        answered: null,
        showResult: true,
      });
    } else {
      setQuizState({ ...quizState, current: next, answered: null });
    }
  };

  const searchRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
        return;
      }
      if (e.key === "Escape" && lightbox) {
        setLightbox(null);
        return;
      }
      if (e.key === "Escape" && eventWiki) {
        setEventWiki(null);
        return;
      }
      if (e.key === "Escape" && wikiPanel) {
        setWikiPanel(null);
        return;
      }
      if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        setSearchQuery("");
        return;
      }
      if (e.key === "Escape" && showFigures) {
        setShowFigures(false);
        return;
      }
      if (e.key === "Escape" && quizActive) {
        setQuizActive(false);
        setQuizState(null);
        return;
      }
      const ae = document.activeElement?.tagName;
      const inInput = ae === "INPUT" || ae === "TEXTAREA";
      if (e.key === "?" && !inInput) {
        e.preventDefault();
        setShowHelp((h) => !h);
        return;
      }
      if (e.key === "/" && !inInput) {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchRef.current?.focus(), 100);
        return;
      }
      if (
        e.key === " " &&
        selData &&
        !wikiPanel &&
        !inInput &&
        !showHelp &&
        !quizActive
      ) {
        e.preventDefault();
        handlePlay();
      }
      if (
        (e.key === "ArrowLeft" || e.key === "ArrowRight") &&
        selData &&
        !wikiPanel &&
        !inInput &&
        !showHelp &&
        !quizActive
      ) {
        e.preventDefault();
        const mn = selData.y1,
          mx = selData.y1 === selData.y2 ? selData.y1 : selData.y2;
        if (mn === mx) return;
        const span = mx - mn,
          step = Math.max(1, Math.round(span * (e.shiftKey ? 0.1 : 0.01)));
        setPlaying(false);
        kbScrubRef.current = true;
        stickyTipRef.current = true;
        if (e.key === "ArrowLeft") setYear((prev) => Math.max(mn, prev - step));
        else setYear((prev) => Math.min(mx, prev + step));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    lightbox,
    wikiPanel,
    eventWiki,
    selData,
    handlePlay,
    showHelp,
    searchOpen,
    showFigures,
    quizActive,
  ]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: TH.bg,
        fontFamily: "Georgia,serif",
        color: TH.text,
        overflow: "hidden",
      }}
      role="main"
      aria-label={t("appLabel")}
    >
      <a href="#timeline-controls" className="skip-link">
        {t("skip")}
      </a>
      <div
        ref={mountRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          touchAction: "none",
          display: mapMode === "3d" ? "block" : "none",
        }}
        role="img"
        aria-label={
          t("globeLabel") +
          (selData
            ? `. ${t("viewing")}: ${dName(selData)}, ${yrf(selData.y1)}${selData.y1 !== selData.y2 ? ` — ${yrf(selData.y2)}` : ""}.`
            : ".")
        }
      />
      {mapMode === "2d" && (
        <canvas
          ref={map2dRef}
          role="img"
          aria-label={t("globeLabel")}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            touchAction: "none",
            width: "100%",
            height: "100%",
          }}
        />
      )}
      {tooltip && (
        <div
          ref={tipDomRef}
          role="tooltip"
          aria-live="polite"
          style={{
            position: "fixed",
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%,-100%) translateY(-14px)",
            zIndex: isMobile && sideOpen ? 12 : 50,
            pointerEvents:
              isMobile && sideOpen ? "none" : tooltip.hasWiki ? "auto" : "none",
            cursor: tooltip.hasWiki ? "pointer" : "default",
            maxWidth: 280,
            animation: "fadeIn 0.2s ease",
          }}
          onClick={tooltip.hasWiki ? handleTooltipClick : undefined}
        >
          <div
            style={{
              ...sty.panel,
              padding: 0,
              background: TH.panelSolid,
              borderColor:
                tooltip.type === "path"
                  ? TH.red
                  : tooltip.type === "territory"
                    ? "#8B4513"
                    : TH.gold,
              overflow: "hidden",
            }}
          >
            {tooltip.img && (
              <img
                src={tooltip.img}
                alt={tooltip.imgAlt || ""}
                loading="lazy"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
                style={{
                  width: "100%",
                  height: 100,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            )}
            <div style={{ padding: "10px 14px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: tooltip.type === "territory" ? 2 : "50%",
                    background:
                      tooltip.type === "path"
                        ? TH.red
                        : tooltip.type === "territory"
                          ? "#8B4513"
                          : TH.gold,
                    boxShadow: `0 0 8px ${tooltip.type === "path" ? TH.red : tooltip.type === "territory" ? "#8B4513" : TH.gold}`,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      tooltip.type === "path"
                        ? TH.red
                        : tooltip.type === "territory"
                          ? "#D2991D"
                          : TH.gold,
                  }}
                >
                  {tooltip.name}
                </span>
                {tooltip.type === "territory" && (
                  <span style={{ fontSize: 9, color: TH.dim, marginLeft: 4 }}>
                    {t("province")}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: TH.text,
                  margin: 0,
                  opacity: 0.85,
                }}
              >
                {tooltip.info}
              </p>
              {tooltip.hasWiki && (
                <p
                  style={{
                    fontSize: 9,
                    color: TH.gold,
                    margin: "4px 0 0",
                    opacity: 0.6,
                    letterSpacing: 1,
                  }}
                >
                  {t("clickMore")}
                </p>
              )}
            </div>
          </div>
          <div
            aria-hidden="true"
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: `6px solid ${tooltip.type === "path" ? TH.red : tooltip.type === "territory" ? "#8B4513" : TH.gold}`,
              margin: "0 auto",
              opacity: 0.7,
            }}
          />
        </div>
      )}
      {wikiPanel && !eventWiki && (
      <ModalShell
        open
        onClose={() => setWikiPanel(null)}
        labelledBy="wiki-dialog-title"
        isMobile={isMobile}
        panelStyle={{
          ...sty.panel,
          width: isMobile ? "100%" : 520,
          maxWidth: isMobile ? "100vw" : "90vw",
          maxHeight: isMobile ? "90vh" : "80vh",
          overflow: "auto",
          background: TH.panelSolid,
          borderColor: TH.gold,
          borderRadius: isMobile ? "12px 12px 0 0" : 8,
          WebkitOverflowScrolling: "touch",
        }}
      >
            <div
              style={{
                padding: isMobile ? "16px 16px" : "20px 24px",
                borderBottom: `1px solid ${TH.border}`,
                position: "sticky",
                top: 0,
                background: TH.panelSolid,
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 3,
                    color: TH.dim,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {t("encyclopedia")}
                </div>
                <h2
                  id="wiki-dialog-title"
                  style={{
                    fontSize: isMobile ? 18 : 20,
                    fontWeight: 700,
                    color: TH.gold,
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {wikiPanel.name}
                </h2>
                <div style={{ fontSize: 12, color: TH.dim, marginTop: 4 }}>
                  {wikiPanel.info}
                </div>
              </div>
              <button
                onClick={() => setWikiPanel(null)}
                aria-label={t("closeEnc")}
                style={{
                  background: "none",
                  border: `1px solid ${TH.border}`,
                  borderRadius: 6,
                  width: isMobile ? 44 : 32,
                  height: isMobile ? 44 : 32,
                  color: TH.gold,
                  cursor: "pointer",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            {wikiPanel.img && (
              <div
                style={{
                  borderBottom: `1px solid ${TH.border}`,
                  cursor: "pointer",
                }}
                onClick={() =>
                  setLightbox({ img: wikiPanel.img, imgAlt: wikiPanel.imgAlt })
                }
              >
                <img
                  src={wikiPanel.img}
                  alt={wikiPanel.imgAlt || ""}
                  loading="lazy"
                  onError={(e) => {
                    e.target.parentNode.style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    maxHeight: 260,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {wikiPanel.imgAlt && (
                  <div
                    style={{
                      padding: "8px 24px",
                      fontSize: 11,
                      color: TH.dim,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                    }}
                  >
                    {wikiPanel.imgAlt}
                  </div>
                )}
              </div>
            )}
            <div style={{ padding: "20px 24px" }}>
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: `linear-gradient(90deg,${TH.gold},transparent)`,
                  marginBottom: 16,
                }}
                aria-hidden="true"
              />
              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: TH.text,
                  whiteSpace: "pre-wrap",
                }}
              >
                {wikiPanel.wiki.split(/\*\*(.*?)\*\*/).map((part, i) =>
                  i % 2 === 1 ? (
                    <span key={i} style={{ fontWeight: 700, color: TH.gold }}>
                      {part}
                    </span>
                  ) : (
                    <span key={i}>{part}</span>
                  ),
                )}
              </div>
              <div
                style={{
                  width: 40,
                  height: 2,
                  background: `linear-gradient(90deg,${TH.gold},transparent)`,
                  marginTop: 20,
                }}
                aria-hidden="true"
              />
            </div>
      </ModalShell>
      )}
      {eventWiki && (
      <ModalShell
        open
        onClose={() => setEventWiki(null)}
        labelledBy="ewiki-title"
        isMobile={isMobile}
        zIndex={65}
        backdropOpacity={0.75}
        backdropBlur={8}
        panelStyle={{
          ...sty.panel,
          width: isMobile ? "100%" : 680,
          maxWidth: isMobile ? "100vw" : "95vw",
          maxHeight: isMobile ? "95vh" : "90vh",
          overflow: "auto",
          background: TH.panelSolid,
          borderColor: TH.gold,
          display: "flex",
          flexDirection: "column",
          borderRadius: isMobile ? "12px 12px 0 0" : 8,
          WebkitOverflowScrolling: "touch",
        }}
      >
            <div
              style={{
                padding: isMobile ? "16px 16px" : "20px 28px",
                borderBottom: `1px solid ${TH.border}`,
                position: "sticky",
                top: 0,
                background: TH.panelSolid,
                zIndex: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 3,
                    color: TH.dim,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {t("encyclopedia")}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 2,
                    color: TH.gold,
                    textTransform: "uppercase",
                    opacity: 0.6,
                    marginBottom: 6,
                  }}
                >
                  {catName(eventWiki.cat)}
                </div>
                <h2
                  id="ewiki-title"
                  style={{
                    fontSize: isMobile ? 18 : 22,
                    fontWeight: 700,
                    color: TH.gold,
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {dName(eventWiki)}
                </h2>
                <div style={{ fontSize: 12, color: TH.dim, marginTop: 4 }}>
                  {yrf(eventWiki.y1)}
                  {eventWiki.y1 !== eventWiki.y2
                    ? ` — ${yrf(eventWiki.y2)}`
                    : ""}
                </div>
              </div>
              <button
                onClick={() => setEventWiki(null)}
                aria-label={t("closeEnc")}
                style={{
                  background: "none",
                  border: `1px solid ${TH.border}`,
                  borderRadius: 6,
                  width: isMobile ? 44 : 36,
                  height: isMobile ? 44 : 36,
                  color: TH.gold,
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginLeft: 12,
                }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            {eventWiki.img && (
              <div
                style={{
                  borderBottom: `1px solid ${TH.border}`,
                  cursor: "pointer",
                  position: "relative",
                }}
                onClick={() =>
                  setLightbox({ img: eventWiki.img, imgAlt: eventWiki.imgAlt })
                }
              >
                <img
                  src={eventWiki.img}
                  alt={eventWiki.imgAlt || ""}
                  loading="lazy"
                  onError={(e) => {
                    e.target.parentNode.style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    maxHeight: 320,
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                {eventWiki.imgAlt && (
                  <div
                    style={{
                      padding: "8px 28px",
                      fontSize: 11,
                      color: TH.dim,
                      fontStyle: "italic",
                      lineHeight: 1.4,
                      background: `linear-gradient(0deg,${TH.panelSolid} 60%,transparent)`,
                    }}
                  >
                    {eventWiki.imgAlt}
                  </div>
                )}
              </div>
            )}
            <div style={{ padding: "24px 28px" }}>
              <div
                style={{
                  width: 50,
                  height: 2,
                  background: `linear-gradient(90deg,${TH.gold},transparent)`,
                  marginBottom: 20,
                }}
                aria-hidden="true"
              />
              <p
                style={{
                  fontSize: 15,
                  lineHeight: 1.8,
                  color: TH.text,
                  margin: "0 0 20px",
                  fontStyle: "italic",
                  opacity: 0.9,
                }}
              >
                {dDesc(eventWiki)}
              </p>
              {ewArticle && ewArticle.sections ? (
                ewArticle.sections.map((sec, si) => (
                  <div key={si} style={{ marginBottom: 20 }}>
                    {sec.heading && (
                      <h3
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: TH.gold,
                          letterSpacing: 2,
                          textTransform: "uppercase",
                          margin: "28px 0 12px",
                          paddingBottom: 6,
                          borderBottom: `1px solid ${TH.border}`,
                        }}
                      >
                        {sec.heading}
                      </h3>
                    )}
                    <div
                      style={{ fontSize: 14, lineHeight: 1.85, color: TH.text }}
                    >
                      {renderBold(sec.text)}
                    </div>
                    {sec.img && (
                      <div
                        style={{ margin: "16px 0", cursor: "pointer" }}
                        onClick={() =>
                          setLightbox({ img: sec.img, imgAlt: sec.imgAlt })
                        }
                      >
                        <img
                          src={sec.img}
                          alt={sec.imgAlt || ""}
                          loading="lazy"
                          onError={(e) => {
                            e.target.parentNode.style.display = "none";
                          }}
                          style={{
                            width: "100%",
                            maxHeight: 280,
                            objectFit: "cover",
                            borderRadius: 4,
                            display: "block",
                            border: `1px solid ${TH.border}`,
                          }}
                        />
                        {sec.imgAlt && (
                          <div
                            style={{
                              fontSize: 10,
                              color: TH.dim,
                              fontStyle: "italic",
                              marginTop: 6,
                              lineHeight: 1.4,
                            }}
                          >
                            {sec.imgAlt}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 14, lineHeight: 1.85, color: TH.text }}>
                  {dFacts(eventWiki).map((f, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      {renderBold(f)}
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{
                  width: 50,
                  height: 2,
                  background: `linear-gradient(90deg,${TH.gold},transparent)`,
                  margin: "24px 0",
                }}
                aria-hidden="true"
              />
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: 3,
                    color: TH.dim,
                    textTransform: "uppercase",
                    marginBottom: 10,
                  }}
                >
                  {t("keyFacts")}
                </div>
                {dFacts(eventWiki).map((f, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      marginBottom: 7,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        color: TH.gold,
                        fontSize: 10,
                        marginTop: 2,
                        flexShrink: 0,
                      }}
                    >
                      ✦
                    </div>
                    <span
                      style={{ fontSize: 12, lineHeight: 1.6, color: TH.text }}
                    >
                      {f}
                    </span>
                  </div>
                ))}
              </div>
              {eventWiki.locs && eventWiki.locs.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: 3,
                      color: TH.dim,
                      textTransform: "uppercase",
                      marginBottom: 10,
                    }}
                  >
                    {t("relatedLocations")}
                  </div>
                  {eventWiki.locs.map((l, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 6,
                        cursor: l.wiki ? "pointer" : "default",
                        padding: "6px 10px",
                        borderRadius: 4,
                        border: `1px solid ${TH.border}`,
                        background: TH.glow,
                      }}
                      onClick={() => {
                        if (l.wiki) {
                          setEventWiki(null);
                          setWikiPanel({
                            name: l.n,
                            info: l.info,
                            wiki: l.wiki,
                            img: l.img,
                            imgAlt: l.imgAlt,
                          });
                        }
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: TH.gold,
                          boxShadow: `0 0 6px ${TH.gold}`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 12, color: TH.text, flex: 1 }}>
                        {l.n}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: TH.dim,
                          flex: 2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {l.info}
                      </span>
                      {l.wiki && (
                        <span
                          style={{
                            fontSize: 9,
                            color: TH.gold,
                            opacity: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
      </ModalShell>
      )}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: isMobile ? "8px 10px 10px" : "18px 20px 22px",
          background: `linear-gradient(180deg,${theme === "dark" ? "rgba(6,6,15,0.97)" : "rgba(245,240,232,0.97)"} 0%,${theme === "dark" ? "rgba(6,6,15,0.6)" : "rgba(245,240,232,0.6)"} 75%,transparent 100%)`,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 8 : 16,
            }}
          >
            {!isMobile && (
              <div
                style={{
                  width: 60,
                  height: 1,
                  background: `linear-gradient(90deg,transparent,${TH.gold})`,
                }}
                aria-hidden="true"
              />
            )}
            <h1
              style={{
                letterSpacing: isMobile ? 4 : 10,
                fontSize: isMobile ? 15 : 22,
                color: TH.gold,
                fontWeight: 700,
                textTransform: "uppercase",
                textShadow: `0 0 30px rgba(201,168,76,0.4), 0 0 60px rgba(201,168,76,0.15)`,
                margin: 0,
              }}
            >
              Imperivm Romanvm
            </h1>
            {!isMobile && (
              <div
                style={{
                  width: 60,
                  height: 1,
                  background: `linear-gradient(90deg,${TH.gold},transparent)`,
                }}
                aria-hidden="true"
              />
            )}
          </div>
          {!isMobile && (
            <div
              style={{
                fontSize: 9,
                letterSpacing: 4,
                color: TH.dim,
                textTransform: "uppercase",
                marginTop: 4,
                opacity: 0.7,
              }}
            >
              Atlas Interactiva Mvndi Romani · 753 a.C. — 476 d.C.
            </div>
          )}
        </div>
        <div
          style={{
            position: "absolute",
            right: isMobile ? 8 : 16,
            top: isMobile ? 6 : 12,
            display: "flex",
            gap: 6,
            pointerEvents: "auto",
            alignItems: isMobile ? "flex-end" : "flex-start",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {toolbarOpen && (
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                justifyContent: "flex-end",
                animation: "fadeIn 0.2s ease",
                flexDirection: isMobile ? "column" : "row",
                maxHeight: isMobile ? "70vh" : "none",
                overflow: isMobile ? "auto" : "visible",
              }}
            >
              <button
                onClick={() => setSearchOpen((s) => !s)}
                aria-label={t("search")}
                title={t("search")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.panel,
                  fontSize: 13,
                  border: `1px solid ${TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">⌕</span>
              </button>
              <button
                onClick={() => setShowFigures(true)}
                aria-label={t("figuresGallery")}
                title={t("figuresGallery")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.panel,
                  fontSize: 13,
                  border: `1px solid ${TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">🏺</span>
              </button>
              <button
                onClick={() => {
                  setTourActive((prev) => (prev ? null : "select"));
                  if (tourActive) clearTimeout(tourTimerRef.current);
                }}
                aria-label={t("tours")}
                title={t("tours")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: tourActive ? TH.goldDim : TH.panel,
                  fontSize: 13,
                  border: `1px solid ${tourActive ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">🗺️</span>
              </button>
              <button
                onClick={() => {
                  if (quizActive) {
                    setQuizActive(false);
                    setQuizState(null);
                  } else {
                    setQuizActive(true);
                    setQuizState(null);
                  }
                }}
                aria-label={t("quiz")}
                title={t("quiz")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: quizActive ? TH.goldDim : TH.panel,
                  fontSize: 13,
                  border: `1px solid ${quizActive ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">❓</span>
              </button>
              <button
                onClick={() => setAudioOn((a) => !a)}
                aria-label={audioOn ? t("soundOff") : t("soundOn")}
                title={audioOn ? t("soundOff") : t("soundOn")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: audioOn ? TH.goldDim : TH.panel,
                  fontSize: 13,
                  border: `1px solid ${audioOn ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">{audioOn ? "🔊" : "🔇"}</span>
              </button>
              <button
                onClick={() => setMapMode((m) => (m === "3d" ? "2d" : "3d"))}
                aria-label={mapMode === "3d" ? t("mapMode2D") : t("mapMode3D")}
                title={mapMode === "3d" ? t("mapMode2D") : t("mapMode3D")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.panel,
                  fontSize: 11,
                  letterSpacing: 1,
                  border: `1px solid ${TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                {mapMode === "3d" ? "2D" : "3D"}
              </button>
              <button
                onClick={() => setAnimRoutes((v) => !v)}
                aria-label={t("animateRoutes")}
                title={t("animateRoutes")}
                aria-pressed={animRoutes}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: animRoutes ? TH.goldDim : TH.panel,
                  fontSize: 11,
                  letterSpacing: 1,
                  border: `1px solid ${animRoutes ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                ⇄
              </button>
              <button
                onClick={() => setAutoTips((v) => !v)}
                aria-label={t("autoTips")}
                title={t("autoTips")}
                aria-pressed={autoTips}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: autoTips ? TH.goldDim : TH.panel,
                  fontSize: 11,
                  letterSpacing: 1,
                  border: `1px solid ${autoTips ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                💡
              </button>
              <button
                onClick={() => setShowStats((v) => !v)}
                aria-label={showStats ? t("hideStats") : t("showStatsToggle")}
                title={showStats ? t("hideStats") : t("showStatsToggle")}
                aria-pressed={showStats}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: showStats ? TH.goldDim : TH.panel,
                  fontSize: 11,
                  letterSpacing: 1,
                  border: `1px solid ${showStats ? TH.gold : TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                Σ
              </button>
              <button
                onClick={() => setLang(lang === "en" ? "es" : "en")}
                aria-label={t("language")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.panel,
                  fontSize: 11,
                  letterSpacing: 1,
                  border: `1px solid ${TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                {lang === "en" ? "ES" : "EN"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={t("theme")}
                style={{
                  ...sty.panel,
                  padding: isMobile ? "10px 14px" : "5px 10px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.panel,
                  fontSize: 13,
                  border: `1px solid ${TH.border}`,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                <span aria-hidden="true">
                  {theme === "dark" ? "☀" : "☾"}
                </span>
              </button>
              {!isMobile && (
                <button
                  onClick={() => setShowHelp(true)}
                  aria-label={t("shortcuts")}
                  title={t("shortcuts")}
                  style={{
                    ...sty.panel,
                    padding: "5px 10px",
                    cursor: "pointer",
                    color: TH.gold,
                    background: TH.panel,
                    fontSize: 13,
                    border: `1px solid ${TH.border}`,
                  }}
                >
                  <span aria-hidden="true">?</span>
                </button>
              )}
            </div>
          )}
          <button
            onClick={() => setToolbarOpen((o) => !o)}
            aria-label={toolbarOpen ? t("closeToolbar") : t("openToolbar")}
            aria-expanded={toolbarOpen}
            style={{
              ...sty.panel,
              padding: isMobile ? "10px 14px" : "5px 10px",
              cursor: "pointer",
              color: TH.gold,
              background: toolbarOpen ? TH.goldDim : TH.panel,
              fontSize: 13,
              border: `1px solid ${toolbarOpen ? TH.gold : TH.border}`,
              flexShrink: 0,
              transition: "all 0.25s",
              minWidth: isMobile ? 44 : 0,
              minHeight: isMobile ? 44 : 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                display: "inline-block",
                transition: "transform 0.25s",
                transform: toolbarOpen ? "rotate(90deg)" : "none",
              }}
            >
              {toolbarOpen ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </header>
      {searchOpen && (
        <div
          style={
            isMobile
              ? { position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }
              : {
                  position: "absolute",
                  top: 56,
                  right: 16,
                  zIndex: 100,
                  width: 340,
                  maxWidth: "90vw",
                }
          }
        >
          <div
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              padding: 0,
              overflow: "hidden",
              borderRadius: isMobile ? 0 : 8,
            }}
          >
            <div
              style={{
                padding: isMobile ? "12px 16px" : "10px 14px",
                borderBottom: `1px solid ${TH.border}`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ color: TH.gold, fontSize: 14 }}>⌕</span>
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchResults.length > 0)
                    handleSearchSelect(searchResults[0]);
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }
                }}
                placeholder={t("searchPlaceholder")}
                aria-label={t("search")}
                aria-controls="search-results"
                aria-expanded={searchQuery.length >= 2}
                autoFocus
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: TH.text,
                  fontSize: isMobile ? 16 : 13,
                  fontFamily: "Georgia,serif",
                  minHeight: isMobile ? 44 : 0,
                }}
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: TH.dim,
                  cursor: "pointer",
                  fontSize: 14,
                  minWidth: isMobile ? 44 : 0,
                  minHeight: isMobile ? 44 : 0,
                }}
              >
                ✕
              </button>
            </div>
            {searchQuery.length >= 2 && (
              <div
                id="search-results"
                role="listbox"
                aria-label={t("search")}
                style={{
                  maxHeight: isMobile ? "70vh" : 320,
                  overflow: "auto",
                  WebkitOverflowScrolling: "touch",
                }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((r) => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => handleSearchSelect(r)}
                      style={{
                        padding: isMobile ? "14px 16px" : "10px 14px",
                        cursor: "pointer",
                        borderBottom: `1px solid ${TH.border}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "background 0.15s",
                        minHeight: isMobile ? 44 : 0,
                        width: "100%",
                        textAlign: "left",
                        background: "transparent",
                        fontFamily: "inherit",
                        color: "inherit",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = TH.glow)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <span style={{ fontSize: 14 }}>
                        {CATS.find((c) => c.id === r.cat)?.icon || "📜"}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: TH.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.name}
                        </div>
                        <div style={{ fontSize: 9, color: TH.dim }}>
                          {catName(r.cat)} · {yrf(r.y1)}
                          {r.y1 !== r.y2 ? ` — ${yrf(r.y2)}` : ""}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "20px 14px",
                      textAlign: "center",
                      color: TH.dim,
                      fontSize: 12,
                    }}
                  >
                    {t("noResults")}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: isMobile ? 6 : 12,
          left: isMobile ? 8 : 12,
          zIndex: 21,
        }}
      >
        <button
          onClick={() => setSideOpen(!sideOpen)}
          aria-expanded={sideOpen}
          aria-controls="sidebar-nav"
          aria-label={sideOpen ? t("closeNav") : t("openNav")}
          style={{
            ...sty.panel,
            padding: isMobile ? "10px 14px" : "8px 14px",
            cursor: "pointer",
            color: TH.gold,
            background: TH.panel,
            fontSize: 18,
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: isMobile ? 44 : 0,
            minHeight: isMobile ? 44 : 0,
          }}
        >
          <span aria-hidden="true">{sideOpen ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="9,1 3,6 9,11" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="3,1 11,6 3,11" fill="currentColor" />
                          </svg>
                        )}</span>
          {!isMobile && (
            <span style={{ fontSize: 11, letterSpacing: 2 }}>{t("menu")}</span>
          )}
        </button>
      </div>
      {isMobile && !sideOpen && (
        <div
          onClick={() => setSideOpen(true)}
          onTouchStart={sheetTouchStart}
          onTouchMove={(e) => {
            const sd = sheetDrag.current;
            if (!sd.active) return;
            sd.dy = Math.min(0, e.touches[0].clientY - sd.startY);
          }}
          onTouchEnd={(e) => {
            const sd = sheetDrag.current;
            sd.active = false;
            if (sd.dy < -40) setSideOpen(true);
          }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            ...sty.panel,
            borderRadius: "12px 12px 0 0",
            padding: "8px 16px 10px",
            cursor: "pointer",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: TH.border,
              margin: "0 auto 6px",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: TH.gold }}>
              {t("events")} · {catName(cat)}
            </div>
            <span style={{ fontSize: 10, color: TH.dim, marginLeft: 8 }}>
              ▲
            </span>
          </div>
        </div>
      )}
      {sideOpen && (
        <nav
          id="sidebar-nav"
          ref={isMobile ? sideSheetRef : undefined}
          aria-label={t("eventCats")}
          onMouseDown={(e) => e.stopPropagation()}
          style={
            isMobile
              ? {
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxHeight: "65vh",
                  zIndex: 20,
                  ...sty.panel,
                  borderRadius: "12px 12px 0 0",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }
              : {
                  position: "absolute",
                  top: 50,
                  left: 12,
                  bottom: 100,
                  width: 280,
                  zIndex: 10,
                  ...sty.panel,
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }
          }
        >
          {isMobile && (
            <div
              onTouchStart={sheetTouchStart}
              onTouchMove={mkSheetMove(sideSheetRef)}
              onTouchEnd={mkSheetEnd(sideSheetRef, () => setSideOpen(false))}
              style={{
                width: "100%",
                padding: "10px 0 6px",
                cursor: "grab",
                flexShrink: 0,
                touchAction: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: TH.border,
                  margin: "0 auto",
                }}
              />
            </div>
          )}
          <div
            style={{
              padding: isMobile ? "8px 14px 8px" : "12px 14px 8px",
              borderBottom: `1px solid ${TH.border}`,
              flexShrink: 0,
            }}
          >
            <h2
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: TH.dim,
                marginBottom: 6,
                textTransform: "uppercase",
                fontWeight: "normal",
                margin: "0 0 6px 0",
              }}
            >
              {t("categories")}
            </h2>
            <div
              role="tablist"
              aria-label={t("eventCats")}
              style={
                isMobile
                  ? {
                      display: "flex",
                      gap: 4,
                      overflowX: "auto",
                      WebkitOverflowScrolling: "touch",
                      paddingBottom: 4,
                      scrollbarWidth: "none",
                    }
                  : { display: "flex", flexWrap: "wrap", gap: 3 }
              }
            >
              {CATS.map((c) => (
                <button
                  key={c.id}
                  role="tab"
                  aria-selected={cat === c.id}
                  onClick={() => {
                    setCat(c.id);
                    setPlaying(false);
                    setSel((prev) => {
                      const cur = findItem(prev);
                      return cur && cur.cat === c.id ? prev : null;
                    });
                    setWikiPanel(null);
                    setEventWiki(null);
                  }}
                  style={{
                    ...sty.btn(cat === c.id),
                    padding: isMobile ? "6px 10px" : "4px 8px",
                    fontSize: isMobile ? 11 : 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    minHeight: isMobile ? 36 : 0,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: 12 }}>
                    {c.icon}
                  </span>
                  <span>{catName(c.id).split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
          <div
            role="tabpanel"
            aria-label={catName(cat) + " " + t("events")}
            style={{
              flex: 1,
              overflow: "auto",
              padding: "6px 10px",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <h3
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: TH.dim,
                marginBottom: 6,
                textTransform: "uppercase",
                padding: "0 4px",
                fontWeight: "normal",
                margin: "0 0 6px 0",
              }}
            >
              {catName(cat)} ({items.length})
            </h3>
            <div role="listbox" aria-label={t("events")}>
              {items.map((it) => (
                <button
                  key={it.id}
                  ref={(el) => {
                    if (sel === it.id) selItemRef.current = el;
                  }}
                  role="option"
                  aria-selected={sel === it.id}
                  onClick={() => {
                    setSel(it.id === sel ? null : it.id);
                    setPlaying(false);
                    setWikiPanel(null);
                    setEventWiki(null);
                    if (isMobile) setSideOpen(false);
                  }}
                  onMouseEnter={() => setHover(it.id)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    ...sty.btn(sel === it.id),
                    width: "100%",
                    marginBottom: 3,
                    padding: isMobile ? "12px 14px" : "8px 10px",
                    display: "block",
                    background:
                      sel === it.id
                        ? TH.goldDim
                        : hover === it.id
                          ? TH.glow
                          : "transparent",
                    border: `1px solid ${sel === it.id ? TH.gold : hover === it.id ? TH.border : "transparent"}`,
                    minHeight: isMobile ? 44 : 0,
                  }}
                >
                  <div
                    style={{ display: "flex", gap: 8, alignItems: "center" }}
                  >
                    {it.img && (
                      <img
                        src={it.img}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightbox({ img: it.img, imgAlt: it.imgAlt });
                        }}
                        style={{
                          width: 40,
                          height: 28,
                          objectFit: "cover",
                          borderRadius: 3,
                          flexShrink: 0,
                          cursor: "pointer",
                        }}
                      />
                    )}
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: sel === it.id ? TH.gold : TH.text,
                          marginBottom: 1,
                        }}
                      >
                        {dName(it)}
                      </div>
                      <div style={{ fontSize: 9, color: TH.dim }}>
                        {yrf(it.y1)}
                        {it.y1 !== it.y2 ? ` — ${yrf(it.y2)}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </nav>
      )}
      {isMobile && selData && !wikiPanel && !eventWiki && detailMin && (
        <div
          onClick={() => setDetailMin(false)}
          onTouchStart={sheetTouchStart}
          onTouchMove={(e) => {
            const sd = sheetDrag.current;
            if (!sd.active) return;
            sd.dy = Math.min(0, e.touches[0].clientY - sd.startY);
          }}
          onTouchEnd={(e) => {
            const sd = sheetDrag.current;
            sd.active = false;
            if (sd.dy < -40) setDetailMin(false);
          }}
          style={{
            position: "fixed",
            bottom: 80,
            left: 0,
            right: 0,
            zIndex: 15,
            ...sty.panel,
            borderRadius: "12px 12px 0 0",
            padding: "8px 16px 10px",
            cursor: "pointer",
            touchAction: "none",
          }}
        >
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: TH.border,
              margin: "0 auto 6px",
            }}
          />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: TH.gold,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {dName(selData)}
            </div>
            <span style={{ fontSize: 10, color: TH.dim, marginLeft: 8 }}>
              ▲
            </span>
          </div>
        </div>
      )}
      {selData && !wikiPanel && !eventWiki && (!isMobile || !detailMin) && (
        <aside
          ref={isMobile ? detailSheetRef : undefined}
          aria-label={`${dName(selData)}`}
          onMouseDown={(e) => e.stopPropagation()}
          style={
            isMobile
              ? {
                  position: "fixed",
                  bottom: 80,
                  left: 0,
                  right: 0,
                  maxHeight: "45vh",
                  zIndex: 15,
                  ...sty.panel,
                  borderRadius: "12px 12px 0 0",
                  overflow: "auto",
                  WebkitOverflowScrolling: "touch",
                }
              : {
                  position: "absolute",
                  top: 50,
                  right: 12,
                  width: 290,
                  maxHeight: "calc(100vh - 170px)",
                  zIndex: 10,
                  ...sty.panel,
                  overflow: "auto",
                }
          }
        >
          {isMobile && (
            <div
              onTouchStart={sheetTouchStart}
              onTouchMove={mkSheetMove(detailSheetRef)}
              onTouchEnd={mkSheetEnd(detailSheetRef, () => setDetailMin(true))}
              style={{
                width: "100%",
                padding: "10px 0 6px",
                cursor: "grab",
                flexShrink: 0,
                touchAction: "none",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: TH.border,
                  margin: "0 auto",
                }}
              />
            </div>
          )}
          <div
            style={{
              padding: "14px 16px",
              borderBottom: `1px solid ${TH.border}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: 3,
                    color: TH.dim,
                    textTransform: "uppercase",
                    marginBottom: 3,
                  }}
                >
                  {catName(selData.cat)}
                </div>
                <h2
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: TH.gold,
                    lineHeight: 1.3,
                    margin: 0,
                  }}
                >
                  {dName(selData)}
                </h2>
                <div style={{ fontSize: 11, color: TH.dim, marginTop: 3 }}>
                  {yrf(selData.y1)}
                  {selData.y1 !== selData.y2 ? ` — ${yrf(selData.y2)}` : ""}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              >
                <button
                  onClick={handleShare}
                  title={t("share")}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    width: isMobile ? 44 : 26,
                    height: isMobile ? 44 : 26,
                    color: TH.gold,
                    cursor: "pointer",
                    fontSize: isMobile ? 14 : 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ↗
                </button>
                <button
                  onClick={handleDownloadImage}
                  title={t("downloadImage")}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    width: isMobile ? 44 : 26,
                    height: isMobile ? 44 : 26,
                    color: TH.gold,
                    cursor: "pointer",
                    fontSize: isMobile ? 14 : 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ⤓
                </button>
              </div>
            </div>
          </div>
          {selData.img && (
            <div
              style={{
                borderBottom: `1px solid ${TH.border}`,
                cursor: "pointer",
              }}
              onClick={() => setEventWiki(selData)}
            >
              <img
                src={selData.img}
                alt={selData.imgAlt || ""}
                loading="lazy"
                onError={(e) => {
                  e.target.parentNode.style.display = "none";
                }}
                style={{
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  display: "block",
                }}
              />
              {selData.imgAlt && (
                <div
                  style={{
                    padding: "6px 16px",
                    fontSize: 10,
                    color: TH.dim,
                    fontStyle: "italic",
                    lineHeight: 1.4,
                  }}
                >
                  {selData.imgAlt}
                </div>
              )}
            </div>
          )}
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${TH.border}`,
              cursor: "pointer",
            }}
            onClick={() => setEventWiki(selData)}
          >
            <p
              style={{
                fontSize: 12,
                lineHeight: 1.6,
                color: TH.text,
                margin: 0,
              }}
            >
              {dDesc(selData)}
            </p>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1,
                color: TH.gold,
                opacity: 0.6,
                marginTop: 6,
              }}
            >
              {t("readMore")} →
            </div>
          </div>
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${TH.border}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: TH.dim,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {t("locations")}{" "}
              <span style={{ opacity: 0.5 }}>{t("clickMap")}</span>
            </div>
            {selData.locs.map((l, i) => {
              const trig = getTriggerYears(selData),
                vis = year >= trig.locs[i].ty;
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    const ty = trig.locs[i].ty;
                    setYear(ty);
                    setPlaying(false);
                    if (l.wiki)
                      setWikiPanel({
                        name: l.n,
                        info: l.info,
                        wiki: l.wiki,
                        img: l.img,
                        imgAlt: l.imgAlt,
                      });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 5,
                    opacity: vis ? 1 : 0.3,
                    cursor: l.wiki ? "pointer" : "default",
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    fontFamily: "inherit",
                    color: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: vis ? TH.gold : TH.dim,
                      boxShadow: vis ? `0 0 6px ${TH.gold}` : "none",
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 11, color: vis ? TH.text : TH.dim }}>
                    {l.n}
                  </span>
                  {l.wiki && vis && (
                    <span
                      style={{
                        fontSize: 9,
                        color: TH.gold,
                        opacity: 0.5,
                        marginLeft: "auto",
                      }}
                    >
                      →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selData.paths.length > 0 && (
            <div
              style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${TH.border}`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 3,
                  color: TH.dim,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {t("routes")}
              </div>
              {selData.paths.map((p, i) => {
                const trig = getTriggerYears(selData),
                  vis = year >= trig.paths[i]?.ty;
                const getLocWiki = (lat, lng) =>
                  selData.locs.find(
                    (l) =>
                      Math.abs(l.lat - lat) < 2 && Math.abs(l.lng - lng) < 2,
                  ) || null;
                const from = getLocWiki(p[0], p[1]),
                  to = getLocWiki(p[2], p[3]);
                const wikiText =
                  p[5] ||
                  [
                    `**${p[4] || t("route")}**`,
                    from ? `\n\n${t("origin")} — ${from.n}: ${from.info}` : "",
                    to ? `\n\n${t("destination")} — ${to.n}: ${to.info}` : "",
                    `\n\n${dDesc(selData)}`,
                    from?.wiki ? `\n\n${from.wiki}` : "",
                    to?.wiki ? `\n\n${to.wiki}` : "",
                  ].join("");
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (vis) {
                        const ty = trig.paths[i]?.ty;
                        if (ty !== undefined) {
                          setYear(ty);
                          setPlaying(false);
                        }
                        setWikiPanel({
                          name: p[4] || t("route"),
                          info: from && to ? `${from.n} → ${to.n}` : t("route"),
                          wiki: wikiText,
                          img: from?.img || to?.img,
                          imgAlt: from?.imgAlt || to?.imgAlt,
                        });
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      marginBottom: 5,
                      opacity: vis ? 1 : 0.3,
                      cursor: vis ? "pointer" : "default",
                    }}
                  >
                    <span
                      style={{
                        color: vis ? TH.red : TH.dim,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      →
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        color: vis ? TH.text : TH.dim,
                        lineHeight: 1.4,
                        flex: 1,
                      }}
                    >
                      {p[4] || t("route")}
                    </span>
                    {vis && (
                      <span
                        style={{
                          fontSize: 9,
                          color: TH.gold,
                          opacity: 0.5,
                          flexShrink: 0,
                        }}
                      >
                        →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ padding: "12px 16px" }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 3,
                color: TH.dim,
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {t("keyFacts")}
            </div>
            {dFacts(selData).map((f, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 7,
                  marginBottom: 6,
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    color: TH.gold,
                    fontSize: 10,
                    marginTop: 1,
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <span style={{ fontSize: 11, lineHeight: 1.5, color: TH.text }}>
                  {f}
                </span>
              </div>
            ))}
          </div>
        </aside>
      )}
      {showStats &&
        selData &&
        (() => {
          const st = interpStats(year);
          if (!st) return null;
          return (
            <div
              style={{
                position: "absolute",
                bottom: isMobile ? 150 : 110,
                right: 12,
                zIndex: 9,
                ...sty.panel,
                background: TH.panelSolid,
                padding: "10px 14px",
                width: isMobile ? 150 : 180,
                opacity: 0.9,
              }}
            >
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: 2,
                  color: TH.dim,
                  textTransform: "uppercase",
                  marginBottom: 6,
                }}
              >
                {t("stats")}
              </div>
              {[
                [t("population"), fmtNum(st.population)],
                [t("territoryArea"), fmtNum(st.territory_km2) + " km²"],
                [t("legions"), String(st.legions)],
                [t("roads"), fmtNum(st.roads_km) + " km"],
              ].map(([label, val], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 10, color: TH.dim }}>{label}</span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: TH.gold,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          );
        })()}
      <div
        role="region"
        aria-label={t("timeline")}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: isMobile ? 16 : 10,
          background: `linear-gradient(0deg,${theme === "dark" ? "rgba(6,6,15,0.97)" : "rgba(245,240,232,0.97)"} 60%,transparent 100%)`,
          padding: isMobile ? "10px 10px 8px" : "26px 24px 14px",
          paddingBottom: isMobile
            ? "max(8px, env(safe-area-inset-bottom))"
            : "14px",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {selData ? (
            (() => {
              const mn = selData.y1,
                mx = selData.y1 === selData.y2 ? selData.y1 + 1 : selData.y2,
                pad = Math.max(Math.round((mx - mn) * 0.08), 1),
                slMin = mn - pad,
                slMax = mx + pad,
                pct = (v) =>
                  Math.max(
                    0,
                    Math.min(100, ((v - slMin) / (slMax - slMin)) * 100),
                  ),
                tPct = (v) =>
                  Math.max(0, Math.min(100, ((v - mn) / (mx - mn)) * 100)),
                relEras = ERAS.map((e, ei) => ({
                  ...e,
                  tl: t(ERA_I18N_KEYS[ei]),
                })).filter((e) => e.y >= slMin && e.y <= slMax),
                canPlay = selData.y1 !== selData.y2;
              return (
                <>
                  {!isMobile && (
                    <div
                      style={{
                        position: "relative",
                        height: 16,
                        marginBottom: 4,
                      }}
                    >
                      {relEras.map((e, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setYear(e.y);
                            setPlaying(false);
                          }}
                          style={{
                            position: "absolute",
                            left: `${pct(e.y)}%`,
                            fontSize: 8,
                            letterSpacing: 1.5,
                            color: year >= e.y ? TH.gold : TH.dim,
                            textTransform: "uppercase",
                            transform: "translateX(-50%)",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            transition: "color 0.2s, text-shadow 0.2s",
                          }}
                          onMouseEnter={(ev) =>
                            (ev.currentTarget.style.textShadow = `0 0 8px rgba(201,168,76,0.6)`)
                          }
                          onMouseLeave={(ev) =>
                            (ev.currentTarget.style.textShadow = "none")
                          }
                        >
                          {e.tl}
                        </div>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: isMobile ? 6 : 10,
                    }}
                  >
                    {canPlay && (
                      <button
                        onClick={handlePlay}
                        aria-label={playing ? t("pause") : t("play")}
                        style={{
                          background: "none",
                          border: `1px solid ${TH.gold}`,
                          borderRadius: "50%",
                          width: isMobile ? 44 : 32,
                          height: isMobile ? 44 : 32,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: TH.gold,
                          fontSize: 14,
                          flexShrink: 0,
                          boxShadow: playing
                            ? `0 0 12px rgba(201,168,76,0.3)`
                            : "none",
                        }}
                      >
                        {playing ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <rect x="2" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                            <rect x="7" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="3,1 11,6 3,11" fill="currentColor" />
                          </svg>
                        )}
                      </button>
                    )}
                    {!isMobile && (
                      <span
                        style={{
                          fontSize: 10,
                          color: TH.dim,
                          whiteSpace: "nowrap",
                          minWidth: 48,
                          textAlign: "right",
                        }}
                      >
                        {yrf(mn)}
                      </span>
                    )}
                    <div style={{ position: "relative", flex: 1 }}>
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          right: 0,
                          height: 2,
                          background: TH.border,
                          transform: "translateY(-50%)",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: 0,
                          height: 2,
                          background: `linear-gradient(90deg,${TH.red},${TH.gold})`,
                          transform: "translateY(-50%)",
                          width: `${tPct(Math.min(year, mx))}%`,
                          transition: "width 0.1s",
                        }}
                      />
                      {getTriggerYears(selData).locs.map((l, i) => (
                        <div
                          key={i}
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: `${tPct(l.ty)}%`,
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: year >= l.ty ? TH.gold : TH.dim,
                            border: `1px solid ${year >= l.ty ? TH.gold : TH.border}`,
                            transform: "translate(-50%,-50%)",
                            zIndex: 2,
                            boxShadow:
                              year >= l.ty ? `0 0 6px ${TH.gold}` : "none",
                          }}
                        />
                      ))}
                      {canPlay && (
                        <input
                          type="range"
                          id="timeline-controls"
                          min={mn}
                          max={mx}
                          value={Math.max(mn, Math.min(mx, year))}
                          onChange={(e) => {
                            setYear(+e.target.value);
                            setPlaying(false);
                          }}
                          aria-label={`${t("timeline")}: ${yrf(year)}`}
                          aria-valuemin={mn}
                          aria-valuemax={mx}
                          aria-valuenow={year}
                          aria-valuetext={yrf(year)}
                          style={{
                            width: "100%",
                            appearance: "none",
                            WebkitAppearance: "none",
                            background: "transparent",
                            cursor: "pointer",
                            position: "relative",
                            height: isMobile ? 32 : 20,
                            zIndex: 3,
                          }}
                        />
                      )}
                    </div>
                    {!isMobile && (
                      <span
                        style={{
                          fontSize: 10,
                          color: TH.dim,
                          whiteSpace: "nowrap",
                          minWidth: 48,
                        }}
                      >
                        {yrf(mx === mn + 1 ? mn : mx)}
                      </span>
                    )}
                    {canPlay && !isMobile && (
                      <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                        {[1, 2, 5].map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            aria-label={`${t("speed")} ${s}x`}
                            aria-pressed={speed === s}
                            style={{
                              background:
                                speed === s ? TH.goldDim : "transparent",
                              border: `1px solid ${speed === s ? TH.gold : TH.border}`,
                              borderRadius: 4,
                              padding: "2px 6px",
                              color: speed === s ? TH.gold : TH.dim,
                              cursor: "pointer",
                              fontSize: 10,
                              fontFamily: "Georgia,serif",
                            }}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div
                    style={{ textAlign: "center", marginTop: isMobile ? 3 : 6 }}
                  >
                    <span
                      style={{
                        fontSize: isMobile ? 16 : 20,
                        fontWeight: 700,
                        color: TH.gold,
                        letterSpacing: 2,
                        textShadow: `0 0 15px rgba(201,168,76,0.4)`,
                      }}
                    >
                      {yrf(year)}
                    </span>
                    <div
                      style={{
                        fontSize: isMobile ? 9 : 10,
                        color: TH.dim,
                        marginTop: 2,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                      }}
                    >
                      {dName(selData)}
                      {playing ? (
                        <span
                          style={{ color: TH.red, marginLeft: 8 }}
                          role="status"
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: TH.red,
                              marginRight: 6,
                              verticalAlign: "middle",
                            }}
                          />
                          {t("playing")}
                        </span>
                      ) : (
                        ""
                      )}
                    </div>
                    <div
                      aria-live="polite"
                      className="sr-only"
                    >{`${dName(selData)}, ${yrf(year)}${playing ? ` — ${t("playing")}` : ""}`}</div>
                  </div>
                </>
              );
            })()
          ) : (
            <div
              id="timeline-controls"
              tabIndex={-1}
              style={{
                textAlign: "center",
                padding: isMobile ? "6px 0" : "12px 0",
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 10 : 12,
                  color: TH.dim,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                }}
              >
                {t("selectEvt")}
              </div>
              {!isMobile && (
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: TH.gold,
                    letterSpacing: 2,
                    marginTop: 6,
                    textShadow: `0 0 15px rgba(201,168,76,0.4)`,
                    opacity: 0.5,
                  }}
                >
                  SPQR
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:${isMobile ? 24 : 16}px;height:${isMobile ? 24 : 16}px;border-radius:50%;background:${TH.gold};border:2px solid ${TH.bg};box-shadow:0 0 10px rgba(201,168,76,0.5);cursor:pointer;position:relative;z-index:4;margin-top:${isMobile ? -11 : -7}px}input[type=range]::-moz-range-thumb{width:${isMobile ? 24 : 16}px;height:${isMobile ? 24 : 16}px;border-radius:50%;background:${TH.gold};border:2px solid ${TH.bg};box-shadow:0 0 10px rgba(201,168,76,0.5);cursor:pointer}input[type=range]::-webkit-slider-runnable-track{height:2px;background:transparent}input[type=range]::-moz-range-track{height:2px;background:transparent}*::-webkit-scrollbar{width:4px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:${TH.border};border-radius:2px}[role=tablist]::-webkit-scrollbar{display:none}@keyframes fadeIn{from{opacity:0;transform:translate(-50%,-100%) translateY(-20px)}to{opacity:1;transform:translate(-50%,-100%) translateY(-14px)}}@keyframes lbIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
      {lightbox && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            cursor: "pointer",
            animation: "lbIn 0.2s ease",
          }}
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={lightbox.imgAlt || t("image")}
        >
          <img
            src={lightbox.img}
            alt={lightbox.imgAlt || ""}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: isMobile ? "95vw" : "90vw",
              maxHeight: isMobile ? "70vh" : "80vh",
              objectFit: "contain",
              borderRadius: 6,
              boxShadow: `0 4px 60px rgba(0,0,0,0.6), 0 0 30px rgba(201,168,76,0.15)`,
              cursor: "default",
            }}
          />
          {lightbox.imgAlt && (
            <div
              style={{
                maxWidth: "80vw",
                marginTop: 14,
                padding: "10px 20px",
                fontSize: 13,
                color: "#e0d6c2",
                fontStyle: "italic",
                lineHeight: 1.5,
                textAlign: "center",
                background: "rgba(0,0,0,0.4)",
                borderRadius: 6,
                border: "1px solid rgba(201,168,76,0.2)",
              }}
            >
              {lightbox.imgAlt}
            </div>
          )}
          <button
            onClick={() => setLightbox(null)}
            aria-label={t("closeLightbox")}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: "rgba(0,0,0,0.5)",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "50%",
              width: 44,
              height: 44,
              color: "#c9a84c",
              cursor: "pointer",
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
      )}
      {showHelp && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 210,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(6px)",
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              width: isMobile ? "100%" : 420,
              maxWidth: isMobile ? "100vw" : "90vw",
              padding: 0,
              borderColor: TH.gold,
              borderRadius: isMobile ? "12px 12px 0 0" : 8,
            }}
          >
            <div
              style={{
                padding: "20px 24px 12px",
                borderBottom: `1px solid ${TH.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: TH.gold,
                  margin: 0,
                  letterSpacing: 2,
                }}
              >
                {t("shortcuts")}
              </h2>
              <button
                onClick={() => setShowHelp(false)}
                style={{
                  background: "none",
                  border: `1px solid ${TH.border}`,
                  borderRadius: 6,
                  width: isMobile ? 44 : 28,
                  height: isMobile ? 44 : 28,
                  color: TH.gold,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div style={{ padding: "16px 24px 20px" }}>
              {[
                ["Space", t("shortcutPlay")],
                ["← →", t("shortcutScrub")],
                ["⇧ + ← →", t("shortcutFastScrub")],
                ["Escape", t("shortcutClose")],
                ["/", t("shortcutSearch")],
                ["?", t("shortcutHelp")],
              ].map(([key, desc], i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: i < 5 ? `1px solid ${TH.border}` : "none",
                  }}
                >
                  <span style={{ fontSize: 12, color: TH.text }}>{desc}</span>
                  <kbd
                    style={{
                      background: TH.goldDim,
                      border: `1px solid ${TH.border}`,
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      color: TH.gold,
                      fontFamily: "monospace",
                      minWidth: 36,
                      textAlign: "center",
                    }}
                  >
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {quizActive && !quizState && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 210,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setQuizActive(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              width: isMobile ? "100%" : 420,
              maxWidth: isMobile ? "100vw" : "90vw",
              padding: isMobile ? "24px 20px" : "30px 36px",
              textAlign: "center",
              borderColor: TH.gold,
              borderRadius: isMobile ? "12px 12px 0 0" : 8,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏛️</div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: TH.gold,
                margin: "0 0 8px",
              }}
            >
              {t("quiz")}
            </h2>
            <p
              style={{
                fontSize: 13,
                color: TH.text,
                lineHeight: 1.6,
                marginBottom: 20,
                opacity: 0.8,
              }}
            >
              10{" "}
              {lang === "es"
                ? "preguntas sobre la historia de Roma"
                : "questions about Roman history"}
            </p>
            <button
              onClick={startQuiz}
              style={{
                ...sty.panel,
                padding: "12px 30px",
                cursor: "pointer",
                color: TH.gold,
                background: TH.goldDim,
                fontSize: 14,
                fontWeight: 700,
                border: `1px solid ${TH.gold}`,
                letterSpacing: 1,
              }}
            >
              {t("startQuiz")}
            </button>
          </div>
        </div>
      )}
      {quizActive &&
        quizState &&
        !quizState.showResult &&
        (() => {
          const q = quizState.questions[quizState.current];
          if (!q) return null;
          return (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 210,
                display: "flex",
                alignItems: isMobile ? "flex-end" : "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.8)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  ...sty.panel,
                  background: TH.panelSolid,
                  width: isMobile ? "100%" : 520,
                  maxWidth: isMobile ? "100vw" : "95vw",
                  padding: 0,
                  borderColor: TH.gold,
                  borderRadius: isMobile ? "12px 12px 0 0" : 8,
                }}
              >
                <div
                  style={{
                    padding: "16px 24px",
                    borderBottom: `1px solid ${TH.border}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 11, color: TH.dim }}>
                    {t("quizRound")} {quizState.current + 1} {t("quizOf")}{" "}
                    {quizState.questions.length}
                  </span>
                  <span style={{ fontSize: 11, color: TH.gold }}>
                    {t("quizScore")}: {quizState.score}
                  </span>
                </div>
                <div style={{ padding: "24px 28px" }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: TH.dim,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      marginBottom: 6,
                    }}
                  >
                    {q.type === "date"
                      ? t("questionDate")
                      : q.type === "who"
                        ? t("questionWho")
                        : q.type === "category"
                          ? t("questionMatch")
                          : t("questionDate")}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: TH.gold,
                      marginBottom: 20,
                      lineHeight: 1.4,
                    }}
                  >
                    {q.context}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {(q.type === "category" ? q.options : [...q.options]).map(
                      (opt, oi) => {
                        const val = q.type === "category" ? opt.id : opt;
                        const label =
                          q.type === "category"
                            ? `${opt.icon} ${opt.label}`
                            : q.type === "date"
                              ? yrf(+opt)
                              : opt;
                        const isAnswered = quizState.answered !== null;
                        const isSelected = quizState.answered === val;
                        const isCorrect = val === q.correct;
                        const bg = isAnswered
                          ? isCorrect
                            ? "rgba(34,139,34,0.25)"
                            : isSelected
                              ? "rgba(196,30,58,0.25)"
                              : "transparent"
                          : "transparent";
                        const bdr = isAnswered
                          ? isCorrect
                            ? `2px solid rgba(34,139,34,0.7)`
                            : isSelected
                              ? `2px solid rgba(196,30,58,0.7)`
                              : `1px solid ${TH.border}`
                          : `1px solid ${TH.border}`;
                        return (
                          <button
                            key={oi}
                            onClick={() => answerQuiz(val)}
                            disabled={isAnswered}
                            style={{
                              padding: isMobile ? "14px 14px" : "12px 14px",
                              background: bg,
                              border: bdr,
                              borderRadius: 6,
                              color:
                                isAnswered && isCorrect ? "#22bb22" : TH.text,
                              cursor: isAnswered ? "default" : "pointer",
                              fontSize: 13,
                              fontFamily: "Georgia,serif",
                              textAlign: "center",
                              transition: "all 0.2s",
                              minHeight: isMobile ? 44 : 0,
                            }}
                          >
                            {label}
                          </button>
                        );
                      },
                    )}
                  </div>
                  {quizState.answered !== null && (
                    <div style={{ marginTop: 16, textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color:
                            quizState.answered === q.correct
                              ? "#22bb22"
                              : TH.red,
                          marginBottom: 8,
                        }}
                      >
                        {quizState.answered === q.correct
                          ? t("correct")
                          : t("incorrect")}
                      </div>
                      <button
                        onClick={nextQuizQuestion}
                        style={{
                          ...sty.panel,
                          padding: "8px 24px",
                          cursor: "pointer",
                          color: TH.gold,
                          background: TH.goldDim,
                          fontSize: 12,
                          border: `1px solid ${TH.gold}`,
                        }}
                      >
                        {quizState.current < quizState.questions.length - 1
                          ? t("nextQuestion")
                          : t("quizComplete")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      {quizActive && quizState && quizState.showResult && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 210,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => {
            setQuizActive(false);
            setQuizState(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              width: isMobile ? "100%" : 420,
              maxWidth: isMobile ? "100vw" : "90vw",
              padding: isMobile ? "24px 20px" : "30px 36px",
              textAlign: "center",
              borderColor: TH.gold,
              borderRadius: isMobile ? "12px 12px 0 0" : 8,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>
              {quizState.score >= 8
                ? "🏆"
                : quizState.score >= 5
                  ? "🎖️"
                  : "📚"}
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: TH.gold,
                margin: "0 0 8px",
              }}
            >
              {t("quizComplete")}
            </h2>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color:
                  quizState.score >= 8
                    ? "#22bb22"
                    : quizState.score >= 5
                      ? TH.gold
                      : TH.red,
                margin: "12px 0",
              }}
            >
              {quizState.score} / {quizState.questions.length}
            </div>
            <p
              style={{
                fontSize: 13,
                color: TH.text,
                opacity: 0.7,
                marginBottom: 20,
              }}
            >
              {quizState.score >= 8
                ? lang === "es"
                  ? "¡Magistral! Digno de un cónsul."
                  : "Masterful! Worthy of a consul."
                : quizState.score >= 5
                  ? lang === "es"
                    ? "Buen conocimiento del mundo romano."
                    : "Good knowledge of the Roman world."
                  : lang === "es"
                    ? "¡Sigue estudiando la historia de Roma!"
                    : "Keep studying Roman history!"}
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => {
                  setQuizState(null);
                  startQuiz();
                }}
                style={{
                  ...sty.panel,
                  padding: "10px 24px",
                  cursor: "pointer",
                  color: TH.gold,
                  background: TH.goldDim,
                  fontSize: 13,
                  border: `1px solid ${TH.gold}`,
                }}
              >
                {t("tryAgain")}
              </button>
              <button
                onClick={() => {
                  setQuizActive(false);
                  setQuizState(null);
                }}
                style={{
                  ...sty.panel,
                  padding: "10px 24px",
                  cursor: "pointer",
                  color: TH.dim,
                  background: "transparent",
                  fontSize: 13,
                  border: `1px solid ${TH.border}`,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      {tourActive === "select" && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 205,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setTourActive(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              width: isMobile ? "100%" : 560,
              maxWidth: isMobile ? "100vw" : "95vw",
              maxHeight: isMobile ? "85vh" : "80vh",
              overflow: "auto",
              borderColor: TH.gold,
              padding: 0,
              borderRadius: isMobile ? "12px 12px 0 0" : 8,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                padding: "20px 24px 12px",
                borderBottom: `1px solid ${TH.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: TH.panelSolid,
                zIndex: 1,
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: TH.gold,
                  margin: 0,
                }}
              >
                {t("tours")}
              </h2>
              <button
                onClick={() => setTourActive(null)}
                style={{
                  background: "none",
                  border: `1px solid ${TH.border}`,
                  borderRadius: 6,
                  width: isMobile ? 44 : 32,
                  height: isMobile ? 44 : 32,
                  color: TH.gold,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div style={{ padding: 16 }}>
              {(typeof TOURS !== "undefined" ? TOURS : []).map((tour) => (
                <div
                  key={tour.id}
                  onClick={() => startTour(tour)}
                  style={{
                    ...sty.panel,
                    padding: "16px 18px",
                    marginBottom: 10,
                    cursor: "pointer",
                    border: `1px solid ${TH.border}`,
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = TH.gold)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = TH.border)
                  }
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: TH.gold,
                      marginBottom: 4,
                    }}
                  >
                    {lang === "es" && tour.name_es ? tour.name_es : tour.name}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: TH.text,
                      lineHeight: 1.5,
                      opacity: 0.8,
                    }}
                  >
                    {lang === "es" && tour.desc_es ? tour.desc_es : tour.desc}
                  </div>
                  <div style={{ fontSize: 9, color: TH.dim, marginTop: 6 }}>
                    {tour.steps.length} {t("steps") || "steps"} ·{" "}
                    {t("startTour")} →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tourActive &&
        typeof tourActive !== "string" &&
        (() => {
          const step = tourActive.steps[tourStep];
          if (!step) return null;
          const narr =
            lang === "es" && step.narration_es
              ? step.narration_es
              : step.narration;
          return (
            <div
              style={{
                position: "fixed",
                bottom: isMobile ? 70 : 100,
                left: isMobile ? 8 : "50%",
                right: isMobile ? 8 : "auto",
                transform: isMobile ? "none" : "translateX(-50%)",
                zIndex: 100,
                width: isMobile ? "auto" : 700,
                maxWidth: isMobile ? "none" : "90vw",
              }}
            >
              <div
                style={{
                  ...sty.panel,
                  background: TH.panelSolid,
                  padding: isMobile ? "12px 14px" : "14px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? 10 : 14,
                }}
              >
                <button
                  onClick={() => setTourPaused((p) => !p)}
                  aria-label={tourPaused ? t("resumeTour") : t("pauseTour")}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    width: isMobile ? 44 : 28,
                    height: isMobile ? 44 : 28,
                    color: TH.gold,
                    cursor: "pointer",
                    fontSize: 11,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {tourPaused ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="3,1 11,6 3,11" fill="currentColor" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <rect x="2" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                            <rect x="7" y="1" width="3" height="10" rx="0.5" fill="currentColor" />
                          </svg>
                        )}
                </button>
                <button
                  onClick={() => advanceTour(-1)}
                  disabled={tourStep === 0}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    width: isMobile ? 44 : 28,
                    height: isMobile ? 44 : 28,
                    color: tourStep === 0 ? TH.dim : TH.gold,
                    cursor: tourStep === 0 ? "default" : "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="9,1 3,6 9,11" fill="currentColor" />
                          </svg>
                        )
                </button>
                <div style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: TH.text,
                      fontStyle: "italic",
                    }}
                  >
                    {narr}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 4,
                      marginTop: 8,
                    }}
                  >
                    {tourActive.steps.map((_, i) => (
                      <div
                        key={i}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: i === tourStep ? TH.gold : TH.border,
                          transition: "background 0.2s",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 9, color: TH.dim, marginTop: 4 }}>
                    {lang === "es" && tourActive.name_es
                      ? tourActive.name_es
                      : tourActive.name}{" "}
                    · {tourStep + 1} {t("tourOf")} {tourActive.steps.length}
                  </div>
                </div>
                <button
                  onClick={() => advanceTour(1)}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    width: isMobile ? 44 : 28,
                    height: isMobile ? 44 : 28,
                    color: TH.gold,
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  (
                          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                            <polygon points="3,1 11,6 3,11" fill="currentColor" />
                          </svg>
                        )
                </button>
                <button
                  onClick={() => {
                    setTourActive(null);
                    clearTimeout(tourTimerRef.current);
                  }}
                  style={{
                    background: "none",
                    border: `1px solid ${TH.border}`,
                    borderRadius: 4,
                    padding: isMobile ? "10px 14px" : "4px 10px",
                    color: TH.red,
                    cursor: "pointer",
                    fontSize: isMobile ? 12 : 10,
                    flexShrink: 0,
                    minHeight: isMobile ? 44 : 0,
                  }}
                >
                  {t("exitTour")}
                </button>
              </div>
            </div>
          );
        })()}
      {showFigures && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 205,
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
          }}
          onClick={() => setShowFigures(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sty.panel,
              background: TH.panelSolid,
              width: isMobile ? "100%" : 800,
              maxWidth: isMobile ? "100vw" : "95vw",
              maxHeight: isMobile ? "92vh" : "90vh",
              overflow: "auto",
              borderColor: TH.gold,
              padding: 0,
              borderRadius: isMobile ? "12px 12px 0 0" : 8,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{
                padding: "20px 24px 12px",
                borderBottom: `1px solid ${TH.border}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                background: TH.panelSolid,
                zIndex: 1,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: 3,
                    color: TH.dim,
                    textTransform: "uppercase",
                    marginBottom: 2,
                  }}
                >
                  {t("figuresGallery")}
                </div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: TH.gold,
                    margin: 0,
                  }}
                >
                  {t("allFigures")}
                </h2>
              </div>
              <button
                onClick={() => setShowFigures(false)}
                style={{
                  background: "none",
                  border: `1px solid ${TH.border}`,
                  borderRadius: 6,
                  width: isMobile ? 44 : 32,
                  height: isMobile ? 44 : 32,
                  color: TH.gold,
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
            <div
              style={{
                padding: isMobile ? 10 : 16,
                display: "grid",
                gridTemplateColumns: isMobile
                  ? "repeat(auto-fill,minmax(140px,1fr))"
                  : "repeat(auto-fill,minmax(200px,1fr))",
                gap: isMobile ? 8 : 12,
              }}
            >
              {DATA.filter(
                (d) => d.cat === "figures" || d.cat === "biography",
              ).map((fig) => {
                const fi = trItem(fig, lang);
                return (
                  <div
                    key={fig.id}
                    onClick={() => {
                      setCat(fig.cat);
                      setSel(fig.id);
                      setShowFigures(false);
                    }}
                    style={{
                      ...sty.panel,
                      padding: 0,
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "border-color 0.2s,transform 0.2s",
                      border: `1px solid ${TH.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = TH.gold;
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = TH.border;
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {fig.img && (
                      <img
                        src={fig.img}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                        style={{
                          width: "100%",
                          height: 120,
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    )}
                    <div style={{ padding: "10px 12px" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: TH.gold,
                          marginBottom: 2,
                        }}
                      >
                        {fi.name}
                      </div>
                      <div
                        style={{ fontSize: 10, color: TH.dim, marginBottom: 4 }}
                      >
                        {yrf(fig.y1)}
                        {fig.y1 !== fig.y2 ? ` — ${yrf(fig.y2)}` : ""}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: TH.text,
                          lineHeight: 1.4,
                          opacity: 0.8,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {fi.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {shareToast && (
        <ToastBanner message={t("linkCopied")} theme={TH} goldBorder />
      )}
      <ToastBanner message={statusToast} theme={TH} />
    </div>
  );
}

export default RomanGlobe;
