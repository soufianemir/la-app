(() => {
  const WATER_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/qualite-des-eaux-de-baignade.html';
  const FLAGS_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/les-drapeaux-a-la-plage.html';
  const ANIMALS_URL='https://www.cannes.com/fr/cadre-de-vie/animal-citadin.html';
  const ZAMENHOF_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/plage-zamenhof-en-regie-municipale.html';
  const HANDI_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/handiplage.html';
  const MEDUSEO_IOS='https://apps.apple.com/fr/app/meduseo/id6535647657';
  const MEDUSEO_ANDROID='https://play.google.com/store/apps/details?id=com.meduseo.app';

  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const nrm=s=>typeof norm==='function'?norm(s):clean(s).toLowerCase();
  const currentYear=()=>new Date().getFullYear();

  function stateClassFromLabel(label){
    const s=nrm(label);
    if(s.includes('tranquille'))return 'quiet';
    if(s.includes('ca va'))return 'ok';
    if(s.includes('beaucoup'))return 'busy';
    if(s.includes('sature'))return 'full';
    return 'unknown';
  }
  function shortLabel(label){return clean(label).replace(/^[🟢🟡🟠🔴⚪]\s*/u,'');}
  function trendHuman(raw){const s=nrm(raw);if(s.includes('hausse'))return '↗ Ça se remplit';if(s.includes('baisse'))return '↘ Ça se vide';if(s.includes('stable'))return '→ Stable';return 'Historique en cours';}
  function sourceHuman(raw){const s=nrm(raw);if(s.includes('observation'))return {icon:'📹',name:'Webcam officielle',desc:'Image récente de cette plage'};if(s.includes('prevision'))return {icon:'🕒',name:'Prévision',desc:'Projection à partir des signaux disponibles'};return {icon:'📊',name:'Estimation',desc:'Heure, saison, météo, mer et accès disponibles'};}

  function polishCrowdCard(card){
    if(!card || card.dataset.v13Polished==='1')return;
    const top=card.querySelector('.v12-crowd-top');if(!top)return;
    const sourceRaw=clean(top.querySelector('span')?.textContent);
    const labelRaw=clean(top.querySelector('b')?.textContent)||'Données insuffisantes';
    const meta=[...card.querySelectorAll('.v12-meta span')].map(x=>clean(x.textContent));
    const trend=trendHuman(meta.find(x=>nrm(x).startsWith('tendance'))||'');
    const updated=(meta.find(x=>nrm(x).startsWith('mise a jour'))||'').replace(/^Mise à jour\s*:\s*/i,'');
    const confidence=(meta.find(x=>nrm(x).startsWith('confiance'))||'').replace(/^Confiance\s*:\s*/i,'')||'Faible';
    const source=sourceHuman(sourceRaw),state=stateClassFromLabel(labelRaw);
    const details=card.querySelector('.v12-signals')?.innerHTML||'',excluded=card.querySelector('.v12-excluded')?.innerHTML||'',forecastLabel=clean(card.querySelector('.v12-forecast b')?.textContent),actions=card.querySelector('.v12-actions')?.innerHTML||'',image=card.querySelector('.v12-observation-img')?.outerHTML||'';
    const unknown=state==='unknown';
    card.dataset.v13Polished='1';card.className=`v13-crowd ${state}`;
    card.innerHTML=`<div class="v13-crowd-main"><div class="v13-status-dot" aria-hidden="true"></div><div class="v13-crowd-copy"><span class="v13-kicker">AFFLUENCE MAINTENANT</span><strong>${unknown?'On ne sait pas encore':shortLabel(labelRaw)}</strong><div class="v13-source"><span>${source.icon} ${source.name}</span>${updated?`<span>· ${updated}</span>`:''}</div></div></div><div class="v13-quickline"><span>${trend}</span><span>Confiance ${clean(confidence).toLowerCase()}</span></div>${forecastLabel?`<div class="v13-forecast"><span>Dans environ 2 h</span><b>${shortLabel(forecastLabel)}</b></div>`:''}<details class="v13-why"><summary>Pourquoi ce résultat ?</summary><p class="v13-explain">${source.desc}. Ce niveau est une catégorie d’affluence, jamais un nombre de personnes.</p>${details?`<div class="v13-reasons">${details}</div>`:''}${image?`<div class="v13-used-image"><span>Image utilisée</span>${image}</div>`:''}${excluded?`<div class="v13-missing">${excluded}</div>`:''}</details>${actions?`<div class="v13-actions">${actions}</div>`:''}`;
  }
  function polishAllCrowd(){
    document.querySelectorAll('.v12-crowd-card').forEach(polishCrowdCard);
    document.querySelectorAll('.spot-card .chips .chip').forEach(chip=>{const t=clean(chip.textContent);if(!t.includes('Affluence')&&!t.includes('Tranquille')&&!t.includes('Ça va')&&!t.includes('Beaucoup de monde')&&!t.includes('Saturée')&&!t.includes('Données insuffisantes'))return;const parts=t.split('·');chip.textContent=parts[0].replace(/^👥\s*/,'').trim();chip.classList.add('v13-crowd-chip');if(parts[1])chip.title=`Source : ${parts[1].trim()}`;});
  }

  function waterStatus(b){const q=typeof qualityFor==='function'?qualityFor(b):'';if(!q)return {icon:'⚪',title:'Qualité de l’eau',value:'Pas de classement associé',note:'Aucune donnée officielle rattachée avec certitude à cette fiche.',cls:'neutral'};const s=nrm(q),cls=s.includes('insuff')?'bad':s.includes('suff')?'warn':'good',icon=cls==='bad'?'🔴':cls==='warn'?'🟡':'🟢';return {icon,title:'Qualité de l’eau',value:q,note:`Classement officiel ${currentYear()} · ce n’est pas une mesure minute par minute.`,cls};}
  function animalsStatus(b){const name=nrm(b.name),city=nrm(b.city),now=new Date(),month=now.getMonth()+1,day=now.getDate();if(!city.includes('cannes'))return {icon:'⚪',title:'Animaux',value:'Règle non intégrée',note:'Vérifier la réglementation locale.',cls:'neutral'};if(name.includes('trou de l ancre')||name.includes('ile ste marguerite est'))return {icon:'🟢',title:'Animaux',value:'Autorisés sur ce site',note:'Exception indiquée par la fiche officielle de baignade.',cls:'good'};const winter=(month===11||month===12||month<=4||(month===5&&day===1)),winterBeach=name.includes('midi')||name.includes('zamenhof')||name.includes('gazagnaire');if(winter&&winterBeach)return {icon:'🟢',title:'Chiens',value:'Autorisés actuellement',note:'Midi, Zamenhof et Gazagnaire : autorisés du 1er novembre au 1er mai.',cls:'good'};return {icon:'🔴',title:'Chiens',value:'Interdits sur la plage',note:'À Cannes, l’accès hivernal n’est autorisé sur Midi, Zamenhof et Gazagnaire que du 1er novembre au 1er mai.',cls:'bad'};}
  function surveillanceStatus(b){const name=nrm(b.name),now=new Date(),m=now.getMonth()+1,d=now.getDate(),h=now.getHours()+now.getMinutes()/60;if(name.includes('zamenhof')){const season=(m>6&&m<9)||(m===6&&d>=15)||(m===9&&d<=15),open=season&&h>=8.5&&h<18.5;return {icon:open?'🟢':'⚪',title:'Baignade surveillée',value:open?'Surveillée maintenant':'Hors horaires',note:'Zamenhof · 15 juin–15 septembre · 8h30–18h30.',cls:open?'good':'neutral'};}if(name.includes('bijou')){const inSeason=(m===6&&d>=15)||m===7||m===8||(m===9&&d<=15),start=(m===7||m===8)?9:10,end=(m===7||m===8)?19:18,open=inSeason&&h>=start&&h<end;return {icon:open?'🟢':'⚪',title:'Handiplage / surveillance',value:open?'Service ouvert maintenant':'Hors horaires',note:`Bijou Handiplage · ${(m===7||m===8)?'9h–19h':'10h–18h'} en saison.`,cls:open?'good':'neutral'};}if(['moure rouge','gare marchandises','nouveau palais','chantiers navals'].some(x=>name.includes(x)))return {icon:'⚪',title:'Poste de secours',value:'Pas de poste sur ce site',note:'Information de la fiche officielle de baignade ; d’autres postes existent sur le littoral.',cls:'neutral'};return {icon:'⚪',title:'Surveillance',value:'Saisonnière à Cannes',note:'Des sauveteurs sont présents aux postes de secours en saison ; horaire précis non publié ici pour cette plage.',cls:'neutral'};}
  function safetyTile(x,url,linkLabel){return `<article class="v13-safety-tile ${x.cls}"><div class="v13-safety-head"><span>${x.icon}</span><div><small>${x.title}</small><strong>${clean(x.value)}</strong></div></div><p>${clean(x.note)}</p>${url?`<a href="${url}" target="_blank" rel="noopener">${linkLabel} ↗</a>`:''}</article>`;}
  function addSafety(b){
    if(!detailBody||detailBody.querySelector('.v13-safety'))return;
    const crowd=detailBody.querySelector('.crowd-section'),target=crowd||detailBody.querySelector('.nearby-block')||detailBody.lastElementChild,water=waterStatus(b),animals=animalsStatus(b),surv=surveillanceStatus(b),section=document.createElement('section');
    section.className='v13-safety';
    section.innerHTML=`<div class="v13-section-title"><span class="eyebrow">MER & SÉCURITÉ</span><h3>Avant de te baigner</h3></div><div class="v13-safety-grid">${safetyTile(water,WATER_URL,'Source officielle')}<article class="v13-safety-tile neutral"><div class="v13-safety-head"><span>🪼</span><div><small>Méduses</small><strong>Pas de donnée live fiable intégrée</strong></div></div><p>On ne dit jamais « aucune méduse » sans signal récent. Vérifie les signalements externes si c’est important.</p><div class="v13-safety-links"><a href="${MEDUSEO_IOS}" target="_blank" rel="noopener">Meduseo iPhone ↗</a><a href="${MEDUSEO_ANDROID}" target="_blank" rel="noopener">Android ↗</a></div></article><article class="v13-safety-tile neutral"><div class="v13-safety-head"><span>🦠</span><div><small>Algues / pollution</small><strong>Surveillance Ostreopsis</strong></div></div><p>Cannes surveille la qualité des eaux et le risque Ostreopsis. Aucun statut temps réel automatique n’est disponible dans l’app.</p><a href="${WATER_URL}" target="_blank" rel="noopener">Voir les informations officielles ↗</a></article>${safetyTile(surv,surv.title.includes('Handiplage')?HANDI_URL:surv.title.includes('surveillée')?ZAMENHOF_URL:FLAGS_URL,'Voir la règle')}${safetyTile(animals,ANIMALS_URL,'Règle Cannes')}<article class="v13-safety-tile neutral"><div class="v13-safety-head"><span>🚩</span><div><small>Drapeau actuel</small><strong>Non disponible en ligne</strong></div></div><p>Vert, jaune, rouge ou violet doit être vérifié sur place. Violet = pollution ou espèces aquatiques dangereuses.</p><a href="${FLAGS_URL}" target="_blank" rel="noopener">Comprendre les drapeaux ↗</a></article></div>`;
    if(target)target.insertAdjacentElement('beforebegin',section);else detailBody.appendChild(section);
  }

  const observer=new MutationObserver(()=>polishAllCrowd());if(document.body)observer.observe(document.body,{childList:true,subtree:true});polishAllCrowd();
  if(typeof openDetail==='function'){const prevOpen=openDetail;openDetail=async function(b){await prevOpen(b);addSafety(b);polishAllCrowd();setTimeout(polishAllCrowd,250);setTimeout(polishAllCrowd,1200);};}
})();
