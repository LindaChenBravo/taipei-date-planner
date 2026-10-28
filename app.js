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
  locateBtn:document.getElementById('locateBtn'), locateLabel:document.getElementById('locateLabel'), locationStatus:document.getElementById('locationStatus'),
  mapExternalLink:document.getElementById('mapExternalLink'), mapCount:document.getElementById('mapCount'),
  siteTabs:[...document.querySelectorAll('.site-tab[data-view]')]
};

let selectedType='all';
let currentMapSpot=null;
let vectorMap=null;
let routeMap=null;
let selectedRouteIndex=0;
let selectedRouteStop=-1;
let userLocation=null;
let userMarker=null;
let locationRequestId=0;
const nearbyRadiusKm=5;
const markerByName=new Map();
const routeMarkers=[];
const scrollBehavior=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
const typeIcons={all:'✦',文創:'✂️',咖啡:'☕',飲品:'🧋',展覽:'🖼️',戶外:'☀️',手作:'🧵',美食:'🍽️',早餐:'🍽️',甜點:'🍰',夜市:'🏮',市集:'🧺',拍照:'📷',泡湯:'♨️',按摩:'💆',書店:'📖',圖書館:'📚','Good Eye':'👁️',音樂:'♫',自然:'🌿'};

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
  return ['咖啡','音樂','自然','戶外','拍照','展覽','手作','文創','夜市'].find(type=>spot.type.includes(type))||'文創';
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

function initVectorMap(){
  if(!window.maplibregl){
    showMapFallback(els.mapCanvas,'互動地圖暫時無法載入，仍可用條件搜尋找地點並開啟 Google Maps。',true);
    return;
  }
  try{
    vectorMap=new maplibregl.Map({
    container:els.mapCanvas,
    style:'https://tiles.openfreemap.org/styles/positron',
    center:[121.545,25.052],
    zoom:11,
    attributionControl:true,
    localIdeographFontFamily:'"Huninn","Noto Sans TC",sans-serif'
  });
  vectorMap.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  }catch(error){
    vectorMap=null;
    showMapFallback(els.mapCanvas,'這個瀏覽器暫時無法顯示互動地圖，請改用條件搜尋或 Google Maps。',true);
  }
}

function updateMarkerSelection(){
  markerByName.forEach((entry,name)=>{
    entry.element.querySelector('.spot-pin')?.classList.toggle('is-active',currentMapSpot?.name===name);
  });
}

function updateMapSpotCard(spot){
  const chips=spot.type.map(tag=>`<span class="chip">${tag}</span>`).join('');
  const sourceLink=spot.guideUrl?`<a class="button-link" href="${spot.guideUrl}" target="_blank" rel="noopener noreferrer">Good Eye 介紹 ↗</a>`:spot.reviewUrl?`<a class="button-link" href="${spot.reviewUrl}" target="_blank" rel="noopener noreferrer">推薦依據 ↗</a>`:spot.sourceUrl?`<a class="button-link" href="${spot.sourceUrl}" target="_blank" rel="noopener noreferrer">推薦貼文 ↗</a>`:'';
  els.mapSpotCard.innerHTML=`<button type="button" class="map-card-close" aria-label="關閉地點圖卡">×</button><div class="spot-illustration">${spotIllustration(spot)}</div><div><h3>${spot.name}</h3><div class="meta">${spotMeta(spot)}</div><div class="spot-tags">${chips}</div><p>${spot.note}</p><div class="map-spot-actions"><a class="button-link" href="${spotMapLink(spot)}" target="_blank" rel="noopener noreferrer">在 Google Maps 開啟 ↗</a>${sourceLink}</div></div>`;
  els.mapSpotCard.classList.remove('hidden');
}

function closeMapSpotCard(){
  const previous=currentMapSpot;
  currentMapSpot=null;
  els.mapSpotCard.classList.add('hidden');
  els.mapTitle.textContent='選擇一個景點';
  els.mapExternalLink.classList.add('hidden');
  updateMarkerSelection();
  markerByName.get(previous?.name)?.element.focus({preventScroll:true});
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
  if(isRoutes){
    ensureRouteMap();
    window.setTimeout(()=>{if(routeMap){routeMap.resize();fitRouteMap()}},0);
  }
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
    vectorMap.easeTo({center:[position[1],position[0]],zoom:Math.max(vectorMap.getZoom(),14),duration:scrollBehavior()==='smooth'?650:0});
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

function renderMapList(list){
  markerByName.forEach(entry=>entry.marker.remove());
  markerByName.clear();
  els.mapCount.textContent=`${list.length} 個地點`;
  currentMapSpot=null;
  els.mapSpotCard.classList.add('hidden');
  els.mapTitle.textContent='選擇一個景點';
  els.mapExternalLink.classList.add('hidden');
  list.forEach(spot=>{
    const position=spot.coords;
    if(vectorMap&&position){
      const element=document.createElement('button');
      element.type='button'; element.className='map-marker'; element.title=spot.name; element.setAttribute('aria-label',spot.name);
      element.innerHTML=`<span class="spot-pin"><span aria-hidden="true">${spotMarkerIcon(spot)}</span></span>`;
      element.addEventListener('click',()=>openInMap(spot,false,true));
      const marker=new maplibregl.Marker({element,anchor:'bottom'}).setLngLat([position[1],position[0]]).addTo(vectorMap);
      markerByName.set(spot.name,{marker,element});
    }
  });
  if(userLocation&&vectorMap){
    vectorMap.easeTo({center:[userLocation.lng,userLocation.lat],zoom:13,duration:scrollBehavior()==='smooth'?650:0});
    window.setTimeout(()=>vectorMap.resize(),0);
    return;
  }
  if(!list.length){
    els.mapTitle.textContent='沒有可顯示的地點';
    els.mapSpotCard.classList.add('hidden');
    els.mapExternalLink.href='https://www.google.com/maps';
    if(vectorMap)vectorMap.jumpTo({center:[121.545,25.052],zoom:11});
  }else{
    if(vectorMap){
      const bounds=list.map(spot=>spot.coords).filter(Boolean);
      if(bounds.length===1)vectorMap.jumpTo({center:[bounds[0][1],bounds[0][0]],zoom:14});
      else if(bounds.length>1){
        const mapBounds=bounds.reduce((acc,point)=>acc.extend([point[1],point[0]]),new maplibregl.LngLatBounds());
        vectorMap.fitBounds(mapBounds,{padding:60,maxZoom:13,duration:scrollBehavior()==='smooth'?650:0});
      }
      window.setTimeout(()=>vectorMap.resize(),0);
    }
  }
}

function render(list){
  updateSearchSummary();
  els.cards.replaceChildren();
  els.count.textContent=`${list.length} 個地點`;
  if(!list.length){els.cards.innerHTML='<div class="card empty">目前沒有符合條件的地點，試著換個關鍵字、類型或區域。</div>';renderMapList(list);return;}
  list.forEach(spot=>{
    const card=document.createElement('article'); card.className='card';
    card.id=`spot-card-${spots.indexOf(spot)}`; card.tabIndex=-1;
    const chips=spot.type.map(tag=>`<span class="chip">${tag}</span>`).join('');
    card.innerHTML=`<div class="card-head"><div class="spot-illustration">${spotIllustration(spot)}</div><div><h3>${spot.name}</h3><div class="meta">${spotMeta(spot)}</div></div></div><p class="note">${spot.note}</p><div>${chips}</div>`;
    const actions=document.createElement('div'); actions.className='card-actions';
    const preview=document.createElement('button'); preview.type='button'; preview.textContent='地圖預覽';
    preview.addEventListener('click',()=>openInMap(spot));
    const external=document.createElement('a'); external.className='button-link'; external.textContent='Google Maps ↗';
    external.href=spotMapLink(spot); external.target='_blank'; external.rel='noopener noreferrer';
    actions.append(preview,external); card.appendChild(actions); els.cards.appendChild(card);
    if(spot.guideUrl||spot.reviewUrl||spot.sourceUrl){
      const source=document.createElement('a');source.className='button-link';source.textContent=spot.guideUrl?'Good Eye 介紹 ↗':spot.reviewUrl?'推薦依據 ↗':'推薦貼文 ↗';
      source.href=spot.guideUrl||spot.reviewUrl||spot.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';actions.appendChild(source);
    }
  });
  renderMapList(list);
}

function renderRoutes(){
  els.routeCount.textContent=`${routes.length} 條`;
  const routeEmojis={
    '坪林茶鄉一日遊':'🍵','大稻埕夕陽路線':'🌇','圓山文藝路線':'🎨',
    '大安療癒路線':'🌷','中山懶人路線':'☕','基隆河右岸跑步路線':'🏃',
    '四獸山縱走路線':'🐾','富陽生態公園－福州山':'🌳','北投文化路徑':'♨️',
    '士林文化路徑':'🎭','大同文化路徑':'🧱','中正文化路徑':'🏛️','萬華文化路徑':'🏮'
  };
  routes.forEach((route,index)=>els.routeSelect.add(new Option(`${routeEmojis[route.name]||'🚶'} ${route.name}`,String(index))));
  els.routeSelect.addEventListener('change',()=>renderRoute(Number(els.routeSelect.value)));
  renderRoute(0);
}

function routeStopIcon(name){
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
  if(['links','places'].includes(routes[selectedRouteIndex].mapMode)){
    const places=names.map(name=>routeStopDetails[name]?.query||`${name} ${routes[selectedRouteIndex].area}`);
    const params=new URLSearchParams({api:'1',origin:places[0],destination:places.at(-1),travelmode:'walking'});
    if(places.length>2)params.set('waypoints',places.slice(1,-1).join('|'));
    return `https://www.google.com/maps/dir/?${params}`;
  }
  const positions=names.map(name=>routeLocations[name]);
  const params=new URLSearchParams({api:'1',origin:positions[0].join(','),destination:positions.at(-1).join(','),travelmode:'walking'});
  if(positions.length>2)params.set('waypoints',positions.slice(1,-1).map(position=>position.join(',')).join('|'));
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
  els.routeMapCanvas.closest('.route-map-wrap').classList.toggle('hidden',route.mapMode==='links');
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
    const hint=routeStopDetails[name]?.hint;
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

function focusRouteStop(index){
  selectedRouteStop=index;
  els.routeStops.querySelectorAll('.route-step').forEach((button,buttonIndex)=>{
    const active=buttonIndex===index;
    button.classList.toggle('is-active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  routeMarkers.forEach((entry,markerIndex)=>entry.element.classList.toggle('is-active',markerIndex===index));
  const position=routeLocations[routes[selectedRouteIndex].stops[index]];
  if(routeMap&&position)routeMap.easeTo({center:[position[1],position[0]],duration:scrollBehavior()==='smooth'?500:0});
}

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
    element.addEventListener('click',()=>focusRouteStop(index));
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
  routeMap.addControl(new maplibregl.NavigationControl({showCompass:false}),'bottom-right');
  routeMap.on('load',()=>{
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
  return `${spot.area}・約 ${spot.hours} 小時${Number.isFinite(distance)?`・距離 ${distance.toFixed(1)} 公里`:''}`;
}

function initListFilters(){
  const areas=[...new Set(spots.map(spot=>spot.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'zh-Hant'));
  areas.forEach(area=>els.area.add(new Option(area,area)));
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
  return userLocation?matches.filter(spot=>distanceKm(spot)<=nearbyRadiusKm).sort((a,b)=>distanceKm(a)-distanceKm(b)):matches;
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
  els.locateBtn.disabled=false;
  els.locateBtn.setAttribute('aria-pressed','false');
  els.locateLabel.textContent='我附近的店';
  setLocationStatus('');
}

function updateNearbyStatus(){
  if(!userLocation)return;
  const count=filtered().length;
  setLocationStatus(count?`已顯示 5 公里內 ${count} 個地點，按「取消定位」可回到完整地圖。`:'5 公里內沒有符合類型的地點，可以試試「全部」或取消定位。');
}

function clearHighlights(){els.recommendation.classList.add('hidden');els.routeSection.classList.add('hidden')}

function selectType(type,button){
  selectedType=type;
  button.classList.remove('pop'); void button.offsetWidth; button.classList.add('pop');
  window.setTimeout(()=>button.classList.remove('pop'),360);
  document.querySelectorAll('[data-type]').forEach(tag=>{
    const active=tag.dataset.type===type; tag.classList.toggle('active',active); tag.setAttribute('aria-pressed',String(active));
  });
  clearHighlights(); render(filtered()); updateNearbyStatus();
}

let keywordTimer;
els.keyword.addEventListener('input',()=>{
  window.clearTimeout(keywordTimer);
  keywordTimer=window.setTimeout(()=>{clearHighlights();render(filtered());updateNearbyStatus()},120);
});
els.area.addEventListener('change',()=>{clearHighlights();render(filtered());updateNearbyStatus()});
els.typeTags.addEventListener('click',event=>{
  const button=event.target.closest('.type-tag');
  if(!button)return;
  selectType(button.dataset.type,button);
});
els.mapTypeTags.addEventListener('click',event=>{
  const button=event.target.closest('.map-type-tag[data-type]');
  if(!button)return;
  selectType(button.dataset.type,button);
});
els.locateBtn.addEventListener('click',()=>{
  if(userLocation){
    clearLocation();
    render(filtered());
    return;
  }
  if(!navigator.geolocation){
    setLocationStatus('這個瀏覽器不支援定位，請使用裝置上的瀏覽器開啟網站。');
    return;
  }
  const requestId=++locationRequestId;
  els.locateBtn.disabled=true;
  els.locateLabel.textContent='定位中…';
  setLocationStatus('正在取得你的位置…');
  navigator.geolocation.getCurrentPosition(position=>{
    if(requestId!==locationRequestId)return;
    const {latitude:lat,longitude:lng}=position.coords;
    if(!Number.isFinite(lat)||!Number.isFinite(lng)){
      els.locateBtn.disabled=false;
      els.locateLabel.textContent='我附近的店';
      setLocationStatus('無法讀取位置，請再試一次。');
      return;
    }
    userLocation={lat,lng};
    els.locateBtn.disabled=false;
    els.locateBtn.setAttribute('aria-pressed','true');
    els.locateLabel.textContent='取消定位';
    if(vectorMap){
      const dot=document.createElement('div');
      dot.className='user-location-dot';
      dot.title='你的位置';
      dot.setAttribute('aria-label','你的位置');
      userMarker=new maplibregl.Marker({element:dot,anchor:'center'}).setLngLat([lng,lat]).addTo(vectorMap);
    }
    render(filtered());
    updateNearbyStatus();
  },error=>{
    if(requestId!==locationRequestId)return;
    els.locateBtn.disabled=false;
    els.locateLabel.textContent='我附近的店';
    setLocationStatus(error.code===1?'無法取得位置，請在瀏覽器允許此網站使用定位後再試。':'定位失敗，請確認裝置定位已開啟後重試。');
  },{enableHighAccuracy:false,timeout:10000,maximumAge:300000});
});
els.resetBtn.addEventListener('click',()=>{
  window.clearTimeout(keywordTimer);
  clearLocation();
  els.area.value='all'; els.keyword.value=''; selectedType='all';
  document.querySelectorAll('[data-type]').forEach(tag=>{
    const active=tag.dataset.type==='all'; tag.classList.toggle('active',active); tag.setAttribute('aria-pressed',String(active));
  });
  clearHighlights(); render(spots);
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
