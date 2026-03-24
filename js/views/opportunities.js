/* ============================================================
   Opportunities View — Motor de Oportunidades
   Scoring algorithm for business suggestions
   ============================================================ */

const OpportunitiesView = (() => {

  const BUSINESS_TYPES = [
    { id: 'cafeteria', nombre: 'Cafetería de Especialidad', icon: '☕', keywords: ['café', 'gastronomía', 'turismo'] },
    { id: 'coworking', nombre: 'Coworking Creativo', icon: '💻', keywords: ['coworking', 'tecnología', 'creatividad'] },
    { id: 'galeria', nombre: 'Galería / Tienda Cultural', icon: '🎨', keywords: ['arte', 'cultura', 'artesanía'] },
    { id: 'experiencia', nombre: 'Experiencia Turística', icon: '🎭', keywords: ['turismo', 'tours', 'experiencia'] },
    { id: 'restaurante', nombre: 'Restaurante / Gastrobar', icon: '🍽️', keywords: ['gastronomía', 'comida', 'cocina'] },
    { id: 'hostal', nombre: 'Hostal / Hospedaje', icon: '🏨', keywords: ['alojamiento', 'turismo', 'hospedaje'] },
    { id: 'tienda_souvenir', nombre: 'Tienda de Souvenirs', icon: '🛍️', keywords: ['artesanía', 'recuerdos', 'turismo'] },
    { id: 'wellness', nombre: 'Centro Wellness / Spa', icon: '🧘', keywords: ['bienestar', 'salud', 'relajación'] }
  ];

  function calculateOpportunities() {
    const comunas = GeoDataService.getAllComunas();
    const opportunities = [];

    comunas.forEach(comuna => {
      const security = SecurityService.getByComuna(comuna.id);
      const services = GeoDataService.getServicesByComuna(comuna.id);
      const connectivity = TransportService.getComunaConnectivity(comuna.id);

      BUSINESS_TYPES.forEach(biz => {
        const score = calculateScore(comuna, security, services, connectivity, biz);
        if (score >= 40) {
          opportunities.push({
            comuna: comuna.nombre,
            comunaId: comuna.id,
            negocio: biz,
            score: Math.round(score),
            razon: generateReason(comuna, security, services, connectivity, biz, score),
            metrics: {
              demandaTuristica: comuna.turistico.demanda,
              deficit: comuna.turistico.demanda - comuna.turistico.oferta,
              seguridad: security.score,
              conectividad: connectivity.score
            }
          });
        }
      });
    });

    // Sort by score descending
    return opportunities.sort((a, b) => b.score - a.score);
  }

  function calculateScore(comuna, security, services, connectivity, biz) {
    const demandaTuristica = comuna.turistico.demanda / 100;
    const deficit = Math.max(0, comuna.turistico.demanda - comuna.turistico.oferta) / 100;
    const densidad = Math.min(comuna.poblacion / (comuna.area_km2 * 50000), 1);
    const seguridad = security.score / 100;
    const conectividad = connectivity.score / 100;
    const servicios = services.score / 100;

    // Base score
    let score = (
      demandaTuristica * 25 +
      deficit * 30 +
      densidad * 10 +
      seguridad * 10 +
      conectividad * 15 +
      servicios * 10
    );

    // Business-specific bonuses
    if (biz.id === 'cafeteria' && comuna.turistico.tipo.some(t => t.includes('gastronomía') || t.includes('café'))) score += 8;
    if (biz.id === 'coworking' && comuna.turistico.tipo.some(t => t.includes('universitaria') || t.includes('creativ'))) score += 10;
    if (biz.id === 'galeria' && comuna.turistico.tipo.some(t => t.includes('arte') || t.includes('cultur'))) score += 10;
    if (biz.id === 'experiencia' && comuna.turistico.tipo.some(t => t.includes('turismo') || t.includes('tour'))) score += 8;
    if (biz.id === 'restaurante' && comuna.turistico.demanda > 60) score += 6;
    if (biz.id === 'hostal' && comuna.turistico.demanda > 70) score += 8;

    // Penalize low security
    if (security.score < 40) score -= 10;

    return Math.min(Math.max(score, 0), 100);
  }

  function generateReason(comuna, security, services, connectivity, biz, score) {
    const reasons = [];
    const deficit = comuna.turistico.demanda - comuna.turistico.oferta;

    if (deficit > 30) reasons.push(`Déficit de oferta del ${deficit}% frente a la demanda turística`);
    if (comuna.turistico.demanda > 70) reasons.push(`Alta demanda turística (${comuna.turistico.demanda}%)`);
    if (connectivity.score > 60) reasons.push(`Buena conectividad con ${connectivity.stations} estaciones de transporte`);
    if (security.score > 60) reasons.push(`Zona segura (${security.score}/100)`);
    if (comuna.poblacion > 150000) reasons.push(`Alta densidad poblacional (${comuna.poblacion.toLocaleString()} hab.)`);

    if (biz.id === 'cafeteria') reasons.push('Creciente cultura del café de especialidad en Medellín');
    if (biz.id === 'coworking') reasons.push('Auge del trabajo remoto y la economía digital');
    if (biz.id === 'galeria') reasons.push('Medellín es referente de arte urbano y economía naranja');
    if (biz.id === 'experiencia') reasons.push('Turismo experiencial en auge post-pandemia');

    return reasons.slice(0, 3).join('. ') + '.';
  }

  function getScoreColor(score) {
    if (score >= 75) return '#4caf50';
    if (score >= 60) return '#00D4AA';
    if (score >= 45) return '#FFA726';
    return '#FF6B6B';
  }

  async function render(container) {
    const opportunities = calculateOpportunities();
    
    // Update badge
    const badge = document.getElementById('opp-count');
    if (badge) badge.textContent = opportunities.length;

    container.innerHTML = `
      <div class="opportunities-view">
        <div class="flex-between mb-lg">
          <div>
            <h3 style="font-size:1.1rem;margin-bottom:4px">Motor de Oportunidades de Negocio</h3>
            <p class="text-sm text-muted">Análisis algorítmico de ${opportunities.length} oportunidades basado en datos reales</p>
          </div>
          <div class="flex gap-sm">
            <select class="select-modern" id="opp-filter" style="min-width:160px">
              <option value="all">Todos los tipos</option>
              ${BUSINESS_TYPES.map(b => `<option value="${b.id}">${b.icon} ${b.nombre}</option>`).join('')}
            </select>
            <select class="select-modern" id="opp-sort" style="min-width:140px">
              <option value="score">Mayor score</option>
              <option value="deficit">Mayor déficit</option>
              <option value="seguridad">Mayor seguridad</option>
            </select>
          </div>
        </div>

        <div class="opportunity-grid" id="opp-grid">
          ${renderCards(opportunities)}
        </div>
      </div>
    `;

    // Filters
    document.getElementById('opp-filter')?.addEventListener('change', () => applyFilters(opportunities));
    document.getElementById('opp-sort')?.addEventListener('change', () => applyFilters(opportunities));
  }

  function renderCards(opportunities) {
    return opportunities.slice(0, 24).map((opp, i) => `
      <div class="opportunity-card" style="animation-delay:${i * 0.05}s">
        <div class="opp-header">
          <span class="opp-type">${opp.negocio.icon}</span>
          <span class="opp-score" style="color:${getScoreColor(opp.score)}">${opp.score}</span>
        </div>
        <div class="opp-title">${opp.negocio.nombre}</div>
        <div class="opp-location">📍 ${opp.comuna} (Comuna ${opp.comunaId})</div>
        <div class="opp-reason">${opp.razon}</div>
        <div class="opp-metrics">
          <span class="opp-metric">📊 Demanda: <span>${opp.metrics.demandaTuristica}%</span></span>
          <span class="opp-metric">📉 Déficit: <span>${opp.metrics.deficit > 0 ? '+' : ''}${opp.metrics.deficit}%</span></span>
          <span class="opp-metric">🛡️ Seguridad: <span>${opp.metrics.seguridad}</span></span>
          <span class="opp-metric">🚇 Conexión: <span>${opp.metrics.conectividad}</span></span>
        </div>
        <div style="margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="App.navigateTo('map'); setTimeout(() => MapView.focusComuna(${opp.comunaId}), 500)">
            🗺️ Ver en mapa
          </button>
        </div>
      </div>
    `).join('');
  }

  function applyFilters(allOpportunities) {
    const filter = document.getElementById('opp-filter')?.value || 'all';
    const sort = document.getElementById('opp-sort')?.value || 'score';

    let filtered = [...allOpportunities];

    if (filter !== 'all') {
      filtered = filtered.filter(o => o.negocio.id === filter);
    }

    if (sort === 'deficit') {
      filtered.sort((a, b) => b.metrics.deficit - a.metrics.deficit);
    } else if (sort === 'seguridad') {
      filtered.sort((a, b) => b.metrics.seguridad - a.metrics.seguridad);
    } else {
      filtered.sort((a, b) => b.score - a.score);
    }

    const grid = document.getElementById('opp-grid');
    if (grid) grid.innerHTML = renderCards(filtered);
  }

  function destroy() {}

  return { render, destroy };
})();
