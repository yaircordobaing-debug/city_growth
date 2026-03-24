/* ============================================================
   Reports View — Participación Ciudadana
   Create, view, and filter citizen reports
   ============================================================ */

const ReportsView = (() => {

  let miniMap = null;
  let reportMarker = null;
  let selectedLocation = null;

  async function render(container) {
    // Seed demo data if empty
    ReportsService.seedSampleReports();
    
    // Update badge
    const badge = document.getElementById('report-count');
    if (badge) badge.textContent = ReportsService.getCount();

    const reports = ReportsService.getAll();

    container.innerHTML = `
      <div class="reports-view">
        <div class="flex-between mb-lg">
          <div>
            <h3 style="font-size:1.1rem;margin-bottom:4px">Participación Ciudadana</h3>
            <p class="text-sm text-muted">Reporta necesidades, oportunidades y problemas en tu zona</p>
          </div>
          <button class="btn btn-primary" id="btn-new-report">
            ➕ Nuevo Reporte
          </button>
        </div>

        <!-- Filters -->
        <div class="flex gap-sm mb-lg" style="flex-wrap:wrap">
          <button class="layer-toggle active" data-report-filter="all">📋 Todos (${reports.length})</button>
          ${Object.entries(ReportsService.REPORT_TYPES).map(([key, val]) => {
            const count = reports.filter(r => r.tipo === key).length;
            return `<button class="layer-toggle" data-report-filter="${key}">${val.icon} ${val.label} (${count})</button>`;
          }).join('')}
        </div>

        <!-- Reports List -->
        <div class="reports-list" id="reports-list">
          ${renderReportsList(reports)}
        </div>

        <!-- New Report Form (hidden) -->
        <div id="report-form-container" style="display:none">
          <div class="glass-card" style="margin-top:24px">
            <h3 style="margin-bottom:16px">📝 Nuevo Reporte</h3>
            
            <div class="form-group">
              <label class="form-label">Tipo de reporte</label>
              <select class="form-select" id="report-type">
                ${Object.entries(ReportsService.REPORT_TYPES).map(([key, val]) => 
                  `<option value="${key}">${val.icon} ${val.label}</option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Categoría</label>
              <select class="form-select" id="report-category">
                ${Object.entries(ReportsService.CATEGORIES).map(([key, val]) => 
                  `<option value="${key}">${val}</option>`
                ).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Descripción</label>
              <textarea class="form-textarea" id="report-description" rows="3" placeholder="Describe la situación, necesidad u oportunidad..."></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">Comuna</label>
              <select class="form-select" id="report-comuna">
                <option value="">Seleccionar comuna...</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">📍 Ubicación (haz clic en el mapa)</label>
              <div id="report-map" style="height:250px;border-radius:12px;border:1px solid var(--border-subtle);margin-top:8px"></div>
              <p class="text-xs text-muted mt-md" id="report-coords">Haz clic en el mapa para seleccionar ubicación</p>
            </div>

            <div style="display:flex;gap:8px;justify-content:flex-end">
              <button class="btn btn-secondary" id="btn-cancel-report">Cancelar</button>
              <button class="btn btn-primary" id="btn-submit-report">📤 Enviar Reporte</button>
            </div>
          </div>
        </div>
      </div>
    `;

    setupEventListeners();
    populateComunaSelector();
  }

  function renderReportsList(reports) {
    if (reports.length === 0) {
      return `
        <div class="empty-state">
          <div class="empty-icon">📢</div>
          <h3>Sin reportes aún</h3>
          <p>Sé el primero en reportar una necesidad u oportunidad en tu zona.</p>
        </div>
      `;
    }

    return reports.map(r => {
      const typeInfo = ReportsService.REPORT_TYPES[r.tipo] || { icon: '📍', label: 'Reporte', color: '#6C63FF' };
      const catLabel = ReportsService.CATEGORIES[r.categoria] || r.categoria;
      return `
        <div class="report-item">
          <div class="report-icon" style="background:${typeInfo.color}22;color:${typeInfo.color}">${typeInfo.icon}</div>
          <div class="report-content">
            <h4>${typeInfo.label} — ${catLabel}</h4>
            <p>${r.descripcion}</p>
            <div class="report-meta">
              <span>📍 ${r.comuna || 'Sin comuna'}</span>
              <span>📅 ${r.fecha}</span>
              <span>🆔 ${r.id.substring(0, 8)}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="ReportsView.deleteReport('${r.id}')" title="Eliminar">🗑️</button>
        </div>
      `;
    }).join('');
  }

  async function populateComunaSelector() {
    const comunas = await GeoDataService.loadComunas();
    const selector = document.getElementById('report-comuna');
    if (!selector) return;
    comunas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.nombre;
      opt.textContent = `${c.id}. ${c.nombre}`;
      selector.appendChild(opt);
    });
  }

  function setupEventListeners() {
    // New report button
    document.getElementById('btn-new-report')?.addEventListener('click', () => {
      document.getElementById('report-form-container').style.display = 'block';
      document.getElementById('btn-new-report').style.display = 'none';
      initMiniMap();
    });

    // Cancel
    document.getElementById('btn-cancel-report')?.addEventListener('click', () => {
      document.getElementById('report-form-container').style.display = 'none';
      document.getElementById('btn-new-report').style.display = '';
      if (miniMap) { miniMap.remove(); miniMap = null; }
    });

    // Submit
    document.getElementById('btn-submit-report')?.addEventListener('click', submitReport);

    // Filters
    document.querySelectorAll('[data-report-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-report-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.reportFilter;
        const reports = filter === 'all' ? ReportsService.getAll() : ReportsService.getByType(filter);
        document.getElementById('reports-list').innerHTML = renderReportsList(reports);
      });
    });
  }

  function initMiniMap() {
    if (miniMap) { miniMap.remove(); miniMap = null; }

    setTimeout(() => {
      miniMap = L.map('report-map', {
        center: [6.2442, -75.5812],
        zoom: 12,
        zoomControl: true
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(miniMap);

      miniMap.on('click', (e) => {
        selectedLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
        if (reportMarker) {
          reportMarker.setLatLng(e.latlng);
        } else {
          reportMarker = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'report-pin',
              html: '<div style="background:#6C63FF;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
          }).addTo(miniMap);
        }
        document.getElementById('report-coords').textContent = 
          `📍 Ubicación: ${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;
      });
    }, 200);
  }

  function submitReport() {
    const tipo = document.getElementById('report-type')?.value;
    const categoria = document.getElementById('report-category')?.value;
    const descripcion = document.getElementById('report-description')?.value;
    const comuna = document.getElementById('report-comuna')?.value;

    if (!descripcion?.trim()) {
      alert('Por favor ingresa una descripción');
      return;
    }

    if (!selectedLocation) {
      alert('Por favor selecciona una ubicación en el mapa');
      return;
    }

    const report = ReportsService.add({
      tipo,
      categoria,
      descripcion: descripcion.trim(),
      ubicacion: selectedLocation,
      comuna
    });

    console.log('✅ Report created:', report.id);

    // Reset form
    selectedLocation = null;
    if (miniMap) { miniMap.remove(); miniMap = null; }
    reportMarker = null;

    // Re-render
    const container = document.getElementById('view-container');
    render(container);
  }

  function deleteReport(id) {
    if (confirm('¿Eliminar este reporte?')) {
      ReportsService.remove(id);
      const container = document.getElementById('view-container');
      render(container);
    }
  }

  function destroy() {
    if (miniMap) { miniMap.remove(); miniMap = null; }
    reportMarker = null;
    selectedLocation = null;
  }

  return { render, destroy, deleteReport };
})();
