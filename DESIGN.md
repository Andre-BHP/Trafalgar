# Diseño: Trafalgar

Estado: dirección aprobada por André el 18 de noviembre de 2026 («Sí, Cartilla de Salud»). Escrito antes de construir y actualizado el 19 de noviembre de 2026 con lo construido y con las técnicas tomadas de iroFactory. Los valores vigentes viven en `css/estilos.css`.

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

## Técnicas tomadas de iroFactory

Fuente: [iroFactory](https://github.com/RemiH06/iroFactory), colección de temas de RemLam (@RemiH06), licencia MIT. Se estudiaron elixir, metro, lambda y mirai. No se copió ningún tema completo ni se cambió de mundo: «Cartilla» sigue siendo la dirección y cada técnica entra como detalle. El crédito va en `THIRD_PARTY_NOTICES.md` y en el pie del sitio. Todo funciona sin conexión (sin fuentes web ni CDN) y abre con doble clic.

| Tema | Qué se tomó | Dónde | Por qué |
|---|---|---|---|
| **elixir** (datos, frío y analítico) | Grafo neuronal animado: nodos por capas, pulsos que viajan por las aristas y cada nodo se queda con el color del último pulso que lo alcanzó. Bucle que se detiene fuera de pantalla, con la pestaña oculta y con `prefers-reduced-motion` (dibuja un cuadro fijo). | Fondo de la portada de Resumen, detrás de la cartilla; máscara que lo desvanece hacia el texto. | Es un tablero de datos: el pulso se lee como respuestas de encuesta que llegan de los estados al cálculo. Va enmascarado y a baja opacidad para que nunca compita con la cifra (principio 1). |
| **elixir** | Tintas de texto separadas de los rellenos (`--x` para pintar, `--x-tinta` para escribir), mismo matiz y solo cambia la luminosidad para pasar AA. | Tokens `--ambar` / `--ambar-tinta` y uso en preguntas y postura. | Quita el color fijo `#c98500` y garantiza 4.5:1 cuando el color va como texto. |
| **metro** (técnico) | Par tipográfico sans + mono: la mono (`Cascadia Mono`, `Consolas`) para lo técnico: encabezados de tabla, chips, fechas de la línea de tiempo, pasos del camino y la regla citada en el rastreo. El semáforo siempre lleva palabra o ícono, nunca solo color. | Tablas, `.chip`, `.tiempo time`, `.camino__t`, `.traza`. | Distingue el dato técnico (cuadro, regla, fecha) de la prosa sin una fuente web; las dos familias ya vienen en Windows. |
| **lambda** (pizarrón) | Pizarrón con retícula hexagonal tenue; de día pintarrón blanco, de noche pizarra verde con gis. Fórmulas con trazo doble (dos pasadas desplazadas) y figuras sueltas (ejes, curva, flecha) como ornamento. Par serif itálica para fórmulas + mono para valores. | Encabezado de «Cómo se calculó»: las tres fórmulas reales del sitio (brecha, error estándar, intervalo al 90%) y el umbral de CV. | Es la sección donde se explica la cuenta; el pizarrón la vuelve clase, que es el contexto de la exposición. La serif solo vive en las fórmulas, no en títulos. |
| **mirai** (tintas y retícula editorial) | Marcas de corte en las esquinas de los recuadros, como un pliego de imprenta; curvas de movimiento con nombre (`--mov`, `--mov-ida`, `--resorte`). | Portada, pizarrón y tarjeta del QR. Curvas en el sello y el QR. | Las marcas de corte dan estructura de impreso sin bordes gruesos ni tarjetas idénticas; las curvas con nombre evitan valores sueltos. |
| **disco** (luces ambientales) | Manchas radiales de la paleta que derivan muy lento; `multiply` de día y `screen` de noche. | Portada, solo CSS. | Da profundidad al fondo sin imágenes y sin costo de JavaScript. |

**Lo que no se tomó:** las fuentes web de los temas (Iosevka, Space Mono, Cormorant, Michroma) porque el sitio debe abrir sin conexión; las líneas de barrido (scanlines) de elixir, que bajan el contraste; el borde lateral grueso de los avisos de metro, rechazado desde el inicio; y los componentes de React Bits, que tienen su propia licencia.

**Comprobación:** el contraste AA se mide con axe en claro y oscuro en cada sección; con `prefers-reduced-motion` no hay grafo en movimiento, luces que deriven ni árbol que crezca; los lienzos se pausan fuera de pantalla.

## QR «Comparte Trafalgar»

Dos versiones del mismo QR hacia `https://andre-bhp.github.io/Trafalgar/` (versión 5, corrección H, zona de silencio de 4 módulos):

- **Ilustrada (carta dis-094)** en `qr/`: cada módulo oscuro es una hoja; algunos son flores. Un árbol de ramas finas en tono claro nace de un tronco bajo la zona de silencio y termina en cada módulo. Los tres ojos son anillos redondeados con un centro cuadrado de 3 módulos y una flor encima; el patrón de alineación es un anillo con su punto. El centro es cuadrado porque los lectores también miden los ojos en diagonal: con un centro solo de pétalos, jsQR leía 4 de 18 tamaños; con el cuadrado, 35 de 36. Hojas en verdes muy oscuros y flores en carmín oscuro sobre papel claro: el lector solo ve oscuro contra claro. SVG y PNG para imprimir.
- **Animada (carta dis-081)** en el pie del sitio: el tronco crece, las ramas se abren por profundidad, las hojas brotan sueltas en la copa y después se pliegan a su lugar de la retícula hasta quedar como el QR escaneable; las ramas se aclaran. GSAP local (sin CDN), 1.8 s, una sola vez al entrar en pantalla y con botón para repetir. Con `prefers-reduced-motion` aparece directo el estado final. La tarjeta del QR es siempre clara, también en modo oscuro, porque muchos lectores no leen QR invertidos.

## La solución

Bloque al inicio de Resumen y de Estrategia de mejora. Orden de lectura: título, una frase con cuántas soluciones se proponen, recuadro ámbar de la solución prioritaria (rótulo en mono, con la regla R-12), tarjetas numeradas (círculo con el número en la tinta del sello, chip de la regla y conteo de estados), nota con lo que no se activa y matriz solución por estado (cuadros llenos en el acento, columna del estado elegido en el color de foco, barra de conteo). En Resumen los pasos de cada tarjeta van plegados; en Estrategia, abiertos. La numeración es fija por regla para que «Solución 7» signifique lo mismo en todo el sitio.

## Movimiento

Hay un solo momento coreografiado. Al cambiar de estado, institución o filtro, los colores de los mapas transicionan en 450 ms y las barras crecen desde su base en 700 ms cuando su gráfica entra en pantalla (IntersectionObserver; nada queda oculto si no se observa), ambos con salida exponencial (`cubic-bezier(.16, 1, .3, 1)`). El sello aparece con una impresión breve y las secciones entran con un desplazamiento de 6 px. Con `prefers-reduced-motion` no hay animación.

## Celular

A 390 px, una columna y la barra de selección sin fijar. El mapa de México va antes de las barras. Ninguna tabla desborda la página: las tablas se desplazan dentro de una región con foco.
