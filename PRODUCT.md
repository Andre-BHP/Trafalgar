# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Sitio estático (HTML, CSS y JavaScript sin framework), datos ya procesados en `datos/datos.js` y JSON, publicable en GitHub Pages. Las gráficas y los mapas se dibujan en SVG propio; las geometrías se proyectan en el script de datos. Elegido por la sesión LAW dentro de la indicación de André: «lo más simple posible: un sitio estático con los datos en JSON».

## Users

- Docente y grupo de Programación Web 2 / proyecto escolar del CETI Colomos, durante la exposición con proyector.
- Las mismas personas después, por su cuenta, en computadora o celular.
- Cualquier persona sin formación en sistemas, análisis de datos o salud pública que quiera saber cómo le va a su estado.

Trabajo que hacen: responder cuatro preguntas (dónde hay menor satisfacción, qué aspecto se rezaga en su estado, qué hacen otros países, qué acciones se sugieren y cómo medirlas).

## Product Purpose

Producto final de un proyecto escolar sobre el desempeño del sistema de salud en México. Une la satisfacción reportada (ENCIG, INEGI) con la comparación internacional (Banco Mundial/OMS) y prácticas documentadas (Tailandia, Costa Rica) para generar estrategias rastreables por estado e institución. Éxito: cualquier visitante entiende el hallazgo de su estado y de dónde sale cada cifra.

## Positioning

Cada afirmación es rastreable: dato observado, referencia nacional, brecha en puntos porcentuales, regla aplicada y fuente con URL. Las estrategias se generan con reglas verificables, no con texto libre.

## Operating Context

Se demuestra en clase en vivo (proyector, cambio de estado e institución frente al grupo) y se revisa después. Debe abrir cargado, sin importar archivos y sin conexión a servicios externos.

## Capabilities and Constraints

- Eje: conformidad ENCIG (satisfecho o muy satisfecho). Otros datos estatales solo como «Contexto del estado», separados del cálculo de la brecha.
- Diferencias = brechas descriptivas; INEGI no publica prueba estado contra nacional.
- Precisión: CV de 30% o más no se usa para clasificar.
- Interfaz en español, sin emojis. Cifras sin inventar: lo faltante se muestra como «Sin datos disponibles».

## Evidence on Hand

Tabulados ENCIG 2023/2025 en `datos/fuentes/encig/`, CSV de clase `datos/Sistemas_de_salud_2023_Oracle.csv`, fuentes curadas en `datos/curados/`. No hay testimonios ni logotipos institucionales que usar.

## Product Principles

1. Primero el dato y su fuente; el adorno nunca compite con la cifra.
2. Lenguaje sencillo para quien no es especialista.
3. Lo que falta se dice, no se rellena.
4. Lo mismo debe entenderse proyectado en clase y en un celular.

## Accessibility & Inclusion

WCAG 2.1 AA verificado con axe; estados distinguibles por texto o ícono además del color; mapas navegables con teclado y con tabla equivalente.
