# Vectoriza el logo oficial (logo-trafalgar.webp) en tres capas de color con potrace
# y escribe img/logo-trafalgar.svg (colores muestreados del archivo, mediana por capa).
# Uso: python scripts/logo.py   (requiere pip install potracer pillow numpy)
import os
import statistics

import numpy as np
import potrace
from PIL import Image

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
im = Image.open(os.path.join(RAIZ, 'logo-trafalgar.webp')).convert('RGBA')
a = np.array(im).astype(int)
REF = {'petroleo': (15, 102, 90), 'turquesa': (67, 183, 163), 'naranja': (239, 159, 0)}
opaco = a[..., 3] > 128
dist = {k: ((a[..., :3] - np.array(v)) ** 2).sum(-1) for k, v in REF.items()}
cercano = np.argmin(np.stack([dist[k] for k in REF]), axis=0)
colores, capas = {}, {}
for i, k in enumerate(REF):
    m = opaco & (cercano == i)
    capas[k] = m
    px = a[m][:, :3]
    colores[k] = '#%02x%02x%02x' % tuple(int(statistics.median(px[:, j])) for j in range(3))

ys, xs = np.where(opaco)
pad = 12
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad, ys.max() + pad
lado = int(max(x1 - x0, y1 - y0))
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
vb = (round(cx - lado / 2), round(cy - lado / 2), lado, lado)


def trazar(m):
    bmp = potrace.Bitmap(~m)  # potracer rellena los pixeles en falso
    curvas = bmp.trace(turdsize=40, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.4)
    d = []
    for c in curvas:
        f = lambda p: f'{p.x:.1f} {p.y:.1f}'
        s = [f'M{f(c.start_point)}']
        for seg in c.segments:
            s.append(f'L{f(seg.c)}L{f(seg.end_point)}' if seg.is_corner else f'C{f(seg.c1)} {f(seg.c2)} {f(seg.end_point)}')
        d.append(''.join(s) + 'Z')
    return ''.join(d)


orden = ['petroleo', 'turquesa', 'naranja']
paths = '\n  '.join(f'<path class="logo-{k}" fill="{colores[k]}" d="{trazar(capas[k])}"/>' for k in orden)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]} {vb[1]} {vb[2]} {vb[3]}" role="img" aria-label="Logo de Trafalgar">
  {paths}
</svg>
'''
os.makedirs(os.path.join(RAIZ, 'img'), exist_ok=True)
open(os.path.join(RAIZ, 'img', 'logo-trafalgar.svg'), 'w', encoding='utf-8').write(svg)
print('colores', colores, 'viewBox', vb, 'bytes', len(svg))
