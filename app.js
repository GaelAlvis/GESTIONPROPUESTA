/* Enrutador y arranque de la aplicación */
const App = {
  routes: {
    dashboard: 'Resumen del negocio',
    ventas: 'Ventas',
    productos: 'Productos, precios y ganancia',
    compras: 'Compras y proveedores',
    produccion: 'Producción (escabeches)',
    mermas: 'Huevos y productos dañados',
    caja: 'Caja: gastos e ingresos',
    config: 'Configuración'
  },
  current: 'dashboard',

  init() {
    Store.load();
    window.addEventListener('hashchange', () => App.route());
    const sb = document.getElementById('sidebar'), scrim = document.getElementById('scrim');
    const toggle = open => { sb.classList.toggle('open', open); scrim.classList.toggle('show', open); };
    document.getElementById('menuBtn').onclick = () => toggle(true);
    scrim.onclick = () => toggle(false);
    document.getElementById('nav').addEventListener('click', () => toggle(false));
    document.getElementById('topDate').textContent = new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    // Repinta los gráficos si cambia el tema claro/oscuro del sistema
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => App.refresh());
    App.route();
  },

  route() {
    const r = location.hash.replace(/^#\/?/, '') || 'dashboard';
    App.current = App.routes[r] ? r : 'dashboard';
    document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('active', a.dataset.route === App.current));
    UI.closeModal();
    App.refresh();
    window.scrollTo(0, 0);
  },

  refresh() {
    UI.destroyCharts();
    const title = App.routes[App.current];
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('brandName').textContent = Store.data.config.negocio;
    document.title = title + ' · ' + Store.data.config.negocio;
    Views[App.current].render(document.getElementById('view'));
  }
};

document.addEventListener('DOMContentLoaded', App.init);
