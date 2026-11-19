// Pruebas de escaneo del QR (cartas dis-094 y dis-081): decodifica con jsQR en
// Node y con ZXing (zxing-cpp por Python, pruebas/zxing_leer.py), la versión ilustrada (qr/) y la animada del sitio al terminar
// de crecer. Simula el código impreso a 3 y 5 cm (300 ppp), con desenfoque leve y
// una toma de cámara a menor resolución. Debe leer la dirección exacta.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const jsQR = require('jsqr');
export const URL_QR = 'https://andre-bhp.github.io/Trafalgar/';

// jsQR en Node sobre los pixeles RGBA
export function leerJsQR({ w, h, rgba }) {
  const a = jsQR(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), w, h, { inversionAttempts: 'dontInvert' });
  return a ? a.data : null;
}
// ZXing sobre los PNG simulados, todos en una llamada
function leerZXing(rutas) {
  const py = process.env.PYTHON || 'python';
  const out = execFileSync(py, [path.join(path.dirname(fileURLToPath(import.meta.url)), 'zxing_leer.py'), ...rutas], { encoding: 'utf8' });
  return JSON.parse(out);
}

// En el navegador: dibuja la imagen con el código a `cm` centímetros a 300 ppp,
// la desenfoca y la vuelve a muestrear como una cámara (factor `camara`).
async function simular(page, dataUrl, { cm, fraccion, desenfoque, camara }) {
  const r = await page.evaluate(async ({ dataUrl, cm, fraccion, desenfoque, camara }) => {
    const img = new Image(); img.src = dataUrl; await img.decode();
    const anchoCodigo = Math.round(cm / 2.54 * 300), ancho = Math.round(anchoCodigo / fraccion), alto = Math.round(ancho * img.naturalHeight / img.naturalWidth);
    const margen = 40, c1 = document.createElement('canvas'); c1.width = ancho + 2 * margen; c1.height = alto + 2 * margen;
    const x1 = c1.getContext('2d'); x1.fillStyle = '#fcfcfb'; x1.fillRect(0, 0, c1.width, c1.height);
    x1.filter = `blur(${desenfoque}px)`; x1.drawImage(img, margen, margen, ancho, alto);
    const c2 = document.createElement('canvas'); c2.width = Math.round(c1.width * camara); c2.height = Math.round(c1.height * camara);
    const x2 = c2.getContext('2d'); x2.imageSmoothingQuality = 'high'; x2.drawImage(c1, 0, 0, c2.width, c2.height);
    const d = x2.getImageData(0, 0, c2.width, c2.height).data;
    let bin = ''; for (let i = 0; i < d.length; i += 32768) bin += String.fromCharCode.apply(null, d.subarray(i, i + 32768));
    return { w: c2.width, h: c2.height, b64: btoa(bin), png: c2.toDataURL('image/png'), anchoCodigo };
  }, { dataUrl, cm, fraccion, desenfoque, camara });
  return { w: r.w, h: r.h, rgba: Buffer.from(r.b64, 'base64'), png: Buffer.from(r.png.split(',')[1], 'base64'), anchoCodigo: r.anchoCodigo };
}

const CASOS = [
  { cm: 3, desenfoque: 1.2, camara: 0.6, nombre: '3 cm, desenfoque 1.2 px, cámara al 60%' },
  { cm: 5, desenfoque: 1.5, camara: 0.5, nombre: '5 cm, desenfoque 1.5 px, cámara al 50%' },
];

// Simula cada caso y guarda el PNG; la lectura se hace al final con los dos lectores
const pendientes = [];
let DIR_SIM = '';
async function probarImagen(page, ok, etiqueta, dataUrl, fraccion) {
  for (const caso of CASOS) {
    const px = await simular(page, dataUrl, { ...caso, fraccion });
    const ruta = path.join(DIR_SIM, `${etiqueta.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${caso.cm}cm.png`);
    fs.writeFileSync(ruta, px.png);
    pendientes.push({ nombre: `[QR] ${etiqueta}: lee la dirección exacta a ${caso.nombre}`, jsqr: leerJsQR(px), ruta, ancho: px.anchoCodigo });
  }
}
function resolver(ok) {
  const z = leerZXing(pendientes.map((p) => p.ruta));
  for (const p of pendientes) ok(p.nombre, p.jsqr === URL_QR && z[p.ruta] === URL_QR, `jsQR: ${p.jsqr ?? 'sin lectura'}; ZXing: ${z[p.ruta] ?? 'sin lectura'}; código de ${p.ancho} px a 300 ppp`);
  pendientes.length = 0;
}

export async function probarQR({ navegador, BASE, RAIZ, ok, CAPT }) {
  DIR_SIM = path.join(CAPT, 'qr-simulado'); fs.mkdirSync(DIR_SIM, { recursive: true });
  const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, 'qr', 'trafalgar-qr.json'), 'utf8'));
  const fraccion = datos.n / datos.ancho;
  ok('[QR] Matriz versión 5 con corrección H hacia la dirección del sitio', datos.url === URL_QR && datos.correccion === 'H' && datos.version === 5, `versión ${datos.version}, ${datos.n}x${datos.n}, ${datos.hojas.length} hojas`);

  // Versión ilustrada (SVG y PNG de qr/)
  const ctx = await navegador.newContext({ viewport: { width: 800, height: 600 } });
  const page = await ctx.newPage();
  await page.goto(BASE + 'qr/trafalgar-qr.json');
  const svg = fs.readFileSync(path.join(RAIZ, 'qr', 'trafalgar-qr-ilustrado.svg'));
  const png = fs.readFileSync(path.join(RAIZ, 'qr', 'trafalgar-qr-ilustrado.png'));
  await probarImagen(page, ok, 'Ilustrada SVG', 'data:image/svg+xml;base64,' + svg.toString('base64'), fraccion);
  await probarImagen(page, ok, 'Ilustrada PNG', 'data:image/png;base64,' + png.toString('base64'), fraccion);
  ok('[QR] Ilustrada: zona de silencio de 4 módulos sin marcas oscuras', zonaLimpia(datos), 'ninguna hoja ni rama oscura fuera del código');

  // Versión animada del sitio, al terminar de crecer, en claro y oscuro, a 1440 y 390 px
  for (const [ancho, alto] of [[1440, 900], [390, 844]]) {
    for (const tema of ['light', 'dark']) {
      const c = await navegador.newContext({ viewport: { width: ancho, height: alto }, colorScheme: tema, deviceScaleFactor: 2 });
      const p = await c.newPage();
      const errores = []; p.on('pageerror', (e) => errores.push(e.message));
      await p.goto(BASE);
      await p.waitForSelector('#qr-arbol svg');
      const antes = await p.evaluate(() => window.QR_ANIM && window.QR_ANIM.estado);
      const t0 = Date.now();
      await p.$eval('#qr-arbol', (el) => el.scrollIntoView({ block: 'center' }));
      await p.waitForFunction(() => window.QR_ANIM && window.QR_ANIM.estado === 'terminado', null, { timeout: 5000 }).catch(() => {});
      const real = Date.now() - t0;
      const info = await p.evaluate(() => ({ ...window.QR_ANIM, fondo: getComputedStyle(document.querySelector('.qr-tarjeta')).backgroundColor }));
      const etq = `${ancho} px, ${tema === 'dark' ? 'oscuro' : 'claro'}`;
      ok(`[QR] Animada (${etq}): espera fuera de pantalla, crece al entrar y termina en menos de 2 s`, antes === 'espera' && info.estado === 'terminado' && info.duracion > 0.8 && info.duracion < 2 && info.real < 2000, `línea de tiempo de ${info.duracion.toFixed(2)} s; ${info.real} ms medidos en la página (${real} ms con la espera de la prueba)`);
      ok(`[QR] Animada (${etq}): tarjeta clara también en modo oscuro`, info.fondo === 'rgb(252, 252, 251)', info.fondo);
      const captura = await p.locator('#qr-arbol svg').screenshot({ path: path.join(CAPT, `qr-animado-${ancho}-${tema}.png`) });
      await probarImagen(p, ok, `Animada al terminar (${etq})`, 'data:image/png;base64,' + captura.toString('base64'), fraccion);
      ok(`[QR] Animada (${etq}): sin errores en consola`, errores.length === 0, errores.join(' | '));
      await c.close();
    }
  }

  // Con prefers-reduced-motion: estático desde el principio y escaneable
  const cr = await navegador.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
  const pr = await cr.newPage();
  await pr.goto(BASE);
  await pr.waitForSelector('#qr-arbol svg');
  const est = await pr.evaluate(() => ({ estado: window.QR_ANIM.estado, boton: document.getElementById('qr-repetir').hidden, red: (() => { const l = document.getElementById('portada-red'); return !!l; })() }));
  ok('[QR] Con reduced-motion el QR queda fijo, sin botón de repetir', est.estado === 'fijo' && est.boton === true, JSON.stringify(est));
  const cap = await pr.locator('#qr-arbol svg').screenshot();
  await probarImagen(pr, ok, 'Fija con reduced-motion', 'data:image/png;base64,' + cap.toString('base64'), fraccion);
  await cr.close();
  await ctx.close();
  resolver(ok);
}

// Ningún elemento oscuro en la zona de silencio: hojas y ojos dentro del código
function zonaLimpia(d) {
  const min = d.silencio, max = d.silencio + d.n;
  return d.hojas.every(([x, y]) => x - 0.6 >= min - 0.11 && x + 0.6 <= max + 0.11 && y - 0.6 >= min - 0.11 && y + 0.6 <= max + 0.11);
}
