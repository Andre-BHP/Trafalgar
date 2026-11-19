# Trafalgar

Satisfacción con los servicios públicos de salud en México y prácticas internacionales.

Tablero web estático, en español, para responder cuatro preguntas sobre el sistema de salud en México:

1. ¿En qué estados hay menor satisfacción con un servicio público de salud?
2. ¿Qué aspecto del servicio tiene mayor rezago en el estado elegido?
3. ¿Qué hacen otros países frente a problemas similares?
4. ¿Qué acciones concretas sugiere la aplicación y cómo se mediría su avance?

Secciones: **Resumen** (mapa de México por estado, mapa del mundo, 4 gráficas y 2 tablas), **México por estado** (incluye el caso IMSS 2026), **Comparación mundial**, **Estrategia de mejora** y **Cómo se calculó**.

Sitio publicado: https://andre-bhp.github.io/Trafalgar/ · Repositorio: https://github.com/Andre-BHP/Trafalgar

## Cómo abrirlo

No necesita instalar nada para verlo:

- Abra `index.html` con doble clic. Los datos ya están procesados en `datos/datos.js`.
- O sírvalo en local: `npm run servir` y abra http://localhost:8080.

Para publicarlo en GitHub Pages basta con subir la carpeta y activar Pages sobre la rama principal (raíz). No hay paso de compilación.

## Cómo actualizar los datos

Sector privado: descargar a `datos/fuentes/privados/` el zip de datos abiertos de la ESEP 2023 (INEGI) y el catálogo CLUES (DGIS), correr `node scripts/privados.mjs` y después `npm run datos`.

Requiere Node.js 18 o superior.

```powershell
npm install
npm run datos
```

`scripts/procesar.mjs` lee:

| Entrada | Qué es |
|---|---|
| `datos/fuentes/encig/II_evaluacion_servicios_bajo_demanda_encig2025_est.xlsx` y `_cv.xlsx` | Tabulados básicos ENCIG 2025 de INEGI (cuadros 2.3 a 2.6) y sus coeficientes de variación |
| `datos/fuentes/encig/II_evaluacion_servicios_bajo_demanda_encig2023_est.xlsx` y `_cv.xlsx` | Lo mismo para 2023 |
| `datos/Sistemas_de_salud_2023_Oracle.csv` | Archivo de clase: 191 países, año 2023 |
| `datos/fuentes/contexto/` | Contexto estatal: pobreza multidimensional 2024 (INEGI/CONEVAL), ENIGH 2024 por entidad (INEGI) y Recursos en Salud Sectorial 2024 (DGIS) |
| `datos/fuentes/geo/` | Geometrías de Natural Earth (dominio público): países 1:50m y estados de México 1:10m |
| `datos/curados/*.json` | Fuentes, prácticas internacionales, caso IMSS y reglas de la estrategia (editados a mano, cada dato con su fuente) |

y genera `datos/datos.js` (lo carga la página) y `datos/procesados/*.json`.

Para una nueva edición de la ENCIG: descargue los archivos `_est.xlsx` y `_cv.xlsx` de la sección «Tabulados» del programa en INEGI, cópielos en `datos/fuentes/encig/`, agregue el año en `INSTITUCIONES` dentro de `scripts/procesar.mjs` y ejecute `npm run datos`. Si INEGI cambia un encabezado, el script se detiene y dice cuál.

## Pruebas

```powershell
npm run probar
```

Usa Microsoft Edge (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`) con Playwright a 1440 px y 390 px, ejecuta axe-core (WCAG 2.1 A/AA) en cada sección y prueba los casos sin datos. Resultados en `pruebas/resultados.md` y capturas en `pruebas/capturas/`.

## Reglas principales

- **Conformidad**: porcentaje de personas usuarias que respondieron «satisfecho(a)» o «muy satisfecho(a)» (ENCIG).
- **Brecha descriptiva** = valor estatal − valor nacional de la misma institución, indicador y año, en puntos porcentuales; ambos redondeados a un decimal.
- Estados: «Por debajo de la referencia», «En la referencia o por encima», «Sin datos comparables» (sin dato, solo publicado por región o precisión baja: CV de 30% o más).
- Prioridad: mayor brecha desfavorable entre los aspectos comparables (los 11 aspectos tienen sentido «mayor es mejor», verificado con el cuestionario).
- Comparación mundial: «desempeño favorable en estos indicadores» = cobertura mayor o igual que México y menor gasto por habitante.

Detalle completo en la vista «Cómo se calculó».

## Diseño

Dirección visual «Cartilla Nacional de Salud», documentada en `DESIGN.md` (tokens de color, tipografía, espaciado, modo claro y oscuro, movimiento). Producto y público en `PRODUCT.md`. Paletas de gráficas validadas con la skill `dataviz` en ambos modos. Usa técnicas de los temas elixir, metro, lambda y mirai de [iroFactory](https://github.com/RemiH06/iroFactory) (RemLam, MIT); créditos en `THIRD_PARTY_NOTICES.md`.

## QR para compartir

`qr/trafalgar-qr-ilustrado.svg` y `.png` (para imprimir) llevan a https://andre-bhp.github.io/Trafalgar/. En el pie del sitio el mismo QR crece como árbol y se pliega. Para regenerarlos: `python scripts/qr.py` (requiere `pip install "qrcode[pil]"`) y `node scripts/qr-png.mjs`. `npm run probar` los decodifica con jsQR (Node) y ZXing (`pip install zxing-cpp`) a 3 y 5 cm simulados.

## Estructura

```
index.html            Página
css/estilos.css       Estilos propios (sin librerías)
js/util.js            Formato y utilidades
js/analisis.js        Reglas de cálculo y estrategia
js/graficas.js        Gráficas SVG
js/app.js             Interfaz
datos/                Fuentes, datos curados y procesados
scripts/procesar.mjs  Procesamiento de datos
pruebas/probar.mjs    Pruebas con Edge y axe
pruebas/qr-escaneo.mjs  Pruebas de escaneo del QR
qr/                   QR ilustrado (SVG, PNG y matriz)
scripts/qr.py         Genera el QR y js/qr-datos.js
```

## Pensiones y servicio médico

Dentro de «México por estado», la sección «Pensiones y servicio médico: relación indirecta» usa el *Informe al Ejecutivo Federal y al Congreso de la Unión sobre la Situación Financiera y los Riesgos del IMSS 2025-2026* (páginas 45, 51, 128, 133, 190, 232 y 239), la ENCIG 2025 y el Anuario Estadístico 2024 de la CONAMED. Cada afirmación enlaza a su página. La postura del equipo va en un recuadro aparte, rotulado como opinión. Los PDF del informe no se suben al repositorio (pesan 47 MB); se descargan de las direcciones citadas en `datos/curados/fuentes.json`.

## Datos faltantes registrados

- Lista de espera quirúrgica del IMSS: el boletín 593/2026 no publica pacientes pendientes ni tiempos de espera.
- IMSS-Bienestar: INEGI lo publica solo por región, no por entidad.
- Servicios estatales: no comparables con 2023 (cambió la institución preguntada).
- Indicadores de gestión por entidad (tiempos de espera, recetas surtidas, plazas ocupadas): no disponibles en las fuentes consultadas.
- CONAMED: no publica quejas por «relación médico-paciente» en 2024 ni desglose por motivo en 2025.
- Médicos y camas: solo sector público (la base sectorial de la DGIS no incluye el privado).
