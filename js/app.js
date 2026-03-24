/* ============================================================
   App.js — SPA Router & Initialization
   MedCity Dashboard — Medellín Inteligente
   ============================================================ */

const App = (() => {

  const VIEWS = {
    dashboard: {
      title: 'Dashboard General',
      breadcrumb: 'Medellín → Vista Panorama',
      module: DashboardView
    },
    map: {
      title: 'Mapa Interactivo',
      breadcrumb: 'Medellín → Radar de Oportunidades',
      module: MapView
    },
    opportunities: {
      title: 'Motor de Oportunidades',
      breadcrumb: 'Medellín → Oportunidades de Negocio',
      module: OpportunitiesView
    },
    reports: {
      title: 'Participación Ciudadana',
      breadcrumb: 'Medellín → Reportes Ciudadanos',
      module: ReportsView
    },
    consultant: {
      title: 'Consultor de Negocios PYMES',
      breadcrumb: 'Medellín → Inteligencia de Negocios',
      module: ConsultantView
    }
  };

  let currentView = null;

  function init() {
    console.log('🏙️ MedCity Dashboard initializing...');
    
    // Setup navigation
    setupNavigation();
    
    // Setup modal close
    setupModal();
    
    // Setup clock
    updateClock();
    setInterval(updateClock, 1000);

    // Setup mobile menu
    setupMobileMenu();

    window.addEventListener('hashchange', () => {
      const viewName = window.location.hash.replace('#', '');
      if (viewName && VIEWS[viewName]) {
        navigateTo(viewName);
      }
    });

    // Handle initial route
    const initialView = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(initialView);

    console.log('✅ MedCity Dashboard ready');
  }

  function setupNavigation() {
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewName = item.dataset.view;
        window.location.hash = viewName;
        
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
      });
    });
  }

  function navigateTo(viewName) {
    const view = VIEWS[viewName];
    if (!view) return;

    // Destroy previous view
    if (currentView && VIEWS[currentView]?.module?.destroy) {
      VIEWS[currentView].module.destroy();
    }

    currentView = viewName;

    // Update nav active state
    document.querySelectorAll('.nav-item[data-view]').forEach(item => {
      item.classList.toggle('active', item.dataset.view === viewName);
    });

    // Update header
    document.getElementById('view-title').textContent = view.title;
    document.getElementById('view-breadcrumb').textContent = view.breadcrumb;

    // Render view
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="flex-center" style="height:200px"><div class="loading-spinner"></div></div>';
    container.style.animation = 'none';
    requestAnimationFrame(() => {
      container.style.animation = 'fadeIn 0.4s ease';
      view.module.render(container);
    });
  }

  function setupModal() {
    document.getElementById('modal-close')?.addEventListener('click', () => {
      document.getElementById('modal-overlay').classList.remove('active');
    });
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        e.currentTarget.classList.remove('active');
      }
    });
  }

  function setupMobileMenu() {
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
    });
  }

  function updateClock() {
    const now = new Date();
    const time = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const date = now.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
    const el = document.getElementById('current-time');
    if (el) el.textContent = `${date} • ${time}`;
  }

  return { init, navigateTo };
})();

// ── Boot ──
document.addEventListener('DOMContentLoaded', () => App.init());
