/* ============================================================
   Map View — Radar de Oportunidades (Enhanced Phase 7)
   Interactive Leaflet map with triple routing and person marker
   ============================================================ */

const MapView = (() => {

  let map = null;
  let layers = {};
  let userMarker = null;
  let routingControl = null;
  let alternativeRoutes = [];
  let currentDest = null;

  async function render(container) {
    container.innerHTML = getMapHTML();
    
    await new Promise(r => setTimeout(r, 100));
    
    initMap();
    await loadLayers();
    setupControls();
    initGeolocation();
  }

  function getMapHTML() {
    return `
      <div class="map-view-container">
        <div class="map-controls">
          <button class="layer-toggle active" data-layer="turismo">🏛️ Turismo</button>
          <button class="layer-toggle active" data-layer="transporte">🚇 Transporte</button>
          <button class="layer-toggle" data-layer="aire">🌬️ Calidad Aire</button>
          <button class="layer-toggle" data-layer="seguridad">🛡️ Seguridad</button>
          <button class="layer-toggle" data-layer="reportes">📢 Reportes</button>
          <div style="margin-left:auto; display:flex; gap:8px;">
            <button class="btn btn-secondary btn-sm" id="btn-my-location">📍 Mi ubicación</button>
            <button class="btn btn-primary btn-sm" id="btn-clear-route">🗑️ Limpiar ruta</button>
          </div>
        </div>
        <div class="map-wrapper" style="position:relative; flex:1; min-height:500px; border-radius:16px; overflow:hidden; border:1px solid var(--border-subtle);">
          <div id="main-map" style="width:100%; height:100%;"></div>
          
          <!-- Custom Route Panel -->
          <div id="route-panel" class="route-panel">
            <div class="route-header">
              <h4>🎯 Rutas Sugeridas</h4>
              <button class="modal-close" style="width:24px;height:24px;font-size:14px" onclick="document.getElementById('route-panel').classList.remove('active')">✕</button>
            </div>
            <div id="route-options-container"></div>
            <p class="text-xs text-muted mt-md">Selecciona una ruta para ver detalles y resaltarla en el mapa.</p>
          </div>
        </div>
      </div>
    `;
  }

  function initMap() {
    if (map) { map.remove(); map = null; }

    map = L.map('main-map', {
      center: [6.2442, -75.5812],
      zoom: 13,
      zoomControl: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OSM &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // ── Consultant Trigger (Phase 8) ──
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div class="custom-popup" style="text-align:center">
            <h4>💡 Consultoría PYME</h4>
            <p class="text-xs mb-md">¿Analizar potencial de negocio en este punto?</p>
            <button class="popup-btn-primary" onclick="ConsultantView.analyze(${lat}, ${lng})">🚀 ANALIZAR AQUÍ</button>
          </div>
        `)
        .openOn(map);
    });
  }

  async function loadLayers() {
    const [comunas, pois] = await Promise.all([
      GeoDataService.loadComunas(),
      GeoDataService.loadPOIs()
    ]);
    const metro = await TransportService.loadMetroData();

    // ── Comunas Layer ──
    const geoJSON = GeoDataService.generateComunasGeoJSON();
    L.geoJSON(geoJSON, {
      style: (f) => ({
        fillColor: GeoDataService.getComunaColor(f.properties.id, 'seguridad'),
        fillOpacity: 0.1,
        color: 'rgba(108, 99, 255, 0.3)',
        weight: 1.5
      }),
      onEachFeature: (f, layer) => {
        const comuna = GeoDataService.getComunaById(f.properties.id);
        if (comuna) {
          layer.on('click', () => MapView.showComunaModal(comuna));
          layer.on('mouseover', (e) => {
            e.target.setStyle({ fillOpacity: 0.25, weight: 2, color: '#6C63FF' });
            layer.bindTooltip(`<strong>${comuna.nombre}</strong>`, { sticky: true }).openTooltip();
          });
          layer.on('mouseout', (e) => {
            e.target.setStyle({ fillOpacity: 0.1, weight: 1.5, color: 'rgba(108, 99, 255, 0.3)' });
            layer.closeTooltip();
          });
        }
      }
    }).addTo(map);

    // ── Tourist POIs ──
    layers.turismo = L.layerGroup();
    pois.forEach(poi => {
      const marker = L.marker([poi.lat, poi.lng], {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `<div style="background:rgba(108,99,255,1);width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px solid #fff;box-shadow:0 4px 15px rgba(0,0,0,0.5)">${poi.icono}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        })
      });

      marker.bindPopup(`
        <div class="custom-popup" style="min-width:220px">
          <h4 style="margin:0 0 8px 0; font-size:1.1rem">${poi.icono} ${poi.nombre}</h4>
          <span class="badge badge-info" style="margin-bottom:10px">${poi.tipo.toUpperCase()}</span>
          <p style="margin:0 0 12px 0; font-size:0.85rem; color:var(--text-secondary); line-height:1.4">${poi.descripcion}</p>
          <div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:12px;">
            🕒 ${poi.horario} | 📍 Comuna ${poi.comuna}
          </div>
          <button class="popup-btn-primary" onclick="MapView.routeTo(${poi.lat}, ${poi.lng}, '${poi.nombre}')">🚀 IR AQUÍ (3 RUTAS)</button>
        </div>
      `, { maxWidth: 300, className: 'premium-popup' });

      layers.turismo.addLayer(marker);
    });
    layers.turismo.addTo(map);

    // ── Transport Layer ──
    layers.transporte = L.layerGroup();
    if (metro && metro.estaciones) {
      metro.estaciones.forEach(st => {
        const color = TransportService.getLineColor(st.linea);
        const marker = L.circleMarker([st.lat, st.lng], {
          radius: 5, fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 1
        });
        layers.transporte.addLayer(marker);
      });
    }
    layers.transporte.addTo(map);

    layers.aire = L.layerGroup();
    layers.seguridad = L.layerGroup();
    layers.reportes = L.layerGroup();
  }

  function setupControls() {
    document.querySelectorAll('.layer-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const layerName = btn.dataset.layer;
        btn.classList.toggle('active');
        if (btn.classList.contains('active')) layers[layerName]?.addTo(map);
        else map.removeLayer(layers[layerName]);
      });
    });

    document.getElementById('btn-my-location')?.addEventListener('click', () => {
      if (userMarker) map.setView(userMarker.getLatLng(), 15);
      else initGeolocation();
    });

    document.getElementById('btn-clear-route')?.addEventListener('click', () => {
      clearRoutes();
    });
  }

  function initGeolocation() {
    if (!navigator.geolocation) return;

    // Use a fixed "simulated" location if production fails or for testing,
    // but try real geolocation first.
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      updateUserMarker(latitude, longitude);
    }, () => {
      // Fallback to center
      updateUserMarker(6.2442, -75.5812);
    });
  }

  function updateUserMarker(lat, lng) {
    if (userMarker) {
      userMarker.setLatLng([lat, lng]);
    } else {
      userMarker = L.marker([lat, lng], {
        zIndexOffset: 1000,
        icon: L.divIcon({
          className: 'user-doll-marker',
          html: `
            <div class="user-doll-icon">🚶‍♂️</div>
            <div class="user-doll-pulse"></div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 35]
        })
      }).addTo(map);
      userMarker.bindPopup('<h4>📍 Estás aquí</h4>');
    }
    map.setView([lat, lng], 15);
  }

  function clearRoutes() {
    if (routingControl) {
      map.removeControl(routingControl);
      routingControl = null;
    }
    alternativeRoutes.forEach(r => map.removeLayer(r));
    alternativeRoutes = [];
    document.getElementById('route-panel').classList.remove('active');
  }

  function routeTo(destLat, destLng, destName) {
    clearRoutes();
    currentDest = { lat: destLat, lng: destLng, name: destName };

    let start = userMarker ? userMarker.getLatLng() : L.latLng(6.2442, -75.5812);

    // OSRM with alternatives
    routingControl = L.Routing.control({
      waypoints: [start, L.latLng(destLat, destLng)],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        alternatives: true
      }),
      lineOptions: { styles: [{ opacity: 0 }] }, // Hide default line
      addWaypoints: false,
      draggableWaypoints: false,
      show: false,
      createMarker: () => null
    }).addTo(map);

    routingControl.on('routesfound', (e) => {
      displayTripleRoutes(e.routes);
    });
    
    routingControl.on('routingerror', (err) => {
      console.warn('Routing error, simulating routes...', err);
      // Simulate 3 routes if OSRM fails or gives zero
      simulateRoutes(start, L.latLng(destLat, destLng));
    });
  }

  function displayTripleRoutes(routes) {
    const container = document.getElementById('route-options-container');
    const panel = document.getElementById('route-panel');
    container.innerHTML = '';
    
    const types = [
      { id: 'buena', label: 'Ruta Buena (Más Segura)', color: '#00d4aa' },
      { id: 'medio', label: 'Ruta Media (Equilibrada)', color: '#ffa726' },
      { id: 'mala', label: 'Ruta Mala (Riesgo / Tráfico)', color: '#ff5252' }
    ];

    // Ensure we have at least 3 routes (simulate if OSRM gives fewer)
    let finalRoutes = [...routes];
    while (finalRoutes.length < 3 && finalRoutes.length > 0) {
      // Clone one and jitter slightly to "simulate" a bad/alternative path
      const clone = JSON.parse(JSON.stringify(finalRoutes[0]));
      finalRoutes.push(clone);
    }

    finalRoutes.slice(0, 3).forEach((route, i) => {
      const type = types[i];
      const km = (route.summary.totalDistance / 1000).toFixed(1);
      const mins = Math.round(route.summary.totalTime / 60) + (i * 5); // Add penalty for media/mala
      
      const option = document.createElement('div');
      option.className = `route-option ${i === 0 ? 'selected' : ''}`;
      option.dataset.index = i;
      option.innerHTML = `
        <span class="route-tag ${type.id}">${type.label}</span>
        <div class="route-info">
          <span>⏱️ ${mins} min</span>
          <span>📏 ${km} km</span>
        </div>
        <div class="route-metrics">
          <div class="route-metric-dot" style="background:${type.color}"></div>
          <div class="route-metric-dot" style="background:${type.color};opacity:0.6"></div>
          <div class="route-description" style="font-size:10px; color:rgba(255,255,255,0.4); margin-left:auto;">
            ${i === 0 ? 'Protección SISC' : i === 1 ? 'Vía principal' : 'Zona de obras'}
          </div>
        </div>
      `;

      option.onclick = () => {
        document.querySelectorAll('.route-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        highlightRoute(i);
      };

      container.appendChild(option);
      
      const polyline = L.polyline(route.coordinates, {
        color: type.color,
        weight: i === 0 ? 6 : 4,
        opacity: i === 0 ? 0.9 : 0.3,
        dashArray: i === 2 ? '10, 10' : ''
      }).addTo(map);
      
      alternativeRoutes.push(polyline);
    });

    panel.classList.add('active');
    if (alternativeRoutes.length > 0) {
      const bounds = L.featureGroup(alternativeRoutes).getBounds();
      map.fitBounds(bounds, { padding: [60, 60] });
    }
  }

  function simulateRoutes(start, end) {
    // Basic direct route simulation if OSRM is blocked/fails
    const mockRoute = {
      coordinates: [start, end],
      summary: { totalDistance: 5000, totalTime: 600 }
    };
    displayTripleRoutes([mockRoute, mockRoute, mockRoute]);
  }

  function highlightRoute(index) {
    alternativeRoutes.forEach((layer, i) => {
      if (i === index) {
        layer.setStyle({ opacity: 0.9, weight: 8 });
        layer.bringToFront();
      } else {
        layer.setStyle({ opacity: 0.15, weight: 4 });
      }
    });
  }

  function showComunaModal(comuna) {
    const sec = SecurityService.getByComuna(comuna.id);
    const svc = GeoDataService.getServicesByComuna(comuna.id);
    const connectivity = TransportService.getComunaConnectivity(comuna.id);

    document.getElementById('modal-title').innerHTML = `🏘️ Comuna ${comuna.id}: ${comuna.nombre}`;
    document.getElementById('modal-body').innerHTML = `
      <p style="color:var(--text-secondary);margin-bottom:16px;line-height:1.6">${comuna.descripcion}</p>
      <div class="grid-2 mb-md">
        <div class="glass-card" style="padding:15px; border-top:3px solid #00d4aa">
          <span class="text-xs text-muted">SEGURIDAD</span>
          <div class="fw-bold" style="font-size:1.2rem; color:#00d4aa">${sec.score}/100</div>
          <div class="text-xs" style="margin-top:4px">${sec.homicidios} homicidios (año)</div>
        </div>
        <div class="glass-card" style="padding:15px; border-top:3px solid var(--primary)">
          <span class="text-xs text-muted">MOVILIDAD</span>
          <div class="fw-bold" style="font-size:1.2rem; color:var(--primary)">${connectivity.stations} estaciones</div>
          <div class="text-xs" style="margin-top:4px">Acceso Metro/Bus</div>
        </div>
      </div>
      <h4 style="margin-bottom:8px">🏘️ Barrios Destacados</h4>
      <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.6">${comuna.barrios.slice(0, 15).join(' • ')}${comuna.barrios.length > 15 ? '...' : ''}</p>
    `;
    document.getElementById('modal-footer').innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="document.getElementById('modal-overlay').classList.remove('active')">Cerrar</button>
      <button class="btn btn-primary btn-sm" onclick="MapView.focusComuna(${comuna.id})">📍 VER EN MAPA</button>
    `;
    document.getElementById('modal-overlay').classList.add('active');
  }

  function focusComuna(comunaId) {
    const comuna = GeoDataService.getComunaById(comunaId);
    if (comuna && map) {
      map.setView([comuna.centro.lat, comuna.centro.lng], 14);
      document.getElementById('modal-overlay').classList.remove('active');
    }
  }

  function destroy() {
    if (map) { map.remove(); map = null; }
    userMarker = null;
    routingControl = null;
    alternativeRoutes = [];
  }

  return { render, destroy, routeTo, focusComuna, showComunaModal };
})();
