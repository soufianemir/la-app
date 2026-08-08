(() => {
  const isCannes = b => norm(b?.city || '').includes('cannes');

  // Cannes uniquement : on ne laisse plus les plages voisines remplir le classement.
  beachPool = function(){
    const rad = Number(document.querySelector('#radiusSelect')?.value || 10);
    const local = FALLBACK.filter(isCannes).map(b => ({...b, quality: qualityFor(b)}));
    const off = officialBeaches.filter(isCannes).map(b => ({...b}));
    const pool = [...local, ...off];
    const dedup = [];
    for(const b of pool){
      const d = km(center.lat, center.lon, b.lat, b.lon);
      if(d > rad) continue;
      const duplicate = dedup.some(x =>
        km(x.lat, x.lon, b.lat, b.lon) < 0.12 &&
        (norm(x.name).includes(norm(b.name)) || norm(b.name).includes(norm(x.name)))
      );
      if(!duplicate) dedup.push({...b, distance:d});
    }
    return dedup.sort((a,b) => a.distance - b.distance).slice(0, 40);
  };

  function polishMaracana(){
    document.querySelectorAll('.spot-card').forEach(card => {
      const b = beaches.find(x => String(x.id) === String(card.dataset.id));
      if(!b || !norm(b.name).includes('maracana')) return;
      const city = card.querySelector('.spot-city');
      if(city) city.innerHTML = 'Cannes · <b>sur le site de l’ancienne Plage des Sports</b>';
    });
    document.querySelectorAll('.v11-detail-overlay b').forEach(el => {
      if(norm(el.textContent).includes('anciennement plage des sports')){
        el.textContent = 'sur le site de l’ancienne Plage des Sports';
      }
    });
  }

  const renderBeforeV14 = render;
  render = function(){
    renderBeforeV14();
    polishMaracana();
  };

  const openBeforeV14 = openDetail;
  openDetail = async function(b){
    await openBeforeV14(b);
    polishMaracana();
  };

  // Repart d'un catalogue Cannes propre dès le chargement.
  refresh(false);
})();
