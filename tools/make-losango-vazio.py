"""Gera assets/ui-hd/losango-vazio.webp: o losango sem a estrela do centro, para receber número ou ✓ por cima.

Apaga só a estrela (pixels claros dentro da borda) e a preenche com o verde-escuro do próprio losango, estimado por desfoque
normalizado dos pixels vizinhos; a borda dourada e a transparência de fora não mudam.
Requer numpy, scipy e Pillow (D:\\dev-tools\\tmp\\pylib). Uso: python tools/make-losango-vazio.py
"""
import sys
from pathlib import Path

sys.path.insert(0, 'D:/dev-tools/tmp/pylib')
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

HD = Path(__file__).resolve().parent.parent / 'assets' / 'ui-hd'
im = Image.open(HD / 'losango.webp').convert('RGBA')
a = np.asarray(im).astype(float)
h, w = a.shape[:2]
cy, cx = (h - 1) / 2, (w - 1) / 2
yy, xx = np.mgrid[0:h, 0:w]
manhattan = np.abs(yy - cy) + np.abs(xx - cx)

INNER = 33                                   # dentro da borda dourada (o losango vai até ~48)
lum = a[:, :, :3] @ np.array([0.299, 0.587, 0.114])
inner = manhattan < INNER
star = inner & (lum > 105)                   # a estrela é creme; o fundo do losango é verde-escuro (~65)
star = ndi.binary_dilation(star, iterations=3) & inner
soft = ndi.gaussian_filter(star.astype(float), 1.2)

weight = (inner & ~star).astype(float)       # só o fundo, para estimar a cor que vai preencher
fill = np.stack([ndi.gaussian_filter(a[:, :, c] * weight, 7) / np.maximum(ndi.gaussian_filter(weight, 7), 1e-6) for c in range(3)], axis=2)

out = a.copy()
out[:, :, :3] = a[:, :, :3] * (1 - soft[..., None]) + fill * soft[..., None]
Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save(HD / 'losango-vazio.webp', lossless=True, method=6)
print('losango-vazio.webp', w, h, f'| pixels de estrela apagados: {int(star.sum())}')
