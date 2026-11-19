// Pruebas de funcionamiento, diseño adaptable y accesibilidad (axe) en Microsoft Edge.
// Uso: npm run probar     Resultados: pruebas/resultados.md y pruebas/capturas/*.png
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { probarQR } from './qr-escaneo.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CAPT = path.join(RAIZ, 'pruebas', 'capturas');
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
fs.mkdirSync(CAPT, { recursive: true });

// Servidor estático mínimo
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const servidor = http.createServer((req, res) => {
  const ruta = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!ruta.startsWith(RAIZ) || !fs.existsSync(ruta)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(ruta)] || 'application/octet-stream' });
  fs.createReadStream(ruta).pipe(res);
});
await new Promise((r) => servidor.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${servidor.address().port}/`;

const resultados = [];
const ok = (nombre, cond, detalle = '') => { resultados.push({ nombre, ok: !!cond, detalle }); console.log(`${cond ? 'OK  ' : 'FALLA'} ${nombre}${detalle ? ' - ' + detalle : ''}`); };

const navegador = await chromium.launch({ executablePath: EDGE, headless: true });

async function abrir(ancho, alto, url = BASE) {
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1, locale: 'es-MX' });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  await page.goto(url);
  await page.waitForSelector('#g1 svg', { state: 'attached' });
  return { ctx, page, errores };
}

async function axe(page, etiqueta) {
  await page.waitForTimeout(600); // deja terminar transiciones de color antes de medir contraste
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => {
    const res = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } });
    return res.violations.map((v) => ({ id: v.id, impacto: v.impact, n: v.nodes.length, ejemplo: v.nodes[0] && v.nodes[0].target.join(' ') }));
  });
  ok(`axe sin violaciones: ${etiqueta}`, r.length === 0, r.map((v) => `${v.id} (${v.impacto}, ${v.n}) ${v.ejemplo}`).join(' | '));
}

async function texto(page, sel) { return (await page.textContent(sel)) || ''; }

// Cuenta países del mapa mundial con relleno visible: ni transparente, ni negro por omisión, ni igual al fondo,
// y que ninguno tape el mapa (polígono invertido).
async function paisesVisibles(page, sel) {
  return page.$eval(sel, (cont) => {
    const svg = cont.querySelector('svg'); if (!svg) return { n: 0, gigantes: 0, motivo: 'sin svg' };
    const fondo = getComputedStyle(cont.closest('.tarjeta')).backgroundColor;
    const caja = svg.getBoundingClientRect();
    const ps = [...svg.querySelectorAll('.pais-mapa')];
    const n = ps.filter((p) => { const f = getComputedStyle(p).fill; const r = p.getBoundingClientRect(); return f && f !== 'none' && f !== 'rgb(0, 0, 0)' && f !== fondo && !/rgba\(0, 0, 0, 0\)/.test(f) && r.width > 0; }).length;
    const gigantes = ps.filter((p) => { const r = p.getBoundingClientRect(); return r.width * r.height > 0.6 * caja.width * caja.height; }).length;
    return { n, gigantes, ancho: Math.round(caja.width) };
  });
}

// Visualizaciones adicionales: cada una con dibujo, hallazgo y tabla equivalente, en claro y oscuro
const VISTAS_PRUEBA = { mexico: ['calor', 'intervalos', 'mancuernas', 'instituciones', 'privado', 'mapapriv'], mundial: ['waffle', 'paletas', 'multiples'], estrategia: ['flujo'] };
async function revisarVistas(page, etiqueta) {
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    for (const [sec, ids] of Object.entries(VISTAS_PRUEBA)) {
      await page.click(`a[data-seccion="${sec}"]`);
      await page.waitForTimeout(500);
      for (const id of ids) {
        const r = await page.evaluate((id) => {
          const c = document.getElementById('v-' + id);
          const marcas = c ? c.querySelectorAll('rect, circle, path, line').length : 0;
          const ancho = c ? Math.round(c.getBoundingClientRect().width) : 0;
          return { marcas, ancho, hallazgo: (document.getElementById(`v-${id}-hallazgo`) || {}).textContent || '', tabla: !!document.querySelector(`#v-${id}-tabla details table tbody tr`), sinDatos: !!(c && c.querySelector('.sin-datos')) };
        }, id);
        ok(`[${etiqueta}] Visualización «${id}» con datos, hallazgo y tabla (${sec}, ${tema === 'dark' ? 'oscuro' : 'claro'})`, r.marcas > 20 && r.ancho > 200 && r.hallazgo.length > 30 && r.tabla && !r.sinDatos, `${r.marcas} marcas, ${r.ancho}px`);
      }
    }
    await page.click('a[data-seccion="mexico"]');
    await page.waitForTimeout(300);
    const t = await page.$$eval('#caso-imss .tiempo li', (l) => l.length);
    ok(`[${etiqueta}] Línea de tiempo del caso IMSS (${tema === 'dark' ? 'oscuro' : 'claro'})`, t >= 8, `${t} eventos`);
    await page.click('a[data-seccion="estrategia"]');
    await page.waitForTimeout(300);
    const c = await page.$$eval('#estrategia-cuerpo .camino li', (l) => l.length);
    ok(`[${etiqueta}] Camino de la estrategia en 5 pasos (${tema === 'dark' ? 'oscuro' : 'claro'})`, c === 5, `${c} pasos`);
  }
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await page.click('a[data-seccion="resumen"]');
}
async function revisarMundo(page, etiqueta) {
  for (const tema of ['light', 'dark']) {
    await page.evaluate((t) => { document.documentElement.dataset.theme = t; }, tema);
    for (const [sec, sel] of [['resumen', '#m2'], ['mundial', '#m3']]) {
      await page.click(`a[data-seccion="${sec}"]`);
      await page.waitForTimeout(700);
      const r = await paisesVisibles(page, sel);
      ok(`[${etiqueta}] Mapa mundial con 150 países o más con relleno: pestaña ${sec}, modo ${tema === 'dark' ? 'oscuro' : 'claro'}`, r.n >= 150 && r.gigantes === 0 && r.ancho > 200, `${r.n} con relleno, ${r.gigantes} que tapan el mapa, ancho ${r.ancho}px`);
    }
  }
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  await page.click('a[data-seccion="resumen"]');
}

// «La solución»: cada solución sale de una regla, numeración consistente y con fuente
async function revisarSoluciones(page, etiqueta) {
  for (const [inst, anio] of [['imss', '2025'], ['imss', '2023'], ['issste', '2025'], ['estatal', '2025'], ['imssb', '2025']]) {
    await page.selectOption('#sel-inst', inst);
    if (inst !== 'imssb') await page.selectOption('#sel-anio', anio);
    await page.selectOption('#sel-ent', '28');
    const r = await page.evaluate(() => {
      const D = window.DATOS, A = window.A, E = D.encig;
      const inst = document.getElementById('sel-inst').value, anio = +document.getElementById('sel-anio').value;
      const problemas = [];
      const porEstado = E.entidades.map((e) => A.estrategia(inst, anio, e.clave));
      const reglaPorId = Object.fromEntries(Object.values(D.reglas.reglas).map((x) => [x.id, x]));
      // Conteo independiente por regla para comprobar la prioridad (R-12)
      const cuenta = {};
      porEstado.filter((x) => x.tipo === 'brecha').forEach((x) => { (cuenta[x.regla.id] = cuenta[x.regla.id] || []).push(x.aspecto.dif); });
      const orden = Object.entries(cuenta).sort((a, b) => b[1].length - a[1].length || (a[1].reduce((s, v) => s + v, 0) / a[1].length) - (b[1].reduce((s, v) => s + v, 0) / b[1].length) || reglaPorId[a[0]].solucion.n - reglaPorId[b[0]].solucion.n);
      const esperada = orden.length ? reglaPorId[orden[0][0]].solucion.n : null;
      const bloques = {};
      for (const modo of ['resumen', 'estrategia']) {
        const cont = document.getElementById('solucion-' + modo);
        const cards = [...cont.querySelectorAll('.sol')];
        bloques[modo] = cards.map((c) => c.dataset.solucion + ':' + c.querySelector('h3').textContent.trim()).join('|');
        let suma = 0;
        cards.forEach((c) => {
          const regla = reglaPorId[c.dataset.regla];
          if (!regla) { problemas.push(`${modo}: tarjeta sin regla (${c.dataset.regla})`); return; }
          if (+c.dataset.solucion !== regla.solucion.n) problemas.push(`${modo}: número ${c.dataset.solucion} distinto de la regla ${regla.id}`);
          if (c.querySelector('h3').textContent.trim() !== `Solución ${regla.solucion.n}: ${regla.solucion.nombre}`) problemas.push(`${modo}: nombre distinto en la Solución ${c.dataset.solucion}`);
          const practica = [...c.querySelectorAll('dt')].find((d) => d.textContent === 'Práctica de referencia');
          if (!practica || !practica.nextElementSibling.querySelector('a[href^="http"]')) problemas.push(`${modo}: Solución ${c.dataset.solucion} sin fuente enlazada`);
          const estados = [...c.querySelectorAll('.sol__estados [data-clave]')].map((x) => x.textContent.replace(/ \(.*$/, ''));
          suma += estados.length;
          estados.forEach((nom) => { const x = porEstado.find((y) => y.ent.nombre === nom); if (!x || x.tipo !== 'brecha' || x.regla.id !== regla.id) problemas.push(`${modo}: ${nom} no corresponde a ${regla.id}`); });
          if (estados.length !== (cuenta[regla.id] || []).length) problemas.push(`${modo}: conteo distinto en ${regla.id}`);
          const fila = [...cont.querySelectorAll('.matriz__fila')].find((g) => g.dataset.fila === `Solución ${regla.solucion.n}`);
          if (!fila || fila.querySelectorAll('.matriz__c--sol').length !== estados.length + 1) problemas.push(`${modo}: la matriz no cuenta igual la Solución ${regla.solucion.n}`);
        });
        const sinAsignar = porEstado.filter((x) => x.tipo !== 'brecha').length;
        if (suma + sinAsignar !== 32) problemas.push(`${modo}: ${suma} estados en tarjetas + ${sinAsignar} sin solución no suman 32`);
        const pr = cont.querySelector('.solucion__prioritaria');
        if (esperada !== null && (!pr || +pr.dataset.prioritaria !== esperada || !pr.textContent.includes(D.reglas.prioridad_solucion.id))) problemas.push(`${modo}: prioritaria distinta de la esperada (${esperada}) o sin regla`);
        if (esperada === null && (cards.length || !cont.textContent.includes('R-99'))) problemas.push(`${modo}: sin datos estatales debería decir R-99 y no mostrar tarjetas`);
      }
      if (bloques.resumen !== bloques.estrategia) problemas.push('Resumen y Estrategia muestran soluciones distintas');
      // Estrategia del estado elegido y tabla del flujo con la misma numeración
      const es = A.estrategia(inst, anio, document.getElementById('sel-ent').value);
      const etq = document.querySelector('#estrategia-cuerpo .sol-etq').textContent.trim();
      if (es.tipo === 'brecha' && etq !== `Solución ${es.regla.solucion.n}: ${es.regla.solucion.nombre}`) problemas.push(`Estrategia por estado dice «${etq}»`);
      if (es.tipo !== 'brecha' && !etq.includes(es.regla.id)) problemas.push('Estrategia por estado sin regla de «sin solución»');
      // Ruta de despliegue (R-13): orden reproducido de forma independiente, solo estados con brecha
      const tam = D.reglas.despliegue.tam_etapa, esperadaEtapa = {};
      Object.values(D.reglas.reglas).forEach((regla) => {
        porEstado.filter((x) => x.tipo === 'brecha' && x.regla.id === regla.id)
          .map((x) => ({ clave: x.ent.clave, dif: x.aspecto.dif, pob: (A.registro(inst, anio, x.ent.clave) || {}).poblacion || 0 }))
          .sort((a, b) => a.dif - b.dif || b.pob - a.pob || a.clave.localeCompare(b.clave))
          .forEach((x, k) => { esperadaEtapa[x.clave] = { n: regla.solucion.n, etapa: Math.floor(k / tam) + 1 }; });
      });
      const ruta = { mapa: 0, tabla: 0, tarjetas: 0 };
      document.querySelectorAll('#ruta-mapa .ruta__estado').forEach((p) => {
        const x = porEstado.find((y) => y.ent.clave === p.dataset.clave), e2 = esperadaEtapa[p.dataset.clave];
        if (x.tipo !== 'brecha') { if (p.dataset.etapa) problemas.push(`mapa: ${x.ent.nombre} sin brecha tiene etapa`); if (p.dataset.tipo !== (x.tipo === 'sin_brecha' ? 'no' : 'sin')) problemas.push(`mapa: ${x.ent.nombre} mal rotulado`); return; }
        ruta.mapa++;
        if (+p.dataset.etapa !== e2.etapa || +p.dataset.solucion !== e2.n) problemas.push(`mapa: ${x.ent.nombre} en etapa ${p.dataset.etapa}, se esperaba ${e2.etapa}`);
      });
      for (const [sel, k] of [['#ruta .olas [data-clave]', 'tabla'], ['#solucion-estrategia .sol__estados [data-clave]', 'tarjetas']]) {
        document.querySelectorAll(sel).forEach((el) => { ruta[k]++; const e2 = esperadaEtapa[el.dataset.clave]; if (!e2) problemas.push(`${k}: estado sin brecha incluido (${el.dataset.clave})`); else if (+el.dataset.etapa !== e2.etapa) problemas.push(`${k}: ${el.dataset.clave} en etapa ${el.dataset.etapa}, se esperaba ${e2.etapa}`); });
      }
      const nBrecha = Object.keys(esperadaEtapa).length;
      if (ruta.mapa !== nBrecha || ruta.tabla !== nBrecha || ruta.tarjetas !== nBrecha) problemas.push(`ruta: ${JSON.stringify(ruta)} contra ${nBrecha} estados con brecha`);
      const etapaTxt = document.querySelector('#estrategia-cuerpo .sol-etapa');
      const e3 = esperadaEtapa[document.getElementById('sel-ent').value];
      if (e3 ? !etapaTxt.textContent.includes(`etapa ${e3.etapa} de la Solución ${e3.n}`) : !/No requiere|Sin datos comparables/.test(etapaTxt.textContent)) problemas.push('estrategia por estado sin su etapa');
      // Toda cifra en pesos lleva fuente enlazada o la etiqueta de supuesto
      const F = D.fuentes.fuentes;
      const zonas = [...document.querySelectorAll('#financia, #ruta, .solucion__financia, .sol dd[data-fuente-bloque]')];
      let cifras = 0;
      zonas.forEach((z) => {
        const w = document.createTreeWalker(z, NodeFilter.SHOW_TEXT);
        for (let t = w.nextNode(); t; t = w.nextNode()) {
          if (!/\$\s?\d/.test(t.textContent)) continue;
          cifras++;
          const c = t.parentElement.closest('[data-cifra]');
          const supuesto = t.parentElement.closest('[data-supuesto]');
          if (supuesto) continue;
          if (!c || !F[c.dataset.fuente]) { problemas.push(`cifra sin fuente: «${t.textContent.trim().slice(0, 40)}»`); continue; }
          const bloque = c.closest('[data-fuente-bloque]');
          if (!bloque || ![...bloque.querySelectorAll('a[href]')].some((a) => a.href.startsWith(F[c.dataset.fuente].url))) problemas.push(`cifra sin enlace a su fuente: «${t.textContent.trim().slice(0, 40)}»`);
        }
      });
      const fin = document.querySelector('#financia');
      if (!fin.textContent.includes('Por estimar')) problemas.push('financiamiento sin «Por estimar» para el costo');
      if ([...fin.querySelectorAll('[data-supuesto]')].some((li) => !li.textContent.includes('Supuesto del equipo'))) problemas.push('supuesto sin etiqueta');
      return { problemas, soluciones: document.querySelectorAll('#solucion-resumen .sol').length, prioritaria: esperada, cifras, conBrecha: nBrecha };
    });
    ok(`[${etiqueta}] «La solución» con ${inst.toUpperCase()}${inst === 'imssb' ? '' : ' ' + anio}: soluciones de las reglas, numeración, prioridad R-12, etapas R-13 solo con brecha y cifras con fuente`, r.problemas.length === 0, `${r.soluciones} soluciones; prioritaria: ${r.prioritaria ?? 'ninguna'}; ${r.conBrecha} estados en la ruta; ${r.cifras} cifras en pesos${r.problemas.length ? '; ' + r.problemas.slice(0, 4).join(' / ') : ''}`);
  }
  for (const inst of ['imss', 'issste', 'estatal', 'imssb']) {
    await page.selectOption('#sel-inst', inst);
    const sb = await page.evaluate((inst) => {
      const D = window.DATOS, SB = D.financiamiento.subrogacion, mk = SB.marco[inst], cont = document.getElementById('subrogacion'), problemas = [];
      const chip = cont.querySelector('[data-estado-opcion]').textContent;
      if (!chip.startsWith('Opción a evaluar')) problemas.push('no se rotula como opción a evaluar');
      if (mk.fuente) { if (!chip.includes('marco legal') || ![...cont.querySelectorAll('dd[data-marco] a')].some((a) => a.href === D.fuentes.fuentes[mk.fuente].url)) problemas.push('marco sin enlace a la ley'); }
      else if (chip.includes('marco legal')) problemas.push('dice «con marco legal» sin fuente');
      for (const t of ['Costo por procedimiento', 'Supervisión de calidad', 'Financiamiento nacional']) if (!cont.textContent.includes(t)) problemas.push('falta la condición ' + t);
      if (!cont.textContent.includes('Lo que faltaría saber')) problemas.push('falta lo que faltaría saber');
      const S = window.A.soluciones(inst, +document.getElementById('sel-anio').value);
      const validos = new Set(S.activas.filter((s) => SB.aplica_soluciones.includes(s.n)).flatMap((s) => s.ruta.map((x) => x.nombre)));
      const filas = [...cont.querySelectorAll('tbody th[scope="row"]')].map((t) => t.textContent);
      if (filas.some((n) => !validos.has(n)) || filas.length !== validos.size) problemas.push('la tabla incluye estados fuera de las soluciones 1, 8 o 10');
      return { problemas, chip, filas: filas.length };
    }, inst);
    ok(`[${etiqueta}] Subrogación con privados (${inst.toUpperCase()}): «${sb.chip}», con condiciones y solo en estados de las Soluciones 1, 8 y 10`, sb.problemas.length === 0, `${sb.filas} estados; ${sb.problemas.join(' / ')}`);
  }
  await page.selectOption('#sel-inst', 'imss');
  await page.selectOption('#sel-anio', '2025');
  await page.selectOption('#sel-ent', '28');
  const metodo = await page.evaluate(() => [...document.querySelectorAll('#metodo-cuerpo table tbody tr')].filter((tr) => /^R-(0[1-9]|1[01])$/.test(tr.querySelector('th').textContent)).every((tr) => tr.children[1].textContent.startsWith('Solución ' + (+tr.querySelector('th').textContent.slice(2)) + ':')));
  ok(`[${etiqueta}] «Cómo se calculó» numera las soluciones igual que las reglas`, metodo);
}

for (const [ancho, alto, nombre] of [[1440, 900, 'escritorio-1440'], [390, 844, 'celular-390']]) {
  const { ctx, page, errores } = await abrir(ancho, alto);
  // 1. Carga inicial con datos
  const svgs = await page.$$eval('#g1 svg, #g2 svg, #g3 svg, #g4 svg', (l) => l.length);
  ok(`[${nombre}] Cuatro gráficas dibujadas al abrir`, svgs === 4, `${svgs} gráficas`);
  const filasEst = await page.$$eval('#tabla-est tbody tr', (l) => l.length);
  const filasInt = await page.$$eval('#tabla-int tbody tr', (l) => l.length);
  ok(`[${nombre}] Tabla estatal con 32 filas`, filasEst === 32, `${filasEst}`);
  ok(`[${nombre}] Tabla internacional con 22 países de clase`, filasInt === 22, `${filasInt}`);
  const desborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok(`[${nombre}] Sin desplazamiento horizontal de la página`, desborde <= 0, `${desborde}px`);
  await page.screenshot({ path: path.join(CAPT, `${nombre}-resumen.png`), fullPage: true });
  await axe(page, `${nombre} Resumen`);
  await revisarSoluciones(page, nombre);

  // 1a. Mapa mundial visible en cada pestaña, modo e indicador (servidor local)
  for (const ind of ['uhc', 'gasto', 'bolsillo']) { await page.selectOption('#m2-ind', ind); await revisarMundo(page, `${nombre} servidor, ${ind}`); }
  await page.selectOption('#m2-ind', 'uhc');

  // 1c. Visualizaciones adicionales
  await revisarVistas(page, nombre);

  // 1b. Mapas
  ok(`[${nombre}] Mapa de México con 32 estados e ícono por estado`, (await page.$$eval('#m1 .estado-mapa', (l) => l.length)) === 32 && (await page.$$eval('#m1 .capa-iconos > *', (l) => l.length)) === 32);
  ok(`[${nombre}] Mapa del mundo dibujado con México resaltado`, (await page.$$eval('#m2 .pais-mapa', (l) => l.length)) > 180 && (await page.$$eval('#m2 .pais-mapa--mex', (l) => l.length)) === 1);
  await page.$eval('#m1 .estado-mapa[data-clave="31"]', (el) => { el.scrollIntoView({ block: 'center' }); el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  ok(`[${nombre}] Clic en Yucatán en el mapa lo selecciona en todo el sitio`, (await page.inputValue('#sel-ent')) === '31' && (await texto(page, '#m1-ficha')).includes('Yucatán') && (await texto(page, '#g2-sub')).includes('Yucatán') && (await texto(page, '#estrategia-cuerpo')).includes('Yucatán'));
  await page.focus('#m1 .estado-mapa[data-clave="20"]');
  await page.keyboard.press('Enter');
  ok(`[${nombre}] El mapa de México funciona con teclado (Enter en Oaxaca)`, (await page.inputValue('#sel-ent')) === '20');
  await page.$eval('#m2 .pais-mapa[data-iso="CRI"]', (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  ok(`[${nombre}] Clic en Costa Rica en el mapa del mundo sincroniza dispersión y tabla`, (await texto(page, '#g3-detalle')).includes('Costa Rica') && (await page.$$eval('#tabla-int tr.fila--sel', (l) => l.map((t) => t.textContent).join(''))).includes('Costa Rica'));
  await page.selectOption('#m2-ind', 'bolsillo');
  ok(`[${nombre}] Selector de indicador del mapa del mundo`, (await page.textContent('#m2-leyenda')).includes('40% o más'));
  const trama = await page.$$eval('#m2 .pais-mapa', (l) => l.filter((p) => p.style.fill.includes('trama')).length);
  ok(`[${nombre}] Países sin dato con trama, no como cero`, trama > 0, `${trama} con trama`);
  await page.click('#btn-tema');
  ok(`[${nombre}] Cambio a modo oscuro`, (await page.getAttribute('html', 'data-theme')) === 'dark');
  await page.screenshot({ path: path.join(CAPT, `${nombre}-resumen-oscuro.png`), fullPage: true });
  await axe(page, `${nombre} Resumen en modo oscuro`);
  await page.click('#btn-tema');
  await page.selectOption('#sel-ent', '28');

  // 2. Seleccionar un estado desde la gráfica
  const antesG2 = await texto(page, '#g2-sub');
  await page.click('#g1 .barra[data-clave="14"]');
  const ent = await page.inputValue('#sel-ent');
  ok(`[${nombre}] Clic en la barra de Jalisco selecciona el estado`, ent === '14', ent);
  ok(`[${nombre}] La gráfica 2 se actualiza con el estado`, (await texto(page, '#g2-sub')).includes('Jalisco') && antesG2 !== (await texto(page, '#g2-sub')));

  // 3. Cambiar de institución actualiza indicadores y estrategia
  await page.selectOption('#sel-inst', 'issste');
  ok(`[${nombre}] Cambio a ISSSTE actualiza la gráfica 1`, (await texto(page, '#g1-sub')).includes('ISSSTE'));
  ok(`[${nombre}] Cambio a ISSSTE actualiza la estrategia`, (await texto(page, '#estrategia-cuerpo')).includes('ISSSTE'));

  // 4. Entidad con indicadores de precisión baja (ISSSTE, Querétaro): se excluyen de la prioridad
  await page.selectOption('#sel-ent', '22');
  const h2 = await texto(page, '#g2-hallazgo');
  ok(`[${nombre}] Querétaro-ISSSTE: aspectos con precisión baja excluidos y nombrados`, /Excluidos/.test(h2) && /saturaci/i.test(h2), h2.slice(0, 160));

  // 5. Institución sin datos estatales (IMSS-Bienestar): «Sin datos comparables» y regla R-99
  await page.selectOption('#sel-inst', 'imssb');
  const h1 = await texto(page, '#g1-hallazgo');
  ok(`[${nombre}] IMSS-Bienestar muestra «Sin datos comparables»`, h1.includes('Sin datos comparables'), h1.slice(0, 120));
  await page.click('a[data-seccion="estrategia"]');
  const estr = await texto(page, '#estrategia-cuerpo');
  ok(`[${nombre}] IMSS-Bienestar: la estrategia explica qué información conseguir primero (R-99)`, estr.includes('R-99') && estr.includes('conseguir primero'));
  await page.screenshot({ path: path.join(CAPT, `${nombre}-estrategia-sin-datos.png`), fullPage: true });

  // 6. Estrategia con brecha (IMSS, Tamaulipas)
  await page.selectOption('#sel-inst', 'imss');
  await page.selectOption('#sel-ent', '28');
  const e2 = await texto(page, '#estrategia-cuerpo');
  ok(`[${nombre}] IMSS-Tamaulipas: estrategia con dato observado, referencia, brecha, práctica e indicador`,
    /Dato observado/.test(e2) && /Referencia/.test(e2) && /pp/.test(e2) && /Indicador de resultado/.test(e2) && /Regla R-\d\d/.test(e2));
  const enlacesPract = await page.$$eval('#estrategia a[href^="http"]', (l) => l.length);
  ok(`[${nombre}] La estrategia enlaza fuentes de prácticas`, enlacesPract > 0, `${enlacesPract} enlaces`);
  await page.screenshot({ path: path.join(CAPT, `${nombre}-estrategia.png`), fullPage: true });
  await axe(page, `${nombre} Estrategia`);

  // 7. México por estado
  await page.click('a[data-seccion="mexico"]');
  ok(`[${nombre}] México por estado incluye el caso IMSS con periodo`, (await texto(page, '#caso-imss')).includes('12 de octubre de 2026'));
  ok(`[${nombre}] Modalidad 40 identificada como esquema de retiro`, (await texto(page, '#caso-imss')).includes('cotización voluntaria para el retiro'));
  ok(`[${nombre}] Contexto del estado con 5 indicadores públicos y fuente`, (await page.$$eval('#contexto .contexto:not(.contexto--privado) .contexto__fila', (l) => l.length)) === 5 && (await page.$$eval('#contexto .contexto:not(.contexto--privado) a[href^="http"]', (l) => l.length)) >= 5);
  // Sector privado: contexto con fuente, año y unidad; «Sin datos disponibles» donde falta; nunca entra en la brecha
  const priv = await page.evaluate(() => {
    const D = window.DATOS, A = window.A, problemas = [];
    const filas = [...document.querySelectorAll('#contexto .contexto--privado .contexto__fila')];
    filas.filter((f) => f.dataset.indicador).forEach((f) => {
      const m = D.contexto.indicadores[f.dataset.indicador];
      const t = f.textContent;
      if (!f.querySelector('a[href^="http"]')) problemas.push(`${f.dataset.indicador} sin enlace a su fuente`);
      if (!t.includes(String(m.anio)) || !t.includes(m.unidad)) problemas.push(`${f.dataset.indicador} sin año o unidad`);
    });
    const sin = filas.filter((f) => f.dataset.sin).map((f) => f.dataset.sin);
    if (!sin.includes('Sin datos disponibles') || !sin.includes('Sin indicador comparable')) problemas.push('faltan los renglones sin dato (uso privado o comparación de satisfacción)');
    // Quitar los datos privados no cambia ninguna brecha, solución ni etapa
    const huella = () => JSON.stringify(['imss', 'issste', 'estatal'].map((i) => A.soluciones(i, 2025).porEstado.map((x) => [x.regla.id, x.tipo === 'brecha' ? x.aspecto.dif : null])));
    const antes = huella();
    const copia = JSON.parse(JSON.stringify(D.contexto.datos));
    Object.values(D.contexto.datos).forEach((d) => Object.keys(D.contexto.indicadores).filter((k) => D.contexto.indicadores[k].grupo === 'privado').forEach((k) => { delete d[k]; }));
    if (huella() !== antes) problemas.push('los datos privados cambian el cálculo');
    D.contexto.datos = copia;
    return { problemas, n: filas.length };
  });
  ok(`[${nombre}] Sector privado como contexto: fuente, año y unidad, «Sin datos disponibles» donde falta y fuera del cálculo de la brecha`, priv.problemas.length === 0 && priv.n >= 8, `${priv.n} renglones; ${priv.problemas.join(' / ')}`);
  ok(`[${nombre}] Tabla estatal con las columnas del sector privado`, (await page.$$eval('#tabla-est thead th', (l) => l.map((t) => t.textContent).join('|'))).includes('Camas privadas por 1 000'));
  // Pensiones y servicio médico: sección, fuentes por afirmación y postura rotulada
  const pens = await page.evaluate(() => {
    const sec = document.querySelector('#pensiones');
    if (!sec || !sec.textContent.trim()) return { existe: false };
    const afirm = [...sec.querySelectorAll('.afirmacion')];
    const sinFuente = afirm.filter((x) => !x.querySelector('a[href^="http"]')).map((x) => x.textContent.trim().slice(0, 60));
    const post = sec.querySelector('.postura');
    return {
      existe: !!document.querySelector('#t-pensiones') && /relación indirecta/i.test(document.querySelector('#t-pensiones').textContent),
      afirmaciones: afirm.length, sinFuente,
      postura: !!post && /opinión/i.test(post.querySelector('.postura__rotulo')?.textContent || '') && post.getAttribute('role') === 'note',
      mod40: /Invalidez y Vida/.test(sec.textContent) && /no incluye el Seguro de Enfermedades y Maternidad/i.test(sec.textContent)
    };
  });
  ok(`[${nombre}] Sección «Pensiones y servicio médico: relación indirecta» presente`, pens.existe);
  ok(`[${nombre}] Cada afirmación de la sección de pensiones enlaza a su fuente`, pens.existe && pens.afirmaciones >= 10 && pens.sinFuente.length === 0, `${pens.afirmaciones} afirmaciones; sin fuente: ${(pens.sinFuente || []).join(' / ') || 'ninguna'}`);
  ok(`[${nombre}] Recuadro de postura rotulado como opinión`, pens.postura);
  ok(`[${nombre}] Se aclara que la Modalidad 40 no cubre el servicio médico`, pens.mod40);
  await page.screenshot({ path: path.join(CAPT, `${nombre}-mexico.png`), fullPage: true });
  await axe(page, `${nombre} México por estado`);

  // 8. Comparación mundial
  await page.click('a[data-seccion="mundial"]');
  const pract = await page.$$eval('#practicas .practica', (l) => l.length);
  ok(`[${nombre}] Fichas de prácticas con enlace a la fuente`, pract >= 2 && (await page.$$eval('#practicas a[href^="http"]', (l) => l.length)) >= pract, `${pract} fichas`);
  await page.screenshot({ path: path.join(CAPT, `${nombre}-mundial.png`), fullPage: true });
  await axe(page, `${nombre} Comparación mundial`);

  // 9. Filtros de país y región en Resumen
  await page.click('a[data-seccion="resumen"]');
  await page.click('[data-conjunto="todos"]');
  const puntos = await page.$$eval('#g3 .punto', (l) => l.length);
  ok(`[${nombre}] Conjunto completo: 191 países en la dispersión`, puntos === 191, `${puntos}`);
  await page.selectOption('#g3-region', 'Asia oriental y Pacífico');
  const atenuados = await page.$$eval('#g3 .punto--atenuado', (l) => l.length);
  ok(`[${nombre}] Filtro por región atenúa los demás países`, atenuados > 100, `${atenuados} atenuados`);
  await page.selectOption('#g3-pais', 'THA');
  ok(`[${nombre}] Elegir país muestra su detalle`, (await texto(page, '#g3-detalle')).includes('Tailandia'));
  await page.click('#g3 .punto[data-iso="MEX"]', { force: true });
  ok(`[${nombre}] Clic en el punto de México muestra su detalle`, (await texto(page, '#g3-detalle')).includes('México'));
  await page.selectOption('#g4-orden', 'asc');
  const primero = await page.$eval('#g4 svg g:nth-of-type(2) text', (t) => t.textContent);
  ok(`[${nombre}] Ordenar gasto de bolsillo de menor a mayor`, !!primero, primero);
  await page.fill('#buscar-est', 'nuevo');
  await page.waitForFunction(() => document.querySelectorAll('#tabla-est tbody tr').length === 1, null, { timeout: 3000 }).catch(() => {});
  ok(`[${nombre}] Búsqueda en tabla estatal («nuevo» encuentra Nuevo León)`, (await page.$$eval('#tabla-est tbody tr', (l) => l.length)) === 1);
  await page.click('#tabla-int th button[data-col="bolsillo"]');
  ok(`[${nombre}] Ordenamiento en tabla internacional`, (await page.getAttribute('#tabla-int th[aria-sort="ascending"] button', 'data-col')) === 'bolsillo');

  await revisarMundo(page, `${nombre} con filtros`);
  await page.setViewportSize({ width: ancho === 1440 ? 760 : 1200, height: alto });
  await revisarMundo(page, `${nombre} tras cambiar el tamaño`);
  await page.setViewportSize({ width: ancho, height: alto });

  // 10. Cómo se calculó
  await page.click('a[data-seccion="metodo"]');
  ok(`[${nombre}] Vista «Cómo se calculó» con reglas y fuentes`, (await texto(page, '#metodo-cuerpo')).includes('R-06') && (await page.$$eval('#metodo .fuentes-lista a', (l) => l.length)) >= 10);
  const piz = await page.evaluate(() => ({ n: document.querySelectorAll('#metodo .pizarron__formulas li').length, texto: document.querySelector('#metodo .pizarron')?.textContent || '' }));
  ok(`[${nombre}] Pizarrón de «Cómo se calculó» con las cuatro fórmulas del sitio`, piz.n === 4 && piz.texto.includes('1.645') && piz.texto.includes('30%'), `${piz.n} fórmulas`);
  await axe(page, `${nombre} Cómo se calculó`);
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  await axe(page, `${nombre} Cómo se calculó en modo oscuro (pizarra)`);
  await page.evaluate(() => { delete document.documentElement.dataset.theme; });
  const pie = await texto(page, '.pie');
  ok(`[${nombre}] El pie da crédito a iroFactory y a GSAP`, pie.includes('iroFactory') && pie.includes('RemiH06') && pie.includes('GSAP'));
  await page.click('a[data-seccion="resumen"]');
  const red = await page.evaluate(() => { const l = document.getElementById('portada-red'); return { existe: !!l, oculto: !!l && getComputedStyle(l).display === 'none', aria: l && l.getAttribute('aria-hidden') }; });
  ok(`[${nombre}] Grafo de pulsos de la portada decorativo (${ancho <= 640 ? 'oculto en celular' : 'visible'})`, red.existe && red.aria === 'true' && (ancho <= 640 ? red.oculto : !red.oculto), JSON.stringify(red));

  ok(`[${nombre}] Sin errores en consola`, errores.length === 0, errores.join(' | '));
  await ctx.close();
}

// 11. Abrir el archivo directamente (sin servidor)
{
  const { ctx, page, errores } = await abrir(1280, 800, pathToFileURL(path.join(RAIZ, 'index.html')).href);
  const svgs = await page.$$eval('#g1 svg, #g2 svg, #g3 svg, #g4 svg', (l) => l.length);
  ok('[archivo local] Abre con las cuatro gráficas sin servidor', svgs === 4 && errores.length === 0, errores.join(' | '));
  await revisarMundo(page, 'archivo local 1280');
  await page.setViewportSize({ width: 390, height: 844 });
  await revisarMundo(page, 'archivo local 390');
  await ctx.close();
}

// 12. Pruebas de escaneo del QR (ilustrado y animado)
await probarQR({ navegador, BASE, RAIZ, ok, CAPT });

await navegador.close();
servidor.close();

const fallas = resultados.filter((r) => !r.ok);
const md = `# Resultados de pruebas\n\nFecha: ${new Date().toLocaleString('es-MX')}. Navegador: Microsoft Edge (${EDGE}). Anchos: 1440 px y 390 px. Accesibilidad: axe-core ${require('axe-core/package.json').version} (WCAG 2.1 A y AA, buenas prácticas).\n\nTotal: ${resultados.length} pruebas, ${resultados.length - fallas.length} correctas, ${fallas.length} fallas.\n\n| Resultado | Prueba | Detalle |\n|---|---|---|\n${resultados.map((r) => `| ${r.ok ? 'Correcta' : 'Falla'} | ${r.nombre} | ${String(r.detalle).replace(/\|/g, '/').slice(0, 300)} |`).join('\n')}\n`;
fs.writeFileSync(path.join(RAIZ, 'pruebas', 'resultados.md'), md);
console.log(`\n${resultados.length - fallas.length}/${resultados.length} correctas`);
process.exit(fallas.length ? 1 : 0);
