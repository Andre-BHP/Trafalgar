# Avisos de terceros

El código propio de Trafalgar es un proyecto escolar del CETI Plantel Colomos. Las partes de terceros conservan su propia licencia.

## Diseño

| Fuente | Autor | Licencia | Qué se usó |
|---|---|---|---|
| [iroFactory](https://github.com/RemiH06/iroFactory) | RemLam ([@RemiH06](https://github.com/RemiH06)) | MIT | Técnicas de los temas **elixir** (grafo de pulsos animado de la portada en `js/fondo.js`, adaptado de `shared/components/elixir/pipeline-graph.js`; tintas de texto separadas de los rellenos), **metro** (par sans + mono para lo técnico), **lambda** (pizarrón con retícula hexagonal y fórmulas de trazo doble en «Cómo se calculó»), **mirai** (marcas de corte y curvas de movimiento con nombre) y **disco** (luces ambientales). Qué se tomó de cada uno y por qué: `DESIGN.md`. |

Aviso de la licencia MIT de iroFactory:

> Copyright (c) 2026 RemLam (@RemiH06)
>
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions: The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

No se usó ningún componente de React Bits ni otro material de terceros incluido en iroFactory.

## Código

| Fuente | Licencia | Dónde |
|---|---|---|
| [GSAP](https://gsap.com) 3.13.0 (`js/vendor/gsap.min.js`), GreenSock / Webflow | [Licencia estándar de GSAP](https://gsap.com/standard-license) (uso gratuito) | Animación del QR en el pie (`js/qr.js`). |
| [python-qrcode](https://github.com/lincolnloop/python-qrcode) | BSD | Matriz del QR (`scripts/qr.py`), solo al generar. |
| [jsQR](https://github.com/cozmo/jsQR) | Apache 2.0 | Pruebas de escaneo (`pruebas/probar.mjs`), no se publica en el sitio. |
| [zxing-cpp](https://github.com/zxing-cpp/zxing-cpp) (ZXing para Python) | Apache 2.0 | Pruebas de escaneo (`pruebas/zxing_leer.py`), no se publica en el sitio. |
| [axe-core](https://github.com/dequelabs/axe-core), [Playwright](https://playwright.dev) | MPL 2.0, Apache 2.0 | Pruebas. |
| [d3-geo](https://github.com/d3/d3-geo), [mapshaper](https://github.com/mbloch/mapshaper) | ISC, MPL 2.0 | Proyección de mapas al procesar los datos. |

## Ideas de la baraja

El QR ilustrado sigue las cartas dis-094 (QR convertido en ramo de flores, idea de bubbbly.com/bloom) y dis-081 (árbol que se vuelve QR, idea de ICQR). No se usó código ni imágenes de esas herramientas: el dibujo y la animación son propios.
