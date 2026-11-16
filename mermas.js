window.Views = window.Views || {};

/* Mermas: huevos (u otros productos) dañados, con reporte de cantidad, pérdida y motivo */
Views.mermas = {
  periodo: '30d', prod: '', motivo: '',
  MOTIVOS: ['Rotos en transporte', 'Rotos en manipulación', 'Trizados / rajados', 'Sucios / descartados', 'Podridos o vencidos', 'Frasco roto', 'Otro'],

  /** "1.234 huevos (≈ 41 maples)" */
  cant(p, n) {
    if (!p) return U.num(n);
    const ref = Pricing.presRef(p);
    const eq = ref.factor > 1 && n >= ref.factor ? ` <span class="muted">(≈ ${U.num(n / ref.factor, 1)} ${U.esc(ref.nombre.split(' ')[0].toLowerCase())}s)</span>` : '';
    return U.num(n) + ' ' + U.esc(p.unidad) + (n !== 1 && !p.unidad.endsWith('s') ? 's' : '') + eq;
  },

  render(el) {
    const D = Store.data;
    const r = U.rango(this.periodo);
    const todas = D.mermas.filter(m => U.enRango(m.fecha, r));
    const lista = todas.filter(m => (!this.prod || m.productoId === this.prod) && (!this.motivo || m.motivo === this.motivo))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    // Huevos: dañados vs. comprados en el periodo
    const esHuevo = id => (Store.producto(id) || {}).unidad === 'huevo';
    const huevosDan = U.sum(lista.filter(m => esHuevo(m.productoId)), m => m.cantidad);
    const huevosComp = U.sum(D.compras.filter(c => U.enRango(c.fecha, r)), c => U.sum(c.items.filter(i => esHuevo(i.productoId) && (!this.prod || i.productoId === this.prod)), i => i.cantidad * i.factor));
    const perdida = U.sum(lista, m => m.perdida);
    const prodsConMerma = D.productos.filter(p => D.mermas.some(m => m.productoId === p.id));

    const porProd = {}, porMotivo = {};
    lista.forEach(m => {
      const a = porProd[m.productoId] = porProd[m.productoId] || { cant: 0, perdida: 0 };
      a.cant += m.cantidad; a.perdida += m.perdida;
      const b = porMotivo[m.motivo] = porMotivo[m.motivo] || { cant: 0, perdida: 0 };
      b.cant += m.cantidad; b.perdida += m.perdida;
    });

    el.innerHTML = `
      <div class="toolbar">
        ${UI.periodo(this.periodo)}
        <select class="select" data-change="prod" aria-label="Producto"><option value="">Todos los productos</option>
          ${prodsConMerma.map(p => `<option value="${p.id}" ${p.id === this.prod ? 'selected' : ''}>${U.esc(p.nombre)}</option>`).join('')}</select>
        <select class="select" data-change="motivo" aria-label="Motivo"><option value="">Todos los motivos</option>
          ${this.MOTIVOS.map(x => `<option ${x === this.motivo ? 'selected' : ''}>${x}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn" data-act="csv">${ICON.download} Exportar</button>
        <button class="btn btn-primary" data-act="nuevo">${ICON.plus} Registrar dañados</button>
      </div>
      <div class="grid grid-kpi">
        ${Views.dashboard.kpi('Huevos dañados', U.num(huevosDan), huevosDan >= 30 ? '≈ ' + U.num(huevosDan / 30, 1) + ' maples' : '&nbsp;')}
        ${Views.dashboard.kpi('% de lo comprado', U.pct(huevosComp ? huevosDan / huevosComp * 100 : 0), U.num(huevosComp) + ' huevos comprados en el periodo')}
        ${Views.dashboard.kpi('Pérdida al costo', `<span class="bad">${U.money(perdida)}</span>`, 'Todos los productos dañados')}
        ${Views.dashboard.kpi('Registros', U.num(lista.length), U.fmtDate(r.desde === '0000-01-01' ? (lista[lista.length - 1] || {}).fecha || U.today() : r.desde) + ' – ' + U.fmtDate(r.hasta))}
      </div>
      <div class="grid grid-3-1 mt">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Dañados por semana</div><div class="card-sub">Pérdida al costo, en ${U.esc(D.config.moneda)}</div></div></div>
          <div class="chart-box"><canvas id="chMermas"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Por motivo</div></div>
          <div class="list">${Object.entries(porMotivo).sort((a, b) => b[1].perdida - a[1].perdida).map(([mt, v]) => `
            <div class="list-row"><div><div class="cell-main">${U.esc(mt)}</div><div class="cell-sub">${U.num(v.cant)} unidades</div></div><b>${U.money(v.perdida)}</b></div>`).join('') || '<div class="empty">Sin registros.</div>'}</div>
        </div>
      </div>
      <div class="card mt">
        <div class="card-head"><div class="card-title">Por producto</div></div>
        <div class="table-wrap flat"><table>
          <thead><tr><th>Producto</th><th class="num">Cantidad dañada</th><th class="num">Pérdida</th></tr></thead>
          <tbody>${Object.entries(porProd).sort((a, b) => b[1].perdida - a[1].perdida).map(([id, v]) => {
            const p = Store.producto(id);
            return `<tr><td class="cell-main">${U.esc(p ? p.nombre : '—')}</td><td class="num">${this.cant(p, v.cant)}</td><td class="num bad">${U.money(v.perdida)}</td></tr>`;
          }).join('') || '<tr><td colspan="3" class="empty">Sin productos dañados en este periodo.</td></tr>'}</tbody></table></div>
      </div>
      <div class="card mt">
        <div class="card-head"><div class="card-title">Registro detallado</div><span class="muted">${U.num(lista.length)} registros</span></div>
        <div class="table-wrap flat"><table>
          <thead><tr><th>Fecha</th><th>Producto</th><th>Motivo</th><th class="num">Cantidad</th><th class="num">Pérdida</th><th>Nota</th><th></th></tr></thead>
          <tbody>${lista.slice(0, 150).map(m => {
            const p = Store.producto(m.productoId);
            return `<tr><td class="nowrap">${U.fmtDateTime(m.fecha)}</td><td>${U.esc(m.nombre)}</td><td>${U.esc(m.motivo)}</td>
              <td class="num">${U.num(m.cantidad)} ${U.esc(p ? p.unidad : '')}</td><td class="num bad">${U.money(m.perdida)}</td><td class="text-2">${U.esc(m.nota || '')}</td>
              <td class="actions"><button class="icon-btn danger" data-act="borrar" data-id="${m.id}" aria-label="Eliminar registro" title="Eliminar (devuelve el stock)">${ICON.trash}</button></td></tr>`;
          }).join('') || '<tr><td colspan="7" class="empty">Sin registros.</td></tr>'}</tbody></table></div>
        ${lista.length > 150 ? '<p class="muted" style="margin:10px 0 0">Se muestran los 150 más recientes. Exporta para ver todos.</p>' : ''}
      </div>`;

    UI.bind(el, {
      periodo: v => { this.periodo = v; App.refresh(); },
      prod: v => { this.prod = v; App.refresh(); },
      motivo: v => { this.motivo = v; App.refresh(); },
      nuevo: () => this.editor(),
      borrar: id => UI.confirm('¿Eliminar este registro? La cantidad vuelve al stock.', () => {
        Ops.anularMerma(Store.data, id); Store.save(); App.refresh(); UI.toast('Registro eliminado');
      }, { ok: 'Eliminar' }),
      csv: () => {
        const rows = [['Fecha', 'Producto', 'Motivo', 'Cantidad', 'Unidad', 'Costo unitario', 'Pérdida', 'Nota']];
        lista.forEach(m => rows.push([U.fmtDateTime(m.fecha), m.nombre, m.motivo, m.cantidad, (Store.producto(m.productoId) || {}).unidad || '', U.r2(m.costoUnit), m.perdida, m.nota || '']));
        U.download('productos-danados.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
      }
    });
    this.chart(lista, r);
  },

  chart(lista, r) {
    let dias = U.dias(r);
    if (!dias.length) { const f = lista.map(m => m.fecha.slice(0, 10)).sort(); dias = f.length ? U.dias({ desde: f[0], hasta: U.today() }) : []; }
    const semana = d => { const x = U.parse(d); return U.addDays(d, -((x.getDay() + 6) % 7)); };
    const keys = [...new Set(dias.map(semana))];
    const val = {}; keys.forEach(k => { val[k] = 0; });
    lista.forEach(m => { const s = semana(m.fecha.slice(0, 10)); if (s in val) val[s] += m.perdida; });
    UI.chart(document.getElementById('chMermas'), {
      type: 'bar',
      data: { labels: keys.map(k => 'Sem. ' + U.shortDay(k)), datasets: [{ label: 'Pérdida', data: keys.map(k => U.r2(val[k])), backgroundColor: UI.series()[1], borderRadius: 4, borderSkipped: 'bottom', maxBarThickness: 30 }] }
    });
  },

  editor() {
    const D = Store.data;
    const huevo = D.productos.find(p => p.unidad === 'huevo') || D.productos[0];
    if (!huevo) { UI.toast('Primero registra productos', 'err'); return; }
    const m = UI.modal({
      title: 'Registrar productos dañados',
      body: `<div class="form-grid">
          <div class="field full"><label>Producto</label><select class="select" name="productoId">
            ${D.productos.map(p => `<option value="${p.id}" ${p.id === huevo.id ? 'selected' : ''}>${U.esc(p.nombre)} (stock ${U.num(p.stock)} ${U.esc(p.unidad)})</option>`).join('')}</select></div>
          <div class="field"><label>Cantidad dañada</label><input class="input" type="number" name="cantidad" min="1" step="1" placeholder="Ej.: 12"></div>
          <div class="field"><label>Se cuenta en</label><select class="select" name="presId" id="mPres"></select></div>
          <div class="field"><label>Motivo</label><select class="select" name="motivo">${this.MOTIVOS.map(x => `<option>${x}</option>`).join('')}</select></div>
          <div class="field"><label>Fecha</label><input class="input" type="date" name="fecha" value="${U.today()}"></div>
          <div class="field full"><label>Nota (opcional)</label><input class="input" name="nota" placeholder="Ej.: Caja golpeada al descargar"></div>
        </div>
        <p class="muted" id="mInfo" style="margin-bottom:0"></p>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Registrar</button>`
    });
    const sel = () => Store.producto(m.querySelector('[name=productoId]').value);
    const drawPres = () => {
      const p = sel();
      m.querySelector('#mPres').innerHTML = p.presentaciones.map(x => `<option value="${x.id}">${U.esc(x.nombre)}${x.factor > 1 ? ` (${x.factor} ${U.esc(p.unidad)})` : ''}</option>`).join('');
      info();
    };
    const info = () => {
      const p = sel(); const f = UI.form(m);
      const pres = Pricing.pres(p, f.presId);
      const q = (Number(f.cantidad) || 0) * pres.factor;
      m.querySelector('#mInfo').innerHTML = q ? `Se descuentan <b>${U.num(q)} ${U.esc(p.unidad)}${q !== 1 ? 's' : ''}</b> del stock. Pérdida estimada: <b class="bad">${U.money(q * p.costo)}</b> (al costo de ${U.money(p.costo)} c/u).` : 'La pérdida se calcula al costo de compra o de producción.';
    };
    m.querySelector('[name=productoId]').onchange = drawPres;
    m.addEventListener('input', info);
    m.addEventListener('change', info);
    drawPres();
    m.querySelector('[data-ok]').onclick = () => {
      const p = sel(); const f = UI.form(m);
      const pres = Pricing.pres(p, f.presId);
      const q = Math.floor(Number(f.cantidad) || 0) * pres.factor;
      if (!(q > 0)) { UI.toast('Indica la cantidad dañada', 'err'); return; }
      if (q > p.stock) { UI.toast(`Solo hay ${U.num(p.stock)} ${p.unidad} en stock`, 'err'); return; }
      const hora = U.nowStr().slice(10);
      Ops.aplicarMerma(Store.data, { id: U.uid(), fecha: (f.fecha || U.today()) + hora, productoId: p.id, cantidad: q, motivo: f.motivo, nota: f.nota.trim() });
      Store.save(); UI.closeModal(); App.refresh(); UI.toast('Registrado: ' + U.num(q) + ' ' + p.unidad + (q !== 1 ? 's' : '') + ' dañados');
    };
  }
};
