# Progreso de Trafalgar

Última actualización: 19 de noviembre de 2026.

## Hecho

- **Sitio estático** (`index.html`) publicado en GitHub Pages desde el repositorio `Andre-BHP/Trafalgar`. Abre también con doble clic.
- **Datos oficiales** procesados con `npm run datos`: ENCIG 2023 y 2025 (INEGI), archivo de clase con indicadores del Banco Mundial y la OMS, pobreza multidimensional 2024, ENIGH 2024, recursos DGIS 2024, Informe financiero del IMSS 2025-2026, CONAMED 2024 y 2025, boletín IMSS 593/2026, DOF del 21 de octubre de 2026 y las fichas de prácticas (OMS, CCSS, PHCPI).
- **Diseño «Cartilla»** (`DESIGN.md`, `PRODUCT.md`): modo claro y oscuro, portada con cifra protagonista, íconos de línea, sello de fuente, bandas alternas y movimiento que respeta `prefers-reduced-motion`.
- **Visualizaciones**: mapa de México por estado, mapa del mundo (en Resumen y en Comparación mundial), barras por estado y por aspecto, dispersión, gasto de bolsillo, mapa de calor estado por aspecto, intervalos de precisión, mancuernas 2023-2025, puntos por institución, cuadrícula de 100 pesos, paletas de cobertura, pequeños múltiplos por región, flujo de reglas a prácticas, camino de cada estrategia y línea de tiempo del caso IMSS. Cada una trae su hallazgo, su fuente, su unidad y su tabla equivalente.
- **Sección «Pensiones y servicio médico: relación indirecta»** con páginas citadas del informe del IMSS, el trato reportado en la ENCIG, el contexto de la CONAMED y el recuadro de postura rotulado como opinión.
- **Pruebas** (`npm run probar`): Edge a 1440 y 390 px, axe en claro y oscuro, servidor local y `file://`. Resultado en `pruebas/resultados.md`.

## Pendiente o sin datos

- Lista de espera quirúrgica del IMSS: no publicada.
- IMSS-Bienestar por estado: INEGI solo lo publica por región.
- CONAMED: no hay quejas por «relación médico-paciente» en 2024 ni desglose por motivo en 2025.
- Médicos y camas: solo del sector público.
- El análisis del efecto financiero de la Modalidad 40 que ordenó el DOF vence en abril de 2027.
- No se probó en Chrome (no está instalado en esta PC); sí en Edge y en el navegador del panel de la app.

## Cómo seguir

1. `npm install`, después `npm run datos` y `npm run probar`.
2. Los textos de prácticas, reglas, caso IMSS y pensiones están en `datos/curados/*.json`; cada dato lleva su fuente en `datos/curados/fuentes.json`.
3. Los PDF del informe del IMSS no se suben al repositorio (47 MB); se descargan de las direcciones de `fuentes.json`.
