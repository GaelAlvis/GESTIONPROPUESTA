window.Views = window.Views || {};

Views.ventas = {
  tab: 'pos',
  q: '', cat: '',
  cart: [],            // [{productoId, presId, cantidad}]
  cliente: '', metodo: 'Efectivo', descuento: 0,
  h: { periodo: '30d', tipo: '', q: '' },
  METODOS: ['Efectivo', 'QR', 'Tarjeta', 'Transferencia', 'Crédito'],

  render(el) {
    const n = Store.data.ventas.length;
    el.innerHTML = UI.tabs([['pos', 'Punto de venta'], ['hist', 'Historial de ventas', n]], this.tab) +
      '<div id="ventasBody"></div>';
    const body = el.querySelector('#ventasBody');
    UI.bind(el.querySelector('.tabs'), { tab: id => { this.tab = id; App.refresh(); } });
    if (this.tab === 'pos') this.renderPOS(body); else this.renderHist(body);
  },

  /* ---------------- Punto de venta ---------------- */
  renderPOS(el) {
    el.innerHTML = `
      <div class="pos">
        <div>
          <div class="toolbar">
            ${UI.search(this.q, 'Buscar producto o código…')}
            <select class="select" data-change="cat" aria-label="Categoría"><option value="">Todas las categorías</option>
              ${Store.categorias().map(c => `<option ${c === this.cat ? 'selected' : ''}>${U.esc(c)}</option>`).join('')}</select>
          </div>
          <div class="prod-grid" id="prodGrid"></div>
        </div>
        <div class="card cart" id="cart"></div>
      </div>`;
    this.renderGrid();
    this.renderCart();
    UI.bind(el, {
      q: v => { this.q = v; this.renderGrid(); },
      cat: v => { this.cat = v; this.renderGrid(); },
      add: id => this.add(id),
      quitar: i => { this.cart.splice(+i, 1); this.renderCart(); },
      vaciar: () => { this.cart = []; this.renderCart(); },
      menos: i => this.setQty(+i, this.cart[+i].cantidad - 1, true),
      mas: i => this.setQty(+i, this.cart[+i].cantidad + 1, true),
      qty: (v, t) => this.setQty(+t.dataset.i, v, false),
      qtyFix: (v, t) => this.setQty(+t.dataset.i, v, true),
      pres: (v, t) => { this.cart[+t.dataset.i].presId = v; this.cart[+t.dataset.i].cantidad = 1; this.renderCart(); },
      subir: i => {
        const l = this.cart[+i]; const s = Pricing.linea(Store.producto(l.productoId), l.presId, l.cantidad).sugerencia;
        if (s) this.setQty(+i, l.cantidad + s.falta, true);
      },
      cliente: v => { this.cliente = v; },
      metodo: v => { this.metodo = v; },
      desc: v => { this.descuento = Math.max(0, Number(v) || 0); this.updateTotals(); },
      cobrar: () => this.cobrar()
    });
  },

  renderGrid() {
    const q = this.q.trim().toLowerCase();
    const prods = Store.data.productos.filter(p =>
      (!this.cat || p.categoria === this.cat) &&
      (!q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q)));
    document.getElementById('prodGrid').innerHTML = prods.map(p => {
      const bajo = p.stock <= p.stockMin;
      const res = Pricing.resumen(p);
      return `<button class="prod-card" data-act="add" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>
        <span class="pc-cat">${U.esc(p.categoria)}</span>
        <span class="pc-name">${U.esc(p.nombre)}</span>
        <span class="pc-meta ${bajo ? 'bad' : ''}">Stock: ${res.ref.factor > 1 ? U.num(Math.floor(p.stock / res.ref.factor)) + ' ' + U.esc(res.ref.nombre.split(' ')[0].toLowerCase()) + 's' : U.num(p.stock) + ' ' + U.esc(p.unidad)}</span>
        <span class="pc-price"><b>${U.money(res.final)}</b><span class="pc-meta">${U.esc(res.ref.nombre)} · mayor ${U.money(res.mayorista)}</span></span>
      </button>`;
    }).join('') || '<div class="empty">No hay productos que coincidan.</div>';
  },

  add(id) {
    const p = Store.producto(id);
    const presId = Pricing.presRef(p).id;
    const l = this.cart.find(x => x.productoId === id && x.presId === presId);
    if (l) l.cantidad += 1; else this.cart.push({ productoId: id, presId, cantidad: 1 });
    this.renderCart();
  },

  setQty(i, v, rerender) {
    const l = this.cart[i];
    if (!l) return;
    const n = Math.floor(Number(v));
    if (rerender) {
      const nv = Math.max(1, n || 1);
      // Si no cambió (p. ej. al salir del campo), no repintar: así no se pierde el clic en curso
      if (nv === l.cantidad && String(nv) === String(v)) return;
      l.cantidad = nv;
      this.renderCart();
    } else if (n >= 1) {
      l.cantidad = n;
      this.updateLine(i);
      this.updateTotals();
    }
  },

  lineHtml(l, i) {
    const p = Store.producto(l.productoId);
    return `<div class="cart-line" data-line="${i}">
      <div class="cl-top">
        <div><div class="cl-name">${U.esc(p.nombre)}</div><div class="cell-sub">${U.esc(p.codigo || '')}</div></div>
        <button class="icon-btn danger" data-act="quitar" data-id="${i}" aria-label="Quitar">${ICON.trash}</button>
      </div>
      <div class="cl-controls">
        <select class="select sm" data-change="pres" data-i="${i}" aria-label="Presentación">
          ${p.presentaciones.map(pr => `<option value="${pr.id}" ${pr.id === l.presId ? 'selected' : ''}>${U.esc(pr.nombre)}${pr.factor > 1 ? ` (${pr.factor} ${U.esc(p.unidad)})` : ''}</option>`).join('')}
        </select>
        <div class="qty">
          <button data-act="menos" data-id="${i}" aria-label="Menos">−</button>
          <input type="number" min="1" value="${l.cantidad}" data-input="qty" data-change="qtyFix" data-i="${i}" aria-label="Cantidad">
          <button data-act="mas" data-id="${i}" aria-label="Más">+</button>
        </div>
        <div class="cl-sub"></div>
      </div>
      <div class="cl-info"></div>
      <div class="cl-extra"></div>
    </div>`;
  },

  updateLine(i) {
    const row = document.querySelector(`.cart-line[data-line="${i}"]`);
    if (!row) return;
    const l = this.cart[i];
    const p = Store.producto(l.productoId);
    const c = Pricing.linea(p, l.presId, l.cantidad);
    row.querySelector('.cl-sub').textContent = U.money(c.subtotal);
    const tramoTxt = c.tramo.total > 1 ? (c.tramo.idx > 0 ? `precio por volumen (desde ${c.tramo.min})` : 'precio normal') : '';
    row.querySelector('.cl-info').innerHTML = `${UI.canal(c.canal)} <span>${U.money(c.precioUnit)} c/u ${tramoTxt ? '· ' + tramoTxt : ''}</span>
      ${c.ahorro > 0 ? `<span class="good">· ahorra ${U.money(c.ahorro)}</span>` : ''}`;
    // Stock total requerido de este producto en todo el carrito
    const req = U.sum(this.cart.filter(x => x.productoId === p.id), x => x.cantidad * Pricing.pres(p, x.presId).factor);
    let extra = '';
    if (req > p.stock) extra = `<div class="cl-warn">Stock insuficiente: hay ${U.num(p.stock)} ${U.esc(p.unidad)} y se piden ${U.num(req)}.</div>`;
    else if (c.sugerencia && c.sugerencia.falta <= Math.max(3, c.tramo.min)) {
      extra = `<div class="cl-hint">Agrega ${c.sugerencia.falta} más y paga ${U.money(c.sugerencia.precio)} c/u. <a href="javascript:void 0" data-act="subir" data-id="${i}">Aplicar</a></div>`;
    }
    row.querySelector('.cl-extra').innerHTML = extra;
  },

  totales() {
    const lines = this.cart.map(l => Pricing.linea(Store.producto(l.productoId), l.presId, l.cantidad));
    const bruto = U.r2(U.sum(lines, c => c.subtotal));
    const desc = Math.min(this.descuento, bruto);
    return { bruto, desc, total: U.r2(bruto - desc), ahorro: U.sum(lines, c => c.ahorro), mayor: lines.some(c => c.canal === 'mayor') };
  },

  renderCart() {
    const el = document.getElementById('cart');
    if (!el) return;
    el.innerHTML = `
      <div class="cart-head"><div class="card-title">Venta actual</div>
        ${this.cart.length ? '<button class="btn btn-sm" data-act="vaciar">Vaciar</button>' : ''}</div>
      <div class="cart-lines">${this.cart.map((l, i) => this.lineHtml(l, i)).join('') ||
        '<div class="empty">Toca un producto para agregarlo.<br>El precio por mayor se aplica solo según la cantidad y la presentación.</div>'}</div>
      <div class="cart-foot">
        <div class="form-grid">
          <div class="field"><label for="vCliente">Cliente</label>
            <input id="vCliente" class="input" list="clientesList" placeholder="Cliente general" value="${U.esc(this.cliente)}" data-input="cliente">
            <datalist id="clientesList">${[...new Set(Store.data.ventas.map(v => v.cliente))].filter(c => c !== 'Cliente general').slice(0, 50).map(c => `<option value="${U.esc(c)}">`).join('')}</datalist></div>
          <div class="field"><label for="vMetodo">Pago</label>
            <select id="vMetodo" class="select" data-change="metodo">${this.METODOS.map(m => `<option ${m === this.metodo ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        </div>
        <div class="tot-row"><span class="text-2">Subtotal</span><span id="tBruto"></span></div>
        <div class="tot-row" style="align-items:center"><label class="text-2" for="vDesc">Descuento adicional</label>
          <input id="vDesc" class="input sm right" style="width:110px" type="number" min="0" step="0.1" value="${this.descuento || ''}" placeholder="0.00" data-input="desc"></div>
        <div class="tot-row save" id="tAhorro"></div>
        <div class="tot-row big"><span>Total</span><span id="tTotal"></span></div>
        <button class="btn btn-primary btn-lg btn-block" data-act="cobrar" id="btnCobrar">Cobrar</button>
      </div>`;
    this.cart.forEach((_, i) => this.updateLine(i));
    this.updateTotals();
  },

  updateTotals() {
    const t = this.totales();
    const $ = id => document.getElementById(id);
    if (!$('tTotal')) return;
    $('tBruto').textContent = U.money(t.bruto);
    $('tTotal').textContent = U.money(t.total);
    $('tAhorro').innerHTML = t.ahorro > 0 ? `<span>Ahorro por mayor</span><span>${U.money(t.ahorro)}</span>` : '';
    $('btnCobrar').disabled = !this.cart.length;
    $('btnCobrar').textContent = this.cart.length ? `Cobrar ${U.money(t.total)}` + (t.mayor ? ' · venta por mayor' : '') : 'Cobrar';
    this.cart.forEach((_, i) => {
      const row = document.querySelector(`.cart-line[data-line="${i}"] .cl-extra`);
      if (row) this.updateLine(i);
    });
  },

  cobrar() {
    if (!this.cart.length) return;
    const D = Store.data;
    const falt = Ops.stockSuficiente(D, this.cart);
    if (falt.length) { UI.toast('Stock insuficiente: ' + falt.map(f => f.prod.nombre).join(', '), 'err'); return; }
    const venta = Ops.construirVenta(D, {
      numero: Store.siguiente('venta', 'V-', 6), fecha: U.nowStr(), cliente: this.cliente,
      metodo: this.metodo, descuento: this.descuento, lineas: this.cart
    });
    Ops.aplicarVenta(D, venta);
    Store.save();
    this.cart = []; this.cliente = ''; this.descuento = 0; this.metodo = 'Efectivo';
    App.refresh();
    UI.toast('Venta ' + venta.numero + ' registrada');
    this.comprobante(venta);
  },

  comprobante(v) {
    const D = Store.data;
    const m = UI.modal({
      title: 'Comprobante ' + v.numero,
      body: `<div class="receipt">
        <div class="r-head"><b>${U.esc(D.config.negocio)}</b><div class="muted">Nota de venta ${v.numero}</div>
          <div class="muted">${U.fmtDateTime(v.fecha)}</div></div>
        <div class="list-row" style="padding:4px"><span>Cliente: <b>${U.esc(v.cliente)}</b></span>${UI.canal(v.tipo)}</div>
        <div class="list-row" style="padding:4px"><span>Pago: ${U.esc(v.metodo)}</span></div>
        <table class="mt"><thead><tr><th>Cant.</th><th>Descripción</th><th class="num">P. unit.</th><th class="num">Importe</th></tr></thead><tbody>
        ${v.items.map(i => `<tr><td class="nowrap">${U.num(i.cantidad)} ${U.esc(i.presentacion.toLowerCase())}</td>
          <td>${U.esc(i.nombre)}${i.canal === 'mayor' ? ' <span class="badge mayor">mayor</span>' : ''}</td>
          <td class="num">${U.money(i.precioUnit)}</td><td class="num">${U.money(i.subtotal)}</td></tr>`).join('')}
        </tbody></table>
        <div class="mt">
          <div class="r-tot"><span>Subtotal</span><span>${U.money(v.bruto)}</span></div>
          ${v.descuento ? `<div class="r-tot"><span>Descuento</span><span>− ${U.money(v.descuento)}</span></div>` : ''}
          <div class="r-tot big"><span>Total</span><span>${U.money(v.total)}</span></div>
          ${v.ahorro ? `<div class="r-tot good"><span>Ahorro por compra al por mayor</span><span>${U.money(v.ahorro)}</span></div>` : ''}
        </div>
        <p class="muted" style="text-align:center;margin-top:14px">Documento interno, sin valor tributario.</p>
      </div>`,
      footer: `<button class="btn" data-print>${ICON.print} Imprimir</button><button class="btn btn-primary" data-close>Listo</button>`
    });
    m.querySelector('[data-print]').onclick = () => window.print();
    m.querySelector('.modal-foot [data-close]').onclick = UI.closeModal;
  },

  /* ---------------- Historial ---------------- */
  filtradas() {
    const r = U.rango(this.h.periodo);
    const q = this.h.q.trim().toLowerCase();
    return Store.data.ventas.filter(v => U.enRango(v.fecha, r) &&
      (!this.h.tipo || v.tipo === this.h.tipo) &&
      (!q || v.cliente.toLowerCase().includes(q) || v.numero.toLowerCase().includes(q) || v.items.some(i => i.nombre.toLowerCase().includes(q)))
    ).sort((a, b) => b.fecha.localeCompare(a.fecha));
  },

  renderHist(el) {
    const ventas = this.filtradas();
    const total = U.sum(ventas, v => v.total), util = U.sum(ventas, v => v.total - v.costoTotal);
    const max = 300;
    el.innerHTML = `
      <div class="toolbar">
        ${UI.periodo(this.h.periodo)}
        <select class="select" data-change="tipo" aria-label="Tipo de venta">
          <option value="">Mayor y menor</option>
          <option value="mayor" ${this.h.tipo === 'mayor' ? 'selected' : ''}>Solo por mayor</option>
          <option value="menor" ${this.h.tipo === 'menor' ? 'selected' : ''}>Solo por menor</option></select>
        ${UI.search(this.h.q, 'Cliente, N° o producto…')}
        <span class="spacer"></span>
        <button class="btn" data-act="csv">${ICON.download} Exportar CSV</button>
      </div>
      <div class="grid grid-kpi" style="margin-bottom:16px">
        ${Views.dashboard.kpi('Ventas', U.num(ventas.length), 'en el periodo')}
        ${Views.dashboard.kpi('Total vendido', U.money(total), '')}
        ${Views.dashboard.kpi('Utilidad bruta', U.money(util), 'Margen ' + U.pct(total ? util / total * 100 : 0))}
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>N°</th><th>Fecha</th><th>Cliente</th><th>Tipo</th><th>Productos</th><th>Pago</th><th class="num">Total</th><th class="num">Utilidad</th><th></th></tr></thead>
        <tbody>${ventas.slice(0, max).map(v => `<tr>
          <td class="cell-main">${v.numero}</td><td class="nowrap">${U.fmtDateTime(v.fecha)}</td><td>${U.esc(v.cliente)}</td>
          <td>${UI.canal(v.tipo)}</td>
          <td><span class="cell-sub">${U.esc(v.items.map(i => i.nombre).join(', ')).slice(0, 60)}${v.items.map(i => i.nombre).join(', ').length > 60 ? '…' : ''}</span></td>
          <td>${U.esc(v.metodo)}</td><td class="num cell-main">${U.money(v.total)}</td><td class="num">${U.money(v.total - v.costoTotal)}</td>
          <td class="actions"><button class="icon-btn" data-act="ver" data-id="${v.id}" aria-label="Ver">${ICON.eye}</button>
            <button class="icon-btn danger" data-act="anular" data-id="${v.id}" aria-label="Anular">${ICON.trash}</button></td></tr>`).join('') ||
          '<tr><td colspan="9" class="empty">No hay ventas en este periodo.</td></tr>'}
        </tbody></table></div>
      ${ventas.length > max ? `<p class="muted">Mostrando las ${max} más recientes de ${U.num(ventas.length)}. Exporta a CSV para ver todas.</p>` : ''}`;

    UI.bind(el, {
      periodo: v => { this.h.periodo = v; App.refresh(); },
      tipo: v => { this.h.tipo = v; App.refresh(); },
      q: v => { this.h.q = v; clearTimeout(this._t); this._t = setTimeout(() => { App.refresh(); const i = document.querySelector('.search input'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 250); },
      ver: id => this.comprobante(Store.data.ventas.find(v => v.id === id)),
      anular: id => {
        const v = Store.data.ventas.find(x => x.id === id);
        UI.confirm(`¿Anular la venta <b>${v.numero}</b> por ${U.money(v.total)}? El stock vendido se devolverá al inventario.`, () => {
          Ops.anularVenta(Store.data, id); Store.save(); App.refresh(); UI.toast('Venta anulada');
        }, { ok: 'Anular venta' });
      },
      csv: () => {
        const rows = [['N°', 'Fecha', 'Cliente', 'Tipo', 'Producto', 'Presentación', 'Cantidad', 'Precio unit.', 'Subtotal', 'Canal', 'Pago']];
        ventas.forEach(v => v.items.forEach(i => rows.push([v.numero, U.fmtDateTime(v.fecha), v.cliente, v.tipo, i.nombre, i.presentacion, i.cantidad, i.precioUnit, i.subtotal, i.canal, v.metodo])));
        U.download('ventas.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
      }
    });
  }
};
