/* Datos de demostración: catálogo genérico (alimentos y no alimentos) + 90 días de operación simulada */
const Seed = {
  vacio() {
    return {
      version: 1,
      config: { negocio: 'Mi Negocio', moneda: 'Bs', diasVencimiento: 30 },
      productos: [], proveedores: [], compras: [], ventas: [], movimientos: [], ajustes: [],
      seq: { venta: 0, compra: 0 }
    };
  },

  generar() {
    const rnd = U.rng(20261116);
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = arr => arr[Math.floor(rnd() * arr.length)];
    const data = Seed.vacio();
    data.config.negocio = 'Comercial Demo';

    const proveedores = [
      ['Distribuidora Andina S.R.L.', '1023456021', 'Rosa Medina', '71234567', 'ventas@andina-demo.bo', 'Abarrotes'],
      ['Comercial del Oriente S.R.L.', '2034567018', 'Luis Paredes', '72345678', 'pedidos@oriente-demo.bo', 'Bebidas y conservas'],
      ['Higiene Total S.A.', '3045678015', 'Carla Rojas', '73456789', 'contacto@higiene-demo.bo', 'Limpieza y cuidado personal'],
      ['Papelera Central S.R.L.', '4056789012', 'Jorge Salas', '74567890', 'ventas@papelera-demo.bo', 'Útiles y oficina'],
      ['Ferretería Industrial S.A.', '5067890019', 'Miguel Torres', '75678901', 'ventas@ferreind-demo.bo', 'Ferretería']
    ];
    proveedores.forEach(p => data.proveedores.push({
      id: U.uid(), nombre: p[0], ruc: p[1], contacto: p[2], telefono: p[3], email: p[4], rubro: p[5], notas: ''
    }));
    const prov = i => data.proveedores[i].id;

    // [código, nombre, categoría, unidad, costo, stockMin, proveedor, presentaciones, días para vencer]
    const catalogo = [
      ['ABR-001', 'Arroz extra 1 kg', 'Abarrotes', 'kg', 3.20, 150, 0, [['Unidad', 1, [[1, 4.20], [10, 3.90]]], ['Saco x50', 50, [[1, 185], [5, 178]]]], 240],
      ['ABR-002', 'Azúcar rubia 1 kg', 'Abarrotes', 'kg', 3.10, 120, 0, [['Unidad', 1, [[1, 4.00], [10, 3.80]]], ['Saco x50', 50, [[1, 175], [5, 170]]]], 300],
      ['ABR-003', 'Aceite vegetal 1 L', 'Abarrotes', 'und', 6.80, 48, 0, [['Unidad', 1, [[1, 8.90], [12, 8.30]]], ['Caja x12', 12, [[1, 96], [5, 92]]]], 180],
      ['ABR-004', 'Leche evaporada 400 g', 'Abarrotes', 'und', 3.30, 96, 0, [['Unidad', 1, [[1, 4.20], [24, 3.95]]], ['Caja x48', 48, [[1, 185], [3, 180]]]], 18],
      ['ABR-005', 'Atún en lata 170 g', 'Conservas', 'und', 4.10, 96, 1, [['Unidad', 1, [[1, 5.50], [12, 5.00]]], ['Caja x48', 48, [[1, 228], [3, 222]]]], 400],
      ['BEB-001', 'Gaseosa 500 ml', 'Bebidas', 'und', 1.40, 96, 1, [['Unidad', 1, [[1, 2.50], [12, 2.10]]], ['Paquete x12', 12, [[1, 24.00], [10, 22.80]]]], 120],
      ['BEB-002', 'Agua mineral 625 ml', 'Bebidas', 'und', 0.80, 90, 1, [['Unidad', 1, [[1, 1.50], [15, 1.20]]], ['Paquete x15', 15, [[1, 16.50], [10, 15.80]]]], 200],
      ['SNK-001', 'Galletas de soda (paquete)', 'Snacks', 'und', 0.60, 96, 0, [['Unidad', 1, [[1, 1.00], [24, 0.85]]], ['Display x24', 24, [[1, 19.50], [10, 18.50]]]], 25],
      ['LIM-001', 'Detergente en polvo 900 g', 'Limpieza', 'und', 7.50, 36, 2, [['Unidad', 1, [[1, 9.90], [6, 9.20]]], ['Caja x12', 12, [[1, 105], [5, 100]]]], null],
      ['LIM-002', 'Papel higiénico x4', 'Limpieza', 'paq', 3.80, 48, 2, [['Paquete', 1, [[1, 5.20], [10, 4.70]]], ['Bolsa x12', 12, [[1, 54], [5, 52]]]], null],
      ['CUI-001', 'Jabón de tocador 90 g', 'Cuidado personal', 'und', 1.10, 144, 2, [['Unidad', 1, [[1, 1.80], [12, 1.50]]], ['Caja x72', 72, [[1, 100], [3, 96]]]], null],
      ['UTI-001', 'Cuaderno A4 100 hojas', 'Útiles', 'und', 3.50, 48, 3, [['Unidad', 1, [[1, 5.50], [12, 4.80]]], ['Paquete x12', 12, [[1, 56], [5, 54]]]], null],
      ['UTI-002', 'Lapicero azul', 'Útiles', 'und', 0.45, 150, 3, [['Unidad', 1, [[1, 1.00], [12, 0.75]]], ['Caja x50', 50, [[1, 32], [5, 30]]]], null],
      ['FER-001', 'Foco LED 9 W', 'Ferretería', 'und', 4.00, 40, 4, [['Unidad', 1, [[1, 7.50], [10, 6.50]]], ['Caja x20', 20, [[1, 120], [5, 114]]]], null]
    ];

    const hoy = U.today();
    const inicio = U.addDays(hoy, -89);

    // Precios base del catálogo llevados a bolivianos (factor aproximado) y redondeados a 0,10 Bs
    const K = 1.9;
    const bs = v => Math.round(v * K * 10) / 10;
    catalogo.forEach(c => {
      data.productos.push({
        id: U.uid(), codigo: c[0], nombre: c[1], categoria: c[2], unidad: c[3],
        costo: U.r2(c[4] * K), costoRef: U.r2(c[4] * K), stock: c[5] * 3, stockMin: c[5], proveedorId: prov(c[6]),
        vence: c[8] ? U.addDays(hoy, c[8]) : '',
        presentaciones: c[7].map(p => ({ id: U.uid(), nombre: p[0], factor: p[1], tramos: p[2].map(t => ({ min: t[0], precio: bs(t[1]) })) }))
      });
    });

    const mayoristas = ['Bodega Rosita', 'Minimarket San Juan', 'Restaurante El Buen Sabor', 'Colegio Los Pinos', 'Bodega Don Lucho', 'Librería Central', 'Hostal Las Palmeras'];
    const minoristas = ['María López', 'Carlos Quispe', 'Ana Torres', 'Pedro Mamani', 'Lucía Flores', 'Jorge Ramos', 'Rosa Choque'];
    const metodos = ['Efectivo', 'Efectivo', 'Efectivo', 'QR', 'QR', 'Tarjeta', 'Transferencia'];
    const hora = (h1, h2) => U.pad(ri(h1, h2)) + ':' + U.pad(ri(0, 59));
    const P = data.productos;

    let dia = inicio;
    while (dia <= hoy) {
      const d = U.parse(dia);
      const dow = d.getDay();
      const dom = d.getDate();
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const reciente = dia > U.addDays(hoy, -10);

      // Reposición: lunes y jueves, se compra por presentación grande a cada proveedor
      if (dow === 1 || dow === 4) {
        const porProv = {};
        P.forEach(p => {
          // Algunos productos sin reponer la última semana, para mostrar alertas de stock bajo
          if (dia > U.addDays(hoy, -8) && ['ABR-004', 'SNK-001', 'UTI-002', 'BEB-001'].includes(p.codigo)) return;
          if (p.stock < p.stockMin * 2) (porProv[p.proveedorId] = porProv[p.proveedorId] || []).push(p);
        });
        Object.keys(porProv).forEach(pid => {
          const items = porProv[pid].map(p => {
            const grande = [...p.presentaciones].sort((a, b) => b.factor - a.factor)[0];
            const cant = Math.max(1, Math.ceil((p.stockMin * 5 - p.stock) / grande.factor));
            const costoUnit = U.r2(p.costoRef * grande.factor * (0.97 + rnd() * 0.07));
            return { productoId: p.id, nombre: p.nombre, presId: grande.id, presentacion: grande.nombre, factor: grande.factor, cantidad: cant, costoUnit, subtotal: U.r2(cant * costoUnit) };
          });
          const pendiente = reciente && rnd() < 0.6;
          Ops.aplicarCompra(data, {
            id: U.uid(), numero: Store.siguienteEn(data, 'compra', 'C-', 5), fecha: dia + 'T' + hora(8, 9),
            proveedorId: pid, documento: 'Fact. ' + String(ri(1000, 9999)), items,
            total: U.r2(U.sum(items, i => i.subtotal)), estado: pendiente ? 'pendiente' : 'pagado', notas: ''
          });
        });
      }

      // Ventas del día
      // Tendencia de crecimiento suave para que la demo muestre un negocio en alza
      const avance = (U.parse(dia) - U.parse(inicio)) / (89 * 864e5);
      const nVentas = Math.round((dow === 0 ? ri(4, 7) : ri(8, 15)) * (0.75 + 0.5 * avance));
      const horas = Array.from({ length: nVentas }, () => hora(8, 20)).sort();
      horas.forEach(h => {
        const mayor = rnd() < 0.16 + 0.14 * avance;
        const nLineas = mayor ? ri(1, 3) : ri(1, 4);
        const lineas = [];
        const usados = new Set();
        for (let k = 0; k < nLineas; k++) {
          const p = pick(P);
          if (usados.has(p.id)) continue;
          usados.add(p.id);
          let pres = p.presentaciones[0], cant;
          if (mayor) {
            if (rnd() < 0.55) { pres = p.presentaciones[p.presentaciones.length - 1]; cant = ri(1, 3); }
            else { const t2 = pres.tramos[1]; cant = t2 ? ri(t2.min, t2.min * 2) : ri(6, 12); }
          } else {
            cant = rnd() < 0.6 ? 1 : ri(2, 5);
          }
          lineas.push({ productoId: p.id, presId: pres.id, cantidad: cant });
        }
        const validas = lineas.filter(l => Ops.stockSuficiente(data, [l]).length === 0);
        if (!validas.length || Ops.stockSuficiente(data, validas).length) return;
        const cliente = mayor ? pick(mayoristas) : (rnd() < 0.7 ? 'Cliente general' : pick(minoristas));
        const venta = Ops.construirVenta(data, {
          numero: Store.siguienteEn(data, 'venta', 'V-', 6), fecha: dia + 'T' + h, cliente,
          metodo: mayor && rnd() < 0.5 ? 'Transferencia' : pick(metodos),
          descuento: mayor && rnd() < 0.2 ? ri(2, 10) : 0, lineas: validas
        });
        Ops.aplicarVenta(data, venta);
      });

      // Gastos operativos
      const gasto = (categoria, descripcion, monto, metodo = 'Transferencia') =>
        data.movimientos.push({ id: U.uid(), fecha: dia, tipo: 'gasto', categoria, descripcion, monto: U.r2(monto * K), metodo });
      if (dom === 1) gasto('Alquiler', 'Alquiler del local', 850);
      if (dom === 5) gasto('Servicios', 'Luz y agua', 140 + rnd() * 60);
      if (dom === 8) gasto('Servicios', 'Internet y telefonía', 89);
      if (dom === 15 || dom === ultimoDia) gasto('Personal', 'Pago a ayudante (quincena)', 650);
      if (dom === 20) gasto('Impuestos', 'Pago de impuestos del mes', 120 + rnd() * 130);
      if (dow === 6) gasto('Transporte', 'Fletes y movilidad', 40 + rnd() * 80, 'Efectivo');
      if (rnd() < 0.05) gasto('Mantenimiento', pick(['Reparación de estante', 'Limpieza de local', 'Cambio de cerradura']), 50 + rnd() * 120, 'Efectivo');
      if (rnd() < 0.04) gasto('Marketing', pick(['Volantes publicitarios', 'Publicidad en redes', 'Banner de fachada']), 60 + rnd() * 140);
      if (rnd() < 0.08) data.movimientos.push({ id: U.uid(), fecha: dia, tipo: 'ingreso', categoria: 'Servicios', descripcion: 'Cobro por delivery', monto: U.r2((15 + rnd() * 40) * K), metodo: 'Efectivo' });

      dia = U.addDays(dia, 1);
    }
    P.forEach(p => { p.costo = U.r2(p.costo * 100) / 100; delete p.costoRef; });
    return data;
  }
};

/* Numerador que funciona sobre cualquier objeto de datos (se usa al generar la demo) */
Store.siguienteEn = function (data, tipo, prefijo, digitos) {
  data.seq[tipo] = (data.seq[tipo] || 0) + 1;
  return prefijo + String(data.seq[tipo]).padStart(digitos, '0');
};
