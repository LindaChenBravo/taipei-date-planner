document.querySelectorAll('[data-total-count]').forEach(label=>{label.textContent=spots.length;});

const els = {
  area:document.getElementById('area'), keyword:document.getElementById('keyword'), typeTags:document.getElementById('typeTags'),
  activeFilters:document.getElementById('activeFilters'),
  randomBtn:document.getElementById('randomBtn'), resetBtn:document.getElementById('resetBtn'),
  cards:document.getElementById('cards'), count:document.getElementById('count'), recommendation:document.getElementById('recommendation'),
  routeSection:document.getElementById('routeSection'), routeCount:document.getElementById('routeCount'), routeSelect:document.getElementById('routeSelect'),
  routeMeta:document.getElementById('routeMeta'), routeMapCanvas:document.getElementById('routeMapCanvas'), routeStops:document.getElementById('routeStops'),
  routeDirections:document.getElementById('routeDirections'), routeNote:document.getElementById('routeNote'), mapSection:document.getElementById('mapSection'),
  mapTypeTags:document.getElementById('mapTypeTags'), mapCanvas:document.getElementById('mapCanvas'), mapSpotCard:document.getElementById('mapSpotCard'), mapTitle:document.getElementById('mapTitle'),
  locationStatus:document.getElementById('locationStatus'),
  mapExternalLink:document.getElementById('mapExternalLink'), mapCount:document.getElementById('mapCount'),
  siteTabs:[...document.querySelectorAll('.site-tab[data-view]')]
};

let selectedType='all';
let resultSort='default';
const resultSortSelect=document.getElementById('resultSort');
const sortStatus=document.getElementById('sortStatus');
let currentMapSpot=null;
let vectorMap=null;
let routeMap=null;
let selectedRouteIndex=0;
let selectedRouteStop=-1;
let userLocation=null;
let userMarker=null;
let locationRequestId=0;
const routeMarkers=[];
let currentResults=spots;
let mapPoints=[];
let mapSpotByName=new Map();
const spotFocusZoom=15;
let cardObserver=null;
const cardBatchSize=30;
const scrollBehavior=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
const typeIcons={宵夜:'🌙',all:'✦',台派:'💚',文創:'✂️',咖啡:'☕',飲品:'🧋',展覽:'🖼️',古蹟:'🏛️',戶外:'☀️',手作:'🧵',美食:'🍽️',早餐:'🍽️',甜點:'🍰',夜市:'🏮',市集:'🧺',拍照:'📷',泡湯:'♨️',按摩:'💆',書店:'📖',圖書館:'📚','Good Eye':'👁️',音樂:'♫',自然:'🌿'};

document.querySelectorAll('button[data-type]').forEach(button=>{
  if(button.querySelector('.tag-icon'))return;
  button.insertAdjacentHTML('afterbegin',`<span class="tag-icon" aria-hidden="true">${typeIcons[button.dataset.type]||'•'}</span>`);
});

const mapQuery = (name,area='') => `${name} ${area} 台灣`;
const mapLink = (name,area='') => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery(name,area))}`;
const spotMapLink = spot => spot.mapUrl || mapLink(spot.name,spot.area);
const foodTypes=['美食','早餐'];
function spotVisualType(spot){
  if(spot.type.includes('飲品'))return '飲品';
  if(spot.type.includes('圖書館'))return '圖書館';
  if(spot.type[0]==='書店')return '書店';
  if(spot.type.includes('咖啡'))return '咖啡';
  if(spot.type.includes('甜點'))return '甜點';
  if(spot.type.includes('書店'))return '書店';
  if(spot.type.includes('泡湯'))return '泡湯';
  if(spot.type.includes('按摩'))return '按摩';
  if(spot.type.includes('夜市')&&/夜市|市場|市集/.test(spot.name))return '夜市';
  if(spot.type.includes('市集'))return '市集';
  if(foodTypes.some(type=>spot.type.includes(type)))return '美食';
  return ['咖啡','音樂','自然','戶外','拍照','展覽','手作','文創','夜市','古蹟'].find(type=>spot.type.includes(type))||'文創';
}

function spotIllustration(spot){
  const common='fill="none" stroke="#3E3A39" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const visual=spotVisualType(spot);
  if(visual==='飲品')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M19 22h37l-5 39H24Z" fill="#A8D3E6"/><path d="M15 22h45M39 22 46 7h11M29 49h16M31 40h12"/><circle cx="33" cy="55" r="2" fill="#3E3A39"/><circle cx="43" cy="55" r="2" fill="#3E3A39"/></g></svg>`;
  if(visual==='書店'||visual==='圖書館')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M12 17c11-4 20-2 24 4v40c-5-6-13-8-24-4Zm48 0c-11-4-20-2-24 4v40c5-6 13-8 24-4Z" fill="#A8D3E6"/><path d="M36 21v40M20 29h9M20 38h9M43 29h9M43 38h9"/></g></svg>`;
  if(visual==='泡湯')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M15 40c6 5 12 5 18 0s12-5 18 0 10 5 13 2v17H9V42c2 1 4 0 6-2Z" fill="#A8D3E6"/><path d="M22 32c-7-7 7-10 0-19M39 32c-7-7 7-10 0-19M55 32c-7-7 7-10 0-19"/></g></svg>`;
  if(visual==='按摩')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><circle cx="36" cy="20" r="10" fill="#F6D27A"/><path d="M16 58c0-13 8-22 20-22s20 9 20 22Z" fill="#B9DAA5"/><path d="M11 27c-5 6-5 13 0 19M61 27c5 6 5 13 0 19M7 58h58"/></g></svg>`;
  if(visual==='甜點')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M11 55h50L50 28H21Z" fill="#F6D27A"/><path d="M16 42h39l6 13H11Z" fill="#F2A497"/><path d="M21 28c3-7 9-9 15-4 6-5 12-3 14 4M36 22v-8"/><circle cx="36" cy="12" r="4" fill="#F2A497"/><path d="M9 61h54"/></g></svg>`;
  if(visual==='市集')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M10 27h52l-6-16H16Z" fill="#F2A497"/><path d="M16 27v33h40V27M11 27c0 8 10 8 10 0 0 8 10 8 10 0 0 8 10 8 10 0 0 8 10 8 10 0 0 8 10 8 10 0" fill="#F6D27A"/><path d="M26 60V42h20v18M9 60h54"/></g></svg>`;
  if(visual==='美食')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><circle cx="36" cy="36" r="20" fill="#F6D27A"/><circle cx="36" cy="36" r="12" fill="#FFFCF6"/><path d="M8 12v48M4 12v14c0 5 8 5 8 0V12M64 12v48M60 12c-5 7-5 16 4 19"/></g></svg>`;
  if(visual==='咖啡')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M14 25h41v21c0 10-8 17-18 17h-5c-10 0-18-7-18-17Z" fill="#F6D27A"/><path d="M55 30h4c12 0 11 17 0 17h-4M23 16c-5-6 5-8 0-13M39 16c-5-6 5-8 0-13"/><path d="M12 64h48"/></g></svg>`;
  if(['自然','戶外','拍照'].includes(visual))return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><circle cx="54" cy="17" r="10" fill="#F6D27A"/><path d="m7 59 20-35 13 20 8-11 17 26Z" fill="#B9DAA5"/><path d="m21 34 6-10 7 11-7-4Z" fill="#FFFCF6"/><path d="M7 59h58"/></g></svg>`;
  if(visual==='音樂')return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><path d="M27 20 56 14v36M27 20v36"/><ellipse cx="20" cy="57" rx="9" ry="6" fill="#A8D3E6"/><ellipse cx="49" cy="51" rx="9" ry="6" fill="#A8D3E6"/></g></svg>`;
  return `<svg viewBox="0 0 72 72" aria-hidden="true"><g ${common}><rect x="10" y="16" width="52" height="44" rx="7" fill="#F2A497"/><path d="M18 16V9h36v7M18 28h36M24 60V42h10v18M43 38h10v11H43Z" fill="#FFFCF6"/><circle cx="49" cy="23" r="2" fill="#3E3A39"/></g></svg>`;
}

function spotMarkerIcon(spot){
  // 有「古蹟」標籤的地點，地圖圖釘一律優先用 🏛️（卡片插圖不受影響）
  if(spot.type.includes('古蹟'))return typeIcons['古蹟'];
  return typeIcons[spotVisualType(spot)]||'📍';
}

function showMapFallback(container,message,offerSearch=false){
  const box=document.createElement('div');box.className='map-fallback';box.setAttribute('role','status');
  const text=document.createElement('p');text.textContent=message;box.appendChild(text);
  if(offerSearch){
    const button=document.createElement('button');button.type='button';button.textContent='改用條件搜尋';
    button.addEventListener('click',()=>{setView('list');els.keyword.focus({preventScroll:true})});box.appendChild(button);
  }
  container.replaceChildren(box);
}

// 在底圖上顯示捷運／火車站（資料來自 OpenFreeMap，畫在地圖本身，移動時不會偏移）
// 捷運（官方配色）＋台鐵北北基桃路線：資料來自 OpenStreetMap，畫在街道文字下方、車站與景點圖標之下
function addMetroLines(map){
  if(map.getSource('mrt-lines'))return;
  map.addSource('mrt-lines',{type:'geojson',data:'./data/mrt-lines.json?v=red-line-20261106'});
  const beforeId=(map.getStyle().layers.find(layer=>layer.type==='symbol')||{}).id;
  const isTra=['==',['get','kind'],'tra'], isMrt=['!=',['get','kind'],'tra'];
  const round={'line-join':'round','line-cap':'round'};
  // 台鐵：深灰線＋白色虛線（傳統鐵路畫法），放在捷運下面
  map.addLayer({id:'tra-line',type:'line',source:'mrt-lines',filter:isTra,layout:round,
    paint:{'line-color':['get','color'],'line-width':['interpolate',['linear'],['zoom'],9,2,13,4.5,16,7],'line-opacity':.85}},beforeId);
  map.addLayer({id:'tra-line-dash',type:'line',source:'mrt-lines',filter:isTra,layout:{'line-join':'round'},
    paint:{'line-color':'#FFFFFF','line-width':['interpolate',['linear'],['zoom'],9,.8,13,2,16,3],'line-dasharray':[3,3]}},beforeId);
  map.addLayer({id:'mrt-line-casing',type:'line',source:'mrt-lines',filter:isMrt,layout:round,
    paint:{'line-color':'#FFFFFF','line-width':['interpolate',['linear'],['zoom'],10,2.5,13,5,16,8],'line-opacity':.9}},beforeId);
  map.addLayer({id:'mrt-line',type:'line',source:'mrt-lines',filter:isMrt,layout:round,
    paint:{'line-color':['get','color'],'line-width':['interpolate',['linear'],['zoom'],10,1.5,13,3,16,5],'line-opacity':.9}},beforeId);
}

function addStationLayer(map){
  if(!map||map.getLayer('mrt-station-dot'))return;
  addMetroLines(map);
  // 車站點位自備（跟路線同色）；轉乘站（多條線）用深灰色外框並放大
  map.addSource('rail-stations',{type:'geojson',data:'./data/rail-stations.json?v=snap-20261107'});
  const single=['!',['get','multi']], multi=['get','multi'];
  map.addLayer({id:'mrt-station-dot',type:'circle',source:'rail-stations',minzoom:11,filter:single,
    paint:{'circle-radius':['interpolate',['linear'],['zoom'],11,2.5,13,4,15,6.5],'circle-color':'#FFFFFF','circle-stroke-color':['get','color'],'circle-stroke-width':['interpolate',['linear'],['zoom'],11,1.5,15,3]}});
  map.addLayer({id:'mrt-station-dot-multi',type:'circle',source:'rail-stations',minzoom:10,filter:multi,
    paint:{'circle-radius':['interpolate',['linear'],['zoom'],10,3,13,5.5,15,8],'circle-color':'#FFFFFF','circle-stroke-color':['get','color'],'circle-stroke-width':['interpolate',['linear'],['zoom'],10,1.8,15,3.2]}});
  map.addLayer({id:'mrt-station-label',type:'symbol',source:'rail-stations',minzoom:13.5,
    layout:{'text-field':['get','name'],'text-font':['Noto Sans Regular'],'text-size':12,'text-offset':[0,0.9],'text-anchor':'top','text-optional':true},
    paint:{'text-color':'#3E3A39','text-halo-color':'#FFFFFF','text-halo-width':2}});
}

function addNorthControl(map,position='bottom-right'){
  map.addControl({
    onAdd(controlMap){
      this.map=controlMap;
      this.container=document.createElement('div');
      this.container.className='maplibregl-ctrl maplibregl-ctrl-group north-control';
      const button=document.createElement('button');
      button.type='button';
      button.title='回到正北';
      button.setAttribute('aria-label','回到正北');
      const arrow=document.createElement('span');
      arrow.className='north-control-arrow';
      arrow.setAttribute('aria-hidden','true');
      // 羅盤指針：上半珊瑚色指向北方，跟著地圖旋轉
      arrow.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 2.5 16.5 12h-9z" fill="var(--coral)"/><path d="M12 21.5 7.5 12h9z" fill="var(--paper)"/><path d="M12 2.5 16.5 12 12 21.5 7.5 12z" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="1.6" fill="var(--ink)"/></svg>';
      button.append(arrow);
      button.addEventListener('click',()=>controlMap.easeTo({bearing:0,duration:scrollBehavior()==='smooth'?500:0}));
      this.update=()=>{arrow.style.transform=`rotate(${-controlMap.getBearing()}deg)`};
      controlMap.on('rotate',this.update);
      this.update();
      this.container.append(button);
      return this.container;
    },
    onRemove(){
      this.map.off('rotate',this.update);
      this.container.remove();
    }
  },position);
}

function initVectorMap(){
  if(!window.maplibregl){
    showMapFallback(els.mapCanvas,'互動地圖暫時無法載入，仍可用條件搜尋找地點並開啟 Google Maps。',true);
    return;
  }
  try{
    vectorMap=new maplibregl.Map({
    container:els.mapCanvas,
    locale:{'GeolocateControl.FindMyLocation':'回到我的位置','GeolocateControl.LocationNotAvailable':'無法取得位置'},
    style:'https://tiles.openfreemap.org/styles/positron',
    center:[121.517,25.0478],
    zoom:14,
    attributionControl:true,
    localIdeographFontFamily:'"Huninn","Noto Sans TC",sans-serif'
  });
  vectorMap.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  addNorthControl(vectorMap);
  const geolocate=new maplibregl.GeolocateControl({
    positionOptions:{enableHighAccuracy:true,timeout:15000,maximumAge:0},
    fitBoundsOptions:{maxZoom:15},
    trackUserLocation:true,
    showUserLocation:true,
    showAccuracyCircle:true
  });
  vectorMap.addControl(geolocate,'bottom-right');
  geolocate.on('geolocate',()=>setLocationStatus(''));
  geolocate.on('error',error=>setLocationStatus(error.code===1
    ?'請在瀏覽器允許此網站使用定位後再試。'
    :'定位失敗，請確認裝置定位已開啟後重試。'));
  vectorMap.on('load',()=>{addStationLayer(vectorMap);addSpotLayers(vectorMap)});
  }catch(error){
    vectorMap=null;
    showMapFallback(els.mapCanvas,'這個瀏覽器暫時無法顯示互動地圖，請改用條件搜尋或 Google Maps。',true);
  }
}

function updateMarkerSelection(){
  const source=vectorMap?.getSource('spot-active');
  if(!source)return;
  const spot=currentMapSpot&&mapSpotByName.get(currentMapSpot.name);
  source.setData({type:'FeatureCollection',features:spot?[{type:'Feature',properties:{name:spot.name,image:pinImageId(spotMarkerIcon(spot),true)},geometry:{type:'Point',coordinates:[spot.coords[1],spot.coords[0]]}}]:[]});
}

function updateMapSpotCard(spot){
  const chips=typeChips(spot);
  const sourceLink=spot.reviewUrl?'':spot.sourceUrl&&!spot.type.includes('美食')?`<a class="button-link" href="${spot.sourceUrl}" target="_blank" rel="noopener noreferrer">推薦貼文 ↗</a>`:'';
  const officialLink=spot.type.includes('圖書館')&&spot.officialUrl?`<a class="button-link" href="${spot.officialUrl}" target="_blank" rel="noopener noreferrer">官網 ↗</a>`:'';
  els.mapSpotCard.innerHTML=`<button type="button" class="map-card-close" aria-label="關閉地點圖卡">×</button><div class="spot-illustration">${spotIllustration(spot)}</div><div><h3>${spot.name}</h3><div class="meta">${spotMeta(spot)}</div><div class="spot-tags">${chips}</div><p>${spot.note}</p><div class="map-spot-actions"><a class="button-link" href="${spotMapLink(spot)}" target="_blank" rel="noopener noreferrer">營業時間・導航 ↗</a>${officialLink}${sourceLink}</div></div>`;
  els.mapSpotCard.classList.remove('hidden');
}

function closeMapSpotCard(){
  currentMapSpot=null;
  els.mapSpotCard.classList.add('hidden');
  els.mapTitle.textContent='選擇一個景點';
  els.mapExternalLink.classList.add('hidden');
  updateMarkerSelection();
}

els.mapSpotCard.addEventListener('click',event=>{
  if(event.target.closest('.map-card-close'))closeMapSpotCard();
});
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!els.mapSpotCard.classList.contains('hidden'))closeMapSpotCard();
});

function setView(view){
  const isMap=view==='map';
  const isList=view==='list';
  const isRoutes=view==='routes';
  document.body.classList.toggle('view-map',isMap);
  document.body.classList.toggle('view-list',isList);
  document.body.classList.toggle('view-routes',isRoutes);
  els.routeSection.classList.toggle('hidden',!isRoutes);
  els.siteTabs.forEach(tab=>{
    const active=tab.dataset.view===view;
    tab.classList.toggle('active',active);
    tab.setAttribute('aria-pressed',String(active));
    if(active)tab.setAttribute('aria-current','page');else tab.removeAttribute('aria-current');
  });
  window.scrollTo({top:0,behavior:scrollBehavior()});
  if(isMap&&vectorMap)window.setTimeout(()=>vectorMap.resize(),0);
  if(isList)renderCards();
  if(isRoutes)showRouteBrowse();
}

function openInMap(spot,scroll=true,pan=true){
  if(scroll)setView('map');
  currentMapSpot=spot;
  els.mapTitle.textContent=spot.name;
  els.mapExternalLink.href=spotMapLink(spot);
  els.mapExternalLink.classList.remove('hidden');
  updateMapSpotCard(spot);
  updateMarkerSelection();
  const position=spot.coords;
  if(vectorMap&&position&&pan){
    vectorMap.easeTo({center:[position[1],position[0]],zoom:Math.max(vectorMap.getZoom(),spotFocusZoom),duration:scrollBehavior()==='smooth'?650:0});
  }
  if(scroll) els.mapSection.scrollIntoView({behavior:scrollBehavior(),block:'start'});
}

function scrollToSpotCard(){
  if(!currentMapSpot)return;
  const index=spots.indexOf(currentMapSpot);
  const card=document.getElementById(`spot-card-${index}`);
  if(!card)return;
  document.querySelectorAll('.card.map-target').forEach(item=>item.classList.remove('map-target'));
  card.scrollIntoView({behavior:scrollBehavior(),block:'center'});
  card.classList.add('map-target');
  card.focus({preventScroll:true});
  window.setTimeout(()=>card.classList.remove('map-target'),1300);
}

// ===== 地圖上的地點圖釘與數字泡泡（直接畫在地圖上，拖曳時不會偏移） =====
const pinColors={ink:'#3E3A39',coral:'#F2A497',yellow:'#F6D27A'};
// 最近看過的標記保留；畫面內標記不受快取上限影響。
const retainedSpots=new Map();
const retainedSpotLimit=400;
let spotLayersReady=false;
const revealedSpots=new Set();
let pinGrowFrame=0;
function settleGrowingPins(){
  cancelAnimationFrame(pinGrowFrame);pinGrowFrame=0;
  vectorMap?.getSource('spot-growing')?.setData({type:'FeatureCollection',features:[]});
}

function pinImageId(icon,active){return `${active?'pin-on':'pin'}-${icon}`}

function drawPinImage(icon,active){
  const s=active?1.18:1,a=35*s,rr=6*s,ratio=2;
  const w=Math.ceil(a+8),cy=a/2+3.5;
  const h=Math.ceil(cy+a/2*Math.SQRT2-rr*(Math.SQRT2-1)+2.5);
  const canvas=document.createElement('canvas');canvas.width=w*ratio;canvas.height=h*ratio;
  const ctx=canvas.getContext('2d');ctx.scale(ratio,ratio);
  ctx.save();ctx.translate(w/2,cy);ctx.rotate(-Math.PI/4);
  const x=-a/2,y=-a/2,r=[a/2,a/2,a/2,rr];
  ctx.beginPath();ctx.moveTo(x+r[0],y);ctx.arcTo(x+a,y,x+a,y+a,r[1]);ctx.arcTo(x+a,y+a,x,y+a,r[2]);ctx.arcTo(x,y+a,x,y,r[3]);ctx.arcTo(x,y,x+a,y,r[0]);ctx.closePath();
  ctx.fillStyle=active?pinColors.yellow:pinColors.coral;ctx.fill();
  ctx.lineWidth=2;ctx.strokeStyle=pinColors.ink;ctx.stroke();ctx.restore();
  // 依 emoji 實際外框置中並縮放成同樣大小（iPhone 上部分 emoji 的字寬資訊不準）
  ctx.font='40px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle=pinColors.ink;
  const m=ctx.measureText(icon);
  const left=m.actualBoundingBoxLeft||0,right=m.actualBoundingBoxRight||m.width||40;
  const up=m.actualBoundingBoxAscent||32,down=m.actualBoundingBoxDescent||8;
  const k=(20*s)/Math.max(left+right,up+down,1);
  ctx.save();ctx.translate(w/2,cy);ctx.scale(k,k);ctx.fillText(icon,(left-right)/2,(up-down)/2);ctx.restore();
  return {width:canvas.width,height:canvas.height,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};
}

function addSpotLayers(map){
  if(!map||map.getSource('spot-render'))return;
  const icons=new Set([...Object.values(typeIcons),'📍']);
  icons.forEach(icon=>[false,true].forEach(active=>{
    const id=pinImageId(icon,active);
    if(!map.hasImage(id))map.addImage(id,drawPinImage(icon,active),{pixelRatio:2});
  }));
  const empty={type:'FeatureCollection',features:[]};
  map.addSource('spot-render',{type:'geojson',data:empty});
  map.addSource('spot-active',{type:'geojson',data:empty});
  map.addSource('spot-growing',{type:'geojson',data:empty});
  map.addLayer({id:'spot-pins',type:'symbol',source:'spot-render',filter:['==',['get','kind'],'spot'],
    layout:{'icon-image':['get','image'],'icon-anchor':'bottom','icon-allow-overlap':true,'icon-ignore-placement':true},
    paint:{'icon-opacity':['get','alpha']}});
  map.addLayer({id:'spot-growing-pins',type:'symbol',source:'spot-growing',
    layout:{'icon-image':['get','image'],'icon-anchor':'bottom','icon-size':1,'icon-allow-overlap':true,'icon-ignore-placement':true},
    paint:{'icon-opacity':1,'icon-opacity-transition':{duration:0}}});
  map.on('movestart',()=>{
    if(!pinGrowFrame)return;
    settleGrowingPins();
    refreshVisibleSpots();
  });
  map.addLayer({id:'spot-active-pin',type:'symbol',source:'spot-active',
    layout:{'icon-image':['get','image'],'icon-anchor':'bottom','icon-allow-overlap':true,'icon-ignore-placement':true}});
  const clickable=['spot-active-pin','spot-pins','spot-growing-pins'];
  map.on('click',event=>{
    const hit=map.queryRenderedFeatures(event.point,{layers:clickable})[0];
    if(!hit)return;
    const props=hit.properties;
    const spot=mapSpotByName.get(props.name);
    if(spot)openInMap(spot,false,true);
  });
  clickable.forEach(layer=>{
    map.on('mouseenter',layer,()=>{map.getCanvas().style.cursor='pointer'});
    map.on('mouseleave',layer,()=>{map.getCanvas().style.cursor=''});
  });
  // moveend 同時涵蓋拖曳、縮放與程式定位，操作停下來才補標記。
  map.on('moveend',refreshVisibleSpots);
  spotLayersReady=true;
  refreshVisibleSpots();
  updateMarkerSelection();
}

function spotFeature(spot,coords,alpha=1){
  return {type:'Feature',properties:{kind:'spot',name:spot.name,image:pinImageId(spotMarkerIcon(spot),false),alpha},geometry:{type:'Point',coordinates:coords}};
}

function refreshVisibleSpots(){
  if(!vectorMap||!spotLayersReady)return;
  settleGrowingPins();
  const newlyRevealed=new Set();
  const bounds=vectorMap.getBounds(),center=vectorMap.getCenter();
  const visible=new Set();
  mapPoints.forEach(feature=>{
    if(!bounds.contains(feature.geometry.coordinates))return;
    const name=feature.properties.name;
    visible.add(name);
    if(!revealedSpots.has(name)){newlyRevealed.add(name);revealedSpots.add(name)}
    retainedSpots.set(name,feature);
  });
  // 只淘汰畫面外、距離最遠的標記；縮小時仍完整顯示畫面內所有地點。
  if(retainedSpots.size>retainedSpotLimit){
    const outside=[...retainedSpots].filter(([name])=>!visible.has(name)&&name!==currentMapSpot?.name);
    const distance=feature=>{
      const [lng,lat]=feature.geometry.coordinates;
      return ((lng-center.lng)*Math.cos(center.lat*Math.PI/180))**2+(lat-center.lat)**2;
    };
    outside.sort((a,b)=>distance(b[1])-distance(a[1]));
    for(const [name] of outside){
      if(retainedSpots.size<=retainedSpotLimit)break;
      retainedSpots.delete(name);
    }
  }
  const features=[...retainedSpots.values()].map(feature=>{
    const spot=mapSpotByName.get(feature.properties.name);
    return spotFeature(spot,feature.geometry.coordinates);
  });
  const source=vectorMap.getSource('spot-render');
  if(!newlyRevealed.size||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    source?.setData({type:'FeatureCollection',features});return;
  }
  const growing=features.filter(f=>newlyRevealed.has(f.properties.name));
  const simple=growing.length>60;
  source?.setData({type:'FeatureCollection',features:features.filter(f=>!newlyRevealed.has(f.properties.name))});
  vectorMap.setLayoutProperty('spot-growing-pins','icon-size',simple?1:0.35);
  vectorMap.setPaintProperty('spot-growing-pins','icon-opacity',0);
  vectorMap.getSource('spot-growing').setData({type:'FeatureCollection',features:growing});
  const start=performance.now(),duration=simple?140:260;
  let lastFrame=-Infinity;
  const frame=now=>{
    const t=Math.max(0,Math.min(1,(now-start)/duration)); // 影格時間可能略早於起點，避免出現負值
    if(t>=1){
      source?.setData({type:'FeatureCollection',features});
      settleGrowingPins();return;
    }
    // 單一圖層批次動畫，約30fps；每幀不重建GeoJSON。
    if(now-lastFrame>=32){
      const u=t-1;
      const scale=simple?1:Math.max(0,1+2.2*u*u*u+1.2*u*u);
      vectorMap.setLayoutProperty('spot-growing-pins','icon-size',scale);
      vectorMap.setPaintProperty('spot-growing-pins','icon-opacity',Math.min(1,t*3));
      lastFrame=now;
    }
    pinGrowFrame=requestAnimationFrame(frame);
  };
  pinGrowFrame=requestAnimationFrame(frame);
}

function rebuildSpotIndex(list){
  mapSpotByName=new Map(list.filter(spot=>spot.coords).map(spot=>[spot.name,spot]));
  mapPoints=[...mapSpotByName.values()].map(spot=>({type:'Feature',properties:{name:spot.name},geometry:{type:'Point',coordinates:[spot.coords[1],spot.coords[0]]}}));
  // 類型／關鍵字切換時，快取也必須符合新條件。
  for(const name of retainedSpots.keys()){
    if(!mapSpotByName.has(name))retainedSpots.delete(name);
  }
  refreshVisibleSpots();
}

function renderMapList(list,preserveViewport=false){
  els.mapCount.textContent=`${list.filter(spot=>spot.coords).length} 個地點`;
  currentMapSpot=null;
  els.mapSpotCard.classList.add('hidden');
  els.mapTitle.textContent='選擇一個景點';
  els.mapExternalLink.classList.add('hidden');
  rebuildSpotIndex(list);
  updateMarkerSelection();
  if(preserveViewport){
    if(!list.length)els.mapTitle.textContent='沒有符合此類別的地點';
    return;
  }
  if(!list.length){
    els.mapTitle.textContent='沒有可顯示的地點';
    els.mapSpotCard.classList.add('hidden');
    els.mapExternalLink.href='https://www.google.com/maps';
    if(vectorMap)vectorMap.jumpTo({center:[121.517,25.0478],zoom:14});
  }else{
    if(vectorMap){
      const bounds=list.map(spot=>spot.coords).filter(Boolean);
      if(bounds.length===1)vectorMap.jumpTo({center:[bounds[0][1],bounds[0][0]],zoom:14});
      else if(list.length===spots.length){
        // 全部類型維持目前探索位置；首次開啟由 initVectorMap 定位台北車站。
      }
      else if(bounds.length>1){
        const mapBounds=bounds.reduce((acc,point)=>acc.extend([point[1],point[0]]),new maplibregl.LngLatBounds());
        vectorMap.fitBounds(mapBounds,{padding:60,maxZoom:13,duration:scrollBehavior()==='smooth'?650:0});
      }
      window.setTimeout(()=>vectorMap.resize(),0);
    }
  }
}

function render(list,preserveViewport=false){
  currentResults=list;
  updateSearchSummary();
  els.count.textContent=`${list.length} 個地點`;
  if(document.body.classList.contains('view-list'))renderCards();
  renderMapList(list,preserveViewport);
}

function renderCards(){
  cardObserver?.disconnect();
  els.cards.replaceChildren();
  const list=currentResults;
  if(!list.length){els.cards.innerHTML='<div class="card empty">目前沒有符合條件的地點，試著換個關鍵字、類型或區域。</div>';return;}
  let next=0;
  const sentinel=document.createElement('div');sentinel.className='cards-sentinel';
  const appendBatch=()=>{
    const fragment=document.createDocumentFragment();
    const limit=Math.min(next+cardBatchSize,list.length);
    for(;next<limit;next++){
      const spot=list[next];
    const card=document.createElement('article'); card.className='card';
    card.id=`spot-card-${spots.indexOf(spot)}`; card.tabIndex=-1;
    const chips=typeChips(spot);
    card.innerHTML=`<div class="card-head"><div class="spot-illustration">${spotIllustration(spot)}</div><div><h3>${spot.name}</h3><div class="meta">${spotMeta(spot)}</div></div></div><p class="note">${spot.note}</p><div>${chips}</div>`;
    const actions=document.createElement('div'); actions.className='card-actions';
    const preview=document.createElement('button'); preview.type='button'; preview.textContent='地圖預覽';
    preview.addEventListener('click',()=>openInMap(spot));
    const external=document.createElement('a'); external.className='button-link'; external.textContent='營業時間・導航 ↗';
    external.href=spotMapLink(spot); external.target='_blank'; external.rel='noopener noreferrer';
    if(spot.coords)actions.append(preview);
    else {const pending=document.createElement('span');pending.className='note';pending.textContent='地圖圖釘位置待確認';actions.append(pending);}
    actions.append(external);
    if(spot.type.includes('圖書館')&&spot.officialUrl){
      const official=document.createElement('a');official.className='button-link';official.textContent='官網 ↗';
      official.href=spot.officialUrl;official.target='_blank';official.rel='noopener noreferrer';actions.appendChild(official);
    }
    card.appendChild(actions); fragment.appendChild(card);
    if(!spot.reviewUrl&&spot.sourceUrl&&!spot.type.includes('美食')){
      const source=document.createElement('a');source.className='button-link';source.textContent='推薦貼文 ↗';
      source.href=spot.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';actions.appendChild(source);
    }
    }
    els.cards.insertBefore(fragment,sentinel);
    if(next>=list.length){cardObserver?.disconnect();sentinel.remove();}
  };
  els.cards.append(sentinel);
  appendBatch();
  if(next<list.length){
    cardObserver=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))appendBatch();
    },{rootMargin:'400px'});
    cardObserver.observe(sentinel);
  }
}

const routeEmojiMap={
  '東區周邊散步路線':'🏙️','台北大安文青歷史一日遊':'🏡',
  '坪林茶鄉一日遊':'🍵','大稻埕夕陽路線':'🌇','圓山文藝路線':'🎨',
  '大安療癒路線':'🌷','中山懶人路線':'☕','基隆河右岸跑步路線':'🏃',
  '四獸山縱走路線':'🐾','富陽生態公園－福州山':'🌳','北投文化路徑':'♨️',
  '士林文化路徑':'🎭','大同文化路徑':'🧱','中正文化路徑':'🏛️','萬華文化路徑':'🏮'
};
function routeEmojiFor(route){return route.emoji||routeEmojiMap[route.name]||'🚶'}

// 路線首頁：區域氣泡地圖（台北＋新北放在同一張；位置是示意的相對方位，單位是容器寬高的百分比）
const routeBubblePos={
  淡水:[13,14],北投:[36,22],士林:[50,30],內湖:[72,36],大同:[31,45],中山:[46,52],松山:[66,52],南港:[82,56],
  萬華:[26,64],中正:[39,64],大安:[59,70],信義:[74,71],文山:[62,89],
  板橋:[11,60],鶯歌:[8,84],三峽:[24,88],瑞芳:[88,16],貢寮:[92,34],坪林:[86,82]
};
let browseDistrict='';
function routeDistrictMap(){
  const map=new Map();
  routes.forEach((route,index)=>(route.districts||[]).forEach(d=>{if(!map.has(d))map.set(d,[]);map.get(d).push(index)}));
  return map;
}
function routeDuration(route){return /半日/.test(route.name)?'半日':/一日/.test(route.name)?'一日':'散步'}
function topRouteDistrict(){
  let best='',bestCount=0;
  routeDistrictMap().forEach((list,district)=>{if(routeBubblePos[district]&&list.length>bestCount){best=district;bestCount=list.length}});
  return best;
}
function renderRouteBrowse(){
  const byDistrict=routeDistrictMap();
  const focusKey=document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.focusKey:'';
  if(!browseDistrict||!byDistrict.has(browseDistrict))browseDistrict=topRouteDistrict();
  const holder=document.getElementById('routeBubbles');holder.replaceChildren();
  Object.entries(routeBubblePos).forEach(([district,[x,y]])=>{
    const list=byDistrict.get(district);if(!list)return;
    const n=list.length;
    const button=document.createElement('button');button.type='button';button.className='route-bubble';button.dataset.focusKey=`bubble:${district}`;
    button.style.left=`${x}%`;button.style.top=`${y}%`;
    button.style.setProperty('--size',`${Math.round(Math.min(56,40+(n-1)*2.4))}px`);
    button.setAttribute('aria-pressed',String(district===browseDistrict));
    button.setAttribute('aria-label',`${district}區，${n} 條路線`);
    const count=document.createElement('span');count.className='rb-count';count.textContent=String(n);
    const name=document.createElement('span');name.className='rb-name';name.textContent=district;
    button.append(count,name);
    button.addEventListener('click',()=>{browseDistrict=district;renderRouteBrowse()});
    holder.appendChild(button);
  });
  const list=byDistrict.get(browseDistrict)||[];
  document.getElementById('routeSheetTitle').textContent=`${browseDistrict}區 · ${list.length} 條路線`;
  const row=document.getElementById('routeCards');row.replaceChildren();
  list.forEach(index=>{
    const route=routes[index];
    const card=document.createElement('button');card.type='button';card.className='route-card';
    const tag=document.createElement('span');tag.className='route-card-tag';tag.textContent=`${routeEmojiFor(route)} ${routeDuration(route)}`;
    const title=document.createElement('span');title.className='route-card-name';title.textContent=route.name;
    const others=(route.districts||[]).filter(d=>d!==browseDistrict);
    const meta=document.createElement('span');meta.className='route-card-meta';
    meta.textContent=`${route.stops.length} 站${others.length?` · 也經過${others.join('、')}區`:''}`;
    card.append(tag,title,meta);
    card.addEventListener('click',()=>openRouteDetail(index));
    row.appendChild(card);
  });
  row.scrollLeft=0;
  if(focusKey){const again=document.getElementById('routeBrowse').querySelector(`[data-focus-key="${focusKey}"]`);if(again)again.focus({preventScroll:true})}
}
function showRouteBrowse(){
  document.getElementById('routeDetail').classList.add('hidden');
  document.getElementById('routeBrowse').classList.remove('hidden');
  renderRouteBrowse();
}
function openRouteDetail(index){
  document.getElementById('routeBrowse').classList.add('hidden');
  document.getElementById('routeDetail').classList.remove('hidden');
  renderRoute(index);
  ensureRouteMap();
  window.scrollTo({top:0,behavior:scrollBehavior()});
  window.setTimeout(()=>{updateRoutePinHeight();if(routeMap){routeMap.resize();fitRouteMap()}},0);
  document.getElementById('routeBack').focus({preventScroll:true});
}

function renderRoutes(){
  els.routeCount.textContent=`${routes.length} 條`;
  routes.forEach((route,index)=>els.routeSelect.add(new Option(`${routeEmojiFor(route)} ${route.name}`,String(index))));
  els.routeSelect.addEventListener('change',()=>renderRoute(Number(els.routeSelect.value)));
  document.getElementById('routeBack').addEventListener('click',showRouteBrowse);
  renderRoute(0);
  browseDistrict=topRouteDistrict();
  renderRouteBrowse();
}

function routeStopIcon(name){
  const custom=routeStopDetails[name]?.icon;
  if(custom)return custom;
  if(/書店/.test(name))return '📖';
  if(/碼頭/.test(name))return '⛵';
  if(/夜市/.test(name))return '🏮';
  if(/咖啡/.test(name))return '☕';
  if(/晚餐/.test(name))return '🍽️';
  if(/站|車站/.test(name))return '🚉';
  if(/花市/.test(name))return '🌼';
  if(/博物館|美術館|電影|表演藝術|中山堂/.test(name))return '🖼️';
  if(/公園|山|步道|橋|地熱谷/.test(name))return '🌿';
  return '📍';
}

function routeDirectionsUrl(names){
  const route=routes[selectedRouteIndex];
  const places=names.map(name=>{
    const query=routeStopDetails[name]?.query||name;
    return `${query} ${route.area||'台北'} 台灣`;
  });
  const params=new URLSearchParams({api:'1',origin:places[0],destination:places.at(-1),travelmode:'walking'});
  if(places.length>2)params.set('waypoints',places.slice(1,-1).join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

function renderRouteDirections(route){
  els.routeDirections.replaceChildren();
  for(let start=0,part=1;start<route.stops.length-1;start+=4,part++){
    const names=route.stops.slice(start,start+5);
    const link=document.createElement('a');
    link.className='button-link';
    link.href=routeDirectionsUrl(names);link.target='_blank';link.rel='noopener noreferrer';
    link.textContent=route.stops.length<=5?'在 Google Maps 看路程 ↗':`第 ${part} 段（${start+1}–${start+names.length} 站）↗`;
    els.routeDirections.appendChild(link);
  }
  const hasReferenceStops=route.stops.some(name=>route.mapMode==='places'?routeStopDetails[name]?.approximate:routeStopDetails[name]?.hint);
  if(route.stops.length>5||(route.mapMode!=='links'&&hasReferenceStops)){
    const note=document.createElement('p');note.className='route-directions-note';
    note.textContent=[
      route.stops.length>5?'手機瀏覽器的多站路線分段開啟；兩段在共用站點銜接。':'',
      (route.mapMode!=='links'&&hasReferenceStops)?'標示為示意的站點僅供位置參考；實際店址請用各站的 Google Maps 連結確認。':''
    ].filter(Boolean).join(' ');
    els.routeDirections.appendChild(note);
  }
}

function renderRoute(index){
  selectedRouteIndex=index;
  selectedRouteStop=-1;
  const route=routes[index];
  els.routeSelect.value=String(index);
  document.getElementById('routeDetailTitle').textContent=`${routeEmojiFor(route)} ${route.name}`;
  els.routeMapCanvas.closest('.route-map-pin').classList.toggle('hidden',route.mapMode==='links');
  document.getElementById('routeOrderNote').classList.toggle('hidden',route.mapMode==='links');
  document.querySelector('.route-steps-heading span').textContent=route.mapMode==='links'?'點 ↗ 開啟店家地圖':'點站點可在地圖定位';
  const kind=/跑步|縱走|福州山/.test(route.name)?'🌿 戶外路線':/文化路徑/.test(route.name)?'🏛️ 文化散步':'🚶 散步路線';
  els.routeMeta.innerHTML=`<span>📍 ${route.stops.length} 站</span><span>${kind}</span>`;
  els.routeMapCanvas.setAttribute('aria-label',`${route.name}的站點位置地圖`);
  els.routeStops.replaceChildren();
  route.stops.forEach((name,stopIndex)=>{
    const row=document.createElement('div');row.className='route-step-row';
    const button=document.createElement('button');button.type='button';button.className='route-step';
    button.setAttribute('aria-label',`在地圖定位第 ${stopIndex+1} 站：${name}`);
    const number=document.createElement('span');number.className='order';number.textContent=stopIndex+1;
    const label=document.createElement('span');label.className='name';label.textContent=name;
    const hint=route.hints?.[name]||routeStopDetails[name]?.hint;
    if(hint){const small=document.createElement('small');small.className='hint';small.textContent=hint;label.appendChild(small)}
    button.append(number,label);button.addEventListener('click',()=>focusRouteStop(stopIndex));
    const link=document.createElement('a');link.className='route-step-link';link.textContent='↗';
    link.setAttribute('aria-label',`在 Google Maps 開啟${name}`);
    link.href=mapLink(routeStopDetails[name]?.query||name,route.area||'台北');
    link.target='_blank';link.rel='noopener noreferrer';
    row.append(button,link);els.routeStops.appendChild(row);
  });
  renderRouteDirections(route);
  const trail=/跑步|縱走|福州山/.test(route.name)?' 戶外步道請依現場指標；Google Maps 步行路程僅供參考。':'';
  els.routeNote.textContent=route.note+trail;
  updateRouteMap();
}

function focusRouteStop(index,origin='list'){
  selectedRouteStop=index;
  els.routeStops.querySelectorAll('.route-step').forEach((button,buttonIndex)=>{
    const active=buttonIndex===index;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  routeMarkers.forEach((entry,markerIndex)=>entry.element.classList.toggle('is-active',markerIndex===index));
  const position=routeLocations[routes[selectedRouteIndex].stops[index]];
  if(routeMap&&position)routeMap.easeTo({center:[position[1],position[0]],duration:scrollBehavior()==='smooth'?500:0});
  // 地圖釘在畫面上方：點清單不用再捲回地圖；點地圖上的圖釘時，把對應的清單項目捲到地圖下方
  if(origin==='map'){
    const button=els.routeStops.querySelectorAll('.route-step')[index];
    button?.scrollIntoView({behavior:scrollBehavior(),block:'start'});
    button?.focus({preventScroll:true});
  }
}
function updateRoutePinHeight(){
  const pin=document.getElementById('routeMapPin');
  if(pin&&!pin.classList.contains('hidden'))document.documentElement.style.setProperty('--route-pin-h',`${pin.offsetHeight}px`);
}
window.addEventListener('resize',updateRoutePinHeight);

function fitRouteMap(){
  if(!routeMap||routes[selectedRouteIndex].mapMode==='links')return;
  const positions=routes[selectedRouteIndex].stops.map(name=>routeLocations[name]);
  const bounds=positions.reduce((box,position)=>box.extend([position[1],position[0]]),new maplibregl.LngLatBounds());
  routeMap.fitBounds(bounds,{padding:55,maxZoom:routes[selectedRouteIndex].mapMaxZoom||14.5,duration:0});
}

function updateRouteMap(){
  if(routes[selectedRouteIndex].mapMode==='links')return;
  if(!routeMap||!routeMap.getSource('route-order'))return;
  routeMarkers.forEach(entry=>entry.marker.remove());routeMarkers.length=0;
  const route=routes[selectedRouteIndex];
  const coordinates=route.stops.map(name=>{const point=routeLocations[name];return [point[1],point[0]]});
  routeMap.getSource('route-order').setData({type:'Feature',geometry:{type:'LineString',coordinates}});
  route.stops.forEach((name,index)=>{
    const element=document.createElement('button');element.type='button';element.className='route-pin';
    element.setAttribute('aria-label',`第 ${index+1} 站：${name}`);
    element.innerHTML=`<span aria-hidden="true">${routeStopIcon(name)}</span><span class="order" aria-hidden="true">${index+1}</span>`;
    element.addEventListener('click',()=>focusRouteStop(index,'map'));
    const marker=new maplibregl.Marker({element,anchor:'center',offset:routeStopDetails[name]?.markerOffset||[0,0]}).setLngLat(coordinates[index]).addTo(routeMap);
    routeMarkers.push({marker,element});
  });
  routeMap.resize();fitRouteMap();
}

function ensureRouteMap(){
  if(routeMap)return;
  if(!window.maplibregl){showMapFallback(els.routeMapCanvas,'地圖暫時無法載入；仍可使用下方站點與 Google Maps 連結。');return}
  try{
    routeMap=new maplibregl.Map({
    container:els.routeMapCanvas,
    style:'https://tiles.openfreemap.org/styles/positron',
    center:[121.52,25.05],zoom:12,attributionControl:true,
    localIdeographFontFamily:'"Huninn","Noto Sans TC",sans-serif'
  });
  // 路線地圖：不放縮放按鈕（手機用雙指縮放），正北羅盤放在右上角
  addNorthControl(routeMap,'top-right');
  routeMap.on('load',()=>{
    addStationLayer(routeMap);
    routeMap.addSource('route-order',{type:'geojson',data:{type:'Feature',geometry:{type:'LineString',coordinates:[]}}});
    routeMap.addLayer({id:'route-order-line',type:'line',source:'route-order',paint:{'line-color':'#3E3A39','line-width':3,'line-dasharray':[1.5,2.5]}});
    updateRouteMap();
  });
  }catch(error){
    routeMap=null;
    showMapFallback(els.routeMapCanvas,'這個瀏覽器暫時無法顯示地圖；下方站點與 Google Maps 導航仍可使用。');
  }
}

function distanceKm(spot){
  const position=spot.coords;
  if(!userLocation||!position)return Infinity;
  const radians=Math.PI/180;
  const deltaLat=(position[0]-userLocation.lat)*radians;
  const deltaLng=(position[1]-userLocation.lng)*radians;
  const a=Math.sin(deltaLat/2)**2+Math.cos(userLocation.lat*radians)*Math.cos(position[0]*radians)*Math.sin(deltaLng/2)**2;
  return 6371*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

function spotMeta(spot){
  const distance=userLocation?distanceKm(spot):Infinity;
  const label=Number.isFinite(distance)?(distance<1?`📍距離 ${Math.round(distance*1000)} 公尺`:`📍距離 ${distance.toFixed(1)} 公里`):'距離待確認';
  return `${spot.area}${resultSort==='distance'&&userLocation?`・${label}`:''}`;
}

// 區域選單：依行政區分組（新地區會先看對照表，再從地址判斷，都沒有就放「其他地區」）
const areaDistrictGroups=[
  ['台北市｜中正區',['中正','南機場／中正','南機場','中正紀念堂','台北車站','華山／忠孝新生','忠孝新生','東門','古亭','善導寺','公館']],
  ['台北市｜大同區',['大稻埕','大橋頭／大同']],
  ['台北市｜中山區',['中山／赤峰街','中山／松江南京','中山／晴光','中山／遼寧街','中山／行天宮','中山／京站','中山國小／晴光','松江南京','行天宮','雙連','圓山','南京復興','大直／內湖']],
  ['台北市｜松山區',['松山']],
  ['台北市｜大安區',['東區／大安','永康街／東門','國父紀念館','台電大樓','科技大樓／大安','忠孝復興','忠孝敦化','信義安和']],
  ['台北市｜萬華區',['萬華','西門／萬華','西門','龍山寺／萬華']],
  ['台北市｜信義區',['信義','市政府','台北101／世貿']],
  ['台北市｜士林區',['士林','天母']],
  ['台北市｜北投區',['北投','北投／關渡','陽明山']],
  ['台北市｜內湖區',['內湖','內湖／東湖']],
  ['台北市｜南港區',['南港']],
  ['台北市｜文山區',['文山','景美']],
  ['新北市',['汐止','永和','三重','中和','板橋','蘆洲','鶯歌','石門','新莊','三峽','五股','東北角']],
  ['其他地區',['基隆','桃園／平鎮','台中']]
];

function areaGroupOf(area,list){
  const known=areaDistrictGroups.find(([,areas])=>areas.includes(area));
  if(known)return known[0];
  const address=list.map(spot=>spot.address||'').find(Boolean)||'';
  const taipei=address.match(/[台臺]北市(\S{1,3}?區)/);
  if(taipei&&areaDistrictGroups.some(([label])=>label===`台北市｜${taipei[1]}`))return `台北市｜${taipei[1]}`;
  if(/新北市/.test(address))return '新北市';
  return '其他地區';
}

function buildAreaOptions(){
  const byArea=new Map();
  spots.forEach(spot=>{if(spot.area){if(!byArea.has(spot.area))byArea.set(spot.area,[]);byArea.get(spot.area).push(spot)}});
  const groups=new Map(areaDistrictGroups.map(([label])=>[label,[]]));
  byArea.forEach((list,area)=>groups.get(areaGroupOf(area,list)).push([area,list.length]));
  groups.forEach((items,label)=>{
    if(!items.length)return;
    const group=document.createElement('optgroup');group.label=label;
    items.sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'zh-Hant'))
      .forEach(([area,count])=>group.appendChild(new Option(`${area}（${count}）`,area)));
    els.area.appendChild(group);
  });
}

function initListFilters(){
  buildAreaOptions();
  const preferred=['all','美食','咖啡','書店','戶外','早餐'];
  const tags=[...els.typeTags.querySelectorAll('.type-tag')];
  const originalOrder=new Map(tags.map((tag,index)=>[tag,index]));
  tags.sort((a,b)=>{
    const rank=tag=>{const index=preferred.indexOf(tag.dataset.type);return index<0?preferred.length+originalOrder.get(tag):index};
    return rank(a)-rank(b);
  });
  tags.forEach(tag=>els.typeTags.append(tag));
}

function updateSearchSummary(){
  const conditions=[];
  if(els.keyword.value.trim())conditions.push(`關鍵字「${els.keyword.value.trim()}」`);
  if(selectedType!=='all')conditions.push(selectedType);
  if(els.area.value!=='all')conditions.push(els.area.value);
  els.activeFilters.textContent=conditions.length?`目前條件：${conditions.join(' · ')}`:'';
  els.activeFilters.classList.toggle('hidden',!conditions.length);
  els.resetBtn.classList.toggle('hidden',!conditions.length);
}

function filtered(){
  const area=els.area.value,type=selectedType,query=els.keyword.value.trim().normalize('NFKC').toLocaleLowerCase('zh-TW');
  const matches=spots.filter(spot=>{
    if(area!=='all'&&spot.area!==area)return false;
    if(type!=='all'&&!spot.type.includes(type))return false;
    if(!query)return true;
    return `${spot.name} ${spot.area} ${spot.type.join(' ')} ${spot.note} ${spot.address||''}`.normalize('NFKC').toLocaleLowerCase('zh-TW').includes(query);
  });
  return resultSort==='distance'&&userLocation?matches.sort((a,b)=>distanceKm(a)-distanceKm(b)):matches;
}

function setLocationStatus(message){
  els.locationStatus.textContent=message;
  els.locationStatus.classList.toggle('hidden',!message);
}

function clearLocation(){
  locationRequestId++;
  userLocation=null;
  userMarker?.remove();
  userMarker=null;
  setLocationStatus('');
}



function clearHighlights(){els.recommendation.classList.add('hidden');els.routeSection.classList.add('hidden')}

// 卡片上的類型標籤：加上 emoji、可點選篩選；上方篩選列沒有的類型（如拍照、夜市）不顯示
function typeChips(spot){
  const available=new Set([...els.typeTags.querySelectorAll('[data-type]')].map(tag=>tag.dataset.type));
  return spot.type.filter(tag=>available.has(tag)).map(tag=>`<button type="button" class="chip chip-filter" data-chip-type="${tag}" aria-label="只看${tag}"><span aria-hidden="true">${typeIcons[tag]||''}</span>${tag}</button>`).join('');
}

document.addEventListener('click',event=>{
  const chip=event.target.closest('.chip-filter');
  if(!chip)return;
  const type=chip.dataset.chipType;
  const isMap=document.body.classList.contains('view-map');
  const button=(isMap?document.querySelector(`.map-type-tag[data-type="${type}"]`):null)||els.typeTags.querySelector(`[data-type="${type}"]`);
  if(!button)return;
  selectType(type,button);
  button.scrollIntoView({behavior:scrollBehavior(),block:'nearest',inline:'center'});
  if(!isMap)document.getElementById('listSection')?.scrollIntoView({behavior:scrollBehavior(),block:'start'});
});

function selectType(type,button){
  selectedType=type;
  button.classList.remove('pop'); void button.offsetWidth; button.classList.add('pop');
  window.setTimeout(()=>button.classList.remove('pop'),360);
  document.querySelectorAll('[data-type]').forEach(tag=>{
    const active=tag.dataset.type===type; tag.classList.toggle('active',active); tag.setAttribute('aria-pressed',String(active));
  });
  clearHighlights(); render(filtered(),document.body.classList.contains('view-map')); updateMapSearchUI();
}


function refreshSortedCards(){
  currentResults=filtered();
  els.count.textContent=`${currentResults.length} 個地點`;
  renderCards();
}
function requestSortLocation(){
  const requestId=++locationRequestId;
  sortStatus.hidden=false;
  sortStatus.textContent='正在取得你的位置…';
  resultSortSelect.disabled=true;
  const fail=()=>{
    if(requestId!==locationRequestId)return;
    resultSortSelect.disabled=false;
    resultSort='default';resultSortSelect.value='default';
    sortStatus.replaceChildren(document.createTextNode('無法取得位置，請確認定位權限。 '));
    const retry=document.createElement('button');retry.type='button';retry.textContent='重新定位';
    retry.addEventListener('click',requestSortLocation);sortStatus.append(retry);
    refreshSortedCards();
  };
  if(!navigator.geolocation){fail();return}
  navigator.geolocation.getCurrentPosition(position=>{
    if(requestId!==locationRequestId)return;
    const {latitude:lat,longitude:lng}=position.coords;
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){fail();return}
    userLocation={lat,lng};resultSort='distance';
    resultSortSelect.value='distance';resultSortSelect.disabled=false;
    sortStatus.textContent='依直線距離排序，不限制搜尋範圍。';
    refreshSortedCards();
  },fail,{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
}
resultSortSelect.addEventListener('change',()=>{
  locationRequestId++;
  resultSort=resultSortSelect.value;
  if(resultSort==='distance'){requestSortLocation();return}
  sortStatus.hidden=true;
  refreshSortedCards();
});

let keywordTimer;
const mapKeyword=document.getElementById('mapKeyword');
const mapSearchCount=document.getElementById('mapSearchCount');
const mapSearchClear=document.getElementById('mapSearchClear');
function updateMapSearchUI(){
  if(!mapKeyword)return;
  const hasQuery=Boolean(mapKeyword.value.trim());
  mapSearchClear.hidden=!mapKeyword.value;
  mapSearchCount.hidden=!hasQuery;
  if(hasQuery)mapSearchCount.textContent=currentResults.length?`${currentResults.length} 間`:'找不到';
}
function onKeywordInput(source){
  const other=source===els.keyword?mapKeyword:els.keyword;
  if(other&&other.value!==source.value)other.value=source.value;
  window.clearTimeout(keywordTimer);
  keywordTimer=window.setTimeout(()=>{clearHighlights();render(filtered());updateMapSearchUI();},120);
  if(mapSearchClear)mapSearchClear.hidden=!mapKeyword.value;
}
els.keyword.addEventListener('input',()=>onKeywordInput(els.keyword));
if(mapKeyword){
  mapKeyword.addEventListener('input',()=>onKeywordInput(mapKeyword));
  mapKeyword.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();mapKeyword.blur();}});
  mapSearchClear.addEventListener('click',()=>{mapKeyword.value='';onKeywordInput(mapKeyword);mapKeyword.focus({preventScroll:true});});
}
els.area.addEventListener('change',()=>{clearHighlights();render(filtered());updateMapSearchUI();});
els.typeTags.addEventListener('click',event=>{
  const button=event.target.closest('.type-tag');
  if(!button)return;
  selectType(button.dataset.type,button);
});
els.mapTypeTags.addEventListener('click',event=>{
  let button=event.target.closest('.map-type-tag[data-type]');
  if(!button)return;
  // 再按一次已選的類別 → 取消選擇，回到全部
  if(button.dataset.type!=='all'&&button.dataset.type===selectedType){
    button=els.mapTypeTags.querySelector('[data-type="all"]');
    button.scrollIntoView({behavior:scrollBehavior(),block:'nearest',inline:'nearest'});
  }
  selectType(button.dataset.type,button);
});
els.resetBtn.addEventListener('click',()=>{
  window.clearTimeout(keywordTimer);
  clearLocation();
  resultSort='default';resultSortSelect.value='default';sortStatus.hidden=true;
  els.area.value='all'; els.keyword.value=''; if(mapKeyword)mapKeyword.value=''; selectedType='all';
  document.querySelectorAll('[data-type]').forEach(tag=>{
    const active=tag.dataset.type==='all'; tag.classList.toggle('active',active); tag.setAttribute('aria-pressed',String(active));
  });
  clearHighlights(); render(spots); updateMapSearchUI();
});
els.siteTabs.forEach(tab=>tab.addEventListener('click',()=>setView(tab.dataset.view)));
els.randomBtn.addEventListener('click',()=>{
  const pool=filtered();
  if(!pool.length){els.recommendation.textContent='目前沒有符合條件的地點。';els.recommendation.classList.remove('hidden');return;}
  const grouped={}; pool.forEach(spot=>(grouped[spot.area]??=[]).push(spot));
  const areas=Object.keys(grouped),chosen=areas[Math.floor(Math.random()*areas.length)];
  const picks=[...grouped[chosen]].sort(()=>Math.random()-.5).slice(0,3);
  const title=document.createElement('strong'); title.textContent=`今日推薦：${chosen}`;
  const items=document.createElement('ol');
  picks.forEach(spot=>{
    const item=document.createElement('li'),link=document.createElement('a');
    link.className='inline-map-link';link.href=spotMapLink(spot);link.target='_blank';link.rel='noopener noreferrer';link.textContent=`${spot.name} ↗`;
    item.append(link);items.append(item);
  });
  const note=document.createElement('div');note.className='note';note.textContent='市集、展覽與營業資訊可能變動，出發前請再確認。';
  els.recommendation.replaceChildren(title,items,note);
  els.recommendation.classList.remove('hidden');
});

renderRoutes();
initVectorMap();
initListFilters();
render(spots);
