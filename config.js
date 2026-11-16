window.Views = window.Views || {};

Views.config = {
  render(el) {
    const D = Store.data;
    el.innerHTML = `
      ${Store.persistente ? '' : '<div class="notice warn">Este navegador no permite guardar datos (modo privado o almacenamiento bloqueado). Los cambios se perderán al recargar.</div>'}
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div class="card-title">Datos del negocio</div></div>
          <div class="form-grid" id="cfgForm">
            <div class="field full"><label>Nombre del negocio</label><input class="input" name="negocio" value="${U.esc(D.config.negocio)}"></div>
            <div class="field"><label>Símbolo de moneda</label><input class="input" name="moneda" value="${U.esc(D.config.moneda)}" placeholder="Bs, $us, €…"></div>
            <div class="field"><label>Alertar vencimientos con (días)</label><input class="input" type="number" min="1" name="diasVencimiento" value="${D.config.diasVencimiento}"></div>
          </div>
          <button class="btn btn-primary mt" data-act="guardar">Guardar cambios</button>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Respaldo de datos</div></div>
          <p class="muted" style="margin-top:0">En esta demo los datos se guardan solo en este navegador. Descarga un respaldo para moverlos a otro equipo.</p>
          <div class="toolbar">
            <button class="btn" data-act="exportar">${ICON.download} Descargar respaldo (.json)</button>
            <label class="btn">${ICON.upload} Restaurar respaldo<input type="file" accept="application/json,.json" data-change="importar" hidden></label>
          </div>
          <div class="list">
            <div class="list-row"><span class="text-2">Productos</span><b>${D.productos.length}</b></div>
            <div class="list-row"><span class="text-2">Ventas</span><b>${U.num(D.ventas.length)}</b></div>
            <div class="list-row"><span class="text-2">Compras</span><b>${U.num(D.compras.length)}</b></div>
            <div class="list-row"><span class="text-2">Gastos e ingresos</span><b>${U.num(D.movimientos.length)}</b></div>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Datos de demostración</div></div>
          <p class="muted" style="margin-top:0">Regenera 90 días de operación de ejemplo, o deja el sistema en blanco para empezar a cargar datos reales.</p>
          <div class="toolbar">
            <button class="btn" data-act="demo">Restaurar datos de ejemplo</button>
            <button class="btn btn-danger" data-act="vaciar">Empezar en blanco</button>
          </div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Cómo funcionan los precios por mayor</div></div>
          <div class="list">
            <div class="list-row"><span>Cada producto tiene una <b>unidad base</b> (und, kg, L…) en la que se lleva el stock.</span></div>
            <div class="list-row"><span>Las <b>presentaciones</b> (paquete, caja, saco) indican cuántas unidades base contienen.</span></div>
            <div class="list-row"><span>Cada presentación tiene <b>escalas por volumen</b>: el precio baja al llegar a cierta cantidad.</span></div>
            <div class="list-row"><span>Una línea cuenta como <b>venta por mayor</b> si usa una presentación grande o alcanza una escala por volumen.</span></div>
          </div>
        </div>
      </div>`;

    UI.bind(el, {
      guardar: () => {
        const f = UI.form(el.querySelector('#cfgForm'));
        D.config.negocio = f.negocio.trim() || 'Mi Negocio';
        D.config.moneda = f.moneda.trim() || 'Bs';
        D.config.diasVencimiento = Math.max(1, Number(f.diasVencimiento) || 30);
        Store.save(); App.refresh(); UI.toast('Configuración guardada');
      },
      exportar: () => U.download('respaldo-' + U.today() + '.json', JSON.stringify(D, null, 1), 'application/json'),
      importar: (_, input) => {
        const file = input.files[0]; if (!file) return;
        const rd = new FileReader();
        rd.onload = () => {
          try { Store.importar(JSON.parse(rd.result)); App.refresh(); UI.toast('Respaldo restaurado'); }
          catch (e) { UI.toast('No se pudo leer el archivo: ' + e.message, 'err'); }
        };
        rd.readAsText(file);
      },
      demo: () => UI.confirm('Se reemplazarán todos los datos actuales por los datos de ejemplo.', () => { Store.reset(); App.refresh(); UI.toast('Datos de ejemplo restaurados'); }, { ok: 'Restaurar' }),
      vaciar: () => UI.confirm('Se borrarán todos los productos, ventas, compras, proveedores y movimientos de este navegador. Descarga un respaldo antes si lo necesitas.', () => { Store.vaciar(); App.refresh(); UI.toast('Sistema en blanco'); }, { ok: 'Borrar todo' })
    });
  }
};
