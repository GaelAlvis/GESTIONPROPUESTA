window.Views = window.Views || {};

Views.productos = {
  q: '', cat: '', estado: '', tab: 'precios', periodo: '30d',

  tabsHtml() {
    return UI.tabs([['precios', 'Precios y ganancia'], ['inv', 'Inventario', Store.data.productos.length]], this.tab);
  },

  render(el) {
    if (this.tab === 'precios') return this.renderPrecios(el);
    const D = Store.data;
    const q = this.q.trim().toLowerCase();
    const limite = U.addDays(U.today(), D.config.diasVencimiento || 30);
    const estadoDe = p => p.stock <= 0 ? 'agotado' : p.stock <= p.stockMin ? 'bajo' : 'ok';
    const prods = D.productos.filter(p =>
      (!this.cat || p.categoria === this.cat) &&
      (!this.estado || estadoDe(p) === this.estado || (this.estado === 'vence' && p.vence && p.vence <= limite)) &&
      (!q || p.nombre.toLowerCase().includes(q) || (p.codigo || '').toLowerCase().includes(q)));

    const valor = U.sum(D.productos, p => Math.max(0, p.stock) * p.costo);
    const bajos = D.productos.filter(p => p.stock <= p.stockMin).length;

    el.innerHTML = `${this.tabsHtml()}
      <div class="grid grid-kpi" style="margin-bottom:16px">
        ${Views.dashboard.kpi('Productos', U.num(D.productos.length), Store.categorias().length + ' categorías')}
        ${Views.dashboard.kpi('Valor del inventario', U.money(valor), 'Al costo promedio')}
        ${Views.dashboard.kpi('Con stock bajo', U.num(bajos), bajos ? '<span class="down">Requieren reposición</span>' : 'Todo en orden')}
      </div>
      <div class="toolbar">
        ${UI.search(this.q, 'Buscar por nombre o código…')}
        <select class="select" data-change="cat" aria-label="Categoría"><option value="">Todas las categorías</option>
          ${Store.categorias().map(c => `<option ${c === this.cat ? 'selected' : ''}>${U.esc(c)}</option>`).join('')}</select>
        <select class="select" data-change="estado" aria-label="Estado">
          ${[['', 'Todos los estados'], ['ok', 'Stock normal'], ['bajo', 'Stock bajo'], ['agotado', 'Agotado'], ['vence', 'Por vencer']].map(([k, l]) =>
            `<option value="${k}" ${k === this.estado ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn" data-act="csv">${ICON.download} Exportar</button>
        <button class="btn btn-primary" data-act="nuevo">${ICON.plus} Nuevo producto</button>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th style="min-width:220px">Producto</th><th>Categoría</th><th class="num">Stock</th><th class="num">Costo</th>
          <th class="num">Precio menor</th><th class="num">Mejor precio mayor</th><th class="num">Margen menor</th><th>Estado</th><th></th></tr></thead>
        <tbody>${prods.map(p => {
          const pm = Pricing.precioMenor(p), pM = Pricing.precioMayorMin(p);
          const est = estadoDe(p);
          const venc = p.vence && p.vence <= limite;
          return `<tr>
            <td><div class="cell-main">${U.esc(p.nombre)}</div><div class="cell-sub">${U.esc(p.codigo || '')} · ${p.presentaciones.map(x => U.esc(x.nombre)).join(' / ')}</div></td>
            <td>${U.esc(p.categoria)}</td>
            <td class="num"><div class="cell-main">${U.num(p.stock)} ${U.esc(p.unidad)}</div><div class="cell-sub">${Pricing.equivalencia(p, p.stock)}</div></td>
            <td class="num">${U.money(p.costo)}</td>
            <td class="num">${U.money(pm)}</td>
            <td class="num">${U.money(pM)}</td>
            <td class="num">${U.pct(Pricing.margen(pm, p.costo))}</td>
            <td>${est === 'ok' ? '<span class="badge ok">Normal</span>' : est === 'bajo' ? `<span class="badge warn">${ICON.alert} Bajo</span>` : `<span class="badge bad">${ICON.alert} Agotado</span>`}
              ${venc ? `<span class="badge warn">${ICON.clock} Vence ${U.fmtDate(p.vence)}</span>` : ''}</td>
            <td class="actions">
              <button class="icon-btn" data-act="ajuste" data-id="${p.id}" aria-label="Ajustar stock" title="Ajustar stock">${ICON.adjust}</button>
              <button class="icon-btn" data-act="editar" data-id="${p.id}" aria-label="Editar" title="Editar">${ICON.edit}</button>
              <button class="icon-btn danger" data-act="borrar" data-id="${p.id}" aria-label="Eliminar" title="Eliminar">${ICON.trash}</button>
            </td></tr>`;
        }).join('') || '<tr><td colspan="9" class="empty">No hay productos que coincidan.</td></tr>'}
        </tbody></table></div>`;

    UI.bind(el, {
      tab: id => { this.tab = id; App.refresh(); },
      q: v => { this.q = v; clearTimeout(this._t); this._t = setTimeout(() => { App.refresh(); const i = document.querySelector('.search input'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 200); },
      cat: v => { this.cat = v; App.refresh(); },
      estado: v => { this.estado = v; App.refresh(); },
      nuevo: () => this.editor(null),
      editar: id => this.editor(Store.producto(id)),
      ajuste: id => this.ajuste(Store.producto(id)),
      borrar: id => {
        const p = Store.producto(id);
        UI.confirm(`¿Eliminar <b>${U.esc(p.nombre)}</b> del catálogo? Las ventas y compras ya registradas se conservan.`, () => {
          D.productos = D.productos.filter(x => x.id !== id); Store.save(); App.refresh(); UI.toast('Producto eliminado');
        }, { ok: 'Eliminar' });
      },
      csv: () => {
        const rows = [['Código', 'Producto', 'Categoría', 'Unidad', 'Stock', 'Stock mínimo', 'Costo', 'Precio menor', 'Mejor precio mayor', 'Vence']];
        D.productos.forEach(p => rows.push([p.codigo, p.nombre, p.categoria, p.unidad, p.stock, p.stockMin, p.costo, U.r2(Pricing.precioMenor(p)), U.r2(Pricing.precioMayorMin(p)), p.vence]));
        U.download('inventario.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
      }
    });
  },

  /* ---------- Precios (costo agencia / mayorista / cliente final) y ganancia real por producto ---------- */
  renderPrecios(el) {
    const D = Store.data;
    const r = U.rango(this.periodo);
    const ventas = D.ventas.filter(v => U.enRango(v.fecha, r));
    const mermas = (D.mermas || []).filter(m => U.enRango(m.fecha, r));
    const st = {};
    D.productos.forEach(p => { st[p.id] = { base: 0, mayor: 0, menor: 0, costo: 0, merma: 0 }; });
    ventas.forEach(v => {
      const f = v.bruto ? v.total / v.bruto : 1;
      v.items.forEach(i => {
        const s = st[i.productoId]; if (!s) return;
        s.base += i.cantidadBase; s.costo += i.costo;
        s[i.canal === 'mayor' ? 'mayor' : 'menor'] += i.subtotal * f;
      });
    });
    mermas.forEach(m => { if (st[m.productoId]) st[m.productoId].merma += m.perdida; });
    const filas = D.productos.map(p => ({ p, res: Pricing.resumen(p), s: st[p.id] }));
    const cats = [...new Set(filas.map(x => x.p.categoria))];
    const T = { mayor: 0, menor: 0, costo: 0, merma: 0 };
    filas.forEach(({ s }) => { T.mayor += s.mayor; T.menor += s.menor; T.costo += s.costo; T.merma += s.merma; });
    const tVentas = T.mayor + T.menor, tGan = tVentas - T.costo - T.merma;
    const g = (v, cls = '') => `<span class="${v < 0 ? 'bad' : cls}">${U.money(v)}</span>`;

    el.innerHTML = `${this.tabsHtml()}
      <div class="card">
        <div class="card-head"><div><div class="card-title">Lista de precios y ganancia por unidad</div>
          <div class="card-sub">Costo de compra (agencia) o de producción, precio mayorista, precio al cliente final y lo que se gana en cada uno</div></div>
          <button class="btn btn-sm" data-act="csvPrecios">${ICON.download} Exportar</button></div>
        <div class="table-wrap flat"><table class="cards-sm">
          <thead><tr><th style="min-width:200px">Producto</th><th>Se vende por</th><th class="num">Costo<div class="th-sub">agencia / producción</div></th>
            <th class="num">Precio mayorista</th><th class="num">Ganancia mayorista</th>
            <th class="num">Precio cliente final</th><th class="num">Ganancia cliente final</th><th></th></tr></thead>
          <tbody>${cats.map(c => `<tr class="group-row"><td colspan="8">${U.esc(c)}</td></tr>` + filas.filter(x => x.p.categoria === c).map(({ p, res }) => `<tr>
            <td class="c-title"><div class="cell-main">${U.esc(p.nombre)}</div><div class="cell-sub">${U.esc(p.codigo || '')}${res.ref.factor > 1 ? ' · ' + U.money(p.costo) + ' por ' + U.esc(p.unidad) : ''}</div></td>
            <td data-label="Se vende por">${U.esc(res.ref.nombre)}</td>
            <td class="num" data-label="Costo (agencia / producción)">${U.money(res.costo)}</td>
            <td class="num" data-label="Precio mayorista">${U.money(res.mayorista)}</td>
            <td class="num" data-label="Ganancia mayorista"><div class="cell-main">${g(res.ganMayor, 'good')}</div><div class="cell-sub">${U.pct(res.mgMayor)}</div></td>
            <td class="num" data-label="Precio cliente final">${U.money(res.final)}</td>
            <td class="num" data-label="Ganancia cliente final"><div class="cell-main">${g(res.ganFinal, 'good')}</div><div class="cell-sub">${U.pct(res.mgFinal)}</div></td>
            <td class="actions c-act"><button class="icon-btn" data-act="editar" data-id="${p.id}" aria-label="Editar precios" title="Editar precios">${ICON.edit}</button></td>
          </tr>`).join('')).join('') || '<tr><td colspan="8" class="empty">Aún no hay productos.</td></tr>'}</tbody></table></div>
        <p class="muted" style="margin:12px 0 0;font-size:12.5px">El precio mayorista es el mejor precio por volumen (p. ej. por caja). El costo se actualiza solo con cada compra a la agencia o cada lote de producción.</p>
      </div>

      <div class="toolbar mt">${UI.periodo(this.periodo)}<span class="muted">${r.desde === '0000-01-01' ? 'Todo el historial' : U.fmtDate(r.desde) + ' – ' + U.fmtDate(r.hasta)}</span></div>
      <div class="grid grid-kpi">
        ${Views.dashboard.kpi('Vendido por mayor', U.money(T.mayor), U.pct(tVentas ? T.mayor / tVentas * 100 : 0) + ' de las ventas')}
        ${Views.dashboard.kpi('Vendido al cliente final', U.money(T.menor), U.pct(tVentas ? T.menor / tVentas * 100 : 0) + ' de las ventas')}
        ${Views.dashboard.kpi('Costo de lo vendido', U.money(T.costo), 'Más ' + U.money(T.merma) + ' en dañados')}
        ${Views.dashboard.kpi('Ganancia', g(tGan), 'Margen ' + U.pct(tVentas ? tGan / tVentas * 100 : 0) + ' · antes de gastos')}
      </div>
      <div class="card mt">
        <div class="card-head"><div><div class="card-title">Ganancia real por producto</div><div class="card-sub">Lo vendido en el periodo, menos su costo y los productos dañados</div></div></div>
        <div class="table-wrap flat"><table>
          <thead><tr><th style="min-width:200px">Producto</th><th class="num">Cantidad vendida</th><th class="num">Ventas por mayor</th><th class="num">Ventas cliente final</th>
            <th class="num">Costo</th><th class="num">Dañados</th><th class="num">Ganancia</th><th class="num">Margen</th></tr></thead>
          <tbody>${filas.map(({ p, res, s }) => {
            const vt = s.mayor + s.menor, gan = vt - s.costo - s.merma;
            return `<tr>
              <td class="cell-main">${U.esc(p.nombre)}</td>
              <td class="num">${res.ref.factor > 1 ? U.num(s.base / res.ref.factor, 1) + ' ' + U.esc(res.ref.nombre.split(' ')[0].toLowerCase()) + 's' : U.num(s.base) + ' ' + U.esc(p.unidad) + (s.base !== 1 ? 's' : '')}</td>
              <td class="num">${U.money(s.mayor)}</td><td class="num">${U.money(s.menor)}</td>
              <td class="num">− ${U.money(s.costo)}</td><td class="num">${s.merma ? '− ' + U.money(s.merma) : '—'}</td>
              <td class="num cell-main">${g(gan, 'good')}</td><td class="num">${U.pct(vt ? gan / vt * 100 : 0)}</td></tr>`;
          }).join('')}
          <tr class="total-row"><td>Total</td><td></td><td class="num">${U.money(T.mayor)}</td><td class="num">${U.money(T.menor)}</td>
            <td class="num">− ${U.money(T.costo)}</td><td class="num">− ${U.money(T.merma)}</td><td class="num">${g(tGan, 'good')}</td><td class="num">${U.pct(tVentas ? tGan / tVentas * 100 : 0)}</td></tr>
          </tbody></table></div>
      </div>`;

    UI.bind(el, {
      tab: id => { this.tab = id; App.refresh(); },
      periodo: v => { this.periodo = v; App.refresh(); },
      editar: id => this.editor(Store.producto(id)),
      csvPrecios: () => {
        const rows = [['Código', 'Producto', 'Se vende por', 'Costo', 'Precio mayorista', 'Ganancia mayorista', 'Precio cliente final', 'Ganancia cliente final']];
        filas.forEach(({ p, res }) => rows.push([p.codigo, p.nombre, res.ref.nombre, U.r2(res.costo), U.r2(res.mayorista), U.r2(res.ganMayor), U.r2(res.final), U.r2(res.ganFinal)]));
        U.download('lista-de-precios.csv', U.toCSV(rows), 'text/csv;charset=utf-8');
      }
    });
  },

  /* ---------- Editor de producto con presentaciones y escalas de precio ---------- */
  editor(prod) {
    const D = Store.data;
    const nuevo = !prod;
    const d = prod ? JSON.parse(JSON.stringify(prod)) : {
      id: U.uid(), codigo: '', nombre: '', categoria: '', unidad: 'und', costo: 0, stock: 0, stockMin: 10, vence: '',
      proveedorId: '', presentaciones: [{ id: U.uid(), nombre: 'Unidad', factor: 1, tramos: [{ min: 1, precio: 0 }] }]
    };

    const m = UI.modal({
      title: nuevo ? 'Nuevo producto' : 'Editar producto',
      size: 'lg',
      body: `<div class="form-grid" id="pForm">
          <div class="field full"><label>Nombre del producto</label><input class="input" name="nombre" value="${U.esc(d.nombre)}" placeholder="Ej.: Aceite vegetal 1 L"></div>
          <div class="field"><label>Código / SKU</label><input class="input" name="codigo" value="${U.esc(d.codigo)}"></div>
          <div class="field"><label>Categoría</label><input class="input" name="categoria" list="catList" value="${U.esc(d.categoria)}" placeholder="Ej.: Abarrotes, Limpieza…">
            <datalist id="catList">${Store.categorias().map(c => `<option value="${U.esc(c)}">`).join('')}</datalist></div>
          <div class="field"><label>Unidad base</label><input class="input" name="unidad" value="${U.esc(d.unidad)}" placeholder="und, kg, L, paq…">
            <span class="hint">El stock se lleva en esta unidad.</span></div>
          <div class="field"><label>Costo por unidad base (agencia o producción)</label><input class="input" name="costo" type="number" step="0.01" min="0" value="${U.r2(d.costo)}">
            <span class="hint">Se recalcula con cada compra (promedio ponderado).</span></div>
          <div class="field"><label>Stock ${nuevo ? 'inicial' : 'actual'}</label><input class="input" name="stock" type="number" step="1" value="${d.stock}" ${nuevo ? '' : 'disabled'}>
            ${nuevo ? '' : '<span class="hint">Para corregirlo usa "Ajustar stock".</span>'}</div>
          <div class="field"><label>Stock mínimo (alerta)</label><input class="input" name="stockMin" type="number" step="1" min="0" value="${d.stockMin}"></div>
          <div class="field"><label>Proveedor habitual</label><select class="select" name="proveedorId"><option value="">—</option>
            ${D.proveedores.map(p => `<option value="${p.id}" ${p.id === d.proveedorId ? 'selected' : ''}>${U.esc(p.nombre)}</option>`).join('')}</select></div>
          <div class="field"><label>Fecha de vencimiento (opcional)</label><input class="input" name="vence" type="date" value="${U.esc(d.vence)}">
            <span class="hint">Déjalo vacío para productos no perecibles.</span></div>
        </div>
        <h3 class="mt" style="font-size:15px">Presentaciones y precios</h3>
        <p class="muted" style="margin:4px 0 12px">Cada presentación indica cuántas unidades base contiene (p. ej. Maple x30 = 30 huevos). Marca "Cliente final" si se vende al público; si no, cuenta como venta mayorista. Agrega escalas para dar precio mayorista según la cantidad.</p>
        <div class="stack" id="presEditor"></div>
        <button class="btn mt" data-act="addPres">${ICON.plus} Agregar presentación</button>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-act="guardar">Guardar producto</button>`
    });

    const costo = () => Number(m.querySelector('[name=costo]').value) || 0;
    const drawPres = () => {
      const c = costo();
      m.querySelector('#presEditor').innerHTML = d.presentaciones.map((p, pi) => `
        <div class="pres-card">
          <div class="pres-head">
            <div class="field"><label>Presentación</label><input class="input sm" value="${U.esc(p.nombre)}" data-pi="${pi}" data-k="nombre" placeholder="Ej.: Caja x12"></div>
            <div class="field"><label>Unidades base</label><input class="input sm" type="number" min="1" step="1" value="${p.factor}" data-pi="${pi}" data-k="factor" ${pi === 0 ? 'disabled title="La primera presentación es la unidad base"' : ''}></div>
            <label class="check"><input type="checkbox" data-pi="${pi}" data-k="menor" ${Pricing.esMenor(p) ? 'checked' : ''}> Cliente final</label>
            ${pi === 0 ? '<span class="badge">Base</span>' : `<button class="icon-btn danger" data-act="delPres" data-id="${pi}" aria-label="Quitar presentación">${ICON.trash}</button>`}
          </div>
          ${p.tramos.map((t, ti) => {
            const porBase = p.factor ? t.precio / p.factor : 0;
            const mg = Pricing.margen(porBase, c);
            return `<div class="tramo-row">
              <div class="field">${ti === 0 ? '<label>Desde (cant.)</label>' : ''}<input class="input sm" type="number" min="1" step="1" value="${t.min}" data-pi="${pi}" data-ti="${ti}" data-k="min" ${ti === 0 ? 'disabled' : ''}></div>
              <div class="field">${ti === 0 ? '<label>Precio c/u</label>' : ''}<input class="input sm" type="number" min="0" step="0.01" value="${t.precio}" data-pi="${pi}" data-ti="${ti}" data-k="precio"></div>
              <div class="hint" style="${ti === 0 ? 'padding-top:18px' : ''}">${ti === 0 && Pricing.esMenor(p) ? 'Cliente final' : 'Mayorista'} · ${U.money(porBase)}/${U.esc(m.querySelector('[name=unidad]').value || 'und')} ·
                <span class="${mg < 0 ? 'bad' : ''}">margen ${U.pct(mg)}</span></div>
              ${ti === 0 ? '<span></span>' : `<button class="icon-btn danger" data-act="delTramo" data-id="${pi}:${ti}" aria-label="Quitar escala">${ICON.trash}</button>`}
            </div>`;
          }).join('')}
          <button class="btn btn-sm" data-act="addTramo" data-id="${pi}">${ICON.plus} Escala por volumen</button>
        </div>`).join('');
    };
    drawPres();

    m.addEventListener('input', e => {
      const t = e.target;
      if (t.dataset.pi == null) return;
      const p = d.presentaciones[+t.dataset.pi];
      if (t.dataset.k === 'nombre') p.nombre = t.value;
      if (t.dataset.k === 'menor') { p.menor = t.checked; drawPres(); return; }
      if (t.dataset.k === 'factor') p.factor = Math.max(1, Math.floor(Number(t.value) || 1));
      if (t.dataset.k === 'min') p.tramos[+t.dataset.ti].min = Math.max(1, Math.floor(Number(t.value) || 1));
      if (t.dataset.k === 'precio') p.tramos[+t.dataset.ti].precio = Math.max(0, Number(t.value) || 0);
    });
    m.addEventListener('change', e => {
      if (e.target.dataset.k && e.target.dataset.k !== 'nombre') drawPres();
      if (e.target.name === 'costo' || e.target.name === 'unidad') drawPres();
    });
    m.addEventListener('click', e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const a = b.dataset.act;
      if (a === 'addPres') { d.presentaciones.push({ id: U.uid(), nombre: '', factor: 12, tramos: [{ min: 1, precio: 0 }] }); drawPres(); }
      if (a === 'delPres') { d.presentaciones.splice(+b.dataset.id, 1); drawPres(); }
      if (a === 'addTramo') {
        const p = d.presentaciones[+b.dataset.id]; const last = p.tramos[p.tramos.length - 1];
        p.tramos.push({ min: last.min < 2 ? (p.factor > 1 ? 5 : 12) : last.min * 2, precio: U.r2(last.precio * 0.95) }); drawPres();
      }
      if (a === 'delTramo') { const [pi, ti] = b.dataset.id.split(':').map(Number); d.presentaciones[pi].tramos.splice(ti, 1); drawPres(); }
      if (a === 'guardar') guardar();
    });

    const guardar = () => {
      const f = UI.form(m.querySelector('#pForm'));
      if (!f.nombre.trim()) { UI.toast('Escribe el nombre del producto', 'err'); return; }
      for (const p of d.presentaciones) {
        if (!p.nombre.trim()) { UI.toast('Cada presentación necesita un nombre', 'err'); return; }
        p.tramos.sort((a, b) => a.min - b.min);
        p.tramos[0].min = 1;
        if (new Set(p.tramos.map(t => t.min)).size !== p.tramos.length) { UI.toast(`"${p.nombre}" tiene escalas con la misma cantidad`, 'err'); return; }
        if (p.tramos.some(t => !(t.precio > 0))) { UI.toast(`Completa los precios de "${p.nombre}"`, 'err'); return; }
      }
      d.presentaciones[0].factor = 1;
      Object.assign(d, {
        nombre: f.nombre.trim(), codigo: f.codigo.trim(), categoria: f.categoria.trim() || 'General', unidad: f.unidad.trim() || 'und',
        costo: Number(f.costo) || 0, stockMin: Number(f.stockMin) || 0, proveedorId: f.proveedorId, vence: f.vence
      });
      if (nuevo) { d.stock = Number(f.stock) || 0; D.productos.push(d); }
      else Object.assign(prod, d);
      Store.save(); UI.closeModal(); App.refresh();
      UI.toast(nuevo ? 'Producto creado' : 'Producto actualizado');
    };
  },

  ajuste(p) {
    const m = UI.modal({
      title: 'Ajustar stock · ' + p.nombre,
      body: `<p class="muted" style="margin-top:0">Stock actual: <b>${U.num(p.stock)} ${U.esc(p.unidad)}</b>. Usa ajustes para corregir el stock o registrar un conteo físico. Para huevos o productos dañados usa <a href="#/mermas">Huevos dañados</a>, así quedan en el reporte.</p>
        <div class="form-grid">
          <div class="field"><label>Tipo de ajuste</label><select class="select" name="tipo">
            <option value="salida">Salida (merma, rotura, vencido)</option><option value="entrada">Entrada (sobrante, devolución)</option><option value="conteo">Conteo físico (fijar stock)</option></select></div>
          <div class="field"><label>Cantidad (${U.esc(p.unidad)})</label><input class="input" type="number" name="cantidad" min="0" step="1"></div>
          <div class="field full"><label>Motivo</label><input class="input" name="motivo" placeholder="Ej.: Producto dañado en almacén"></div>
        </div>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn btn-primary" data-ok>Aplicar ajuste</button>`
    });
    m.querySelector('[data-ok]').onclick = () => {
      const f = UI.form(m);
      const q = Number(f.cantidad);
      if (!(q >= 0) || f.cantidad === '') { UI.toast('Indica una cantidad', 'err'); return; }
      const antes = p.stock;
      p.stock = f.tipo === 'salida' ? antes - q : f.tipo === 'entrada' ? antes + q : q;
      Store.data.ajustes.push({ id: U.uid(), fecha: U.nowStr(), productoId: p.id, nombre: p.nombre, tipo: f.tipo, antes, despues: p.stock, motivo: f.motivo, costo: p.costo });
      Store.save(); UI.closeModal(); App.refresh(); UI.toast('Stock actualizado');
    };
  }
};
