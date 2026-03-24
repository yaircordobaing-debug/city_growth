/* ============================================================
   Consultant View — PYMES Advisor
   Location-based business analysis, viability and strategies
   ============================================================ */

const ConsultantView = (() => {

  let selectedLocation = null;
  let analysisResult = null;

  async function render(container) {
    if (!selectedLocation) {
      container.innerHTML = getEmptyStateHTML();
      setupEmptyState();
      return;
    }

    container.innerHTML = `<div class="loading-container flex-center" style="height:300px;"><div class="loading-spinner"></div><p class="ml-md">Analizando territorio...</p></div>`;
    
    // Simulate deep analysis
    await new Promise(r => setTimeout(r, 1500));
    analysisResult = performAnalysis(selectedLocation);
    
    container.innerHTML = getConsultantHTML(analysisResult);
    setupConsultantEvents();
  }

  function getEmptyStateHTML() {
    return `
      <div class="consultant-welcome slide-up">
        <div class="header-section text-center mb-xl">
          <div class="empty-icon" style="font-size: 4rem">👨‍💼</div>
          <h2 class="text-gradient">Consultor Pro de PYMES</h2>
          <p class="text-muted">Potencia tu idea con datos territoriales y análisis estratégico.</p>
        </div>

        <div class="grid-2">
          <!-- Option 1: Location Analysis -->
          <div class="glass-card p-xl text-center hover-scale">
            <div class="mb-md" style="font-size: 2.5rem">📍</div>
            <h4>Análisis por Ubicación</h4>
            <p class="text-sm text-muted mb-lg">Escoge un punto en el mapa y descubre qué negocio tiene mayor probabilidad de éxito allí.</p>
            <button class="btn btn-primary w-100" id="btn-select-on-map">Explorar Mapa</button>
          </div>

          <!-- Option 2: Business Plan Analysis -->
          <div class="glass-card p-xl text-center hover-scale">
            <div class="mb-md" style="font-size: 2.5rem">📄</div>
            <h4>Analizar Plan de Negocio</h4>
            <p class="text-sm text-muted mb-lg">Sube tu plan en PDF o Word. Lo cruzaremos con los 24 temas de MEData para medir su rentabilidad.</p>
            <div class="upload-zone" id="upload-zone">
              <input type="file" id="plan-upload" accept=".pdf,.doc,.docx" style="display:none">
              <div class="upload-content">
                <span class="upload-icon">📤</span>
                <span class="upload-text">Arrastra o haz clic aquí</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="medata-banner mt-xl">
          <h5>📊 Basado en los 24 Temas de MEData</h5>
          <div class="theme-tags">
            ${['Comercio', 'Turismo', 'Educación', 'Salud', 'Ambiente', 'Seguridad', 'Cultura', 'Transporte', 'Economía'].map(t => `<span class="theme-tag">${t}</span>`).join('')}
            <span>+15 temas más</span>
          </div>
        </div>
      </div>
    `;
  }

  function setupEmptyState() {
    document.getElementById('btn-select-on-map')?.addEventListener('click', () => {
      if (window.location.hash === '#map') {
        App.navigateTo('map');
      } else {
        window.location.hash = 'map';
      }
    });

    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('plan-upload');

    uploadZone?.addEventListener('click', () => fileInput.click());
    
    fileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileUpload(e.target.files[0]);
      }
    });

    uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragging');
    });

    uploadZone?.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragging');
    });

    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragging');
      if (e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files[0]);
      }
    });
  }

  async function handleFileUpload(file) {
    const container = document.getElementById('view-container');
    container.innerHTML = `
      <div class="loading-container flex-center flex-column" style="height:400px;">
        <div class="loading-spinner"></div>
        <h4 class="mt-md">Analizando "${file.name}"...</h4>
        <p class="text-sm text-muted">Cruzando con indicadores de MEData Medellín</p>
        <div class="analysis-steps mt-lg">
          <div class="step active">✅ Extrayendo conceptos clave</div>
          <div class="step active">⏳ Evaluando impacto en ${file.name.includes('eco') ? 'Medio Ambiente' : 'Comercio'}</div>
          <div class="step">⚪ Calculando rentabilidad territorial</div>
        </div>
      </div>
    `;

    await new Promise(r => setTimeout(r, 2500));
    
    // Perform complex analysis based on filename and random factors
    const result = performDocumentAnalysis(file);
    container.innerHTML = getDocumentAnalysisHTML(result);
    setupConsultantEvents();
  }

  function performDocumentAnalysis(file) {
    const isEco = file.name.toLowerCase().includes('eco') || file.name.toLowerCase().includes('verde');
    const isTech = file.name.toLowerCase().includes('tech') || file.name.toLowerCase().includes('app');
    
    return {
      fileName: file.name,
      rentability: 75 + Math.random() * 20,
      alignment: {
        'Economía y Finanzas': 88,
        'Ambiente y Desarrollo': isEco ? 95 : 45,
        'Ciencia y Tecnología': isTech ? 92 : 60,
        'Seguridad y Defensa': 72,
        'Comercio e Industria': 85
      },
      strengths: [
        'Propuesta alineada con el Plan de Desarrollo Local.',
        'Alta demanda identificada en comunas 10, 11 y 14.',
        'Factibilidad técnica superior al promedio.'
      ],
      risks: [
        'Dependencia de factores climáticos estacionales.',
        'Alta competencia en el sector tradicional.'
      ],
      medataThemes: [
        { theme: 'Comercio', impact: 'Positivo', desc: 'Aumenta la diversificación de la canasta local.' },
        { theme: 'Ambiente', impact: isEco ? 'Alto' : 'Neutral', desc: 'Cumple con normativas de sostenibilidad.' },
        { theme: 'Trabajo', impact: 'Positivo', desc: 'Generación estimada de 5-10 empleos directos.' }
      ]
    };
  }

  function getDocumentAnalysisHTML(data) {
    return `
      <div class="consultant-view slide-up">
        <div class="flex-between mb-lg">
          <div>
            <span class="badge badge-success">ANÁLISIS DE DOCUMENTO COMPLETADO</span>
            <h2 class="mt-xs">Resultado para: ${data.fileName}</h2>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="location.reload()">🔄 Nuevo Análisis</button>
        </div>

        <div class="grid-2 mb-xl">
          <div class="glass-card p-lg text-center">
            <h4>💰 Rentabilidad Estimada</h4>
            <div class="rentability-score mt-md">
              <span class="score-value">${data.rentability.toFixed(0)}%</span>
            </div>
            <p class="text-sm text-muted mt-md">Tu idea tiene una rentabilidad **superior al 85%** de los proyectos analizados en Medellín este mes.</p>
          </div>
          
          <div class="glass-card p-lg">
            <h4>🧩 Alineación con Temáticas MEData</h4>
            <div class="alignment-list mt-md">
              ${Object.entries(data.alignment).map(([key, val]) => `
                <div class="alignment-item mb-sm">
                  <div class="flex-between text-xs mb-xs">
                    <span>${key}</span>
                    <span>${val}%</span>
                  </div>
                  <div class="viability-meter">
                    <div class="meter-bar" style="width: ${val}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="grid-2 mb-xl">
          <div class="glass-card p-lg" style="border-left: 4px solid #00d4aa">
            <h4>✅ Fortalezas</h4>
            <ul class="strategy-list mt-md">
              ${data.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          <div class="glass-card p-lg" style="border-left: 4px solid #ff5252">
            <h4>⚠️ Riesgos / Desafíos</h4>
            <ul class="strategy-list mt-md">
              ${data.risks.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        </div>

        <h3>📦 Impacto por Sectores MEData</h3>
        <div class="opportunity-grid mt-md">
          ${data.medataThemes.map(item => `
            <div class="glass-card p-md">
              <div class="flex-between mb-xs">
                <span class="fw-bold text-sm">${item.theme}</span>
                <span class="badge ${item.impact === 'Alto' || item.impact === 'Positivo' ? 'badge-success' : 'badge-info'}">${item.impact}</span>
              </div>
              <p class="text-xs text-muted">${item.desc}</p>
            </div>
          `).join('')}
        </div>

        <div class="mt-xl glass-card p-xl text-center" style="background: rgba(108, 99, 255, 0.1)">
          <h3>🚀 ¿Deseas perfeccionar este plan?</h3>
          <p class="text-sm text-muted mb-lg">Nuestros asesores pueden ayudarte a ajustar los puntos críticos identificados.</p>
          <button class="btn btn-primary btn-contact-advisor" data-biz="Ajuste de Plan: ${data.fileName}">
            📱 Hablar con un Asesor de Proyectos
          </button>
        </div>
      </div>
    `;
  }

  function getConsultantHTML(data) {
    return `
      <div class="consultant-view slide-up">
        <div class="flex-between mb-lg">
          <div>
            <span class="badge badge-purple">ANÁLISIS DE TERRITORIO</span>
            <h2 class="mt-xs">Consultoría para Comuna: ${data.comuna}</h2>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-re-analyze">🔍 Nueva Ubicación</button>
        </div>

        <div class="grid-2 mb-xl">
          <div class="glass-card p-lg">
            <h4>📈 Resumen de Viabilidad</h4>
            <div class="viability-meter mt-md">
              <div class="meter-bar" style="width: ${data.topBusinesses[0].score}%"></div>
              <span class="meter-label">${data.topBusinesses[0].score.toFixed(0)}% Éxito Estimado</span>
            </div>
            <p class="text-sm text-muted mt-md">Factores clave: <strong>${data.marketContext}</strong> y conectividad de <strong>${data.connectivityScore}/100</strong>.</p>
          </div>
          
          <div class="glass-card p-lg">
            <h4>👨‍⚖️ Recomendación del Asesor</h4>
            <p class="text-sm mt-md">"Basado en los flujos de la comuna ${data.comuna}, el negocio con mayor potencial es <strong>${data.topBusinesses[0].name}</strong>. Existe un déficit de servicios de este tipo y una alta afluencia de transporte público."</p>
          </div>
        </div>

        <h3>💡 Opciones Estratégicas</h3>
        <div class="opportunity-grid mt-md">
          ${data.topBusinesses.map(biz => `
            <div class="opportunity-card" style="opacity: 1; transform: none">
              <div class="opp-header">
                <span class="opp-type">${biz.icon}</span>
                <span class="opp-score" style="color:${getScoreColor(biz.score)}">${biz.score.toFixed(0)}%</span>
              </div>
              <div class="opp-title">${biz.name}</div>
              <div class="opp-location">Viabilidad Predictiva</div>
              
              <div class="opp-reason">
                <strong>ESTRATEGIAS:</strong>
                <ul class="strategy-list">
                  ${biz.strategies.map(s => `<li>${s}</li>`).join('')}
                </ul>
              </div>
              
              <button class="btn btn-primary btn-sm w-100 btn-contact-advisor" data-biz="${biz.name}">
                📱 Contactar Asesor Especializado
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function getScoreColor(score) {
    if (score >= 80) return '#00d4aa';
    if (score >= 60) return '#ffa726';
    return '#ff5252';
  }

  function setupConsultantEvents() {
    document.getElementById('btn-re-analyze')?.addEventListener('click', () => {
      selectedLocation = null;
      window.location.hash = 'map';
    });

    document.querySelectorAll('.btn-contact-advisor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const biz = e.target.dataset.biz;
        const msg = encodeURIComponent(`Hola, estoy interesado en poner un negocio de ${biz} en la comuna ${analysisResult.comuna}. Me gustaría recibir asesoría personalizada.`);
        window.open(`https://wa.me/573000000000?text=${msg}`, '_blank');
      });
    });
  }

  function analyze(lat, lng) {
    // Find nearest comuna
    const nearest = findNearestComuna(lat, lng);
    selectedLocation = { lat, lng, comunaId: nearest.id };
    window.location.hash = 'consultant';
  }

  function findNearestComuna(lat, lng) {
    const comunas = GeoDataService.getAllComunas();
    let minGroup = comunas[0];
    let minDist = Infinity;
    
    comunas.forEach(c => {
      const d = Math.sqrt(Math.pow(c.centro.lat - lat, 2) + Math.pow(c.centro.lng - lng, 2));
      if (d < minDist) {
        minDist = d;
        minGroup = c;
      }
    });
    return minGroup;
  }

  return { render, analyze };
})();
