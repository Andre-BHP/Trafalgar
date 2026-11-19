// Procesa las fuentes oficiales y genera los datos del sitio.
// Uso: npm run datos
// Entradas: datos/fuentes/encig/*.xlsx, datos/Sistemas_de_salud_2023_Oracle.csv (opcional), datos/curados/*.json
// Salidas: datos/procesados/*.json y datos/datos.js (lo carga index.html)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATOS = path.join(RAIZ, 'datos');
const ENCIG_DIR = path.join(DATOS, 'fuentes', 'encig');
const SALIDA = path.join(DATOS, 'procesados');
const CSV = path.join(DATOS, 'Sistemas_de_salud_2023_Oracle.csv');

const log = (...a) => console.log('[datos]', ...a);
const leerJSON = (f) => JSON.parse(fs.readFileSync(path.join(DATOS, 'curados', f), 'utf8'));

// ---------- Catálogos ----------
const ENTIDADES = [
  ['01', 'Aguascalientes', 'Aguascalientes'], ['02', 'Baja California', 'Baja California'],
  ['03', 'Baja California Sur', 'Baja California Sur'], ['04', 'Campeche', 'Campeche'],
  ['05', 'Coahuila', 'Coahuila de Zaragoza'], ['06', 'Colima', 'Colima'], ['07', 'Chiapas', 'Chiapas'],
  ['08', 'Chihuahua', 'Chihuahua'], ['09', 'Ciudad de México', 'Ciudad de México'], ['10', 'Durango', 'Durango'],
  ['11', 'Guanajuato', 'Guanajuato'], ['12', 'Guerrero', 'Guerrero'], ['13', 'Hidalgo', 'Hidalgo'],
  ['14', 'Jalisco', 'Jalisco'], ['15', 'Estado de México', 'México'], ['16', 'Michoacán', 'Michoacán de Ocampo'],
  ['17', 'Morelos', 'Morelos'], ['18', 'Nayarit', 'Nayarit'], ['19', 'Nuevo León', 'Nuevo León'],
  ['20', 'Oaxaca', 'Oaxaca'], ['21', 'Puebla', 'Puebla'], ['22', 'Querétaro', 'Querétaro'],
  ['23', 'Quintana Roo', 'Quintana Roo'], ['24', 'San Luis Potosí', 'San Luis Potosí'], ['25', 'Sinaloa', 'Sinaloa'],
  ['26', 'Sonora', 'Sonora'], ['27', 'Tabasco', 'Tabasco'], ['28', 'Tamaulipas', 'Tamaulipas'],
  ['29', 'Tlaxcala', 'Tlaxcala'], ['30', 'Veracruz', 'Veracruz de Ignacio de la Llave'], ['31', 'Yucatán', 'Yucatán'],
  ['32', 'Zacatecas', 'Zacatecas']
];
// Regiones del cuadro 2.6 (notas 3 a 7 del cuadro)
const REGIONES = {
  centro: { nombre: 'Región Centro', entidades: ['09', '12', '13', '15', '17', '21', '29'] },
  noreste: { nombre: 'Región Noreste', entidades: ['05', '10', '19', '24', '28'] },
  noroeste: { nombre: 'Región Noroeste', entidades: ['02', '03', '08', '25', '26'] },
  occidente: { nombre: 'Región Occidente', entidades: ['01', '06', '11', '14', '16', '18', '22', '32'] },
  sureste: { nombre: 'Región Sureste', entidades: ['04', '07', '20', '23', '27', '30', '31'] }
};
// Entidades no adheridas a IMSS-Bienestar (nota 1/ de Principales resultados ENCIG 2025)
const NO_ADHERIDAS = ['01', '05', '08', '10', '11', '14', '19', '22'];

const ASPECTOS = [
  ['atencion_inmediata', 'Atención inmediata', 'Atención inmediata', 'proporciona atención inmediata?'],
  ['trato_respetuoso', 'Trato respetuoso', 'Trato respetuoso', 'proporciona un trato respetuoso?'],
  ['informacion_oportuna', 'Información oportuna y comprensible sobre su estado de salud', 'Información clara sobre su salud', 'le da información oportuna y comprensible sobre su estado de salud?'],
  ['instalaciones_equipo', 'Instalaciones adecuadas y equipo necesario', 'Instalaciones y equipo adecuados', 'tiene instalaciones adecuadas con el equipo necesario?'],
  ['instalaciones_limpias', 'Instalaciones limpias y ordenadas', 'Instalaciones limpias', 'tiene instalaciones limpias y ordenadas?'],
  ['medicamentos', 'Disposición de medicamentos', 'Disponibilidad de medicamentos', 'tiene disposición de medicamentos?'],
  ['sin_materiales', 'Atención sin requerimientos de materiales adicionales', 'Sin pedir materiales al paciente', 'atiende sin requerirle materiales de curación o equipo médico?'],
  ['personal_suficiente', 'Personal médico suficiente', 'Personal médico suficiente', 'cuenta con médicos suficientes?'],
  ['confianza_personal', 'Cuenta con personal médico en quienes confía por su capacidad', 'Confianza en el personal médico', 'cuenta con médicos en quienes confía por su capacidad?'],
  ['sin_saturacion', 'Clínicas y hospitales sin saturación de usuarios(as)', 'Sin saturación de pacientes', 'tiene clínicas y hospitales saturados por muchos(as) pacientes o enfermos(as)? (se publica la respuesta favorable: sin saturación)'],
  ['sin_pago_privado', 'Sin deficiencias, por lo que no ha tenido que pagar por un servicio de salud privado', 'Sin tener que pagar servicio privado', 'es deficiente, por lo que usted ha tenido que pagar por un servicio de salud privado? (se publica la respuesta favorable: sin deficiencias)']
];

const INSTITUCIONES = [
  { id: 'imss', nombre: 'Instituto Mexicano del Seguro Social (IMSS)', corto: 'IMSS', cuadro: '2.3', nivel: 'entidad', anios: [2025, 2023],
    comparable2023: true, nota2023: 'Misma institución, población (18 años y más en áreas urbanas de 100 mil habitantes o más), preguntas y alcance por entidad en 2023 y 2025.' },
  { id: 'issste', nombre: 'Instituto de Seguridad y Servicios Sociales de los Trabajadores del Estado (ISSSTE)', corto: 'ISSSTE', cuadro: '2.4', nivel: 'entidad', anios: [2025, 2023],
    comparable2023: true, nota2023: 'Misma institución, población, preguntas y alcance por entidad en 2023 y 2025.' },
  { id: 'estatal', nombre: 'Centros de salud y hospitales del gobierno del estado', corto: 'Servicios estatales', cuadro: '2.5', nivel: 'entidad', anios: [2025],
    comparable2023: false, nota2023: 'No comparable con 2023: en 2023 INEGI preguntó por el «servicio de salud estatal o Instituto de Salud para el Bienestar (INSABI)»; en 2025 por los «centros de salud y hospitales del gobierno de su estado», que en 24 entidades corresponden a unidades adheridas a IMSS-Bienestar.' },
  { id: 'imssb', nombre: 'IMSS-Bienestar (antes IMSS-Prospera)', corto: 'IMSS-Bienestar', cuadro: '2.6', nivel: 'region', anios: [2025],
    comparable2023: false, nota2023: 'INEGI publica este servicio solo por región (5 regiones), no por entidad federativa.' }
];

const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[0-9]+$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
const texto = (v) => (v && v.richText ? v.richText.map((x) => x.text).join('') : v && v.result !== undefined ? v.result : v);
const num = (v) => { const t = texto(v); const n = typeof t === 'number' ? t : parseFloat(String(t ?? '').replace(/,/g, '')); return Number.isFinite(n) ? n : null; };
const r1 = (x) => (x === null ? null : Math.round(x * 10) / 10);
const r2 = (x) => (x === null ? null : Math.round(x * 100) / 100);
const precision = (cv) => (cv === null ? 'Sin dato' : cv < 15 ? 'Alta' : cv < 30 ? 'Moderada' : 'Baja');

async function libro(nombre) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(ENCIG_DIR, nombre));
  return wb;
}

// Devuelve { columnas: {aspecto: col}, colSat, colPob } a partir de la hoja de estimaciones
function columnas(ws) {
  let filaAsp = null;
  ws.eachRow((row, i) => { if (filaAsp) return; row.eachCell((c) => { if (String(texto(c.value)).trim() === 'Atención inmediata') filaAsp = i; }); });
  if (!filaAsp) throw new Error('No se encontró la fila de aspectos en ' + ws.name);
  const fa = ws.getRow(filaAsp), fr = ws.getRow(filaAsp + 1);
  const cols = {}; let colSat = null;
  for (let j = 2; j <= ws.columnCount; j++) {
    const et = String(texto(fa.getCell(j).value) ?? '').replace(/\s+/g, ' ').trim();
    const tipo = String(texto(fr.getCell(j).value) ?? '').trim();
    if (tipo !== 'Relativos') continue;
    // INEGI varía levemente la redacción entre años (p. ej. «sobre su estado» / «sobre estado»)
    const suelto = (s) => norm(s).replace(/[^a-z ]/g, ' ').split(/\s+/).filter((w) => w && !['su', 'el', 'la', 'de', 'del', 'que'].includes(w)).join(' ');
    const asp = ASPECTOS.find((a) => suelto(a[1]) === suelto(et));
    if (asp) cols[asp[0]] = j;
    else if (/^Satisfecha/.test(et)) colSat = j;
    else throw new Error(`Encabezado no reconocido en ${ws.name}: "${et}"`);
  }
  const faltan = ASPECTOS.filter((a) => !cols[a[0]]).map((a) => a[0]);
  if (faltan.length || !colSat) throw new Error(`Columnas incompletas en ${ws.name}: ${faltan.join(', ')} ${colSat ? '' : 'satisfacción'}`);
  return { cols, colSat, colPob: 2 };
}

// Mapa nombre-normalizado -> fila (busca en la primera columna)
function filas(ws) {
  const m = {};
  ws.eachRow((row, i) => { const t = norm(texto(row.getCell(1).value)); if (t) m[t] = i; });
  return m;
}

async function leerCuadro(anio, cuadro, nivel) {
  const est = (await libro(`II_evaluacion_servicios_bajo_demanda_encig${anio}_est.xlsx`)).getWorksheet(cuadro);
  const cvw = (await libro(`II_evaluacion_servicios_bajo_demanda_encig${anio}_cv.xlsx`)).getWorksheet(cuadro);
  const { cols, colSat, colPob } = columnas(est);
  const fe = filas(est), fc = filas(cvw);
  const leer = (nombreInegi) => {
    const k = norm(nombreInegi);
    if (!fe[k]) return null;
    const re = est.getRow(fe[k]), rc = fc[k] ? cvw.getRow(fc[k]) : null;
    const par = (col) => ({ v: r2(num(re.getCell(col).value)), cv: rc ? r2(num(rc.getCell(col).value)) : null });
    const aspectos = {};
    for (const [id] of ASPECTOS) aspectos[id] = par(cols[id]);
    return { poblacion: num(re.getCell(colPob).value), satisfaccion: par(colSat), aspectos };
  };
  const out = { cuadro, nacional: leer('Estados Unidos Mexicanos') };
  if (nivel === 'entidad') {
    out.entidades = {};
    for (const [clave, , nombreInegi] of ENTIDADES) out.entidades[clave] = leer(nombreInegi);
  } else {
    out.regiones = {};
    for (const [id, r] of Object.entries(REGIONES)) out.regiones[id] = leer(r.nombre);
  }
  return out;
}

async function encig() {
  const datos = {};
  for (const inst of INSTITUCIONES) {
    datos[inst.id] = {};
    for (const anio of inst.anios) {
      datos[inst.id][anio] = await leerCuadro(anio, inst.cuadro, inst.nivel);
      const d = datos[inst.id][anio];
      const n = d.entidades ? Object.values(d.entidades).filter(Boolean).length : Object.values(d.regiones).filter(Boolean).length;
      log(`ENCIG ${anio} ${inst.corto} (cuadro ${inst.cuadro}): nacional satisfacción ${r1(d.nacional.satisfaccion.v)}%, ${n} ${inst.nivel === 'entidad' ? 'entidades' : 'regiones'}`);
    }
  }
  return {
    fuente: ['encig_2025', 'encig_2023'],
    definicion_conformidad: 'Porcentaje de personas usuarias del servicio que respondieron «Muy satisfecho(a)» o «Satisfecho(a)» (nota 2 de los cuadros 2.3 a 2.6 de INEGI).',
    alcance: 'Población de 18 años y más que reside en áreas urbanas de 100 mil habitantes o más y que usó el servicio. Los datos por entidad representan el dominio urbano de cada entidad, no a toda su población.',
    unidad: 'Porcentaje de personas usuarias del servicio',
    precision: 'Coeficiente de variación (CV) publicado por INEGI: Alta si CV < 15%, Moderada si 15% ≤ CV < 30%, Baja si CV ≥ 30%. Las estimaciones de precisión Baja se muestran, pero no se usan para clasificar ni priorizar.',
    significancia_nacional: {
      nota: 'INEGI marca con asterisco los cambios nacionales 2023-2025 estadísticamente significativos (gráfica «Población satisfecha con los servicios públicos bajo demanda», Principales resultados ENCIG 2025). INEGI no publica pruebas para las diferencias entre una entidad y el dato nacional.',
      imss: { de: 48.7, a: 43.3, significativo: true },
      issste: { de: 49.3, a: 45.8, significativo: false }
    },
    sentido: 'Los 11 aspectos se publican en sentido favorable (mayor porcentaje es mejor). Verificado con el cuestionario ENCIG 2025, preguntas 5.4 a 5.7: las preguntas 10 (saturación) y 11 (pago a servicio privado) se formulan en negativo y los cuadros de INEGI publican la respuesta favorable («sin saturación», «sin deficiencias»).',
    aspectos: ASPECTOS.map(([id, inegi, etiqueta, pregunta]) => ({ id, etiqueta, etiqueta_inegi: inegi, pregunta: '¿El servicio de salud... ' + pregunta, sentido: 'mayor es mejor' })),
    instituciones: INSTITUCIONES,
    entidades: ENTIDADES.map(([clave, nombre, nombre_inegi]) => ({
      clave, nombre, nombre_inegi,
      region: Object.entries(REGIONES).find(([, r]) => r.entidades.includes(clave))[0],
      adherida_imss_bienestar: !NO_ADHERIDAS.includes(clave)
    })),
    regiones: REGIONES,
    datos
  };
}

// ---------- CSV internacional ----------
function parseCSV(txt) {
  txt = txt.replace(/^﻿/, '');
  const primera = txt.split(/\r?\n/)[0];
  const sep = [';', ',', '\t', '|'].sort((a, b) => primera.split(b).length - primera.split(a).length)[0];
  const filasCSV = []; let fila = [], campo = '', q = false;
  for (let i = 0; i < txt.length; i++) {
    const c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
    else if (c === '"') q = true;
    else if (c === sep) { fila.push(campo); campo = ''; }
    else if (c === '\n') { fila.push(campo.replace(/\r$/, '')); filasCSV.push(fila); fila = []; campo = ''; }
    else campo += c;
  }
  if (campo || fila.length) { fila.push(campo); filasCSV.push(fila); }
  const enc = filasCSV.shift().map((h) => h.trim());
  return { sep, enc, filas: filasCSV.filter((f) => f.some((x) => x.trim())).map((f) => Object.fromEntries(enc.map((h, i) => [h, (f[i] ?? '').trim()]))) };
}
const numCSV = (s, sep) => {
  if (s === undefined || s === null) return null;
  let t = String(s).trim();
  if (!t || /^(na|n\/a|nan|null|\.\.|-)$/i.test(t)) return null;
  if (sep === ';' && /^-?[\d.]*,\d+$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t.replace(/\s/g, ''));
  return Number.isFinite(n) ? n : null;
};
const siNo = (s) => /^(1|si|sí|true|verdadero|s|y|yes|x)$/i.test(String(s ?? '').trim());

function mundial() {
  if (!fs.existsSync(CSV)) {
    log('AVISO: falta datos/Sistemas_de_salud_2023_Oracle.csv; la comparación mundial quedará como «Sin datos disponibles».');
    return { disponible: false, motivo: 'Falta el archivo Sistemas_de_salud_2023_Oracle.csv en la carpeta datos/. Colóquelo ahí y ejecute npm run datos.' };
  }
  const { sep, enc, filas: fl } = parseCSV(fs.readFileSync(CSV, 'utf8'));
  const req = ['Pais', 'ISO3', 'Anio', 'Cobertura_UHC_0_100', 'Gasto_salud_por_habitante_PPA', 'Gasto_de_bolsillo_pct', 'Region_Banco_Mundial', 'Comparacion_en_clase'];
  const faltan = req.filter((c) => !enc.includes(c));
  if (faltan.length) throw new Error('El CSV no tiene las columnas: ' + faltan.join(', ') + '. Encontradas: ' + enc.join(', '));
  const paises = fl.map((f) => ({
    pais: f.Pais, iso3: f.ISO3, anio: numCSV(f.Anio, sep),
    uhc: numCSV(f.Cobertura_UHC_0_100, sep), gasto: numCSV(f.Gasto_salud_por_habitante_PPA, sep),
    bolsillo: numCSV(f.Gasto_de_bolsillo_pct, sep), region: f.Region_Banco_Mundial, clase: siNo(f.Comparacion_en_clase)
  }));
  const mex = paises.find((p) => p.iso3 === 'MEX');
  log(`CSV: ${paises.length} filas, ${paises.filter((p) => p.clase).length} marcadas para clase, separador "${sep}". México: ${mex ? 'sí' : 'NO ENCONTRADO'}`);
  return {
    disponible: true, archivo: 'Sistemas_de_salud_2023_Oracle.csv', fuente: ['csv_clase', 'bm_uhc', 'bm_gasto', 'bm_bolsillo'],
    indicadores: {
      uhc: { etiqueta: 'Cobertura de servicios esenciales', unidad: 'índice 0 a 100', fuente: 'bm_uhc' },
      gasto: { etiqueta: 'Gasto en salud por habitante', unidad: 'dólares internacionales PPA por habitante', fuente: 'bm_gasto' },
      bolsillo: { etiqueta: 'Gasto de bolsillo', unidad: '% del gasto corriente total en salud', fuente: 'bm_bolsillo' }
    },
    paises
  };
}

// ---------- Contexto del estado (separado del cálculo de la brecha) ----------
const CTX = path.join(DATOS, 'fuentes', 'contexto');
const XLSX = require('xlsx');
const hoja = (archivo, nombre) => XLSX.utils.sheet_to_json(XLSX.readFile(path.join(CTX, archivo)).Sheets[nombre], { header: 1, defval: '' });
const normMay = (s) => norm(s).replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();

function contexto() {
  const porNombre = Object.fromEntries(ENTIDADES.map(([c, , ni]) => [normMay(ni), c]));
  porNombre['estados unidos mexicanos'] = 'nac';
  porNombre['nacional'] = 'nac';
  const est = {}; const put = (c, k, v) => { (est[c] = est[c] || {})[k] = v; };

  // 1. Carencia por acceso a los servicios de salud 2024 (% de la población). Hojas por entidad.
  const SIGLAS = ['EUM', 'Ags.', 'BC', 'BCS', 'Camp.', 'Coah.', 'Col.', 'Chis.', 'Chih.', 'CDMX', 'Dgo.', 'Gto.', 'Gro.', 'Hgo.', 'Jal.', 'Mex.', 'Mich.', 'Mor.', 'Nay.', 'NL', 'Oax.', 'Pue.', 'Qro.', 'Q. Roo', 'SLP', 'Sin.', 'Son.', 'Tab.', 'Tamps.', 'Tlax.', 'Ver.', 'Yuc.', 'Zac.'];
  const claveSigla = (i) => (i === 0 ? 'nac' : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32'][i - 1]);
  SIGLAS.forEach((s, i) => {
    const filas = hoja('pm_ef_2024.xlsx', s);
    const f = filas.find((x) => /^Carencia por acceso a los servicios de salud/.test(String(x[0]).trim()));
    if (!f) throw new Error('Sin carencia de salud en hoja ' + s);
    // Columna: bloque «Porcentaje», año 2024 (se localiza por encabezado, no por posición fija)
    const iEnc = filas.findIndex((x) => x.includes('Porcentaje'));
    const iPct = filas[iEnc].indexOf('Porcentaje');
    const col = filas[iEnc + 1].findIndex((v, j) => j >= iPct && Number(v) === 2024);
    if (col < 0) throw new Error('Sin columna de porcentaje 2024 en hoja ' + s);
    put(claveSigla(i), 'carencia_salud', r2(num(f[col])));
  });

  // 2. ENIGH 2024, cuadro 4.5: gasto en cuidados de la salud por hogar (trimestral) y su peso en el gasto monetario
  const c45 = hoja('enigh2024_ns_ef_tabulados.xlsx', 'Cuadro 4.5');
  let actual = null;
  for (const f of c45) {
    const et = normMay(f[0]);
    if (porNombre[et] && num(f[3]) === 100) actual = porNombre[et];
    else if (actual && et === 'cuidados de la salud') { put(actual, 'gasto_salud_hogar', Math.round(num(f[4]))); put(actual, 'gasto_salud_pct', r2(num(f[3]))); actual = null; }
  }

  // 3. DGIS, Recursos en Salud Sectorial 2024 (sector público): camas censables y médicos por 1 000 habitantes
  //    Denominador: población total ENIGH 2024, cuadro 1.1 (INEGI)
  const c11 = hoja('enigh2024_ns_ef_tabulados.xlsx', 'Cuadro 1.1');
  const pob = {};
  for (const f of c11) { const k = normMay(f[0]); if (porNombre[k] && porNombre[k] !== 'nac' && num(f[2])) pob[porNombre[k]] = num(f[2]); if (/^poblacion total/.test(k)) pob.nac = num(f[2]); }
  const { filas: rec } = parseCSV(fs.readFileSync(path.join(CTX, 'dgis_recursos_sectorial_2024.csv'), 'utf8'));
  const suma = {};
  for (const r of rec) {
    const c = String(r['Clave Estado']).padStart(2, '0');
    suma[c] = suma[c] || { camas: 0, medicos: 0 };
    suma[c].camas += Number(r['TOTAL CAMAS AREA HOSPITALIZACIÓN']) || 0;
    suma[c].medicos += Number(r['Total médicos generales especialistas y odonólogos']) || 0;
  }
  suma.nac = Object.values(suma).reduce((a, b) => ({ camas: a.camas + b.camas, medicos: a.medicos + b.medicos }), { camas: 0, medicos: 0 });
  for (const c of Object.keys(pob)) {
    if (!suma[c]) continue;
    put(c, 'medicos_1000', r2((suma[c].medicos / pob[c]) * 1000));
    put(c, 'camas_1000', r2((suma[c].camas / pob[c]) * 1000));
  }
  const n = ENTIDADES.filter(([c]) => est[c] && Object.keys(est[c]).length === 5).length;
  log(`Contexto: ${n} de 32 entidades con los 5 indicadores. Nacional: carencia ${est.nac.carencia_salud}%, médicos ${est.nac.medicos_1000}/1000, camas ${est.nac.camas_1000}/1000, gasto ${est.nac.gasto_salud_hogar} pesos.`);
  return {
    nota: 'Datos de contexto. No se usan para calcular la brecha ni la prioridad y no explican por sí solos la satisfacción reportada.',
    indicadores: {
      carencia_salud: { etiqueta: 'Población con carencia por acceso a los servicios de salud', unidad: '% de la población total', anio: 2024, fuente: 'pm_2024', alcance: 'Toda la población de la entidad (urbana y rural). Metodología CONEVAL, cálculo de INEGI con la ENIGH 2024.', sentido: 'menor es mejor' },
      medicos_1000: { etiqueta: 'Médicos generales, especialistas y odontólogos del sector público', unidad: 'por cada 1 000 habitantes', anio: 2024, fuente: 'dgis_2024', alcance: 'Establecimientos públicos registrados por la DGIS (cierre 2024). Denominador: población total ENIGH 2024. No incluye el sector privado.', sentido: 'mayor es mejor' },
      camas_1000: { etiqueta: 'Camas en área de hospitalización (censables) del sector público', unidad: 'por cada 1 000 habitantes', anio: 2024, fuente: 'dgis_2024', alcance: 'Establecimientos públicos registrados por la DGIS (cierre 2024). Denominador: población total ENIGH 2024. No incluye el sector privado.', sentido: 'mayor es mejor' },
      gasto_salud_hogar: { etiqueta: 'Gasto monetario de los hogares en cuidados de la salud', unidad: 'pesos por hogar, promedio trimestral (precios de 2024)', anio: 2024, fuente: 'enigh_2024', alcance: 'Todos los hogares de la entidad. Incluye consultas, medicamentos y otros pagos de salud de los hogares.', sentido: 'sin sentido de mejora (depende de ingreso y necesidad)' },
      gasto_salud_pct: { etiqueta: 'Peso del gasto en salud en el gasto corriente monetario de los hogares', unidad: '% del gasto corriente monetario', anio: 2024, fuente: 'enigh_2024', alcance: 'Todos los hogares de la entidad.', sentido: 'sin sentido de mejora' }
    },
    datos: est
  };
}

// ---------- Geometrías ----------
const GEO = path.join(DATOS, 'fuentes', 'geo');
const ISO_MX = { AGU: '01', BCN: '02', BCS: '03', CAM: '04', COA: '05', COL: '06', CHP: '07', CHH: '08', DIF: '09', CMX: '09', DUR: '10', GUA: '11', GRO: '12', HID: '13', JAL: '14', MEX: '15', MIC: '16', MOR: '17', NAY: '18', NLE: '19', OAX: '20', PUE: '21', QUE: '22', ROO: '23', SLP: '24', SIN: '25', SON: '26', TAB: '27', TAM: '28', TLA: '29', VER: '30', YUC: '31', ZAC: '32' };

async function simplificar(geojson, pct) {
  const mapshaper = require('mapshaper');
  const out = await mapshaper.applyCommands(`-i in.json -simplify ${pct} keep-shapes -o out.json format=geojson precision=0.001`, { 'in.json': JSON.stringify(geojson) });
  return JSON.parse(out['out.json']);
}

// d3-geo usa geometría esférica: un anillo exterior con el orden contrario cubre todo el globo.
// Si el área esférica de un polígono supera media esfera, se invierten sus anillos.
function rebobinar(d3, fc) {
  for (const f of fc.features) {
    const g = f.geometry; if (!g) continue;
    const polis = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    for (const anillos of polis) {
      if (d3.geoArea({ type: 'Polygon', coordinates: anillos }) > 2 * Math.PI) anillos.forEach((a) => a.reverse());
    }
  }
  return fc;
}

async function geometrias() {
  const d3 = await import('d3-geo');
  // México: Natural Earth 10m, admin 1
  const mxSrc = JSON.parse(fs.readFileSync(path.join(GEO, 'ne_10m_admin_1_mexico.geojson'), 'utf8'));
  mxSrc.features = mxSrc.features.filter((f) => ISO_MX[String(f.properties.iso_3166_2).replace('MX-', '')]);
  const mx = rebobinar(d3, await simplificar(mxSrc, '6%'));
  const W1 = 800, H1 = 520;
  const pr1 = d3.geoConicConformal().parallels([17.5, 29.5]).rotate([102, 0]).fitExtent([[8, 8], [W1 - 8, H1 - 8]], mx);
  const g1 = d3.geoPath(pr1).digits(1);
  const estados = mx.features.map((f) => {
    const clave = ISO_MX[String(f.properties.iso_3166_2).replace('MX-', '')];
    const [cx, cy] = g1.centroid(f);
    return { clave, d: g1(f), cx: Math.round(cx), cy: Math.round(cy) };
  }).sort((a, b) => a.clave.localeCompare(b.clave));
  if (estados.length !== 32) throw new Error('Se esperaban 32 estados en la geometría, hay ' + estados.length);

  // Mundo: Natural Earth 50m, admin 0
  const wSrc = JSON.parse(fs.readFileSync(path.join(GEO, 'ne_50m_admin_0_countries.geojson'), 'utf8'));
  wSrc.features = wSrc.features.filter((f) => f.properties.ADM0_A3 !== 'ATA');
  const w = rebobinar(d3, await simplificar(wSrc, '12%'));
  const W2 = 960, H2 = 470;
  const pr2 = d3.geoEqualEarth().fitExtent([[4, 4], [W2 - 4, H2 - 4]], w);
  const g2 = d3.geoPath(pr2).digits(1);
  const iso = (p) => [p.ISO_A3, p.ISO_A3_EH, p.ADM0_A3].find((x) => x && x !== '-99');
  const paises = w.features.map((f) => ({ iso3: iso(f.properties), nombre: f.properties.NAME_ES || f.properties.NAME, d: g2(f) })).filter((p) => p.d);
  log(`Geometrías: 32 estados (Natural Earth 10m) y ${paises.length} países (Natural Earth 50m).`);
  return {
    atribucion: 'Límites: Natural Earth (naturalearthdata.com), dominio público. Estados de México: admin 1, escala 1:10m; países: admin 0, escala 1:50m. Simplificados con mapshaper. Los límites son ilustrativos y no son oficiales.',
    mexico: { ancho: W1, alto: H1, estados },
    mundo: { ancho: W2, alto: H2, paises }
  };
}

// ---------- Ejecución ----------
const resultado = {
  generado: new Date().toISOString(),
  fuentes: leerJSON('fuentes.json'),
  encig: await encig(),
  mundial: mundial(),
  contexto: contexto(),
  geo: await geometrias(),
  practicas: leerJSON('practicas.json'),
  reglas: leerJSON('reglas.json'),
  imss: leerJSON('imss_2026.json')
};
fs.mkdirSync(SALIDA, { recursive: true });
for (const k of ['encig', 'mundial', 'contexto']) fs.writeFileSync(path.join(SALIDA, k + '.json'), JSON.stringify(resultado[k], null, 1));
fs.writeFileSync(path.join(DATOS, 'datos.js'), '// Generado por scripts/procesar.mjs. No editar a mano.\nwindow.DATOS = ' + JSON.stringify(resultado) + ';\n');
log('Listo: datos/datos.js y datos/procesados/*.json');
