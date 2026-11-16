/*
 * Guía interactiva: bienvenida la primera vez, recorrido por el menú y una guía corta
 * la primera vez que se abre cada pantalla. El botón "Guía" la vuelve a mostrar.
 * Cada paso: { sel: selector CSS, card: true para resaltar la tarjeta que lo contiene, title, text, nav: true si está en el menú }
 */
const Tour = {
  KEY: 'gf-guia-v1',
  GENERAL: [
    { title: 'Bienvenido a Gestión de Flujos', text: 'Una plataforma para controlar <b>ventas por mayor y al cliente final</b>, compras a la agencia, producción por lotes, productos dañados y la caja del negocio.<br><br>Esta demo ya tiene <b>90 días de datos de ejemplo</b>. Te muestro en 1 minuto qué hay en cada parte.' },
    { sel: '#nav a[data-route=dashboard]', nav: true, title: 'Resumen', text: 'Lo más importante de un vistazo: ventas, ganancia, gastos, productos dañados y alertas.' },
    { sel: '#nav a[data-route=ventas]', nav: true, title: 'Ventas', text: 'Registra cada venta como en una caja. El precio <b>mayorista</b> o de <b>cliente final</b> se calcula solo según la cantidad.' },
    { sel: '#nav a[data-route=productos]', nav: true, title: 'Productos y precios', text: 'Costo de la agencia, precio mayorista, precio al cliente final y <b>cuánto ganas</b> en cada uno.' },
    { sel: '#nav a[data-route=compras]', nav: true, title: 'Compras y proveedores', text: 'Lo que compras a la agencia. Suma al stock y actualiza el costo automáticamente.' },
    { sel: '#nav a[data-route=produccion]', nav: true, title: 'Producción', text: 'Cada lote (por ejemplo, escabeches): <b>cuánto invertiste</b>, cuánto produjiste y cuánto vas a ganar.' },
    { sel: '#nav a[data-route=mermas]', nav: true, title: 'Huevos dañados', text: 'Registra huevos rotos, trizados o vencidos y mira cuántos son y cuánto dinero se pierde.' },
    { sel: '#nav a[data-route=caja]', nav: true, title: 'Caja: gastos e ingresos', text: 'Gastos del negocio (alquiler, sueldos, luz…) y el resultado final: cuánto entró, cuánto salió y cuánto quedó.' },
    { sel: '#nav a[data-route=config]', nav: true, title: 'Configuración', text: 'Nombre del negocio, respaldo de los datos y volver a cargar los datos de ejemplo.' },
    { sel: '#helpBtn', title: '¿Dudas? Toca "Guía"', text: 'En cualquier pantalla, este botón te explica qué es cada cosa. Además, la primera vez que entres a cada pantalla verás una guía corta.' }
  ],
  PAGINAS: {
    dashboard: [
      { sel: '.view > .toolbar select', title: 'Elige el periodo', text: 'Hoy, últimos 7 o 30 días, este mes… Todo se recalcula y se compara con el periodo anterior: <span class="up">▲ sube</span>, <span class="down">▼ baja</span>.' },
      { sel: '.view > .grid-kpi', title: 'Indicadores principales', text: 'Ventas, utilidad, gastos y lo perdido en productos dañados. La <b>utilidad neta</b> es lo que realmente queda.' },
      { sel: '#chVentas', card: true, title: 'Ventas por día', text: 'Amarillo: <b>cliente final</b>. Naranja: <b>por mayor</b>. Pasa el mouse o el dedo por una barra para ver el detalle.' },
      { sel: '.view > .grid-kpi.mt:last-child', title: 'Alertas', text: 'Productos con poco stock, próximos a vencer y lo que debes a los proveedores.' }
    ],
    ventas: [
      { sel: '.prod-grid', title: '1. Elige productos', text: 'Toca un producto para agregarlo a la venta. Los huevos se agregan por maple.' },
      { sel: '#cart', title: '2. Ajusta y cobra', text: 'Cambia la presentación (unidad, maple, caja) y la cantidad. El <b>precio mayorista se aplica solo</b> y te avisa si llevando un poco más se paga menos. Luego eliges el medio de pago y tocas Cobrar.' },
      { sel: '.view > .tabs', title: 'Historial', text: 'Aquí ves todas las ventas, puedes anularlas (el stock vuelve) o exportarlas a Excel.' }
    ],
    productos: [
      { sel: '.view > .tabs', title: 'Dos vistas', text: '<b>Precios y ganancia</b> para ver cuánto ganas, e <b>Inventario</b> para ver el stock.' },
      { sel: '.view > .card', title: 'Lista de precios', text: 'Para cada producto: costo de la agencia, <b>precio mayorista</b>, <b>precio al cliente final</b> y la ganancia de cada uno. Con el lápiz cambias los precios.' },
      { sel: '.view > .card.mt', title: 'Ganancia real', text: 'Lo que se vendió en el periodo, menos lo que costó y lo que se dañó. Es la ganancia por producto antes de gastos.' }
    ],
    compras: [
      { sel: '[data-act=nueva]', title: 'Registrar una compra', text: 'Anota lo que compras a la agencia (por caja o maple). El stock sube y el costo se actualiza solo.' },
      { sel: '#cBody .table-wrap', title: 'Compras registradas', text: 'Puedes marcar las compras pendientes como pagadas o anularlas.' },
      { sel: '.view > .tabs', title: 'Proveedores', text: 'Datos de cada agencia o proveedor, cuánto les compraste y cuánto les debes.' }
    ],
    produccion: [
      { sel: '[data-act=nuevo]', title: 'Nuevo lote', text: 'Elige el producto, cuántos se produjeron y los insumos con su costo. <b>"Copiar del último lote"</b> lo hace en segundos.' },
      { sel: '.view > .grid-kpi', title: 'Inversión y ganancia', text: 'Cuánto invertiste, cuánto produjiste, la ganancia esperada si vendes todo y la ganancia real de lo ya vendido.' },
      { sel: '.view > .card.mt:last-child', title: 'Cada lote', text: 'Inversión, producción, costo por unidad y ganancia de cada lote. El ojito muestra el detalle de insumos.' }
    ],
    mermas: [
      { sel: '[data-act=nuevo]', title: 'Registrar dañados', text: 'Anota los huevos rotos, trizados o vencidos, <b>por huevo o por maple</b>, con el motivo. Se descuentan del stock.' },
      { sel: '.view > .grid-kpi', title: '¿Cuánto se pierde?', text: 'Huevos dañados, qué <b>% de lo comprado</b> representan y cuánto dinero se perdió al costo.' },
      { sel: '#chMermas', card: true, title: 'Por semana y por motivo', text: 'Así ves si está empeorando y dónde se rompen más: en el transporte, en la tienda…' }
    ],
    caja: [
      { sel: '[data-act=nuevo][data-id=gasto]', title: 'Registrar gastos', text: 'Alquiler, sueldos, luz, transporte… También puedes anotar otros ingresos.' },
      { sel: '#cajaBody .card', title: 'Estado de resultados', text: 'Cuánto se ganó de verdad: ventas, menos costo, dañados y gastos.' },
      { sel: '#cajaBody .grid-2 > .card:nth-child(2)', title: 'Flujo de caja', text: 'El dinero que realmente entró y salió: cobros, pagos a la agencia, inversión en producción y gastos.' }
    ],
    config: [
      { sel: '.view .card', title: 'Datos del negocio', text: 'Cambia el nombre que aparece arriba a la izquierda.' },
      { sel: '.view .card:nth-child(2)', title: 'Respaldo', text: 'Descarga una copia de tus datos o restáurala. En la demo los datos viven en este navegador.' }
    ]
  },

  estado() {
    try { return JSON.parse(localStorage.getItem(Tour.KEY)) || { pages: {} }; } catch (e) { return { pages: {} }; }
  },
  guardar(s) { try { localStorage.setItem(Tour.KEY, JSON.stringify(s)); } catch (e) { /* sin almacenamiento */ } },

  /** Al abrir una pantalla: bienvenida la primera vez y guía de la pantalla la primera vez que se visita */
  auto(ruta) {
    if (Tour.activo) return;
    const s = Tour.estado();
    if (s.off) return;
    if (!s.bienvenida) {
      s.bienvenida = true; Tour.guardar(s);
      Tour.iniciar(Tour.GENERAL, () => Tour.auto(App.current));
      return;
    }
    if (!s.pages[ruta] && Tour.PAGINAS[ruta]) {
      s.pages[ruta] = true; Tour.guardar(s);
      Tour.iniciar(Tour.PAGINAS[ruta]);
    }
  },
  /** Botón "Guía": explica la pantalla actual; al final ofrece el recorrido general */
  ayuda() {
    const s = Tour.estado(); delete s.off; Tour.guardar(s);
    const pasos = Tour.PAGINAS[App.current] || [];
    Tour.iniciar([...pasos, { sel: '#helpBtn', title: '¿Quieres ver todo el menú?', text: 'Puedes hacer el recorrido general por todas las secciones.', extra: '<button class="btn btn-sm" data-t="general">Ver recorrido general</button>' }]);
  },

  iniciar(pasos, alTerminar) {
    Tour.cerrar(false);
    UI.closeModal();
    Tour.pasos = pasos; Tour.i = 0; Tour.fin = alTerminar || null; Tour.activo = true;
    const root = document.createElement('div');
    root.id = 'tour';
    root.innerHTML = `<div class="tour-block"></div><div class="tour-hole"></div>
      <div class="tour-tip" role="dialog" aria-live="polite"><div class="tour-body"></div>
        <div class="tour-foot"><span class="tour-count"></span><span class="spacer"></span>
          <button class="btn btn-sm" data-t="prev">Atrás</button><button class="btn btn-sm btn-primary" data-t="next">Siguiente</button></div>
        <div class="tour-links"><button data-t="skip">Cerrar guía</button><button data-t="off">No mostrar guías automáticas</button></div></div>`;
    document.body.appendChild(root);
    Tour.root = root;
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      const t = b.dataset.t;
      if (t === 'next') Tour.ir(Tour.i + 1);
      if (t === 'prev') Tour.ir(Tour.i - 1);
      if (t === 'skip') Tour.cerrar(false);
      if (t === 'off') { const s = Tour.estado(); s.off = true; Tour.guardar(s); Tour.cerrar(false); UI.toast('Listo. Toca "Guía" cuando la necesites.'); }
      if (t === 'general') Tour.iniciar(Tour.GENERAL);
    });
    Tour._onResize = () => { cancelAnimationFrame(Tour._raf); Tour._raf = requestAnimationFrame(() => Tour.posicionar()); };
    window.addEventListener('resize', Tour._onResize);
    window.addEventListener('scroll', Tour._onResize, { passive: true });
    requestAnimationFrame(() => root.classList.add('show'));
    Tour.ir(0);
  },

  cerrar(llamarFin) {
    if (!Tour.root) return;
    window.removeEventListener('resize', Tour._onResize);
    window.removeEventListener('scroll', Tour._onResize);
    Tour.root.remove(); Tour.root = null; Tour.activo = false;
    document.getElementById('sidebar').classList.remove('open', 'tour-lift');
    document.getElementById('scrim').classList.remove('show');
    const fin = Tour.fin; Tour.fin = null;
    if (llamarFin && fin) setTimeout(fin, 250);
  },

  objetivo(paso) {
    if (!paso.sel) return null;
    let el = document.querySelector(paso.sel);
    if (el && paso.card) el = el.closest('.card') || el;
    if (!el || !el.getClientRects().length) return null;
    return el;
  },

  ir(i) {
    if (i < 0) return;
    // Salta pasos cuyo elemento no existe en esta pantalla
    while (i < Tour.pasos.length && Tour.pasos[i].sel && !Tour.pasoVisible(Tour.pasos[i])) i++;
    if (i >= Tour.pasos.length) { Tour.cerrar(true); return; }
    Tour.i = i;
    const paso = Tour.pasos[i];
    const movil = window.innerWidth <= 960;
    const sb = document.getElementById('sidebar');
    sb.classList.toggle('open', !!(paso.nav && movil));
    sb.classList.toggle('tour-lift', !!paso.nav);
    const tip = Tour.root.querySelector('.tour-tip');
    tip.classList.remove('in');
    Tour.root.querySelector('.tour-body').innerHTML = `<div class="tour-title">${paso.title}</div><div class="tour-text">${paso.text}</div>${paso.extra ? '<div class="mt">' + paso.extra + '</div>' : ''}`;
    const total = Tour.pasos.length;
    Tour.root.querySelector('.tour-count').textContent = total > 1 ? (i + 1) + ' de ' + total : '';
    Tour.root.querySelector('[data-t=prev]').style.visibility = i > 0 ? 'visible' : 'hidden';
    Tour.root.querySelector('[data-t=next]').textContent = i === total - 1 ? 'Entendido' : (i === 0 && !paso.sel ? 'Empezar' : 'Siguiente');
    const el = Tour.objetivo(paso);
    if (el && !paso.nav) {
      const r = el.getBoundingClientRect();
      const fuera = r.top < 70 || r.bottom > window.innerHeight - 20;
      if (fuera) {
        const top = r.height > window.innerHeight * 0.6 ? r.top - 76 : r.top - (window.innerHeight - r.height) / 2;
        window.scrollBy(0, top);
      }
      setTimeout(() => { Tour.posicionar(); tip.classList.add('in'); }, 40);
    } else {
      setTimeout(() => { Tour.posicionar(); tip.classList.add('in'); }, paso.nav && movil ? 260 : 30);
    }
    setTimeout(() => { const b = Tour.root && Tour.root.querySelector('[data-t=next]'); if (b) b.focus({ preventScroll: true }); }, 60);
  },

  pasoVisible(paso) {
    if (!paso.sel) return true;
    if (paso.nav) return !!document.querySelector(paso.sel);
    return !!Tour.objetivo(paso);
  },

  posicionar() {
    if (!Tour.root) return;
    const paso = Tour.pasos[Tour.i];
    const el = Tour.objetivo(paso);
    const hole = Tour.root.querySelector('.tour-hole');
    const tip = Tour.root.querySelector('.tour-tip');
    const vw = window.innerWidth, vh = window.innerHeight, m = 12;
    const tw = Math.min(360, vw - 2 * m);
    tip.style.width = tw + 'px';
    const th = tip.offsetHeight;
    if (!el) {
      Object.assign(hole.style, { top: vh / 2 + 'px', left: vw / 2 + 'px', width: '0px', height: '0px' });
      Object.assign(tip.style, { top: Math.max(m, (vh - th) / 2) + 'px', left: (vw - tw) / 2 + 'px' });
      tip.dataset.pos = 'center';
      return;
    }
    const r = el.getBoundingClientRect(), p = 6;
    const top = Math.max(4, r.top - p), bottom = Math.min(vh - 4, r.bottom + p);
    Object.assign(hole.style, { top: top + 'px', left: Math.max(4, r.left - p) + 'px', width: Math.min(vw - 8, r.width + 2 * p) + 'px', height: Math.max(0, bottom - top) + 'px' });
    let tTop, tLeft;
    if (paso.nav && vw > 960 && vw - r.right > tw + 2 * m) {
      tLeft = r.right + 16; tTop = Math.min(Math.max(m, r.top - 12), vh - th - m);
    } else if (vh - bottom > th + 2 * m) {
      tTop = bottom + 12; tLeft = Math.min(Math.max(m, r.left), vw - tw - m);
    } else if (top > th + 2 * m) {
      tTop = top - th - 12; tLeft = Math.min(Math.max(m, r.left), vw - tw - m);
    } else {
      tTop = vh - th - m; tLeft = (vw - tw) / 2;
    }
    Object.assign(tip.style, { top: tTop + 'px', left: tLeft + 'px' });
  }
};

document.addEventListener('keydown', e => {
  if (!Tour.activo) return;
  if (e.key === 'Escape') { e.stopPropagation(); Tour.cerrar(false); }
  if (e.key === 'ArrowRight') Tour.ir(Tour.i + 1);
  if (e.key === 'ArrowLeft') Tour.ir(Tour.i - 1);
}, true);
