/*
 * Motor de precios.
 * Cada producto tiene una unidad base y varias presentaciones (Unidad, Paquete x12, Caja x24...).
 * Cada presentación tiene un "factor" (cuántas unidades base contiene) y escalas de precio
 * por cantidad (tramos): el precio unitario depende de cuántas presentaciones se lleven.
 *
 * Regla mayor/menor: una línea es "mayorista" si se vende en una presentación con factor > 1
 * o si alcanza un tramo de precio por volumen (distinto del primero).
 */
const Pricing = {
  tramosOrdenados(pres) {
    return [...(pres.tramos || [])].sort((a, b) => a.min - b.min);
  },
  tramo(pres, qty) {
    const t = Pricing.tramosOrdenados(pres);
    let idx = 0;
    t.forEach((x, i) => { if (qty >= x.min) idx = i; });
    return { precio: t[idx].precio, min: t[idx].min, idx, siguiente: t[idx + 1] || null, total: t.length };
  },
  pres(prod, presId) {
    return prod.presentaciones.find(p => p.id === presId) || prod.presentaciones[0];
  },
  linea(prod, presId, qty) {
    const pres = Pricing.pres(prod, presId);
    const q = Math.max(0, Number(qty) || 0);
    const tr = Pricing.tramo(pres, q);
    const canal = (pres.factor > 1 || tr.idx > 0) ? 'mayor' : 'menor';
    const subtotal = U.r2(tr.precio * q);
    const precioMenorPres = Pricing.precioMenor(prod) * pres.factor;
    const ahorro = Math.max(0, U.r2(precioMenorPres * q - subtotal));
    let sugerencia = null;
    if (tr.siguiente) {
      const falta = tr.siguiente.min - q;
      sugerencia = { falta, precio: tr.siguiente.precio };
    }
    return { pres, tramo: tr, canal, precioUnit: tr.precio, subtotal, ahorro, cantidadBase: q * pres.factor, sugerencia };
  },
  /** Precio de 1 unidad base al por menor */
  precioMenor(prod) {
    const base = prod.presentaciones[0];
    return Pricing.tramosOrdenados(base)[0].precio / (base.factor || 1);
  },
  /** Mejor precio por unidad base disponible (máximo volumen) */
  precioMayorMin(prod) {
    let min = Infinity;
    prod.presentaciones.forEach(p => p.tramos.forEach(t => { min = Math.min(min, t.precio / p.factor); }));
    return min === Infinity ? 0 : min;
  },
  margen(precioBase, costoBase) {
    return precioBase > 0 ? (precioBase - costoBase) / precioBase * 100 : 0;
  },
  /** Expresa una cantidad en unidades base usando la presentación más grande: "10 caja + 4 und" */
  equivalencia(prod, qtyBase) {
    const pres = [...prod.presentaciones].sort((a, b) => b.factor - a.factor);
    const grande = pres[0];
    if (!grande || grande.factor <= 1 || qtyBase < grande.factor) return '';
    const n = Math.floor(qtyBase / grande.factor);
    const resto = qtyBase - n * grande.factor;
    return '≈ ' + U.num(n) + ' ' + grande.nombre.toLowerCase() + (resto ? ' + ' + U.num(resto) + ' ' + prod.unidad : '');
  }
};
