// Fondo de la portada: grafo de pulsos (técnica del tema elixir de iroFactory,
// https://github.com/RemiH06/iroFactory, MIT). Cinco capas de nodos; los pulsos
// viajan de izquierda a derecha y cada nodo se queda con el color del último
// pulso que lo alcanzó, como respuestas que llegan de los estados al cálculo.
// Se detiene fuera de pantalla, con la pestaña oculta y con prefers-reduced-motion
// (entonces dibuja un solo cuadro fijo). Es decorativo: aria-hidden en el HTML.
(function () {
  'use strict';
  const lienzo = document.getElementById('portada-red');
  if (!lienzo || !lienzo.getContext) return;
  const ctx = lienzo.getContext('2d');
  const anfitrion = lienzo.parentElement;
  const reducir = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
  const CAPAS = [4, 6, 7, 6, 4];
  const COLORES = ['--acento', '--c-1', '--favorable', '--s-3', '--luz-1'];
  let W = 1, H = 1, dpr = 1, nodos = [], porCapa = [], pulsos = [], pal = {}, siguiente = 0.3, ultimo = 0, raf = 0, visible = false;

  const leerPaleta = () => {
    const cs = getComputedStyle(document.documentElement);
    pal = {};
    for (const c of COLORES.concat(['--eje', '--tinta-3'])) pal[c] = cs.getPropertyValue(c).trim() || '#888';
  };
  const acomodar = () => {
    const r = anfitrion.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    lienzo.width = Math.round(W * dpr); lienzo.height = Math.round(H * dpr);
    const x0 = W * 0.42, x1 = W - Math.max(24, W * 0.04), arriba = H * 0.12, abajo = H * 0.12;
    const previos = nodos; nodos = []; porCapa = [];
    CAPAS.forEach((n, li) => {
      porCapa[li] = [];
      const x = x0 + (x1 - x0) * (li / (CAPAS.length - 1));
      for (let k = 0; k < n; k++) {
        const y = arriba + (H - arriba - abajo) * ((k + 0.5) / n) + ((li % 2) ? 10 : -6);
        const viejo = previos[nodos.length];
        porCapa[li].push(nodos.length);
        nodos.push({ x, y, capa: li, color: viejo ? viejo.color : COLORES[(nodos.length * 7 + li * 3) % COLORES.length], pColor: null, pT: 0, pDur: 0 });
      }
    });
    pulsos = [];
  };
  const tocar = (i, color) => { const n = nodos[i]; n.pColor = color; n.pT = 0; n.pDur = 500 + Math.random() * 500; };
  const lanzar = () => {
    const camino = porCapa.map((l) => l[Math.floor(Math.random() * l.length)]);
    const color = COLORES[Math.floor(Math.random() * COLORES.length)];
    tocar(camino[0], color);
    pulsos.push({ camino, tramo: 0, t: 0, color, vel: 1 / (0.5 + Math.random() * 0.35) });
  };
  const dibujar = (t) => {
    const dt = ultimo ? Math.min(0.05, (t - ultimo) / 1000) : 0; ultimo = t;
    const mueve = !reducir.matches;
    if (mueve) {
      siguiente -= dt;
      if (siguiente <= 0) { lanzar(); siguiente = 0.4 + Math.random() * 0.6; }
      for (const p of pulsos) {
        p.t += dt * p.vel;
        if (p.t >= 1) { p.tramo++; p.t = 0; tocar(p.camino[Math.min(p.tramo, p.camino.length - 1)], p.color); if (p.tramo >= p.camino.length - 1) p.fin = true; }
      }
      pulsos = pulsos.filter((p) => !p.fin);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = pal['--eje']; ctx.globalAlpha = 0.55; ctx.beginPath();
    for (let li = 0; li < porCapa.length - 1; li++) for (const a of porCapa[li]) for (const b of porCapa[li + 1]) { ctx.moveTo(nodos[a].x, nodos[a].y); ctx.lineTo(nodos[b].x, nodos[b].y); }
    ctx.stroke();
    for (const p of pulsos) {
      const a = nodos[p.camino[p.tramo]], b = nodos[p.camino[p.tramo + 1]];
      if (!a || !b) continue;
      const col = pal[p.color];
      ctx.strokeStyle = col; ctx.globalAlpha = 0.5; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      for (let k = 0; k < 4; k++) {
        const tt = Math.max(0, p.t - k * 0.05);
        ctx.globalAlpha = [1, 0.5, 0.28, 0.14][k]; ctx.fillStyle = col; ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * tt, a.y + (b.y - a.y) * tt, k ? 2.2 : 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    const r0 = Math.max(4, Math.min(7, W / 120));
    for (const n of nodos) {
      let color = pal[n.color], r = r0, alfa = 0.85;
      if (n.pColor && n.pDur > 0) {
        n.pT += dt * 1000;
        const tt = Math.min(n.pT / n.pDur, 1), e = tt < 0.5 ? 2 * tt * tt : -1 + (4 - 2 * tt) * tt;
        r = r0 + e * 4; color = pal[n.pColor]; alfa = 0.5 + e * 0.45;
        ctx.globalAlpha = 0.35 * (1 - tt); ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(n.x, n.y, r0 + 4 + tt * 10, 0, Math.PI * 2); ctx.stroke();
        if (n.pT >= n.pDur) { n.color = n.pColor; n.pColor = null; n.pDur = 0; }
      }
      ctx.globalAlpha = alfa; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  // Bucle a 30 cuadros por segundo, solo con el lienzo a la vista
  const cuadro = (t) => {
    raf = 0;
    if (t - (cuadro.u || 0) >= 31) { cuadro.u = t; dibujar(t); }
    if (visible && !reducir.matches && !document.hidden) raf = requestAnimationFrame(cuadro);
  };
  const arrancar = () => { if (!raf && visible && !reducir.matches && !document.hidden) { ultimo = 0; raf = requestAnimationFrame(cuadro); } };
  const parar = () => { if (raf) cancelAnimationFrame(raf); raf = 0; };
  const fijo = () => { ultimo = 0; dibujar(performance.now()); };

  leerPaleta(); acomodar(); fijo();
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting && lienzo.offsetParent !== null; if (visible) arrancar(); else parar(); }).observe(anfitrion);
  if ('ResizeObserver' in window) new ResizeObserver(() => { acomodar(); fijo(); }).observe(anfitrion);
  document.addEventListener('visibilitychange', () => { if (document.hidden) parar(); else arrancar(); });
  if (reducir.addEventListener) reducir.addEventListener('change', () => { if (reducir.matches) { parar(); fijo(); } else arrancar(); });
  // Cambio de tema (selector o sistema): volver a leer las tintas
  new MutationObserver(() => { leerPaleta(); fijo(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (window.matchMedia) { const m = matchMedia('(prefers-color-scheme: dark)'); if (m.addEventListener) m.addEventListener('change', () => { leerPaleta(); fijo(); }); }
}());
