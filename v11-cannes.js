(() => {
  const filePath = name => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}`;
  const PHOTOS = {
    maracana:{img:filePath('Cannes plage des sports.JPG'),page:'https://commons.wikimedia.org/wiki/File:Cannes_plage_des_sports.JPG',credit:'Guy Lebègue',license:'CC BY-SA 3.0',note:'ancienne Plage des Sports · photo 2011'},
    midi:{img:filePath('Cannes - Plage du Midi, la rade et les îles de Lérins.JPG'),page:'https://commons.wikimedia.org/wiki/File:Cannes_-_Plage_du_Midi,_la_rade_et_les_%C3%AEles_de_L%C3%A9rins.JPG',credit:'MOSSOT',license:'CC BY-SA 3.0',note:'Plage du Midi'},
    croisette:{img:filePath('CannesCroisettePlage.JPG'),page:'https://commons.wikimedia.org/wiki/File:CannesCroisettePlage.JPG',credit:'Gilbert Bochenek',license:'domaine public',note:'Croisette'},
    moure:{img:filePath('20210701 192727 Plage du Mouré Rouge.jpg'),page:'https://commons.wikimedia.org/wiki/File:20210701_192727_Plage_du_Mour%C3%A9_Rouge.jpg',credit:'Horizon06',license:'CC BY-SA 4.0',note:'Mouré Rouge'},
    palm:{img:filePath('Baie de Cannes - Flickr - berniedup.jpg'),page:'https://commons.wikimedia.org/wiki/File:Baie_de_Cannes_-_Flickr_-_berniedup.jpg',credit:'Bernard DUPONT',license:'CC BY-SA 2.0',note:'secteur Palm Beach'},
    bocca:{img:filePath('20220117 112416 Cannes La Bocca.jpg'),page:'https://commons.wikimedia.org/wiki/File:20220117_112416_Cannes_La_Bocca.jpg',credit:'06Corniche06',license:'CC BY-SA 4.0',note:'Rochers de La Bocca'},
    cannes:{img:filePath('Cannes Plage.JPG'),page:'https://commons.wikimedia.org/wiki/File:Cannes_Plage.JPG',credit:'Florian Pépellin',license:'CC BY-SA 3.0',note:'plage de Cannes'}
  };

  const maracanaExists = FALLBACK.some(b => norm(b.name).includes('maracana'));
  if(!maracanaExists){
    FALLBACK.push({
      id:'cannes-maracana',
      name:'Maracana Plage',
      city:'Cannes',
      lat:43.549137,
      lon:6.995695,
      source:'catalogue',
      aliases:['Plage des Sports'],
      privateBeach:true,
      description:'Ancienne Plage des Sports · Boulevard du Midi Louise Moreau · entre kiosques 19 et 20'
    });
  }

  function photoFor(b){
    if(!norm(b.city).includes('cannes')) return null;
    const n=norm(b.name);
    if(n.includes('maracana') || n.includes('plage des sports')) return PHOTOS.maracana;
    if(n.includes('midi')) return PHOTOS.midi;
    if(n.includes('croisette') || n.includes('mace') || n.includes('zamenhof')) return PHOTOS.croisette;
    if(n.includes('moure')) return PHOTOS.moure;
    if(n.includes('bijou') || n.includes('gazagnaire') || n.includes('palm') || n.includes('saint georges')) return PHOTOS.palm;
    if(n.includes('bocca') || n.includes('rocher') || n.includes('riou') || n.includes('font de veyre') || n.includes('sud aviation') || n.includes('roubine') || n.includes('gare marchandises')) return PHOTOS.bocca;
    return PHOTOS.cannes;
  }

  function aliasFor(b){
    const n=norm(b.name);
    if(n.includes('maracana')) return 'anciennement Plage des Sports';
    return '';
  }

  function decorateCards(){
    document.querySelectorAll('.spot-card').forEach(card => {
      if(card.querySelector('.v11-photo')) return;
      const b=beaches.find(x=>x.id===card.dataset.id); if(!b) return;
      const p=photoFor(b); if(!p) return;
      const media=document.createElement('div');
      media.className='v11-photo';
      media.innerHTML=`<img src="${p.img}" alt="${esc(b.name)} à Cannes" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('.v11-photo').classList.add('photo-error')"><div class="v11-photo-shade"></div><span class="v11-photo-label">PHOTO · ${esc(p.note)}</span><a class="v11-photo-credit" href="${p.page}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(p.credit)} · ${esc(p.license)} ↗</a>`;
      card.prepend(media);
      const alias=aliasFor(b);
      if(alias){ const city=card.querySelector('.spot-city'); if(city) city.innerHTML=`Cannes · <b>${esc(alias)}</b>`; }
    });
  }

  const renderV10=render;
  render=function(){ renderV10(); decorateCards(); };

  const openDetailV10=openDetail;
  openDetail=async function(b){
    await openDetailV10(b);
    const p=photoFor(b); if(!p || detailBody.querySelector('.v11-detail-photo')) return;
    const hero=detailBody.querySelector('.detail-hero');
    if(hero){
      const media=document.createElement('section');
      media.className='v11-detail-photo';
      const alias=aliasFor(b);
      media.innerHTML=`<img src="${p.img}" alt="${esc(b.name)}" referrerpolicy="no-referrer"><div class="v11-detail-overlay"><span>PHOTO D’ILLUSTRATION</span>${alias?`<b>${esc(alias)}</b>`:''}</div><a href="${p.page}" target="_blank" rel="noopener">Photo ${esc(p.credit)} · ${esc(p.license)} ↗</a>`;
      hero.insertAdjacentElement('afterend',media);
    }
  };

  // Recalcule le catalogue avec Maracana et redessine les cartes avec photos.
  refresh(false);
  sourceState.className='source-state ok';
  sourceState.innerHTML='<div>✓</div><div><b>Cannes Ultra activé</b><small>Photos réelles de Cannes + webcam live séparée des photos d’illustration.</small></div>';
})();
