import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=['data/spots.js','data/routes.js'].map(path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8')).join('\n');
const {spots,routes,routeLocations}=runInNewContext(`${source}\n({spots,routes,routeLocations})`);
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const availableTypes=new Set([...html.matchAll(/data-type="([^"]+)"/g)].map(match=>match[1]));
const errors=[];
const seen=new Set();
const validUrl=value=>{try{return /^https?:$/.test(new URL(value).protocol)}catch{return false}};

for(const [index,spot] of spots.entries()){
  const where=`地點 ${index+1}（${spot.name||'未命名'}）`;
  for(const key of ['name','area','note'])if(typeof spot[key]!=='string'||!spot[key].trim())errors.push(`${where}缺少 ${key}`);
  if(!Array.isArray(spot.type)||!spot.type.length||spot.type.some(type=>!availableTypes.has(type)))errors.push(`${where}的 type 沒有對應標籤`);
  if(!Number.isFinite(spot.hours)||spot.hours<=0)errors.push(`${where}的 hours 無效`);
  if(!Array.isArray(spot.coords)||spot.coords.length!==2||!Number.isFinite(spot.coords[0])||!Number.isFinite(spot.coords[1])||spot.coords[0]<20||spot.coords[0]>28||spot.coords[1]<118||spot.coords[1]>123)errors.push(`${where}的 coords 無效`);
  for(const key of ['mapUrl','guideUrl','reviewUrl','sourceUrl'])if((key==='mapUrl'||spot[key]!==undefined)&&!validUrl(spot[key]))errors.push(`${where}的 ${key} 無效`);
  const identity=`${spot.name}\u0000${spot.area}`;
  if(seen.has(identity))errors.push(`${where}重複`);
  seen.add(identity);
}

for(const route of routes){
  if(!route.name||!Array.isArray(route.stops)||route.stops.length<2)errors.push(`路線 ${route.name||'未命名'} 缺少站點`);
  for(const stop of route.stops||[])if(!routeLocations[stop])errors.push(`路線 ${route.name} 的「${stop}」沒有座標`);
}

if(errors.length){
  console.error(errors.join('\n'));
  process.exitCode=1;
}else{
  console.log(`資料檢查通過：${spots.length} 個地點、${routes.length} 條路線。`);
}
