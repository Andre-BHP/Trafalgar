// Marca de versión en index.html (?v=huella) para que el navegador descargue los
// archivos nuevos. La usa scripts/procesar.mjs; sola: node scripts/version.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ARCHIVOS = ['datos/datos.js', 'css/estilos.css', 'js/util.js', 'js/analisis.js', 'js/graficas.js', 'js/vistas.js', 'js/app.js', 'js/fondo.js', 'js/vendor/gsap.min.js', 'js/qr-datos.js', 'js/qr.js'];
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function marcarVersion() {
  const huella = crypto.createHash('sha1');
  ARCHIVOS.forEach((a) => huella.update(fs.readFileSync(path.join(RAIZ, a))));
  const v = huella.digest('hex').slice(0, 10);
  const INDEX = path.join(RAIZ, 'index.html');
  let html = fs.readFileSync(INDEX, 'utf8');
  const escRe = (t) => t.replace(/[.*+?^${}()|[\]\\/]/g, (c) => '\\' + c);
  for (const a of ARCHIVOS) html = html.replace(new RegExp('"' + escRe(a) + '(\\?v=[0-9a-f]+)?"', 'g'), `"${a}?v=${v}"`);
  fs.writeFileSync(INDEX, html);
  return v;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(`Versión de archivos: ${marcarVersion()}`);
