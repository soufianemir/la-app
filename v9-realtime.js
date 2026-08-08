(() => {
  const CAMS = {
    midi: {
      name: 'Boulevard du Midi',
      videoId: 'z6BNMoj9Pyo',
      watch: 'https://www.youtube.com/watch?v=z6BNMoj9Pyo',
      official: 'https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html'
    },
    laubeuf: {
      name: 'Quai Laubeuf',
      videoId: 'asO_10T0k2k',
      watch: 'https://www.youtube.com/watch?v=asO_10T0k2k',
      official: 'https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html'
    },
    palm: {
      name: 'Palm Beach',
      videoId: '8cff6yAO9bw',
      watch: 'https://www.youtube.com/watch?v=8cff6yAO9bw',
      official: 'https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/webcams-et-stations-meteo-a-cannes.html'
    }
  };

  const CANNES_PARKINGS = [
    {name:'P1 Palais',capacity:924,lat:43.55125,lon:7.01765,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p1-parking-palais.html'},
    {name:'P2 Suquet Forville',capacity:993,lat:43.55225,lon:7.00785,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p2-parking-suquet-forville.html'},
    {name:'P4 Pantiero',capacity:556,lat:43.55205,lon:7.01255,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p4-parking-pantiero.html'},
    {name:'P5 Ferrage Meynadier',capacity:394,lat:43.55470,lon:7.01170,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p5-parking-ferrage-meynadier.html'},
    {name:'P7 Vauban',capacity:286,lat:43.55800,lon:7.01610,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p7-parking-vauban.html'},
    {name:"P10 Lamy Rue d'Antibes",capacity:417,lat:43.55210,lon:7.03030,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p10-parking-lamy-rue-d-antibes.html'},
    {name:'P11 Roseraie',capacity:395,lat:43.54510,lon:7.03720,url:'https://www.cannes.com/fr/mairie/annuaire-pratique/equipements-municipaux/p11-parking-roseraie.html'}
  ];

  const CANNES_PARKING_HOME='https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-dans-les-parkings.html';
  const CANNES_FLOWBIRD='https://www.cannes.com/fr/cadre-de-vie/stationnement-ou-se-garer-a-cannes/stationnez-sur-la-voie-publique/flowbird.html';
  const SERENITY='https://www.cannes.com/fr/index/mentions-legales/experimentation-sur-l-analyse-de-la-frequentation-et-des-parcours-sur-des-secteurs-de-la-commune-de-cannes-projet-serenity.html';

  const normV9 = s => String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const isCannes = b => normV9(b.city).includes('cannes');

  function cameraFor(b){
    if(!isCannes(b)) return null;
    const n=normV9(b.name);
    if(n.includes('midi')) return CAMS.midi;
    if(n.includes('moure') || n.includes('bijou') || n.includes('palm')) return CAMS.palm;
    return null;
  }

  function serenityFor(b){
    if(!isCannes(b)) return false;
    const n=normV9(b.name);
    return n.includes('croisette') || n.includes('midi');
  }

  function cannesParkingsFor(b){
    if(!isCannes(b)) return [];
    return CANNES_PARKINGS.map(p=>({...p,d:km(b.lat,b.lon,p.lat,p.lon),official:true,cannes:true})).sort((a,b)=>a.d-b.d).slice(0,5);
  }

  function crowdChip(b){
    const cam=cameraFor(b);
    if(cam) return '<span class="chip realtime-chip">📹 Affluence : caméra LIVE</span>';
    if(serenityFor(b)) return '<span class="chip serenity-chip">👥 Comptage municipal actif · flux non public</span>';
    return '<span class="chip">👥 Affluence : donnée live non publiée</span>';
  }

  const baseRender = render;
  render = function(){
    spots.innerHTML=beaches.map(b=>`<article class="spot-card" data-id="${b.id}"><div class="spot-head"><div><div class="spot-name">${esc(b.name)}</div><div class="spot-city">${esc(b.city||'Côte d’Azur')}</div></div><div class="distance">${fmt(b.distance)}</div></div><div class="spot-score"><div class="score-ring" style="--score:0"><b>…</b></div><div class="score-copy"><b>Calcul sur données disponibles</b><small>Météo + mer${b.quality?' + qualité officielle':''}</small></div></div><div class="chips"><span class="chip live">🌊 Mer</span>${crowdChip(b)}<span class="chip">🅿️ Parking : voir capacité / live</span></div>${cameraFor(b)?'<div class="realtime-proof"><span class="live-pulse"></span><b>PREUVE VISUELLE EN DIRECT</b> · Ville de Cannes</div>':''}</article>`).join('');
    document.querySelectorAll('.spot-card').forEach(e=>e.onclick=()=>openDetail(beaches.find(b=>b.id===e.dataset.id)));
    enrich();
  };

  const baseOpenDetail = openDetail;
  openDetail = async function(b){
    detail.classList.remove('hidden');
    const cam=cameraFor(b);
    const hasSerenity=serenityFor(b);
    detailBody.innerHTML=`<div class="detail-hero"><p class="eyebrow">TEMPS RÉEL & PREUVES</p><h2>${esc(b.name)}</h2><div class="detail-sub">${esc(b.city)} · ${fmt(b.distance)}</div></div><div class="source-state loading"><span class="spinner"></span><div><b>Chargement des données disponibles…</b><small>Météo, mer, parking et sources live.</small></div></div>`;

    const [w,m,osm,nice] = await Promise.all([weather(b),marine(b),osmParking(b),niceLive()]);
    const s=score(b,w,m);
    let parkingRows=[];

    if(isCannes(b)){
      parkingRows=cannesParkingsFor(b).map(x=>({...x,availability:'non publiée'}));
    } else {
      const nearNice=km(b.lat,b.lon,43.70,7.27)<18;
      if(nearNice && nice){
        parkingRows=nice.map(x=>({...x,d:km(b.lat,b.lon,x.lat,x.lon),live:true})).filter(x=>x.d<5).sort((a,b)=>a.d-b.d).slice(0,7);
      } else if(nearNice){
        parkingRows=NP.map(x=>({...x,d:km(b.lat,b.lon,x.lat,x.lon),key:true})).filter(x=>x.d<5).sort((a,b)=>a.d-b.d).slice(0,7);
      } else {
        parkingRows=osm.slice(0,7);
      }
    }

    const cameraBlock = cam ? `
      <section class="live-section">
        <div class="live-section-head"><div><span class="live-dot-v9"></span><b>CAMÉRA LIVE · ${esc(cam.name)}</b><small>Flux officiel de la Ville de Cannes</small></div><a href="${cam.watch}" target="_blank" rel="noopener">Ouvrir sur YouTube ↗</a></div>
        <div class="video-wrap"><iframe src="https://www.youtube-nocookie.com/embed/${cam.videoId}?autoplay=0&mute=1&playsinline=1" title="Webcam Cannes ${esc(cam.name)}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>
        <p class="live-disclaimer">La caméra est une <b>preuve visuelle en temps réel</b>. L’app ne transforme pas encore automatiquement l’image en pourcentage d’occupation.</p>
      </section>` : '';

    const crowdBlock = cam ? `
      <div class="detail-tile crowd-live"><span>Affluence</span><strong>📹 Visible en direct</strong><small>Caméra officielle ${esc(cam.name)}</small></div>` : hasSerenity ? `
      <div class="detail-tile"><span>Affluence</span><strong>Comptage municipal actif</strong><small>SERENITY mesure les flux ; données agrégées non publiées en API</small></div>` : `
      <div class="detail-tile"><span>Affluence</span><strong>non mesurée publiquement</strong><small>Aucun chiffre inventé</small></div>`;

    const parkingHtml = parkingRows.length ? parkingRows.map(x=>{
      const availability=x.live&&Number.isFinite(x.available)?`<b class="live">${x.available} libres${Number.isFinite(x.total)?' / '+x.total:''}</b>`:x.key?'<b class="gated">live : clé Métropole requise</b>':isCannes(b)?'<b class="not-live">places libres non publiées</b>':'<b class="not-live">localisé</b>';
      const cap=x.capacity?` · ${x.capacity} places au total`:'';
      const link=x.url?`<a class="parking-link" href="${x.url}" target="_blank" rel="noopener">fiche officielle ↗</a>`:'';
      return `<div class="mini-row parking-row"><div><b>${esc(x.name)}</b><span>${fmt(x.d)}${cap}</span>${link}</div>${availability}</div>`;
    }).join('') : '<div class="mini-row"><b>Aucun parking structuré trouvé</b></div>';

    const cannesParkingActions=isCannes(b)?`<div class="parking-actions"><a href="${CANNES_FLOWBIRD}" target="_blank" rel="noopener">🚗 Voir disponibilité voirie Flowbird ↗</a><a href="${CANNES_PARKING_HOME}" target="_blank" rel="noopener">🅿️ Parkings Cannes officiels ↗</a></div><p class="parking-note"><b>Important :</b> Cannes publie les capacités de ses parkings, mais pas leur nombre de places libres via une API publique identifiée. Flowbird fournit en revanche de l’information temps réel sur la <b>voirie</b>.</p>`:'';

    const serenityAction=hasSerenity?`<a href="${SERENITY}" target="_blank" rel="noopener">Source SERENITY ↗</a>`:'';

    detailBody.innerHTML=`
      <div class="detail-hero"><p class="eyebrow">TEMPS RÉEL & PREUVES</p><h2>${esc(b.name)}</h2><div class="detail-sub">${esc(b.city)} · ${fmt(b.distance)}</div><div class="detail-score-row"><div class="detail-score">${s.v??'—'}</div><div><b>Conditions plage</b><div class="muted">Couverture des données ${s.c}% · parking/affluence non chiffrés exclus du score</div></div></div></div>
      ${cameraBlock}
      <div class="detail-grid"><div class="detail-tile"><span>Mer</span><strong>${m.ok&&m.sea!=null?Math.round(m.sea)+'°C · vagues '+Number(m.wave||0).toFixed(1)+' m':'indisponible'}</strong><small>Donnée modélisée actuelle</small></div><div class="detail-tile"><span>Météo</span><strong>${w.ok?Math.round(w.temp)+'° · vent '+Math.round(w.wind)+' km/h':'indisponible'}</strong><small>Donnée modélisée actuelle</small></div><div class="detail-tile"><span>Qualité baignade</span><strong>${esc(b.quality||'non chargée')}</strong><small>Classement officiel quand associé</small></div>${crowdBlock}</div>
      <div class="nearby-block"><div class="nearby-head-v9"><div><span class="eyebrow">STATIONNEMENT</span><h3>🅿️ Parkings proches</h3></div><span class="data-rule">libres ≠ capacité</span></div><div class="mini-list">${parkingHtml}</div>${cannesParkingActions}</div>
      <div class="source-box"><h3>Transparence des données</h3><div class="source-line">📹 Caméra = preuve visuelle live. 🌊 Mer/météo = modèles actualisés. 🅿️ « places libres » n’est affiché que si un flux officiel le fournit. ${hasSerenity?'👥 SERENITY mesure la fréquentation municipale mais son flux agrégé n’est pas public.':''}</div><div class="source-actions">${cam?`<a class="primary" href="${cam.official}" target="_blank" rel="noopener">Webcams officielles Cannes ↗</a>`:''}${serenityAction}</div></div>`;
  };

  // Enrichit immédiatement les cartes déjà affichées sans attendre une nouvelle recherche.
  if (typeof beaches !== 'undefined' && beaches.length) render();
})();
