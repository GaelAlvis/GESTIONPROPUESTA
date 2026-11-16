/* Utilidades generales: formato, fechas, ids, archivos */
const U = {
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  },
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  r2(n) {
    return Math.round((Number(n) || 0) * 100) / 100;
  },
  money(n) {
    const sym = (window.Store && Store.data && Store.data.config.moneda) || 'Bs';
    const v = Number(n) || 0;
    const s = Math.abs(v).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (v < 0 ? '-' : '') + sym + ' ' + s;
  },
  moneyShort(n) {
    const sym = (window.Store && Store.data && Store.data.config.moneda) || 'Bs';
    const v = Number(n) || 0;
    if (Math.abs(v) >= 1000) return sym + ' ' + (v / 1000).toLocaleString('es-BO', { maximumFractionDigits: 1 }) + 'k';
    return sym + ' ' + v.toLocaleString('es-BO', { maximumFractionDigits: 0 });
  },
  num(n, d = 0) {
    return (Number(n) || 0).toLocaleString('es-BO', { minimumFractionDigits: d, maximumFractionDigits: d });
  },
  pct(n) {
    return (Number(n) || 0).toLocaleString('es-BO', { maximumFractionDigits: 1 }) + '%';
  },
  pad(n) { return String(n).padStart(2, '0'); },
  ymd(d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
  today() { return U.ymd(new Date()); },
  nowStr() {
    const d = new Date();
    return U.ymd(d) + 'T' + U.pad(d.getHours()) + ':' + U.pad(d.getMinutes());
  },
  parse(ymd) {
    const [y, m, d] = ymd.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d);
  },
  addDays(ymd, n) {
    const d = U.parse(ymd); d.setDate(d.getDate() + n); return U.ymd(d);
  },
  fmtDate(s) {
    if (!s) return '';
    const [y, m, d] = s.slice(0, 10).split('-');
    return d + '/' + m + '/' + y;
  },
  fmtDateTime(s) {
    if (!s) return '';
    return U.fmtDate(s) + (s.length > 10 ? ' ' + s.slice(11, 16) : '');
  },
  shortDay(ymd) {
    const d = U.parse(ymd);
    return d.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
  },
  PERIODOS: [
    ['hoy', 'Hoy'], ['7d', 'Últimos 7 días'], ['30d', 'Últimos 30 días'],
    ['mes', 'Este mes'], ['mesant', 'Mes anterior'], ['90d', 'Últimos 90 días'], ['todo', 'Todo']
  ],
  rango(key) {
    const t = U.today();
    const d = new Date();
    switch (key) {
      case 'hoy': return { desde: t, hasta: t };
      case '7d': return { desde: U.addDays(t, -6), hasta: t };
      case '30d': return { desde: U.addDays(t, -29), hasta: t };
      case '90d': return { desde: U.addDays(t, -89), hasta: t };
      case 'mes': return { desde: U.ymd(new Date(d.getFullYear(), d.getMonth(), 1)), hasta: t };
      case 'mesant': return {
        desde: U.ymd(new Date(d.getFullYear(), d.getMonth() - 1, 1)),
        hasta: U.ymd(new Date(d.getFullYear(), d.getMonth(), 0))
      };
      default: return { desde: '0000-01-01', hasta: '9999-12-31' };
    }
  },
  enRango(fecha, r) {
    const f = fecha.slice(0, 10);
    return f >= r.desde && f <= r.hasta;
  },
  dias(r) {
    const out = [];
    let d = r.desde;
    if (d === '0000-01-01') return out;
    while (d <= r.hasta) { out.push(d); d = U.addDays(d, 1); }
    return out;
  },
  sum(arr, fn) { return arr.reduce((a, x) => a + (Number(fn(x)) || 0), 0); },
  rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  },
  download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  toCSV(rows) {
    return '﻿' + rows.map(r => r.map(v => {
      const s = String(v ?? '');
      return /[",;\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(';')).join('\n');
  }
};
