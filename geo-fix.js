(() => {
  const geo = navigator.geolocation;
  if (!geo || typeof geo.watchPosition !== 'function') return;

  const originalGet = geo.getCurrentPosition.bind(geo);
  const originalWatch = geo.watchPosition.bind(geo);
  const originalClear = geo.clearWatch.bind(geo);

  const preciseGetCurrentPosition = (success, error, options = {}) => {
    let best = null;
    let finished = false;
    let watchId = null;
    let hardTimer = null;

    const cleanup = () => {
      if (watchId !== null) originalClear(watchId);
      if (hardTimer) clearTimeout(hardTimer);
    };

    const finishWithBest = () => {
      if (finished) return;
      finished = true;
      cleanup();
      if (best) success(best);
      else originalGet(success, error, {
        ...options,
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      });
    };

    watchId = originalWatch(
      position => {
        if (!best || position.coords.accuracy < best.coords.accuracy) best = position;
        const accuracy = position.coords.accuracy || Infinity;
        if (accuracy <= 50) finishWithBest();
      },
      geoError => {
        if (geoError?.code === 1) {
          if (finished) return;
          finished = true;
          cleanup();
          if (error) error(geoError);
          return;
        }
        if (!best && error && geoError?.code !== 3) error(geoError);
      },
      {
        ...options,
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000
      }
    );

    hardTimer = setTimeout(finishWithBest, 9000);
  };

  try {
    Object.defineProperty(geo, 'getCurrentPosition', {
      configurable: true,
      value: preciseGetCurrentPosition
    });
  } catch {
    try { geo.getCurrentPosition = preciseGetCurrentPosition; } catch {}
  }
})();
