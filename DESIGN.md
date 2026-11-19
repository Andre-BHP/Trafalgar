# Diseño: Salud en Comparación

Estado: dirección aprobada por André el 18 de noviembre de 2026 («Sí, Cartilla de Salud»). Escrito antes de construir y actualizado el 19 de noviembre de 2026 con lo construido. Los valores vigentes viven en `css/estilos.css`.

## Dirección

**Mundo:** la Cartilla Nacional de Salud. Es un registro personal que se sella en la clínica en cada revisión. El tablero toma de ella cuatro cosas: la tipografía, la paleta, la densidad y un movimiento distintivo. La navegación y los controles son los normales de la web.

**Modo:** Operate (tablero). Primero se debe entender la tarea; el mundo aparece en los detalles.

**Movimiento distintivo:**
1. **Sello de fuente.** Cada hallazgo lleva un sello circular en tinta del color del encabezado: institución, programa, año y cuadro (por ejemplo «INEGI · ENCIG 2025 · cuadro 2.3»). El sello enlaza a la fuente.
2. **Registro de acciones.** La estrategia se presenta como la tabla de registro de la cartilla, con las columnas acción, indicador, dato de partida y próxima medición.
3. **Mapas como selectores.** El mapa de México por estado y el mapa del mundo eligen el estado o el país en todo el sitio.

**Se rechaza:** serif editorial, fondo crema, borde lateral grueso de color, tarjetas idénticas como estructura, rótulos pequeños sobre los títulos, glifos Unicode como íconos.

## Tokens de color

| Rol | Claro | Oscuro |
|---|---|---|
| Encabezado (verde salud) | `#0e4a42` | `#0b2f2a` |
| Superficie secundaria | `#f6f8f7` | `#202120` |
| Fondo de página | `#f2f5f3` | `#0f1413` |
| Superficie | `#fcfcfb` | `#1a1a19` |
| Tinta principal | `#0b0b0b` | `#f0efec` |
| Tinta secundaria | `#4a524f` | `#c3c2b7` |
| Tinta tenue (ejes) | `#6b6f6c` | `#9a9a92` |
| Línea fina | `#e1e0d9` | `#2c2c2a` |
| Acento (enlaces, foco del encabezado) | `#0e6b5e` | `#4fc2ad` |
| Foco | `#f2a900` | `#f2a900` |

**Gráficas** (skill `dataviz`; validar con `validate_palette.js` en ambos modos):
- Brecha divergente: rojo `#d03b3b` (debajo) y azul `#2a78d6` (encima); en oscuro `#e66767` y `#3987e5`. Validado con `validate_palette.js` en ambos modos (todas las pruebas pasan). Mapa de México: tres tonos por brazo (`--d-1..3`, `--a-1..3`), sin clase de punto medio; los cortes son −8, −3, 0, 3 y 8 pp.
- Mapa del mundo: rampa azul de cinco pasos (`--s-1..5`); en oscuro el paso claro es el valor alto.
- Magnitud (mapa del mundo): rampa azul de un solo tono, pasos 100 a 700 de la paleta de referencia.
- Sin datos: trama a 45° sobre gris, siempre con su leyenda. Nunca se pinta como cero.
- El texto usa los colores de tinta, nunca el color de la serie. Cada estado lleva ícono y etiqueta además del color.

## Tipografía

Sans del sistema (`"Segoe UI", system-ui, sans-serif`). Los títulos se distinguen por peso (650 a 700) y tamaño, no por una fuente serif. Cifras en tablas y ejes con `tabular-nums`. Escala: 0.8, 0.9, 1, 1.15, 1.35, 1.75 rem.

## Espaciado y forma

Escala de 4 px (4, 8, 12, 16, 24, 32, 48). Radio de 6 px. Sombras suaves con desplazamiento. Las secciones se separan con más espacio arriba que abajo de cada título.

## Componentes construidos

- **Sello de fuente** (`U.sello`): círculo de 92 px con texto en arco, rotado −7°, en `--sello`; enlaza a la fuente. Aparece en cada hallazgo.
- **Ficha del estado** junto al mapa de México: cifras grandes, resultado con ícono, aspecto con mayor rezago y sello.
- **Renglones de la cartilla**: las cuatro preguntas y las cifras van en una sola banda con divisiones finas, no en tarjetas idénticas.
- **Registro de acciones** en la estrategia: tabla Paso, Acción, Indicador, Dato de partida y Próxima medición.
- **Contexto del estado**: fila por indicador con valor, nacional y una tira con los 32 estados.
- **Portada de Resumen**: título grande, cifra protagonista (conformidad nacional de la institución elegida, de 4.5 a 8.5 rem) que se cuenta sola, tres datos de apoyo e ilustración de una cartilla con renglones, marcas y sello. Fondo con renglones tenues de cartilla.
- **Tarjetas de preguntas** con ícono y color propio (verde, rojo, azul y ámbar), barra superior de 4 px; se elevan 3 px al pasar el cursor.
- **Íconos de línea** (`<symbol>` en `index.html`, trazo 1.8, extremos redondeados) para las cinco secciones y los 11 aspectos del servicio; aparecen en la navegación, la gráfica de aspectos, las tablas y la estrategia.
- **Frase destacada** al inicio de cada sección, con filete de 1 px en el acento.
- **Bandas alternas** (`.banda--alt`) de ancho completo para dar ritmo entre bloques.
- **Cadena de afirmaciones** (pensiones y servicio médico): pasos numerados unidos por línea punteada, cada uno con su cita de página.
- **Recuadro de postura**: borde punteado ámbar, rótulo «Postura del equipo (opinión, no es un dato)» y texto en cursiva; nunca se confunde con un dato.
- **Selector de tema** en el encabezado; respeta el sistema y guarda la elección solo en el navegador.

## Movimiento

Hay un solo momento coreografiado. Al cambiar de estado, institución o filtro, los colores de los mapas transicionan en 450 ms y las barras crecen desde su base en 700 ms cuando su gráfica entra en pantalla (IntersectionObserver; nada queda oculto si no se observa), ambos con salida exponencial (`cubic-bezier(.16, 1, .3, 1)`). El sello aparece con una impresión breve y las secciones entran con un desplazamiento de 6 px. Con `prefers-reduced-motion` no hay animación.

## Celular

A 390 px, una columna y la barra de selección sin fijar. El mapa de México va antes de las barras. Ninguna tabla desborda la página: las tablas se desplazan dentro de una región con foco.
