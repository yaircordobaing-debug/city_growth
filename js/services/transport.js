/* ============================================================
   Transport Service — Metro de Medellín + Public Transport
   ArcGIS Feature Layer integration with local fallback
   ============================================================ */

const TransportService = (() => {

  // ArcGIS endpoints for Metro de Medellín open data
  const ARCGIS_BASE = 'https://services1.arcgis.com';
  const METRO_HUB = 'https://datosabiertos-metrodemedellin.opendata.arcgis.com';

  let metroData = null;
  let loaded = false;

  async function loadMetroData() {
    if (loaded && metroData) return metroData;
    
    try {
      // Try loading from the local JSON first (most reliable)
      const response = await fetch('js/data/metroStations.json');
      if (response.ok) {
        metroData = await response.json();
        loaded = true;
        console.log(`✅ Transport: ${metroData.estaciones.length} stations loaded`);
        return metroData;
      }
    } catch (err) {
      console.warn('Local metro data unavailable:', err.message);
    }

    // Inline fallback
    metroData = getInlineFallback();
    loaded = true;
    return metroData;
  }

  function getInlineFallback() {
    return {
      lineas: [
        { id: 'A', nombre: 'Línea A (Niquía - La Estrella)', color: '#00843D', tipo: 'metro' },
        { id: 'B', nombre: 'Línea B (San Antonio - San Javier)', color: '#FDB913', tipo: 'metro' },
        { id: 'K', nombre: 'Línea K (Metrocable Santo Domingo)', color: '#00BCB4', tipo: 'cable' },
        { id: 'J', nombre: 'Línea J (Metrocable San Javier)', color: '#F7941D', tipo: 'cable' },
        { id: 'TA', nombre: 'Tranvía Ayacucho', color: '#DC2626', tipo: 'tranvia' }
      ],
      estaciones: [
        { nombre: 'San Antonio', linea: 'A', lat: 6.2477, lng: -75.5696, comuna: 10 },
        { nombre: 'Parque Berrío', linea: 'A', lat: 6.2520, lng: -75.5686, comuna: 10 },
        { nombre: 'Poblado', linea: 'A', lat: 6.2110, lng: -75.5770, comuna: 14 },
        { nombre: 'Universidad', linea: 'A', lat: 6.2700, lng: -75.5646, comuna: 4 },
        { nombre: 'Caribe', linea: 'A', lat: 6.2808, lng: -75.5663, comuna: 5 },
        { nombre: 'San Javier', linea: 'B', lat: 6.2568, lng: -75.6103, comuna: 13 },
        { nombre: 'Estadio', linea: 'B', lat: 6.2510, lng: -75.5906, comuna: 11 },
        { nombre: 'Santo Domingo', linea: 'K', lat: 6.2900, lng: -75.5370, comuna: 1 },
        { nombre: 'Acevedo', linea: 'A', lat: 6.2995, lng: -75.5566, comuna: 2 }
      ]
    };
  }

  function getStationsByComuna(comunaId) {
    if (!metroData) return [];
    return metroData.estaciones.filter(s => s.comuna === comunaId);
  }

  function getLineColor(lineaId) {
    if (!metroData) return '#6C63FF';
    const linea = metroData.lineas.find(l => l.id === lineaId);
    return linea ? linea.color : '#6C63FF';
  }

  function getLineInfo(lineaId) {
    if (!metroData) return null;
    return metroData.lineas.find(l => l.id === lineaId);
  }

  function getNearestStation(lat, lng) {
    if (!metroData) return null;
    let nearest = null;
    let minDist = Infinity;

    for (const station of metroData.estaciones) {
      const dist = Math.sqrt(Math.pow(lat - station.lat, 2) + Math.pow(lng - station.lng, 2));
      if (dist < minDist) {
        minDist = dist;
        nearest = { ...station, distance: minDist };
      }
    }
    return nearest;
  }

  function getComunaConnectivity(comunaId) {
    const stations = getStationsByComuna(comunaId);
    const lines = [...new Set(stations.map(s => s.linea))];
    
    let score = 0;
    score += Math.min(stations.length * 15, 60); // up to 60 for stations count
    score += lines.length * 10; // 10 per unique line
    score = Math.min(score, 100);

    return {
      stations: stations.length,
      lines,
      score,
      label: score >= 70 ? 'Alta' : score >= 40 ? 'Media' : 'Baja'
    };
  }

  // Transport mode icons
  const MODE_ICONS = {
    metro: '🚇',
    cable: '🚡',
    tranvia: '🚊',
    brt: '🚌',
    bus: '🚍'
  };

  return { loadMetroData, getStationsByComuna, getLineColor, getLineInfo, getNearestStation, getComunaConnectivity, MODE_ICONS };
})();
