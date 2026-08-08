(() => {
  const byId = (id) => document.getElementById(id);
  const input = byId('addressInput');
  const locateBtn = byId('locateBtn');
  const locationLine = byId('locationLine');
  const sourceStateEl = byId('sourceState');
  const suggestions = byId('suggestions');

  function notify(message) {
    try { showToast(message); } catch { console.log(message); }
  }

  async function forceLocalCatalog() {
    try {
      if (!beaches || !beaches.length) beaches = FALLBACK_BEACHES;
      if (!location) {
        await setLocation(FALLBACK_LOCATION, 'Aperçu Côte d’Azur · catalogue local');
      } else if (!currentResults || !currentResults.length) {
        renderNearby();
      }
    } catch (e) {
      console.error('catalog hotfix', e);
    }
  }

  // L'interface ne doit jamais attendre la base nationale pour être utilisable.
  forceLocalCatalog();
  setTimeout(() => {
    try {
      if (!document.querySelector('.spot-card')) forceLocalCatalog();
      if (sourceStateEl?.classList.contains('loading')) {
        sourceStateEl.className = 'source-state warn';
        sourceStateEl.innerHTML = '<div>!</div><div><b>Base nationale en arrière-plan</b><small>Le catalogue Côte d’Azur reste utilisable immédiatement.</small></div>';
      }
    } catch {}
  }, 4500);

  // Ajoute une action explicite : sur mobile, taper une adresse sans choisir une suggestion
  // doit quand même lancer la recherche.
  const searchBtn = document.createElement('button');
  searchBtn.id = 'searchBtn';
  searchBtn.className = 'soft-btn';
  searchBtn.innerHTML = '<span>⌕</span> <b>Rechercher</b>';
  searchBtn.style.minHeight = '58px';
  searchBtn.style.cursor = 'pointer';
  locateBtn?.parentNode?.insertBefore(searchBtn, locateBtn);

  async function geocodeNow() {
    const q = (input?.value || '').trim();
    if (q.length < 3) { notify('Saisis une adresse ou un lieu'); return; }
    if (locationLine) locationLine.innerHTML = '<span class="spinner"></span>Recherche de l’adresse…';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const url = new URL('https://data.geopf.fr/geocodage/search');
      url.searchParams.set('q', q);
      url.searchParams.set('limit', '1');
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error('geocode');
      const json = await res.json();
      const feature = json.features?.[0];
      const coords = feature?.geometry?.coordinates;
      if (!coords) throw new Error('no-result');
      const label = feature.properties?.label || feature.properties?.name || q;
      input.value = label;
      suggestions?.classList.add('hidden');
      await setLocation({ lat: coords[1], lon: coords[0], label }, label);
      notify('Adresse trouvée');
    } catch (e) {
      if (locationLine) locationLine.innerHTML = '<span class="pulse"></span>Adresse introuvable ou service momentanément indisponible.';
      notify('Impossible de localiser cette adresse');
    } finally {
      clearTimeout(timeout);
    }
  }

  searchBtn.addEventListener('click', geocodeNow);
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodeNow();
    }
  });

  // GPS : afficher immédiatement les erreurs iOS et accepter la meilleure mesure obtenue.
  function locateRobust() {
    if (!navigator.geolocation) { notify('GPS non disponible'); return; }
    if (locationLine) locationLine.innerHTML = '<span class="spinner"></span>Recherche GPS haute précision…';
    let best = null;
    let watchId = null;
    let done = false;
    const finish = async (message) => {
      if (done) return;
      done = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) {
        input.value = '';
        suggestions?.classList.add('hidden');
        await setLocation(
          { lat: best.coords.latitude, lon: best.coords.longitude, label: 'Autour de moi' },
          `Autour de moi · précision ±${Math.round(best.coords.accuracy)} m`
        );
        notify('Position mise à jour');
      } else {
        if (locationLine) locationLine.innerHTML = '<span class="pulse"></span>Active “Localisation précise” dans les réglages du navigateur puis réessaie.';
        notify(message || 'Position GPS indisponible');
      }
    };
    const timer = setTimeout(() => finish('Le GPS met trop de temps à répondre'), 12000);
    watchId = navigator.geolocation.watchPosition(
      (p) => {
        if (!best || p.coords.accuracy < best.coords.accuracy) best = p;
        if (p.coords.accuracy <= 50) finish();
      },
      (err) => {
        if (err?.code === 1) finish('Localisation refusée');
        else if (err?.code === 2) finish('Position indisponible');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  if (locateBtn) {
    locateBtn.onclick = null;
    locateBtn.addEventListener('click', locateRobust);
  }
})();
