/* Componentes de interfaz reutilizables */
const ICON = {
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M12 20V9M7 14l5-5 5 5M5 4h14"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 8v5M12 16.5v.5M10.3 3.9L2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  print: '<svg viewBox="0 0 24 24"><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/></svg>',
  adjust: '<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>'
};

const UI = {
  charts: [],
  destroyCharts() { UI.charts.forEach(c => c.destroy()); UI.charts = []; },
  css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); },
  series() { return ['--s1', '--s2', '--s3', '--s4', '--s5', '--s6'].map(UI.css); },

  chart(canvas, cfg) {
    if (!window.Chart) {
      canvas.parentElement.innerHTML = '<div class="empty">Los gráficos necesitan conexión a internet.</div>';
      return null;
    }
    const text2 = UI.css('--text-2'), grid = UI.css('--grid'), muted = UI.css('--muted');
    Chart.defaults.font.family = UI.css('--font');
    Chart.defaults.color = muted;
    const base = {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: UI.css('--surface'), titleColor: UI.css('--text'), bodyColor: text2,
          borderColor: UI.css('--border-strong'), borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true,
          callbacks: { label: ctx => ' ' + (ctx.dataset.label ? ctx.dataset.label + ': ' : '') + U.money(ctx.parsed.y ?? ctx.parsed) }
        }
      }
    };
    if (cfg.type !== 'doughnut') {
      base.scales = {
        x: { grid: { display: false }, border: { color: UI.css('--axis') }, ticks: { color: muted, maxRotation: 0, autoSkipPadding: 12 } },
        y: { grid: { color: grid }, border: { display: false }, ticks: { color: muted, callback: v => U.moneyShort(v) }, beginAtZero: true }
      };
    }
    cfg.options = UI.merge(base, cfg.options || {});
    const c = new Chart(canvas, cfg);
    UI.charts.push(c);
    return c;
  },
  merge(a, b) {
    const out = Array.isArray(a) ? [...a] : { ...a };
    Object.keys(b).forEach(k => {
      out[k] = (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object')
        ? UI.merge(a[k], b[k]) : b[k];
    });
    return out;
  },
  legend(items) {
    return '<div class="legend">' + items.map(([label, color]) => `<span><i style="background:${color}"></i>${U.esc(label)}</span>`).join('') + '</div>';
  },

  modal({ title, body, footer = '', size = '' }) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-backdrop"><div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${U.esc(title)}">
      <div class="modal-head"><h2>${U.esc(title)}</h2><button class="icon-btn" data-close aria-label="Cerrar">
      <svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="modal-body">${body}</div>${footer ? `<div class="modal-foot">${footer}</div>` : ''}</div></div>`;
    const bd = root.querySelector('.modal-backdrop');
    bd.addEventListener('mousedown', e => { if (e.target === bd) UI.closeModal(); });
    root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', UI.closeModal));
    const m = root.querySelector('.modal');
    setTimeout(() => { const f = m.querySelector('input:not([type=hidden]):not([disabled]), select'); if (f) f.focus(); }, 30);
    return m;
  },
  closeModal() { document.getElementById('modalRoot').innerHTML = ''; },

  confirm(msg, onYes, { ok = 'Confirmar', danger = true, title = 'Confirmar' } = {}) {
    const m = UI.modal({
      title,
      body: `<p style="margin:0">${msg}</p>`,
      footer: `<button class="btn" data-close>Cancelar</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-yes>${U.esc(ok)}</button>`
    });
    m.querySelector('[data-close]').onclick = UI.closeModal;
    m.querySelector('[data-yes]').onclick = () => { UI.closeModal(); onYes(); };
  },

  toast(msg, type = 'ok') {
    const t = document.createElement('div');
    t.className = 'toast' + (type === 'err' ? ' err' : '');
    t.textContent = msg;
    document.getElementById('toastRoot').appendChild(t);
    setTimeout(() => t.remove(), 3200);
  },

  periodo(value, act = 'periodo') {
    return `<select class="select" data-change="${act}" aria-label="Periodo">${U.PERIODOS.map(([k, l]) =>
      `<option value="${k}" ${k === value ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  },
  tabs(items, active, act = 'tab') {
    return `<div class="tabs" role="tablist">${items.map(([k, l, n]) =>
      `<button class="tab ${k === active ? 'active' : ''}" role="tab" data-act="${act}" data-id="${k}">${l}${n != null ? `<span class="count">${n}</span>` : ''}</button>`).join('')}</div>`;
  },
  search(value, placeholder, act = 'q') {
    return `<label class="search">${ICON.search}<input class="input" type="search" placeholder="${U.esc(placeholder)}" value="${U.esc(value)}" data-input="${act}"></label>`;
  },
  canal(c) {
    return c === 'mayor' ? '<span class="badge mayor">Por mayor</span>' : '<span class="badge menor">Por menor</span>';
  },

  /** Enlaza eventos por delegación: data-act (click), data-change, data-input */
  bind(el, handlers) {
    el.onclick = e => {
      const t = e.target.closest('[data-act]');
      if (t && el.contains(t) && handlers[t.dataset.act]) handlers[t.dataset.act](t.dataset.id, t, e);
    };
    el.onchange = e => {
      const t = e.target.closest('[data-change]');
      if (t && handlers[t.dataset.change]) handlers[t.dataset.change](t.value, t, e);
    };
    el.oninput = e => {
      const t = e.target.closest('[data-input]');
      if (t && handlers[t.dataset.input]) handlers[t.dataset.input](t.value, t, e);
    };
  },

  /** Lee los campos [name] de un contenedor */
  form(el) {
    const o = {};
    el.querySelectorAll('[name]').forEach(f => { o[f.name] = f.type === 'checkbox' ? f.checked : f.value; });
    return o;
  }
};

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && document.querySelector('#modalRoot .modal')) UI.closeModal();
});
