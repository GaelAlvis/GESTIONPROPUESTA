/*
 * Capa de datos.
 * Hoy guarda todo en localStorage (demo). Para pasar a una base de datos real (p. ej. Supabase),
 * basta con reemplazar load()/save() y las operaciones de Ops por llamadas a la API:
 * la interfaz solo usa Store y Ops.
 */
const Ops = {
  /** Construye una venta a partir de líneas {productoId, presId, cantidad} */
  construirVenta(data, { fecha, cliente, metodo, descuento, lineas, numero }) {
    const items = lineas.map(l => {
      const prod = data.productos.find(p => p.id === l.productoId);
      const c = Pricing.linea(prod, l.presId, l.cantidad);
      return {
        productoId: prod.id,
        nombre: prod.nombre,
        presId: c.pres.id,
        presentacion: c.pres.nombre,
        factor: c.pres.factor,
        cantidad: Number(l.cantidad),
        cantidadBase: c.cantidadBase,
        precioUnit: c.precioUnit,
        tramoMin: c.tramo.min,
        subtotal: c.subtotal,
        ahorro: c.ahorro,
        canal: c.canal,
        costoUnitBase: prod.costo,
        costo: U.r2(prod.costo * c.cantidadBase)
      };
    });
    const bruto = U.r2(U.sum(items, i => i.subtotal));
    const desc = Math.min(U.r2(descuento || 0), bruto);
    return {
      id: U.uid(),
      numero,
      fecha,
      cliente: (cliente || '').trim() || 'Cliente general',
      metodo: metodo || 'Efectivo',
      items,
      bruto,
      descuento: desc,
      total: U.r2(bruto - desc),
      costoTotal: U.r2(U.sum(items, i => i.costo)),
      ahorro: U.r2(U.sum(items, i => i.ahorro)),
      tipo: items.some(i => i.canal === 'mayor') ? 'mayor' : 'menor'
    };
  },
  stockSuficiente(data, lineas) {
    const req = {};
    lineas.forEach(l => {
      const prod = data.productos.find(p => p.id === l.productoId);
      const pres = Pricing.pres(prod, l.presId);
      req[prod.id] = (req[prod.id] || 0) + (Number(l.cantidad) || 0) * pres.factor;
    });
    const faltantes = [];
    Object.keys(req).forEach(id => {
      const prod = data.productos.find(p => p.id === id);
      if (req[id] > prod.stock) faltantes.push({ prod, requerido: req[id] });
    });
    return faltantes;
  },
  aplicarVenta(data, venta) {
    venta.items.forEach(i => {
      const prod = data.productos.find(p => p.id === i.productoId);
      if (prod) prod.stock = U.r2(prod.stock - i.cantidadBase);
    });
    data.ventas.push(venta);
  },
  anularVenta(data, id) {
    const v = data.ventas.find(x => x.id === id);
    if (!v) return;
    v.items.forEach(i => {
      const prod = data.productos.find(p => p.id === i.productoId);
      if (prod) prod.stock = U.r2(prod.stock + i.cantidadBase);
    });
    data.ventas = data.ventas.filter(x => x.id !== id);
  },
  /** Registra una compra: suma stock y recalcula el costo promedio ponderado */
  aplicarCompra(data, compra) {
    compra.items.forEach(i => {
      const prod = data.productos.find(p => p.id === i.productoId);
      if (!prod) return;
      const qBase = i.cantidad * i.factor;
      const costoBase = i.costoUnit / i.factor;
      const stockPrev = Math.max(0, prod.stock);
      const total = stockPrev + qBase;
      prod.costo = total > 0
        ? Math.round((stockPrev * prod.costo + qBase * costoBase) / total * 10000) / 10000
        : costoBase;
      prod.stock = U.r2(prod.stock + qBase);
    });
    data.compras.push(compra);
  },
  anularCompra(data, id) {
    const c = data.compras.find(x => x.id === id);
    if (!c) return;
    c.items.forEach(i => {
      const prod = data.productos.find(p => p.id === i.productoId);
      if (prod) prod.stock = U.r2(prod.stock - i.cantidad * i.factor);
    });
    data.compras = data.compras.filter(x => x.id !== id);
  }
};

const Store = (() => {
  const KEY = 'gestion-comercial-demo-bo-v2';
  const S = { data: null, persistente: true };

  S.load = function () {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { S.data = JSON.parse(raw); return; }
    } catch (e) { S.persistente = false; }
    S.data = Seed.generar();
    S.save();
  };
  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); S.persistente = true; }
    catch (e) { S.persistente = false; console.warn('No se pudo guardar', e); }
  };
  S.reset = function () { S.data = Seed.generar(); S.save(); };
  S.vaciar = function () { S.data = Seed.vacio(); S.save(); };
  S.importar = function (obj) {
    if (!obj || !Array.isArray(obj.productos) || !Array.isArray(obj.ventas)) throw new Error('Archivo no válido');
    S.data = Object.assign(Seed.vacio(), obj);
    S.save();
  };
  S.siguiente = function (tipo, prefijo, digitos) {
    S.data.seq[tipo] = (S.data.seq[tipo] || 0) + 1;
    return prefijo + String(S.data.seq[tipo]).padStart(digitos, '0');
  };
  S.producto = id => S.data.productos.find(p => p.id === id);
  S.proveedor = id => S.data.proveedores.find(p => p.id === id);
  S.categorias = () => [...new Set(S.data.productos.map(p => p.categoria).filter(Boolean))].sort();
  return S;
})();
