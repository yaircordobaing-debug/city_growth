# MedCity Dashboard 🏙️ — Medellín Inteligente

Prototipo de dashboard geoespacial en tiempo real para la ciudad de Medellín (Colombia), diseñado para empoderar a PYMES del sector turístico y la economía naranja.

## 🚀 Características Principales

1.  **Dashboard Panorama**: Visualización de indicadores clave (Calidad del aire SIATA, Seguridad SISC, Movilidad Metro) por comuna.
2.  **Mapa Interactivo**: Radar de oportunidades con polígonos GeoJSON, capas toggleables y sistema de **Triple Ruta** (Buena, Media, Mala).
3.  **Consultor de Negocios PYMES**:
    *   **Análisis por Ubicación**: Sugerencia de negocios viables según el déficit de servicios en el punto seleccionado.
    *   **Analizador de Planes de Negocio**: Carga de documentos (PDF/Word) analizados con inteligencia territorial basada en **24 temáticas de MEData**.
4.  **Participación Ciudadana**: Sistema de reportes en tiempo real para detectar necesidades en el territorio.
5.  **Ubicación Real-Time**: Marcador personalizado ("muñequito") para el seguimiento del usuario.

## 📂 Estructura del Proyecto

*   `js/views/`: Módulos de vista para Dashboard, Mapa, Consultor y Reportes.
*   `js/services/`: Capa de datos para consumo de APIs (SIATA, ArcGIS, DatosAbiertos).
*   `css/`: Sistema de diseño moderno con Glassmorphism y Dark Theme.
*   `js/data/`: Fuentes GeoJSON y puntos de interés turístico expandidos.

## 🛠️ Tecnologías

*   **Vanilla JavaScript (ES6+)**
*   **Leaflet.js** (Mapas)
*   **Chart.js** (Gráficos)
*   **Leaflet Routing Machine** (Motores de ruta OSRM)
*   **CSS3** (Variables y animaciones modernas)

## 💻 Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/YairCordoba/city_growth.git

# Entrar a la carpeta
cd city_growth

# Ejecutar un servidor estático (ej: serve)
npx -y serve . -l 3000
```
Abrir `http://localhost:3000` en tu navegador.

---
© 2026 MedCity Dashboard Team. Datos provistos por la Alcaldía de Medellín y SIATA.
