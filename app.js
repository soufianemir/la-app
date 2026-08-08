const spotsEl = document.querySelector('#spots');
const statusEl = document.querySelector('#locationStatus');
const locateBtn = document.querySelector('#locateBtn');
const detailSheet = document.querySelector('#detailSheet');
const detailContent = document.querySelector('#detailContent');
const reportSheet = document.querySelector('#reportSheet');
const reportSpotName = document.querySelector('#reportSpotName');
const submitReport = document.querySelector('#submitReport');
const toast = document.querySelector('#toast');

const DEFAULT_LOCATION = { lat: 43.5528, lon: 7.0174, label: 'Cannes · mode démo' };
let userLocation = DEFAULT_LOCATION;
let currentSpots = [];
let selectedSpot = null;
let activeFilter = 'all';
let reportState = {};

const BEACHES = [
  { id:'mid-cannes', name:'Plage du Midi', city:'Cannes', lat:43.54835, lon:7.00566, family:true, parking:'medium', baselineCrowd:'normal' },
  { id:'croisette-cannes', name:'Plage de la Croisette', city:'Cannes', lat:43.55168, lon:7.02677, family:true, parking:'hard', baselineCrowd:'busy' },
  { id:'moure-rouge', name:'Mouré Rouge', city:'Cannes', lat:43.54155, lon:7.03992, family:true, parking:'medium', baselineCrowd:'normal' },
  { id:'bijou', name:'Plage du Bijou', city:'Cannes', lat:43.54020, lon:7.03430, family:true, parking:'medium', baselineCrowd:'calm' },
  { id:'robinson', name:'Plage Robinson', city:'Mandelieu-la-Napoule', lat:43.53551, lon:6.94737, family:true, parking:'easy', baselineCrowd:'calm' },
  { id:'sable-or', name:"Plage des Sables d'Or", city:'Mandelieu-la-Napoule', lat:43.53658, lon:6.94898, family:true, parking:'easy', baselineCrowd:'normal' },
  { id:'salis', name:'Plage de la Salis', city:'Antibes', lat:43.57324, lon:7.12760, family:true, parking:'medium', baselineCrowd:'normal' },
  { id:'gravette', name:'Plage de la Gravette', city:'Antibes', lat:43.58349, lon:7.12866, family:true, parking:'hard', baselineCrowd:'busy' },
  { id:'juan', name:'Grande Plage', city:'Juan-les-Pins', lat:43.56943, lon:7.10827, family:true, parking:'hard', baselineCrowd:'busy' },
  { id:'gallice', name:'Plage de la Gallice', city:'Juan-les-Pins', lat:43.56356, lon:7.11681, family:false, parking:'medium', baselineCrowd:'normal' },
  { id:'ponchettes', name:'Plage des Ponchettes', city:'Nice', lat:43.69509, lon:7.27608, family:false, parking:'hard', baselineCrowd:'busy' },
  { id:'carras', name:'Plage de Carras', city:'Nice', lat:43.68101, lon:7.22885, family:true, parking:'medium', baselineCrowd:'normal' }
];

function kmBetween(aLat, aLon, bLat, bLon) {
  const R = 6371;
  const dLat = (bLat-aLat) * Math.PI/180;
  const dLon = (bLon-aLon) * Math.PI/180;
  const aa = Math.sin(dLat/2)**2 + Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(aa),Math.sqrt(1-aa));
}

function loadReports() {
  try { return JSON.parse(localStorage.getItem('la-reports') || '{}'); } catch { return {}; }
}
function saveReport(spotId, report) {
  const all = loadReports();
  all[spotId] = { ...report, ts: Date.now() };
  localStorage.setItem('la-reports', JSON.stringify(all));
}
function freshReport(spotId) {
  const r = loadReports()[spotId];
  return r && Date.now()-r.ts < 3*60*60*1000 ? r : null;
}

async function fetchWeather(lat, lon) {
  const key = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  try {
    const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
    if (cached && Date.now()-cached.ts < 15*60*1000) return cached.data;
  } catch {}
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m');
  url.searchParams.set('hourly', 'uv_index');
  url.searchParams.set('forecast_days', '1');
  url.searchParams.set('timezone', 'auto');
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
    if (!res.ok) throw new Error('weather');
    const json = await res.json();
    const hour = new Date().getHours();
    const data = {
      temp: Math.round(json.current?.temperature_2m ?? 25),
      feels: Math.round(json.current?.apparent_temperature ?? 25),
      wind: Math.round(json.current?.wind_speed_10m ?? 8),
      gust: Math.round(json.current?.wind_gusts_10m ?? 15),
      uv: Math.round(json.hourly?.uv_index?.[hour] ?? 6),
      code: json.current?.weather_code ?? 0,
      live: true
    };
    sessionStorage.setItem(key, JSON.stringify({ts:Date.now(),data}));
    return data;
  } catch {
    return { temp:25, feels:26, wind:8, gust:15, uv:6, code:1, live:false };
  }
}

function weatherLabel(code) {
  if (code === 0) return 'Grand soleil';
  if ([1,2].includes(code)) return 'Peu nuageux';
  if (code === 3) return 'Couvert';
  if ([51,53,55,61,63,65,80,81,82].includes(code)) return 'Pluie possible';
  if ([95,96,99].includes(code)) return 'Orages';
  return 'Conditions stables';
}

function crowdLabel(crowd) {
  return crowd === 'calm' ? ['🟢','Tranquille'] : crowd === 'busy' ? ['🔴','Très fréquentée'] : ['🟠','Fréquentation normale'];
}
function parkingLabel(p) { return p === 'easy' ? 'Facile' : p === 'hard' ? 'Difficile' : 'Moyen'; }

function scoreSpot(spot, weather, report) {
  let score = 88;
  const crowd = report?.crowd || spot.baselineCrowd;
  const parking = report?.parking || spot.parking;
  if (crowd === 'busy') score -= 20;
  if (crowd === 'normal') score -= 8;
  if (parking === 'hard') score -= 9;
  if (parking === 'medium') score -= 4;
  if (weather.wind > 25) score -= 16; else if (weather.wind > 16) score -= 7;
  if (weather.temp < 20) score -= 10;
  if ([51,53,55,61,63,65,80,81,82,95,96,99].includes(weather.code)) score -= 20;
  if (report?.jellyfish === 'yes') score -= 25;
  score += Math.max(0, 4 - Math.min(4, spot.distance/4));
  return Math.max(18, Math.min(97, Math.round(score)));
}

function reportAge(report) {
  if (!report) return 'estimation locale';
  const mins = Math.floor((Date.now()-report.ts)/60000);
  if (mins < 1) return 'signalé à l’instant';
  if (mins < 60) return `signalé il y a ${mins} min`;
  return `signalé il y a ${Math.floor(mins/60)} h`;
}

function renderSpots() {
  const filtered = currentSpots.filter(s => {
    if (activeFilter === 'calm') return (s.report?.crowd || s.baselineCrowd) === 'calm';
    if (activeFilter === 'family') return s.family;
    if (activeFilter === 'parking') return (s.report?.parking || s.parking) !== 'hard';
    return true;
  });
  if (!filtered.length) {
    spotsEl.innerHTML = '<div class="empty">Aucun spot ne correspond à ce filtre. Essaie “Tout”.</div>';
    return;
  }
  spotsEl.innerHTML = filtered.map((s, i) => {
    const crowd = s.report?.crowd || s.baselineCrowd;
    const [dot,label] = crowdLabel(crowd);
    const parking = s.report?.parking || s.parking;
    const jelly = s.report?.jellyfish === 'yes' ? 'Signalées' : 'RAS';
    return `<article class="spot-card" data-id="${s.id}">
      <div class="spot-top">
        <div><div class="spot-name">${s.name}</div><div class="spot-location">${s.city} · ${s.distance < 1 ? Math.round(s.distance*1000)+' m' : s.distance.toFixed(1)+' km'}</div></div>
        <div class="score">${s.score}%</div>
      </div>
      <div class="spot-status"><span class="status-pill">${dot} ${label}</span>${i===0 ? '<span class="status-pill">✨ Meilleur choix</span>' : ''}</div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Météo</div><div class="metric-value">☀️ ${s.weather.temp}°</div></div>
        <div class="metric"><div class="metric-label">Parking</div><div class="metric-value">🚗 ${parkingLabel(parking)}</div></div>
        <div class="metric"><div class="metric-label">Méduses</div><div class="metric-value">🪼 ${jelly}</div></div>
      </div>
      <div class="meta-row"><span>${reportAge(s.report)}</span><span>${s.weather.live ? 'météo live' : 'météo démo'}</span></div>
    </article>`;
  }).join('');

  document.querySelectorAll('.spot-card').forEach(card => card.addEventListener('click', () => openDetail(card.dataset.id)));
}

async function buildSpots(location) {
  spotsEl.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div>';
  const nearest = BEACHES.map(b => ({...b, distance:kmBetween(location.lat,location.lon,b.lat,b.lon)})).sort((a,b)=>a.distance-b.distance).slice(0,8);
  const weatherGroups = new Map();
  await Promise.all(nearest.map(async s => {
    const group = `${s.lat.toFixed(1)},${s.lon.toFixed(1)}`;
    if (!weatherGroups.has(group)) weatherGroups.set(group, fetchWeather(s.lat,s.lon));
    s.weather = await weatherGroups.get(group);
    s.report = freshReport(s.id);
    s.score = scoreSpot(s,s.weather,s.report);
  }));
  currentSpots = nearest.sort((a,b)=>b.score-a.score);
  renderSpots();
}

function geolocate() {
  statusEl.textContent = 'Localisation en cours…';
  if (!navigator.geolocation) {
    statusEl.textContent = 'GPS indisponible · aperçu autour de Cannes';
    buildSpots(DEFAULT_LOCATION); return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => {
      userLocation = {lat:pos.coords.latitude,lon:pos.coords.longitude,label:'Position actuelle'};
      statusEl.textContent = 'Les meilleurs spots proches de ta position.';
      buildSpots(userLocation);
    },
    () => {
      userLocation = DEFAULT_LOCATION;
      statusEl.textContent = 'GPS non autorisé · aperçu autour de Cannes';
      buildSpots(DEFAULT_LOCATION);
    }, {enableHighAccuracy:false, timeout:5500, maximumAge:300000}
  );
}

function getSpot(id) { return currentSpots.find(s=>s.id===id); }
function openDetail(id) {
  const s = getSpot(id); if (!s) return;
  selectedSpot = s;
  const crowd = s.report?.crowd || s.baselineCrowd;
  const [dot,label] = crowdLabel(crowd);
  const parking = s.report?.parking || s.parking;
  detailContent.innerHTML = `<div class="detail-hero">
    <div class="eyebrow">${dot} ${label.toUpperCase()}</div>
    <h2 id="detailTitle">${s.name}</h2><div class="muted">${s.city} · ${s.distance.toFixed(1)} km de toi</div>
    <div class="detail-score-row"><div class="detail-score">${s.score}%</div><div><strong>J'y vais</strong><div class="muted">Score calculé maintenant</div></div></div>
  </div>
  <div class="detail-grid">
    <div class="detail-tile"><span>Température</span><strong>${s.weather.temp}° · ressenti ${s.weather.feels}°</strong></div>
    <div class="detail-tile"><span>Vent</span><strong>${s.weather.wind} km/h</strong></div>
    <div class="detail-tile"><span>UV</span><strong>Indice ${s.weather.uv}</strong></div>
    <div class="detail-tile"><span>Ciel</span><strong>${weatherLabel(s.weather.code)}</strong></div>
    <div class="detail-tile"><span>Parking</span><strong>${parkingLabel(parking)}</strong></div>
    <div class="detail-tile"><span>Méduses</span><strong>${s.report?.jellyfish==='yes'?'Signalées':'RAS'}</strong></div>
  </div>
  <div class="sheet-actions"><button class="secondary-btn" id="detailReport">✚ Signaler</button><button class="primary-btn" id="detailShare">↗ Partager</button></div>`;
  detailSheet.classList.remove('hidden');
  document.querySelector('#detailReport').onclick = () => { closeDetail(); openReport(s); };
  document.querySelector('#detailShare').onclick = () => shareSpot(s);
}
function closeDetail(){ detailSheet.classList.add('hidden'); }

document.querySelectorAll('[data-close-sheet]').forEach(el=>el.addEventListener('click',closeDetail));

function openReport(spot = currentSpots[0]) {
  if (!spot) return;
  selectedSpot = spot; reportState = {};
  reportSpotName.textContent = `${spot.name} · ${spot.city}`;
  document.querySelectorAll('.segmented button').forEach(b=>b.classList.remove('selected'));
  submitReport.disabled = true;
  reportSheet.classList.remove('hidden');
}
function closeReport(){ reportSheet.classList.add('hidden'); }
document.querySelectorAll('[data-close-report]').forEach(el=>el.addEventListener('click',closeReport));

document.querySelectorAll('.segmented').forEach(group => {
  group.addEventListener('click', e => {
    const btn = e.target.closest('button'); if (!btn) return;
    group.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));
    btn.classList.add('selected'); reportState[group.dataset.group]=btn.dataset.value;
    submitReport.disabled = !(reportState.crowd && reportState.parking && reportState.jellyfish);
  });
});
submitReport.addEventListener('click', () => {
  if (!selectedSpot || submitReport.disabled) return;
  saveReport(selectedSpot.id, reportState);
  closeReport();
  showToast('Merci — ton signalement est enregistré ✓');
  buildSpots(userLocation);
});

async function shareSpot(spot = currentSpots[0]) {
  if (!spot) return;
  const crowd = crowdLabel(spot.report?.crowd || spot.baselineCrowd)[1].toLowerCase();
  const text = `${spot.name} : ${crowd}, ${spot.weather.temp}°, score ${spot.score}%. Regarde sur LÀ ?`;
  const data = { title:'LÀ ?', text, url:location.origin };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(`${text} ${location.origin}`); showToast('Lien copié ✓'); }
  } catch {}
}
function showToast(msg){ toast.textContent=msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),2300); }

locateBtn.addEventListener('click', geolocate);
document.querySelector('#reportGlobalBtn').addEventListener('click',()=>openReport());
document.querySelector('#navReport').addEventListener('click',()=>openReport());
document.querySelector('#navShare').addEventListener('click',()=>shareSpot());
document.querySelectorAll('.filter').forEach(btn=>btn.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active'); activeFilter=btn.dataset.filter; renderSpots();
}));

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
geolocate();
