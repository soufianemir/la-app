const $=s=>document.querySelector(s);
const spotsEl=$('#spots'),sourceState=$('#sourceState'),resultsTitle=$('#resultsTitle'),locationLine=$('#locationLine'),addressInput=$('#addressInput'),suggestionsEl=$('#suggestions'),clearSearch=$('#clearSearch'),showMore=$('#showMore'),detailSheet=$('#detailSheet'),detailContent=$('#detailContent'),toast=$('#toast');

const QSB_CSV='https://static.data.gouv.fr/resources/qualite-des-sites-de-baignade-1/20260709-081710/qualite-sites-baignade.csv';
const QSB_PAGE='https://www.data.gouv.fr/datasets/qualite-des-sites-de-baignade-1';
const HEALTH_PAGE='https://baignades.sante.gouv.fr/baignades/homeMap.do';
const CANNES_WEBCAMS='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html';
const NICE_PARKING_SOURCE='https://dataset.nicecotedazur.org/dataset?domain=Parking&id=OffStreetParkingDedale&lang=fr';
const IGN_GEOCODE='https://data.geopf.fr/geocodage/search';
const IGN_REVERSE='https://data.geopf.fr/geocodage/reverse';
const WEATHER_API='https://api.open-meteo.com/v1/forecast';
const MARINE_API='https://marine-api.open-meteo.com/v1/marine';
const OVERPASS='https://overpass-api.de/api/interpreter';

const FALLBACK_LOCATION={lat:43.5528,lon:7.0174,label:'Cannes'};
let beaches=[],location=null,visibleCount=8,currentResults=[],selected=null,map=null,mapLayers={},addressTimer=null;

const FALLBACK_BEACHES=[
 ['Plage du Midi','Cannes',43.54835,7.00566,'Excellente'],['Croisette','Cannes',43.55168,7.02677,'Excellente'],['Mouré Rouge','Cannes',43.54155,7.03992,'Excellente'],['Bijou Plage','Cannes',43.54020,7.03430,'Excellente'],
 ['Plage Robinson','Mandelieu-la-Napoule',43.53551,6.94737,'Excellente'],['Sables d’Or','Mandelieu-la-Napoule',43.53658,6.94898,'Excellente'],['Plage de la Salis','Antibes',43.57324,7.12760,'Excellente'],['Plage de la Gravette','Antibes',43.58349,7.12866,'Excellente'],
 ['Grande Plage','Juan-les-Pins',43.56943,7.10827,'Excellente'],['Plage de la Gallice','Juan-les-Pins',43.56356,7.11681,'Excellente'],['Plage de la Serre','Cagnes-sur-Mer',43.6589,7.1534,'Excellente'],['Plage de la Batterie','Villeneuve-Loubet',43.6376,7.1335,'Excellente'],
 ['Carras','Nice',43.68101,7.22885,'Excellente'],['Florida','Nice',43.6902,7.2485,'Excellente'],['Ponchettes','Nice',43.69509,7.27608,'Excellente'],['Coco Beach','Nice',43.6896,7.2972,'Excellente'],
 ['Plage des Marinières','Villefranche-sur-Mer',43.7059,7.3140,'Excellente'],['Plage de la Petite Afrique','Beaulieu-sur-Mer',43.7042,7.3336,'Excellente'],['Paloma Beach','Saint-Jean-Cap-Ferrat',43.6870,7.3384,'Excellente'],['Plage Mala','Cap-d’Ail',43.7205,7.4075,'Excellente'],
 ['Larvotto','Monaco',43.7470,7.4380,'Excellente'],['Plage du Borrigo','Menton',43.7739,7.4932,'Excellente'],['Plage des Sablettes','Menton',43.7782,7.5060,'Excellente'],['Plage du Fossan','Menton',43.7756,7.5018,'Excellente'],
 ['Plage du Débarquement','Saint-Raphaël',43.4162,6.7888,'Excellente'],['Plage du Veillat','Saint-Raphaël',43.4218,6.7680,'Excellente'],['Plage d’Agay','Saint-Raphaël',43.4316,6.8562,'Excellente'],['Plage de la Baumette','Agay',43.4280,6.8700,'Excellente']
].map((x,i)=>({id:'fallback-'+i,name:x[0],city:x[1],lat:x[2],lon:x[3],quality:x[4],waterType:'Mer',official:false}));

const NICE_OFFICIAL_PARKINGS=[
 ['Parking Massena',43.69770086,7.26985643],['Parking Corvesy',43.69654415,7.27213],['Parking Saleya',43.69573495,7.27374683],['Parking Palais de Justice',43.69631646,7.27402474],['Parking Les Arts',43.70087911,7.27810532],['Parking Palais Massena',43.69519501,7.25996345],['Parking Mozart',43.70053547,7.26190962],['Parking Louvre',43.69992958,7.26445177],['Parking Palais Méditerranée',43.69556265,7.26287123],['Parking Grimaldi',43.69801298,7.26441619],['Parking Ruhl Méridien',43.6956485,7.26596991],['Parking Nice Etoile',43.70099682,7.26843645],['Parking Sulzer',43.69536681,7.27109925],['Parking Lenval',43.6893049,7.2410026],['Parking Arenas',43.6681686,7.2147461],['Parking Magnan',43.6910143,7.2435164]
].map((p,i)=>({id:'nice-'+i,name:p[0],lat:p[1],lon:p[2],source:'Métropole Nice Côte d’Azur',liveGated:true}));

const CANNES_CAMERAS=[
 {name:'Webcam Boulevard du Midi',lat:43.5484,lon:6.9937,radius:3.5},{name:'Webcam Quai Laubeuf',lat:43.5497,lon:7.0121,radius:2.2},{name:'Webcam Palm Beach',lat:43.5375,lon:7.0410,radius:2.8}
];

function norm(s=''){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function km(a,b,c,d){const R=6371,x=(c-a)*Math.PI/180,y=(d-b)*Math.PI/180,z=Math.sin(x/2)**2+Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(y/2)**2;return R*2*Math.atan2(Math.sqrt(z),Math.sqrt(1-z))}
function fmtDistance(d){return d<1?`${Math.round(d*1000)} m`:`${d.toFixed(d<10?1:0)} km`}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function clamp(n,a=0,b=100){return Math.max(a,Math.min(b,n))}
function showToast(t){toast.textContent=t;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400)}
function compass(deg){if(!Number.isFinite(deg))return '—';return ['N','NE','E','SE','S','SO','O','NO'][Math.round(deg/45)%8]}

function parseCSV(text){
 const first=(text.split(/\r?\n/,1)[0]||'');const delimiter=(first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',';const rows=[];let row=[],cell='',q=false;
 for(let i=0;i<text.length;i++){const ch=text[i];if(q){if(ch==='"'&&text[i+1]==='"'){cell+='"';i++}else if(ch==='"')q=false;else cell+=ch}else if(ch==='"')q=true;else if(ch===delimiter){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=ch}
 if(cell||row.length){row.push(cell);rows.push(row)};if(!rows.length)return[];const headers=rows.shift().map(h=>h.replace(/^\uFEFF/,'').trim());return rows.filter(r=>r.length>1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])))
}

async function loadBeaches(){
 sourceState.className='source-state loading';sourceState.innerHTML='<span class="spinner"></span><div><b>Chargement de la base nationale des baignades…</b><small>Source ouverte · classement officiel.</small></div>';
 try{const res=await fetch(QSB_CSV,{cache:'no-store'});if(!res.ok)throw Error('QSB');const data=parseCSV(await res.text());
  beaches=data.map((r,i)=>{const lat=parseFloat((r.latitude||'').replace(',','.')),lon=parseFloat((r.longitude||'').replace(',','.'));return{id:`qsb-${i}`,name:r.nom_site||'Site de baignade',city:r.libelle_geographique||'',lat,lon,quality:r.qualite||'Non renseignée',waterType:r.type_eau_norm||'',official:true,status:r.statut_donnees||''}}).filter(b=>Number.isFinite(b.lat)&&Number.isFinite(b.lon));
  sourceState.className='source-state ok';sourceState.innerHTML=`<div>✓</div><div><b>${beaches.length.toLocaleString('fr-FR')} sites officiels chargés</b><small>Qualité des sites de baignade · mise à jour 2026.</small></div>`;
 }catch(e){beaches=FALLBACK_BEACHES;sourceState.className='source-state warn';sourceState.innerHTML='<div>!</div><div><b>Base nationale momentanément inaccessible</b><small>Mode Côte d’Azur de secours, sans prétendre à l’exhaustivité nationale.</small></div>'}
 if(!location)await setLocation(FALLBACK_LOCATION,'Aperçu Côte d’Azur');else renderNearby();
}

async function fetchWeather(lat,lon){
 const u=new URL(WEATHER_API);u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);u.searchParams.set('current','temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m');u.searchParams.set('hourly','uv_index');u.searchParams.set('forecast_hours','2');u.searchParams.set('timezone','auto');
 try{const r=await fetch(u);if(!r.ok)throw 0;const j=await r.json();return{ok:true,time:j.current?.time,temp:j.current?.temperature_2m,feels:j.current?.apparent_temperature,rain:j.current?.precipitation,wind:j.current?.wind_speed_10m,gust:j.current?.wind_gusts_10m,uv:j.hourly?.uv_index?.[0]}}
 catch{return{ok:false}}
}
async function fetchMarine(lat,lon){
 const u=new URL(MARINE_API);u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);u.searchParams.set('current','wave_height,wave_direction,wave_period,swell_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction');u.searchParams.set('timezone','auto');u.searchParams.set('forecast_days','1');u.searchParams.set('cell_selection','sea');
 try{const r=await fetch(u);if(!r.ok)throw 0;const j=await r.json();const c=j.current||{};return{ok:true,time:c.time,wave:c.wave_height,waveDir:c.wave_direction,period:c.wave_period,swell:c.swell_wave_height,seaTemp:c.sea_surface_temperature,current:c.ocean_current_velocity,currentDir:c.ocean_current_direction}}
 catch{return{ok:false}}
}
function qualityScore(q){const n=norm(q);if(n.includes('excellent'))return 98;if(n.includes('bonne')||n==='bon')return 86;if(n.includes('suffis'))return 65;if(n.includes('insuff'))return 25;return null}
function weatherScore(w){if(!w.ok)return null;let s=100;if(Number(w.rain)>0.2)s-=30;if(Number(w.wind)>30)s-=30;else if(Number(w.wind)>20)s-=14;if(Number(w.gust)>45)s-=18;if(Number(w.temp)<20)s-=20;else if(Number(w.temp)>36)s-=12;if(Number(w.uv)>=8)s-=8;return clamp(s)}
function marineScore(m){if(!m.ok)return null;let s=100;if(Number(m.wave)>1.2)s-=35;else if(Number(m.wave)>.7)s-=18;if(Number(m.current)>.8)s-=28;else if(Number(m.current)>.45)s-=12;if(Number(m.seaTemp)<19)s-=18;return clamp(s)}
function calcScore(b,w,m){const components=[['Qualité officielle',qualityScore(b.quality),25],['Météo',weatherScore(w),25],['Mer',marineScore(m),25],['Affluence mesurée',null,15],['Parking live',null,10]];const avail=components.filter(x=>Number.isFinite(x[1]));const weight=avail.reduce((a,x)=>a+x[2],0);const score=weight?Math.round(avail.reduce((a,x)=>a+x[1]*x[2],0)/weight):null;return{score,confidence:weight,components}}
function qualityChip(q){const s=qualityScore(q);if(s===null)return`<span class="chip">🧪 Qualité non classée</span>`;return`<span class="chip ${s>=80?'good':s<50?'warn':''}">🧪 ${esc(q)}</span>`}

async function enrichCard(b){
 if(b.cardData)return b.cardData;const [w,m]=await Promise.all([fetchWeather(b.lat,b.lon),fetchMarine(b.lat,b.lon)]);const score=calcScore(b,w,m);b.cardData={w,m,...score};return b.cardData
}
async function renderNearby(){
 if(!location||!beaches.length)return;visibleCount=8;const radius=Number($('#radiusSelect').value);currentResults=beaches.map(b=>({...b,distance:km(location.lat,location.lon,b.lat,b.lon)})).filter(b=>b.distance<=radius).sort((a,b)=>a.distance-b.distance);
 if(!currentResults.length)currentResults=beaches.map(b=>({...b,distance:km(location.lat,location.lon,b.lat,b.lon)})).sort((a,b)=>a.distance-b.distance).slice(0,12);
 resultsTitle.textContent=currentResults[0]?.distance>radius?`Plages les plus proches`:`Plages dans un rayon de ${radius} km`;
 renderCards();
}
function renderCards(){
 const list=currentResults.slice(0,visibleCount);if(!list.length){spotsEl.innerHTML='<div class="empty">Aucune plage trouvée. Essaie une autre adresse ou un rayon plus large.</div>';return}
 spotsEl.innerHTML=list.map(b=>`<article class="spot-card" data-id="${b.id}"><div class="spot-head"><div><div class="spot-name">${esc(b.name)}</div><div class="spot-city">${esc(b.city||'France')} · ${esc(b.waterType||'baignade')}</div></div><div class="distance">${fmtDistance(b.distance)}</div></div><div class="spot-score"><div class="score-ring" style="--score:0"><b>…</b></div><div class="score-copy"><b>Indice réel en calcul</b><small>On interroge météo + mer</small></div></div><div class="chips">${qualityChip(b.quality)}<span class="chip live">🌊 Mer live/modèle</span><span class="chip">👥 Affluence: non mesurée</span></div><div class="card-foot"><span>${b.official?'Source officielle':'Catalogue secours'}</span><span>Voir les preuves →</span></div></article>`).join('');
 document.querySelectorAll('.spot-card').forEach(el=>{el.addEventListener('click',()=>openDetail(el.dataset.id));const b=list.find(x=>x.id===el.dataset.id);enrichCard(b).then(d=>{const ring=el.querySelector('.score-ring'),copy=el.querySelector('.score-copy');if(d.score===null){ring.querySelector('b').textContent='—';copy.innerHTML='<b>Données insuffisantes</b><small>Aucun score inventé</small>'}else{ring.style.setProperty('--score',d.score);ring.querySelector('b').textContent=d.score;copy.innerHTML=`<b>J’y vais ? ${d.score}/100</b><small>Fiabilité ${d.confidence}% · signaux disponibles</small>`}})});
 showMore.classList.toggle('hidden',visibleCount>=currentResults.length);clearSearch.classList.toggle('hidden',!addressInput.value)
}

async function setLocation(loc,label){location=loc;locationLine.classList.add('active');locationLine.innerHTML=`<span class="pulse"></span>${esc(label||loc.label||'Position sélectionnée')}`;await renderNearby()}
function locate(){
 if(!navigator.geolocation){showToast('GPS non disponible');return}locationLine.innerHTML='<span class="spinner"></span>Recherche GPS haute précision…';let best=null,watch=null,done=false;
 const finish=async()=>{if(done)return;done=true;if(watch!==null)navigator.geolocation.clearWatch(watch);if(best){addressInput.value='';await setLocation({lat:best.coords.latitude,lon:best.coords.longitude,label:'Autour de moi'},`Autour de moi · précision ±${Math.round(best.coords.accuracy)} m`)}else{showToast('Impossible d’obtenir une position précise');locationLine.innerHTML='<span class="pulse"></span>Autorise la localisation précise puis réessaie.'}};
 const timer=setTimeout(finish,11000);watch=navigator.geolocation.watchPosition(p=>{if(!best||p.coords.accuracy<best.coords.accuracy)best=p;if(p.coords.accuracy<=35){clearTimeout(timer);finish()}},()=>{}, {enableHighAccuracy:true,maximumAge:0,timeout:10000});
}

async function addressSuggest(q){
 if(q.trim().length<3){suggestionsEl.classList.add('hidden');return}const u=new URL(IGN_GEOCODE);u.searchParams.set('q',q);u.searchParams.set('limit','7');u.searchParams.set('autocomplete','true');
 try{const r=await fetch(u);const j=await r.json();const f=(j.features||[]).slice(0,7);suggestionsEl.innerHTML=f.map((x,i)=>`<div class="suggestion" data-i="${i}" role="option"><b>${esc(x.properties?.label||x.properties?.name||'Résultat')}</b><small>${esc(x.properties?.context||x.properties?.city||'France')}</small></div>`).join('');suggestionsEl.classList.toggle('hidden',!f.length);suggestionsEl.querySelectorAll('.suggestion').forEach(el=>el.onclick=()=>{const x=f[Number(el.dataset.i)],c=x.geometry?.coordinates;if(!c)return;addressInput.value=x.properties?.label||q;suggestionsEl.classList.add('hidden');setLocation({lat:c[1],lon:c[0],label:addressInput.value},addressInput.value)})}catch{suggestionsEl.classList.add('hidden')}
}

function nearestCamera(b){return CANNES_CAMERAS.map(c=>({...c,d:km(b.lat,b.lon,c.lat,c.lon)})).filter(c=>c.d<=c.radius).sort((a,b)=>a.d-b.d)[0]||null}
function nearestNiceParkings(b){return NICE_OFFICIAL_PARKINGS.map(p=>({...p,distance:km(b.lat,b.lon,p.lat,p.lon)})).filter(p=>p.distance<4).sort((a,b)=>a.distance-b.distance).slice(0,5)}
async function fetchNearbyOSM(b){
 const q=`[out:json][timeout:12];(node(around:1400,${b.lat},${b.lon})[amenity=toilets];node(around:1400,${b.lat},${b.lon})[amenity=drinking_water];node(around:1400,${b.lat},${b.lon})[amenity=shower];node(around:1800,${b.lat},${b.lon})[amenity=parking];way(around:1800,${b.lat},${b.lon})[amenity=parking];);out center 30;`;
 try{const r=await fetch(OVERPASS,{method:'POST',body:q,headers:{'Content-Type':'application/x-www-form-urlencoded'}});if(!r.ok)throw 0;const j=await r.json();return(j.elements||[]).map(e=>({type:e.tags?.amenity,name:e.tags?.name||({toilets:'Toilettes publiques',drinking_water:'Point d’eau',shower:'Douche',parking:'Parking'}[e.tags?.amenity]||'Service'),lat:e.lat||e.center?.lat,lon:e.lon||e.center?.lon})).filter(x=>x.lat&&x.lon)}catch{return[]}
}

function evidence(label,value,source,missing=false){return`<div class="evidence ${missing?'missing':''}"><div class="label">${label}</div><strong>${value}</strong><small>${source}</small></div>`}
async function openDetail(id){
 const b=currentResults.find(x=>x.id===id)||beaches.find(x=>x.id===id);if(!b)return;selected=b;detailSheet.classList.remove('hidden');detailContent.innerHTML=`<div class="detail-hero"><span class="eyebrow">CHARGEMENT DES PREUVES</span><h2 id="detailTitle">${esc(b.name)}</h2><div class="detail-sub">${esc(b.city)} · ${fmtDistance(b.distance||0)}</div><div class="score-banner"><div class="score-big">…</div><div class="confidence">Météo, mer, qualité officielle et services proches<br><b>Aucune valeur d’affluence inventée.</b></div></div></div><div class="evidence-grid"><div class="skeleton"></div><div class="skeleton"></div></div>`;
 const [d,osm]=await Promise.all([enrichCard(b),fetchNearbyOSM(b)]);const cam=nearestCamera(b),niceP=nearestNiceParkings(b);const w=d.w,m=d.m;
 const qual=esc(b.quality||'Non renseignée');
 const crowd=cam?`Webcam live disponible`:`Non mesurée`;
 const parkingLive=niceP.length?`Flux live existe à Nice`:`Non disponible`;
 detailContent.innerHTML=`<div class="detail-hero"><span class="eyebrow">${b.official?'SITE DE BAIGNADE OFFICIEL':'PLAGE'}</span><h2 id="detailTitle">${esc(b.name)}</h2><div class="detail-sub">${esc(b.city)} · ${fmtDistance(b.distance||0)} de la position choisie</div><div class="score-banner"><div class="score-big">${d.score??'—'}${d.score!==null?'/100':''}</div><div class="confidence">Indice calculé uniquement sur les signaux disponibles<br><b>Fiabilité ${d.confidence}%</b> · les données manquantes ne sont pas remplacées.</div></div></div>
 <div class="evidence-grid">
 ${evidence('Qualité de baignade',qual,b.official?'Classement officiel 2026 · méthodologie 4 ans glissants':'Donnée de secours',!b.quality)}
 ${evidence('Air',w.ok?`${Math.round(w.temp)}° · vent ${Math.round(w.wind)} km/h`:'Indisponible',w.ok?`Open-Meteo · ${w.time||'mise à jour récente'}`:'Aucune valeur inventée',!w.ok)}
 ${evidence('Mer',m.ok?`${Number(m.seaTemp).toFixed(1)}° · vagues ${Number(m.wave).toFixed(1)} m`:'Indisponible',m.ok?`Modèle marin · ${m.time||'récent'} · houle ${Number(m.swell||0).toFixed(1)} m`:'Aucune valeur inventée',!m.ok)}
 ${evidence('Courant',m.ok&&Number.isFinite(Number(m.current))?`${Number(m.current).toFixed(2)} km/h · ${compass(Number(m.currentDir))}`:'Indisponible',m.ok?'Modèle océanique ~8 km · prudence près de la côte':'Non disponible',!m.ok)}
 ${evidence('Affluence',crowd,cam?`${cam.name} · preuve visuelle officielle`:'Aucun capteur public connecté ici',!cam)}
 ${evidence('Parking live',parkingLive,niceP.length?'Métropole Nice Côte d’Azur publie availableSpotNumber, mais l’API requiert une clé':'Aucun flux de places libres public connecté',true)}
 </div>
 <div class="map-wrap"><div class="map-toolbar"><b>🛰️ Le spot et les accès</b><div class="map-toggle"><button class="active" data-layer="sat">Satellite IGN</button><button data-layer="map">Carte</button></div></div><div id="detailMap" class="map"></div></div>
 <div class="nearby-block"><div class="nearby-head"><h3>Autour de la plage</h3><span class="eyebrow">DONNÉES OSM</span></div><div id="nearbyList" class="mini-list"></div></div>
 <div class="source-box"><h3>Preuves & sources</h3><div class="source-line">Score = qualité officielle + météo + conditions marines disponibles. Affluence et disponibilité parking ne participent pas au score tant qu’elles ne sont pas réellement mesurées.</div><div class="source-actions"><a class="primary" href="${HEALTH_PAGE}" target="_blank" rel="noopener">Source baignade officielle ↗</a>${cam?`<a href="${CANNES_WEBCAMS}" target="_blank" rel="noopener">🔴 Webcam Cannes ↗</a>`:''}${niceP.length?`<a href="${NICE_PARKING_SOURCE}" target="_blank" rel="noopener">Parking Nice · source ↗</a>`:''}<button id="shareSpot">Partager</button></div></div>`;
 renderNearbyServices(b,osm,niceP);initMap(b,osm,niceP);$('#shareSpot').onclick=()=>shareSpot(b,d);
}
function renderNearbyServices(b,osm,niceP){const items=[];niceP.forEach(p=>items.push({name:p.name,type:'Parking officiel Nice',distance:p.distance,note:'localisation officielle · disponibilité live nécessitant clé'}));osm.filter(x=>x.type!=='parking').slice(0,5).forEach(x=>items.push({name:x.name,type:x.type==='toilets'?'Toilettes':x.type==='shower'?'Douche':'Point d’eau',distance:km(b.lat,b.lon,x.lat,x.lon),note:'OpenStreetMap'}));if(!items.length){$('#nearbyList').innerHTML='<div class="mini-row"><div><b>Aucun équipement confirmé</b><span>La donnée locale peut être incomplète.</span></div></div>';return}$('#nearbyList').innerHTML=items.sort((a,b)=>a.distance-b.distance).slice(0,7).map(x=>`<div class="mini-row"><div><b>${esc(x.name)}</b><span>${esc(x.type)} · ${esc(x.note)}</span></div><span>${fmtDistance(x.distance)}</span></div>`).join('')}
function initMap(b,osm,niceP){if(!window.L)return;setTimeout(()=>{if(map){map.remove();map=null}map=L.map('detailMap',{zoomControl:false,attributionControl:true}).setView([b.lat,b.lon],15);const sat=L.tileLayer('https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=image/jpeg',{maxZoom:19,attribution:'© IGN'});const osmLayer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});mapLayers={sat,osm:osmLayer};sat.addTo(map);L.marker([b.lat,b.lon]).addTo(map).bindPopup(esc(b.name));niceP.forEach(p=>L.circleMarker([p.lat,p.lon],{radius:5}).addTo(map).bindPopup(esc(p.name)));osm.slice(0,15).forEach(x=>L.circleMarker([x.lat,x.lon],{radius:4}).addTo(map).bindPopup(esc(x.name)));document.querySelectorAll('.map-toggle button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.map-toggle button').forEach(x=>x.classList.remove('active'));btn.classList.add('active');Object.values(mapLayers).forEach(l=>map.removeLayer(l));mapLayers[btn.dataset.layer==='sat'?'sat':'osm'].addTo(map)})},50)}
function shareSpot(b,d){const text=`${b.name} · ${b.city}\nJ’y vais ? ${d.score??'—'}/100 · fiabilité ${d.confidence}%\nDonnées: qualité officielle + météo + mer.\n${location?.label||''}`;if(navigator.share)navigator.share({title:`LÀ ? · ${b.name}`,text,url:location.href}).catch(()=>{});else navigator.clipboard?.writeText(`${text}\n${location.href}`).then(()=>showToast('Lien copié'))}
function closeDetail(){detailSheet.classList.add('hidden');if(map){map.remove();map=null}}
document.querySelectorAll('[data-close-detail]').forEach(x=>x.onclick=closeDetail);

$('#locateBtn').onclick=locate;$('#refreshBtn').onclick=()=>{currentResults.forEach(x=>delete x.cardData);renderNearby()};$('#radiusSelect').onchange=renderNearby;showMore.onclick=()=>{visibleCount+=8;renderCards()};clearSearch.onclick=()=>{addressInput.value='';clearSearch.classList.add('hidden');suggestionsEl.classList.add('hidden')};
addressInput.addEventListener('input',e=>{clearTimeout(addressTimer);clearSearch.classList.toggle('hidden',!e.target.value);addressTimer=setTimeout(()=>addressSuggest(e.target.value),250)});document.addEventListener('click',e=>{if(!e.target.closest('.search-box'))suggestionsEl.classList.add('hidden')});
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
loadBeaches();
