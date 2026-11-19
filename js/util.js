/* Utilidades generales: formato numérico en español de México y creación de elementos */
(function () {
  'use strict';
  const fmt1 = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt0 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 });
  const U = {};

  U.r1 = (x) => (x === null || x === undefined || Number.isNaN(x) ? null : Math.round(x * 10) / 10);
  U.pct = (x) => (x === null || x === undefined ? 'Sin datos disponibles' : fmt1.format(x) + '%');
  U.n1 = (x) => (x === null || x === undefined ? 'Sin datos' : fmt1.format(x));
  U.n0 = (x) => (x === null || x === undefined ? 'Sin datos' : fmt0.format(x));
  // Diferencia en puntos porcentuales con signo; usa el signo menos tipográfico
  U.pp = (x) => {
    if (x === null || x === undefined) return 'Sin datos comparables';
    const s = fmt1.format(Math.abs(x));
    return (x > 0 ? '+' : x < 0 ? '−' : '') + s + ' pp';
  };
  U.dolares = (x) => (x === null || x === undefined ? 'Sin datos' : 'US$ ' + fmt0.format(x));
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.sinAcentos = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  U.$ = (sel, raiz) => (raiz || document).querySelector(sel);
  U.$$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  // Iconos de estado (SVG, sin emojis). Forma distinta para cada estado además del color.
  U.icono = (estado, tam) => {
    const t = tam || 14;
    if (estado === 'debajo') return `<svg width="${t}" height="${t}" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><path d="M1 3h12L7 12z" fill="var(--debajo)"/></svg>`;
    if (estado === 'arriba') return `<svg width="${t}" height="${t}" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><circle cx="7" cy="7" r="5.5" fill="var(--arriba)"/></svg>`;
    return `<svg width="${t}" height="${t}" viewBox="0 0 14 14" aria-hidden="true" focusable="false"><rect x="1.5" y="1.5" width="11" height="11" fill="none" stroke="var(--sin)" stroke-width="1.6"/><path d="M4 7h6" stroke="var(--sin)" stroke-width="1.6"/></svg>`;
  };
  U.TEXTO_ESTADO = {
    debajo: 'Por debajo de la referencia',
    arriba: 'En la referencia o por encima',
    sin: 'Sin datos comparables'
  };
  U.estadoHTML = (estado) => `<span class="estado estado--${estado}">${U.icono(estado)}${U.TEXTO_ESTADO[estado]}</span>`;

  // Enlace a una fuente del catálogo
  U.fuente = (id, texto) => {
    const f = window.DATOS.fuentes.fuentes[id];
    if (!f) return U.esc(texto || id);
    return f.url ? `<a href="${U.esc(f.url)}" target="_blank" rel="noopener">${U.esc(texto || f.titulo)}</a>` : U.esc(texto || f.titulo);
  };

  // Íconos de línea del sprite de index.html (mismo trazo para todo el sitio)
  U.ico = (id, clase) => `<svg class="ico${clase ? ' ' + clase : ''}" aria-hidden="true" focusable="false"><use href="#i-${id}"/></svg>`;
  U.iconoAspecto = (id) => U.ico(id, 'ico--aspecto');

  // Cifras que se cuentan solas: el texto final se escribe primero; la animación solo lo reemplaza mientras corre.
  U.movimiento = () => !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) && document.visibilityState === 'visible';
  U.contar = (el, valor, formato, ms) => {
    if (!el) return;
    el.textContent = formato(valor);
    if (!U.movimiento() || valor === null || valor === undefined) return;
    const t0 = performance.now(), dur = ms || 900;
    const paso = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = formato(k < 1 ? valor * e : valor);
      if (k < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  };

  // Sello de fuente (movimiento distintivo «Cartilla»): enlace circular con institución, programa y cuadro.
  let selloId = 0;
  U.sello = (fuenteId, arriba, abajo, centro, centroSub) => {
    const f = window.DATOS.fuentes.fuentes[fuenteId] || {};
    const id = 'sello-' + (++selloId);
    const svg = `<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
      <circle r="46" fill="none" stroke="currentColor" stroke-width="2.4"/>
      <circle r="34" fill="none" stroke="currentColor" stroke-width="1"/>
      <path id="${id}a" d="M -40 0 A 40 40 0 0 1 40 0" fill="none"/>
      <path id="${id}b" d="M -40 0 A 40 40 0 0 0 40 0" fill="none"/>
      <text font-size="8.6"><textPath href="#${id}a" startOffset="50%" text-anchor="middle">${U.esc(arriba)}</textPath></text>
      <text font-size="7.4" dy="7"><textPath href="#${id}b" startOffset="50%" text-anchor="middle">${U.esc(abajo)}</textPath></text>
      <text y="${centroSub ? 2 : 5}" text-anchor="middle" font-size="${String(centro).length > 4 ? 12 : 17}">${U.esc(centro)}</text>
      ${centroSub ? `<text y="14" text-anchor="middle" font-size="7">${U.esc(centroSub)}</text>` : ''}
    </svg>`;
    return `<a class="sello sello--imprime" href="${U.esc(f.url || '#metodo')}" target="_blank" rel="noopener" aria-label="Fuente: ${U.esc(f.titulo || arriba)} (abre en otra pestaña)">${svg}</a>`;
  };

  // Tema claro u oscuro: respeta el sistema y permite elegir; la elección se guarda solo en este navegador
  U.tema = {
    leer() { try { return localStorage.getItem('sec-tema'); } catch (e) { return null; } },
    guardar(v) { try { localStorage.setItem('sec-tema', v); } catch (e) { /* sin almacenamiento */ } },
    actual() { const t = document.documentElement.dataset.theme; if (t) return t; return window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  };

  window.U = U;
})();
