# QR ilustrado de Trafalgar (cartas dis-094 y dis-081 de la baraja).
# Genera la matriz con qrcode (corrección H) y la dibuja como un árbol: cada
# módulo oscuro es una hoja o una flor y las ramas, en tono claro, terminan en
# los módulos. Los tres ojos y el patrón de alineación se dibujan aparte.
# Uso: python scripts/qr.py   (después: node scripts/qr-png.mjs para el PNG)
# Salidas: qr/trafalgar-qr-ilustrado.svg, qr/trafalgar-qr.json y js/qr-datos.js
import json
import math
import os
import random

import qrcode
from qrcode import util

URL = 'https://andre-bhp.github.io/Trafalgar/'
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q = 4  # zona de silencio, en módulos

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_H, border=0)
qr.add_data(URL)
qr.make(fit=True)
M = qr.modules
N = len(M)
VERSION = qr.version
W = N + 2 * Q                 # ancho del lienzo
H = W + 9                     # alto: el tronco y el texto van debajo de la zona de silencio
BASE_CODIGO = Q + N           # borde inferior del código
rnd = random.Random(20261119)

# Zonas que se dibujan aparte: ojos (7x7) y alineación (5x5)
ojos = [(0, 0), (N - 7, 0), (0, N - 7)]  # (columna, fila) de la esquina
def en_ojo(c, f):
    return any(oc <= c < oc + 7 and of <= f < of + 7 for oc, of in ojos)
pos = util.pattern_position(VERSION)
alineaciones = [(c, f) for f in pos for c in pos if not (en_ojo(c - 2, f - 2) or en_ojo(c + 2, f + 2) or en_ojo(c + 2, f - 2) or en_ojo(c - 2, f + 2))]
def en_alin(c, f):
    return any(ac - 2 <= c <= ac + 2 and af - 2 <= f <= af + 2 for ac, af in alineaciones)

puntos = []
for f in range(N):
    for c in range(N):
        if M[f][c] and not en_ojo(c, f) and not en_alin(c, f):
            puntos.append((c + Q + .5, f + Q + .5))

# Árbol: ramas que se abren por ángulo desde el tronco hasta cada módulo
r2 = lambda v: round(v, 2)
ramas = []      # [x1, y1, cx, cy, x2, y2, grosor, profundidad]
hoja_prof = {}  # punto -> (profundidad, x y y del nodo padre)
RAIZ_XY = (W / 2, BASE_CODIGO)

def rama(a, b, prof, grosor):
    mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
    dx, dy = b[0] - a[0], b[1] - a[1]
    largo = math.hypot(dx, dy) or 1
    curva = rnd.uniform(-.18, .18) * largo
    cx, cy = mx - dy / largo * curva, my + dx / largo * curva
    ramas.append([r2(a[0]), r2(a[1]), r2(cx), r2(cy), r2(b[0]), r2(b[1]), r2(grosor), prof])

def crecer(pts, origen, prof):
    grosor = max(.09, .95 * .74 ** prof)
    if len(pts) <= 3 or prof >= 11:
        for p in pts:
            rama(origen, p, prof + 1, max(.08, grosor * .6))
            hoja_prof[p] = (prof + 1, origen)
        return
    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    f = rnd.uniform(.42, .58) if prof else .5
    nodo = (origen[0] + (cx - origen[0]) * f, origen[1] + (cy - origen[1]) * f)
    rama(origen, nodo, prof, grosor)
    orden = sorted(pts, key=lambda p: math.atan2(p[1] - nodo[1], p[0] - nodo[0]))
    k = 3 if prof == 0 else 2
    tam = math.ceil(len(orden) / k)
    for i in range(k):
        grupo = orden[i * tam:(i + 1) * tam]
        if grupo:
            crecer(grupo, nodo, prof + 1)

crecer(puntos, RAIZ_XY, 0)

# Hojas y flores
VERDES = ['#0b3d36', '#0e4a42', '#12523f', '#173f2c']
CARMIN, CARMIN_2 = '#7a1d33', '#5e1426'
hojas = []  # [x, y, orientación (0 «/», 1 «\»), tipo (0 hoja, 1 flor), color, profundidad, x y y del padre]
for p in puntos:
    prof, padre = hoja_prof[p]
    dx, dy = p[0] - padre[0], p[1] - padre[1]
    orient = 0 if dx * dy < 0 else 1  # la hoja apunta lejos de su rama
    tipo = 1 if rnd.random() < .07 else 0
    hojas.append([r2(p[0]), r2(p[1]), orient, tipo, rnd.randrange(len(VERDES)), prof, r2(padre[0]), r2(padre[1])])

# Logo oficial al centro: placa clara de 9 x 9 módulos con el logo de 7 x 7. Las hojas que quedan
# debajo no se dibujan; la corrección H (hasta 30%) recupera esos módulos.
import re as _re
LOGO_SVG = open(os.path.join(RAIZ, 'img', 'logo-trafalgar.svg'), encoding='utf-8').read()
LOGO_VB = [float(v) for v in _re.search(r'viewBox="([^"]+)"', LOGO_SVG).group(1).split()]
LOGO_PATHS = [{'fill': f, 'd': d} for f, d in _re.findall(r'fill="(#[0-9a-f]{6})" d="([^"]+)"', LOGO_SVG)]
PLACA, LOGO_LADO = 9, 7
LC = Q + N / 2
PX0 = LC - PLACA / 2
hojas = [h for h in hojas if not (PX0 < h[0] < PX0 + PLACA and PX0 < h[1] < PX0 + PLACA)]

def logo_svg():
    k = LOGO_LADO / LOGO_VB[2]
    x = LC - LOGO_LADO / 2
    return (f'<rect x="{PX0}" y="{PX0}" width="{PLACA}" height="{PLACA}" rx="1.6" fill="#fcfcfb" stroke="#d3e4da" stroke-width=".15"/>'
            f'<g transform="translate({x} {x}) scale({k:.6f}) translate({-LOGO_VB[0]} {-LOGO_VB[1]})">' + ''.join(f'<path fill="{p["fill"]}" d="{p["d"]}"/>' for p in LOGO_PATHS) + '</g>')

def hoja_d(x, y, o, h=.6):
    if o == 0:
        a, b, c1, c2 = (x - h, y + h), (x + h, y - h), (x - h, y - h), (x + h, y + h)
    else:
        a, b, c1, c2 = (x - h, y - h), (x + h, y + h), (x + h, y - h), (x - h, y + h)
    f = lambda t: f'{r2(t[0])} {r2(t[1])}'
    return f'M{f(a)}Q{f(c1)} {f(b)}Q{f(c2)} {f(a)}Z'

def flor_svg(x, y):
    petalos = ''.join(f'<circle cx="{r2(x + .25 * math.cos(k * 2 * math.pi / 5 - math.pi / 2))}" cy="{r2(y + .25 * math.sin(k * 2 * math.pi / 5 - math.pi / 2))}" r=".28"/>' for k in range(5))
    return f'<g fill="{CARMIN}">{petalos}</g><circle cx="{x}" cy="{y}" r=".2" fill="{CARMIN_2}"/>'

def caja_redonda(x, y, w, h, r):
    return f'M{x + r} {y}H{x + w - r}A{r} {r} 0 0 1 {x + w} {y + r}V{y + h - r}A{r} {r} 0 0 1 {x + w - r} {y + h}H{x + r}A{r} {r} 0 0 1 {x} {y + h - r}V{y + r}A{r} {r} 0 0 1 {x + r} {y}Z'

# Esquinas poco redondeadas y centro cuadrado: los lectores también miden los
# ojos en diagonal (1:1:3:1:1), y una esquina muy curva o un centro solo de
# pétalos acorta esas corridas. La flor va encima del cuadrado, en otro carmín.
R_OJO, R_OJO_IN, R_CENTRO = float(os.environ.get('R_OJO', 1.6)), float(os.environ.get('R_OJO_IN', .9)), float(os.environ.get('R_CENTRO', .6))
def ojo_svg(c, f):
    x, y = c + Q, f + Q
    anillo = caja_redonda(x, y, 7, 7, R_OJO) + caja_redonda(x + 1, y + 1, 5, 5, R_OJO_IN)
    cx, cy = x + 3.5, y + 3.5
    pet = ''.join(f'<ellipse cx="{r2(cx + .75 * math.cos(k * math.pi / 4))}" cy="{r2(cy + .75 * math.sin(k * math.pi / 4))}" rx=".72" ry=".4" transform="rotate({k * 45} {r2(cx + .75 * math.cos(k * math.pi / 4))} {r2(cy + .75 * math.sin(k * math.pi / 4))})"/>' for k in range(8))
    return (f'<path d="{anillo}" fill="{VERDES[0]}" fill-rule="evenodd"/>'
            f'<path d="{caja_redonda(x + 2, y + 2, 3, 3, R_CENTRO)}" fill="{CARMIN_2}"/>'
            f'<g fill="{CARMIN}">{pet}</g><circle cx="{cx}" cy="{cy}" r=".5" fill="{CARMIN_2}"/>')

def alin_svg(c, f):
    x, y = c + Q - 2, f + Q - 2
    anillo = caja_redonda(x, y, 5, 5, 1) + caja_redonda(x + 1, y + 1, 3, 3, .5)
    return f'<path d="{anillo}" fill="{VERDES[0]}" fill-rule="evenodd"/><circle cx="{c + Q + .5}" cy="{f + Q + .5}" r=".55" fill="{CARMIN}"/>'

PAPEL, RAMA, TRONCO = '#fcfcfb', '#d3e4da', '#4a3424'
TRONCO_D = f'M{W / 2 - 1.3} {H - 3.2}C{W / 2 - .7} {H - 6} {W / 2 - .45} {BASE_CODIGO + 2} {W / 2 - .45} {BASE_CODIGO}H{W / 2 + .45}C{W / 2 + .45} {BASE_CODIGO + 2} {W / 2 + .7} {H - 6} {W / 2 + 1.3} {H - 3.2}Z'
SUELO_D = f'M{W / 2 - 6} {H - 3.2}Q{W / 2} {H - 4.1} {W / 2 + 6} {H - 3.2}'

def svg_completo():
    partes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W * 20}" height="{H * 20}" role="img" aria-labelledby="qr-titulo">',
        f'<title id="qr-titulo">Código QR de Trafalgar: {URL}</title>',
        f'<defs><linearGradient id="g-tronco" gradientUnits="userSpaceOnUse" x1="0" y1="{H - 4}" x2="0" y2="{BASE_CODIGO + 3.2}"><stop offset="0" stop-color="{TRONCO}"/><stop offset=".55" stop-color="{TRONCO}"/><stop offset="1" stop-color="{RAMA}"/></linearGradient></defs>',
        f'<rect width="{W}" height="{H}" fill="{PAPEL}"/>',
        f'<path d="{SUELO_D}" fill="none" stroke="{TRONCO}" stroke-width=".22" stroke-linecap="round"/>',
        f'<path d="{TRONCO_D}" fill="url(#g-tronco)"/>',
        f'<g fill="none" stroke="{RAMA}" stroke-linecap="round">' + ''.join(f'<path d="M{a} {b}Q{c} {d} {e} {f}" stroke-width="{g}"/>' for a, b, c, d, e, f, g, _ in ramas) + '</g>',
    ]
    for x, y, o, t, col, *_ in hojas:
        partes.append(flor_svg(x, y) if t else f'<path d="{hoja_d(x, y, o)}" fill="{VERDES[col]}"/>')
    partes += [ojo_svg(c, f) for c, f in ojos]
    partes += [alin_svg(c, f) for c, f in alineaciones]
    partes.append(logo_svg())
    partes.append(f'<text x="{W / 2}" y="{H - 1.1}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="1.45" font-weight="700" fill="{VERDES[1]}">andre-bhp.github.io/Trafalgar</text>')
    partes.append('</svg>')
    return '\n'.join(partes)

os.makedirs(os.path.join(RAIZ, 'qr'), exist_ok=True)
with open(os.path.join(RAIZ, 'qr', 'trafalgar-qr-ilustrado.svg'), 'w', encoding='utf-8') as fh:
    fh.write(svg_completo())

datos = {
    'url': URL, 'version': VERSION, 'correccion': 'H', 'n': N, 'silencio': Q, 'ancho': W, 'alto': H, 'baseCodigo': BASE_CODIGO,
    'colores': {'papel': PAPEL, 'rama': RAMA, 'tronco': TRONCO, 'verdes': VERDES, 'carmin': CARMIN, 'carmin2': CARMIN_2},
    'tronco': TRONCO_D, 'suelo': SUELO_D,
    'ojos': [[c + Q, f + Q] for c, f in ojos], 'alineaciones': [[c + Q, f + Q] for c, f in alineaciones],
    'ramas': ramas, 'hojas': hojas,
    'logo': {'placa': [PX0, PLACA], 'lado': LOGO_LADO, 'centro': LC, 'viewBox': LOGO_VB, 'paths': LOGO_PATHS},
    'matriz': [''.join('1' if v else '0' for v in fila) for fila in M],
}
with open(os.path.join(RAIZ, 'qr', 'trafalgar-qr.json'), 'w', encoding='utf-8') as fh:
    json.dump(datos, fh, ensure_ascii=False)
with open(os.path.join(RAIZ, 'js', 'qr-datos.js'), 'w', encoding='utf-8') as fh:
    fh.write('// Generado por scripts/qr.py. No editar a mano.\nwindow.QR_TRAFALGAR = ' + json.dumps({k: v for k, v in datos.items() if k != 'matriz'}, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f'QR versión {VERSION}, {N}x{N}, corrección H; {len(hojas)} hojas, {sum(h[3] for h in hojas)} flores, {len(ramas)} ramas')
