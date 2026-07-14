import * as THREE from 'three';
const THEMES={
dark:{bg:"#06060f",panel:"rgba(8,8,20,0.94)",gold:"#C9A84C",goldDim:"rgba(201,168,76,0.15)",red:"#9B2335",text:"#E8DCC8",dim:"#A89F90",border:"rgba(201,168,76,0.22)",glow:"rgba(201,168,76,0.06)",panelSolid:"rgba(8,8,20,0.98)",sceneBg:0x06060f,globeBase:0x111122},
light:{bg:"#F5F0E8",panel:"rgba(255,255,250,0.94)",gold:"#7A5A10",goldDim:"rgba(122,90,16,0.12)",red:"#9B2335",text:"#2C2416",dim:"#6B6054",border:"rgba(122,90,16,0.25)",glow:"rgba(122,90,16,0.06)",panelSolid:"rgba(250,248,240,0.98)",sceneBg:0xE8E0D0,globeBase:0x556677}
};
const I18N={en:{
skip:"Skip to timeline",menu:"MENU",openNav:"Open navigation menu",closeNav:"Close navigation menu",
categories:"Categories",eventCats:"Event categories",events:"Events",locations:"Locations",clickMap:"(click on map)",
routes:"Routes",keyFacts:"Key Facts",origin:"Origin",destination:"Destination",route:"Route",
province:"PROVINCE",romanProvince:"Roman Province",encyclopedia:"Encyclopedia",closeEnc:"Close encyclopedia panel",
pause:"Pause timeline",play:"Play timeline",playing:"PLAYING",speed:"Playback speed",
timeline:"Timeline year selector",selectEvt:"Select an event to explore the timeline",
bc:"BC",ad:"AD",clickMore:"CLICK TO READ MORE",
appLabel:"Imperium Romanum — Interactive Atlas of the Roman World",globeLabel:"Interactive 3D globe showing the Roman world",
viewing:"Currently viewing",theme:"Theme",language:"Language",
territoryOf:"This territory was part of the Roman domain during",
territoryGov:"Roman provinces were governed by appointed magistrates who collected taxes and administered justice.",
catExpansion:"Territorial Expansion",catCampaigns:"Military Campaigns",catFigures:"Historical Figures",catEvents:"Landmark Events",
catEngineering:"Engineering Marvels",catCulture:"Culture & Arts",catReligion:"Religion & Philosophy",catPlagues:"Plagues & Disasters",
catBiography:"Biographies",catEconomy:"Economy & Trade",catLaw:"Law & Government",catMilitary:"Military & Legions",
catCities:"Cities & Provinces",catScience:"Science & Medicine",catDaily:"Daily Life & Society",
closeLightbox:"Close image",image:"Image",
eraKingdom:"Kingdom",eraRepublic:"Republic",eraPunic:"Punic Wars",eraLateRepublic:"Late Republic",
eraEmpire:"Empire",eraPeak:"Peak",eraCrisis:"Crisis",eraDivision:"Division",eraFall:"Fall",
readMore:"Read full article",eventArticle:"Article",relatedLocations:"Related Locations",viewOnMap:"View on map",
shortcuts:"Keyboard Shortcuts",shortcutPlay:"Play / Pause",shortcutScrub:"Scrub timeline",shortcutFastScrub:"Fast scrub (10%)",shortcutClose:"Close panel",shortcutHelp:"Show shortcuts",shortcutSearch:"Focus search",
search:"Search",searchPlaceholder:"Search events, locations, figures...",noResults:"No results found",
share:"Share",copyLink:"Copy Link",linkCopied:"Link copied!",downloadImage:"Download Image",
animateRoutes:"Animate routes",
population:"Population",territoryArea:"Territory",legions:"Legions",roads:"Roads",stats:"Statistics",
figuresGallery:"Figures Gallery",allFigures:"All Figures",
mapMode2D:"2D Map",mapMode3D:"3D Globe",
tours:"Guided Tours",startTour:"Start Tour",nextStep:"Next",prevStep:"Previous",exitTour:"Exit Tour",tourOf:"of",steps:"steps",pauseTour:"Pause tour",resumeTour:"Resume tour",
sound:"Sound",soundOn:"Sound on",soundOff:"Sound off",
openToolbar:"Open toolbar",closeToolbar:"Close toolbar",autoTips:"Auto tooltips",hideStats:"Hide statistics",showStatsToggle:"Show statistics",
quiz:"Quiz",startQuiz:"Start Quiz",nextQuestion:"Next",quizScore:"Score",correct:"Correct!",incorrect:"Incorrect",quizComplete:"Quiz Complete!",tryAgain:"Try Again",questionDate:"When did this event begin?",questionLocation:"Where was this primarily located?",questionWho:"Who is described here?",questionMatch:"Which category does this event belong to?",quizRound:"Question",quizOf:"of"
},es:{
skip:"Ir a la línea de tiempo",menu:"MENÚ",openNav:"Abrir menú de navegación",closeNav:"Cerrar menú de navegación",
categories:"Categorías",eventCats:"Categorías de eventos",events:"Eventos",locations:"Ubicaciones",clickMap:"(clic en el mapa)",
routes:"Rutas",keyFacts:"Datos Clave",origin:"Origen",destination:"Destino",route:"Ruta",
province:"PROVINCIA",romanProvince:"Provincia Romana",encyclopedia:"Enciclopedia",closeEnc:"Cerrar panel de enciclopedia",
pause:"Pausar línea de tiempo",play:"Reproducir línea de tiempo",playing:"REPRODUCIENDO",speed:"Velocidad",
timeline:"Selector de año",selectEvt:"Selecciona un evento para explorar la línea de tiempo",
bc:"a.C.",ad:"d.C.",clickMore:"CLIC PARA LEER MÁS",
appLabel:"Imperium Romanum — Atlas Interactivo del Mundo Romano",globeLabel:"Globo 3D interactivo del mundo romano",
viewing:"Viendo actualmente",theme:"Tema",language:"Idioma",
territoryOf:"Este territorio formó parte del dominio romano durante",
territoryGov:"Las provincias romanas eran gobernadas por magistrados que recaudaban impuestos y administraban justicia.",
catExpansion:"Expansión Territorial",catCampaigns:"Campañas Militares",catFigures:"Figuras Históricas",catEvents:"Eventos Destacados",
catEngineering:"Maravillas de Ingeniería",catCulture:"Cultura y Artes",catReligion:"Religión y Filosofía",catPlagues:"Plagas y Desastres",
catBiography:"Biografías",catEconomy:"Economía y Comercio",catLaw:"Derecho y Gobierno",catMilitary:"Ejército y Legiones",
catCities:"Ciudades y Provincias",catScience:"Ciencia y Medicina",catDaily:"Vida Cotidiana",
closeLightbox:"Cerrar imagen",image:"Imagen",
eraKingdom:"Monarquía",eraRepublic:"República",eraPunic:"Guerras Púnicas",eraLateRepublic:"República Tardía",
eraEmpire:"Imperio",eraPeak:"Apogeo",eraCrisis:"Crisis",eraDivision:"División",eraFall:"Caída",
readMore:"Leer artículo completo",eventArticle:"Artículo",relatedLocations:"Ubicaciones Relacionadas",viewOnMap:"Ver en el mapa",
shortcuts:"Atajos de Teclado",shortcutPlay:"Reproducir / Pausar",shortcutScrub:"Avanzar línea de tiempo",shortcutFastScrub:"Avance rápido (10%)",shortcutClose:"Cerrar panel",shortcutHelp:"Mostrar atajos",shortcutSearch:"Ir a búsqueda",
search:"Buscar",searchPlaceholder:"Buscar eventos, ubicaciones, figuras...",noResults:"Sin resultados",
share:"Compartir",copyLink:"Copiar enlace",linkCopied:"¡Enlace copiado!",downloadImage:"Descargar imagen",
animateRoutes:"Animar rutas",
population:"Población",territoryArea:"Territorio",legions:"Legiones",roads:"Calzadas",stats:"Estadísticas",
figuresGallery:"Galería de Figuras",allFigures:"Todas las Figuras",
mapMode2D:"Mapa 2D",mapMode3D:"Globo 3D",
tours:"Visitas Guiadas",startTour:"Iniciar Visita",nextStep:"Siguiente",prevStep:"Anterior",exitTour:"Salir",tourOf:"de",steps:"pasos",pauseTour:"Pausar visita",resumeTour:"Reanudar visita",
sound:"Sonido",soundOn:"Sonido activado",soundOff:"Sonido desactivado",
openToolbar:"Abrir barra de herramientas",closeToolbar:"Cerrar barra de herramientas",autoTips:"Tooltips automáticos",hideStats:"Ocultar estadísticas",showStatsToggle:"Mostrar estadísticas",
quiz:"Cuestionario",startQuiz:"Iniciar Cuestionario",nextQuestion:"Siguiente",quizScore:"Puntuación",correct:"¡Correcto!",incorrect:"Incorrecto",quizComplete:"¡Cuestionario Completado!",tryAgain:"Intentar de Nuevo",questionDate:"¿Cuándo comenzó este evento?",questionLocation:"¿Dónde estaba ubicado principalmente?",questionWho:"¿Quién se describe aquí?",questionMatch:"¿A qué categoría pertenece este evento?",quizRound:"Pregunta",quizOf:"de"
}};
const CAT_I18N_KEYS={expansion:"catExpansion",campaigns:"catCampaigns",figures:"catFigures",events:"catEvents",engineering:"catEngineering",culture:"catCulture",religion:"catReligion",plagues:"catPlagues",biography:"catBiography",economy:"catEconomy",law:"catLaw",military:"catMilitary",cities:"catCities",science:"catScience",daily:"catDaily"};
const ERA_I18N_KEYS=["eraKingdom","eraRepublic","eraPunic","eraLateRepublic","eraEmpire","eraPeak","eraCrisis","eraDivision","eraFall"];
const ll3=(la,lo,r=2)=>{const p=(90-la)*Math.PI/180,t=(lo+180)*Math.PI/180;return new THREE.Vector3(-r*Math.sin(p)*Math.cos(t),r*Math.cos(p),r*Math.sin(p)*Math.sin(t))};
const ll2c=(la,lo,w,h)=>[(lo+180)/360*w,(90-la)/180*h];
const yrL=(y,lang)=>y<0?`${Math.abs(y)} ${I18N[lang].bc}`:`${y} ${I18N[lang].ad}`;
const yr=y=>y<0?`${Math.abs(y)} BC`:`${y} AD`;
const CATS=[{id:"expansion",name:"Territorial Expansion",icon:"🏛️"},{id:"campaigns",name:"Battles & Wars",icon:"⚔️"},{id:"figures",name:"Historical Figures",icon:"🏺"},{id:"events",name:"Landmark Events",icon:"📜"},{id:"engineering",name:"Engineering Marvels",icon:"🏗️"},{id:"culture",name:"Culture & Arts",icon:"🎭"},{id:"religion",name:"Religion & Philosophy",icon:"🕊️"},{id:"plagues",name:"Plagues & Disasters",icon:"☠️"},{id:"biography",name:"Biographies",icon:"📖"},{id:"economy",name:"Economy & Trade",icon:"⚖️"},{id:"law",name:"Law & Government",icon:"📋"},{id:"military",name:"Army & Legions",icon:"🗡️"},{id:"cities",name:"Cities & Provinces",icon:"🏙️"},{id:"science",name:"Science & Medicine",icon:"🔬"},{id:"daily",name:"Daily Life & Society",icon:"🏠"}];

export { THEMES, I18N, CAT_I18N_KEYS, ERA_I18N_KEYS, ll3, ll2c, yrL, yr, CATS };
