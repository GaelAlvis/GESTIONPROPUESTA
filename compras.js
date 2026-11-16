window.Views = window.Views || {};

Views.compras = {
  tab: 'compras',
  periodo: '30d', estado: '', prov: '', q: '',

  render(el) {
    const D = Store.data;
    el.innerHTML = UI.tabs([['compras', 'Compras', D.compras.length], ['prov', 'Proveedores', D.proveedores.length]], this.tab) + '<div id="cBody"></div>';
    UI.bind(el.querySelector('.tabs'), { tab: id => { this.tab = id; App.refresh(); } });
    const body = el.querySelector('#cBody');
    if (this.tab === 'compras') this.renderCompras(body); else this.renderProv(body);
  },

  /* ---------------- Compras ---------------- */
  renderCompras(el) {
    const D = Store.data;
    const r = U.rango(this.periodo);
    const lista = D.compras.filter(c => U.enRango(c.fecha, r) && (!this.estado || c.estado === this.estado) && (!this.prov || c.proveedorId === this.prov))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    const total = U.sum(lista, c => c.total);
    const pend = D.compras.filter(c => c.estado === 'pendiente');

    el.innerHTML = `
      <div class="grid grid-kpi" style="margin-bottom:16px">
        ${Views.dashboard.kpi('Compras del periodo', U.money(total), U.num(lista.length) + ' órdenes')}
        ${Views.dashboard.kpi('Por pagar a proveedores', U.money(U.sum(pend, c => c.total)), pend.length + ' compras pendientes')}
      </div>
      <div class="toolbar">
        ${UI.periodo(this.periodo)}
        <select class="select" data-change="prov" aria-label="Proveedor"><option value="">Todos los proveedores</option>
          ${D.proveedores.map(p => `<option value="${p.id}" ${p.id === this.prov ? 'selected' : ''}>${U.esc(p.nombre)}</option>`).join('')}</select>
        <select class="select" data-change="estado" aria-label="Estado">
          <option value="">Pagadas y pendientes</option><option value="pagado" ${this.estado === 'pagado' ? 'selected' : ''}>Pagadas</option>
          <option value="pendiente" ${this.estado === 'pendiente' ? 'selected' : ''}>Pendientes de pago</option></select>
        <span class="spacer"></span>
        <button class="btn btn-primary" data-act="nueva">${ICON.plus} Registrar compra</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>N°</th><th>Fecha</th><th>Proveedor</th><th>Documento</th><th>Productos</th><th>Estado</th><th class="num">Total</th><th></th></tr></thead>
        <tbody>${lista.map(c => `<tr>
          <td class="cell-main">${c.numero}</td><td class="nowrap">${U.fmtDate(c.fecha)}</td>
          <td style="min-width:170px">${U.esc((Store.proveedor(c.proveedorId) || {}).nombre || '—')}</td><td class="nowrap">${U.esc(c.documento || '')}</td>
          <td style="min-width:220px"><span class="cell-sub">${U.esc(c.items.map(i => i.nombre).join(', ').slice(0, 70))}${c.items.map(i => i.nombre).join(', ').length > 70 ? '…' : ''}</span></td>
          <td>${c.estado === 'pagado' ? `<span class="badge ok">${ICON.check} Pagado</span>` : `<span class="badge warn">${ICON.clock} Pendiente</span>`}</td>
          <td class="num cell-main">${U.money(c.total)}</td>
          <td class="actions">${c.estado === 'pendiente' ? `<button class="btn btn-sm" data-act="pagar" data-id="${c.id}">Marcar pagado</button>` : ''}
            <button class="icon-btn" data-act="ver" data-id="${c.id}" aria-label="Ver">${ICON.eye}</button>
            <button class="icon-btn danger" data-act="anular" data-id="${c.id}" aria-label="Anular">${ICON.trash}</button></td></tr>`).join('') ||
          '<tr><td colspan="8" class="empty">No hay compras en este periodo.</td></tr>'}</tbody>
      </table></div>`;

    UI.bind(el, {
      periodo: v => { this.periodo = v; App.refresh(); },
      prov: v => { this.prov = v; App.refresh(); },
      estado: v => { this.estado = v; App.refresh(); },
      nueva: () => this.nueva(),
      pagar: id => { D.compras.find(c => c.id === id).estado = 'pagado'; Store.save(); App.refresh(); UI.toast('Compra marcada como pagada'); },
      ver: id => this.detalle(D.compras.find(c => c.id === id)),
      anular: id => {
        const c = D.compras.find(x => x.id === id);
        UI.confirm(`¿Anular la compra <b>${c.numero}</b>? Se descontará del stock lo que ingresó con ella.`, () => {
          Ops.anularCompra(D, id); Store.save(); App.refresh(); UI.toast('Compra anulada');
        }, { ok: 'Anular compra' });
      }
    });
  },

  detalle(c) {
    UI.modal({
      title: 'Compra ' + c.numero, size: 'lg',
      body: `<div class="list" style="margin-bottom:12px">
          <div class="list-row"><span class="text-2">Proveedor</span><b>${U.esc((Store.proveedor(c.proveedorId) || {}).nombre || '—')}</b></div>
          <div class="list-row"><span class="text-2">Fecha</span><span>${U.fmtDate(c.fecha)}</span></div>
          <div class="list-row"><span class="text-2">Documento</span><span>${U.esc(c.documento || '—')}</span></div>
          <div class="list-row"><span class="text-2">Estado</span><span>${c.estado === 'pagado' ? 'Pagado' : 'Pendiente de pago'}</span></div></div>
        <div class="table-wrap"><table><thead><tr><th>Producto</th><th>Presentación</th><th class="num">Cant.</th><th class="num">Unid. base</th><th class="num">Costo</th><th class="num">Subtotal</th></tr></thead>
        <tbody>${c.items.map(i => `<tr><td>${U.esc(i.nombre)}</td><td>${U.esc(i.presentacion)}</td><td class="num">${U.num(i.cantidad)}</td>
          <td class="num">${U.num(i.cantidad * i.factor)}</td><td class="num">${U.money(i.costoUnit)}</td><td class="num">${U.money(i.subtotal)}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="5">Total</td><td class="num">${U.money(c.total)}</td></tr></tfoot></table></div>
        ${c.notas ? `<p class="muted">${U.esc(c.notas)}</p>` : ''}`,
      footer: '<button class="btn btn-primary" data-close>Cerrar</button>'
    });
  },

  nueva() {
    const D = Store.data;
    if (!D.productos.length) { UI.toast('Primero crea productos', 'err'); return; }
    const lineas = [];
    const nuevaLinea = (prod) => {
      const p = prod || D.productos[0];
      const pres = [...p.presentaciones].sort((a, b) => b.factor - a.factor)[0];
      return { productoId: p.id, presId: pres.id, cantidad: 1, costoUnit: U.r2(p.costo * pres.factor) };
    };
    // Sugerir productos con stock bajo
    const bajos = D.productos.filter(p => p.stock <= p.stockMin);

    const m = UI.modal({
      title: 'Registrar compra', size: 'xl',
      body: `<div class="form-grid" id="cForm" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
          <div class="field"><label>Proveedor</label><select class="select" name="proveedorId">${D.proveedores.map(p => `<option value="${p.id}">${U.esc(p.nombre)}</option>`).join('')}</select></div>
          <div class="field"><label>Fecha</label><input class="input" type="date" name="fecha" value="${U.today()}"></div>
          <div class="field"><label>N° de factura / guía</label><input class="input" name="documento" placeholder="N° de factura"></div>
          <div class="field"><label>Estado de pago</label><select class="select" name="estado"><option value="pagado">Pagado</option><option value="pendiente">Pendiente (a crédito)</option></select></div>
        </div>
        ${bajos.length ? `<div class="notice warn mt">${bajos.length} productos con stock bajo. <a href="javascript:void 0" data-act="sugeridos">Agregar los del proveedor seleccionado</a></div>` : ''}
        <div class="table-wrap mt"><table class="line-table">
          <thead><tr><th style="min-width:200px">Producto</th><th style="min-width:130px">Presentación</th><th style="width:100px">Cantidad</th><th style="width:130px">Costo por presentación</th><th class="num">Ingresa</th><th class="num">Subtotal</th><th></th></tr></thead>
          <tbody id="cLines"></tbody>
          <tfoot><tr><td colspan="5">Total de la compra</td><td class="num" id="cTotal"></td><td></td></tr></tfoot>
        </table></div>
        <button class="btn mt" data-act="add">${ICON.plus} Agregar producto</button>
        <div class="field mt"><label>Notas</label><input class="input" name="notas" placeholder="Opcional"></div>
        <p class="muted">Al guardar, el stock aumenta y el costo de cada producto se recalcula como promedio ponderado.</p>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-act="guardar">Guardar compra</button>`
    });

    const provSel = m.querySelector('[name=proveedorId]');
    const draw = () => {
      m.querySelector('#cLines').innerHTML = lineas.map((l, i) => {
        const p = Store.producto(l.productoId);
        const pres = Pricing.pres(p, l.presId);
        return `<tr data-i="${i}">
          <td><select class="select sm" data-k="productoId">${D.productos.map(x => `<option value="${x.id}" ${x.id === l.productoId ? 'selected' : ''}>${U.esc(x.nombre)}</option>`).join('')}</select></td>
          <td><select class="select sm" data-k="presId">${p.presentaciones.map(x => `<option value="${x.id}" ${x.id === l.presId ? 'selected' : ''}>${U.esc(x.nombre)} (${x.factor})</option>`).join('')}</select></td>
          <td><input class="input sm" type="number" min="1" step="1" value="${l.cantidad}" data-k="cantidad"></td>
          <td><input class="input sm" type="number" min="0" step="0.01" value="${l.costoUnit}" data-k="costoUnit"></td>
          <td class="num cell-sub">${U.num(l.cantidad * pres.factor)} ${U.esc(p.unidad)}</td>
          <td class="num" data-sub>${U.money(l.cantidad * l.costoUnit)}</td>
          <td><button class="icon-btn danger" data-act="del" data-id="${i}" aria-label="Quitar">${ICON.trash}</button></td></tr>`;
      }).join('') || '<tr><td colspan="7" class="empty">Agrega los productos comprados.</td></tr>';
      tot();
    };
    const tot = () => { m.querySelector('#cTotal').textContent = U.money(U.sum(lineas, l => l.cantidad * l.costoUnit)); };

    m.addEventListener('input', e => {
      const tr = e.target.closest('tr[data-i]'); if (!tr) return;
      const l = lineas[+tr.dataset.i]; const k = e.target.dataset.k;
      if (k === 'cantidad') l.cantidad = Math.max(0, Number(e.target.value) || 0);
      if (k === 'costoUnit') l.costoUnit = Math.max(0, Number(e.target.value) || 0);
      if (k === 'cantidad' || k === 'costoUnit') { tr.querySelector('[data-sub]').textContent = U.money(l.cantidad * l.costoUnit); tot(); }
    });
    m.addEventListener('change', e => {
      const tr = e.target.closest('tr[data-i]'); if (!tr) return;
      const i = +tr.dataset.i; const k = e.target.dataset.k;
      if (k === 'productoId') { lineas[i] = nuevaLinea(Store.producto(e.target.value)); draw(); }
      if (k === 'presId') { const p = Store.producto(lineas[i].productoId); const pr = Pricing.pres(p, e.target.value); lineas[i].presId = pr.id; lineas[i].costoUnit = U.r2(p.costo * pr.factor); draw(); }
      if (k === 'cantidad') draw();
    });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'add') { lineas.push(nuevaLinea()); draw(); }
      if (b.dataset.act === 'del') { lineas.splice(+b.dataset.id, 1); draw(); }
      if (b.dataset.act === 'sugeridos') {
        const delProv = bajos.filter(p => p.proveedorId === provSel.value);
        const lista = delProv.length ? delProv : bajos;
        if (lineas.length === 1 && lineas[0]._auto) lineas.length = 0;
        lista.forEach(p => {
          if (lineas.some(l => l.productoId === p.id)) return;
          const l = nuevaLinea(p); const pres = Pricing.pres(p, l.presId);
          l.cantidad = Math.max(1, Math.ceil((p.stockMin * 3 - p.stock) / pres.factor));
          lineas.push(l);
        });
        if (!delProv.length) UI.toast('El proveedor elegido no tiene productos con stock bajo; se agregaron todos');
        draw();
      }
      if (b.dataset.act === 'guardar') guardar();
    });

    const guardar = () => {
      const f = UI.form(m);
      const validas = lineas.filter(l => l.cantidad > 0);
      if (!validas.length) { UI.toast('Agrega al menos un producto', 'err'); return; }
      if (!f.proveedorId) { UI.toast('Primero registra un proveedor', 'err'); return; }
      const items = validas.map(l => {
        const p = Store.producto(l.productoId); const pr = Pricing.pres(p, l.presId);
        return { productoId: p.id, nombre: p.nombre, presId: pr.id, presentacion: pr.nombre, factor: pr.factor, cantidad: l.cantidad, costoUnit: U.r2(l.costoUnit), subtotal: U.r2(l.cantidad * l.costoUnit) };
      });
      const hora = f.fecha === U.today() ? U.nowStr().slice(10) : 'T09:00';
      const compra = {
        id: U.uid(), numero: Store.siguiente('compra', 'C-', 5), fecha: f.fecha + hora, proveedorId: f.proveedorId,
        documento: f.documento.trim(), items, total: U.r2(U.sum(items, i => i.subtotal)), estado: f.estado, notas: f.notas.trim()
      };
      Ops.aplicarCompra(D, compra);
      Store.save(); UI.closeModal(); App.refresh();
      UI.toast(`Compra ${compra.numero} registrada · stock actualizado`);
    };

    lineas.push(Object.assign(nuevaLinea(), { _auto: true }));
    draw();
  },

  /* ---------------- Proveedores ---------------- */
  renderProv(el) {
    const D = Store.data;
    const q = this.q.trim().toLowerCase();
    const lista = D.proveedores.filter(p => !q || [p.nombre, p.ruc, p.contacto, p.rubro].join(' ').toLowerCase().includes(q));
    el.innerHTML = `
      <div class="toolbar">${UI.search(this.q, 'Buscar proveedor, NIT o rubro…')}<span class="spacer"></span>
        <button class="btn btn-primary" data-act="nuevo">${ICON.plus} Nuevo proveedor</button></div>
      <div class="table-wrap"><table>
        <thead><tr><th>Proveedor</th><th>Contacto</th><th>Rubro</th><th class="num">Compras</th><th class="num">Total comprado</th><th class="num">Por pagar</th><th>Última compra</th><th></th></tr></thead>
        <tbody>${lista.map(p => {
          const cs = D.compras.filter(c => c.proveedorId === p.id);
          const ult = cs.map(c => c.fecha).sort().pop();
          const debe = U.sum(cs.filter(c => c.estado === 'pendiente'), c => c.total);
          return `<tr>
            <td><div class="cell-main">${U.esc(p.nombre)}</div><div class="cell-sub">NIT ${U.esc(p.ruc || '—')}</div></td>
            <td><div>${U.esc(p.contacto || '—')}</div><div class="cell-sub">${U.esc(p.telefono || '')} ${p.email ? '· ' + U.esc(p.email) : ''}</div></td>
            <td>${U.esc(p.rubro || '')}</td><td class="num">${cs.length}</td><td class="num">${U.money(U.sum(cs, c => c.total))}</td>
            <td class="num ${debe ? 'bad' : ''}">${U.money(debe)}</td><td>${ult ? U.fmtDate(ult) : '—'}</td>
            <td class="actions"><button class="icon-btn" data-act="editar" data-id="${p.id}" aria-label="Editar">${ICON.edit}</button>
              <button class="icon-btn danger" data-act="borrar" data-id="${p.id}" aria-label="Eliminar">${ICON.trash}</button></td></tr>`;
        }).join('') || '<tr><td colspan="8" class="empty">Sin proveedores.</td></tr>'}</tbody></table></div>`;

    UI.bind(el, {
      q: v => { this.q = v; clearTimeout(this._t); this._t = setTimeout(() => { App.refresh(); const i = document.querySelector('.search input'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 200); },
      nuevo: () => this.editorProv(null),
      editar: id => this.editorProv(Store.proveedor(id)),
      borrar: id => {
        const p = Store.proveedor(id);
        if (D.compras.some(c => c.proveedorId === id)) { UI.toast('Tiene compras registradas; no se puede eliminar', 'err'); return; }
        UI.confirm(`¿Eliminar a <b>${U.esc(p.nombre)}</b>?`, () => { D.proveedores = D.proveedores.filter(x => x.id !== id); Store.save(); App.refresh(); }, { ok: 'Eliminar' });
      }
    });
  },

  editorProv(p) {
    const d = p || { nombre: '', ruc: '', contacto: '', telefono: '', email: '', rubro: '', notas: '' };
    const m = UI.modal({
      title: p ? 'Editar proveedor' : 'Nuevo proveedor',
      body: `<div class="form-grid">
        <div class="field full"><label>Razón social / nombre</label><input class="input" name="nombre" value="${U.esc(d.nombre)}"></div>
        <div class="field"><label>NIT / documento</label><input class="input" name="ruc" value="${U.esc(d.ruc)}"></div>
        <div class="field"><label>Rubro</label><input class="input" name="rubro" value="${U.esc(d.rubro)}"></div>
        <div class="field"><label>Persona de contacto</label><input class="input" name="contacto" value="${U.esc(d.contacto)}"></div>
        <div class="field"><label>Teléfono</label><input class="input" name="telefono" value="${U.esc(d.telefono)}"></div>
        <div class="field full"><label>Correo</label><input class="input" name="email" type="email" value="${U.esc(d.email)}"></div>
        <div class="field full"><label>Notas</label><input class="input" name="notas" value="${U.esc(d.notas)}" placeholder="Condiciones de pago, días de entrega…"></div></div>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Guardar</button>`
    });
    m.querySelector('[data-ok]').onclick = () => {
      const f = UI.form(m);
      if (!f.nombre.trim()) { UI.toast('Escribe el nombre del proveedor', 'err'); return; }
      if (p) Object.assign(p, f); else Store.data.proveedores.push({ id: U.uid(), ...f });
      Store.save(); UI.closeModal(); App.refresh(); UI.toast('Proveedor guardado');
    };
  }
};
