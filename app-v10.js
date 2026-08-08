const $ = (s) => document.querySelector(s);
const spotsEl = $('#spots');
const statusEl = $('#locationLine');
const sourceState = $('#sourceState');
const resultsTitle = $('#resultsTitle');
const input = $('#addressInput');
const suggestions = $('#suggestions');
const detail = $('#detailSheet');
const detailBody = $('#detailContent');
const toast = $('#toast');

const GEO = 'https://data.geopf.fr/geocodage/search';
const WEATHER = 'https://api.open-meteo.com/v1/forecast';
const MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const OVERPASS = 'https://overpass-api.de/api/interpreter';
const QSB = 'https://static.data.gouv.fr/resources/qualite-des-sites-de-baignade-1/20260709-081710/qualite-sites-baignade.csv';
const CANNES_WEBCAMS = 'https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html';
const SERENITY = 'https://www.cannes.com/fr/index/mentions-legales/experimentation-sur-l-analyse-de-la-frequentation-et-des-parcours-sur-des-secteurs-de-la-commune-de-cannes-projet-serenity.html';
const CANNES_FLOWBIRD = 'https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-sur-la-voie-publique/flowbird.html';
const CANNES_PARKING_HOME = 'https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-dans-les-parkings.html';
const NICE_PARKING_SOURCE = 'https://dataset.nicecotedazur.org/dataset?domain=Parking&id=OffStreetParkingDedale&lang=fr';

const CAMERAS = {
  midi: { id:'midi', name:'Boulevard du Midi', videoId:'z6BNMoj9Pyo', lat:43.5485, lon:6.9941, analyzable:true, thresholds:[3,9,18,30] },
  quai: { id:'quai', name:'Quai Laubeuf', videoId:'asO_10T0k2k', lat:43.5498, lon:7.0122, analyzable:true, thresholds:[3,10,22,38] },
  palm: { id:'palm', name:'Palm Beach', videoId:'8QKBmrb-r8g', lat:43.5369, lon:7.0411, analyzable:false, thresholds:[3,10,20,35] }
};
for (const cam of Object.values(CAMERAS)) cam.watch = `https://www.youtube.com/watch?v=${cam.videoId}`;

const CANNES_PARKINGS = [
  {name:'P1 Palais',capacity:924,lat:43.55125,lon:7.01765,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p1-parking-palais.html'},
  {name:'P2 Suquet Forville',capacity:993,lat:43.55225,lon:7.00785,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p2-parking-suquet-forville.html'},
  {name:'P4 Pantiero',capacity:556,lat:43.55205,lon:7.01255,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p4-parking-pantiero.html'},
  {name:'P5 Ferrage Meynadier',capacity:394,lat:43.55470,lon:7.01170,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p5-parking-ferrage-meynadier.html'},
  {name:'P7 Vauban',capacity:286,lat:43.55800,lon:7.01610,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p7-parking-vauban.html'},
  {name:"P10 Lamy Rue d'Antibes",capacity:417,lat:43.55210,lon:7.03030,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p10-parking-lamy-rue-d-antibes.html'},
  {name:'P11 Roseraie',capacity:395,lat:43.54510,lon:7.03720,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p11-parking-roseraie.html'},
  {name:'Parking Palm Beach municipal',capacity:183,lat:43.5372,lon:7.0388,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/parking-palm-beach.html'}
];

const NICE_PARKINGS = [
  ['Parking Massena',43.69770086,7.26985643],['Parking Saleya',43.69573495,7.27374683],['Parking Palais de Justice',43.69631646,7.27402474],['Parking Les Arts',43.70087911,7.27810532],['Parking Palais Massena',43.69519501,7.25996345],['Parking Ruhl Méridien',43.6956485,7.26596991],['Parking Sulzer',43.69536681,7.27109925],['Parking Lenval',43.6893049,7.2410026],['Parking Arenas',43.6681686,7.2147461],['Parking Magnan',43.6910143,7.2435164]
].map(x=>({name:x[0],lat:x[1],lon:x[2]}));

const FALLBACK = [
 ['Plage du Midi','Cannes',43.54835,7.00566],['Croisette','Cannes',43.55168,7.02677],['Mouré Rouge','Cannes',43.54155,7.03992],['Bijou Plage','Cannes',43.54020,7.03430],['Plage Gazagnaire','Cannes',43.5389,7.0450],
 ['Robinson','Mandelieu-la-Napoule',43.53551,6.94737],['Sables d’Or','Mandelieu-la-Napoule',43.53658,6.94898],['Gravette','Antibes',43.58349,7.12866],['Salis','Antibes',43.57324,7.12760],['Grande Plage','Juan-les-Pins',43.56943,7.10827],
 ['Batterie','Villeneuve-Loubet',43.6376,7.1335],['Serre','Cagnes-sur-Mer',43.6589,7.1534],['Carras','Nice',43.68101,7.22885],['Florida','Nice',43.6902,7.2485],['Ponchettes','Nice',43.69509,7.27608],['Coco Beach','Nice',43.6896,7.2972],
 ['Marinières','Villefranche-sur-Mer',43.7059,7.3140],['Petite Afrique','Beaulieu-sur-Mer',43.7042,7.3336],['Paloma Beach','Saint-Jean-Cap-Ferrat',43.6870,7.3384],['Mala','Cap-d’Ail',43.7205,7.4075],['Larvotto','Monaco',43.7470,7.4380],
 ['Borrigo','Menton',43.7739,7.4932],['Sablettes','Menton',43.7782,7.5060],['Fossan','Menton',43.7756,7.5018],['Veillat','Saint-Raphaël',43.4218,6.7680],['Agay','Saint-Raphaël',43.4316,6.8562],
 ['Pampelonne','Ramatuelle',43.2368,6.6590],['Bouillabaisse','Saint-Tropez',43.2670,6.6270],['Canoubiers','Saint-Tropez',43.2770,6.6540],['Gigaro','La Croix-Valmer',43.1831,6.5863]
].map((x,i)=>({id:`f${i}`,name:x[0],city:x[1],lat:x[2],lon:x[3],source:'catalogue'}));

let center = {lat:43.5528,lon:7.0174,label:'Cannes'};
let officialBeaches = [];
let beaches = [];
let selected = null;
let geoTimer = null;
let crowdTimer = null;
const conditionsCache = new Map();
const crowdCache = new Map();
let visionModel = null;
let visionLoading = null;

const esc = (s='') => String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm = (s='') => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const km = (a,b,c,d) => { const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2; return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z)); };
const fmt = d => d < 1 ? `${Math.round(d*1000)} m` : `${d.toFixed(d<10?1:0)} km`;
const clamp = (n,a=0,b=100) => Math.max(a,Math.min(b,n));
function toastMsg(t){ toast.textContent=t; toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),2200); }
function setStatus(t,state=''){ statusEl.className=`location-line ${state}`; statusEl.innerHTML=`<span class="pulse"></span>${esc(t)}`; }
async function fetchTimeout(url,opts={},ms=7000){ const c=new AbortController(); const t=setTimeout(()=>c.abort(),ms); try{return await fetch(url,{...opts,signal:c.signal})} finally{clearTimeout(t)} }

function parseCSV(text){
 const first=(text.split(/\r?\n/,1)[0]||''); const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':','; const rows=[]; let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){ const ch=text[i]; if(q){ if(ch==='"'&&text[i+1]==='"'){cell+='"';i++} else if(ch==='"')q=false; else cell+=ch; } else if(ch==='"')q=true; else if(ch===delimiter){row.push(cell);cell=''} else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''} else cell+=ch; }
 if(cell||row.length){row.push(cell);rows.push(row)} if(!rows.length)return[]; const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,'').trim()); return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));
}

async function loadOfficialBeaches(){
 try{
  const r=await fetchTimeout(QSB,{cache:'no-store'},6500); if(!r.ok)throw new Error('qsb');
  const data=parseCSV(await r.text());
  officialBeaches=data.map((x,i)=>({id:`q${i}`,name:x.nom_site||'Site de baignade',city:x.libelle_geographique||'',lat:Number((x.latitude||'').replace(',','.')),lon:Number((x.longitude||'').replace(',','.')),quality:x.qualite||'',source:'officiel'})).filter(x=>Number.isFinite(x.lat)&&Number.isFinite(x.lon));
  sourceState.className='source-state ok'; sourceState.innerHTML=`<div>✓</div><div><b>${officialBeaches.length.toLocaleString('fr-FR')} sites officiels disponibles</b><small>Catalogue local affiché immédiatement, base nationale synchronisée en arrière-plan.</small></div>`;
  refresh(false);
 } catch {
  sourceState.className='source-state warn'; sourceState.innerHTML='<div>!</div><div><b>Base nationale indisponible</b><small>La Côte d’Azur reste utilisable avec le catalogue embarqué.</small></div>';
 }
}

function cameraMeta(b){
 if(!norm(b.city).includes('cannes')) return null;
 const n=norm(b.name);
 if(n.includes('midi')) return {cam:CAMERAS.midi,coverage:'direct'};
 if(n.includes('laubeuf')) return {cam:CAMERAS.quai,coverage:'direct'};
 if(n.includes('moure')||n.includes('bijou')||n.includes('gazagnaire')||n.includes('palm')) return {cam:CAMERAS.palm,coverage:'direct'};
 if(n.includes('croisette')) return {cam:CAMERAS.quai,coverage:'nearby'};
 const nearest=Object.values(CAMERAS).map(cam=>({cam,d:km(b.lat,b.lon,cam.lat,cam.lon)})).sort((a,b)=>a.d-b.d)[0];
 if(nearest&&nearest.d<0.9) return {cam:nearest.cam,coverage:'direct'};
 if(nearest&&nearest.d<1.8) return {cam:nearest.cam,coverage:'nearby'};
 return null;
}
function serenityMeta(b){ const c=norm(b.city),n=norm(b.name); return c.includes('cannes')&&(n.includes('croisette')||n.includes('midi')); }
function crowdBadge(b){
 const m=cameraMeta(b),cached=m?crowdCache.get(m.cam.id):null;
 if(cached&&m.coverage==='direct') return `<span class="chip realtime-chip">🤖 ${esc(cached.label)} · webcam</span>`;
 if(m?.coverage==='direct'&&m.cam.analyzable) return '<span class="chip realtime-chip">🤖 Affluence IA webcam</span>';
 if(m?.coverage==='direct') return '<span class="chip realtime-chip">📹 Caméra LIVE</span>';
 if(m?.coverage==='nearby') return '<span class="chip serenity-chip">📹 Caméra proche · pas même zone</span>';
 if(serenityMeta(b)) return '<span class="chip serenity-chip">👥 SERENITY actif · flux non public</span>';
 return '<span class="chip">👥 Affluence non publique</span>';
}

function qualityFor(b){
 if(b.source==='officiel') return b.quality||'';
 if(!officialBeaches.length) return '';
 const bn=norm(b.name); let best=null;
 for(const o of officialBeaches){ const d=km(b.lat,b.lon,o.lat,o.lon); if(d>0.45)continue; const on=norm(o.name); const words=bn.split(' ').filter(x=>x.length>3); const similar=words.some(w=>on.includes(w))||on.split(' ').some(w=>w.length>3&&bn.includes(w)); if(!similar&&d>0.15)continue; const rank=d+(similar?0:0.2); if(!best||rank<best.rank)best={o,rank}; }
 return best?.o?.quality||'';
}

async function geocode(q,limit=6){ const u=new URL(GEO); u.searchParams.set('q',q);u.searchParams.set('limit',limit);u.searchParams.set('autocomplete','true'); const r=await fetchTimeout(u,{},6000);if(!r.ok)throw new Error('geo'); return (await r.json()).features||[]; }
async function searchAddress(){ const q=input.value.trim(); if(q.length<3)return toastMsg('Saisis une adresse ou un lieu'); setStatus('Recherche de l’adresse…','loading'); try{const x=(await geocode(q,1))[0];if(!x)throw 0;const [lon,lat]=x.geometry.coordinates;center={lat,lon,label:x.properties?.label||q};input.value=center.label;suggestions.classList.add('hidden');setStatus(`📍 ${center.label}`,'active');refresh(true);}catch{setStatus('Adresse introuvable ou géocodeur indisponible.','warn')} }
function locate(){
 if(!navigator.geolocation){setStatus('GPS non disponible : utilise une adresse.','warn');return}
 setStatus('Recherche GPS précise…','loading');
 navigator.geolocation.getCurrentPosition(p=>{center={lat:p.coords.latitude,lon:p.coords.longitude,label:`Position GPS ±${Math.round(p.coords.accuracy)} m`};input.value='';setStatus(`⌖ ${center.label}`,'active');refresh(true);},e=>{setStatus(e.code===1?'Localisation refusée : utilise simplement une adresse.':'Position indisponible : utilise une adresse.','warn')},{enableHighAccuracy:true,maximumAge:0,timeout:10000});
}

function beachPool(){
 const rad=Number($('#radiusSelect').value); const local=FALLBACK.map(b=>({...b,quality:qualityFor(b)}));
 const off=officialBeaches.map(b=>({...b})); const pool=[...local,...off]; const dedup=[];
 for(const b of pool){ const d=km(center.lat,center.lon,b.lat,b.lon); if(d>rad)continue; const duplicate=dedup.some(x=>km(x.lat,x.lon,b.lat,b.lon)<0.12&&(norm(x.name).includes(norm(b.name))||norm(b.name).includes(norm(x.name)))); if(!duplicate)dedup.push({...b,distance:d}); }
 return dedup.sort((a,b)=>a.distance-b.distance).slice(0,24);
}
function refresh(scroll){ beaches=beachPool(); resultsTitle.textContent=`Plages à moins de ${$('#radiusSelect').value} km de ${center.label}`; render(); enrichVisible(); if(scroll)$('#resultsSection')?.scrollIntoView({behavior:'smooth',block:'start'}); }

function scoreConditions(b,w,m){
 const parts=[]; const q=qualityFor(b); if(q){const n=norm(q); const v=n.includes('excellent')?98:n.includes('bon')?86:n.includes('suff')?63:n.includes('insuff')?25:null;if(v!=null)parts.push({v,w:30});}
 if(w.ok){let v=100;if(Number(w.rain)>.2)v-=30;if(Number(w.wind)>30)v-=30;else if(Number(w.wind)>20)v-=14;if(Number(w.temp)<20)v-=15;parts.push({v:clamp(v),w:35});}
 if(m.ok){let v=100;if(Number(m.wave)>1.2)v-=35;else if(Number(m.wave)>.7)v-=15;if(Number(m.current)>.8)v-=25;else if(Number(m.current)>.45)v-=10;parts.push({v:clamp(v),w:35});}
 const coverage=parts.reduce((s,x)=>s+x.w,0); return {value:coverage?Math.round(parts.reduce((s,x)=>s+x.v*x.w,0)/coverage):null,coverage};
}
async function getConditions(b){ const key=`${b.lat.toFixed(3)},${b.lon.toFixed(3)}`; const c=conditionsCache.get(key);if(c&&Date.now()-c.at<7*60*1000)return c;
 const wu=new URL(WEATHER);wu.searchParams.set('latitude',b.lat);wu.searchParams.set('longitude',b.lon);wu.searchParams.set('current','temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m');wu.searchParams.set('timezone','auto');
 const mu=new URL(MARINE);mu.searchParams.set('latitude',b.lat);mu.searchParams.set('longitude',b.lon);mu.searchParams.set('current','wave_height,sea_surface_temperature,ocean_current_velocity');mu.searchParams.set('cell_selection','sea');
 const [w,m]=await Promise.all([
  fetchTimeout(wu,{},5500).then(async r=>{const x=await r.json(),v=x.current||{};return{ok:r.ok,temp:v.temperature_2m,rain:v.precipitation,wind:v.wind_speed_10m,gust:v.wind_gusts_10m,time:v.time}}).catch(()=>({ok:false})),
  fetchTimeout(mu,{},5500).then(async r=>{const x=await r.json(),v=x.current||{};return{ok:r.ok,sea:v.sea_surface_temperature,wave:v.wave_height,current:v.ocean_current_velocity,time:v.time}}).catch(()=>({ok:false}))
 ]);
 const s=scoreConditions(b,w,m); const out={w,m,s,at:Date.now()};conditionsCache.set(key,out);return out;
}

function render(){
 if(!beaches.length){spotsEl.innerHTML='<div class="empty">Aucune plage trouvée dans ce rayon. Augmente le rayon ou choisis une autre adresse.</div>';return}
 spotsEl.innerHTML=beaches.map(b=>`<article class="spot-card" data-id="${b.id}"><div class="spot-head"><div><div class="spot-name">${esc(b.name)}</div><div class="spot-city">${esc(b.city||'France')}</div></div><div class="distance">${fmt(b.distance)}</div></div><div class="spot-score"><div class="score-ring" style="--score:0"><b>…</b></div><div class="score-copy"><b>Conditions en calcul</b><small>Météo + mer + qualité si disponible</small></div></div><div class="chips"><span class="chip live">🌊 Mer</span>${crowdBadge(b)}<span class="chip">🅿️ Parking dans la fiche</span></div><div class="card-foot"><span>${b.source==='officiel'?'Site officiel':'Catalogue local'}</span><span>Voir les preuves →</span></div></article>`).join('');
 document.querySelectorAll('.spot-card').forEach(el=>el.onclick=()=>openDetail(beaches.find(b=>b.id===el.dataset.id)));
}
async function enrichVisible(){
 for(const b of beaches.slice(0,10)) getConditions(b).then(d=>{const el=document.querySelector(`[data-id="${CSS.escape(b.id)}"]`);if(!el)return;const ring=el.querySelector('.score-ring'),copy=el.querySelector('.score-copy');ring.style.setProperty('--score',d.s.value||0);ring.querySelector('b').textContent=d.s.value??'—';copy.innerHTML=d.s.value==null?'<b>Données insuffisantes</b><small>Aucun score inventé</small>':`<b>Conditions ${d.s.value}/100</b><small>Couverture ${d.s.coverage}% · affluence/parking séparés</small>`;});
}

async function osmParking(b){
 const q=`[out:json][timeout:7];(nwr["amenity"="parking"](around:2200,${b.lat},${b.lon}););out center tags;`;
 try{const r=await fetchTimeout(OVERPASS,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'data='+encodeURIComponent(q)},8000);const j=await r.json();return(j.elements||[]).map(e=>{const lat=e.lat??e.center?.lat,lon=e.lon??e.center?.lon,t=e.tags||{},access=norm(t.access);if(!Number.isFinite(lat)||['private','customers','permit'].includes(access))return null;return{name:t.name||'Parking public',lat,lon,d:km(b.lat,b.lon,lat,lon),capacity:t.capacity||null,fee:t.fee||null};}).filter(Boolean).sort((a,b)=>a.d-b.d).slice(0,6);}catch{return[]}
}
async function niceLive(){try{const r=await fetchTimeout('/api/parking-nice',{},4000);const j=await r.json();return j.enabled?j.parkings:null}catch{return null}}
async function parkingFor(b){
 if(norm(b.city).includes('cannes')) return {kind:'cannes',rows:CANNES_PARKINGS.map(p=>({...p,d:km(b.lat,b.lon,p.lat,p.lon)})).sort((a,b)=>a.d-b.d).slice(0,6)};
 const nearNice=km(b.lat,b.lon,43.70,7.27)<18; if(nearNice){const live=await niceLive();if(live?.length)return{kind:'nice-live',rows:live.map(x=>({...x,d:km(b.lat,b.lon,x.lat,x.lon)})).filter(x=>x.d<6).sort((a,b)=>a.d-b.d).slice(0,8)};return{kind:'nice-gated',rows:NICE_PARKINGS.map(x=>({...x,d:km(b.lat,b.lon,x.lat,x.lon)})).filter(x=>x.d<6).sort((a,b)=>a.d-b.d).slice(0,8)};}
 return {kind:'osm',rows:await osmParking(b)};
}

function loadScript(src,globalName){return new Promise((resolve,reject)=>{if(globalName&&window[globalName])return resolve();const s=document.createElement('script');s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
async function ensureVision(){
 if(visionModel)return visionModel;if(visionLoading)return visionLoading;
 visionLoading=(async()=>{await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js','tf');await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js','cocoSsd');await tf.ready();visionModel=await cocoSsd.load({base:'lite_mobilenet_v2'});return visionModel;})();
 try{return await visionLoading}finally{visionLoading=null}
}
function crowdLabel(count,thresholds){if(count<=thresholds[0])return'Très calme';if(count<=thresholds[1])return'Peu fréquentée';if(count<=thresholds[2])return'Affluence modérée';if(count<=thresholds[3])return'Fréquentée';return'Très fréquentée'}
function avgBrightness(ctx,w,h){const sw=Math.min(w,320),sh=Math.min(h,180),c=document.createElement('canvas');c.width=sw;c.height=sh;const x=c.getContext('2d');x.drawImage(ctx.canvas,0,0,sw,sh);const d=x.getImageData(0,0,sw,sh).data;let sum=0,n=0;for(let i=0;i<d.length;i+=16){sum+=(d[i]+d[i+1]+d[i+2])/3;n++;}return sum/n;}
async function analyzeCamera(meta,b,manual=false){
 const cam=meta.cam;const box=$('#crowdAnalysis');if(!box||!cam.analyzable||meta.coverage!=='direct')return;
 box.innerHTML='<div class="analysis-loading"><span class="spinner"></span><div><b>Analyse visuelle de la webcam…</b><small>Détection locale des personnes, aucune reconnaissance faciale.</small></div></div>';
 try{
  const model=await ensureVision();
  const img=new Image();img.crossOrigin='anonymous';img.src=`/api/webcam-snapshot?camera=${encodeURIComponent(cam.id)}&t=${Date.now()}`;await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const brightness=avgBrightness(ctx,canvas.width,canvas.height);
  const preds=await model.detect(img,100,0.18);const persons=preds.filter(p=>p.class==='person'&&p.score>=0.22&&p.bbox[3]>=8);
  ctx.lineWidth=Math.max(2,canvas.width/500);ctx.font=`${Math.max(12,canvas.width/70)}px sans-serif`;
  for(const p of persons){ctx.strokeStyle='rgba(93,242,220,.95)';ctx.fillStyle='rgba(3,20,30,.72)';ctx.strokeRect(...p.bbox);ctx.fillRect(p.bbox[0],Math.max(0,p.bbox[1]-22),88,22);ctx.fillStyle='white';ctx.fillText(`personne ${Math.round(p.score*100)}%`,p.bbox[0]+3,Math.max(15,p.bbox[1]-6));}
  const mean=persons.length?persons.reduce((s,p)=>s+p.score,0)/persons.length:0.45;const label=brightness<38?'Image trop sombre pour conclure':crowdLabel(persons.length,cam.thresholds);const confidence=brightness<38?null:Math.round(clamp(mean*100*0.9,35,85));
  const result={label,count:persons.length,confidence,at:Date.now(),brightness};crowdCache.set(cam.id,result);
  box.innerHTML=`<div class="analysis-result"><div class="analysis-top"><div><span class="eyebrow">ESTIMATION IA · WEBCAM</span><h3>${esc(label)}</h3><p>${persons.length} personne${persons.length>1?'s':''} détectée${persons.length>1?'s':''} dans le champ${confidence?` · confiance visuelle ${confidence}%`:''}.</p></div><button id="reanalyzeBtn" class="soft-btn">↻ Réanalyser</button></div><canvas id="analysisCanvas"></canvas><div class="analysis-note">Analyse effectuée à ${new Date(result.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}. <b>Ce n’est pas un comptage municipal</b> : les personnes petites, masquées ou hors champ peuvent ne pas être détectées. Aucune identification ni reconnaissance faciale.</div></div>`;
  const out=$('#analysisCanvas');out.width=canvas.width;out.height=canvas.height;out.getContext('2d').drawImage(canvas,0,0);$('#reanalyzeBtn').onclick=()=>analyzeCamera(meta,b,true);
  render(); enrichVisible();
  if(!manual){clearTimeout(crowdTimer);crowdTimer=setTimeout(()=>{if(selected?.id===b.id&&!detail.classList.contains('hidden'))analyzeCamera(meta,b,false)},90000)}
 }catch(e){box.innerHTML=`<div class="analysis-error"><b>Analyse automatique indisponible</b><p>La caméra live reste accessible. L’analyse IA peut échouer si YouTube ne fournit pas de snapshot ou si le modèle n’a pas pu se charger.</p><a href="${cam.watch}" target="_blank" rel="noopener">Voir la caméra en direct ↗</a></div>`;}
}

async function openDetail(b){
 selected=b;clearTimeout(crowdTimer);detail.classList.remove('hidden');const [cond,park]=await Promise.all([getConditions(b),parkingFor(b)]);const meta=cameraMeta(b);const q=qualityFor(b);
 const crowdIntro=meta?.coverage==='direct'&&meta.cam.analyzable?`<div id="crowdAnalysis"><div class="analysis-loading"><span class="spinner"></span><div><b>Préparation de l’analyse webcam…</b><small>Estimation visuelle expérimentale.</small></div></div></div>`:meta?.coverage==='direct'?`<div class="crowd-info"><b>📹 Caméra LIVE disponible</b><p>Cette caméra est utile comme preuve visuelle, mais son angle n’est pas encore validé pour un comptage automatique robuste.</p></div>`:meta?.coverage==='nearby'?`<div class="crowd-info"><b>📹 Caméra proche : ${esc(meta.cam.name)}</b><p>Elle ne couvre pas exactement cette plage : elle est proposée comme contexte, pas comme mesure d’affluence de ce spot.</p></div>`:serenityMeta(b)?`<div class="crowd-info"><b>👥 SERENITY mesure cette zone</b><p>La Ville effectue un comptage, mais le flux agrégé n’est pas publié en API.</p></div>`:`<div class="crowd-info"><b>Affluence temps réel non publiée</b><p>Aucun niveau n’est inventé.</p></div>`;
 const cameraViewer=meta?`<section class="live-section"><div class="live-section-head"><div><span class="live-dot-v10"></span><b>CAMÉRA LIVE · ${esc(meta.cam.name)}</b><small>${meta.coverage==='nearby'?'Secteur proche · ne couvre pas exactement ce spot':'Flux officiel Cannes'}</small></div><a href="${meta.cam.watch}" target="_blank" rel="noopener">YouTube ↗</a></div><div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${meta.cam.videoId}?autoplay=0&mute=1&playsinline=1" title="Webcam ${esc(meta.cam.name)}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div></section>`:'';
 const rows=park.rows.map(x=>{let right='localisé';if(park.kind==='cannes')right='places libres non publiées';if(park.kind==='nice-gated')right='live à activer';if(park.kind==='nice-live'&&Number.isFinite(x.available))right=`${x.available} libres${Number.isFinite(x.total)?` / ${x.total}`:''}`;const cap=x.capacity?` · ${x.capacity} places au total`:'';const link=x.url?`<a class="parking-link" href="${x.url}" target="_blank" rel="noopener">fiche officielle ↗</a>`:'';return`<div class="mini-row parking-row"><div><b>${esc(x.name)}</b><span>${fmt(x.d)} à vol d’oiseau${cap}</span>${link}</div><b class="${park.kind==='nice-live'?'live':'not-live'}">${esc(right)}</b></div>`}).join('')||'<div class="mini-row"><b>Aucun parking public structuré trouvé</b></div>';
 const parkingActions=park.kind==='cannes'?`<div class="parking-actions"><a href="${CANNES_FLOWBIRD}" target="_blank" rel="noopener">🚗 Voirie temps réel Flowbird ↗</a><a href="${CANNES_PARKING_HOME}" target="_blank" rel="noopener">🅿️ Cannes Parking officiel ↗</a></div>`:park.kind.startsWith('nice')?`<div class="parking-actions"><a href="${NICE_PARKING_SOURCE}" target="_blank" rel="noopener">Source parking Métropole Nice ↗</a></div>`:'';
 detailBody.innerHTML=`<div class="detail-hero"><p class="eyebrow">V10 · DONNÉES TRAÇABLES</p><h2>${esc(b.name)}</h2><div class="detail-sub">${esc(b.city)} · ${fmt(b.distance)}</div><div class="detail-score-row"><div class="detail-score">${cond.s.value??'—'}</div><div><b>Conditions plage</b><div class="muted">Couverture ${cond.s.coverage}% · affluence et parking évalués séparément</div></div></div></div>${cameraViewer}<div class="detail-grid"><div class="detail-tile"><span>Mer</span><strong>${cond.m.ok&&cond.m.sea!=null?`${Math.round(cond.m.sea)}°C · vagues ${Number(cond.m.wave||0).toFixed(1)} m`:'indisponible'}</strong><small>Modèle actualisé</small></div><div class="detail-tile"><span>Météo</span><strong>${cond.w.ok?`${Math.round(cond.w.temp)}° · vent ${Math.round(cond.w.wind)} km/h`:'indisponible'}</strong><small>Modèle actualisé</small></div><div class="detail-tile"><span>Qualité baignade</span><strong>${esc(q||'non associée')}</strong><small>Classement officiel quand le rattachement est sûr</small></div><div class="detail-tile"><span>Affluence</span><strong>${meta?.coverage==='direct'&&meta.cam.analyzable?'Analyse webcam disponible':meta?.coverage==='direct'?'Caméra live':serenityMeta(b)?'Comptage municipal non public':'non publiée'}</strong><small>Aucun faux pourcentage</small></div></div><section class="crowd-section"><div class="nearby-head-v10"><div><span class="eyebrow">AFFLUENCE</span><h3>👥 Ce qu’on sait maintenant</h3></div></div>${crowdIntro}</section><div class="nearby-block"><div class="nearby-head-v10"><div><span class="eyebrow">STATIONNEMENT</span><h3>🅿️ Parkings proches</h3></div><span class="data-rule">libres ≠ capacité</span></div><div class="mini-list">${rows}</div>${parkingActions}<p class="parking-note">Le nombre de places libres n’est affiché que lorsqu’un flux officiel le fournit. Sinon l’app montre uniquement la capacité connue et la distance.</p></div><div class="source-box"><h3>Sources & limites</h3><div class="source-line">Webcams : Ville de Cannes / YouTube. Analyse visuelle : COCO-SSD dans ton navigateur, sans reconnaissance faciale. Météo/mer : modèles Open-Meteo. Parkings Cannes : capacités officielles. ${serenityMeta(b)?'SERENITY : comptage municipal actif, flux public non disponible.':''}</div><div class="source-actions">${meta?`<a href="${CANNES_WEBCAMS}" target="_blank" rel="noopener">Webcams Cannes ↗</a>`:''}${serenityMeta(b)?`<a href="${SERENITY}" target="_blank" rel="noopener">SERENITY ↗</a>`:''}</div></div>`;
 if(meta?.coverage==='direct'&&meta.cam.analyzable) analyzeCamera(meta,b,false);
}
function closeDetail(){clearTimeout(crowdTimer);detail.classList.add('hidden');selected=null}

document.querySelectorAll('[data-close-detail]').forEach(x=>x.onclick=closeDetail);
$('#searchBtn').onclick=searchAddress;$('#locateBtn').onclick=locate;$('#refreshBtn').onclick=()=>refresh(false);$('#radiusSelect').onchange=()=>refresh(false);$('#clearSearch').onclick=()=>{input.value='';suggestions.classList.add('hidden');$('#clearSearch').classList.add('hidden')};
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();searchAddress()}});
input.addEventListener('input',()=>{clearTimeout(geoTimer);$('#clearSearch').classList.toggle('hidden',!input.value);geoTimer=setTimeout(async()=>{const q=input.value.trim();if(q.length<3)return suggestions.classList.add('hidden');try{const f=await geocode(q,6);suggestions.innerHTML=f.map((x,i)=>`<div class="suggestion" data-i="${i}"><b>${esc(x.properties?.label||'Résultat')}</b><small>${esc(x.properties?.context||'France')}</small></div>`).join('');suggestions.classList.toggle('hidden',!f.length);suggestions.querySelectorAll('.suggestion').forEach(el=>el.onclick=()=>{const x=f[Number(el.dataset.i)],[lon,lat]=x.geometry.coordinates;center={lat,lon,label:x.properties?.label||q};input.value=center.label;suggestions.classList.add('hidden');setStatus(`📍 ${center.label}`,'active');refresh(true)});}catch{suggestions.classList.add('hidden')}},260)});
document.addEventListener('click',e=>{if(!e.target.closest('.search-box'))suggestions.classList.add('hidden')});

sourceState.className='source-state ok';sourceState.innerHTML='<div>✓</div><div><b>V10 prête</b><small>Côte d’Azur immédiate · sources nationales et temps réel chargés en arrière-plan.</small></div>';
refresh(false);loadOfficialBeaches();if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').then(r=>r.update()).catch(()=>{});
