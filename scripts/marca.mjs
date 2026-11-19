// Exporta la marca a PNG con Edge sin ventana, a partir de img/logo-trafalgar.svg:
//   img/logo-trafalgar-512.png (fondo transparente), img/favicon-32.png, img/apple-touch-icon.png (180 px)
//   e img/compartir.png (1200 x 630, imagen para compartir en redes con og:image).
// Uso: node scripts/marca.mjs   (después de python scripts/logo.py)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const svg = fs.readFileSync(path.join(RAIZ, 'img', 'logo-trafalgar.svg'), 'utf8');
const conTam = (n) => svg.replace('<svg', `<svg width="${n}" height="${n}"`);

const nav = await chromium.launch({ executablePath: EDGE, headless: true });
async function foto(html, ancho, alto, salida, transparente) {
  const p = await nav.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style>${html}`);
  await p.screenshot({ path: path.join(RAIZ, 'img', salida), omitBackground: !!transparente, clip: { x: 0, y: 0, width: ancho, height: alto } });
  await p.close();
  console.log(`img/${salida}: ${ancho} x ${alto}`);
}
await foto(`<div style="width:512px;height:512px">${conTam(512)}</div>`, 512, 512, 'logo-trafalgar-512.png', true);
await foto(`<div style="width:32px;height:32px">${conTam(32)}</div>`, 32, 32, 'favicon-32.png', true);
await foto(`<div style="width:180px;height:180px;background:#fcfcfb;display:grid;place-items:center">${conTam(140)}</div>`, 180, 180, 'apple-touch-icon.png');
await foto(`<div style="width:1200px;height:630px;background:#fcfcfb;display:flex;align-items:center;gap:56px;padding:0 88px;box-sizing:border-box;font-family:'Segoe UI',Arial,sans-serif;position:relative">
  <div style="position:absolute;inset:auto 0 0 0;height:14px;background:linear-gradient(90deg,#0c645a 0 70%,#3fb6a3 70% 94%,#ee9c02 94%)"></div>
  <div style="flex:none">${conTam(300)}</div>
  <div><div style="font-size:92px;font-weight:800;letter-spacing:-.03em;color:#0c645a;line-height:1">Trafalgar</div>
  <div style="font-size:34px;line-height:1.3;color:#262b29;margin-top:22px;max-width:640px">Satisfacción con la salud pública en México, comparada con el mundo y con una estrategia de mejora</div>
  <div style="font-size:24px;color:#4a524f;margin-top:22px">ENCIG 2025 · INEGI · andre-bhp.github.io/Trafalgar</div></div></div>`, 1200, 630, 'compartir.png');
await nav.close();
