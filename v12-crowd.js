(() => {
  const V12_TTL = 15 * 60 * 1000;
  const crowdEstimates = new Map();
  const LABELS = [
    {max:28, key:'quiet', label:'🟢 Tranquille'},
    {max:50, key:'ok', label:'🟡 Ça va'},
    {max:72, key:'busy', label:'🟠 Beaucoup de monde'},
    {max:101,key:'full',label:'🔴 Saturée'}
  ];
  const INSUFFICIENT = {key:'unknown',label:'⚪ Données insuffisantes'};

  const levelFor = p => LABELS.find(x=>p<x.max) || LABELS[LABELS.length-1];
  const confidenceLabel = c => c >= 72 ? 'Élevée' : c >= 48 ? 'Moyenne' : 'Faible';
  const trendLabel = d => d > 7 ? '↗ en hausse' : d < -7 ? '↘ en baisse' : '→ stable';
  const fmtTime = d => new Intl.DateTimeFormat('fr-FR',{hour:'2-digit',minute:'2-digit'}).format(d);
  const isCannesV12 = b => norm(b.city).includes('cannes');

  /*
    Règle stricte : une webcam n'est reliée qu'à la plage/zone qu'elle filme explicitement.
    Aucune recherche de "caméra la plus proche" n'est autorisée.
  */
  cameraMeta = function(b){
    if(!isCannesV12(b)) return null;
    const n=norm(b.name);
    if(n === 'midi' || n === 'plage du midi' || n.includes('plage midi')) return {cam:CAMERAS.midi,coverage:'direct',scope:'secteur Boulevard du Midi visible par la caméra'};
    if(n.includes('quai laubeuf')) return {cam:CAMERAS.quai,coverage:'direct',scope:'secteur Quai Laubeuf visible par la caméra'};
    if(n === 'palm beach' || n.includes('plage palm beach')) return {cam:CAMERAS.palm,coverage:'direct',scope:'secteur Palm Beach visible par la caméra'};
    return null;
  };

  function vacationSignal(now){
    const m=now.getMonth()+1, d=now.getDate();
    if(m===7 || m===8) return {value:88,weight:16,label:'Vacances d’été',source:'Calendrier scolaire / saison'};
    if(m===6 && d>=20) return {value:65,weight:10,label:'Début de saison',source:'Calendrier'};
    if(m===9 && d<=10) return {value:60,weight:10,label:'Fin de saison',source:'Calendrier'};
    return {value:32,weight:8,label:'Hors pic estival',source:'Calendrier'};
  }

  function timeSignal(now, offsetHours=0){
    const x=new Date(now.getTime()+offsetHours*3600000), h=x.getHours()+x.getMinutes()/60, wd=x.getDay(), weekend=wd===0||wd===6;
    let value;
    if(h<8) value=12;
    else if(h<10) value=28;
    else if(h<12) value=50;
    else if(h<15) value=76;
    else if(h<18) value=88;
    else if(h<20.5) value=68;
    else value=25;
    if(weekend && h>=10 && h<=19) value=Math.min(100,value+10);
    return {value,weight:22,label:`${weekend?'Week-end':'Semaine'} · ${Math.round(h)} h`,source:'Heure/jour'};
  }

  function eventSignal(now,b){
    // Seulement des rendez-vous dont la récurrence est explicitement publiée par Cannes.
    const m=now.getMonth()+1, wd=now.getDay(), h=now.getHours();
    if((m===7||m===8) && h>=17){
      // Nocturnes cannoises : mar/mer/jeu selon secteurs. Impact faible et uniquement si la plage est proche du centre/Midi.
      if([2,3,4].includes(wd) && isCannesV12(b) && b.lon>7.000 && b.lon<7.035) return {value:74,weight:6,label:'Animation estivale cannoise ce soir',source:'Cannes Agenda'};
    }
    return null;
  }

  function parkingSupplySignal(b){
    if(!isCannesV12(b) || typeof CANNES_PARKINGS==='undefined') return null;
    const near=CANNES_PARKINGS.map(p=>({...p,d:km(b.lat,b.lon,p.lat,p.lon)})).filter(p=>p.d<=1.5);
    if(!near.length) return null;
    const total=near.reduce((s,p)=>s+(Number(p.capacity)||0),0);
    // Ce n'est PAS de l'occupation. Signal faible d'accessibilité/capacité structurelle uniquement.
    const value=total>1800?62:total>900?52:42;
    return {value,weight:5,label:`${total} places de capacité à ≤1,5 km`,source:'Capacité structurelle · pas occupation live'};
  }

  async function weatherSeaSignals(b){
    const c=await getConditions(b);
    const out=[];
    if(c.w?.ok){
      let v=58;
      const t=Number(c.w.temp), wind=Number(c.w.wind), rain=Number(c.w.rain);
      if(t>=27)v+=20; else if(t>=23)v+=12; else if(t<20)v-=18;
      if(rain>.2)v-=35;
      if(wind>30)v-=22; else if(wind>20)v-=10;
      out.push({value:clamp(v),weight:18,label:`${Math.round(t)}° · vent ${Math.round(wind)} km/h`,source:'Météo modélisée actuelle'});
    }
    if(c.m?.ok){
      let v=58;
      const wave=Number(c.m.wave||0), sea=Number(c.m.sea||0), cur=Number(c.m.current||0);
      if(sea>=24)v+=12; else if(sea<20)v-=15;
      if(wave>.9)v-=22; else if(wave>.6)v-=10;
      if(cur>.8)v-=18;
      out.push({value:clamp(v),weight:13,label:`Mer ${sea?Math.round(sea)+'° · ':''}vagues ${wave.toFixed(1)} m`,source:'Modèle mer actuel'});
    }
    return out;
  }

  function aggregate(signals){
    const usable=signals.filter(Boolean);
    const w=usable.reduce((s,x)=>s+x.weight,0);
    if(w<35) return {...INSUFFICIENT,pressure:null,confidence:Math.min(35,w),signals:usable};
    const pressure=Math.round(usable.reduce((s,x)=>s+x.value*x.weight,0)/w);
    const maxIndirect=80; // Une estimation indirecte ne peut jamais prétendre à 100 % de confiance.
    const confidence=Math.min(maxIndirect,Math.round(w*0.82));
    return {...levelFor(pressure),pressure,confidence,signals:usable};
  }

  async function estimateIndirect(b,offsetHours=0){
    const now=new Date();
    const signals=[vacationSignal(now),timeSignal(now,offsetHours),eventSignal(now,b),parkingSupplySignal(b)];
    if(offsetHours===0) signals.push(...await weatherSeaSignals(b));
    else {
      // Prévision légère : on conserve météo/mer actuelles, clairement présentées comme hypothèse constante.
      const ws=await weatherSeaSignals(b); ws.forEach(x=>x.source+=' · hypothèse stable'); signals.push(...ws);
    }
    const a=aggregate(signals);
    return {...a,type:offsetHours===0?'Estimation':'Prévision',updatedAt:new Date(),offsetHours};
  }

  function imageStats(img, cam){
    const canvas=document.createElement('canvas'), w=240, h=Math.max(120,Math.round(w*img.naturalHeight/img.naturalWidth));
    canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
    // ROI calibrée sur la partie basse : plage/promeneurs, en excluant au maximum ciel et mer.
    const y0=cam.id==='quai'?Math.round(h*.56):Math.round(h*.58), rh=h-y0;
    const d=ctx.getImageData(0,y0,w,rh).data;let edges=0,samples=0,lumSum=0,lumSq=0;
    const gray=new Float32Array(w*rh);
    for(let y=0;y<rh;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,g=.299*d[i]+.587*d[i+1]+.114*d[i+2];gray[y*w+x]=g;lumSum+=g;lumSq+=g*g;}
    for(let y=1;y<rh-1;y+=2)for(let x=1;x<w-1;x+=2){const i=y*w+x,gx=Math.abs(gray[i+1]-gray[i-1]),gy=Math.abs(gray[i+w]-gray[i-w]);if(gx+gy>54)edges++;samples++;}
    const mean=lumSum/(w*rh), variance=Math.max(0,lumSq/(w*rh)-mean*mean), edgeDensity=edges/Math.max(1,samples);
    return {edgeDensity,contrast:Math.sqrt(variance),brightness:mean};
  }

  async function snapshotImage(cam){
    return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=`/api/webcam-snapshot?camera=${encodeURIComponent(cam.id)}&t=${Date.now()}`;});
  }

  async function cameraObservation(meta,b){
    const cam=meta.cam;
    if(!cam.analyzable) return {...INSUFFICIENT,type:'Observation directe',confidence:20,updatedAt:new Date(),reason:'Angle non validé pour une classification automatique'};
    const img=await snapshotImage(cam);
    const s=imageStats(img,cam);
    if(s.brightness<35 || s.contrast<18) return {...INSUFFICIENT,type:'Observation directe',confidence:25,updatedAt:new Date(),reason:'Image trop sombre ou peu exploitable',image:img.src};
    // Classifieur de densité visuelle calibrable. Il ne compte pas les personnes et ne produit aucun nombre.
    let pressure;
    const e=s.edgeDensity;
    if(e<.070) pressure=20;
    else if(e<.105) pressure=42;
    else if(e<.145) pressure=64;
    else pressure=84;
    let confidence=45;
    const nearest=Math.min(Math.abs(e-.070),Math.abs(e-.105),Math.abs(e-.145));
    if(nearest>.020) confidence+=14;
    if(s.contrast>40) confidence+=8;
    confidence=Math.min(72,confidence);
    const level=confidence<43?INSUFFICIENT:levelFor(pressure);
    return {...level,pressure:level===INSUFFICIENT?null:pressure,confidence,type:'Observation directe',updatedAt:new Date(),image:img.src,scope:meta.scope,technical:{edgeDensity:e,contrast:s.contrast}};
  }

  function historyKey(b){return `la-crowd-v12:${b.id||norm(b.name)}`;}
  function previousAndSave(b,result){
    let previous=null;
    try{const arr=JSON.parse(localStorage.getItem(historyKey(b))||'[]');previous=arr.filter(x=>Date.now()-x.t<3*3600000).sort((a,b)=>b.t-a.t)[0]||null;const next=[{t:Date.now(),p:result.pressure,type:result.type},...arr].slice(0,12);localStorage.setItem(historyKey(b),JSON.stringify(next));}catch{}
    return previous;
  }

  async function crowdNow(b,force=false){
    const key=b.id||`${b.lat},${b.lon}`;const cached=crowdEstimates.get(key);
    if(!force&&cached&&Date.now()-cached.cachedAt<V12_TTL)return cached;
    const meta=cameraMeta(b);let result;
    if(meta?.coverage==='direct'){
      try{result=await cameraObservation(meta,b);}catch{result={...INSUFFICIENT,type:'Observation directe',confidence:20,updatedAt:new Date(),reason:'Snapshot caméra indisponible'};}
    } else result=await estimateIndirect(b,0);
    const forecast=await estimateIndirect(b,2);
    const previous=previousAndSave(b,result);
    result.trend=previous&&Number.isFinite(previous.p)&&Number.isFinite(result.pressure)?trendLabel(result.pressure-previous.p):'— pas encore d’historique local';
    result.forecast=forecast;
    result.cachedAt=Date.now();
    crowdEstimates.set(key,result);return result;
  }

  function crowdCardHtml(r){
    if(!r)return '<span class="chip">👥 Affluence : calcul en cours</span>';
    const cls=r.key==='quiet'?'crowd-q':r.key==='ok'?'crowd-o':r.key==='busy'?'crowd-b':r.key==='full'?'crowd-f':'crowd-u';
    return `<span class="chip ${cls}">👥 ${esc(r.label)} · ${esc(r.type)}</span>`;
  }

  // Plus de faux badge webcam pour des plages voisines.
  crowdBadge = function(b){return crowdCardHtml(crowdEstimates.get(b.id||`${b.lat},${b.lon}`));};

  const renderBeforeV12=render;
  render=function(){
    renderBeforeV12();
    // La V11 ajoute ensuite ses photos via son wrapper. Ici on n'ajoute que l'affluence lorsque disponible.
    beaches.forEach(async b=>{
      const r=await crowdNow(b).catch(()=>null);if(!r)return;
      const card=document.querySelector(`.spot-card[data-id="${CSS.escape(String(b.id))}"]`);if(!card)return;
      const chips=card.querySelector('.chips');if(!chips)return;
      const old=[...chips.querySelectorAll('.chip')].find(x=>x.textContent.includes('Affluence')||x.textContent.includes('webcam')||x.textContent.includes('SERENITY'));
      if(old)old.outerHTML=crowdCardHtml(r); else chips.insertAdjacentHTML('beforeend',crowdCardHtml(r));
    });
  };

  function signalRows(r){
    if(r.type==='Observation directe') return `<div class="v12-signal"><b>📹 Webcam officielle</b><span>${esc(r.scope||'Zone réellement visible')} · classification visuelle sans comptage</span></div>`;
    return (r.signals||[]).map(s=>`<div class="v12-signal"><b>${esc(s.source)}</b><span>${esc(s.label)}</span></div>`).join('');
  }

  function crowdPanel(r,b){
    const meta=cameraMeta(b), conf=confidenceLabel(r.confidence||0), f=r.forecast;
    const sourceLabel=r.type==='Observation directe'?'OBSERVATION DIRECTE':'ESTIMATION MULTI-SIGNAUX';
    const image=r.image?`<img class="v12-observation-img" src="${r.image}" alt="Image récente de la webcam utilisée pour l’affluence">`:'';
    const unavailable=r.type==='Estimation'?`<div class="v12-excluded"><b>Signaux exclus faute de donnée libre fiable :</b> occupation live des parkings Cannes, trafic routier live local, transports en charge, SERENITY et historique communautaire partagé.</div>`:'';
    return `<div class="v12-crowd-card ${esc(r.key)}"><div class="v12-crowd-top"><span>${sourceLabel}</span><b>${esc(r.label)}</b></div><div class="v12-meta"><span>Tendance : <b>${esc(r.trend)}</b></span><span>Mise à jour : <b>${fmtTime(r.updatedAt)}</b></span><span>Confiance : <b>${conf}</b></span></div>${image}<div class="v12-signals">${signalRows(r)}</div>${unavailable}${f?`<div class="v12-forecast"><span>PRÉVISION +2 H</span><b>${esc(f.label)}</b><small>Confiance ${confidenceLabel(f.confidence||0)} · météo/mer supposées stables si aucune prévision horaire spécifique n’est disponible.</small></div>`:''}<div class="v12-actions">${meta?`<a href="${meta.cam.watch}" target="_blank" rel="noopener">📹 Voir la caméra LIVE ↗</a>`:''}<button id="v12RefreshCrowd">↻ Réactualiser</button></div><p class="v12-rule">Jamais de nombre de personnes. Satellite/orthophoto : cartographie uniquement, jamais mesure d’affluence temps réel.</p></div>`;
  }

  // Remplace complètement l'ancien résultat COCO-SSD : aucun nombre de personnes n'est affiché.
  analyzeCamera = async function(meta,b,manual=false){
    const box=document.querySelector('#crowdAnalysis');if(!box)return;
    box.innerHTML='<div class="analysis-loading"><span class="spinner"></span><div><b>Analyse de la zone réellement visible…</b><small>Aucun comptage de personnes.</small></div></div>';
    const r=await crowdNow(b,manual).catch(()=>({...INSUFFICIENT,type:'Observation directe',confidence:10,updatedAt:new Date(),trend:'—'}));
    box.innerHTML=crowdPanel(r,b);
    document.querySelector('#v12RefreshCrowd')?.addEventListener('click',()=>analyzeCamera(meta,b,true));
  };

  const openBeforeV12=openDetail;
  openDetail=async function(b){
    await openBeforeV12(b);
    const meta=cameraMeta(b);
    if(meta?.coverage==='direct'&&meta.cam.analyzable) return; // analyzeCamera V12 a déjà pris la main.
    const section=detailBody.querySelector('.crowd-section');if(!section)return;
    const r=await crowdNow(b).catch(()=>({...INSUFFICIENT,type:'Estimation',confidence:10,updatedAt:new Date(),trend:'—'}));
    const old=section.querySelector('.crowd-info, #crowdAnalysis');if(old)old.outerHTML=crowdPanel(r,b);else section.insertAdjacentHTML('beforeend',crowdPanel(r,b));
    document.querySelector('#v12RefreshCrowd')?.addEventListener('click',async()=>{const rr=await crowdNow(b,true);const p=section.querySelector('.v12-crowd-card');if(p)p.outerHTML=crowdPanel(rr,b);});
  };

  // Toutes les 15 min : invalidation douce, puis mise à jour des cartes visibles.
  setInterval(()=>{crowdEstimates.clear();render();},V12_TTL);
  refresh(false);
})();
