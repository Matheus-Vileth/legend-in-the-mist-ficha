"""Gera assets/ui-hd/moldura-retrato.webp: a moldura da paisagem com o miolo (papel pintado + castelo) transparente.

Dentro de um retângulo interno, os pontos de baixa saturação (papel, castelo, névoa) ficam transparentes; borda, vinhas
e flor (coloridos) ficam. Assim o retrato do usuário aparece ATRÁS das vinhas, como uma foto emoldurada.
Imprime o retângulo interno (em frações da largura/altura) usado pelo CSS para posicionar a foto.

Requer numpy, scipy e Pillow (D:\\dev-tools\\tmp\\pylib). Uso: python tools/make-retrato-frame.py
"""
import sys
from pathlib import Path

sys.path.insert(0, 'D:/dev-tools/tmp/pylib')
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HD = Path(__file__).resolve().parent.parent / 'assets' / 'ui-hd'
im = Image.open(HD / 'moldura-paisagem.webp').convert('RGBA')
a = np.asarray(im).astype(float)
h, w = a.shape[:2]
rgb = a[:, :, :3] / 255
mx, mn = rgb.max(axis=2), rgb.min(axis=2)
sat = (mx - mn) / np.maximum(mx, 1e-6)

# retângulo interno (a borda verde-escura e a linha dourada ficam de fora)
X0, X1, Y0, Y1 = 0.055, 0.945, 0.052, 0.948
yy, xx = np.mgrid[0:h, 0:w]
dentro = (xx > w * X0) & (xx < w * X1) & (yy > h * Y0) & (yy < h * Y1)

# papel/castelo/árvores: pouco saturados -> transparentes; vinhas, flor, borda: saturados -> ficam
papel = np.clip((0.42 - sat) / 0.12, 0, 1)            # 1 = papel/castelo, 0 = colorido
papel = ndi.gaussian_filter(papel, 0.7)
escuro = np.clip((0.34 - rgb.max(axis=2)) / 0.12, 0, 1)  # sombras fundas entre as folhas também ficam
papel = papel * (1 - escuro)
alpha = a[:, :, 3] / 255 * (1 - papel * dentro)

# cor do papel (mediana do que é transparente) para tirar o contorno bege das bordas semitransparentes
cor_papel = np.median(a[:, :, :3][(papel > 0.9) & dentro], axis=0)
vis = np.maximum(1 - papel * dentro, 0.15)[..., None]
cor = np.where(dentro[..., None], (a[:, :, :3] - (1 - vis) * cor_papel) / vis, a[:, :, :3])

# tira manchas pequenas isoladas (pontinhos de papel que sobraram no meio)
lab, n = ndi.label((alpha > 0.15) & dentro)
if n:
    areas = ndi.sum(np.ones_like(alpha), lab, range(1, n + 1))
    pequenas = np.isin(lab, [i + 1 for i, ar in enumerate(areas) if ar < 600])
    alpha = np.where(pequenas, 0, alpha)
    print(f'manchas isoladas removidas: {int(sum(ar < 600 for ar in areas))} de {n}')

out = a.copy()
out[:, :, :3] = np.clip(cor, 0, 255)
out[:, :, 3] = alpha * 255
Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save(HD / 'moldura-retrato.webp', lossless=True, method=6)
print(f'moldura-retrato.webp {w}x{h}')
print(f'retângulo interno (fração): esquerda {X0}, direita {1 - X1:.3f}, topo {Y0}, base {1 - Y1:.3f}')
