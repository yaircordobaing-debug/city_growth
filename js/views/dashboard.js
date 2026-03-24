/* ============================================================
   Dashboard View — Vista Panorama
   KPIs, Charts, Insights, Comuna Selector
   ============================================================ */

const DashboardView = (() => {

  let charts = {};
  let airData = [];
  let currentComuna = null; // null = all city

  async function render(container) {
    container.innerHTML = getDashboardHTML();
    await loadData();
    setupEventListeners();
    renderCharts();
    renderInsights();
  }

  function getDashboardHTML() {
    return `
      <div class="dashboard-view">
        <!-- Controls -->
        <div class="flex-between mb-lg">
          <div class="select-wrapper">
            <select class="select-modern" id="comuna-selector">
              <option value="all">🏙️ Toda Medellín</option>
            </select>
          </div>
          <div class="flex gap-sm">
            <button class="btn btn-secondary btn-sm" id="refresh-data">
              🔄 Actualizar datos
            </button>
          </div>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid" id="kpi-grid">
          <div class="kpi-card air">
            <div class="kpi-header">
              <div class="kpi-icon">🌬️</div>
              <span class="kpi-label">Calidad del Aire</span>
            </div>
            <div class="kpi-value" id="kpi-air">--</div>
            <div class="kpi-trend stable" id="kpi-air-trend">
              <span>Cargando...</span>
            </div>
            <div class="kpi-bar"><div class="kpi-bar-fill" id="kpi-air-bar" style="width:0%"></div></div>
          </div>
          <div class="kpi-card mobility">
            <div class="kpi-header">
              <div class="kpi-icon">🚇</div>
              <span class="kpi-label">Movilidad</span>
            </div>
            <div class="kpi-value" id="kpi-mobility">--</div>
            <div class="kpi-trend stable" id="kpi-mobility-trend">
              <span>Cargando...</span>
            </div>
            <div class="kpi-bar"><div class="kpi-bar-fill" id="kpi-mobility-bar" style="width:0%"></div></div>
          </div>
          <div class="kpi-card security">
            <div class="kpi-header">
              <div class="kpi-icon">🛡️</div>
              <span class="kpi-label">Seguridad</span>
            </div>
            <div class="kpi-value" id="kpi-security">--</div>
            <div class="kpi-trend stable" id="kpi-security-trend">
              <span>Cargando...</span>
            </div>
            <div class="kpi-bar"><div class="kpi-bar-fill" id="kpi-security-bar" style="width:0%"></div></div>
          </div>
          <div class="kpi-card services">
            <div class="kpi-header">
              <div class="kpi-icon">⚡</div>
              <span class="kpi-label">Servicios Públicos</span>
            </div>
            <div class="kpi-value" id="kpi-services">--</div>
            <div class="kpi-trend stable" id="kpi-services-trend">
              <span>Cargando...</span>
            </div>
            <div class="kpi-bar"><div class="kpi-bar-fill" id="kpi-services-bar" style="width:0%"></div></div>
          </div>
        </div>

        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-card">
            <h3>📊 Calidad del Aire por Comuna</h3>
            <div class="chart-container">
              <canvas id="chart-air"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3>🎯 Perfil de Comuna</h3>
            <div class="chart-container">
              <canvas id="chart-radar"></canvas>
            </div>
          </div>
          <div class="chart-card">
            <h3>📈 Indicadores Comparativos</h3>
            <div class="chart-container">
              <canvas id="chart-comparative"></canvas>
            </div>
          </div>
        </div>

        <!-- Insights -->
        <div class="insights-section">
          <h3>💡 Insights Automáticos</h3>
          <div id="insights-container"></div>
        </div>
      </div>
    `;
  }

  async function loadData() {
    const comunas = await GeoDataService.loadComunas();
    
    // Populate selector
    const selector = document.getElementById('comuna-selector');
    comunas.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.id}. ${c.nombre}`;
      selector.appendChild(opt);
    });

    // Fetch air quality data
    airData = await AirQualityService.fetchPM25();
    
    // Fetch security data
    await SecurityService.fetchSecurityData();

    // Load transport data
    await TransportService.loadMetroData();

    // Update KPIs
    updateKPIs();
  }

  function updateKPIs(comunaId = null) {
    const comunas = GeoDataService.getAllComunas();
    
    if (comunaId && comunaId !== 'all') {
      const id = parseInt(comunaId);
      const comuna = GeoDataService.getComunaById(id);
      if (!comuna) return;

      // Air Quality
      const airInfo = AirQualityService.getAQIByComuna(airData, id);
      setKPI('air', airInfo.aqi, airInfo.label, `${airInfo.emoji} PM2.5: ${airInfo.avgPM25 || '--'} μg/m³`, airInfo.aqi);
      
      // Mobility 
      const connectivity = TransportService.getComunaConnectivity(id);
      setKPI('mobility', `${connectivity.score}`, connectivity.label, `🚉 ${connectivity.stations} estaciones`, connectivity.score);

      // Security
      const security = SecurityService.getByComuna(id);
      const secTrend = security.tendencia === 'down' ? '↓ Mejorando' : security.tendencia === 'up' ? '↑ Empeorando' : '→ Estable';
      setKPI('security', security.score, SecurityService.getScoreLabel(security.score), secTrend, security.score);

      // Services
      const services = GeoDataService.getServicesByComuna(id);
      setKPI('services', `${services.score}%`, 'Cobertura', `⚡ ${services.energia}% energía | 💧 ${services.agua}% agua`, services.score);
    } else {
      // City-wide averages
      const avgAir = AirQualityService.getAverageAQI(airData);
      setKPI('air', avgAir.aqi, avgAir.label, `${avgAir.emoji} PM2.5 promedio: ${avgAir.avgPM25} μg/m³`, Math.min(avgAir.aqi, 100));

      const mobilityAvg = Math.round(comunas.reduce((s, c) => s + c.indicadores.movilidad, 0) / comunas.length);
      setKPI('mobility', mobilityAvg, mobilityAvg >= 70 ? 'Buena' : 'Moderada', '🚉 39 estaciones en el valle', mobilityAvg);

      const secAvg = SecurityService.getCityAverage();
      setKPI('security', secAvg.score, SecurityService.getScoreLabel(secAvg.score), `📊 ${secAvg.homicidios} homicidios (año)`, secAvg.score);

      const servAvg = Math.round(comunas.reduce((s, c) => s + c.indicadores.servicios, 0) / comunas.length);
      setKPI('services', `${servAvg}%`, 'Cobertura promedio', '⚡ EPM: cobertura energía >96%', servAvg);
    }
  }

  function setKPI(type, value, label, trendText, barPercent) {
    const el = document.getElementById(`kpi-${type}`);
    const trend = document.getElementById(`kpi-${type}-trend`);
    const bar = document.getElementById(`kpi-${type}-bar`);

    if (el) {
      el.textContent = value;
      el.style.animation = 'countUp 0.5s ease';
    }
    if (trend) trend.innerHTML = `<span>${trendText}</span>`;
    if (bar) bar.style.width = `${Math.min(barPercent, 100)}%`;
  }

  function setupEventListeners() {
    document.getElementById('comuna-selector')?.addEventListener('change', (e) => {
      currentComuna = e.target.value;
      updateKPIs(currentComuna);
      updateCharts(currentComuna);
      renderInsights();
      
      // Update header breadcrumb
      const name = currentComuna === 'all' ? 'Toda Medellín' : GeoDataService.getComunaById(parseInt(currentComuna))?.nombre;
      document.getElementById('view-breadcrumb').textContent = `Medellín → ${name || 'Vista Panorama'}`;
    });

    document.getElementById('refresh-data')?.addEventListener('click', async () => {
      const btn = document.getElementById('refresh-data');
      btn.textContent = '⏳ Actualizando...';
      btn.disabled = true;
      airData = await AirQualityService.fetchPM25();
      updateKPIs(currentComuna);
      updateCharts(currentComuna);
      renderInsights();
      btn.textContent = '🔄 Actualizar datos';
      btn.disabled = false;
    });
  }

  function renderCharts() {
    const comunas = GeoDataService.getAllComunas();
    if (!comunas.length) return;

    const labels = comunas.map(c => c.nombre);
    const airValues = comunas.map(c => c.indicadores.aqi);
    const secValues = comunas.map(c => SecurityService.getByComuna(c.id).score);
    const mobValues = comunas.map(c => c.indicadores.movilidad);
    const srvValues = comunas.map(c => c.indicadores.servicios);

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#ECEFF4', font: { family: 'Inter', size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#8b8fa3', font: { size: 9 }, maxRotation: 45 }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#8b8fa3' }, grid: { color: 'rgba(255,255,255,0.04)' } }
      }
    };

    // Bar chart — Air Quality
    const ctxAir = document.getElementById('chart-air');
    if (ctxAir) {
      charts.air = new Chart(ctxAir, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'AQI (PM2.5)',
            data: airValues,
            backgroundColor: airValues.map(v => v <= 30 ? 'rgba(76,175,80,0.7)' : v <= 50 ? 'rgba(255,235,59,0.7)' : v <= 70 ? 'rgba(255,152,0,0.7)' : 'rgba(244,67,54,0.7)'),
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: chartOptions
      });
    }

    // Radar chart — current comuna profile
    const ctxRadar = document.getElementById('chart-radar');
    if (ctxRadar) {
      const comuna = comunas[9]; // La Candelaria default
      charts.radar = new Chart(ctxRadar, {
        type: 'radar',
        data: {
          labels: ['Aire', 'Movilidad', 'Seguridad', 'Servicios', 'Turismo'],
          datasets: [{
            label: comuna.nombre,
            data: [
              100 - comuna.indicadores.aqi,
              comuna.indicadores.movilidad,
              SecurityService.getByComuna(comuna.id).score,
              comuna.indicadores.servicios,
              comuna.turistico.demanda
            ],
            backgroundColor: 'rgba(108, 99, 255, 0.2)',
            borderColor: '#6C63FF',
            pointBackgroundColor: '#6C63FF',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: { color: '#8b8fa3', backdropColor: 'transparent', font: { size: 10 } },
              grid: { color: 'rgba(255,255,255,0.06)' },
              pointLabels: { color: '#ECEFF4', font: { size: 11 } }
            }
          },
          plugins: { legend: { labels: { color: '#ECEFF4', font: { family: 'Inter' } } } }
        }
      });
    }

    // Comparative bar chart
    const ctxComp = document.getElementById('chart-comparative');
    if (ctxComp) {
      charts.comparative = new Chart(ctxComp, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Seguridad', data: secValues, backgroundColor: 'rgba(255, 107, 107, 0.6)', borderRadius: 4 },
            { label: 'Movilidad', data: mobValues, backgroundColor: 'rgba(0, 212, 170, 0.6)', borderRadius: 4 },
            { label: 'Servicios', data: srvValues, backgroundColor: 'rgba(171, 71, 188, 0.6)', borderRadius: 4 }
          ]
        },
        options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'top', labels: { color: '#ECEFF4', font: { family: 'Inter', size: 11 }, usePointStyle: true, pointStyle: 'circle' } } } }
      });
    }
  }

  function updateCharts(comunaId) {
    if (!charts.radar) return;
    const comunas = GeoDataService.getAllComunas();
    
    if (comunaId && comunaId !== 'all') {
      const id = parseInt(comunaId);
      const comuna = GeoDataService.getComunaById(id);
      if (!comuna) return;

      charts.radar.data.datasets[0].label = comuna.nombre;
      charts.radar.data.datasets[0].data = [
        100 - comuna.indicadores.aqi,
        comuna.indicadores.movilidad,
        SecurityService.getByComuna(id).score,
        comuna.indicadores.servicios,
        comuna.turistico.demanda
      ];
      charts.radar.update();
    }
  }

  function renderInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const comunas = GeoDataService.getAllComunas();
    const insights = generateInsights(comunas);
    
    container.innerHTML = insights.map(i => `
      <div class="insight-card">
        <span class="insight-icon">${i.icon}</span>
        <div class="insight-text">${i.text}</div>
      </div>
    `).join('');
  }

  function generateInsights(comunas) {
    const insights = [];

    // Find best tourism opportunity
    const topOpp = [...comunas].sort((a, b) => 
      (b.turistico.demanda - b.turistico.oferta) - (a.turistico.demanda - a.turistico.oferta)
    )[0];
    insights.push({
      icon: '🎯',
      text: `<strong>${topOpp.nombre}</strong> tiene el mayor déficit turístico (demanda: ${topOpp.demanda || topOpp.turistico.demanda}%, oferta: ${topOpp.oferta || topOpp.turistico.oferta}%). Zona con <strong>alta oportunidad para turismo ${topOpp.turistico.tipo[0]}</strong>.`
    });

    // Best air quality
    const bestAir = [...comunas].sort((a, b) => a.indicadores.aqi - b.indicadores.aqi)[0];
    insights.push({
      icon: '🌿',
      text: `<strong>${bestAir.nombre}</strong> registra la mejor calidad del aire (AQI: ${bestAir.indicadores.aqi}). Ideal para actividades al aire libre y turismo ecológico.`
    });

    // Security alert
    const worstSec = [...comunas].sort((a, b) => SecurityService.getByComuna(a.id).score - SecurityService.getByComuna(b.id).score)[0];
    insights.push({
      icon: '⚠️',
      text: `<strong>${worstSec.nombre}</strong> presenta los indicadores de seguridad más bajos (score: ${SecurityService.getByComuna(worstSec.id).score}/100). Se recomienda precaución y verificar horarios de visita.`
    });

    // Gastronomy opportunity
    const gastroOpp = comunas.find(c => c.turistico.tipo.includes('gastronomía') && c.turistico.demanda > 60 && c.turistico.oferta < 50);
    if (gastroOpp) {
      insights.push({
        icon: '🍽️',
        text: `<strong>${gastroOpp.nombre}</strong> muestra alta demanda turística con oferta gastronómica limitada. Oportunidad para <strong>restaurantes y cafeterías de especialidad</strong>.`
      });
    }

    // Connectivity
    const bestConnect = [...comunas].sort((a, b) => b.indicadores.movilidad - a.indicadores.movilidad)[0];
    insights.push({
      icon: '🚇',
      text: `<strong>${bestConnect.nombre}</strong> es la comuna mejor conectada (movilidad: ${bestConnect.indicadores.movilidad}/100) con acceso directo al Metro y múltiples rutas de transporte.`
    });

    return insights;
  }

  function destroy() {
    Object.values(charts).forEach(c => c?.destroy());
    charts = {};
  }

  return { render, destroy };
})();
