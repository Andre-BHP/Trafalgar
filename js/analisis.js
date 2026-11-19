/* Reglas de cálculo. Todo lo que el sitio afirma sobre brechas y estrategias sale de estas funciones. */
(function () {
  'use strict';
  const D = window.DATOS;
  const E = D.encig;
  const U = window.U;
  const A = {};

  A.CV_MAX = 30; // CV >= 30% = precisión baja (criterio de INEGI)
  A.inst = (id) => E.instituciones.find((i) => i.id === id);
  A.entidad = (clave) => E.entidades.find((e) => e.clave === clave);
  A.aspecto = (id) => E.aspectos.find((a) => a.id === id);
  A.precision = (cv) => (cv === null || cv === undefined ? 'Sin dato' : cv < 15 ? 'Alta' : cv < 30 ? 'Moderada' : 'Baja');

  // Un par {v, cv} es comparable si existe y su precisión no es baja
  A.comparable = (par) => !!par && par.v !== null && par.v !== undefined && par.cv !== null && par.cv !== undefined && par.cv < A.CV_MAX;

  // Comparación de un valor estatal contra el nacional de la misma institución, indicador y año.
  // Ambos se redondean a 1 decimal antes de restar para que la resta mostrada sea reproducible.
  function comparar(parEst, parNac, motivoSin) {
    const obs = parEst ? U.r1(parEst.v) : null;
    const ref = parNac ? U.r1(parNac.v) : null;
    const base = { obs, ref, cv: parEst ? parEst.cv : null, precision: A.precision(parEst ? parEst.cv : null) };
    if (motivoSin) return Object.assign(base, { dif: null, estado: 'sin', motivo: motivoSin });
    if (obs === null) return Object.assign(base, { dif: null, estado: 'sin', motivo: 'Sin datos disponibles en el tabulado de INEGI.' });
    if (ref === null) return Object.assign(base, { dif: null, estado: 'sin', motivo: 'Sin referencia nacional disponible.' });
    if (!A.comparable(parEst)) return Object.assign(base, { dif: null, estado: 'sin', motivo: `Precisión baja (CV de ${U.n1(parEst.cv)}%): INEGI recomienda uso cauteloso; no se usa para clasificar.` });
    const dif = U.r1(obs - ref);
    return Object.assign(base, { dif, estado: dif < 0 ? 'debajo' : 'arriba', motivo: null });
  }

  A.registro = (instId, anio, clave) => {
    const d = E.datos[instId] && E.datos[instId][anio];
    if (!d) return null;
    return d.entidades ? d.entidades[clave] || null : null;
  };
  A.nacional = (instId, anio) => {
    const d = E.datos[instId] && E.datos[instId][anio];
    return d ? d.nacional : null;
  };
  A.regionDe = (clave) => A.entidad(clave).region;
  A.registroRegion = (instId, anio, clave) => {
    const d = E.datos[instId] && E.datos[instId][anio];
    return d && d.regiones ? d.regiones[A.regionDe(clave)] : null;
  };

  function motivoNivel(inst) {
    return inst.nivel === 'region' ? 'INEGI publica este servicio solo por región, no por entidad federativa.' : null;
  }

  // Satisfacción general (conformidad) de un estado
  A.satisfaccion = (instId, anio, clave) => {
    const inst = A.inst(instId);
    const reg = A.registro(instId, anio, clave);
    const nac = A.nacional(instId, anio);
    return comparar(reg && reg.satisfaccion, nac && nac.satisfaccion, motivoNivel(inst));
  };

  // Todos los estados de una institución y año, con su clasificación
  A.ranking = (instId, anio) => E.entidades.map((e) => Object.assign({ clave: e.clave, nombre: e.nombre }, A.satisfaccion(instId, anio, e.clave)));

  // Aspectos del servicio de un estado contra la referencia nacional
  A.aspectos = (instId, anio, clave) => {
    const inst = A.inst(instId);
    const reg = A.registro(instId, anio, clave);
    const nac = A.nacional(instId, anio);
    return E.aspectos.map((a) => Object.assign({ id: a.id, etiqueta: a.etiqueta, etiqueta_inegi: a.etiqueta_inegi },
      comparar(reg && reg.aspectos[a.id], nac && nac.aspectos[a.id], motivoNivel(inst))));
  };

  // Regla de prioridad: mayor brecha desfavorable entre los aspectos comparables (sentido verificado: mayor es mejor).
  // Empates: se elige el primero en el orden del cuestionario de INEGI.
  A.prioridad = (lista) => {
    const comparables = lista.filter((x) => x.estado !== 'sin');
    const excluidos = lista.filter((x) => x.estado === 'sin');
    if (!comparables.length) return { tipo: 'faltan_datos', comparables, excluidos };
    const desfavorables = comparables.filter((x) => x.dif < 0).sort((a, b) => a.dif - b.dif);
    if (!desfavorables.length) {
      const menor = comparables.slice().sort((a, b) => a.obs - b.obs)[0];
      return { tipo: 'sin_brecha', comparables, excluidos, menor };
    }
    return { tipo: 'brecha', aspecto: desfavorables[0], otros: desfavorables.slice(1), comparables, excluidos };
  };

  // Cambio 2023-2025 (solo instituciones comparables según INEGI)
  A.cambio = (instId, clave) => {
    const inst = A.inst(instId);
    if (!inst.comparable2023) return { comparable: false, nota: inst.nota2023 };
    const a = A.registro(instId, 2023, clave), b = A.registro(instId, 2025, clave);
    const n23 = A.nacional(instId, 2023), n25 = A.nacional(instId, 2025);
    const res = { comparable: true, nota: inst.nota2023, nac23: U.r1(n23.satisfaccion.v), nac25: U.r1(n25.satisfaccion.v), sig: E.significancia_nacional[instId] };
    res.difNac = U.r1(res.nac25 - res.nac23);
    if (clave) {
      res.v23 = a ? U.r1(a.satisfaccion.v) : null; res.v25 = b ? U.r1(b.satisfaccion.v) : null;
      res.cv23 = a ? a.satisfaccion.cv : null; res.cv25 = b ? b.satisfaccion.cv : null;
      res.estable = A.comparable(a && a.satisfaccion) && A.comparable(b && b.satisfaccion);
      res.dif = res.v23 !== null && res.v25 !== null ? U.r1(res.v25 - res.v23) : null;
    }
    return res;
  };

  // Genera la estrategia rastreable para un estado e institución
  A.estrategia = (instId, anio, clave) => {
    const inst = A.inst(instId), ent = A.entidad(clave);
    const lista = A.aspectos(instId, anio, clave);
    const pri = A.prioridad(lista);
    const sat = A.satisfaccion(instId, anio, clave);
    const R = D.reglas;
    const base = { inst, ent, anio, sat, prioridad: pri, lista };
    if (pri.tipo === 'faltan_datos') {
      const regional = inst.nivel === 'region' ? A.registroRegion(instId, anio, clave) : null;
      return Object.assign(base, { tipo: 'faltan_datos', regla: R.faltan_datos, regional });
    }
    if (pri.tipo === 'sin_brecha') return Object.assign(base, { tipo: 'sin_brecha', regla: R.sin_prioridad });
    const asp = pri.aspecto;
    const regla = R.reglas[asp.id];
    const practicas = regla.practicas.map((id) => D.practicas.practicas.find((p) => p.id === id)).filter(Boolean);
    const areas = regla.areas.slice();
    if (instId === 'imss') areas.unshift('Dirección de Prestaciones Médicas del IMSS (área citada en el acuerdo del DOF del 21 de octubre de 2026)');
    let partidaOperativa = 'Sin datos disponibles por entidad. Debe levantarse una medición inicial antes de empezar.';
    if (asp.id === 'medicamentos' && instId === 'imss') partidaOperativa = 'Sin dato por entidad. Referencia institucional nacional: 94% de surtimiento completo de recetas (IMSS, boletín 593/2026, 18 de noviembre de 2026).';
    return Object.assign(base, {
      tipo: 'brecha', regla, practicas, areas, aspecto: asp,
      indicador: {
        principal: `Porcentaje de personas usuarias que reportan «${asp.etiqueta.toLowerCase()}» (ENCIG, INEGI)`,
        partida: asp.obs, referencia: asp.ref, brecha: asp.dif,
        operativo: regla.indicador_operativo, partidaOperativa
      }
    });
  };

  // ---------- Soluciones ----------
  // Cada regla R-01 a R-11 es una solución con número fijo (Solución N = regla R-0N) y
  // nombre corto en reglas.json. Una solución «aplica» a un estado cuando su regla es la
  // que activa la estrategia de ese estado (mayor brecha desfavorable comparable).
  A.solucion = (regla) => (regla && regla.solucion ? regla.solucion : null);
  A.etiquetaSolucion = (regla) => { const s = A.solucion(regla); return s ? `Solución ${s.n}: ${s.nombre}` : ''; };
  A.soluciones = (instId, anio) => {
    const R = D.reglas;
    const porEstado = E.entidades.map((e) => A.estrategia(instId, anio, e.clave));
    const lista = Object.entries(R.reglas).map(([aspId, regla]) => {
      const estados = porEstado.filter((x) => x.tipo === 'brecha' && x.regla.id === regla.id)
        .map((x) => ({ clave: x.ent.clave, nombre: x.ent.nombre, obs: x.aspecto.obs, ref: x.aspecto.ref, dif: x.aspecto.dif, cv: x.aspecto.cv }))
        .sort((a, b) => a.dif - b.dif);
      const media = estados.length ? U.r1(estados.reduce((s, x) => s + x.dif, 0) / estados.length) : null;
      return {
        n: regla.solucion.n, nombre: regla.solucion.nombre, regla, aspecto: A.aspecto(aspId), estados, media,
        mayor: estados[0] || null,
        practicas: regla.practicas.map((id) => D.practicas.practicas.find((p) => p.id === id)).filter(Boolean)
      };
    }).sort((a, b) => a.n - b.n);
    const activas = lista.filter((s) => s.estados.length);
    // Regla R-12: más estados; empate, brecha promedio más negativa; luego número menor
    const prioritaria = activas.slice().sort((a, b) => b.estados.length - a.estados.length || a.media - b.media || a.n - b.n)[0] || null;
    const mayorBrecha = activas.slice().sort((a, b) => a.mayor.dif - b.mayor.dif || a.n - b.n)[0] || null;
    return {
      instId, anio, lista, activas, prioritaria, mayorBrecha, reglaPrioridad: R.prioridad_solucion,
      sinBrecha: porEstado.filter((x) => x.tipo === 'sin_brecha').map((x) => x.ent),
      faltan: porEstado.filter((x) => x.tipo === 'faltan_datos').map((x) => x.ent),
      porEstado
    };
  };

  // ---------- Comparación mundial ----------
  const M = D.mundial;
  A.mundialDisponible = () => !!(M && M.disponible);
  A.paises = (conjunto) => (A.mundialDisponible() ? M.paises.filter((p) => conjunto === 'todos' || p.clase) : []);
  A.mexico = () => (A.mundialDisponible() ? M.paises.find((p) => p.iso3 === 'MEX') : null);
  // Desempeño favorable en estos indicadores: cobertura >= México y gasto por habitante < México
  A.favorable = (p) => { const m = A.mexico(); return !!m && p.iso3 !== 'MEX' && p.uhc !== null && p.gasto !== null && p.uhc >= m.uhc && p.gasto < m.gasto; };
  A.favorables = (conjunto) => A.paises(conjunto).filter(A.favorable);

  window.A = A;
})();
