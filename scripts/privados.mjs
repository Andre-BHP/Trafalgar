// Resume por entidad las fuentes del sector privado (se corre antes de `npm run datos`).
// Entradas (descargas oficiales; los archivos grandes no se suben al repositorio):
//   datos/fuentes/privados/esep_2023_csv.zip  INEGI, Estadísticas de Salud en Establecimientos Particulares 2023 (datos abiertos)
//   datos/fuentes/privados/clues_202610.xlsx  DGIS, catálogo CLUES de establecimientos de salud, corte octubre de 2026
// Salidas (sí se suben): datos/fuentes/privados/esep_2023_por_entidad.csv y clues_202610_por_entidad.csv
// Uso: node scripts/privados.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const X = require('xlsx');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(RAIZ, 'datos', 'fuentes', 'privados');
const clave = (v) => String(v).trim().padStart(2, '0');

// 1. ESEP 2023, tabla de recursos: una fila por establecimiento particular con hospitalización
const zip = path.join(DIR, 'esep_2023_csv.zip');
const dentro = 'conjunto_de_datos_recursos_esep_2023/conjunto_de_datos/conjunto_de_datos_recursos_esep_2023.csv';
const tmp = path.join(DIR, 'esep');
if (!fs.existsSync(path.join(tmp, dentro))) execFileSync('tar', ['-xf', zip, '-C', fs.mkdirSync(tmp, { recursive: true }) || tmp, dentro]);
const lineas = fs.readFileSync(path.join(tmp, dentro), 'latin1').trim().split(/\r?\n/);
const cab = lineas[0].split(',');
const col = (n) => cab.indexOf(n);
const esep = {};
for (const l of lineas.slice(1)) {
  const r = l.split(',');
  const c = clave(r[col('sreentidad')]);
  const x = (esep[c] = esep[c] || { establecimientos: 0, camas: 0, consultorios: 0, medicos: 0 });
  x.establecimientos++;
  x.camas += +r[col('sre407')] || 0; // camas censables
  x.consultorios += +r[col('sre404')] || 0;
  x.medicos += (+r[col('sre378_nh')] || 0) + (+r[col('sre378_ae')] || 0); // personal médico por nómina y por acuerdo
}
fs.writeFileSync(path.join(DIR, 'esep_2023_por_entidad.csv'), 'clave,establecimientos,camas_censables,consultorios,medicos\n' +
  Object.keys(esep).sort().map((c) => [c, esep[c].establecimientos, esep[c].camas, esep[c].consultorios, esep[c].medicos].join(',')).join('\n') + '\n');

// 2. CLUES, octubre de 2026: establecimientos en operación por institución
const wb = X.readFile(path.join(DIR, 'clues_202610.xlsx'), { dense: true, sheets: [0] });
const filas = X.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
const h = filas[0], i = (n) => h.indexOf(n);
const clues = {};
for (const r of filas.slice(1)) {
  if (r[i('ESTATUS DE OPERACION')] !== 'EN OPERACION') continue;
  const c = clave(r[i('CLAVE DE LA ENTIDAD')]);
  const x = (clues[c] = clues[c] || { total: 0, privados: 0, privados_hosp: 0, privados_farmacia: 0 });
  x.total++;
  if (r[i('CLAVE DE LA INSTITUCION')] === 'SMP') {
    x.privados++;
    if (/HOSPITALIZACI[OÓ]N/.test(r[i('NOMBRE TIPO ESTABLECIMIENTO')])) x.privados_hosp++;
    if (r[i('CLAVE DE TIPOLOGIA')] === 'CAFS') x.privados_farmacia++;
  }
}
fs.writeFileSync(path.join(DIR, 'clues_202610_por_entidad.csv'), 'clave,en_operacion,privados,privados_hospitalizacion,privados_adyacentes_farmacia\n' +
  Object.keys(clues).filter((c) => +c >= 1 && +c <= 32).sort().map((c) => [c, clues[c].total, clues[c].privados, clues[c].privados_hosp, clues[c].privados_farmacia].join(',')).join('\n') + '\n');
const t = (o, k) => Object.values(o).reduce((s, x) => s + x[k], 0);
console.log(`ESEP 2023: ${t(esep, 'establecimientos')} establecimientos, ${t(esep, 'camas')} camas censables. CLUES 202610: ${t(clues, 'privados')} privados en operación de ${t(clues, 'total')}.`);
