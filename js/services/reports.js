/* ============================================================
   Reports Service — Citizen Participation (localStorage)
   CRUD for citizen reports with UUID generation
   ============================================================ */

const ReportsService = (() => {
  const STORAGE_KEY = 'citygrowth_reports';

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getAll() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  function save(reports) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }

  function add(report) {
    const reports = getAll();
    const newReport = {
      id: generateUUID(),
      ...report,
      fecha: new Date().toISOString().split('T')[0],
      timestamp: Date.now()
    };
    reports.unshift(newReport);
    save(reports);
    return newReport;
  }

  function remove(id) {
    const reports = getAll().filter(r => r.id !== id);
    save(reports);
  }

  function getByType(tipo) {
    return getAll().filter(r => r.tipo === tipo);
  }

  function getByComuna(comunaName) {
    return getAll().filter(r => r.comuna === comunaName);
  }

  function getCount() {
    return getAll().length;
  }

  const REPORT_TYPES = {
    negocio_faltante: { label: 'Negocio faltante', icon: '🏪', color: '#6C63FF' },
    problema_ruta: { label: 'Problema en ruta', icon: '🚧', color: '#FF6B6B' },
    oportunidad_local: { label: 'Oportunidad local', icon: '💡', color: '#00D4AA' },
    servicio_deficiente: { label: 'Servicio deficiente', icon: '⚠️', color: '#FFA726' },
    espacio_cultural: { label: 'Espacio cultural', icon: '🎨', color: '#AB47BC' }
  };

  const CATEGORIES = {
    cafeteria: '☕ Cafetería',
    restaurante: '🍽️ Restaurante',
    coworking: '💻 Coworking',
    tienda_cultural: '🎨 Tienda cultural',
    experiencia_turistica: '🎭 Experiencia turística',
    transporte: '🚌 Transporte',
    seguridad: '🛡️ Seguridad',
    limpieza: '🧹 Limpieza',
    conectividad: '📶 Conectividad',
    otro: '📋 Otro'
  };

  // Seed some sample reports for demo  
  function seedSampleReports() {
    if (getAll().length > 0) return;
    const samples = [
      { tipo: 'negocio_faltante', categoria: 'cafeteria', ubicacion: { lat: 6.2563, lng: -75.6117 }, descripcion: 'La Comuna 13 recibe muchos turistas pero hay pocas cafeterías de especialidad.', comuna: 'San Javier' },
      { tipo: 'oportunidad_local', categoria: 'experiencia_turistica', ubicacion: { lat: 6.2890, lng: -75.5428 }, descripcion: 'Potencial para tours guiados en el Metrocable con vista al valle.', comuna: 'Popular' },
      { tipo: 'problema_ruta', categoria: 'transporte', ubicacion: { lat: 6.2340, lng: -75.6000 }, descripcion: 'Falta señalización para turistas en la ruta al Pueblito Paisa.', comuna: 'Belén' },
      { tipo: 'negocio_faltante', categoria: 'coworking', ubicacion: { lat: 6.2780, lng: -75.5900 }, descripcion: 'Zona universitaria de Robledo sin espacios de coworking accesibles.', comuna: 'Robledo' },
      { tipo: 'espacio_cultural', categoria: 'tienda_cultural', ubicacion: { lat: 6.2518, lng: -75.5636 }, descripcion: 'Oportunidad de galería de arte en el centro histórico.', comuna: 'La Candelaria' }
    ];
    samples.forEach(s => add(s));
  }

  return { getAll, add, remove, getByType, getByComuna, getCount, seedSampleReports, REPORT_TYPES, CATEGORIES };
})();
