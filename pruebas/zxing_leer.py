# Lee códigos QR con ZXing (zxing-cpp, enlaces oficiales para Python).
# Uso: python pruebas/zxing_leer.py imagen1.png imagen2.png ...  -> JSON {ruta: texto o null}
import json
import sys

import zxingcpp
from PIL import Image

salida = {}
for ruta in sys.argv[1:]:
    r = zxingcpp.read_barcodes(Image.open(ruta).convert('L'), formats=zxingcpp.BarcodeFormat.QRCode, try_rotate=True, try_downscale=True)
    salida[ruta] = r[0].text if r else None
print(json.dumps(salida, ensure_ascii=False))
