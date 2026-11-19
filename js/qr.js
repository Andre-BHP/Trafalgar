// QR «Comparte Trafalgar» en el pie (carta dis-081 de la baraja): el tronco crece,
// las ramas se abren por profundidad, las hojas brotan sueltas en la copa y se
// pliegan a su lugar hasta quedar como el QR escaneable (mismo dibujo que
// qr/trafalgar-qr-ilustrado.svg, carta dis-094). Datos: js/qr-datos.js, generado
// por scripts/qr.py. Animación con GSAP local; dura menos de 2 s y se ve una vez
// al entrar en pantalla. Con prefers-reduced-motion queda fijo en el estado final.
(function () {
  'use strict';
  const D = window.QR_TRAFALGAR;
  const cont = document.getElementById('qr-arbol');
  if (!D || !cont) return;
  const C = D.colores, W = D.ancho, H = D.alto, Q = D.silencio;
  const r2 = (v) => Math.round(v * 100) / 100;

  const hojaD = (x, y, o, h = 0.6) => {
    const [a, b, c1, c2] = o === 0
      ? [[x - h, y + h], [x + h, y - h], [x - h, y - h], [x + h, y + h]]
      : [[x - h, y - h], [x + h, y + h], [x + h, y - h], [x - h, y + h]];
    const f = (p) => `${r2(p[0])} ${r2(p[1])}`;
    return `M${f(a)}Q${f(c1)} ${f(b)}Q${f(c2)} ${f(a)}Z`;
  };
  const flor = (x, y) => {
    let p = '';
    for (let k = 0; k < 5; k++) { const a = k * 2 * Math.PI / 5 - Math.PI / 2; p += `<circle cx="${r2(x + 0.25 * Math.cos(a))}" cy="${r2(y + 0.25 * Math.sin(a))}" r=".28"/>`; }
    return `<g class="qr-hoja" fill="${C.carmin}">${p}<circle cx="${x}" cy="${y}" r=".2" fill="${C.carmin2}"/></g>`;
  };
  const caja = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  // Centro cuadrado bajo la flor: los lectores miden los ojos también en diagonal
  const ojo = ([x, y]) => {
    const cx = x + 3.5, cy = y + 3.5;
    let pet = '';
    for (let k = 0; k < 8; k++) { const px = r2(cx + 0.75 * Math.cos(k * Math.PI / 4)), py = r2(cy + 0.75 * Math.sin(k * Math.PI / 4)); pet += `<ellipse cx="${px}" cy="${py}" rx=".72" ry=".4" transform="rotate(${k * 45} ${px} ${py})"/>`; }
    return `<g class="qr-ojo"><path d="${caja(x, y, 7, 7, 1.6)}${caja(x + 1, y + 1, 5, 5, 0.9)}" fill="${C.verdes[0]}" fill-rule="evenodd"/><path d="${caja(x + 2, y + 2, 3, 3, 0.6)}" fill="${C.carmin2}"/><g fill="${C.carmin}">${pet}</g><circle cx="${cx}" cy="${cy}" r=".5" fill="${C.carmin2}"/></g>`;
  };
  const alin = ([c, f]) => `<g class="qr-ojo"><path d="${caja(c - 2, f - 2, 5, 5, 1)}${caja(c - 1, f - 1, 3, 3, 0.5)}" fill="${C.verdes[0]}" fill-rule="evenodd"/><circle cx="${c + 0.5}" cy="${f + 0.5}" r=".55" fill="${C.carmin}"/></g>`;

  // Ramas agrupadas por profundidad para abrirlas por orden
  const porProf = {};
  for (const r of D.ramas) (porProf[r[7]] = porProf[r[7]] || []).push(r);
  const ramasSvg = Object.keys(porProf).map(Number).sort((a, b) => a - b).map((p) =>
    `<g class="qr-prof" data-prof="${p}">${porProf[p].map(([a, b, c, d, e, f, g]) => `<path d="M${a} ${b}Q${c} ${d} ${e} ${f}" stroke-width="${g}" pathLength="1"/>`).join('')}</g>`).join('');

  cont.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="qr-titulo-sitio" focusable="false">
    <title id="qr-titulo-sitio">Código QR que abre ${D.url}</title>
    <defs><linearGradient id="qr-g-tronco" gradientUnits="userSpaceOnUse" x1="0" y1="${H - 4}" x2="0" y2="${D.baseCodigo + 3.2}"><stop offset="0" stop-color="${C.tronco}"/><stop offset=".55" stop-color="${C.tronco}"/><stop offset="1" stop-color="${C.rama}"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="${C.papel}"/>
    <path class="qr-suelo" d="${D.suelo}" fill="none" stroke="${C.tronco}" stroke-width=".22" stroke-linecap="round" pathLength="1"/>
    <path class="qr-tronco" d="${D.tronco}" fill="url(#qr-g-tronco)"/>
    <g class="qr-ramas" fill="none" stroke="${C.rama}" stroke-linecap="round">${ramasSvg}</g>
    <g class="qr-hojas">${D.hojas.map(([x, y, o, t, col]) => (t ? flor(x, y) : `<path class="qr-hoja" d="${hojaD(x, y, o)}" fill="${C.verdes[col]}"/>`)).join('')}</g>
    ${D.ojos.map(ojo).join('')}${D.alineaciones.map(alin).join('')}
    <text x="${W / 2}" y="${H - 1.1}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="1.45" font-weight="700" fill="${C.verdes[1]}">andre-bhp.github.io/Trafalgar</text>
  </svg>`;

  const reducir = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gsap = window.gsap;
  window.QR_ANIM = { estado: 'fijo', duracion: 0 };
  if (reducir || !gsap) return;

  const svg = cont.querySelector('svg');
  const hojas = [...svg.querySelectorAll('.qr-hoja')];
  const ojos = [...svg.querySelectorAll('.qr-ojo')];
  const grupos = [...svg.querySelectorAll('.qr-prof')];
  const cx = W / 2, cy = Q + D.n * 0.45;
  // Número pseudoaleatorio fijo por hoja: el árbol brota igual en cada visita
  const azar = (i, k) => { const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' }, onStart: () => { window.QR_ANIM.inicio = performance.now(); }, onComplete: () => { window.QR_ANIM.estado = 'terminado'; window.QR_ANIM.real = Math.round(performance.now() - window.QR_ANIM.inicio); } });
  tl.fromTo(svg.querySelector('.qr-suelo'), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.3 }, 0)
    .from(svg.querySelector('.qr-tronco'), { scaleY: 0, svgOrigin: `${cx} ${H - 3.2}`, duration: 0.36 }, 0.02)
    .fromTo(svg.querySelector('.qr-ramas'), { attr: { stroke: '#6f6046' } }, { attr: { stroke: C.rama }, duration: 0.45, ease: 'power1.inOut' }, 1.2);
  grupos.forEach((g) => {
    const p = Number(g.dataset.prof);
    tl.fromTo(g.children, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.26, ease: 'power1.out' }, 0.22 + p * 0.055);
  });
  hojas.forEach((h, i) => {
    const [x, y, , , , prof] = D.hojas[i];
    const dx = (x - cx) * 0.14 + (azar(i, 1) - 0.5) * 1.6, dy = (y - cy) * 0.14 + (azar(i, 2) - 0.5) * 1.6;
    gsap.set(h, { svgOrigin: `${x} ${y}` });
    tl.fromTo(h, { x: dx, y: dy, rotation: (azar(i, 3) - 0.5) * 100, scale: 0 }, { scale: 0.8, duration: 0.22, immediateRender: true }, 0.42 + prof * 0.05 + azar(i, 4) * 0.08);
  });
  const orden = hojas.map((h, i) => [h, Math.hypot(D.hojas[i][0] - cx, D.hojas[i][1] - cy)]).sort((a, b) => a[1] - b[1]).map((a) => a[0]);
  tl.to(orden, { x: 0, y: 0, rotation: 0, scale: 1, duration: 0.42, ease: 'power3.inOut', stagger: { amount: 0.14 } }, 1.22);
  ojos.forEach((o) => tl.from(o, { scale: 0, transformOrigin: '50% 50%', duration: 0.45, ease: 'back.out(1.7)' }, 1.28));
  window.QR_ANIM.duracion = tl.duration();
  window.QR_ANIM.estado = 'espera';
  tl.progress(0);

  const tocar = () => { window.QR_ANIM.estado = 'creciendo'; tl.restart(); };
  const boton = document.getElementById('qr-repetir');
  if (boton) { boton.hidden = false; boton.addEventListener('click', tocar); }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); tocar(); } }, { threshold: 0.35 });
    io.observe(cont);
  } else tl.progress(1);
  window.addEventListener('beforeprint', () => tl.progress(1));
}());
