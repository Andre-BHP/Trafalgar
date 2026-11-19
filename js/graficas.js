/* Gráficas en SVG hechas a mano (sin librerías). Cada función recibe un contenedor y lo redibuja completo. */
(function () {
  'use strict';
  const U = window.U;
  const G = {};
  const NS = 'http://www.w3.org/2000/svg';
  const COLOR = { debajo: 'var(--debajo)', arriba: 'var(--arriba)', sin: 'url(#trama-sin-2)' };
  let idSeq = 0;

  const ancho = (cont) => Math.max(300, Math.floor(cont.clientWidth || cont.getBoundingClientRect().width || 600));
  const recortar = (s, n) => (s.length > n ? s.slice(0, n - 1) + '.' : s);
  const trama = (id) => `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--trama-fondo)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--trama-linea)" stroke-width="2"/></pattern></defs>`;
  const forma = (estado, x, y) => {
    if (estado === 'debajo') return `<path d="M${x - 5} ${y - 4}h10l-5 9z" fill="var(--debajo)"/>`;
    if (estado === 'arriba') return `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--arriba)"/>`;
    return `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" fill="none" stroke="var(--sin)" stroke-width="1.5"/><path d="M${x - 2.5} ${y}h5" stroke="var(--sin)" stroke-width="1.5"/>`;
  };
  const techo = (v, paso) => Math.ceil(v / paso) * paso;

  // ---------- 1. Barras horizontales por estado ----------
  G.barrasEstados = function (cont, filas, op) {
    const W = ancho(cont);
    const angosto = W < 520;
    const etqW = angosto ? 118 : 156, difW = angosto ? 50 : 70, valW = angosto ? 44 : 60;
    const fila = 23, arriba = 34, abajo = 30;
    const x0 = etqW + 14, x1 = W - difW - valW - 6;
    const conDato = filas.filter((f) => f.obs !== null);
    const maxV = techo(Math.max(op.ref || 0, ...conDato.map((f) => f.obs)) + 2, 10);
    const sx = (v) => x0 + (v / maxV) * (x1 - x0);
    const H = arriba + filas.length * fila + abajo;
    const tid = 'trama-sin-1';
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="group" aria-label="${U.esc(op.titulo)}">`;
    s += trama(tid);
    // rejilla y eje
    s += '<g class="rejilla eje">';
    for (let v = 0; v <= maxV; v += 10) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba - 4}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    s += `<text class="etq" x="${W - difW}" y="${arriba - 14}" text-anchor="end" font-weight="600">%</text>`;
    s += `<text class="etq" x="${W}" y="${arriba - 14}" text-anchor="end" font-weight="600">Dif. pp</text>`;
    filas.forEach((f, i) => {
      const y = arriba + i * fila;
      const cy = y + fila / 2;
      const sel = f.clave === op.seleccion;
      const etiqueta = `${f.nombre}: ${U.pct(f.obs)}. Referencia nacional ${U.pct(op.ref)}. Diferencia ${U.pp(f.dif)}. ${U.TEXTO_ESTADO[f.estado]}${f.motivo ? '. ' + f.motivo : ''}`;
      s += `<g class="barra${sel ? ' barra--sel' : ''}" role="button" tabindex="0" aria-pressed="${sel}" aria-label="${U.esc(etiqueta)}" data-clave="${f.clave}">`;
      s += `<title>${U.esc(etiqueta)}</title>`;
      s += `<rect class="barra__fondo" x="0" y="${y}" width="${W}" height="${fila}" rx="3"/>`;
      s += forma(f.estado, 7, cy);
      s += `<text class="etq etq-nombre" x="${etqW + 8}" y="${cy + 4}" text-anchor="end">${U.esc(recortar(f.nombre, angosto ? 17 : 24))}</text>`;
      if (f.obs !== null) {
        s += `<rect class="crece" x="${x0}" y="${y + 4}" width="${Math.max(1, sx(f.obs) - x0)}" height="${fila - 8}" fill="${f.estado === 'sin' ? `url(#${tid})` : COLOR[f.estado]}" rx="2"/>`;
        s += `<text class="etq" x="${W - difW}" y="${cy + 4}" text-anchor="end" fill="var(--tinta)">${U.n1(f.obs)}</text>`;
      } else {
        s += `<text class="etq" x="${x0 + 4}" y="${cy + 4}" font-style="italic">Sin datos disponibles</text>`;
        s += `<text class="etq" x="${W - difW}" y="${cy + 4}" text-anchor="end">s/d</text>`;
      }
      s += `<text class="etq" x="${W}" y="${cy + 4}" text-anchor="end" font-weight="600" fill="var(--tinta)">${f.dif === null ? 's/d' : U.pp(f.dif).replace(' pp', '')}</text>`;
      s += '</g>';
    });
    if (op.ref !== null) {
      s += `<line x1="${sx(op.ref)}" x2="${sx(op.ref)}" y1="${arriba - 6}" y2="${H - abajo}" stroke="var(--barra-ref)" stroke-width="2" stroke-dasharray="5 3"/>`;
      const anclaje = sx(op.ref) > x1 - 60 ? 'end' : 'middle';
      s += `<text class="etq" x="${sx(op.ref)}" y="${arriba - 12}" text-anchor="${anclaje}" font-weight="700" fill="var(--tinta)">Nacional ${U.n1(op.ref)}%</text>`;
    }
    s += '</svg>';
    cont.innerHTML = s;
    const barras = U.$$('.barra', cont);
    barras.forEach((g, i) => {
      g.addEventListener('click', () => op.onSelect(g.dataset.clave));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); op.onSelect(g.dataset.clave, true); }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = barras[i + (e.key === 'ArrowDown' ? 1 : -1)]; if (n) n.focus(); }
      });
    });
  };

  // ---------- 2. Aspectos del estado contra referencia nacional ----------
  G.barrasAspectos = function (cont, lista, op) {
    const W = ancho(cont);
    const angosto = W < 520;
    const difW = angosto ? 70 : 84;
    const fila = 44, arriba = 8, abajo = 26;
    const x0 = 6, x1 = W - difW;
    const sx = (v) => x0 + (v / 100) * (x1 - x0);
    const orden = lista.slice().sort((a, b) => (a.estado === 'sin') - (b.estado === 'sin') || (a.dif ?? 0) - (b.dif ?? 0));
    const H = arriba + orden.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="g2-t-svg"><title id="g2-t-svg">${U.esc(op.titulo)}</title>`;
    s += trama('trama-sin-2');
    s += '<g class="rejilla eje">';
    for (let v = 0; v <= 100; v += 20) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    orden.forEach((a, i) => {
      const y = arriba + i * fila;
      const pri = a.id === op.prioridadId;
      const by = y + 20, bh = 15;
      s += `<g><title>${U.esc(`${a.etiqueta}: ${U.pct(a.obs)} en el estado; referencia nacional ${U.pct(a.ref)}; ${U.pp(a.dif)}; ${U.TEXTO_ESTADO[a.estado]}`)}</title>`;
      if (pri) s += `<rect x="0" y="${y + 1}" width="${W}" height="${fila - 2}" rx="4" fill="rgba(242,169,0,.14)"/>`;
      s += forma(a.estado, x0 + 6, y + 10);
      s += `<use href="#i-${a.id}" x="${x0 + 15}" y="${y + 2}" width="15" height="15" class="ico-svg"/>`;
      s += `<text class="etq" x="${x0 + 35}" y="${y + 14}" font-weight="${pri ? 700 : 500}" fill="var(--tinta)">${U.esc((pri ? 'Prioridad: ' : '') + recortar(a.etiqueta, angosto ? 40 : 60))}</text>`;
      if (a.obs !== null) {
        s += `<rect class="crece" x="${x0}" y="${by}" width="${Math.max(1, sx(a.obs) - x0)}" height="${bh}" rx="2" fill="${COLOR[a.estado]}"/>`;
        const tx = sx(a.obs) + 4 + (a.ref !== null && Math.abs(sx(a.ref) - sx(a.obs)) < 34 && a.ref > a.obs ? sx(a.ref) - sx(a.obs) + 2 : 0);
        s += `<text class="etq" x="${Math.min(tx, x1 - 30)}" y="${by + 12}">${U.n1(a.obs)}</text>`;
      } else {
        s += `<text class="etq" x="${x0 + 4}" y="${by + 12}" font-style="italic">Sin datos disponibles</text>`;
      }
      if (a.ref !== null) s += `<line x1="${sx(a.ref)}" x2="${sx(a.ref)}" y1="${by - 4}" y2="${by + bh + 4}" stroke="var(--barra-ref)" stroke-width="3"/>`;
      s += `<text class="etq" x="${W}" y="${by + 12}" text-anchor="end" font-weight="700" fill="var(--tinta)">${a.dif === null ? (a.precision === 'Baja' ? 'Prec. baja' : 's/d') : U.pp(a.dif)}</text>`;
      s += '</g>';
    });
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- 3. Dispersión gasto contra cobertura ----------
  const TICKS_LOG = [10, 30, 100, 300, 1000, 3000, 10000, 30000];
  G.dispersion = function (cont, paises, op) {
    const W = ancho(cont);
    const angosto = W < 520;
    const H = Math.round(Math.min(520, Math.max(300, W * (angosto ? 0.95 : 0.66))));
    const m = { i: angosto ? 40 : 48, d: 12, a: 14, b: 44 };
    const gastos = paises.map((p) => p.gasto).filter((v) => v > 0);
    const uhcs = paises.map((p) => p.uhc).filter((v) => v !== null);
    const gmin = Math.min(...gastos) * 0.8, gmax = Math.max(...gastos) * 1.25;
    const ymin = Math.max(0, Math.floor((Math.min(...uhcs) - 4) / 10) * 10), ymax = 100;
    const lx = (v) => Math.log10(v);
    const sx = (v) => m.i + ((lx(v) - lx(gmin)) / (lx(gmax) - lx(gmin))) * (W - m.i - m.d);
    const sy = (v) => H - m.b - ((v - ymin) / (ymax - ymin)) * (H - m.a - m.b);
    const mex = op.mex;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="g3-svg-t g3-svg-d"><title id="g3-svg-t">Dispersión de gasto en salud por habitante contra cobertura de servicios esenciales, 2023</title><desc id="g3-svg-d">${U.esc(op.descripcion)}</desc>`;
    s += '<g class="rejilla eje">';
    TICKS_LOG.filter((t) => t >= gmin && t <= gmax).forEach((t) => { s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${m.a}" y2="${H - m.b}"/><text x="${sx(t)}" y="${H - m.b + 16}" text-anchor="middle">${t >= 1000 ? U.n0(t) : t}</text>`; });
    for (let v = ymin; v <= ymax; v += 10) s += `<line x1="${m.i}" x2="${W - m.d}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${m.i - 6}" y="${sy(v) + 4}" text-anchor="end">${v}</text>`;
    s += '</g>';
    s += `<text class="etq" x="${(m.i + W - m.d) / 2}" y="${H - 6}" text-anchor="middle" font-weight="600">Gasto en salud por habitante (US$ PPA, escala logarítmica)</text>`;
    s += `<text class="etq" transform="translate(12 ${(m.a + H - m.b) / 2}) rotate(-90)" text-anchor="middle" font-weight="600">Cobertura (índice 0 a 100)</text>`;
    if (mex) {
      // Cuadrante: cobertura igual o mayor que México con menor gasto
      s += `<rect x="${m.i}" y="${m.a}" width="${Math.max(0, sx(mex.gasto) - m.i)}" height="${Math.max(0, sy(mex.uhc) - m.a)}" fill="rgba(46,125,79,.07)"/>`;
      s += `<line x1="${m.i}" x2="${W - m.d}" y1="${sy(mex.uhc)}" y2="${sy(mex.uhc)}" stroke="var(--mexico)" stroke-dasharray="4 3" stroke-width="1.2"/>`;
      s += `<line x1="${sx(mex.gasto)}" x2="${sx(mex.gasto)}" y1="${m.a}" y2="${H - m.b}" stroke="var(--mexico)" stroke-dasharray="4 3" stroke-width="1.2"/>`;
      s += `<text class="etq" x="${m.i + 6}" y="${m.a + 14}" fill="var(--tinta)" font-weight="700">${angosto ? 'Igual o más cobertura, menos gasto' : 'Cobertura igual o mayor que México con menor gasto'}</text>`;
    }
    const orden = paises.slice().sort((a, b) => (a.iso3 === op.sel) - (b.iso3 === op.sel));
    orden.forEach((p) => {
      if (p.iso3 === 'MEX' || p.gasto === null || p.uhc === null) return;
      const x = sx(p.gasto), y = sy(p.uhc);
      const atenuado = op.region && p.region !== op.region;
      const fav = op.favorable(p);
      const tit = `${p.pais} (${p.region}): cobertura ${U.n0(p.uhc)}, gasto ${U.dolares(p.gasto)}, bolsillo ${U.n1(p.bolsillo)}%`;
      s += `<g class="punto${atenuado ? ' punto--atenuado' : ''}" data-iso="${p.iso3}"><title>${U.esc(tit)}</title>`;
      s += `<circle cx="${x}" cy="${y}" r="11" fill="transparent"/>`;
      if (fav) s += `<path d="M${x} ${y - 6}l6 6-6 6-6-6z" fill="var(--favorable)" stroke="var(--frontera)" stroke-width="1"/>`;
      else s += `<circle cx="${x}" cy="${y}" r="4.6" fill="var(--neutro)" stroke="var(--frontera)" stroke-width="1"/>`;
      if (p.iso3 === op.sel) s += `<circle cx="${x}" cy="${y}" r="10" fill="none" stroke="var(--tinta)" stroke-width="2"/><text class="etq" x="${x + 13}" y="${y - 8}" font-weight="700" fill="var(--tinta)">${U.esc(p.pais)}</text>`;
      s += '</g>';
    });
    if (mex) {
      const x = sx(mex.gasto), y = sy(mex.uhc);
      s += `<g class="punto" data-iso="MEX"><title>${U.esc(`México: cobertura ${U.n0(mex.uhc)}, gasto ${U.dolares(mex.gasto)}, bolsillo ${U.n1(mex.bolsillo)}%`)}</title><circle cx="${x}" cy="${y}" r="13" fill="transparent"/>`;
      s += `<path d="M${x} ${y - 9} L${x + 2.6} ${y - 3} L${x + 9} ${y - 2.8} L${x + 4} ${y + 1.4} L${x + 5.6} ${y + 8} L${x} ${y + 4.4} L${x - 5.6} ${y + 8} L${x - 4} ${y + 1.4} L${x - 9} ${y - 2.8} L${x - 2.6} ${y - 3}Z" fill="var(--mexico)" stroke="var(--frontera)" stroke-width="1.2"/>`;
      if (op.sel === 'MEX') s += `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="var(--tinta)" stroke-width="2"/>`;
      s += `<text class="etq" x="${x + 12}" y="${y + 18}" font-weight="700" fill="var(--tinta)">México</text></g>`;
    }
    s += '</svg>';
    cont.innerHTML = s;
    U.$$('.punto', cont).forEach((g) => g.addEventListener('click', () => op.onSelect(g.dataset.iso)));
  };

  // ---------- 4. Gasto de bolsillo ----------
  G.barrasBolsillo = function (cont, paises, op) {
    const W = ancho(cont);
    const angosto = W < 520;
    const etqW = angosto ? 112 : 150;
    const fila = 22, arriba = 6, abajo = 28;
    const x0 = etqW + 8, x1 = W - 46;
    const maxV = techo(Math.max(...paises.map((p) => p.bolsillo || 0), 10), 10);
    const sx = (v) => x0 + (v / maxV) * (x1 - x0);
    const H = arriba + paises.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="g4-svg-t"><title id="g4-svg-t">${U.esc(op.titulo)}</title>`;
    s += '<g class="rejilla eje">';
    for (let v = 0; v <= maxV; v += 10) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    paises.forEach((p, i) => {
      const y = arriba + i * fila, cy = y + fila / 2;
      const mx = p.iso3 === 'MEX', sel = p.iso3 === op.sel;
      s += `<g><title>${U.esc(`${p.pais}: ${U.n1(p.bolsillo)}% del gasto corriente en salud`)}</title>`;
      if (mx || sel) s += `<rect x="0" y="${y}" width="${W}" height="${fila}" rx="3" fill="${mx ? 'rgba(178,59,30,.08)' : 'rgba(242,169,0,.14)'}"/>`;
      s += `<text class="etq" x="${etqW}" y="${cy + 4}" text-anchor="end" font-weight="${mx || sel ? 700 : 400}" fill="${mx ? 'var(--tinta)' : 'var(--tinta-2)'}">${U.esc(recortar(p.pais, angosto ? 16 : 22))}</text>`;
      s += `<rect class="crece" x="${x0}" y="${y + 4}" width="${Math.max(1, sx(p.bolsillo || 0) - x0)}" height="${fila - 8}" rx="2" fill="${mx ? 'var(--mexico)' : 'var(--neutro)'}"/>`;
      s += `<text class="etq" x="${sx(p.bolsillo || 0) + 4}" y="${cy + 4}" font-weight="${mx ? 700 : 400}">${U.n1(p.bolsillo)}</text>`;
      s += '</g>';
    });
    if (op.mex) s += `<line x1="${sx(op.mex.bolsillo)}" x2="${sx(op.mex.bolsillo)}" y1="${arriba}" y2="${H - abajo}" stroke="var(--mexico)" stroke-dasharray="4 3" stroke-width="1.5"/>`;
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Mapas: se dibujan una vez y luego solo cambian color y estado (permite transición) ----------
  const TRAMA_MAPA = (id) => `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--trama-fondo)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--trama-linea)" stroke-width="1.6"/></pattern></defs>`;

  // Clases divergentes de la brecha (pp): 3 tonos por brazo, sin color de punto medio
  G.CLASES_BRECHA = [
    { hasta: -8, var: '--d-3', et: '-8 o menos' },
    { hasta: -3, var: '--d-2', et: '-8 a -3' },
    { hasta: -0.05, var: '--d-1', et: '-3 a 0' },
    { hasta: 3, var: '--a-1', et: '0 a 3' },
    { hasta: 8, var: '--a-2', et: '3 a 8' },
    { hasta: Infinity, var: '--a-3', et: '8 o más' }
  ];
  G.colorBrecha = (dif) => (dif === null || dif === undefined ? 'url(#trama-mx)' : `var(${G.CLASES_BRECHA.find((c) => dif <= c.hasta).var})`);

  const iconoMapa = (estado, x, y) => {
    if (estado === 'debajo') return `<path d="M${x - 4.5} ${y - 3.5}h9l-4.5 8z" fill="var(--tinta)" stroke="var(--papel)" stroke-width="1.2"/>`;
    if (estado === 'arriba') return `<circle cx="${x}" cy="${y}" r="3.6" fill="var(--tinta)" stroke="var(--papel)" stroke-width="1.2"/>`;
    return `<rect x="${x - 3.6}" y="${y - 3.6}" width="7.2" height="7.2" fill="var(--papel)" stroke="var(--tinta)" stroke-width="1.3"/>`;
  };

  G.mapaMexico = function (cont, geo, op) {
    let svg = cont.querySelector('svg');
    if (!svg) {
      let s = `<svg xmlns="${NS}" viewBox="0 0 ${geo.ancho} ${geo.alto}" role="group" aria-label="Mapa de México por estado. Use Tab para recorrer los estados y Enter para elegir uno.">${TRAMA_MAPA('trama-mx')}<g class="capa-estados">`;
      geo.estados.forEach((e) => { s += `<path class="estado-mapa" d="${e.d}" data-clave="${e.clave}" role="button" tabindex="0" style="fill:${G.colorBrecha(op.datos[e.clave].dif)}"><title></title></path>`; });
      s += '</g><g class="capa-iconos" aria-hidden="true"></g></svg>';
      cont.innerHTML = s;
      svg = cont.querySelector('svg');
      U.$$('.estado-mapa', svg).forEach((p) => {
        p.addEventListener('click', () => cont._op.onSelect(p.dataset.clave));
        p.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cont._op.onSelect(p.dataset.clave, true); } });
      });
    }
    // Las funciones de selección cambian con cada pintado; se guardan en el contenedor
    cont._op = op;
    U.$$('.estado-mapa', svg).forEach((p) => {
      const d = op.datos[p.dataset.clave];
      p.style.fill = G.colorBrecha(d.dif);
      const etq = `${d.nombre}: ${U.TEXTO_ESTADO[d.estado]}. Satisfacción ${U.pct(d.obs)}; referencia nacional ${U.pct(d.ref)}; ${U.pp(d.dif)}.`;
      p.setAttribute('aria-label', etq);
      p.querySelector('title').textContent = etq;
      const sel = p.dataset.clave === op.seleccion;
      p.classList.toggle('estado-mapa--sel', sel);
      p.setAttribute('aria-pressed', String(sel));
    });
    // El estado elegido se dibuja encima para que su borde no quede tapado
    const elegido = svg.querySelector('.estado-mapa--sel');
    if (elegido) elegido.parentNode.appendChild(elegido);
    svg.querySelector('.capa-iconos').innerHTML = geo.estados.map((e) => iconoMapa(op.datos[e.clave].estado, e.cx, e.cy)).join('');
  };
  const rellenoPais = (c, id) => (c === null ? `url(#trama-${id})` : `var(--s-${c + 1})`);
  G.mapaMundo = function (cont, geo, op) {
    let svg = cont.querySelector('svg');
    if (!svg) {
      const id = cont.id;
      let s = `<svg xmlns="${NS}" viewBox="0 0 ${geo.ancho} ${geo.alto}" role="img" aria-labelledby="${id}-svg-t"><title id="${id}-svg-t"></title>${TRAMA_MAPA('trama-' + id)}<g>`;
      geo.paises.forEach((p) => { s += `<path class="pais-mapa" d="${p.d}" data-iso="${p.iso3}" style="fill:${rellenoPais(op.clase(p.iso3), id)}"/>`; });
      s += '</g></svg>';
      cont.innerHTML = s;
      svg = cont.querySelector('svg');
      svg.addEventListener('click', (ev) => { const p = ev.target.closest('.pais-mapa'); if (p) cont._op.onSelect(p.dataset.iso); });
      svg.addEventListener('pointermove', (ev) => { const p = ev.target.closest('.pais-mapa'); cont._op.onTip(p ? p.dataset.iso : null, ev); });
      svg.addEventListener('pointerleave', (ev) => cont._op.onTip(null, ev));
    }
    cont._op = op;
    svg.querySelector('title').textContent = op.titulo;
    U.$$('.pais-mapa', svg).forEach((p) => {
      const c = op.clase(p.dataset.iso);
      p.style.fill = rellenoPais(c, cont.id);
      p.classList.toggle('pais-mapa--mex', p.dataset.iso === 'MEX');
      p.classList.toggle('pais-mapa--sel', p.dataset.iso === op.sel && op.sel !== 'MEX');
    });
    const g = svg.querySelector('g');
    const mx = svg.querySelector('.pais-mapa--mex'); if (mx) g.appendChild(mx);
    const sel = svg.querySelector('.pais-mapa--sel'); if (sel) g.appendChild(sel);
  };

  window.G = G;
})();
