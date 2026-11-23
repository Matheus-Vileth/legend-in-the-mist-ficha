"""Tira o "THE" sobrando da logo antiga (o texto certo é "Legend in the Mist").
Apaga os pixels escuros da área e os preenche com a média do pergaminho claro ao redor.
Uso: python tools/fix-logo-the.py <logo-antiga.webp> [preview.png]   (grava assets/ui-hd/logo.webp)"""
import sys
from PIL import Image, ImageFilter

im = Image.open(sys.argv[1]).convert('RGBA')
px = im.load()
X0, Y0, X1, Y1 = 246, 256, 392, 306   # onde está o "THE" sobrando e a estrelinha
R = 12                                 # raio de amostragem do pergaminho

dark = Image.new('L', im.size, 0)
dp = dark.load()
for y in range(Y0, Y1):
    for x in range(X0, X1):
        if x < 272 and y < 270:   # pé do L de LEGEND: não mexer
            continue
        r, g, b, _ = px[x, y]
        if r + g + b < 590:
            dp[x, y] = 255
mask = dark.filter(ImageFilter.MaxFilter(7))   # engorda 3px para pegar o contorno suave
mp = mask.load()

out = im.copy()
op = out.load()
for y in range(Y0, Y1):
    for x in range(X0, X1):
        if not mp[x, y]:
            continue
        acc = [0, 0, 0]
        n = 0
        for yy in range(max(0, y - R), min(im.height, y + R + 1)):
            for xx in range(max(0, x - R), min(im.width, x + R + 1)):
                if mp[xx, yy]:
                    continue
                r, g, b, _ = px[xx, yy]
                if r + g + b < 590:    # letras vizinhas (LEGEND, IN THE) não entram na média
                    continue
                acc[0] += r; acc[1] += g; acc[2] += b; n += 1
        if n:
            op[x, y] = (acc[0] // n, acc[1] // n, acc[2] // n, 255)

out.save('assets/ui-hd/logo.webp', quality=95, method=6)
bg = Image.new('RGBA', out.size, (236, 220, 184, 255))
bg.alpha_composite(out)
bg.convert('RGB').save(sys.argv[2] if len(sys.argv) > 2 else 'preview-logo.png')
