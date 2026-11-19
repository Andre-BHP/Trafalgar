/* Visualizaciones adicionales (SVG propio). Cada una responde una pregunta concreta y tiene tabla equivalente. */
(function () {
  'use strict';
  const U = window.U, G = window.G;
  const V = {};
  const NS = 'http://www.w3.org/2000/svg';
  const ancho = (c) => Math.max(300, Math.floor(c.clientWidth || c.getBoundingClientRect().width || 600));
  const recortar = (s, n) => (s.length > n ? s.slice(0, n - 1) + '.' : s);
  const trama = (id) => `<defs><pattern id="${id}" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--trama-fondo)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--trama-linea)" stroke-width="1.6"/></pattern></defs>`;

  // Tabla equivalente plegable (lectores de pantalla y quien prefiera leer cifras)
  V.tablaEquivalente = (caption, cabeceras, filas) => `<details class="equivalente"><summary>Ver los datos en tabla</summary>
    <div class="tabla-cont" tabindex="0" role="region" aria-label="${U.esc(caption)}"><table><caption>${caption}</caption>
    <thead><tr>${cabeceras.map((h, i) => `<th scope="col"${i ? ' class="num"' : ''}>${h}</th>`).join('')}</tr></thead>
    <tbody>${filas.map((f) => `<tr>${f.map((c, i) => (i ? `<td class="num">${c}</td>` : `<th scope="row">${c}</th>`)).join('')}</tr>`).join('')}</tbody></table></div></details>`;

  // ---------- Mancuernas 2023 contra 2025 ----------
  V.mancuernas = function (cont, filas, op) {
    const W = ancho(cont), angosto = W < 520;
    const etqW = angosto ? 112 : 150, difW = angosto ? 58 : 72, fila = 22, arriba = 26, abajo = 28;
    const x0 = etqW + 12, x1 = W - difW;
    const vals = filas.flatMap((f) => [f.v23, f.v25]).filter((v) => v !== null);
    const lo = Math.max(0, Math.floor((Math.min(...vals) - 3) / 10) * 10), hi = Math.ceil((Math.max(...vals) + 3) / 10) * 10;
    const sx = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const H = arriba + filas.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title>`;
    s += '<g class="rejilla eje">';
    for (let v = lo; v <= hi; v += 10) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba - 6}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    s += `<text class="etq" x="${W}" y="${arriba - 10}" text-anchor="end" font-weight="600">Cambio pp</text>`;
    filas.forEach((f, i) => {
      const cy = arriba + i * fila + fila / 2;
      const sel = f.clave === op.seleccion;
      if (sel) s += `<rect x="0" y="${cy - fila / 2}" width="${W}" height="${fila}" rx="3" fill="color-mix(in srgb, var(--foco) 18%, transparent)"/>`;
      s += `<text class="etq" x="${etqW}" y="${cy + 4}" text-anchor="end" font-weight="${sel ? 700 : 400}" fill="var(--tinta${sel ? '' : '-2'})">${U.esc(recortar(f.nombre, angosto ? 16 : 22))}</text>`;
      if (f.v23 === null || f.v25 === null) { s += `<text class="etq" x="${x0}" y="${cy + 4}" font-style="italic">Sin datos disponibles</text>`; return; }
      const sube = f.v25 >= f.v23, color = sube ? 'var(--arriba)' : 'var(--debajo)';
      s += `<g opacity="${f.estable ? 1 : 0.55}"><title>${U.esc(`${f.nombre}: ${U.pct(f.v23)} en 2023, ${U.pct(f.v25)} en 2025 (${U.pp(f.dif)})${f.estable ? '' : '. Precisión baja en algún año'}`)}</title>`;
      s += `<line x1="${sx(f.v23)}" x2="${sx(f.v25)}" y1="${cy}" y2="${cy}" stroke="${color}" stroke-width="3" stroke-linecap="round"${f.estable ? '' : ' stroke-dasharray="3 3"'}/>`;
      s += `<circle cx="${sx(f.v23)}" cy="${cy}" r="4.5" fill="var(--papel)" stroke="var(--tinta-2)" stroke-width="1.6"/>`;
      s += `<circle cx="${sx(f.v25)}" cy="${cy}" r="5.5" fill="${color}" stroke="var(--papel)" stroke-width="1.5"/></g>`;
      s += `<text class="etq" x="${W}" y="${cy + 4}" text-anchor="end" font-weight="600" fill="var(--tinta)">${U.pp(f.dif).replace(' pp', '')}${f.estable ? '' : '*'}</text>`;
    });
    if (op.nac23 !== null) {
      s += `<line x1="${sx(op.nac25)}" x2="${sx(op.nac25)}" y1="${arriba - 4}" y2="${H - abajo}" stroke="var(--ref)" stroke-width="1.5" stroke-dasharray="4 3"/>`;
    }
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Mapa de calor estado por aspecto ----------
  V.calor = function (cont, filas, aspectos, op) {
    const W = ancho(cont), angosto = W < 520;
    const etqW = angosto ? 104 : 150, arriba = 34, fila = angosto ? 18 : 20;
    const cw = Math.min(64, (W - etqW - 8) / aspectos.length);
    const H = arriba + filas.length * fila + 6;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title>${trama('trama-calor')}`;
    aspectos.forEach((a, j) => {
      const x = etqW + 6 + j * cw;
      s += `<g><title>${U.esc(a.etiqueta)}</title><use href="#i-${a.id}" x="${x + cw / 2 - 9}" y="6" width="18" height="18" class="ico-svg"/></g>`;
    });
    filas.forEach((f, i) => {
      const y = arriba + i * fila, sel = f.clave === op.seleccion;
      s += `<text class="etq" x="${etqW}" y="${y + fila / 2 + 4}" text-anchor="end" font-weight="${sel ? 700 : 400}" fill="var(--tinta${sel ? '' : '-2'})">${U.esc(recortar(f.nombre, angosto ? 15 : 22))}</text>`;
      aspectos.forEach((a, j) => {
        const c = f.celdas[a.id], x = etqW + 6 + j * cw;
        const fill = c.dif === null ? 'url(#trama-calor)' : G.colorBrecha(c.dif).replace('url(#trama-mx)', 'url(#trama-calor)');
        s += `<rect x="${x + 1}" y="${y + 1}" width="${cw - 2}" height="${fila - 2}" rx="2" fill="${fill}"><title>${U.esc(`${f.nombre}, ${a.etiqueta}: ${U.pct(c.obs)} (nacional ${U.pct(c.ref)}; ${U.pp(c.dif)})`)}</title></rect>`;
      });
      if (sel) s += `<rect x="${etqW + 5}" y="${y + .5}" width="${aspectos.length * cw + 1}" height="${fila - 1}" rx="3" fill="none" stroke="var(--tinta)" stroke-width="2"/>`;
    });
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Diagrama de puntos: tres instituciones por estado ----------
  const FORMAS = [
    (x, y) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--c-1)" stroke="var(--papel)" stroke-width="1.2"/>`,
    (x, y) => `<rect x="${x - 4.5}" y="${y - 4.5}" width="9" height="9" fill="var(--c-2)" stroke="var(--papel)" stroke-width="1.2"/>`,
    (x, y) => `<path d="M${x} ${y - 6}l6 6-6 6-6-6z" fill="var(--c-3)" stroke="var(--papel)" stroke-width="1.2"/>`
  ];
  V.formaSerie = (i, tam) => `<svg width="${tam || 14}" height="${tam || 14}" viewBox="-7 -7 14 14" aria-hidden="true" focusable="false">${FORMAS[i](0, 0)}</svg>`;
  V.puntosInstituciones = function (cont, filas, series, op) {
    const W = ancho(cont), angosto = W < 520;
    const etqW = angosto ? 112 : 150, fila = 22, arriba = 10, abajo = 28;
    const x0 = etqW + 12, x1 = W - 10;
    const sx = (v) => x0 + (v / 100) * (x1 - x0);
    const H = arriba + filas.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title><g class="rejilla eje">`;
    for (let v = 0; v <= 100; v += 20) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    filas.forEach((f, i) => {
      const cy = arriba + i * fila + fila / 2, sel = f.clave === op.seleccion;
      if (sel) s += `<rect x="0" y="${cy - fila / 2}" width="${W}" height="${fila}" rx="3" fill="color-mix(in srgb, var(--foco) 18%, transparent)"/>`;
      s += `<text class="etq" x="${etqW}" y="${cy + 4}" text-anchor="end" font-weight="${sel ? 700 : 400}" fill="var(--tinta${sel ? '' : '-2'})">${U.esc(recortar(f.nombre, angosto ? 16 : 22))}</text>`;
      const vs = f.valores.filter((v) => v !== null);
      if (vs.length > 1) s += `<line x1="${sx(Math.min(...vs))}" x2="${sx(Math.max(...vs))}" y1="${cy}" y2="${cy}" stroke="var(--eje)" stroke-width="2"/>`;
      f.valores.forEach((v, k) => { if (v !== null) s += `<g><title>${U.esc(`${f.nombre}, ${series[k]}: ${U.pct(v)}`)}</title>${FORMAS[k](sx(v), cy)}</g>`; });
    });
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Puntos con intervalo (precisión) ----------
  V.intervalos = function (cont, filas, op) {
    const W = ancho(cont), angosto = W < 520;
    const etqW = angosto ? 112 : 150, fila = 20, arriba = 22, abajo = 28;
    const x0 = etqW + 12, x1 = W - 12;
    const lo = Math.max(0, Math.floor((Math.min(...filas.map((f) => f.inf)) - 2) / 10) * 10);
    const hi = Math.min(100, Math.ceil((Math.max(...filas.map((f) => f.sup)) + 2) / 10) * 10);
    const sx = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
    const H = arriba + filas.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title><g class="rejilla eje">`;
    for (let v = lo; v <= hi; v += 10) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba - 6}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}%</text>`;
    s += '</g>';
    s += `<rect x="${sx(op.ref)}" y="${arriba - 8}" width="1" height="0"/>`;
    filas.forEach((f, i) => {
      const cy = arriba + i * fila + fila / 2, sel = f.clave === op.seleccion;
      const color = f.incierta ? 'var(--sin)' : f.obs < op.ref ? 'var(--debajo)' : 'var(--arriba)';
      if (sel) s += `<rect x="0" y="${cy - fila / 2}" width="${W}" height="${fila}" rx="3" fill="color-mix(in srgb, var(--foco) 18%, transparent)"/>`;
      s += `<text class="etq" x="${etqW}" y="${cy + 4}" text-anchor="end" font-weight="${sel ? 700 : 400}" fill="var(--tinta${sel ? '' : '-2'})">${U.esc(recortar(f.nombre, angosto ? 16 : 22))}</text>`;
      s += `<g><title>${U.esc(`${f.nombre}: ${U.pct(f.obs)}; intervalo aproximado ${U.n1(f.inf)} a ${U.n1(f.sup)}%. ${f.incierta ? 'El intervalo cruza la referencia nacional.' : 'El intervalo no cruza la referencia nacional.'}`)}</title>`;
      s += `<line x1="${sx(f.inf)}" x2="${sx(f.sup)}" y1="${cy}" y2="${cy}" stroke="${color}" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
      s += f.incierta ? `<circle cx="${sx(f.obs)}" cy="${cy}" r="4.5" fill="var(--papel)" stroke="${color}" stroke-width="2"/>` : `<circle cx="${sx(f.obs)}" cy="${cy}" r="4.5" fill="${color}"/>`;
      s += '</g>';
    });
    s += `<line x1="${sx(op.ref)}" x2="${sx(op.ref)}" y1="${arriba - 8}" y2="${H - abajo}" stroke="var(--ref)" stroke-width="2" stroke-dasharray="5 3"/><text class="etq" x="${sx(op.ref)}" y="${arriba - 10}" text-anchor="middle" font-weight="700" fill="var(--tinta)">Nacional ${U.n1(op.ref)}%</text>`;
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Cuadrícula de 100 (waffle) ----------
  V.waffle = function (cont, items) {
    cont.innerHTML = `<div class="waffles">${items.map((it) => {
      const n = Math.round(it.pct);
      let celdas = '';
      for (let k = 0; k < 100; k++) {
        const fila = Math.floor(k / 10), col = k % 10, lleno = k < n;
        celdas += `<rect x="${col * 11}" y="${(9 - fila) * 11}" width="9.5" height="9.5" rx="1.5" fill="${lleno ? (it.mexico ? 'var(--mexico)' : 'var(--neutro)') : 'var(--linea)'}"/>`;
      }
      return `<figure class="waffle"><svg viewBox="0 0 109 109" role="img" aria-label="${U.esc(`${it.pais}: ${n} de cada 100 pesos de gasto en salud salen del bolsillo de los hogares`)}">${celdas}</svg>
        <figcaption><strong>${U.esc(it.pais)}</strong><span class="waffle__n">${n}</span> de cada 100 pesos</figcaption></figure>`;
    }).join('')}</div>`;
  };

  // ---------- Paletas (lollipop) ----------
  V.paletas = function (cont, paises, op) {
    const W = ancho(cont), angosto = W < 520;
    const etqW = angosto ? 112 : 150, fila = 22, arriba = 8, abajo = 28;
    const x0 = etqW + 10, x1 = W - 40;
    const sx = (v) => x0 + (v / 100) * (x1 - x0);
    const H = arriba + paises.length * fila + abajo;
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title><g class="rejilla eje">`;
    for (let v = 0; v <= 100; v += 20) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${arriba}" y2="${H - abajo}"/><text x="${sx(v)}" y="${H - abajo + 16}" text-anchor="middle">${v}</text>`;
    s += '</g>';
    paises.forEach((p, i) => {
      const cy = arriba + i * fila + fila / 2, mx = p.iso3 === 'MEX';
      s += `<g><title>${U.esc(`${p.pais}: cobertura ${U.n0(p.uhc)} de 100`)}</title>`;
      s += `<text class="etq" x="${etqW}" y="${cy + 4}" text-anchor="end" font-weight="${mx ? 700 : 400}" fill="var(--tinta${mx ? '' : '-2'})">${U.esc(recortar(p.pais, angosto ? 16 : 22))}</text>`;
      s += `<line class="crece" x1="${x0}" x2="${sx(p.uhc)}" y1="${cy}" y2="${cy}" stroke="${mx ? 'var(--mexico)' : 'var(--neutro)'}" stroke-width="2"/>`;
      s += `<circle cx="${sx(p.uhc)}" cy="${cy}" r="${mx ? 6.5 : 5}" fill="${mx ? 'var(--mexico)' : 'var(--neutro)'}" stroke="var(--papel)" stroke-width="1.5"/>`;
      s += `<text class="etq" x="${sx(p.uhc) + 10}" y="${cy + 4}" font-weight="${mx ? 700 : 400}" fill="var(--tinta)">${U.n0(p.uhc)}</text></g>`;
    });
    s += '</svg>';
    cont.innerHTML = s;
  };

  // ---------- Pequeños múltiplos por región ----------
  V.multiples = function (cont, paises, regiones, op) {
    const gastos = paises.map((p) => p.gasto).filter((v) => v > 0);
    const gmin = Math.min(...gastos) * 0.8, gmax = Math.max(...gastos) * 1.25;
    const lx = Math.log10;
    const w = 220, h = 150, m = { i: 26, d: 6, a: 8, b: 20 };
    const sx = (v) => m.i + ((lx(v) - lx(gmin)) / (lx(gmax) - lx(gmin))) * (w - m.i - m.d);
    const sy = (v) => h - m.b - ((v - 20) / 80) * (h - m.a - m.b);
    const mex = paises.find((p) => p.iso3 === 'MEX');
    cont.innerHTML = `<div class="multiples">${regiones.map((r) => {
      const propios = paises.filter((p) => p.region === r);
      let s = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${U.esc(`${r}: ${propios.length} países`)}"><g class="rejilla eje">`;
      [40, 60, 80, 100].forEach((v) => { s += `<line x1="${m.i}" x2="${w - m.d}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${m.i - 4}" y="${sy(v) + 3}" text-anchor="end" font-size="9">${v}</text>`; });
      [100, 1000, 10000].forEach((t) => { s += `<line x1="${sx(t)}" x2="${sx(t)}" y1="${m.a}" y2="${h - m.b}"/><text x="${sx(t)}" y="${h - 6}" text-anchor="middle" font-size="9">${t >= 1000 ? U.n0(t) : t}</text>`; });
      s += '</g>';
      paises.forEach((p) => { if (p.region !== r) s += `<circle cx="${sx(p.gasto)}" cy="${sy(p.uhc)}" r="2" fill="var(--eje)" opacity=".6"/>`; });
      propios.forEach((p) => { if (p.iso3 !== 'MEX') s += `<circle cx="${sx(p.gasto)}" cy="${sy(p.uhc)}" r="3.6" fill="var(--c-1)" stroke="var(--papel)" stroke-width=".8"><title>${U.esc(`${p.pais}: cobertura ${U.n0(p.uhc)}, ${U.dolares(p.gasto)}`)}</title></circle>`; });
      if (mex) s += `<circle cx="${sx(mex.gasto)}" cy="${sy(mex.uhc)}" r="4.5" fill="${mex.region === r ? 'var(--mexico)' : 'none'}" stroke="var(--mexico)" stroke-width="1.5"><title>México: cobertura ${U.n0(mex.uhc)}, ${U.dolares(mex.gasto)}</title></circle>`;
      s += '</svg>';
      const med = propios.map((p) => p.uhc).sort((a, b) => a - b)[Math.floor(propios.length / 2)];
      return `<figure class="multiple"><figcaption><strong>${U.esc(r)}</strong> · ${propios.length} países · mediana de cobertura ${U.n0(med)}</figcaption>${s}</figure>`;
    }).join('')}</div>`;
  };

  // ---------- Flujo: aspecto priorizado a práctica (Sankey simplificado) ----------
  V.flujo = function (cont, izquierda, derecha, enlaces, op) {
    const W = ancho(cont), angosto = W < 620;
    const colW = 12, etq = angosto ? 112 : 230;
    const totalI = izquierda.reduce((a, b) => a + b.n, 0) || 1, totalD = derecha.reduce((a, b) => a + b.n, 0) || 1;
    const H = Math.max(260, 26 * Math.max(izquierda.length, derecha.length) + 40);
    const hueco = 8, alto = H - 20;
    const escI = (alto - hueco * (izquierda.length - 1)) / totalI, escD = (alto - hueco * (derecha.length - 1)) / totalD;
    const xI = etq, xD = W - etq - colW;
    let y = 10; izquierda.forEach((n) => { n.y = y; n.h = Math.max(2, n.n * escI); n.off = 0; y += n.h + hueco; });
    y = 10; derecha.forEach((n) => { n.y = y; n.h = Math.max(2, n.n * escD); n.off = 0; y += n.h + hueco; });
    let s = `<svg xmlns="${NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${cont.id}-t"><title id="${cont.id}-t">${U.esc(op.titulo)}</title>`;
    enlaces.forEach((e) => {
      const a = izquierda.find((n) => n.id === e.de), b = derecha.find((n) => n.id === e.a);
      const ha = e.n * escI, hb = e.n * escD;
      const ya = a.y + a.off + ha / 2, yb = b.y + b.off + hb / 2; a.off += ha; b.off += hb;
      const cx = (xI + colW + xD) / 2, sel = e.de === op.seleccion;
      s += `<path d="M${xI + colW} ${ya} C${cx} ${ya} ${cx} ${yb} ${xD} ${yb}" fill="none" stroke="${sel ? 'var(--debajo)' : 'var(--neutro)'}" stroke-opacity="${sel ? .75 : .32}" stroke-width="${Math.max(1.5, (ha + hb) / 2)}"><title>${U.esc(`${a.etiqueta} → ${b.etiqueta}: ${e.n} ${e.n === 1 ? 'estado' : 'estados'}`)}</title></path>`;
    });
    izquierda.forEach((n) => {
      const sel = n.id === op.seleccion;
      s += `<rect x="${xI}" y="${n.y}" width="${colW}" height="${n.h}" fill="${sel ? 'var(--debajo)' : 'var(--tinta-2)'}"/>`;
      s += `<text class="etq" x="${xI - 6}" y="${n.y + n.h / 2 + 4}" text-anchor="end" font-weight="${sel ? 700 : 500}" fill="var(--tinta)">${U.esc(recortar(n.etiqueta, angosto ? 15 : 30))} (${n.n})</text>`;
    });
    derecha.forEach((n) => {
      s += `<rect x="${xD}" y="${n.y}" width="${colW}" height="${n.h}" fill="var(--acento)"/>`;
      s += `<text class="etq" x="${xD + colW + 6}" y="${n.y + n.h / 2 + 4}" font-weight="500" fill="var(--tinta)">${U.esc(recortar(n.etiqueta, angosto ? 15 : 30))} (${n.n})</text>`;
    });
    s += '</svg>';
    cont.innerHTML = s;
  };

  window.V = V;
})();
