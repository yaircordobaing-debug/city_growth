/* ============================================================
   GeoData Service — Comunas, barrios, POIs
   Loads GeoJSON polygons + metadata
   ============================================================ */

const GeoDataService = (() => {

  let comunasData = null;
  let poisData = null;
  let comunasGeoJSON = null;

  async function loadComunas() {
    if (comunasData) return comunasData;
    try {
      const response = await fetch('js/data/comunas.json');
      comunasData = await response.json();
      console.log(`✅ GeoData: ${comunasData.length} comunas loaded`);
      return comunasData;
    } catch (err) {
      console.error('Failed to load comunas:', err);
      return [];
    }
  }

  async function loadPOIs() {
    if (poisData) return poisData;
    try {
      const response = await fetch('js/data/touristPOIs.json');
      poisData = await response.json();
      console.log(`✅ GeoData: ${poisData.length} POIs loaded`);
      return poisData;
    } catch (err) {
      console.error('Failed to load POIs:', err);
      return [];
    }
  }

  // Generate simplified GeoJSON polygons for the 16 comunas
  // Based on approximate boundaries
  function generateComunasGeoJSON() {
    if (comunasGeoJSON) return comunasGeoJSON;

    const comunaPolygons = {
      1: [[6.2950,-75.5500],[6.2980,-75.5350],[6.2850,-75.5280],[6.2730,-75.5350],[6.2750,-75.5500]],
      2: [[6.2950,-75.5570],[6.2950,-75.5500],[6.2750,-75.5430],[6.2730,-75.5550],[6.2830,-75.5600]],
      3: [[6.2800,-75.5430],[6.2850,-75.5280],[6.2680,-75.5200],[6.2580,-75.5320],[6.2650,-75.5420]],
      4: [[6.2880,-75.5600],[6.2830,-75.5550],[6.2650,-75.5420],[6.2620,-75.5570],[6.2700,-75.5680],[6.2810,-75.5680]],
      5: [[6.2960,-75.5770],[6.2880,-75.5600],[6.2810,-75.5680],[6.2700,-75.5680],[6.2700,-75.5780],[6.2850,-75.5800]],
      6: [[6.3000,-75.5860],[6.2960,-75.5770],[6.2850,-75.5800],[6.2780,-75.5850],[6.2800,-75.5950],[6.2950,-75.5920]],
      7: [[6.2950,-75.5920],[6.2800,-75.5950],[6.2700,-75.5880],[6.2620,-75.5950],[6.2650,-75.6100],[6.2800,-75.6100],[6.2900,-75.6000]],
      8: [[6.2650,-75.5420],[6.2580,-75.5320],[6.2450,-75.5300],[6.2400,-75.5450],[6.2520,-75.5530],[6.2620,-75.5470]],
      9: [[6.2620,-75.5570],[6.2520,-75.5530],[6.2400,-75.5450],[6.2350,-75.5580],[6.2450,-75.5650],[6.2550,-75.5620]],
      10: [[6.2700,-75.5680],[6.2620,-75.5570],[6.2550,-75.5620],[6.2450,-75.5650],[6.2400,-75.5750],[6.2500,-75.5770],[6.2700,-75.5780]],
      11: [[6.2600,-75.5770],[6.2500,-75.5770],[6.2420,-75.5850],[6.2420,-75.5980],[6.2550,-75.6020],[6.2600,-75.5920]],
      12: [[6.2600,-75.5920],[6.2550,-75.6020],[6.2490,-75.6060],[6.2460,-75.6150],[6.2550,-75.6120],[6.2620,-75.5950]],
      13: [[6.2750,-75.6100],[6.2650,-75.6100],[6.2550,-75.6120],[6.2460,-75.6150],[6.2400,-75.6200],[6.2500,-75.6250],[6.2700,-75.6200]],
      14: [[6.2400,-75.5750],[6.2300,-75.5600],[6.1950,-75.5600],[6.1950,-75.5850],[6.2280,-75.5850],[6.2400,-75.5830]],
      15: [[6.2400,-75.5830],[6.2280,-75.5850],[6.2150,-75.5900],[6.2100,-75.6000],[6.2350,-75.6050],[6.2420,-75.5980]],
      16: [[6.2420,-75.5980],[6.2350,-75.6050],[6.2100,-75.6100],[6.2100,-75.6200],[6.2350,-75.6200],[6.2460,-75.6150],[6.2490,-75.6060],[6.2420,-75.5980]]
    };

    const features = [];
    for (const [id, coords] of Object.entries(comunaPolygons)) {
      const ring = coords.map(c => [c[1], c[0]]); // GeoJSON is [lng, lat]
      ring.push(ring[0]); // close the ring
      features.push({
        type: 'Feature',
        properties: { id: parseInt(id) },
        geometry: { type: 'Polygon', coordinates: [ring] }
      });
    }

    comunasGeoJSON = { type: 'FeatureCollection', features };
    return comunasGeoJSON;
  }

  function getComunaById(id) {
    if (!comunasData) return null;
    return comunasData.find(c => c.id === id);
  }

  function getAllComunas() {
    return comunasData || [];
  }

  function getPOIsByComuna(comunaId) {
    if (!poisData) return [];
    return poisData.filter(p => p.comuna === comunaId);
  }

  function getComunaColor(comunaId, indicator = 'aqi') {
    const comuna = getComunaById(comunaId);
    if (!comuna) return '#6C63FF';
    
    const value = comuna.indicadores[indicator] || 50;
    if (indicator === 'seguridad' || indicator === 'movilidad' || indicator === 'servicios') {
      // Higher is better
      if (value >= 75) return '#4caf50';
      if (value >= 55) return '#ffeb3b';
      if (value >= 40) return '#ff9800';
      return '#f44336';
    } else {
      // AQI: lower is better
      if (value <= 30) return '#4caf50';
      if (value <= 50) return '#ffeb3b';
      if (value <= 70) return '#ff9800';
      return '#f44336';
    }
  }

  // Services coverage data per comuna
  const SERVICES_DATA = {
    1: { energia: 95, agua: 92, gas: 78, internet: 60, score: 78 },
    2: { energia: 94, agua: 90, gas: 75, internet: 55, score: 76 },
    3: { energia: 93, agua: 89, gas: 72, internet: 52, score: 74 },
    4: { energia: 96, agua: 93, gas: 80, internet: 62, score: 80 },
    5: { energia: 97, agua: 94, gas: 82, internet: 65, score: 82 },
    6: { energia: 94, agua: 91, gas: 76, internet: 55, score: 75 },
    7: { energia: 96, agua: 93, gas: 80, internet: 63, score: 79 },
    8: { energia: 92, agua: 88, gas: 70, internet: 48, score: 72 },
    9: { energia: 95, agua: 92, gas: 78, internet: 58, score: 77 },
    10: { energia: 99, agua: 98, gas: 92, internet: 85, score: 92 },
    11: { energia: 99, agua: 98, gas: 95, internet: 90, score: 95 },
    12: { energia: 98, agua: 97, gas: 90, internet: 82, score: 90 },
    13: { energia: 93, agua: 89, gas: 72, internet: 50, score: 73 },
    14: { energia: 100, agua: 99, gas: 98, internet: 95, score: 98 },
    15: { energia: 98, agua: 96, gas: 88, internet: 78, score: 88 },
    16: { energia: 98, agua: 96, gas: 88, internet: 80, score: 89 }
  };

  function getServicesByComuna(comunaId) {
    return SERVICES_DATA[comunaId] || { energia: 90, agua: 85, gas: 75, internet: 60, score: 75 };
  }

  return { loadComunas, loadPOIs, generateComunasGeoJSON, getComunaById, getAllComunas, getPOIsByComuna, getComunaColor, getServicesByComuna };
})();
