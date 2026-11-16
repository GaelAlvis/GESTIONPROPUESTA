window.Views = window.Views || {};

/* Producción por lotes (escabeches): cuánto se invirtió, cuánto se produjo y cuánto se gana */
Views.produccion = {
  periodo: '90d', prod: '',

  /** Valores esperados de un lote según los precios actuales del producto */
  calc(l) {
    const p = Store.producto(l.productoId);
    const pFinal = p ? Pricing.precioMenor(p) : 0;
    const pMayor = p ? Pricing.precioMayorMin(p) : 0;
    const vFinal = l.cantidad * pFinal, vMayor = l.cantidad * pMayor;
    return { p, pFinal, pMayor, vFinal, vMayor, gFinal: vFinal - l.inversion, gMayor: vMayor - l.inversion };
  },

  render(el) {
    const D = Store.data;
    const r = U.rango(this.periodo);
    const lotes = D.producciones.filter(l => U.enRango(l.fecha, r) && (!this.prod || l.productoId === this.prod))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const producidos = [...new Set(D.producciones.map(l => l.productoId))];
    const inv = U.sum(lotes, l => l.inversion);
    const uds = U.sum(lotes, l => l.cantidad);
    const gFinal = U.sum(lotes, l => this.calc(l).gFinal);
    const gMayor = U.sum(lotes, l => this.calc(l).gMayor);

    // Ganancia real: lo que efectivamente se vendió de los productos que se fabrican
    const ids = new Set(this.prod ? [this.prod] : producidos);
    let vendido = 0, costo = 0;
    D.ventas.filter(v => U.enRango(v.fecha, r)).forEach(v => {
      const f = v.bruto ? v.total / v.bruto : 1;
      v.items.forEach(i => { if (ids.has(i.productoId)) { vendido += i.subtotal * f; costo += i.costo; } });
    });
    const unidad = (Store.producto(this.prod || producidos[0]) || {}).unidad || 'und';

    el.innerHTML = `
      <div class="toolbar">
        ${UI.periodo(this.periodo)}
        <select class="select" data-change="prod" aria-label="Producto"><option value="">Todos los productos</option>
          ${D.productos.filter(p => producidos.includes(p.id)).map(p => `<option value="${p.id}" ${p.id === this.prod ? 'selected' : ''}>${U.esc(p.nombre)}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn" data-act="csv">${ICON.download} Exportar</button>
        <button class="btn btn-primary" data-act="nuevo">${ICON.plus} Nuevo lote de producción</button>
      </div>
      <div class="grid grid-kpi">
        ${Views.dashboard.kpi('Inversión', U.money(inv), U.num(lotes.length) + ' lotes en el periodo')}
        ${Views.dashboard.kpi('Producción', U.num(uds) + ' <span style="font-size:15px;font-weight:600">' + U.esc(unidad) + 's</span>', 'Costo promedio ' + U.money(uds ? inv / uds : 0) + ' c/u')}
        ${Views.dashboard.kpi('Ganancia esperada', `<span class="${gFinal < 0 ? 'bad' : ''}">${U.money(gFinal)}</span>`, 'Vendiendo todo al cliente final · ' + U.money(gMayor) + ' si es por mayor')}
        ${Views.dashboard.kpi('Ganancia real (ventas)', `<span class="${vendido - costo < 0 ? 'bad' : ''}">${U.money(vendido - costo)}</span>`, 'Vendido ' + U.money(vendido) + ' − costo ' + U.money(costo))}
      </div>
      <div class="card mt">
        <div class="card-head"><div><div class="card-title">Inversión y ganancia por lote</div><div class="card-sub">Últimos lotes · ganancia esperada vendiendo al cliente final</div></div></div>
        ${UI.legend([['Inversión', UI.css('--s2')], ['Ganancia esperada', UI.css('--s3')]])}
        <div class="chart-box"><canvas id="chLotes"></canvas></div>
      </div>
      <div class="card mt">
        <div class="card-head"><div class="card-title">Lotes de producción</div><span class="muted">${U.num(lotes.length)} lotes</span></div>
        <div class="table-wrap flat"><table>
          <thead><tr><th>Lote</th><th>Fecha</th><th style="min-width:180px">Producto</th><th class="num">Inversión</th><th class="num">Producción</th>
            <th class="num">Costo c/u</th><th class="num">Ganancia mayorista</th><th class="num">Ganancia cliente final</th><th></th></tr></thead>
          <tbody>${lotes.map(l => {
            const c = this.calc(l);
            return `<tr>
              <td class="cell-main nowrap">${U.esc(l.numero)}</td><td class="nowrap">${U.fmtDate(l.fecha)}</td><td>${U.esc(l.nombre)}</td>
              <td class="num cell-main">${U.money(l.inversion)}</td><td class="num">${U.num(l.cantidad)} ${U.esc(c.p ? c.p.unidad : '')}s</td>
              <td class="num">${U.money(l.costoUnit)}</td>
              <td class="num"><span class="${c.gMayor < 0 ? 'bad' : 'good'}">${U.money(c.gMayor)}</span></td>
              <td class="num cell-main"><span class="${c.gFinal < 0 ? 'bad' : 'good'}">${U.money(c.gFinal)}</span></td>
              <td class="actions"><button class="icon-btn" data-act="ver" data-id="${l.id}" aria-label="Ver detalle" title="Ver insumos">${ICON.eye}</button>
                <button class="icon-btn danger" data-act="borrar" data-id="${l.id}" aria-label="Anular lote" title="Anular lote">${ICON.trash}</button></td></tr>`;
          }).join('') || '<tr><td colspan="9" class="empty">Sin lotes en este periodo. Registra uno con "Nuevo lote de producción".</td></tr>'}</tbody></table></div>
      </div>`;

    UI.bind(el, {
      periodo: v => { this.periodo = v; App.refresh(); },
      prod: v => { this.prod = v; App.refresh(); },
      nuevo: () => this.editor(),
      ver: id => this.detalle(D.producciones.find(l => l.id === id)),
      borrar: id => {
        const l = D.producciones.find(x => x.id === id);
        UI.confirm(`¿Anular el lote <b>${U.esc(l.numero)}</b>? Se descontarán ${U.num(l.cantidad)} unidades del stock de ${U.esc(l.nombre)}.`, () => {
          Ops.anularProduccion(Store.data, id); Store.save(); App.refresh(); UI.toast('Lote anulado');
        }, { ok: 'Anular lote' });
      },
      csv: () => {
        const rows = [['Lote', 'Fecha', 'Producto', 'Inversión', 'Producción', 'Costo unitario', 'Ganancia mayorista', 'Ganancia cliente final', 'Insumos']];
        lotes.forEach(l => { const c = this.calc(l); rows.push([l.numero, U.fmtDate(l.fecha), l.nombre, l.inversion, l.cantidad, l.costoUnit, U.r2(c.gMayor), U.r2(c.gFinal), l.insumos.map(i => `${i.nombre} ${i.cantidad || ''}: ${i.costo}`).join(' | ')]); });
        U.download('produccion.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
      }
    });

    const ult = lotes.slice(0, 14).reverse();
    const cv = document.getElementById('chLotes');
    if (!ult.length) { cv.parentElement.innerHTML = '<div class="empty">Sin lotes en este periodo.</div>'; return; }
    const s = UI.series();
    const bar = { borderSkipped: 'bottom', maxBarThickness: 34 };
    UI.chart(cv, {
      type: 'bar',
      data: {
        labels: ult.map(l => l.numero),
        datasets: [
          { label: 'Inversión', data: ult.map(l => l.inversion), backgroundColor: s[1], ...bar },
          { label: 'Ganancia esperada', data: ult.map(l => U.r2(Math.max(0, this.calc(l).gFinal))), backgroundColor: s[2], borderRadius: 4, ...bar }
        ]
      },
      options: {
        scales: { x: { stacked: true }, y: { stacked: true } },
        plugins: { tooltip: { callbacks: {
          title: items => { const l = ult[items[0].dataIndex]; return l.numero + ' · ' + l.nombre; },
          footer: items => { const l = ult[items[0].dataIndex]; return U.num(l.cantidad) + ' unidades · venta ' + U.money(this.calc(l).vFinal); }
        } } }
      }
    });
  },

  detalle(l) {
    const c = this.calc(l);
    UI.modal({
      title: 'Lote ' + l.numero + ' · ' + l.nombre,
      body: `<div class="list" style="margin-bottom:12px">
          <div class="list-row"><span class="text-2">Fecha</span><b>${U.fmtDateTime(l.fecha)}</b></div>
          <div class="list-row"><span class="text-2">Producción</span><b>${U.num(l.cantidad)} ${U.esc(c.p ? c.p.unidad : '')}s</b></div>
        </div>
        <div class="table-wrap flat"><table>
          <thead><tr><th>Insumo / costo</th><th>Cantidad</th><th class="num">Monto</th></tr></thead>
          <tbody>${l.insumos.map(i => `<tr><td>${U.esc(i.nombre)}</td><td class="text-2">${U.esc(i.cantidad || '')}</td><td class="num">${U.money(i.costo)}</td></tr>`).join('')}
            <tr class="total-row"><td>Inversión total</td><td></td><td class="num">${U.money(l.inversion)}</td></tr></tbody></table></div>
        <table class="statement mt"><tbody>
          <tr><td>Costo por ${U.esc(c.p ? c.p.unidad : 'unidad')}</td><td class="num">${U.money(l.costoUnit)}</td></tr>
          <tr><td>Venta esperada al cliente final (${U.money(c.pFinal)} c/u)</td><td class="num">${U.money(c.vFinal)}</td></tr>
          <tr class="total"><td>Ganancia esperada cliente final</td><td class="num ${c.gFinal < 0 ? 'bad' : 'good'}">${U.money(c.gFinal)}</td></tr>
          <tr><td>Venta esperada por mayor (${U.money(c.pMayor)} c/u)</td><td class="num">${U.money(c.vMayor)}</td></tr>
          <tr class="total"><td>Ganancia esperada mayorista</td><td class="num ${c.gMayor < 0 ? 'bad' : 'good'}">${U.money(c.gMayor)}</td></tr>
        </tbody></table>
        ${l.notas ? `<p class="muted">${U.esc(l.notas)}</p>` : ''}`,
      footer: '<button class="btn" data-close>Cerrar</button>'
    });
  },

  editor() {
    const D = Store.data;
    const producidos = [...new Set(D.producciones.map(l => l.productoId))];
    const opciones = [...D.productos].sort((a, b) => (producidos.includes(b.id) ? 1 : 0) - (producidos.includes(a.id) ? 1 : 0));
    if (!opciones.length) { UI.toast('Primero crea el producto en "Productos e inventario"', 'err'); return; }
    let insumos = [];
    const m = UI.modal({
      title: 'Nuevo lote de producción',
      size: 'lg',
      body: `<div class="form-grid" id="lForm">
          <div class="field full"><label>Producto que se fabrica</label><select class="select" name="productoId">
            ${opciones.map(p => `<option value="${p.id}">${U.esc(p.nombre)}</option>`).join('')}</select></div>
          <div class="field"><label>Cantidad producida</label><input class="input" type="number" name="cantidad" min="1" step="1" placeholder="Ej.: 120"></div>
          <div class="field"><label>Fecha</label><input class="input" type="date" name="fecha" value="${U.today()}"></div>
          <div class="field full"><label>Nota (opcional)</label><input class="input" name="notas" placeholder="Ej.: Lote para pedido de Pensión El Buen Sabor"></div>
        </div>
        <div class="card-head mt" style="margin-bottom:6px"><h3 style="font-size:15px;margin:0">Inversión: insumos y otros costos</h3>
          <button class="btn btn-sm" data-act="receta">Copiar del último lote</button></div>
        <div id="insEditor"></div>
        <button class="btn btn-sm mt" data-act="addIns">${ICON.plus} Agregar insumo o costo</button>
        <div id="lResumen" class="mt"></div>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-act="guardar">Registrar lote</button>`
    });
    const sel = () => Store.producto(m.querySelector('[name=productoId]').value);
    const ultimo = () => [...D.producciones].filter(l => l.productoId === sel().id).sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
    const draw = () => {
      m.querySelector('#insEditor').innerHTML = insumos.length ? `<div class="ins-row ins-head"><span>Insumo o costo</span><span>Cantidad</span><span>Monto (${U.esc(D.config.moneda)})</span><span></span></div>` + insumos.map((i, k) => `
        <div class="ins-row">
          <input class="input sm" value="${U.esc(i.nombre)}" data-k="nombre" data-i="${k}" placeholder="Ej.: Zanahoria" aria-label="Insumo">
          <input class="input sm" value="${U.esc(i.cantidad)}" data-k="cantidad" data-i="${k}" placeholder="Ej.: 15 kg" aria-label="Cantidad">
          <input class="input sm" type="number" min="0" step="0.01" value="${i.costo}" data-k="costo" data-i="${k}" aria-label="Monto">
          <button class="icon-btn danger" data-act="delIns" data-id="${k}" aria-label="Quitar">${ICON.trash}</button>
        </div>`).join('') : '<div class="empty" style="padding:14px">Agrega los insumos (verduras, vinagre, frascos, gas, mano de obra…).</div>';
      resumen();
    };
    const resumen = () => {
      const p = sel();
      const cant = Math.floor(Number(m.querySelector('[name=cantidad]').value) || 0);
      const inv = U.sum(insumos, i => Number(i.costo) || 0);
      const pF = Pricing.precioMenor(p), pM = Pricing.precioMayorMin(p);
      m.querySelector('#lResumen').innerHTML = `<table class="statement"><tbody>
        <tr class="total"><td>Inversión total</td><td class="num">${U.money(inv)}</td></tr>
        <tr><td>Costo por ${U.esc(p.unidad)}</td><td class="num">${cant ? U.money(inv / cant) : '—'}</td></tr>
        <tr><td>Ganancia esperada mayorista (${U.money(pM)} c/u)</td><td class="num ${cant * pM - inv < 0 ? 'bad' : 'good'}">${cant ? U.money(cant * pM - inv) : '—'}</td></tr>
        <tr class="total"><td>Ganancia esperada cliente final (${U.money(pF)} c/u)</td><td class="num ${cant * pF - inv < 0 ? 'bad' : 'good'}">${cant ? U.money(cant * pF - inv) : '—'}</td></tr>
      </tbody></table>`;
    };
    const cargarReceta = () => {
      const l = ultimo();
      insumos = l ? l.insumos.map(i => ({ ...i })) : [{ nombre: '', cantidad: '', costo: '' }];
      if (l) m.querySelector('[name=cantidad]').value = l.cantidad;
      draw();
    };
    cargarReceta();

    m.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.k) { insumos[+t.dataset.i][t.dataset.k] = t.dataset.k === 'costo' ? t.value : t.value; resumen(); }
      if (t.name === 'cantidad') resumen();
    });
    m.querySelector('[name=productoId]').onchange = cargarReceta;
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'addIns') { insumos.push({ nombre: '', cantidad: '', costo: '' }); draw(); const ins = m.querySelectorAll('.ins-row input[data-k=nombre]'); ins[ins.length - 1].focus(); }
      if (b.dataset.act === 'delIns') { insumos.splice(+b.dataset.id, 1); draw(); }
      if (b.dataset.act === 'receta') { if (!ultimo()) { UI.toast('Este producto aún no tiene lotes', 'err'); return; } cargarReceta(); UI.toast('Insumos copiados del lote ' + ultimo().numero); }
      if (b.dataset.act === 'guardar') guardar();
    });

    const guardar = () => {
      const f = UI.form(m.querySelector('#lForm'));
      const cantidad = Math.floor(Number(f.cantidad) || 0);
      const lista = insumos.filter(i => i.nombre.trim() || Number(i.costo) > 0).map(i => ({ nombre: i.nombre.trim() || 'Insumo', cantidad: (i.cantidad || '').trim(), costo: U.r2(Number(i.costo) || 0) }));
      if (!(cantidad > 0)) { UI.toast('Indica cuántas unidades se produjeron', 'err'); return; }
      if (!lista.length || !(U.sum(lista, i => i.costo) > 0)) { UI.toast('Registra al menos un insumo con su monto', 'err'); return; }
      const lote = { id: U.uid(), numero: Store.siguiente('lote', 'L-', 4), fecha: (f.fecha || U.today()) + U.nowStr().slice(10), productoId: f.productoId, cantidad, insumos: lista, notas: f.notas.trim() };
      Ops.aplicarProduccion(Store.data, lote);
      Store.save(); UI.closeModal(); App.refresh();
      UI.toast(`Lote ${lote.numero}: +${U.num(cantidad)} al stock · inversión ${U.money(lote.inversion)}`);
    };
  }
};
