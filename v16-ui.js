(() => {
  const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
  const nrm=s=>typeof norm==='function'?norm(s):clean(s).toLowerCase();
  const WATER_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/qualite-des-eaux-de-baignade.html';
  const FLAGS_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/les-drapeaux-a-la-plage.html';
  const ANIMALS_URL='https://www.cannes.com/fr/cadre-de-vie/animal-citadin.html';
  const ZAMENHOF_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/plage-zamenhof-en-regie-municipale.html';
  const HANDI_URL='https://www.cannes.com/fr/cadre-de-vie/plages-mer-nautisme/plages/handiplage.html';

  function crowdState(t){const s=nrm(t);if(s.includes('tranquille'))return'quiet';if(s.includes('ca va'))return'ok';if(s.includes('beaucoup'))return'busy';if(s.includes('sature'))return'full';return'unknown';}
  function removeDot(t){return clean(t).replace(/^[🟢🟡🟠🔴⚪]\s*/u,'');}
  function sourceLabel(raw){const s=nrm(raw);if(s.includes('observation'))return'📹 Webcam officielle';if(s.includes('prevision'))return'🕒 Prévision';return'📊 Estimation';}

  function polishCrowdPanel(root=document){
    root.querySelectorAll?.('.v12-crowd-card:not([data-v16-done="1"])').forEach(card=>{
      const top=card.querySelector('.v12-crowd-top');if(!top)return;
      const sourceRaw=clean(top.querySelector('span')?.textContent);
      const labelRaw=clean(top.querySelector('b')?.textContent)||'Données insuffisantes';
      const state=crowdState(labelRaw),label=removeDot(labelRaw);
      const meta=[...card.querySelectorAll('.v12-meta span')].map(x=>clean(x.textContent));
      const trend=(meta.find(x=>nrm(x).startsWith('tendance'))||'').replace(/^Tendance\s*:\s*/i,'')||'Historique en cours';
      const updated=(meta.find(x=>nrm(x).startsWith('mise a jour'))||'').replace(/^Mise à jour\s*:\s*/i,'');
      const confidence=(meta.find(x=>nrm(x).startsWith('confiance'))||'').replace(/^Confiance\s*:\s*/i,'')||'Faible';
      const forecast=removeDot(card.querySelector('.v12-forecast b')?.textContent||'');
      const reasons=card.querySelector('.v12-signals')?.innerHTML||'';
      const excluded=card.querySelector('.v12-excluded')?.innerHTML||'';
      const image=card.querySelector('.v12-observation-img')?.outerHTML||'';
      const actions=card.querySelector('.v12-actions')?.innerHTML||'';
      card.dataset.v16Done='1';card.className=`v13-crowd ${state}`;
      card.innerHTML=`<div class="v13-crowd-main"><div class="v13-status-dot"></div><div class="v13-crowd-copy"><span class="v13-kicker">AFFLUENCE MAINTENANT</span><strong>${state==='unknown'?'On ne sait pas encore':label}</strong><div class="v13-source"><span>${sourceLabel(sourceRaw)}</span>${updated?`<span>· ${updated}</span>`:''}</div></div></div><div class="v13-quickline"><span>${clean(trend)}</span><span>Confiance ${clean(confidence).toLowerCase()}</span></div>${forecast?`<div class="v13-forecast"><span>Dans environ 2 h</span><b>${forecast}</b></div>`:''}<details class="v13-why"><summary>Pourquoi ce résultat ?</summary><p class="v13-explain">Une catégorie simple, jamais un nombre de personnes. Observation webcam quand le champ est réellement couvert, sinon estimation à partir des signaux disponibles.</p>${reasons?`<div class="v13-reasons">${reasons}</div>`:''}${image?`<div class="v13-used-image"><span>Image utilisée</span>${image}</div>`:''}${excluded?`<div class="v13-missing">${excluded}</div>`:''}</details>${actions?`<div class="v13-actions">${actions}</div>`:''}`;
    });
  }

  function cardCrowd(card){
    const chips=[...card.querySelectorAll('.chips .chip')];
    const chip=chips.find(x=>{const t=clean(x.textContent);return ['Tranquille','Ça va','Beaucoup de monde','Saturée','Données insuffisantes','Affluence'].some(v=>t.includes(v));});
    if(!chip)return;
    const raw=clean(chip.textContent).replace(/^👥\s*/,'');
    const parts=raw.split('·').map(clean),label=removeDot(parts[0]||raw),source=parts[1]||chip.title?.replace(/^Source\s*:\s*/i,'')||'';
    const state=crowdState(raw);
    let strip=card.querySelector('.v16-affluence-strip');
    if(!strip){strip=document.createElement('div');strip.className='v16-affluence-strip';const score=card.querySelector('.spot-score');if(score)score.insertAdjacentElement('beforebegin',strip);else card.appendChild(strip);}
    strip.className=`v16-affluence-strip ${state}`;
    strip.innerHTML=`<div class="v16-left"><small>AFFLUENCE MAINTENANT</small><strong>${state==='unknown'?'On ne sait pas encore':label}</strong></div><span>${source?sourceLabel(source):'mise à jour automatique'}</span>`;
    chip.style.display='none';
  }
  function polishCards(){document.querySelectorAll('.spot-card').forEach(cardCrowd);}
  function refreshUi(){polishCards();polishCrowdPanel(document);}
  function burst(){refreshUi();setTimeout(refreshUi,350);setTimeout(refreshUi,1300);}

  function cannesClock(){
    const p=Object.fromEntries(new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).filter(x=>x.type!=='literal').map(x=>[x.type,Number(x.value)]));
    return {y:p.year,m:p.month,d:p.day,h:p.hour+(p.minute||0)/60};
  }
  function waterInfo(b){
    const q=typeof qualityFor==='function'?clean(qualityFor(b)):'';
    if(!q)return{icon:'⚪',title:'Qualité de l’eau',value:'Donnée officielle non rattachée',note:'Aucun statut n’est attribué à cette fiche sans correspondance suffisamment fiable.',cls:'neutral',url:WATER_URL};
    const s=nrm(q);if(s.includes('insuff'))return{icon:'🔴',title:'Qualité de l’eau',value:q,note:'Statut officiel associé à ce site de baignade.',cls:'bad',url:WATER_URL};
    if(s.includes('moyen')||s.includes('suff'))return{icon:'🟡',title:'Qualité de l’eau',value:q,note:'Statut officiel associé à ce site de baignade.',cls:'warn',url:WATER_URL};
    return{icon:'🟢',title:'Qualité de l’eau',value:q,note:'Statut officiel associé à ce site de baignade. Ce n’est pas une mesure minute par minute.',cls:'good',url:WATER_URL};
  }
  function supervisionInfo(b){
    const n=nrm(b.name),t=cannesClock();
    if(n.includes('zamenhof')){const season=(t.m>6&&t.m<9)||(t.m===6&&t.d>=15)||(t.m===9&&t.d<=15),open=season&&t.h>=8.5&&t.h<18.5;return{icon:open?'🟢':'⚪',title:'Baignade surveillée',value:open?'Surveillée maintenant':'Hors horaires',note:'Zamenhof · 15 juin–15 septembre · 8h30–18h30.',cls:open?'good':'neutral',url:ZAMENHOF_URL};}
    if(n.includes('bijou')){const season=(t.m===6&&t.d>=15)||t.m===7||t.m===8||(t.m===9&&t.d<=15),summer=t.m===7||t.m===8,start=summer?9:10,end=summer?19:18,open=season&&t.h>=start&&t.h<end;return{icon:open?'🟢':'⚪',title:'Handiplage / surveillance',value:open?'Service ouvert maintenant':'Hors horaires',note:`Bijou · ${summer?'9h–19h':'10h–18h'} en saison.`,cls:open?'good':'neutral',url:HANDI_URL};}
    return{icon:'⚪',title:'Surveillance',value:'Surveillance saisonnière',note:'L’app ne déduit pas un horaire précis pour cette plage sans source dédiée.',cls:'neutral',url:FLAGS_URL};
  }
  function animalsInfo(b){
    const n=nrm(b.name),t=cannesClock();
    if(n.includes('trou de l ancre'))return{icon:'⚪',title:'Animaux',value:'Règle à vérifier',note:'Les sources disponibles présentent une ambiguïté pour ce site ; l’app ne tranche pas.',cls:'neutral',url:ANIMALS_URL};
    const winter=t.m===11||t.m===12||t.m<=4||(t.m===5&&t.d===1),exception=n.includes('midi')||n.includes('zamenhof')||n.includes('gazagnaire');
    if(winter&&exception)return{icon:'🟢',title:'Chiens',value:'Autorisés actuellement',note:'Autorisation hivernale sur Midi, Zamenhof et Gazagnaire du 1er novembre au 1er mai.',cls:'good',url:ANIMALS_URL};
    return{icon:'🔴',title:'Chiens',value:'Interdits sur la plage',note:'Règle générale Cannes en saison ; les exceptions hivernales sont signalées quand elles s’appliquent.',cls:'bad',url:ANIMALS_URL};
  }
  function webcamInfo(b){
    const m=typeof cameraMeta==='function'?cameraMeta(b):null;
    if(!m||m.coverage!=='direct')return null;
    return{icon:'📹',title:'Webcam officielle',value:m.cam?.name||'Caméra Cannes',note:m.scope||'Cette webcam couvre directement ce secteur.',cls:'good',url:m.cam?.watch||null};
  }
  function tile(x){return `<article class="v16-alert ${x.cls||'neutral'}"><div class="v16-alert-top"><span>${x.icon}</span><div><small>${clean(x.title)}</small><strong>${clean(x.value)}</strong></div></div><p>${clean(x.note)}</p>${x.url?`<a href="${x.url}" target="_blank" rel="noopener">Source / détail ↗</a>`:''}</article>`;}
  function addSafety(b){
    if(!detailBody||detailBody.querySelector('.v16-safety'))return;
    const section=document.createElement('section');section.className='v16-safety';
    const webcam=webcamInfo(b);
    const items=[
      waterInfo(b),
      {icon:'🪼',title:'Méduses',value:'Pas de donnée live fiable intégrée',note:'L’absence de signalement n’est jamais transformée en « pas de méduses ».',cls:'neutral',url:FLAGS_URL},
      {icon:'🦠',title:'Algues / Ostreopsis',value:'Surveillance officielle',note:'Cannes surveille Ostreopsis et la qualité des eaux ; pas de statut minute par minute inventé.',cls:'neutral',url:WATER_URL},
      supervisionInfo(b),animalsInfo(b),
      {icon:'🚩',title:'Drapeau actuel',value:'Non disponible en ligne',note:'À vérifier sur place. Rouge = baignade interdite ; violet = pollution ou espèces aquatiques dangereuses.',cls:'neutral',url:FLAGS_URL}
    ];
    if(webcam)items.unshift(webcam);
    section.innerHTML=`<div class="v16-safety-head"><span>AVANT DE TE BAIGNER</span><h3>Sécurité & règles</h3></div><div class="v16-safety-grid">${items.map(tile).join('')}</div>`;
    const crowd=detailBody.querySelector('.crowd-section,.v12-crowd-card,.v13-crowd');
    if(crowd)crowd.insertAdjacentElement('beforebegin',section);else detailBody.appendChild(section);
  }

  if(typeof render==='function'){
    const prevRender=render;
    render=function(){const r=prevRender();burst();return r;};
  }
  if(typeof openDetail==='function'){
    const prevOpen=openDetail;
    openDetail=async function(b){const r=await prevOpen(b);addSafety(b);polishCrowdPanel(detailBody||document);setTimeout(()=>polishCrowdPanel(detailBody||document),300);return r;};
  }

  burst();
})();
