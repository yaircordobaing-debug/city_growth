/* ============================================================
   AirQuality Service — SIATA Integration
   Fetches PM2.5 + contaminant data from SIATA endpoints
   ============================================================ */

const AirQualityService = (() => {
  const ENDPOINTS = {
    pm25: 'https://siata.gov.co/EntregaData1/Datos_SIATA_Aire_pm25.json',
    co: 'https://datosabiertos.metropol.gov.co/sites/default/files/uploaded_resources/Datos_SIATA_Aire_co.json',
    no2: 'https://datosabiertos.metropol.gov.co/sites/default/files/uploaded_resources/Datos_SIATA_Aire_no2.json',
    so2: 'https://datosabiertos.metropol.gov.co/sites/default/files/uploaded_resources/Datos_SIATA_Aire_so2.json',
    ozono: 'https://datosabiertos.metropol.gov.co/sites/default/files/uploaded_resources/Datos_SIATA_Aire_ozono.json'
  };

  // SIATA monitoring stations mapped to approximate comunas
  const STATION_COMUNAS = {
    'MED-UNNV': { comuna: 7, nombre: 'Universidad Nacional', lat: 6.2633, lng: -75.5766 },
    'MED-PJIC': { comuna: 10, nombre: 'Politécnico Jaime Isaza', lat: 6.2544, lng: -75.5644 },
    'MED-EXSA': { comuna: 14, nombre: 'Éxito San Antonio', lat: 6.2477, lng: -75.5696 },
    'MED-MANT': { comuna: 3, nombre: 'Manrique', lat: 6.2750, lng: -75.5370 },
    'MED-ARAN': { comuna: 4, nombre: 'Aranjuez', lat: 6.2750, lng: -75.5550 },
    'MED-BELN': { comuna: 16, nombre: 'Belén', lat: 6.2340, lng: -75.6000 },
    'MED-POBL': { comuna: 14, nombre: 'El Poblado', lat: 6.2100, lng: -75.5700 },
    'MED-CAME': { comuna: 10, nombre: 'La Candelaria', lat: 6.2518, lng: -75.5636 },
    'MED-CAST': { comuna: 5, nombre: 'Castilla', lat: 6.2760, lng: -75.5730 }
  };

  // AQI breakpoints for PM2.5 (μg/m³) — EPA standard
  const AQI_BREAKPOINTS = [
    { lo: 0, hi: 12, aqiLo: 0, aqiHi: 50, label: 'Buena', color: '#4caf50', emoji: '🟢' },
    { lo: 12.1, hi: 35.4, aqiLo: 51, aqiHi: 100, label: 'Moderada', color: '#ffeb3b', emoji: '🟡' },
    { lo: 35.5, hi: 55.4, aqiLo: 101, aqiHi: 150, label: 'Dañina (sensibles)', color: '#ff9800', emoji: '🟠' },
    { lo: 55.5, hi: 150.4, aqiLo: 151, aqiHi: 200, label: 'Dañina', color: '#f44336', emoji: '🔴' },
    { lo: 150.5, hi: 250.4, aqiLo: 201, aqiHi: 300, label: 'Muy dañina', color: '#9c27b0', emoji: '🟣' },
    { lo: 250.5, hi: 500, aqiLo: 301, aqiHi: 500, label: 'Peligrosa', color: '#7f0000', emoji: '⚫' }
  ];

  function calculateAQI(pm25) {
    if (pm25 < 0) return { aqi: 0, label: 'Sin datos', color: '#666', emoji: '⚪' };
    for (const bp of AQI_BREAKPOINTS) {
      if (pm25 >= bp.lo && pm25 <= bp.hi) {
        const aqi = Math.round(((bp.aqiHi - bp.aqiLo) / (bp.hi - bp.lo)) * (pm25 - bp.lo) + bp.aqiLo);
        return { aqi, label: bp.label, color: bp.color, emoji: bp.emoji };
      }
    }
    return { aqi: 500, label: 'Peligrosa', color: '#7f0000', emoji: '⚫' };
  }

  // Fallback data based on typical Medellín readings
  function getFallbackData() {
    const stations = [];
    const basePM25 = { 1: 22, 2: 20, 3: 24, 4: 19, 5: 18, 6: 23, 7: 15, 8: 25, 9: 21, 10: 28, 11: 14, 12: 16, 13: 20, 14: 12, 15: 17, 16: 16 };
    
    for (const [code, info] of Object.entries(STATION_COMUNAS)) {
      const pm25 = basePM25[info.comuna] + (Math.random() * 8 - 4);
      const aqiResult = calculateAQI(pm25);
      stations.push({
        code,
        nombre: info.nombre,
        comuna: info.comuna,
        lat: info.lat,
        lng: info.lng,
        pm25: Math.round(pm25 * 10) / 10,
        ...aqiResult,
        timestamp: new Date().toISOString(),
        source: 'fallback'
      });
    }
    return stations;
  }

  async function fetchPM25() {
    try {
      const response = await fetch(ENDPOINTS.pm25, { 
        signal: AbortSignal.timeout(8000),
        mode: 'cors'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      // Parse SIATA format and map to stations
      const stations = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          const code = item.codigoEstacion || item.codigo || item.station;
          const stationInfo = STATION_COMUNAS[code];
          if (stationInfo) {
            const pm25 = parseFloat(item.valor || item.pm25 || item.value || 0);
            const aqiResult = calculateAQI(pm25);
            stations.push({
              code,
              nombre: stationInfo.nombre,
              comuna: stationInfo.comuna,
              lat: stationInfo.lat,
              lng: stationInfo.lng,
              pm25: Math.round(pm25 * 10) / 10,
              ...aqiResult,
              timestamp: item.fecha || new Date().toISOString(),
              source: 'siata'
            });
          }
        }
      }
      
      return stations.length > 0 ? stations : getFallbackData();
    } catch (err) {
      console.warn('SIATA API unavailable, using fallback data:', err.message);
      return getFallbackData();
    }
  }

  function getAverageAQI(stations) {
    if (!stations.length) return { aqi: 0, label: 'Sin datos', color: '#666', emoji: '⚪' };
    const avgPM25 = stations.reduce((sum, s) => sum + s.pm25, 0) / stations.length;
    return { ...calculateAQI(avgPM25), avgPM25: Math.round(avgPM25 * 10) / 10 };
  }

  function getAQIByComuna(stations, comunaId) {
    const comunaStations = stations.filter(s => s.comuna === comunaId);
    if (comunaStations.length === 0) {
      // Estimate from nearest station or overall average
      const avgAll = getAverageAQI(stations);
      return { ...avgAll, estimated: true };
    }
    return { ...getAverageAQI(comunaStations), estimated: false };
  }

  return { fetchPM25, getAverageAQI, getAQIByComuna, calculateAQI, ENDPOINTS };
})();
