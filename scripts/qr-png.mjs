// Exporta el QR ilustrado a PNG para imprimir (Edge sin ventana).
// Uso: node scripts/qr-png.mjs   (después de python scripts/qr.py)
// Salidas: qr/trafalgar-qr-ilustrado.png (2400 px de ancho, unos 20 cm a 300 ppp)
//          qr/trafalgar-qr-ilustrado-1200.png (para la presentación)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = process.env.EDGE || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const svg = fs.readFileSync(path.join(RAIZ, 'qr', 'trafalgar-qr-ilustrado.svg'), 'utf8');
const [, vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);

const nav = await chromium.launch({ executablePath: EDGE, headless: true });
for (const [ancho, nombre] of [[2400, 'trafalgar-qr-ilustrado.png'], [1200, 'trafalgar-qr-ilustrado-1200.png']]) {
  const alto = Math.round(ancho * vh / vw);
  const page = await nav.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block;width:${ancho}px;height:${alto}px}</style>${svg}`);
  await page.screenshot({ path: path.join(RAIZ, 'qr', nombre), clip: { x: 0, y: 0, width: ancho, height: alto } });
  await page.close();
  console.log(`qr/${nombre}: ${ancho} x ${alto} px`);
}
await nav.close();
