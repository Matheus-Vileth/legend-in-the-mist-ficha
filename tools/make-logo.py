"""Tira o fundo branco da logo (só o branco ligado às bordas) e salva assets/ui-hd/logo.webp.

Uso: python tools/make-logo.py <imagem-de-entrada> [largura-final]
Só usa Pillow. A névoa nas bordas vira transparência gradual e a cor é "desembranquecida" para não deixar halo claro.
"""
import sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

src = sys.argv[1]
width = int(sys.argv[2]) if len(sys.argv) > 2 else 1000
img = Image.open(src).convert('RGB')
w, h = img.size
r, g, b = img.split()
minc = ImageChops.darker(ImageChops.darker(r, g), b)

# fundo = quase branco ligado às bordas
mask = minc.point(lambda v: 255 if v >= 238 else 0)
for x in range(w):
    for y in (0, h - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
for y in range(h):
    for x in (0, w - 1):
        if mask.getpixel((x, y)) == 255:
            ImageDraw.floodfill(mask, (x, y), 128)
bg = mask.point(lambda v: 255 if v == 128 else 0)
near = bg.filter(ImageFilter.MaxFilter(17))  # faixa de transição ao redor do fundo

soft = minc.point(lambda v: max(0, min(255, int((250 - v) * 255 / 40))))
alpha = Image.composite(soft, Image.new('L', (w, h), 255), near)

px, ap = img.load(), alpha.load()
out = Image.new('RGBA', (w, h))
po = out.load()
for y in range(h):
    for x in range(w):
        a = ap[x, y]
        if a == 0:
            po[x, y] = (0, 0, 0, 0)
            continue
        k = a / 255
        c = px[x, y]
        po[x, y] = tuple(max(0, min(255, round((v - 255 * (1 - k)) / k))) for v in c) + (a,)

bbox = out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
out = out.crop(bbox)
out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
out.save('assets/ui-hd/logo.webp', quality=92, method=6)
out.save(sys.argv[3] if len(sys.argv) > 3 else 'logo-legend-in-the-mist.png')
print(out.size)
