window.Views = window.Views || {};

Views.caja = {
  tab: 'resumen',
  periodo: 'mes', tipo: '', cat: '',
  CATS: {
    gasto: ['Alquiler', 'Servicios', 'Personal', 'Transporte', 'Marketing', 'Mantenimiento', 'Impuestos', 'Otros gastos'],
    ingreso: ['Servicios', 'Aporte de capital', 'Préstamo recibido', 'Otros ingresos']
  },

  render(el) {
    el.innerHTML = `${UI.tabs([['resumen', 'Resultados y flujo de caja'], ['movs', 'Gastos e ingresos', Store.data.movimientos.length]], this.tab)}
      <div class="toolbar">${UI.periodo(this.periodo)}<span class="muted" id="rangoTxt"></span><span class="spacer"></span>
        <button class="btn" data-act="nuevo" data-id="ingreso">${ICON.plus} Otro ingreso</button>
        <button class="btn btn-primary" data-act="nuevo" data-id="gasto">${ICON.plus} Registrar gasto</button></div>
      <div id="cajaBody"></div>`;
    const r = U.rango(this.periodo);
    el.querySelector('#rangoTxt').textContent = r.desde === '0000-01-01' ? 'Todo el historial' : U.fmtDate(r.desde) + ' – ' + U.fmtDate(r.hasta);
    UI.bind(el, {
      tab: id => { this.tab = id; App.refresh(); },
      periodo: v => { this.periodo = v; App.refresh(); },
      nuevo: tipo => this.editor(null, tipo),
      tipo: v => { this.tipo = v; App.refresh(); },
      cat: v => { this.cat = v; App.refresh(); },
      editar: id => this.editor(Store.data.movimientos.find(m => m.id === id)),
      borrar: id => UI.confirm('¿Eliminar este movimiento?', () => {
        Store.data.movimientos = Store.data.movimientos.filter(m => m.id !== id); Store.save(); App.refresh(); UI.toast('Movimiento eliminado');
      }, { ok: 'Eliminar' })
    });
    const body = el.querySelector('#cajaBody');
    if (this.tab === 'resumen') this.renderResumen(body, r); else this.renderMovs(body, r);
  },

  renderResumen(el, r) {
    const D = Store.data;
    const k = Views.dashboard.calcular(r);
    const compras = D.compras.filter(c => U.enRango(c.fecha, r));
    const comprasPagadas = U.sum(compras.filter(c => c.estado === 'pagado'), c => c.total);
    const comprasPend = U.sum(compras.filter(c => c.estado === 'pendiente'), c => c.total);
    const credito = U.sum(k.ventas.filter(v => v.metodo === 'Crédito'), v => v.total);
    const cobrado = k.total - credito;
    const ingresos = cobrado + k.otros;
    const egresos = comprasPagadas + k.inversion + k.gastos;
    const porCat = {};
    k.movs.filter(m => m.tipo === 'gasto').forEach(m => { porCat[m.categoria] = (porCat[m.categoria] || 0) + m.monto; });
    const porMetodo = {};
    k.ventas.forEach(v => { porMetodo[v.metodo] = (porMetodo[v.metodo] || 0) + v.total; });
    const row = (l, v, cls = '') => `<tr class="${cls}"><td class="${cls.includes('sub') ? 'indent' : ''}">${l}</td><td class="num">${v}</td></tr>`;

    el.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Estado de resultados</div><div class="card-sub">¿Cuánto se ganó? (base devengada)</div></div></div>
          <table class="statement"><tbody>
            ${row('Ventas netas', U.money(k.total))}
            ${row('Costo de lo vendido', '− ' + U.money(k.costo), 'sub')}
            ${row('Utilidad bruta', U.money(k.bruta) + ` <span class="muted">(${U.pct(k.total ? k.bruta / k.total * 100 : 0)})</span>`, 'total')}
            ${row('Mermas (productos dañados)', '− ' + U.money(k.perdida), 'sub')}
            ${Object.entries(porCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => row(U.esc(c), '− ' + U.money(v), 'sub')).join('') || row('Gastos operativos', U.money(0), 'sub')}
            ${row('Total gastos operativos', '− ' + U.money(k.gastos), 'total')}
            ${row('Otros ingresos', '+ ' + U.money(k.otros), 'sub')}
            ${row('Utilidad neta', `<span class="${k.neta < 0 ? 'bad' : 'good'}">${U.money(k.neta)}</span>`, 'total grand')}
          </tbody></table>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">Flujo de caja</div><div class="card-sub">¿Cuánto dinero entró y salió?</div></div></div>
          <table class="statement"><tbody>
            ${row('Cobros por ventas', '+ ' + U.money(cobrado))}
            ${row('Otros ingresos', '+ ' + U.money(k.otros))}
            ${row('Total entradas', U.money(ingresos), 'total')}
            ${row('Pagos a proveedores', '− ' + U.money(comprasPagadas), 'sub')}
            ${row('Inversión en producción', '− ' + U.money(k.inversion), 'sub')}
            ${row('Gastos operativos', '− ' + U.money(k.gastos), 'sub')}
            ${row('Total salidas', U.money(egresos), 'total')}
            ${row('Flujo neto', `<span class="${ingresos - egresos < 0 ? 'bad' : 'good'}">${U.money(ingresos - egresos)}</span>`, 'total grand')}
          </tbody></table>
          <div class="list mt">
            ${credito ? `<div class="list-row"><span class="text-2">Ventas al crédito (por cobrar)</span><b>${U.money(credito)}</b></div>` : ''}
            <div class="list-row"><span class="text-2">Compras del periodo pendientes de pago</span><b>${U.money(comprasPend)}</b></div>
          </div>
        </div>
      </div>
      <div class="grid grid-3-1 mt">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Entradas vs. salidas por semana</div><div class="card-sub">Flujo de caja</div></div></div>
          ${UI.legend([['Entradas', UI.css('--s3')], ['Salidas', UI.css('--s2')]])}
          <div class="chart-box"><canvas id="chFlujo"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Ventas por medio de pago</div></div>
          <div class="list">${Object.entries(porMetodo).sort((a, b) => b[1] - a[1]).map(([mt, v]) => `
            <div class="list-row"><span>${U.esc(mt)}</span><span><b>${U.money(v)}</b> <span class="muted">${U.pct(k.total ? v / k.total * 100 : 0)}</span></span></div>`).join('') || '<div class="empty">Sin ventas.</div>'}</div>
        </div>
      </div>`;

    // Semanas (lunes como inicio)
    let dias = U.dias(r);
    if (!dias.length) { const f = D.ventas.map(v => v.fecha.slice(0, 10)).sort(); dias = f.length ? U.dias({ desde: f[0], hasta: U.today() }) : []; }
    const semana = d => { const x = U.parse(d); const dow = (x.getDay() + 6) % 7; return U.addDays(d, -dow); };
    const keys = [...new Set(dias.map(semana))];
    const ent = {}, sal = {};
    keys.forEach(s => { ent[s] = 0; sal[s] = 0; });
    const add = (o, f, v) => { const s = semana(f.slice(0, 10)); if (s in o) o[s] += v; };
    k.ventas.forEach(v => { if (v.metodo !== 'Crédito') add(ent, v.fecha, v.total); });
    k.movs.forEach(m => add(m.tipo === 'ingreso' ? ent : sal, m.fecha, m.monto));
    compras.filter(c => c.estado === 'pagado').forEach(c => add(sal, c.fecha, c.total));
    k.lotes.forEach(l => add(sal, l.fecha, l.inversion));
    const s = UI.series();
    const bar = { borderRadius: 4, borderSkipped: 'bottom', maxBarThickness: 26 };
    UI.chart(document.getElementById('chFlujo'), {
      type: 'bar',
      data: {
        labels: keys.map(k2 => 'Sem. ' + U.shortDay(k2)),
        datasets: [
          { label: 'Entradas', data: keys.map(k2 => U.r2(ent[k2])), backgroundColor: s[2], ...bar },
          { label: 'Salidas', data: keys.map(k2 => U.r2(sal[k2])), backgroundColor: s[1], ...bar }
        ]
      },
      options: { datasets: { bar: { categoryPercentage: 0.7, barPercentage: 0.92 } } }
    });
  },

  renderMovs(el, r) {
    const D = Store.data;
    const lista = D.movimientos.filter(m => U.enRango(m.fecha, r) && (!this.tipo || m.tipo === this.tipo) && (!this.cat || m.categoria === this.cat))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const g = U.sum(lista.filter(m => m.tipo === 'gasto'), m => m.monto);
    const i = U.sum(lista.filter(m => m.tipo === 'ingreso'), m => m.monto);
    const cats = [...new Set(D.movimientos.map(m => m.categoria))].sort();
    el.innerHTML = `
      <div class="toolbar">
        <select class="select" data-change="tipo" aria-label="Tipo"><option value="">Gastos e ingresos</option>
          <option value="gasto" ${this.tipo === 'gasto' ? 'selected' : ''}>Solo gastos</option><option value="ingreso" ${this.tipo === 'ingreso' ? 'selected' : ''}>Solo ingresos</option></select>
        <select class="select" data-change="cat" aria-label="Categoría"><option value="">Todas las categorías</option>
          ${cats.map(c => `<option ${c === this.cat ? 'selected' : ''}>${U.esc(c)}</option>`).join('')}</select>
        <span class="spacer"></span><span class="text-2">Gastos: <b>${U.money(g)}</b> · Otros ingresos: <b>${U.money(i)}</b></span>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Descripción</th><th>Medio</th><th class="num">Monto</th><th></th></tr></thead>
        <tbody>${lista.map(m => `<tr>
          <td class="nowrap">${U.fmtDate(m.fecha)}</td>
          <td>${m.tipo === 'gasto' ? '<span class="badge bad">Gasto</span>' : '<span class="badge ok">Ingreso</span>'}</td>
          <td>${U.esc(m.categoria)}</td><td>${U.esc(m.descripcion)}</td><td>${U.esc(m.metodo || '')}</td>
          <td class="num cell-main ${m.tipo === 'gasto' ? 'bad' : 'good'}">${m.tipo === 'gasto' ? '− ' : '+ '}${U.money(m.monto)}</td>
          <td class="actions"><button class="icon-btn" data-act="editar" data-id="${m.id}" aria-label="Editar">${ICON.edit}</button>
            <button class="icon-btn danger" data-act="borrar" data-id="${m.id}" aria-label="Eliminar">${ICON.trash}</button></td></tr>`).join('') ||
          '<tr><td colspan="7" class="empty">Sin movimientos en este periodo.</td></tr>'}</tbody></table></div>`;
  },

  editor(mov, tipo) {
    const d = mov || { tipo, fecha: U.today(), categoria: '', descripcion: '', monto: '', metodo: 'Efectivo' };
    const opts = t => this.CATS[t].map(c => `<option ${c === d.categoria ? 'selected' : ''}>${c}</option>`).join('');
    const m = UI.modal({
      title: (mov ? 'Editar ' : 'Registrar ') + (d.tipo === 'gasto' ? 'gasto' : 'ingreso'),
      body: `<div class="form-grid">
        <div class="field"><label>Tipo</label><select class="select" name="tipo"><option value="gasto" ${d.tipo === 'gasto' ? 'selected' : ''}>Gasto</option><option value="ingreso" ${d.tipo === 'ingreso' ? 'selected' : ''}>Otro ingreso</option></select></div>
        <div class="field"><label>Fecha</label><input class="input" type="date" name="fecha" value="${d.fecha}"></div>
        <div class="field"><label>Categoría</label><select class="select" name="categoria">${opts(d.tipo)}</select></div>
        <div class="field"><label>Monto</label><input class="input" type="number" min="0" step="0.01" name="monto" value="${d.monto}"></div>
        <div class="field full"><label>Descripción</label><input class="input" name="descripcion" value="${U.esc(d.descripcion)}" placeholder="Ej.: Recibo de luz de octubre"></div>
        <div class="field"><label>Medio de pago</label><select class="select" name="metodo">${['Efectivo', 'QR', 'Tarjeta', 'Transferencia'].map(x => `<option ${x === d.metodo ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      </div>
      <p class="muted">Las compras de mercadería se registran en "Compras"; aquí van los gastos del negocio (alquiler, servicios, sueldos…).</p>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Guardar</button>`
    });
    m.querySelector('[name=tipo]').onchange = e => { m.querySelector('[name=categoria]').innerHTML = opts(e.target.value); };
    m.querySelector('[data-ok]').onclick = () => {
      const f = UI.form(m);
      const monto = Number(f.monto);
      if (!(monto > 0)) { UI.toast('Ingresa un monto válido', 'err'); return; }
      const obj = { tipo: f.tipo, fecha: f.fecha || U.today(), categoria: f.categoria, descripcion: f.descripcion.trim() || f.categoria, monto: U.r2(monto), metodo: f.metodo };
      if (mov) Object.assign(mov, obj); else Store.data.movimientos.push({ id: U.uid(), ...obj });
      Store.save(); UI.closeModal(); App.refresh(); UI.toast('Movimiento guardado');
    };
  }
};
