window.Views = window.Views || {};

Views.dashboard = {
  periodo: '30d',

  calcular(r) {
    const D = Store.data;
    const ventas = D.ventas.filter(v => U.enRango(v.fecha, r));
    const movs = D.movimientos.filter(m => U.enRango(m.fecha, r));
    const total = U.sum(ventas, v => v.total);
    const costo = U.sum(ventas, v => v.costoTotal);
    const gastos = U.sum(movs.filter(m => m.tipo === 'gasto'), m => m.monto);
    const otros = U.sum(movs.filter(m => m.tipo === 'ingreso'), m => m.monto);
    const mermas = (D.mermas || []).filter(m => U.enRango(m.fecha, r));
    const perdida = U.sum(mermas, m => m.perdida);
    const lotes = (D.producciones || []).filter(l => U.enRango(l.fecha, r));
    const inversion = U.sum(lotes, l => l.inversion);
    return { ventas, movs, total, costo, bruta: total - costo, gastos, otros, mermas, perdida, lotes, inversion, neta: total - costo - perdida - gastos + otros };
  },

  render(el) {
    const D = Store.data;
    const r = U.rango(this.periodo);
    const k = this.calcular(r);

    // Periodo anterior de igual duración (para comparar)
    let prev = null;
    if (this.periodo !== 'todo') {
      const n = U.dias(r).length;
      prev = this.calcular({ desde: U.addDays(r.desde, -n), hasta: U.addDays(r.desde, -1) });
    }
    // invertir = true cuando bajar es bueno (gastos)
    const delta = (a, b, invertir = false) => {
      if (!prev || !b) return '';
      const p = (a - b) / Math.abs(b) * 100;
      const bueno = invertir ? p <= 0 : p >= 0;
      return `<span class="${bueno ? 'up' : 'down'}">${p >= 0 ? '▲' : '▼'} ${U.pct(Math.abs(p))}</span> vs. periodo anterior`;
    };

    const nV = k.ventas.length;
    const ticket = nV ? k.total / nV : 0;
    const invValor = U.sum(D.productos, p => Math.max(0, p.stock) * p.costo);
    const invVenta = U.sum(D.productos, p => Math.max(0, p.stock) * Pricing.precioMenor(p));

    // Mayor vs menor (por línea, prorrateando descuentos)
    let mayor = 0, menor = 0;
    k.ventas.forEach(v => {
      const f = v.bruto ? v.total / v.bruto : 1;
      v.items.forEach(i => { if (i.canal === 'mayor') mayor += i.subtotal * f; else menor += i.subtotal * f; });
    });
    const pMayor = (mayor + menor) ? mayor / (mayor + menor) * 100 : 0;

    const stockBajo = D.productos.filter(p => p.stock <= p.stockMin).sort((a, b) => a.stock / a.stockMin - b.stock / b.stockMin);
    const limite = U.addDays(U.today(), D.config.diasVencimiento || 30);
    const porVencer = D.productos.filter(p => p.vence && p.vence <= limite).sort((a, b) => a.vence.localeCompare(b.vence));
    const pendientes = D.compras.filter(c => c.estado === 'pendiente');
    const porPagar = U.sum(pendientes, c => c.total);

    el.innerHTML = `
      <div class="toolbar">
        ${UI.periodo(this.periodo)}
        <span class="muted">${r.desde === '0000-01-01' ? 'Todo el historial' : U.fmtDate(r.desde) + ' – ' + U.fmtDate(r.hasta)}</span>
        <span class="spacer"></span>
        <a class="btn btn-primary" href="#/ventas">${ICON.plus} Nueva venta</a>
      </div>

      <div class="grid grid-kpi">
        ${this.kpi('Ventas', U.money(k.total), delta(k.total, prev && prev.total) || `${U.num(nV)} ventas`)}
        ${this.kpi('Utilidad bruta', U.money(k.bruta), `Margen ${U.pct(k.total ? k.bruta / k.total * 100 : 0)}`)}
        ${this.kpi('Gastos operativos', U.money(k.gastos), delta(k.gastos, prev && prev.gastos, true) || '&nbsp;')}
        ${this.kpi('Utilidad neta', `<span class="${k.neta < 0 ? 'bad' : ''}">${U.money(k.neta)}</span>`, delta(k.neta, prev && prev.neta) || 'Ventas − costo − mermas − gastos')}
        ${this.kpi('Ticket promedio', U.money(ticket), `${U.num(nV)} ventas en el periodo`)}
        ${this.kpi('Inventario (al costo)', U.money(invValor), `Valor a precio menor: ${U.moneyShort(invVenta)}`)}
        ${this.kpi('<a href="#/mermas">Productos dañados</a>', U.money(k.perdida), `${U.num(U.sum(k.mermas.filter(m => (Store.producto(m.productoId) || {}).unidad === 'huevo'), m => m.cantidad))} huevos dañados ` + (delta(k.perdida, prev && prev.perdida, true) ? '· ' + delta(k.perdida, prev && prev.perdida, true).replace(' vs. periodo anterior', '') : ''))}
        ${this.kpi('<a href="#/produccion">Invertido en producción</a>', U.money(k.inversion), `${U.num(k.lotes.length)} lotes · ${U.num(U.sum(k.lotes, l => l.cantidad))} unidades producidas`)}
      </div>

      <div class="grid grid-3-1 mt">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Ventas por día</div><div class="card-sub">Por menor y por mayor, en ${U.esc(D.config.moneda)}</div></div></div>
          ${UI.legend([['Por menor', UI.css('--s1')], ['Por mayor', UI.css('--s2')]])}
          <div class="chart-box"><canvas id="chVentas" aria-label="Ventas por día"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Por mayor vs. por menor</div></div>
          <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:10px">
            <div><div class="kpi-label"><i style="width:10px;height:10px;border-radius:3px;background:var(--s1);display:inline-block"></i>Por menor</div>
              <div class="kpi-value" style="font-size:21px">${U.money(menor)}</div><div class="kpi-foot">${U.pct(100 - pMayor)} del total</div></div>
            <div class="right"><div class="kpi-label" style="justify-content:flex-end"><i style="width:10px;height:10px;border-radius:3px;background:var(--s2);display:inline-block"></i>Por mayor</div>
              <div class="kpi-value" style="font-size:21px">${U.money(mayor)}</div><div class="kpi-foot">${U.pct(pMayor)} del total</div></div>
          </div>
          <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:2px;background:var(--surface)">
            <div style="flex:${100 - pMayor};background:var(--s1);border-radius:4px"></div>
            <div style="flex:${pMayor};background:var(--s2);border-radius:4px"></div>
          </div>
          <div class="list mt">
            <div class="list-row"><span class="text-2">Ventas por mayor</span><b>${U.num(k.ventas.filter(v => v.tipo === 'mayor').length)}</b></div>
            <div class="list-row"><span class="text-2">Ventas por menor</span><b>${U.num(k.ventas.filter(v => v.tipo === 'menor').length)}</b></div>
            <div class="list-row"><span class="text-2">Ahorro otorgado a mayoristas</span><b>${U.money(U.sum(k.ventas, v => v.ahorro || 0))}</b></div>
          </div>
        </div>
      </div>

      <div class="grid grid-2 mt">
        <div class="card">
          <div class="card-head"><div><div class="card-title">Productos más vendidos</div><div class="card-sub">Top 7 por monto vendido</div></div></div>
          <div class="chart-box"><canvas id="chTop" aria-label="Productos más vendidos"></canvas></div>
        </div>
        <div class="card">
          <div class="card-head"><div><div class="card-title">Gastos por categoría</div><div class="card-sub">Total ${U.money(k.gastos)}</div></div>
            <a href="#/caja" class="btn btn-sm">Ver caja</a></div>
          <div class="chart-box"><canvas id="chGastos" aria-label="Gastos por categoría"></canvas></div>
        </div>
      </div>

      <div class="grid grid-kpi mt" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
        <div class="card">
          <div class="card-head"><div class="card-title">Stock bajo</div><span class="badge ${stockBajo.length ? 'warn' : 'ok'}">${stockBajo.length ? ICON.alert : ICON.check} ${stockBajo.length} productos</span></div>
          <div class="list">${stockBajo.slice(0, 6).map(p => `
            <div class="list-row"><div><div class="cell-main">${U.esc(p.nombre)}</div><div class="cell-sub">Mínimo ${U.num(p.stockMin)} ${U.esc(p.unidad)}</div></div>
            <b class="${p.stock <= 0 ? 'bad' : ''}">${U.num(p.stock)} ${U.esc(p.unidad)}</b></div>`).join('') || '<div class="empty">Todo el inventario está sobre el mínimo.</div>'}
          </div>
          ${stockBajo.length ? '<a href="#/compras" class="btn btn-sm mt">Registrar compra</a>' : ''}
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Próximos a vencer</div><span class="badge ${porVencer.length ? 'warn' : 'ok'}">${porVencer.length ? ICON.clock : ICON.check} ${porVencer.length} productos</span></div>
          <div class="list">${porVencer.slice(0, 6).map(p => {
            const dias = Math.round((U.parse(p.vence) - U.parse(U.today())) / 864e5);
            return `<div class="list-row"><div><div class="cell-main">${U.esc(p.nombre)}</div><div class="cell-sub">Vence ${U.fmtDate(p.vence)}</div></div>
              <span class="badge ${dias < 0 ? 'bad' : 'warn'}">${dias < 0 ? 'Vencido' : 'En ' + dias + ' días'}</span></div>`;
          }).join('') || `<div class="empty">Nada vence en los próximos ${D.config.diasVencimiento} días.</div>`}</div>
        </div>
        <div class="card">
          <div class="card-head"><div class="card-title">Cuentas por pagar</div><span class="badge ${pendientes.length ? 'warn' : 'ok'}">${pendientes.length} compras</span></div>
          <div class="kpi-value">${U.money(porPagar)}</div>
          <div class="list mt">${pendientes.slice(0, 4).map(c => `
            <div class="list-row"><div><div class="cell-main">${U.esc((Store.proveedor(c.proveedorId) || {}).nombre || '—')}</div><div class="cell-sub">${c.numero} · ${U.fmtDate(c.fecha)}</div></div><b>${U.money(c.total)}</b></div>`).join('') || '<div class="empty">Sin deudas con proveedores.</div>'}
          </div>
        </div>
      </div>`;

    UI.bind(el, { periodo: v => { this.periodo = v; App.refresh(); } });
    this.charts(k, r);
  },

  kpi(label, value, foot) {
    return `<div class="card kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div><div class="kpi-foot">${foot}</div></div>`;
  },

  charts(k, r) {
    const s = UI.series();
    // Ventas por día (apiladas por canal)
    let dias = U.dias(r);
    if (!dias.length) {
      const fechas = Store.data.ventas.map(v => v.fecha.slice(0, 10)).sort();
      dias = fechas.length ? U.dias({ desde: fechas[0], hasta: U.today() }) : [];
    }
    const idx = {}; dias.forEach((d, i) => idx[d] = i);
    const men = dias.map(() => 0), may = dias.map(() => 0);
    k.ventas.forEach(v => {
      const i = idx[v.fecha.slice(0, 10)]; if (i == null) return;
      const f = v.bruto ? v.total / v.bruto : 1;
      v.items.forEach(it => { if (it.canal === 'mayor') may[i] += it.subtotal * f; else men[i] += it.subtotal * f; });
    });
    const bar = { borderRadius: 4, borderSkipped: 'bottom', maxBarThickness: 28, borderColor: UI.css('--surface'), borderWidth: { top: 2 } };
    UI.chart(document.getElementById('chVentas'), {
      type: 'bar',
      data: {
        labels: dias.map(U.shortDay),
        datasets: [
          { label: 'Por menor', data: men.map(U.r2), backgroundColor: s[0], ...bar, borderRadius: 0 },
          { label: 'Por mayor', data: may.map(U.r2), backgroundColor: s[1], ...bar }
        ]
      },
      options: {
        scales: { x: { stacked: true }, y: { stacked: true } },
        plugins: { tooltip: { callbacks: { footer: items => 'Total: ' + U.money(items.reduce((a, b) => a + b.parsed.y, 0)) } } }
      }
    });

    // Top productos
    const porProd = {};
    k.ventas.forEach(v => v.items.forEach(i => { porProd[i.nombre] = (porProd[i.nombre] || 0) + i.subtotal; }));
    const top = Object.entries(porProd).sort((a, b) => b[1] - a[1]).slice(0, 7);
    this.hbar('chTop', top, s[0], 'Vendido');

    // Gastos por categoría
    const porCat = {};
    k.movs.filter(m => m.tipo === 'gasto').forEach(m => { porCat[m.categoria] = (porCat[m.categoria] || 0) + m.monto; });
    this.hbar('chGastos', Object.entries(porCat).sort((a, b) => b[1] - a[1]), s[1], 'Gasto');
  },

  hbar(id, entries, color, label) {
    const cv = document.getElementById(id);
    if (!entries.length) { cv.parentElement.innerHTML = '<div class="empty">Sin datos en este periodo.</div>'; return; }
    UI.chart(cv, {
      type: 'bar',
      data: { labels: entries.map(e => e[0]), datasets: [{ label, data: entries.map(e => U.r2(e[1])), backgroundColor: color, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 22 }] },
      options: {
        indexAxis: 'y',
        interaction: { mode: 'nearest', axis: 'y', intersect: false },
        scales: {
          x: { grid: { color: UI.css('--grid'), display: true }, border: { display: false }, ticks: { callback: v => U.moneyShort(v) } },
          y: { grid: { display: false }, border: { color: UI.css('--axis'), display: true }, ticks: { color: UI.css('--text-2'), callback: function (v) { return this.getLabelForValue(v); } } }
        },
        plugins: { tooltip: { callbacks: { label: ctx => ' ' + U.money(ctx.parsed.x) } } }
      }
    });
  }
};
