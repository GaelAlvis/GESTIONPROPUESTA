/* Datos de demostración: distribuidora de huevos + producción de escabeches, 90 días de operación simulada */
const Seed = {
  vacio() {
    return {
      version: 3,
      config: { negocio: 'Mi Negocio', moneda: 'Bs', diasVencimiento: 30 },
      productos: [], proveedores: [], compras: [], ventas: [], movimientos: [], ajustes: [],
      mermas: [], producciones: [],
      seq: { venta: 0, compra: 0, lote: 0 }
    };
  },

  /** Receta de referencia para 100 frascos de escabeche (se escala según la cantidad producida) */
  RECETAS: {
    'ESC-001': [['Zanahoria', '15 kg', 75], ['Cebolla', '10 kg', 60], ['Locoto', '2 kg', 30], ['Vainita', '5 kg', 50], ['Vinagre', '12 L', 96], ['Aceite', '3 L', 45], ['Sal y especias', '—', 25], ['Frascos 500 g con tapa', '100 u', 350], ['Etiquetas', '100 u', 40], ['Gas', '1/2 garrafa', 12]],
    'ESC-002': [['Zanahoria', '30 kg', 150], ['Cebolla', '20 kg', 120], ['Locoto', '4 kg', 60], ['Vainita', '10 kg', 100], ['Vinagre', '24 L', 192], ['Aceite', '6 L', 90], ['Sal y especias', '—', 45], ['Frascos 1 kg con tapa', '100 u', 550], ['Etiquetas', '100 u', 40], ['Gas', '1 garrafa', 23]],
    'ESC-003': [['Zanahoria', '12 kg', 60], ['Cebolla', '10 kg', 60], ['Locoto', '6 kg', 90], ['Vinagre', '12 L', 96], ['Aceite', '3 L', 45], ['Sal y especias', '—', 30], ['Frascos 500 g con tapa', '100 u', 350], ['Etiquetas', '100 u', 40], ['Gas', '1/2 garrafa', 12]]
  },

  /** "15 kg" × 1,2 → "18 kg"; "1/2 garrafa" × 1,2 → "0,6 garrafa" */
  escalar(texto, f) {
    const m = String(texto).match(/^(\d+)(?:\/(\d+))?\s*(.*)$/);
    if (!m) return texto;
    const v = Math.round((m[2] ? m[1] / m[2] : +m[1]) * f * 10) / 10;
    return U.num(v, v % 1 ? 1 : 0) + ' ' + m[3];
  },

  generar() {
    const rnd = U.rng(20261116);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const data = Seed.vacio();
    data.config.negocio = 'Huevos y Escabeches Demo';

    const proveedores = [
      ['Agencia Avícola El Granjero S.R.L.', '1023456021', 'Rosa Medina', '71234567', 'pedidos@granjero-demo.bo', 'Huevos (agencia)'],
      ['Avícola Los Andes S.R.L.', '2034567018', 'Luis Paredes', '72345678', 'ventas@losandes-demo.bo', 'Huevos (agencia)'],
      ['Envases y Frascos Bolivia S.A.', '3045678015', 'Carla Rojas', '73456789', 'contacto@envases-demo.bo', 'Frascos y etiquetas']
    ];
    proveedores.forEach(p => data.proveedores.push({
      id: U.uid(), nombre: p[0], ruc: p[1], contacto: p[2], telefono: p[3], email: p[4], rubro: p[5], notas: ''
    }));
    const prov = i => (i == null ? '' : data.proveedores[i].id);

    // [código, nombre, categoría, unidad, costo por unidad base, stock mínimo, proveedor, presentaciones [nombre, factor, cliente final?, tramos], días para vencer]
    const catalogo = [
      ['HUE-001', 'Huevo Extra', 'Huevos', 'huevo', 300 / 360, 1800, 0,
        [['Unidad', 1, true, [[1, 1.10]]], ['Maple x30', 30, true, [[1, 30], [10, 28]]], ['Caja x360 (12 maples)', 360, false, [[1, 320], [5, 312]]]], 20],
      ['HUE-002', 'Huevo de Primera', 'Huevos', 'huevo', 270 / 360, 2400, 0,
        [['Unidad', 1, true, [[1, 1.00]]], ['Maple x30', 30, true, [[1, 27], [10, 25.5]]], ['Caja x360 (12 maples)', 360, false, [[1, 290], [5, 284]]]], 22],
      ['HUE-003', 'Huevo de Segunda', 'Huevos', 'huevo', 243 / 360, 1800, 1,
        [['Unidad', 1, true, [[1, 0.90]]], ['Maple x30', 30, true, [[1, 24], [10, 22.8]]], ['Caja x360 (12 maples)', 360, false, [[1, 260], [5, 255]]]], 25],
      ['HUE-004', 'Huevo de Tercera', 'Huevos', 'huevo', 216 / 360, 1440, 1,
        [['Unidad', 1, true, [[1, 0.80]]], ['Maple x30', 30, true, [[1, 21], [10, 20]]], ['Caja x360 (12 maples)', 360, false, [[1, 230], [5, 226]]]], 25],
      ['ESC-001', 'Escabeche de verduras 500 g', 'Escabeches', 'frasco', 8.6, 36, null,
        [['Frasco', 1, true, [[1, 18], [12, 15]]], ['Caja x12 frascos', 12, false, [[1, 168], [5, 160]]]], 120],
      ['ESC-002', 'Escabeche de verduras 1 kg', 'Escabeches', 'frasco', 14.4, 24, null,
        [['Frasco', 1, true, [[1, 32], [12, 28]]], ['Caja x12 frascos', 12, false, [[1, 300], [5, 288]]]], 120],
      ['ESC-003', 'Escabeche picante con locoto 500 g', 'Escabeches', 'frasco', 8.2, 30, null,
        [['Frasco', 1, true, [[1, 20], [12, 17]]], ['Caja x12 frascos', 12, false, [[1, 190], [5, 182]]]], 14]
    ];

    const hoy = U.today();
    const inicio = U.addDays(hoy, -89);

    catalogo.forEach(c => {
      data.productos.push({
        id: U.uid(), codigo: c[0], nombre: c[1], categoria: c[2], unidad: c[3],
        costo: c[4], costoRef: c[4], stock: c[5] * 3, stockMin: c[5], proveedorId: prov(c[6]),
        vence: c[8] ? U.addDays(hoy, c[8]) : '',
        presentaciones: c[7].map(p => ({ id: U.uid(), nombre: p[0], factor: p[1], menor: p[2], tramos: p[3].map(t => ({ min: t[0], precio: t[1] })) }))
      });
    });
    const P = data.productos;
    const huevos = P.filter(p => p.categoria === 'Huevos');
    const escabeches = P.filter(p => p.categoria === 'Escabeches');

    const mayoristas = ['Tienda Doña Rosa', 'Minimarket San Juan', 'Pensión El Buen Sabor', 'Panadería La Espiga', 'Restaurante Don Lucho', 'Hotel Las Palmeras', 'Pollería El Rey'];
    const minoristas = ['María López', 'Carlos Quispe', 'Ana Torres', 'Pedro Mamani', 'Lucía Flores', 'Jorge Ramos', 'Rosa Choque'];
    const metodos = ['Efectivo', 'Efectivo', 'Efectivo', 'QR', 'QR', 'QR', 'Transferencia'];
    const hora = (h1, h2) => U.pad(ri(h1, h2)) + ':' + U.pad(ri(0, 59));
    const motivosTienda = ['Rotos en manipulación', 'Trizados / rajados', 'Rotos en manipulación', 'Sucios / descartados', 'Podridos o vencidos'];

    const merma = (dia, prod, cantidad, motivo, nota = '') => {
      if (cantidad <= 0 || prod.stock < cantidad) return;
      Ops.aplicarMerma(data, { id: U.uid(), fecha: dia + 'T' + hora(9, 19), productoId: prod.id, cantidad, motivo, nota });
    };

    let dia = inicio;
    while (dia <= hoy) {
      const d = U.parse(dia);
      const dow = d.getDay();
      const dom = d.getDate();
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const reciente = dia > U.addDays(hoy, -10);
      const avance = (U.parse(dia) - U.parse(inicio)) / (89 * 864e5);

      // Compra de huevos a la agencia: lunes y jueves, por caja de 360
      if (dow === 1 || dow === 4) {
        const porProv = {};
        huevos.forEach(p => {
          if (dia > U.addDays(hoy, -5) && p.codigo === 'HUE-004') return; // para mostrar alerta de stock bajo
          if (p.stock < p.stockMin * 2) (porProv[p.proveedorId] = porProv[p.proveedorId] || []).push(p);
        });
        Object.keys(porProv).forEach(pid => {
          const items = porProv[pid].map(p => {
            const caja = p.presentaciones[p.presentaciones.length - 1];
            const cant = Math.max(1, Math.ceil((p.stockMin * 5 - p.stock) / caja.factor));
            const costoUnit = U.r2(p.costoRef * caja.factor * (0.97 + rnd() * 0.06));
            return { productoId: p.id, nombre: p.nombre, presId: caja.id, presentacion: caja.nombre, factor: caja.factor, cantidad: cant, costoUnit, subtotal: U.r2(cant * costoUnit) };
          });
          Ops.aplicarCompra(data, {
            id: U.uid(), numero: Store.siguienteEn(data, 'compra', 'C-', 5), fecha: dia + 'T' + hora(7, 8),
            proveedorId: pid, documento: 'Fact. ' + String(ri(1000, 9999)), items,
            total: U.r2(U.sum(items, i => i.subtotal)), estado: reciente && rnd() < 0.6 ? 'pendiente' : 'pagado', notas: ''
          });
          // Huevos que llegan rotos o trizados desde la agencia
          items.forEach(i => {
            const prod = P.find(p => p.id === i.productoId);
            merma(dia, prod, Math.round(i.cantidad * i.factor * (0.002 + rnd() * 0.008)), 'Rotos en transporte', 'Recepción ' + data.compras[data.compras.length - 1].numero);
          });
        });
      }

      // Producción de escabeches: un lote cuando el stock baja
      if (dow !== 0) {
        const falta = escabeches.filter(p => p.stock < p.stockMin * 1.5 && !(p.codigo === 'ESC-003' && dia > U.addDays(hoy, -6)))
          .sort((a, b) => a.stock / a.stockMin - b.stock / b.stockMin)[0];
        if (falta) {
          const cantidad = ri(8, 12) * 12;
          const esc = cantidad / 100;
          const insumos = Seed.RECETAS[falta.codigo].map(([nombre, cant, costo]) => ({
            nombre, cantidad: Seed.escalar(cant, esc),
            costo: U.r2(costo * esc * (0.95 + rnd() * 0.12))
          }));
          Ops.aplicarProduccion(data, {
            id: U.uid(), numero: Store.siguienteEn(data, 'lote', 'L-', 4), fecha: dia + 'T' + hora(8, 10),
            productoId: falta.id, cantidad, insumos, notas: ''
          });
        }
      }

      // Ventas del día
      const nVentas = Math.round((dow === 0 ? ri(6, 10) : ri(14, 22)) * (0.75 + 0.5 * avance));
      const horas = Array.from({ length: nVentas }, () => hora(7, 20)).sort();
      horas.forEach(h => {
        const mayor = rnd() < 0.18 + 0.12 * avance;
        const nLineas = mayor ? ri(1, 3) : ri(1, 2);
        const lineas = [];
        const usados = new Set();
        for (let k = 0; k < nLineas; k++) {
          const p = rnd() < 0.86 ? pick(huevos) : pick(escabeches);
          if (usados.has(p.id)) continue;
          usados.add(p.id);
          const ref = Pricing.presRef(p);
          const grande = p.presentaciones[p.presentaciones.length - 1];
          let pres = ref, cant;
          if (mayor) {
            if (rnd() < 0.5) { pres = grande; cant = ri(1, 3); }
            else { const t2 = ref.tramos[1]; cant = t2 ? ri(t2.min, t2.min * 2) : ri(6, 12); }
          } else if (p.unidad === 'huevo' && rnd() < 0.25) {
            pres = p.presentaciones[0]; cant = ri(6, 15);
          } else {
            cant = rnd() < 0.65 ? 1 : ri(2, 3);
          }
          lineas.push({ productoId: p.id, presId: pres.id, cantidad: cant });
        }
        const validas = lineas.filter(l => Ops.stockSuficiente(data, [l]).length === 0);
        if (!validas.length || Ops.stockSuficiente(data, validas).length) return;
        const cliente = mayor ? pick(mayoristas) : (rnd() < 0.7 ? 'Cliente general' : pick(minoristas));
        const venta = Ops.construirVenta(data, {
          numero: Store.siguienteEn(data, 'venta', 'V-', 6), fecha: dia + 'T' + h, cliente,
          metodo: mayor && rnd() < 0.4 ? 'Transferencia' : pick(metodos),
          descuento: mayor && rnd() < 0.15 ? ri(5, 15) : 0, lineas: validas
        });
        Ops.aplicarVenta(data, venta);
      });

      // Huevos dañados en tienda (casi todos los días) y algún frasco roto
      huevos.forEach(p => { if (rnd() < 0.55) merma(dia, p, ri(2, 14), pick(motivosTienda)); });
      if (rnd() < 0.08) merma(dia, pick(escabeches), ri(1, 2), 'Frasco roto');

      // Gastos operativos
      const gasto = (categoria, descripcion, monto, metodo = 'Transferencia') =>
        data.movimientos.push({ id: U.uid(), fecha: dia, tipo: 'gasto', categoria, descripcion, monto: U.r2(monto), metodo });
      if (dom === 1) gasto('Alquiler', 'Alquiler del local y depósito', 1800);
      if (dom === 5) gasto('Servicios', 'Luz y agua', 220 + rnd() * 90);
      if (dom === 8) gasto('Servicios', 'Internet y telefonía', 99);
      if (dom === 15 || dom === ultimoDia) gasto('Personal', 'Pago a ayudante (quincena)', 1300);
      if (dom === 20) gasto('Impuestos', 'Pago de impuestos del mes', 300 + rnd() * 200);
      if (dow === 1 || dow === 4) gasto('Transporte', 'Flete de huevos desde la agencia', 60 + rnd() * 40, 'Efectivo');
      if (dow === 6) gasto('Transporte', 'Entregas a mayoristas', 50 + rnd() * 60, 'Efectivo');
      if (rnd() < 0.05) gasto('Mantenimiento', pick(['Reparación de estante', 'Limpieza de depósito', 'Mantenimiento de cocina']), 60 + rnd() * 150, 'Efectivo');
      if (rnd() < 0.04) gasto('Marketing', pick(['Publicidad en redes', 'Volantes', 'Banner del local']), 80 + rnd() * 150);
      if (rnd() < 0.08) data.movimientos.push({ id: U.uid(), fecha: dia, tipo: 'ingreso', categoria: 'Servicios', descripcion: 'Cobro por delivery', monto: U.r2(20 + rnd() * 50), metodo: 'Efectivo' });

      dia = U.addDays(dia, 1);
    }
    P.forEach(p => { delete p.costoRef; });
    return data;
  }
};

/* Numerador que funciona sobre cualquier objeto de datos (se usa al generar la demo) */
Store.siguienteEn = function (data, tipo, prefijo, digitos) {
  data.seq[tipo] = (data.seq[tipo] || 0) + 1;
  return prefijo + String(data.seq[tipo]).padStart(digitos, '0');
};
