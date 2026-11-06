// Offline-only proof of concept. It accepts HTML supplied by the caller and
// never makes network requests or saves extracted data.
function extractTour(document) {
  const candidates = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    let data;
    try { data = JSON.parse(script.textContent); } catch { continue; }
    const pending = Array.isArray(data) ? [...data] : [data];
    while (pending.length) {
      const item = pending.shift();
      if (!item || typeof item !== 'object') continue;
      if (Array.isArray(item['@graph'])) pending.push(...item['@graph']);
      const type = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
      if (type.some((t) => t === 'TouristAttraction' || t === 'TouristTrip' || t === 'Trip')) candidates.push(item);
    }
  }
  if (candidates.length !== 1) return { ok: false, reason: 'Keine eindeutigen strukturierten Tourdaten' };
  const tour = candidates[0];
  const name = typeof tour.name === 'string' ? tour.name.trim() : '';
  if (!name) return { ok: false, reason: 'Name fehlt' };
  const geo = tour.geo;
  const lat = Number(geo?.latitude), lon = Number(geo?.longitude);
  const validGeo = geo && geo.latitude !== '' && geo.longitude !== '' && geo.latitude != null && geo.longitude != null && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
  return { ok: true, name, ...(validGeo ? { coordinates: { lat, lon } } : {}) };
}
module.exports = { extractTour };
