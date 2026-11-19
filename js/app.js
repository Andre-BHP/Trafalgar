/* Aplicación: estado de la selección, navegación y pintado de cada sección */
(function () {
  'use strict';
  const D = window.DATOS, U = window.U, A = window.A, G = window.G;
  const E = D.encig;
  const $ = U.$;

  // ---------- Estado ----------
  const est = {
    seccion: 'resumen', inst: 'imss', anio: 2025, ent: null,
    conjunto: 'clase', region: '', pais: 'MEX', g4grupo: 'clase', g4orden: 'desc',
    ordenEst: { col: 'obs', dir: 1 }, ordenInt: { col: 'pais', dir: 1 }
  };
  const SECCIONES = ['resumen', 'mexico', 'mundial', 'estrategia', 'metodo'];

  function estadoInicial() {
    // Estado por defecto: el de menor satisfacción con el IMSS en 2025 entre los comparables
    const r = A.ranking('imss', 2025).filter((f) => f.estado !== 'sin').sort((a, b) => a.obs - b.obs);
    est.ent = r.length ? r[0].clave : '01';
  }

  function leerHash() {
    const [sec, q] = location.hash.replace(/^#/, '').split('?');
    if (SECCIONES.includes(sec)) est.seccion = sec;
    const p = new URLSearchParams(q || '');
    if (p.get('i') && A.inst(p.get('i'))) est.inst = p.get('i');
    if (p.get('e') && A.entidad(p.get('e'))) est.ent = p.get('e');
    if (p.get('a') && A.inst(est.inst).anios.includes(+p.get('a'))) est.anio = +p.get('a');
    if (!A.inst(est.inst).anios.includes(est.anio)) est.anio = A.inst(est.inst).anios[0];
  }
  function escribirHash() {
    const h = `#${est.seccion}?i=${est.inst}&e=${est.ent}&a=${est.anio}`;
    if (location.hash !== h) history.replaceState(null, '', h);
  }

  const inst = () => A.inst(est.inst);
  const ent = () => A.entidad(est.ent);
  const fuenteEncig = (anio) => (anio === 2023 ? 'encig_2023' : 'encig_2025');
  const etiquetaFuenteEncig = (anio, cuadro) => `${U.fuente(fuenteEncig(anio), `INEGI, ENCIG ${anio}, tabulados básicos, cuadro ${cuadro}`)}`;

  // ---------- Barra de selección ----------
  function pintarSeleccion() {
    $('#sel-inst').innerHTML = E.instituciones.map((i) => `<option value="${i.id}"${i.id === est.inst ? ' selected' : ''}>${U.esc(i.corto + (i.nivel === 'region' ? ' (solo por región)' : ''))}</option>`).join('');
    $('#sel-ent').innerHTML = E.entidades.map((e) => `<option value="${e.clave}"${e.clave === est.ent ? ' selected' : ''}>${U.esc(e.nombre)}</option>`).join('');
    $('#sel-anio').innerHTML = inst().anios.map((a) => `<option value="${a}"${a === est.anio ? ' selected' : ''}>${a}</option>`).join('');
    let nota = '';
    if (inst().nivel === 'region') nota = 'IMSS-Bienestar: INEGI publica este servicio solo por región. No hay datos estatales comparables.';
    else if (!inst().comparable2023) nota = 'Servicios estatales: solo 2025. No es comparable con 2023 porque cambió la institución por la que se preguntó.';
    else if (est.anio === 2023) nota = 'Está viendo 2023. La estrategia usa el año elegido.';
    else nota = `${inst().corto}, ${est.anio}. Población usuaria de 18 años y más en áreas urbanas de 100 mil habitantes o más.`;
    $('#nota-seleccion').textContent = nota;
  }

  // ---------- Navegación ----------
  function mostrarSeccion() {
    SECCIONES.forEach((s) => { $('#' + s).hidden = s !== est.seccion; });
    U.$$('.navegacion a').forEach((a) => { if (a.dataset.seccion === est.seccion) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    $('#barra-seleccion').hidden = est.seccion === 'metodo';
    // Las gráficas se dibujan con el ancho real del contenedor; al volver a Resumen se redibujan
    if (est.seccion === 'resumen' && graficasListas) { pintarG1(); pintarG2(); pintarG3(); pintarG4(); }
  }
  let graficasListas = false;

  // ---------- Datos derivados ----------
  function filasRanking() {
    if (inst().nivel === 'region') {
      const nac = A.nacional(est.inst, est.anio);
      return Object.entries(E.regiones).map(([id, r]) => {
        const reg = E.datos[est.inst][est.anio].regiones[id];
        const ref = U.r1(nac.satisfaccion.v), obs = reg ? U.r1(reg.satisfaccion.v) : null;
        const comp = A.comparable(reg && reg.satisfaccion);
        const dif = comp ? U.r1(obs - ref) : null;
        return { clave: id, nombre: r.nombre, obs, ref, dif, cv: reg && reg.satisfaccion.cv, estado: !comp ? 'sin' : dif < 0 ? 'debajo' : 'arriba', motivo: 'Dato regional, no estatal.' };
      }).sort((a, b) => a.obs - b.obs);
    }
    return A.ranking(est.inst, est.anio).sort((a, b) => (a.obs === null) - (b.obs === null) || (a.estado === 'sin') - (b.estado === 'sin') || a.obs - b.obs);
  }

  // ---------- Preguntas ----------
  function pintarPreguntas() {
    const i = inst(), e = ent();
    const ref = A.nacional(est.inst, est.anio);
    let r1;
    if (i.nivel === 'region') {
      r1 = `Sin datos estatales para ${U.esc(i.corto)}: INEGI lo publica solo por región. Elija IMSS, ISSSTE o servicios estatales.`;
    } else {
      const rk = A.ranking(est.inst, est.anio).filter((f) => f.estado !== 'sin').sort((a, b) => a.obs - b.obs);
      const debajo = rk.filter((f) => f.estado === 'debajo').length;
      r1 = `Con ${U.esc(i.corto)} en ${est.anio}, la menor satisfacción está en <strong>${rk.slice(0, 3).map((f) => `${U.esc(f.nombre)} (${U.pct(f.obs)})`).join(', ')}</strong>. Referencia nacional: ${U.pct(U.r1(ref.satisfaccion.v))}. ${debajo} de 32 estados están por debajo.`;
    }
    const es = A.estrategia(est.inst, est.anio, est.ent);
    let r2, r4;
    if (es.tipo === 'brecha') {
      r2 = `En ${U.esc(e.nombre)} (${U.esc(i.corto)}, ${est.anio}): <strong>${U.esc(es.aspecto.etiqueta)}</strong>, ${U.pct(es.aspecto.obs)} frente a ${U.pct(es.aspecto.ref)} nacional (${U.pp(es.aspecto.dif)}).`;
      r4 = `${U.esc(es.regla.primero)} Indicador: ${U.esc(es.regla.indicador_operativo.toLowerCase())}.`;
    } else if (es.tipo === 'sin_brecha') {
      r2 = `En ${U.esc(e.nombre)} ningún aspecto comparable está por debajo de la referencia nacional de ${U.esc(i.corto)}.`;
      r4 = U.esc(es.regla.primero);
    } else {
      r2 = `Sin datos comparables para ${U.esc(e.nombre)} con ${U.esc(i.corto)}.`;
      r4 = U.esc(es.regla.primero);
    }
    let r3;
    if (A.mundialDisponible()) {
      const fav = A.favorables('clase');
      r3 = `${fav.length} de los 21 países de clase distintos de México tienen cobertura igual o mayor con menor gasto por habitante${fav.length ? ': <strong>' + fav.map((p) => U.esc(p.pais)).join(', ') + '</strong>' : ''}. Prácticas documentadas: atención primaria en Tailandia y equipos EBAIS en Costa Rica.`;
    } else r3 = 'Sin datos disponibles: falta el archivo de comparación internacional. Prácticas documentadas: atención primaria en Tailandia y equipos EBAIS en Costa Rica.';
    const items = [
      ['1', '¿En qué estados hay menor satisfacción con un servicio público de salud?', r1, '#resumen', 'Ver gráfica por estado', 'g1-t'],
      ['2', '¿Qué aspecto del servicio tiene mayor rezago en el estado elegido?', r2, '#mexico', 'Ver detalle del estado'],
      ['3', '¿Qué hacen otros países frente a problemas similares?', r3, '#mundial', 'Ver comparación mundial'],
      ['4', '¿Qué acciones sugiere la aplicación y cómo se mediría su avance?', r4, '#estrategia', 'Ver estrategia completa']
    ];
    $('#preguntas').innerHTML = items.map(([n, q, r, h, t]) => `<li class="pregunta"><span class="pregunta__num" aria-hidden="true">${n}</span><h3>${q}</h3><p class="pregunta__resp">${r}</p><a href="${h}" data-ir="${h.slice(1)}">${t}</a></li>`).join('');
  }

  // ---------- Gráfica 1 ----------
  function leyendaEstados(cont) {
    cont.innerHTML = ['debajo', 'arriba', 'sin'].map((k) => `<li>${U.icono(k)}${U.TEXTO_ESTADO[k]}</li>`).join('') +
      '<li><svg width="22" height="12" aria-hidden="true" focusable="false"><line x1="1" x2="21" y1="6" y2="6" stroke="#17212b" stroke-width="2" stroke-dasharray="5 3"/></svg>Referencia nacional</li>';
  }
  function pintarG1() {
    const i = inst(), e = ent();
    const filas = filasRanking();
    const nac = A.nacional(est.inst, est.anio);
    const ref = U.r1(nac.satisfaccion.v);
    $('#g1-sub').textContent = i.nivel === 'region'
      ? `${i.corto}, ${est.anio}. INEGI publica este servicio solo por región: se muestran las 5 regiones, no estados.`
      : `Porcentaje de personas usuarias satisfechas o muy satisfechas con ${i.corto}, ${est.anio}. Ordenado de menor a mayor. Pulse una barra para elegir el estado.`;
    leyendaEstados($('#g1-leyenda'));
    G.barrasEstados($('#g1'), filas, {
      ref, titulo: `Satisfacción por ${i.nivel === 'region' ? 'región' : 'estado'} con ${i.corto}, ${est.anio}`,
      seleccion: i.nivel === 'region' ? A.regionDe(est.ent) : est.ent,
      onSelect: (clave, teclado) => {
        if (i.nivel === 'region') return;
        est.ent = clave; actualizar();
        if (teclado) { const b = $(`#g1 .barra[data-clave="${clave}"]`); if (b) b.focus(); }
      }
    });
    const s = A.satisfaccion(est.inst, est.anio, est.ent);
    let h;
    if (i.nivel === 'region') {
      const reg = A.registroRegion(est.inst, est.anio, est.ent);
      h = `<p><strong>${U.esc(e.nombre)}: Sin datos comparables.</strong> INEGI publica ${U.esc(i.corto)} solo por región. ${U.esc(e.nombre)} pertenece a la ${U.esc(E.regiones[A.regionDe(est.ent)].nombre)}, con ${U.pct(reg ? U.r1(reg.satisfaccion.v) : null)} de satisfacción (dato regional; referencia nacional ${U.pct(ref)}).</p>`;
    } else {
      const comp = filas.filter((f) => f.estado !== 'sin');
      const debajo = comp.filter((f) => f.estado === 'debajo').length;
      const min = comp[0];
      h = `<p><strong>${U.esc(e.nombre)}</strong>, ${U.esc(i.corto)} ${est.anio}: ${U.pct(s.obs)} de satisfacción; referencia nacional ${U.pct(s.ref)}; brecha descriptiva ${U.pp(s.dif)}. ${U.estadoHTML(s.estado)}${s.motivo ? ' ' + U.esc(s.motivo) : ''}</p>` +
        `<p>${debajo} de ${comp.length} estados comparables están por debajo de la referencia. El menor valor es ${U.esc(min.nombre)} (${U.pct(min.obs)}).</p>`;
    }
    $('#g1-hallazgo').innerHTML = '<h4>Hallazgo</h4>' + h + selloEncig();
    $('#g1-fuente').innerHTML = `Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}. Unidad: porcentaje de personas usuarias. Alcance: dominio urbano (áreas de 100 mil habitantes o más) de cada ${i.nivel === 'region' ? 'región' : 'entidad'}. <a href="#metodo" data-ir="metodo">Cómo se calculó</a>.`;
  }

  // ---------- Gráfica 2 ----------
  function pintarG2() {
    const i = inst(), e = ent();
    let lista = A.aspectos(est.inst, est.anio, est.ent);
    const pri = A.prioridad(lista);
    let titulo = `Aspectos del servicio en ${e.nombre} con ${i.corto}, ${est.anio}, comparados con la referencia nacional`;
    let regional = false;
    if (i.nivel === 'region') {
      // Contexto regional: se muestra, pero no se usa para priorizar
      regional = true;
      const reg = A.registroRegion(est.inst, est.anio, est.ent), nac = A.nacional(est.inst, est.anio);
      lista = E.aspectos.map((a) => {
        const p = reg && reg.aspectos[a.id], obs = p ? U.r1(p.v) : null, ref = U.r1(nac.aspectos[a.id].v);
        return { id: a.id, etiqueta: a.etiqueta, obs, ref, dif: null, cv: p && p.cv, precision: A.precision(p && p.cv), estado: 'sin' };
      });
      titulo = `Aspectos de ${i.corto} en la ${E.regiones[A.regionDe(est.ent)].nombre} (dato regional), ${est.anio}`;
    }
    $('#g2-sub').textContent = regional
      ? `Sin datos estatales. Se muestra la ${E.regiones[A.regionDe(est.ent)].nombre} solo como contexto; no se calcula brecha ni prioridad.`
      : `${e.nombre}, ${i.corto}, ${est.anio}. Porcentaje de personas usuarias que reportan cada característica. La línea negra es la referencia nacional de la misma institución.`;
    $('#g2-leyenda').innerHTML = ['debajo', 'arriba', 'sin'].map((k) => `<li>${U.icono(k)}${U.TEXTO_ESTADO[k]}</li>`).join('') +
      '<li><svg width="10" height="18" aria-hidden="true" focusable="false"><line x1="5" x2="5" y1="1" y2="17" stroke="#17212b" stroke-width="3"/></svg>Referencia nacional</li>';
    G.barrasAspectos($('#g2'), lista, { titulo, prioridadId: pri.tipo === 'brecha' ? pri.aspecto.id : null });
    let h;
    if (pri.tipo === 'brecha') {
      const a = pri.aspecto;
      const debajo = pri.comparables.filter((x) => x.estado === 'debajo').length;
      h = `<p>Mayor brecha desfavorable comparable: <strong>${U.esc(a.etiqueta)}</strong>. ${U.esc(i.corto)}, ${est.anio}: ${U.pct(a.obs)} en ${U.esc(e.nombre)} contra ${U.pct(a.ref)} nacional (${U.pp(a.dif)}).</p><p>${debajo} de ${pri.comparables.length} aspectos comparables están por debajo de la referencia.${pri.excluidos.length ? ` Excluidos por precisión baja o falta de dato: ${pri.excluidos.map((x) => U.esc(x.etiqueta)).join(', ')}.` : ''}</p>`;
    } else if (pri.tipo === 'sin_brecha') {
      h = `<p>Ningún aspecto comparable de ${U.esc(e.nombre)} está por debajo de la referencia nacional de ${U.esc(i.corto)} en ${est.anio}. El nivel más bajo es ${U.esc(pri.menor.etiqueta)} (${U.pct(pri.menor.obs)}).</p>`;
    } else {
      h = `<p><strong>Sin datos comparables.</strong> ${regional ? `INEGI publica ${U.esc(i.corto)} solo por región, por lo que no se puede priorizar un aspecto para ${U.esc(e.nombre)}.` : 'No hay aspectos con precisión suficiente para comparar.'} Vea en Estrategia qué información debe conseguirse primero.</p>`;
    }
    $('#g2-hallazgo').innerHTML = '<h4>Hallazgo</h4>' + h + selloEncig();
    $('#g2-fuente').innerHTML = `Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}; coeficientes de variación de INEGI. Sentido verificado con el cuestionario: mayor porcentaje es mejor en los 11 aspectos.`;
  }

  // ---------- Gráficas 3 y 4 ----------
  function sinMundial(id) { $(id).innerHTML = `<div class="sin-datos">Sin datos disponibles. ${U.esc(D.mundial.motivo || '')}</div>`; }
  function paisesFiltro() { return A.paises(est.conjunto).filter((p) => !est.region || p.region === est.region || p.iso3 === 'MEX'); }

  function pintarG3() {
    if (!A.mundialDisponible()) { ['#g3', '#g3-detalle', '#g3-hallazgo'].forEach((x) => { $(x).innerHTML = ''; }); sinMundial('#g3'); return; }
    U.$$('[data-conjunto]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.conjunto === est.conjunto)));
    const todos = A.paises(est.conjunto);
    const regiones = [...new Set(A.paises('todos').map((p) => p.region))].sort((a, b) => a.localeCompare(b, 'es'));
    $('#g3-region').innerHTML = '<option value="">Todas las regiones</option>' + regiones.map((r) => `<option${r === est.region ? ' selected' : ''}>${U.esc(r)}</option>`).join('');
    const enLista = paisesFiltro().slice().sort((a, b) => a.pais.localeCompare(b.pais, 'es'));
    if (!enLista.find((p) => p.iso3 === est.pais)) est.pais = 'MEX';
    $('#g3-pais').innerHTML = enLista.map((p) => `<option value="${p.iso3}"${p.iso3 === est.pais ? ' selected' : ''}>${U.esc(p.pais)}</option>`).join('');
    $('#g3-leyenda').innerHTML =
      '<li><svg width="16" height="16" aria-hidden="true" focusable="false"><path d="M8 0 L10.3 5.3 L16 5.5 L11.6 9.2 L13 15 L8 11.8 L3 15 L4.4 9.2 L0 5.5 L5.7 5.3Z" fill="#b23b1e"/></svg>México</li>' +
      '<li><svg width="14" height="14" aria-hidden="true" focusable="false"><path d="M7 1l6 6-6 6-6-6z" fill="#2e7d4f"/></svg>Cobertura igual o mayor que México con menor gasto</li>' +
      '<li><svg width="12" height="12" aria-hidden="true" focusable="false"><circle cx="6" cy="6" r="5" fill="#6f8796"/></svg>Otros países</li>';
    const mex = A.mexico();
    const fav = todos.filter(A.favorable);
    G.dispersion($('#g3'), todos, {
      mex, sel: est.pais, region: est.region, favorable: A.favorable,
      descripcion: `México tiene cobertura de ${U.n0(mex.uhc)} y gasto de ${U.dolares(mex.gasto)} por habitante. ${fav.length} países del conjunto mostrado tienen cobertura igual o mayor con menor gasto.`,
      onSelect: (iso) => elegirPais(iso)
    });
    const p = A.paises('todos').find((x) => x.iso3 === est.pais) || mex;
    $('#g3-detalle').innerHTML = `<strong>${U.esc(p.pais)}</strong>${A.favorable(p) ? ' <span class="chip">Cobertura igual o mayor que México con menor gasto</span>' : ''}<dl>` +
      `<dt>Región</dt><dd>${U.esc(p.region)}</dd><dt>Cobertura de servicios esenciales</dt><dd>${U.n0(p.uhc)} de 100</dd>` +
      `<dt>Gasto en salud por persona</dt><dd>${U.dolares(p.gasto)} PPA</dd><dt>Gasto de bolsillo</dt><dd>${U.n1(p.bolsillo)}% del gasto corriente en salud</dd><dt>Año</dt><dd>${p.anio}</dd></dl>`;
    const enRegion = est.region ? fav.filter((x) => x.region === est.region) : fav;
    $('#g3-hallazgo').innerHTML = `<h4>Hallazgo</h4><p>México: cobertura ${U.n0(mex.uhc)} de 100 con ${U.dolares(mex.gasto)} por habitante (2023). ${enRegion.length} ${enRegion.length === 1 ? 'país' : 'países'}${est.region ? ' de ' + U.esc(est.region) : ''} del conjunto mostrado ${enRegion.length === 1 ? 'tiene' : 'tienen'} cobertura igual o mayor con menor gasto: <strong>desempeño favorable en estos indicadores</strong>${enRegion.length ? ' (' + enRegion.slice(0, 8).map((x) => U.esc(x.pais)).join(', ') + (enRegion.length > 8 ? ', entre otros' : '') + ')' : ''}.</p><p>La gráfica por sí sola no demuestra eficiencia total ni causalidad.</p>${U.sello('bm_uhc', 'BANCO MUNDIAL · OMS', 'INDICADORES 2023', 'UHC', 'y gasto')}`;
    $('#g3-fuente').innerHTML = `Fuente: archivo de clase «Sistemas_de_salud_2023_Oracle.csv», con indicadores del Banco Mundial: ${U.fuente('bm_uhc', 'cobertura')}, ${U.fuente('bm_gasto', 'gasto por habitante')}, ${U.fuente('bm_bolsillo', 'gasto de bolsillo')}. Año 2023.`;
  }

  function paisesG4() {
    const mex = A.mexico();
    let l;
    if (est.g4grupo === 'clase') l = A.paises('clase');
    else if (est.g4grupo === 'region') l = A.paises('todos').filter((p) => p.region === mex.region);
    else if (est.g4grupo === 'favorables') l = A.favorables('todos').concat([mex]);
    else l = paisesFiltro();
    if (!l.find((p) => p.iso3 === 'MEX')) l = l.concat([mex]);
    l = l.filter((p) => p.bolsillo !== null);
    if (est.g4orden === 'alfa') l.sort((a, b) => a.pais.localeCompare(b.pais, 'es'));
    else l.sort((a, b) => (est.g4orden === 'asc' ? 1 : -1) * (a.bolsillo - b.bolsillo));
    return l;
  }
  function pintarG4() {
    if (!A.mundialDisponible()) { $('#g4-hallazgo').innerHTML = ''; sinMundial('#g4'); return; }
    const l = paisesG4(), mex = A.mexico();
    G.barrasBolsillo($('#g4'), l, { mex, sel: est.pais, titulo: `Gasto de bolsillo como porcentaje del gasto corriente en salud, 2023, ${l.length} países` });
    const desc = l.slice().sort((a, b) => b.bolsillo - a.bolsillo);
    const lugar = desc.findIndex((p) => p.iso3 === 'MEX') + 1;
    const menores = l.filter((p) => p.bolsillo < mex.bolsillo).length;
    $('#g4-hallazgo').innerHTML = `<h4>Hallazgo</h4><p>En México, ${U.n1(mex.bolsillo)}% del gasto corriente en salud es gasto de bolsillo (2023). Ocupa el lugar ${lugar} de ${l.length} de mayor a menor en este grupo; ${menores} ${menores === 1 ? 'país tiene' : 'países tienen'} una proporción menor.</p>${U.sello('bm_bolsillo', 'BANCO MUNDIAL · OMS', 'GASTO DE BOLSILLO', '2023')}`;
    $('#g4-fuente').innerHTML = `Fuente: ${U.fuente('bm_bolsillo', 'Banco Mundial, SH.XPD.OOPC.CH.ZS')} (vía archivo de clase). Unidad: porcentaje del gasto corriente total en salud. Año 2023.`;
  }

  // ---------- Tablas ----------
  function tabla(cont, conf) {
    const orden = conf.orden;
    const col = conf.columnas.find((c) => c.id === orden.col) || conf.columnas[0];
    const filas = conf.filas.slice().sort((a, b) => {
      const va = col.orden ? col.orden(a) : col.valor(a), vb = col.orden ? col.orden(b) : col.valor(b);
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      return (typeof va === 'string' ? va.localeCompare(vb, 'es') : va - vb) * orden.dir;
    });
    const th = conf.columnas.map((c) => {
      const activo = c.id === orden.col;
      const aria = activo ? (orden.dir === 1 ? 'ascending' : 'descending') : 'none';
      if (c.sinOrden) return `<th scope="col" class="${c.num ? 'num' : ''}">${c.titulo}</th>`;
      return `<th scope="col" class="${c.num ? 'num' : ''}" aria-sort="${aria}"><button type="button" data-col="${c.id}">${c.titulo}<span aria-hidden="true">${activo ? (orden.dir === 1 ? ' ▲' : ' ▼') : ''}</span></button></th>`;
    }).join('');
    const tb = filas.map((f) => `<tr class="${conf.claseFila ? conf.claseFila(f) : ''}">${conf.columnas.map((c, j) => {
      const html = c.html ? c.html(f) : U.esc(c.valor(f) ?? '');
      return j === 0 ? `<th scope="row" class="${c.num ? 'num' : ''}">${html}</th>` : `<td class="${c.num ? 'num' : ''}">${html}</td>`;
    }).join('')}</tr>`).join('');
    // Contenedor desplazable: enfocable con teclado y con nombre accesible
    cont.setAttribute('tabindex', '0');
    cont.setAttribute('role', 'region');
    const NOMBRES = { 'tabla-est': 'Tabla estatal', 'tabla-int': 'Tabla internacional', 'tabla-aspectos': 'Tabla de aspectos del servicio', 'tabla-instituciones': 'Tabla de instituciones en el estado', 'tabla-favorables': 'Tabla de países con desempeño favorable' };
    cont.setAttribute('aria-label', NOMBRES[cont.id] || 'Tabla de datos');
    cont.innerHTML = `<table><caption>${conf.caption}</caption><thead><tr>${th}</tr></thead><tbody>${tb || `<tr><td colspan="${conf.columnas.length}">Sin resultados para la búsqueda.</td></tr>`}</tbody></table>`;
    U.$$('th button', cont).forEach((b) => b.addEventListener('click', () => {
      if (orden.col === b.dataset.col) orden.dir *= -1; else { orden.col = b.dataset.col; orden.dir = 1; }
      conf.repintar();
      const nb = cont.querySelector(`th button[data-col="${b.dataset.col}"]`); if (nb) nb.focus();
    }));
    return filas.length;
  }

  function pintarTablaEst() {
    const i = inst();
    const q = U.sinAcentos($('#buscar-est').value.trim());
    const regional = i.nivel === 'region';
    let filas = E.entidades.map((e) => {
      const s = A.satisfaccion(est.inst, est.anio, e.clave);
      const c = i.comparable2023 && est.anio === 2025 ? A.cambio(est.inst, e.clave) : null;
      const reg = regional ? A.registroRegion(est.inst, est.anio, e.clave) : null;
      return Object.assign({ clave: e.clave, nombre: e.nombre, cambio: c && c.estable ? c.dif : null, cambioTxt: c ? (c.dif === null ? 'Sin datos' : U.pp(c.dif) + (c.estable ? '' : ' (precisión baja)')) : 'No comparable', regional: reg }, s);
    });
    if (q) filas = filas.filter((f) => U.sinAcentos(f.nombre).includes(q));
    const n = tabla($('#tabla-est'), {
      orden: est.ordenEst, filas, repintar: pintarTablaEst,
      claseFila: (f) => (f.clave === est.ent ? 'fila--sel' : ''),
      caption: `${U.esc(i.nombre)}. Año ${est.anio}. Unidad: porcentaje de personas usuarias satisfechas o muy satisfechas; diferencias en puntos porcentuales (pp). Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}.${regional ? ' INEGI publica este servicio solo por región.' : ''}`,
      columnas: [
        { id: 'nombre', titulo: 'Estado', valor: (f) => f.nombre, html: (f) => `<a href="#mexico" data-ent="${f.clave}">${U.esc(f.nombre)}</a>` },
        { id: 'obs', titulo: 'Satisfacción', num: true, valor: (f) => f.obs, html: (f) => (regional ? `Sin datos disponibles<br><small>Región: ${U.pct(f.regional ? U.r1(f.regional.satisfaccion.v) : null)}</small>` : U.pct(f.obs)) },
        { id: 'ref', titulo: 'Nacional', num: true, valor: (f) => f.ref, html: (f) => U.pct(f.ref) },
        { id: 'dif', titulo: 'Brecha', num: true, valor: (f) => f.dif, html: (f) => U.pp(f.dif) },
        { id: 'estado', titulo: 'Resultado', valor: (f) => U.TEXTO_ESTADO[f.estado], html: (f) => U.estadoHTML(f.estado) },
        { id: 'cambio', titulo: 'Cambio 2023-2025', num: true, valor: (f) => f.cambio, html: (f) => U.esc(f.cambioTxt) },
        { id: 'cv', titulo: 'Precisión (CV)', num: true, valor: (f) => f.cv, html: (f) => (f.cv === null ? 'Sin dato' : `${f.precision} (${U.n1(f.cv)}%)`) },
        { id: 'anio', titulo: 'Año', sinOrden: true, valor: () => est.anio },
        { id: 'fuente', titulo: 'Fuente', sinOrden: true, valor: () => '', html: () => U.fuente(fuenteEncig(est.anio), `INEGI, cuadro ${i.cuadro}`) }
      ]
    });
    $('#contador-est').textContent = `${n} de 32 estados`;
  }

  function marcarFilaInt() { pintarTablaInt(); }
  function pintarTablaInt() {
    if (!A.mundialDisponible()) { $('#tabla-int').innerHTML = `<div class="sin-datos">Sin datos disponibles. ${U.esc(D.mundial.motivo)}</div>`; $('#contador-int').textContent = ''; return; }
    const q = U.sinAcentos($('#buscar-int').value.trim());
    const conj = $('#filtro-int').value;
    let filas = A.paises(conj);
    if (q) filas = filas.filter((p) => U.sinAcentos(p.pais + ' ' + p.region + ' ' + p.iso3).includes(q));
    const n = tabla($('#tabla-int'), {
      orden: est.ordenInt, filas, repintar: pintarTablaInt,
      claseFila: (p) => (p.iso3 === 'MEX' ? 'fila--mex ' : '') + (p.iso3 === est.pais && p.iso3 !== 'MEX' ? 'fila--sel' : ''),
      caption: `Año 2023. Cobertura: índice de 0 a 100. Gasto por habitante: dólares internacionales PPA. Gasto de bolsillo: % del gasto corriente total en salud. Fuente: archivo de clase con indicadores del Banco Mundial (${U.fuente('bm_uhc', 'SH_UHC_SCI')}, ${U.fuente('bm_gasto', 'SH.XPD.CHEX.PP.CD')}, ${U.fuente('bm_bolsillo', 'SH.XPD.OOPC.CH.ZS')}).`,
      columnas: [
        { id: 'pais', titulo: 'País', valor: (p) => p.pais, html: (p) => U.esc(p.pais) + (p.iso3 === 'MEX' ? ' <span class="chip">México</span>' : '') },
        { id: 'region', titulo: 'Región', valor: (p) => p.region },
        { id: 'uhc', titulo: 'Cobertura (0 a 100)', num: true, valor: (p) => p.uhc, html: (p) => U.n0(p.uhc) },
        { id: 'gasto', titulo: 'Gasto por habitante (US$ PPA)', num: true, valor: (p) => p.gasto, html: (p) => U.n0(p.gasto) },
        { id: 'bolsillo', titulo: 'Gasto de bolsillo (%)', num: true, valor: (p) => p.bolsillo, html: (p) => U.n1(p.bolsillo) },
        { id: 'fav', titulo: 'Más cobertura y menos gasto que México', valor: (p) => (A.favorable(p) ? 'Sí' : p.iso3 === 'MEX' ? '' : 'No') },
        { id: 'anio', titulo: 'Año', sinOrden: true, valor: (p) => p.anio },
        { id: 'f', titulo: 'Fuente', sinOrden: true, valor: () => '', html: () => U.fuente('bm_uhc', 'Banco Mundial') }
      ]
    });
    $('#contador-int').textContent = `${n} países`;
  }

  // ---------- México por estado ----------
  function cifra(et, v, n) { return `<div class="cifra"><div class="cifra__et">${et}</div><div class="cifra__v">${v}</div>${n ? `<p class="cifra__n">${n}</p>` : ''}</div>`; }

  function pintarMexico() {
    const i = inst(), e = ent();
    const s = A.satisfaccion(est.inst, est.anio, est.ent);
    const reg = A.registro(est.inst, est.anio, est.ent);
    $('#mexico-intro').innerHTML = `<strong>${U.esc(e.nombre)}</strong> con <strong>${U.esc(i.nombre)}</strong>, ${est.anio}. Conformidad: porcentaje de personas usuarias que respondieron «satisfecho(a)» o «muy satisfecho(a)». Es satisfacción reportada, no un indicador de cobertura, financiamiento ni calidad clínica.`;
    $('#mexico-cifras').innerHTML =
      cifra('Satisfacción en el estado', U.pct(s.obs), reg ? `Personas usuarias estimadas: ${U.n0(reg.poblacion)}` : 'Sin datos estatales') +
      cifra('Referencia nacional', U.pct(s.ref), `${U.esc(i.corto)}, ${est.anio}`) +
      cifra('Brecha descriptiva', U.pp(s.dif), s.cv !== null ? `Precisión ${s.precision} (CV ${U.n1(s.cv)}%)` : '') +
      cifra('Resultado', U.estadoHTML(s.estado), s.motivo ? U.esc(s.motivo) : '');
    let alc = `<p><strong>Alcance.</strong> ${U.esc(E.alcance)} Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}.</p>`;
    if (est.inst === 'estatal') alc += `<p>${U.esc(e.nombre)} ${e.adherida_imss_bienestar ? 'está adherida a IMSS-Bienestar: sus centros de salud y hospitales del gobierno del estado forman parte de ese sistema según INEGI.' : 'no está adherida a IMSS-Bienestar.'}</p>`;
    $('#mexico-alcance').innerHTML = alc;

    const lista = A.aspectos(est.inst, est.anio, est.ent);
    const pri = A.prioridad(lista);
    tabla($('#tabla-aspectos'), {
      orden: { col: 'dif', dir: 1 }, filas: lista, repintar: () => {},
      claseFila: (a) => (pri.tipo === 'brecha' && a.id === pri.aspecto.id ? 'fila--sel' : ''),
      caption: `${U.esc(e.nombre)}, ${U.esc(i.corto)}, ${est.anio}. Porcentaje de personas usuarias que reportan cada característica; mayor es mejor. Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}.`,
      columnas: [
        { id: 'etiqueta', titulo: 'Aspecto', sinOrden: true, valor: (a) => a.etiqueta, html: (a) => `${U.esc(a.etiqueta)}${pri.tipo === 'brecha' && a.id === pri.aspecto.id ? ' <span class="chip chip--aviso">Prioridad</span>' : ''}<br><small>INEGI: ${U.esc(a.etiqueta_inegi)}</small>` },
        { id: 'obs', titulo: 'Estado', num: true, sinOrden: true, valor: (a) => a.obs, html: (a) => U.pct(a.obs) },
        { id: 'ref', titulo: 'Nacional', num: true, sinOrden: true, valor: (a) => a.ref, html: (a) => U.pct(a.ref) },
        { id: 'dif', titulo: 'Brecha', num: true, sinOrden: true, valor: (a) => a.dif, html: (a) => U.pp(a.dif) },
        { id: 'cv', titulo: 'Precisión', sinOrden: true, valor: (a) => a.cv, html: (a) => (a.cv === null ? 'Sin dato' : `${a.precision} (CV ${U.n1(a.cv)}%)`) },
        { id: 'estado', titulo: 'Resultado', sinOrden: true, valor: (a) => a.estado, html: (a) => U.estadoHTML(a.estado) + (a.motivo ? `<br><small>${U.esc(a.motivo)}</small>` : '') }
      ]
    });

    // Todas las instituciones del estado, 2025
    const filasInst = E.instituciones.map((x) => {
      const r = A.satisfaccion(x.id, 2025, est.ent);
      const rg = x.nivel === 'region' ? A.registroRegion(x.id, 2025, est.ent) : null;
      return Object.assign({ inst: x, rg }, r);
    });
    tabla($('#tabla-instituciones'), {
      orden: { col: 'n', dir: 1 }, filas: filasInst, repintar: () => {},
      claseFila: (f) => (f.inst.id === est.inst ? 'fila--sel' : ''),
      caption: `${U.esc(e.nombre)}, 2025. Satisfacción general por institución contra la referencia nacional de cada institución. Fuente: ${U.fuente('encig_2025', 'INEGI, ENCIG 2025, cuadros 2.3 a 2.6')}.`,
      columnas: [
        { id: 'n', titulo: 'Institución', sinOrden: true, valor: (f) => E.instituciones.indexOf(f.inst), html: (f) => U.esc(f.inst.corto) },
        { id: 'obs', titulo: 'Estado', num: true, sinOrden: true, valor: (f) => f.obs, html: (f) => (f.inst.nivel === 'region' ? `Sin datos disponibles<br><small>${U.esc(E.regiones[A.regionDe(est.ent)].nombre)}: ${U.pct(f.rg ? U.r1(f.rg.satisfaccion.v) : null)}</small>` : U.pct(f.obs)) },
        { id: 'ref', titulo: 'Nacional', num: true, sinOrden: true, valor: (f) => f.ref, html: (f) => U.pct(f.ref) },
        { id: 'dif', titulo: 'Brecha', num: true, sinOrden: true, valor: (f) => f.dif, html: (f) => U.pp(f.dif) },
        { id: 'e', titulo: 'Resultado', sinOrden: true, valor: (f) => f.estado, html: (f) => U.estadoHTML(f.estado) }
      ]
    });

    // Cambio 2023-2025
    const cambios = ['imss', 'issste'].map((id) => Object.assign({ id, inst: A.inst(id) }, A.cambio(id, est.ent)));
    let c = `<div class="tabla-cont" tabindex="0" role="region" aria-label="Tabla de cambio 2023-2025"><table><caption>${U.esc(e.nombre)}. Satisfacción con IMSS e ISSSTE en 2023 y 2025. Fuente: ${U.fuente('encig_2023', 'ENCIG 2023')} y ${U.fuente('encig_2025', 'ENCIG 2025')}, cuadros 2.3 y 2.4.</caption><thead><tr><th scope="col">Institución</th><th scope="col" class="num">2023</th><th scope="col" class="num">2025</th><th scope="col" class="num">Cambio</th></tr></thead><tbody>`;
    cambios.forEach((x) => {
      c += `<tr><th scope="row">${U.esc(x.inst.corto)} en ${U.esc(e.nombre)}</th><td class="num">${U.pct(x.v23)}</td><td class="num">${U.pct(x.v25)}</td><td class="num">${U.pp(x.dif)}${x.estable ? '' : '<br><small>Precisión baja en algún año</small>'}</td></tr>`;
      c += `<tr><th scope="row">${U.esc(x.inst.corto)} nacional</th><td class="num">${U.pct(x.nac23)}</td><td class="num">${U.pct(x.nac25)}</td><td class="num">${U.pp(x.difNac)}<br><small>${x.sig.significativo ? 'Cambio estadísticamente significativo según INEGI' : 'Sin cambio significativo según INEGI'}</small></td></tr>`;
    });
    c += '</tbody></table></div>';
    c += `<p class="fuente-nota">Comparación permitida: ${U.esc(A.inst('imss').nota2023)} El cambio estatal es descriptivo: INEGI publica la prueba de significancia solo para el dato nacional (${U.fuente('encig_2025_resultados', 'Principales resultados ENCIG 2025')}). Servicios estatales e IMSS-Bienestar no se comparan con 2023: ${U.esc(A.inst('estatal').nota2023)}</p>`;
    $('#cambio-2023').innerHTML = c;

    pintarContexto();
    pintarCasoImss();
  }

  function pintarCasoImss() {
    const I = D.imss, aq = I.actividad_quirurgica, m40 = I.modalidad_40;
    const s = A.satisfaccion('imss', 2025, est.ent);
    const asp = A.aspectos('imss', 2025, est.ent);
    const sat = asp.find((a) => a.id === 'sin_saturacion'), med = asp.find((a) => a.id === 'medicamentos');
    let h = '<div class="dos-col">';
    h += `<article class="tarjeta"><span class="chip">${U.esc(aq.tipo)}</span><h3 style="margin-top:.5rem">Actividad quirúrgica y plan «12 acciones en 120 días»</h3><p class="grafica__sub">Periodo: ${U.esc(aq.periodo)}.</p><ul class="lista-limpia">` +
      aq.cifras.map((x) => `<li><strong>${x.unidad === '%' ? U.n0(x.valor) + '%' : U.n0(x.valor)}</strong> ${x.unidad === '%' ? '' : U.esc(x.unidad) + ' · '}${U.esc(x.concepto)}</li>`).join('') +
      `</ul><p class="fuente-nota">${U.esc(aq.contexto)}</p>` +
      `<div class="aviso" style="margin-top:.8rem"><p><strong>Evaluación del rezago: ${U.esc(aq.evaluacion_rezago.estado)}.</strong> ${U.esc(aq.evaluacion_rezago.explicacion)}</p></div>` +
      `<p class="fuente-nota">Fuente: ${U.fuente('imss_boletin_593', 'IMSS, boletín 593/2026')}.</p></article>`;
    h += `<article class="tarjeta"><span class="chip chip--sin">${U.esc(m40.tipo)}</span><h3 style="margin-top:.5rem">${U.esc(m40.nombre_oficial)}</h3><p class="grafica__sub">Acuerdo ${U.esc(m40.acuerdo)}. ${m40.fechas.map((f) => `${U.esc(f.concepto)}: ${U.esc(f.fecha)}`).join('. ')}.</p><ul>` +
      m40.puntos.map((p) => `<li>${U.esc(p)}</li>`).join('') + `</ul><div class="aviso aviso--info"><p>${U.esc(m40.relacion_con_atencion)}</p></div>` +
      `<p class="fuente-nota">Fuente: ${U.fuente('dof_5801708', 'Diario Oficial de la Federación, 21 de octubre de 2026')}.</p></article>`;
    h += '</div>';
    h += `<div class="hallazgo"><h4>Relación con la ENCIG en ${U.esc(ent().nombre)}</h4><p>Antes del plan, en 2025, la satisfacción con el IMSS en ${U.esc(ent().nombre)} fue de ${U.pct(s.obs)} (nacional ${U.pct(s.ref)}). ${U.pct(sat.obs)} reportó clínicas y hospitales sin saturación (nacional ${U.pct(sat.ref)}) y ${U.pct(med.obs)} disponibilidad de medicamentos (nacional ${U.pct(med.ref)}). Los periodos no coinciden (ENCIG: 2025; boletín: octubre y noviembre de 2026), por lo que no se calcula un efecto del plan.</p></div>`;
    $('#caso-imss').innerHTML = h;
  }

  // ---------- Comparación mundial ----------
  function pintarMundial() {
    if (!A.mundialDisponible()) { $('#mundial-cifras').innerHTML = ''; $('#mundial-favorables-intro').textContent = ''; sinMundial('#tabla-favorables'); }
    else {
      const mex = A.mexico(), todos = A.paises('todos');
      const lugar = (k, desc) => todos.slice().sort((a, b) => (desc ? b[k] - a[k] : a[k] - b[k])).findIndex((p) => p.iso3 === 'MEX') + 1;
      $('#mundial-cifras').innerHTML =
        cifra('Cobertura en México', `${U.n0(mex.uhc)} de 100`, `Lugar ${lugar('uhc', true)} de ${todos.length} (de mayor a menor)`) +
        cifra('Gasto por habitante', U.dolares(mex.gasto), `PPA. Lugar ${lugar('gasto', true)} de ${todos.length}`) +
        cifra('Gasto de bolsillo', `${U.n1(mex.bolsillo)}%`, `Del gasto corriente en salud. Lugar ${lugar('bolsillo', true)} de ${todos.length}`) +
        cifra('Desempeño favorable', `${A.favorables('todos').length} países`, `Cobertura igual o mayor y menor gasto (${A.favorables('clase').length} entre los de clase)`);
      $('#mundial-favorables-intro').textContent = `Regla: cobertura de servicios esenciales mayor o igual a ${U.n0(mex.uhc)} (México) y gasto por habitante menor a ${U.dolares(mex.gasto)} (México), año 2023. El gasto de bolsillo se muestra aparte.`;
      const ord = { col: 'gasto', dir: 1 };
      const pintarFav = () => tabla($('#tabla-favorables'), {
        orden: ord, filas: A.favorables('todos'), repintar: pintarFav,
        caption: `Año 2023. Fuente: archivo de clase con indicadores del Banco Mundial (${U.fuente('bm_uhc', 'cobertura')}, ${U.fuente('bm_gasto', 'gasto')}, ${U.fuente('bm_bolsillo', 'bolsillo')}).`,
        columnas: [
          { id: 'pais', titulo: 'País', valor: (p) => p.pais },
          { id: 'region', titulo: 'Región', valor: (p) => p.region },
          { id: 'uhc', titulo: 'Cobertura', num: true, valor: (p) => p.uhc, html: (p) => U.n0(p.uhc) },
          { id: 'gasto', titulo: 'Gasto (US$ PPA)', num: true, valor: (p) => p.gasto, html: (p) => U.n0(p.gasto) },
          { id: 'bolsillo', titulo: 'Bolsillo (%)', num: true, valor: (p) => p.bolsillo, html: (p) => U.n1(p.bolsillo) },
          { id: 'clase', titulo: 'De clase', valor: (p) => (p.clase ? 'Sí' : 'No') }
        ]
      });
      pintarFav();
    }
    $('#practicas').innerHTML = D.practicas.practicas.map((p) => `<article class="tarjeta practica" id="practica-${p.id}">
      <span class="practica__pais">${U.esc(p.pais)}</span><h3>${U.esc(p.nombre)}</h3>
      <h4>Qué problema atiende</h4><p>${U.esc(p.problema)}</p>
      <h4>Cómo funciona</h4><ul>${p.como_funciona.map((x) => `<li>${U.esc(x)}</li>`).join('')}</ul>
      <h4>Datos de la fuente</h4><ul>${p.datos_clave.map((x) => `<li>${U.esc(x.texto)} <small>(${U.esc(x.periodo)}; ${U.fuente(x.fuente, D.fuentes.fuentes[x.fuente].institucion)})</small></li>`).join('')}</ul>
      ${p.advertencia ? `<p class="aviso">${U.esc(p.advertencia)}</p>` : ''}
      <h4>Qué haría falta para adaptarla en México</h4><ul>${p.condiciones_mexico.map((x) => `<li>${U.esc(x)}</li>`).join('')}</ul>
      <p class="fuente-nota">Fuente original: ${p.fuentes.map((f) => U.fuente(f)).join('; ')}.</p></article>`).join('');
  }

  // ---------- Estrategia ----------
  function pintarEstrategia() {
    const es = A.estrategia(est.inst, est.anio, est.ent);
    const i = es.inst, e = es.ent;
    const cab = `<div class="estrategia__cab"><div><h3 style="font-size:1.3rem">${U.esc(e.nombre)} · ${U.esc(i.corto)} · ${est.anio}</h3><p class="grafica__sub">Satisfacción ${U.pct(es.sat.obs)}; referencia nacional ${U.pct(es.sat.ref)}; brecha ${U.pp(es.sat.dif)}. ${U.estadoHTML(es.sat.estado)}</p></div><span class="chip">Regla ${U.esc(es.regla.id)}</span></div>`;
    let h = `<div class="tarjeta">${cab}</div>`;
    if (es.tipo === 'faltan_datos') {
      const r = es.regla;
      h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">1</span><div><h3>Qué problema detectó y con qué datos</h3><p><strong>${U.esc(r.problema)}</strong> ${i.nivel === 'region' ? `INEGI publica ${U.esc(i.corto)} solo por región (cuadro ${i.cuadro}). ${U.esc(e.nombre)} pertenece a la ${U.esc(E.regiones[e.region].nombre)}${es.regional ? `, con ${U.pct(U.r1(es.regional.satisfaccion.v))} de satisfacción (dato regional, no estatal)` : ''}.` : 'Todos los aspectos tienen precisión baja o no tienen dato.'}</p></div></div></div>`;
      h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">2</span><div><h3>Qué información conseguir primero</h3><p>${U.esc(r.primero)}</p><p>${U.esc(r.despues)}</p><p><strong>Área que podría participar:</strong> ${r.areas.map(U.esc).join(', ')}.</p><p class="fuente-nota">Microdatos y documentación: ${U.fuente('encig_2025', 'INEGI, ENCIG 2025')}.</p></div></div></div>`;
      h += `<div class="traza"><strong>Rastreo:</strong> regla ${U.esc(r.id)} activada porque no hay aspectos estatales comparables para ${U.esc(i.corto)} en ${U.esc(e.nombre)}. No se genera una acción sin datos que la respalden.</div>`;
      $('#estrategia-cuerpo').innerHTML = h; return;
    }
    if (es.tipo === 'sin_brecha') {
      const m = es.prioridad.menor;
      h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">1</span><div><h3>Qué detectó</h3><p>${U.esc(es.regla.problema)} El aspecto con menor nivel es ${U.esc(m.etiqueta)}: ${U.pct(m.obs)} (nacional ${U.pct(m.ref)}, ${U.pp(m.dif)}).</p><h3>Qué hacer</h3><p>${U.esc(es.regla.primero)}</p></div></div></div>`;
      h += `<div class="traza"><strong>Rastreo:</strong> regla ${U.esc(es.regla.id)}; ${es.prioridad.comparables.length} aspectos comparables, ninguno con brecha negativa.</div>`;
      $('#estrategia-cuerpo').innerHTML = h; return;
    }
    const a = es.aspecto, r = es.regla;
    h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">1</span><div><h3>Qué problema detectó y con qué datos</h3><p><strong>${U.esc(r.problema)}</strong></p>
      <dl class="datos"><dt>Aspecto priorizado</dt><dd>${U.esc(a.etiqueta)}</dd><dt>Institución y año</dt><dd>${U.esc(i.nombre)}, ${est.anio}</dd><dt>Dato observado</dt><dd>${U.pct(a.obs)} en ${U.esc(e.nombre)} (precisión ${a.precision}, CV ${U.n1(a.cv)}%)</dd><dt>Referencia</dt><dd>${U.pct(a.ref)} nacional, misma institución, indicador y año</dd><dt>Diferencia</dt><dd>${U.pp(a.dif)} (brecha descriptiva)</dd><dt>Fuente</dt><dd>${etiquetaFuenteEncig(est.anio, i.cuadro)}</dd></dl>
      ${es.prioridad.otros.length ? `<p class="fuente-nota">Otros aspectos por debajo de la referencia: ${es.prioridad.otros.map((x) => `${U.esc(x.etiqueta)} (${U.pp(x.dif)})`).join('; ')}.</p>` : ''}</div></div></div>`;
    h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">2</span><div><h3>Qué práctica sirve de referencia</h3>${r.nivel_respaldo === 'general' ? `<p class="aviso">${U.esc(r.nota_respaldo)}</p>` : ''}<ul class="lista-limpia">${es.practicas.map((p) => `<li><strong>${U.esc(p.pais)}:</strong> ${U.esc(p.nombre)}. ${p.fuentes.map((f) => U.fuente(f, 'Fuente: ' + D.fuentes.fuentes[f].institucion)).join(' · ')} · <a href="#mundial" data-ir="mundial" data-practica="${p.id}">Ver ficha</a></li>`).join('')}</ul></div></div></div>`;
    h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">3</span><div><h3>Qué hacer primero, qué sigue y quién podría participar</h3><dl class="datos"><dt>Primero</dt><dd>${U.esc(r.primero)}</dd><dt>Después</dt><dd>${U.esc(r.despues)}</dd><dt>Áreas</dt><dd>${es.areas.map(U.esc).join('; ')}</dd></dl></div></div></div>`;
    const ind = es.indicador;
    h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">4</span><div><h3>Cómo medir el avance</h3><dl class="datos"><dt>Indicador de resultado</dt><dd>${U.esc(ind.principal)}</dd><dt>Dato de partida</dt><dd>${U.pct(ind.partida)} (${U.esc(e.nombre)}, ${est.anio})</dd><dt>Referencia a alcanzar</dt><dd>${U.pct(ind.referencia)} (nacional ${est.anio}); faltan ${U.n1(Math.abs(ind.brecha))} pp</dd><dt>Indicador de gestión</dt><dd>${U.esc(ind.operativo)}</dd><dt>Dato de partida</dt><dd>${U.esc(ind.partidaOperativa)}</dd><dt>Siguiente medición</dt><dd>Próxima edición de la ENCIG (bienal)</dd></dl></div></div></div>`;
    h += `<div class="tarjeta"><div class="paso"><span class="paso__n" aria-hidden="true">5</span><div><h3>Qué revisar antes de aplicar la propuesta</h3><ul>${r.condiciones.map((x) => `<li>${U.esc(x)}</li>`).join('')}${es.practicas.flatMap((p) => p.condiciones_mexico.slice(0, 1).map((x) => `<li>${U.esc(x)} <small>(${U.esc(p.pais)})</small></li>`)).join('')}</ul></div></div></div>`;
    h += `<div class="tarjeta"><h3>Registro de acciones</h3><p class="grafica__sub">Como en la cartilla: cada acción con su indicador, su dato de partida y cuándo se vuelve a medir.</p><div class="tabla-cont" tabindex="0" role="region" aria-label="Registro de acciones"><table class="registro"><caption>${U.esc(e.nombre)}, ${U.esc(i.corto)}. Regla ${U.esc(r.id)}.</caption><thead><tr><th scope="col">Paso</th><th scope="col">Acción</th><th scope="col">Indicador</th><th scope="col">Dato de partida</th><th scope="col">Próxima medición</th></tr></thead><tbody>
      <tr><td>Primero</td><td>${U.esc(r.primero)}</td><td>${U.esc(ind.operativo)}</td><td>${U.esc(ind.partidaOperativa)}</td><td>Al terminar la medición inicial</td></tr>
      <tr><td>Después</td><td>${U.esc(r.despues)}</td><td>${U.esc(ind.principal)}</td><td>${U.pct(ind.partida)} (${est.anio}); nacional ${U.pct(ind.referencia)}</td><td>Próxima edición de la ENCIG</td></tr>
    </tbody></table></div></div>`;
    h += `<div class="traza"><strong>Rastreo:</strong> regla ${U.esc(r.id)} activada porque «${U.esc(a.etiqueta)}» tiene la mayor brecha desfavorable (${U.pp(a.dif)}) entre ${es.prioridad.comparables.length} aspectos comparables de ${U.esc(i.corto)} en ${U.esc(e.nombre)}, ${est.anio}.${es.prioridad.excluidos.length ? ` Excluidos: ${es.prioridad.excluidos.map((x) => `${U.esc(x.etiqueta)} (${x.precision === 'Baja' ? 'precisión baja' : 'sin dato'})`).join(', ')}.` : ''} <a href="#metodo" data-ir="metodo">Ver la regla</a>.</div>`;
    $('#estrategia-cuerpo').innerHTML = h;
  }

  // ---------- Cómo se calculó ----------
  function pintarMetodo() {
    const F = D.fuentes.fuentes;
    const bajos = [];
    E.instituciones.filter((x) => x.nivel === 'entidad').forEach((x) => x.anios.forEach((anio) => E.entidades.forEach((en) => {
      const r = A.registro(x.id, anio, en.clave);
      if (!r) { bajos.push(`${x.corto} ${anio}, ${en.nombre}: sin registro`); return; }
      const malos = [['satisfaccion', r.satisfaccion]].concat(Object.entries(r.aspectos)).filter(([, p]) => p.cv !== null && p.cv >= 30).map(([k]) => (k === 'satisfaccion' ? 'Satisfacción general' : A.aspecto(k).etiqueta));
      if (malos.length) bajos.push(`${x.corto} ${anio}, ${en.nombre}: ${malos.join(', ')}`);
    })));
    const reglas = Object.entries(D.reglas.reglas).map(([k, r]) => `<tr><th scope="row">${r.id}</th><td>${U.esc(A.aspecto(k).etiqueta)}</td><td>${U.esc(r.primero)}</td><td>${r.practicas.map((p) => U.esc(D.practicas.practicas.find((x) => x.id === p).pais)).join(', ')}${r.nivel_respaldo === 'general' ? ' <small>(respaldo general)</small>' : ''}</td><td>${U.esc(r.indicador_operativo)}</td></tr>`).join('');
    $('#metodo-cuerpo').innerHTML = `
      <h3>1. Qué se mide</h3>
      <p><strong>Conformidad</strong>: ${U.esc(E.definicion_conformidad)} Es satisfacción reportada por las personas usuarias. No mide cobertura, financiamiento ni calidad clínica; esos temas se tratan con los indicadores internacionales, que son otra cosa.</p>
      <p><strong>Alcance</strong>: ${U.esc(E.alcance)} Por eso el sitio dice «personas usuarias en áreas urbanas del estado» y no «todo el estado».</p>
      <h3>2. Cómo se compara cada estado</h3>
      <ol>
        <li>Se toma el valor del estado y el valor nacional de la <strong>misma institución, indicador y año</strong>.</li>
        <li>Ambos se redondean a un decimal y se restan: brecha = estado − nacional, en puntos porcentuales (pp).</li>
        <li>Clasificación: <strong>Por debajo de la referencia</strong> si la brecha es negativa; <strong>En la referencia o por encima</strong> si es cero o positiva; <strong>Sin datos comparables</strong> si falta el dato, si INEGI solo lo publica por región o si la precisión es baja.</li>
        <li>${U.esc(E.precision)}</li>
        <li>Las diferencias se llaman <strong>brechas descriptivas</strong>: ${U.esc(E.significancia_nacional.nota)}</li>
      </ol>
      <h3>3. Cómo se elige el aspecto a priorizar</h3>
      <ol>
        <li>${U.esc(E.sentido)}</li>
        <li>Se calculan las brechas de los 11 aspectos del estado y se descartan los no comparables.</li>
        <li>Se elige la <strong>mayor brecha desfavorable</strong> (la más negativa). En empate se usa el orden del cuestionario.</li>
        <li>Si ningún aspecto es negativo, se aplica la regla R-00. Si no hay ningún aspecto comparable, se aplica la regla R-99 y la estrategia explica qué información conseguir primero.</li>
      </ol>
      <h3>4. Reglas de la estrategia</h3>
      <div class="tabla-cont" tabindex="0" role="region" aria-label="Tabla de reglas, se puede desplazar"><table><caption>Cada regla une un aspecto con acciones, prácticas documentadas e indicadores. Fuente de las reglas: elaboración propia a partir de las prácticas citadas.</caption><thead><tr><th scope="col">Regla</th><th scope="col">Aspecto</th><th scope="col">Primera acción</th><th scope="col">Prácticas</th><th scope="col">Indicador de gestión</th></tr></thead><tbody>${reglas}</tbody></table></div>
      <h3 class="bloque">5. Comparación entre años</h3>
      <ul>${E.instituciones.map((x) => `<li><strong>${U.esc(x.corto)}</strong>: ${x.comparable2023 ? 'comparable 2023-2025. ' : 'no comparable. '}${U.esc(x.nota2023)}</li>`).join('')}</ul>
      <h3>6. Comparación mundial</h3>
      <p>Se usan los campos del archivo de clase (año 2023). Un país tiene <strong>desempeño favorable en estos indicadores</strong> si su cobertura de servicios esenciales es mayor o igual que la de México y su gasto en salud por habitante (PPA) es menor. El gasto de bolsillo se muestra aparte y corresponde al porcentaje del gasto corriente total en salud. La gráfica no demuestra eficiencia total ni causalidad. Los valores de México, Tailandia y Costa Rica se verificaron contra la API del Banco Mundial.</p>
      <h3>Mapas</h3>
      <p>El mapa de México colorea la brecha de satisfacción de cada estado contra la referencia nacional en seis clases (tres por debajo en rojo, tres en o por encima en azul); la trama marca «Sin datos comparables» y cada estado lleva además un ícono de resultado. El mapa del mundo usa una rampa azul de cinco clases para el indicador elegido; los países sin dato llevan trama y nunca se pintan como cero. ${U.esc(D.geo.atribucion)}</p>
      <h3>Contexto del estado</h3>
      <p>${U.esc(D.contexto.nota)} Indicadores: ${Object.values(D.contexto.indicadores).map((m) => `${U.esc(m.etiqueta)} (${U.esc(m.unidad)}, ${m.anio})`).join('; ')}. Médicos y camas son cálculos propios: suma por entidad de los establecimientos públicos de la DGIS dividida entre la población total de la ENIGH 2024, por 1 000.</p>
      <h3>7. Datos faltantes registrados</h3>
      <ul>
        <li>Lista de espera quirúrgica del IMSS: <strong>Sin datos disponibles</strong>. El boletín 593/2026 no publica pacientes pendientes ni tiempos de espera.</li>
        <li>IMSS-Bienestar por entidad: <strong>Sin datos disponibles</strong>. INEGI lo publica solo por región.</li>
        <li>Indicadores de gestión por entidad (tiempos de espera, recetas surtidas, plazas ocupadas): <strong>Sin datos disponibles</strong> en las fuentes consultadas.</li>
        <li>Estimaciones con precisión baja (CV de 30% o más), mostradas pero no usadas para clasificar: ${bajos.length ? bajos.map(U.esc).join('; ') : 'ninguna'}.</li>
        ${A.mundialDisponible() ? '' : `<li>Comparación internacional: <strong>Sin datos disponibles</strong>. ${U.esc(D.mundial.motivo)}</li>`}
      </ul>
      <h3>8. Fuentes</h3>
      <ul class="fuentes-lista">${Object.entries(F).map(([, f]) => `<li>${f.url ? `<a href="${U.esc(f.url)}" target="_blank" rel="noopener">${U.esc(f.titulo)}</a>` : U.esc(f.titulo)}. ${U.esc(f.institucion)}${f.anio ? ', ' + f.anio : ''}${f.publicacion ? ', publicado el ' + U.esc(f.publicacion) : ''}.${f.unidad ? ' Unidad: ' + U.esc(f.unidad) + '.' : ''}${f.alcance ? ' Alcance: ' + U.esc(f.alcance) : ''}</li>`).join('')}</ul>
      <p class="fuente-nota">Fecha de consulta: ${U.esc(D.fuentes.consulta)}. Datos generados el ${new Date(D.generado).toLocaleString('es-MX')}.</p>`;
  }

  // ---------- Sello y selección compartida ----------
  function selloEncig() {
    return U.sello(fuenteEncig(est.anio), `INEGI · ENCIG ${est.anio}`, 'FUENTE OFICIAL', inst().cuadro, 'cuadro');
  }
  function elegirPais(iso) {
    est.pais = iso;
    pintarG3(); pintarG4(); pintarM2(); pintarTablaInt();
  }

  // ---------- Mapa de México ----------
  function pintarM1() {
    const i = inst(), e = ent();
    const regional = i.nivel === 'region';
    const datos = {};
    E.entidades.forEach((en) => { datos[en.clave] = Object.assign({ nombre: en.nombre }, A.satisfaccion(est.inst, est.anio, en.clave)); });
    $('#m1-sub').textContent = regional
      ? `${i.corto}, ${est.anio}: INEGI lo publica solo por región, así que ningún estado tiene dato comparable. Elija IMSS, ISSSTE o servicios estatales para ver el mapa por estado.`
      : `${i.corto}, ${est.anio}. Color: brecha de satisfacción contra la referencia nacional (${U.pct(datos[est.ent].ref)}), en puntos porcentuales. Ícono: resultado. Pulse un estado o recórralos con Tab y Enter.`;
    $('#m1-leyenda').innerHTML =
      `<li><span class="rampa" aria-hidden="true">${G.CLASES_BRECHA.map((c) => `<span style="background:var(${c.var})"></span>`).join('')}</span></li>` +
      `<li class="rampa-et"><span>${G.CLASES_BRECHA.map((c) => c.et).join(' · ')} pp</span></li>` +
      ['debajo', 'arriba'].map((k) => `<li>${U.icono(k)}${U.TEXTO_ESTADO[k]}</li>`).join('') +
      '<li>' + U.icono('sin') + '<svg width="18" height="12" aria-hidden="true" focusable="false"><defs><pattern id="ley-trama" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill="var(--trama-fondo)"/><line x1="0" y1="0" x2="0" y2="5" stroke="var(--trama-linea)" stroke-width="1.6"/></pattern></defs><rect width="18" height="12" fill="url(#ley-trama)" stroke="var(--eje)"/></svg>Sin datos comparables (trama)</li>';
    G.mapaMexico($('#m1'), D.geo.mexico, {
      datos, seleccion: est.ent,
      onSelect: (clave, teclado) => {
        est.ent = clave; actualizar();
        if (teclado) { const p = $(`#m1 .estado-mapa[data-clave="${clave}"]`); if (p) p.focus(); }
      }
    });
    const s = datos[est.ent];
    const reg = A.registro(est.inst, est.anio, est.ent);
    const es = A.estrategia(est.inst, est.anio, est.ent);
    let prioridad = 'Sin datos comparables para priorizar.';
    if (es.tipo === 'brecha') prioridad = `<strong>${U.esc(es.aspecto.etiqueta)}</strong>: ${U.pct(es.aspecto.obs)} contra ${U.pct(es.aspecto.ref)} nacional (${U.pp(es.aspecto.dif)}).`;
    else if (es.tipo === 'sin_brecha') prioridad = 'Ningún aspecto comparable está por debajo de la referencia.';
    $('#m1-ficha').innerHTML = `
      <div><p class="ficha__estado">${U.esc(e.nombre)}</p><p class="ficha__inst">${U.esc(i.corto)} · ${est.anio} · personas usuarias en áreas urbanas</p></div>
      <dl class="ficha__cifras">
        <div><dt>Satisfacción</dt><dd>${U.pct(s.obs)}</dd></div>
        <div><dt>Nacional</dt><dd>${U.pct(s.ref)}</dd></div>
        <div><dt>Brecha</dt><dd>${U.pp(s.dif)}</dd></div>
        <div><dt>Precisión</dt><dd>${s.cv === null ? 'Sin dato' : s.precision}</dd></div>
      </dl>
      <p>${U.estadoHTML(s.estado)}${s.motivo ? `<br><small>${U.esc(s.motivo)}</small>` : ''}</p>
      <div class="hallazgo"><h4>Aspecto con mayor rezago</h4><p>${prioridad}</p>${selloEncig()}</div>
      <p><a href="#estrategia" data-ir="estrategia">Ver la estrategia para ${U.esc(e.nombre)}</a>${reg ? '' : ''}</p>`;
    $('#m1-fuente').innerHTML = `Fuente: ${etiquetaFuenteEncig(est.anio, i.cuadro)}. Tabla equivalente: <a href="#t-tabla-est">tabla estatal</a>. ${U.esc(D.geo.atribucion)}`;
  }

  // ---------- Mapa del mundo ----------
  const IND_MAPA = {
    uhc: { cortes: [50, 60, 70, 80], fmt: (v) => U.n0(v), et: (c) => ['menos de 50', '50 a 59', '60 a 69', '70 a 79', '80 o más'][c], unidad: 'índice 0 a 100' },
    gasto: { cortes: [100, 300, 1000, 3000], fmt: (v) => U.dolares(v), et: (c) => ['menos de 100', '100 a 299', '300 a 999', '1 000 a 2 999', '3 000 o más'][c], unidad: 'US$ PPA por habitante' },
    bolsillo: { cortes: [10, 20, 30, 40], fmt: (v) => U.n1(v) + '%', et: (c) => ['menos de 10%', '10 a 19%', '20 a 29%', '30 a 39%', '40% o más'][c], unidad: '% del gasto corriente en salud' }
  };
  est.indMapa = 'uhc';
  function pintarM2() {
    if (!A.mundialDisponible()) { sinMundial('#m2'); return; }
    const ind = IND_MAPA[est.indMapa], meta = D.mundial.indicadores[est.indMapa];
    const porIso = Object.fromEntries(A.paises('todos').map((p) => [p.iso3, p]));
    const clase = (iso) => { const p = porIso[iso]; const v = p && p[est.indMapa]; if (v === null || v === undefined) return null; let c = 0; while (c < ind.cortes.length && v >= ind.cortes[c]) c++; return c; };
    const mex = A.mexico();
    $('#m2-leyenda').innerHTML =
      `<li><span class="rampa" aria-hidden="true">${[0, 1, 2, 3, 4].map((c) => `<span style="background:var(--s-${c + 1})"></span>`).join('')}</span></li>` +
      `<li class="rampa-et"><span>${[0, 1, 2, 3, 4].map(ind.et).join(' · ')}</span></li>` +
      '<li><svg width="18" height="12" aria-hidden="true" focusable="false"><rect x="1" y="1" width="16" height="10" fill="none" stroke="var(--tinta)" stroke-width="2"/></svg>México (contorno grueso)</li>' +
      '<li><svg width="18" height="12" aria-hidden="true" focusable="false"><rect width="18" height="12" fill="url(#ley-trama)" stroke="var(--eje)"/></svg>Sin datos (no es cero)</li>';
    G.mapaMundo($('#m2'), D.geo.mundo, {
      titulo: `Mapa del mundo: ${meta.etiqueta.toLowerCase()}, 2023. México: ${ind.fmt(mex[est.indMapa])}.`,
      clase, sel: est.pais,
      onSelect: (iso) => { if (porIso[iso]) { if (est.conjunto === 'clase' && !porIso[iso].clase) est.conjunto = 'todos'; elegirPais(iso); } },
      onTip: (iso, ev) => {
        const tip = $('#m2-tip');
        const geoP = iso && D.geo.mundo.paises.find((x) => x.iso3 === iso);
        if (!iso || !geoP) { tip.hidden = true; return; }
        const p = porIso[iso];
        tip.innerHTML = p
          ? `<strong>${U.esc(p.pais)}</strong>${U.esc(p.region)}<dl><dt>Cobertura</dt><dd>${U.n0(p.uhc)}</dd><dt>Gasto por persona</dt><dd>${U.dolares(p.gasto)}</dd><dt>Bolsillo</dt><dd>${U.n1(p.bolsillo)}%</dd></dl>`
          : `<strong>${U.esc(geoP.nombre)}</strong>Sin datos disponibles en el archivo de clase`;
        const caja = $('#m2').closest('.grafica').getBoundingClientRect();
        let x = ev.clientX - caja.left + 14, y = ev.clientY - caja.top + 14;
        tip.hidden = false;
        if (x + tip.offsetWidth > caja.width) x = ev.clientX - caja.left - tip.offsetWidth - 14;
        tip.style.left = Math.max(4, x) + 'px'; tip.style.top = y + 'px';
      }
    });
    $('#m2-fuente').innerHTML = `Unidad: ${U.esc(ind.unidad)}. Fuente: ${U.fuente(meta.fuente, 'Banco Mundial')} (vía archivo de clase), 2023. ${U.esc(D.geo.atribucion)} Para elegir un país con el teclado use la lista «País» de la dispersión.`;
  }

  // ---------- Contexto del estado ----------
  function pintarContexto() {
    const C = D.contexto, e = ent();
    const filas = Object.entries(C.indicadores).map(([k, m]) => {
      const v = C.datos[est.ent] ? C.datos[est.ent][k] : null, n = C.datos.nac[k];
      const todos = E.entidades.map((x) => C.datos[x.clave] && C.datos[x.clave][k]).filter((x) => x !== null && x !== undefined);
      const fmt = (x) => (x === null || x === undefined ? 'Sin datos disponibles' : k === 'gasto_salud_hogar' ? '$' + U.n0(x) : /pct|carencia/.test(k) ? U.n1(x) + '%' : U.n1(x).replace(/,0$/, ''));
      const min = Math.min(...todos), max = Math.max(...todos);
      const px = (x) => 6 + ((x - min) / (max - min || 1)) * 288;
      const tira = v === null || v === undefined ? '' : `<svg viewBox="0 0 300 34" role="img" aria-label="${U.esc(`${e.nombre}: ${fmt(v)}; nacional ${fmt(n)}; mínimo ${fmt(min)} y máximo ${fmt(max)} entre los 32 estados`)}">
        <line x1="6" x2="294" y1="17" y2="17" stroke="var(--eje)" stroke-width="2"/>
        ${todos.map((x) => `<circle cx="${px(x).toFixed(1)}" cy="17" r="3" fill="var(--neutro)" opacity=".45"/>`).join('')}
        <line x1="${px(n).toFixed(1)}" x2="${px(n).toFixed(1)}" y1="6" y2="28" stroke="var(--ref)" stroke-width="2" stroke-dasharray="3 2"/>
        <circle cx="${px(v).toFixed(1)}" cy="17" r="6.5" fill="var(--acento)" stroke="var(--papel)" stroke-width="2"/></svg>`;
      return `<div class="contexto__fila"><div><h4>${U.esc(m.etiqueta)}</h4><p>${U.esc(m.unidad)}, ${m.anio}. ${U.esc(m.alcance)} Fuente: ${U.fuente(m.fuente, D.fuentes.fuentes[m.fuente].institucion)}.</p></div>
        <div class="contexto__valor">${fmt(v)}<small>Nacional: ${fmt(n)}</small></div><div class="tira">${tira}</div></div>`;
    }).join('');
    $('#contexto').innerHTML = `<div class="contexto">${filas}</div><p class="fuente-nota">Punto grande: ${U.esc(e.nombre)}. Línea punteada: nacional. Puntos claros: los 32 estados. ${U.esc(C.nota)}</p>`;
  }

  // ---------- Tema ----------
  function pintarTema() {
    const oscuro = U.tema.actual() === 'dark';
    $('#btn-tema').setAttribute('aria-pressed', String(oscuro));
    $('#btn-tema-texto').textContent = oscuro ? 'Modo claro' : 'Modo oscuro';
    $('#btn-tema').setAttribute('aria-label', oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }

  // ---------- Ciclo ----------
  function actualizar() {
    pintarSeleccion();
    pintarPreguntas();
    pintarM1();
    pintarG1(); pintarG2();
    pintarTablaEst();
    pintarMexico();
    pintarEstrategia();
    escribirHash();
  }
  function pintarTodo() {
    actualizar();
    pintarG3(); pintarG4(); pintarM2(); pintarTablaInt();
    pintarMundial(); pintarMetodo(); pintarTema();
    mostrarSeccion();
  }

  function eventos() {
    $('#form-seleccion').addEventListener('submit', (e) => e.preventDefault());
    $('#sel-inst').addEventListener('change', (e) => { est.inst = e.target.value; if (!inst().anios.includes(est.anio)) est.anio = inst().anios[0]; actualizar(); });
    $('#sel-ent').addEventListener('change', (e) => { est.ent = e.target.value; actualizar(); });
    $('#sel-anio').addEventListener('change', (e) => { est.anio = +e.target.value; actualizar(); });
    U.$$('[data-conjunto]').forEach((b) => b.addEventListener('click', () => { est.conjunto = b.dataset.conjunto; pintarG3(); pintarG4(); }));
    $('#g3-region').addEventListener('change', (e) => { est.region = e.target.value; pintarG3(); pintarG4(); });
    $('#g3-pais').addEventListener('change', (e) => elegirPais(e.target.value));
    $('#g4-grupo').addEventListener('change', (e) => { est.g4grupo = e.target.value; pintarG4(); });
    $('#g4-orden').addEventListener('change', (e) => { est.g4orden = e.target.value; pintarG4(); });
    $('#m2-ind').addEventListener('change', (e) => { est.indMapa = e.target.value; pintarM2(); });
    $('#btn-tema').addEventListener('click', () => {
      const nuevo = U.tema.actual() === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nuevo; U.tema.guardar(nuevo); pintarTema();
    });
    $('#buscar-est').addEventListener('input', U.debounce(pintarTablaEst, 120));
    $('#buscar-int').addEventListener('input', U.debounce(pintarTablaInt, 120));
    $('#filtro-int').addEventListener('change', pintarTablaInt);
    // Enlaces internos que cambian de sección o de estado
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const sec = (a.getAttribute('href') || '').slice(1).split('?')[0];
      if (a.dataset.ent) { est.ent = a.dataset.ent; }
      if (SECCIONES.includes(sec)) {
        e.preventDefault();
        est.seccion = sec;
        if (a.dataset.ent) actualizar();
        mostrarSeccion(); escribirHash();
        const destino = a.dataset.practica ? $('#practica-' + a.dataset.practica) : $('#contenido');
        if (destino) { destino.setAttribute('tabindex', '-1'); destino.focus({ preventScroll: true }); destino.scrollIntoView(); }
        if (!a.dataset.practica) window.scrollTo(0, 0);
      }
    });
    window.addEventListener('hashchange', () => { leerHash(); pintarTodo(); });
    let ultimoAncho = window.innerWidth;
    window.addEventListener('resize', U.debounce(() => {
      if (window.innerWidth === ultimoAncho) return;
      ultimoAncho = window.innerWidth;
      pintarG1(); pintarG2(); pintarG3(); pintarG4();
    }, 150));
  }

  estadoInicial();
  leerHash();
  eventos();
  pintarTodo();
  graficasListas = true;
  $('#pie-generado').textContent = `Datos procesados el ${new Date(D.generado).toLocaleDateString('es-MX')}.`;
})();
