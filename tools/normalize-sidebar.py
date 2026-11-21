"""Gera assets/ui-hd/pergaminho-continuo.webp: o pergaminho da lateral com o trecho do meio feito para repetir sem emenda.

A lateral usa o pergaminho em 9 fatias com cortes largos (as duas plantas ficam inteiras nos cantos) e `border-image-repeat: round`:
o trecho do meio (linhas 300..424 da imagem) se repete na vertical. Para a repetição não cortar as manchas do papel, o trecho
é trocado por uma versão que dá a volta sem emenda: as primeiras linhas são uma mistura suave entre as linhas que vêm logo depois
do fim do trecho e as originais. Os cantos (com as plantas) não mudam; a imagem fica `FADE` linhas mais baixa.

Requer numpy e Pillow (D:\\dev-tools\\tmp\\pylib). Uso: python tools/normalize-sidebar.py
"""
import sys
from pathlib import Path

sys.path.insert(0, 'D:/dev-tools/tmp/pylib')
import numpy as np
from PIL import Image

HD = Path(__file__).resolve().parent.parent / 'assets' / 'ui-hd'
src = Image.open(HD / 'pergaminho-rasgado.webp').convert('RGBA')
a = np.asarray(src).astype(float)
H = a.shape[0]

TOP, BOTTOM = 300, 290          # alturas dos cantos (fatias de cima e de baixo)
FADE = 44                       # linhas de mistura
y0, y1 = TOP, H - BOTTOM        # trecho do meio: 300..424
h = y1 - y0
L = h - FADE                    # novo comprimento do trecho que se repete

band = a[y0:y1]
tile = band[:L].copy()
for i in range(FADE):           # as primeiras linhas misturam "o que viria depois do fim" com o começo original
    w = i / FADE
    tile[i] = (1 - w) * band[i + L] + w * band[i]
# continuidade: tile[L-1] = band[L-1]; a linha seguinte (tile[0]) = band[L], que vem logo depois no original

out = np.concatenate([a[:y0], tile, a[y1:]], axis=0)

# Junções com os cantos: o fim do trecho repetido é band[L-1] e a repetição seguinte começa em band[L].
# Misturam-se as últimas linhas do canto de cima em direção a band[L-F2..L-1] e as primeiras do de baixo a partir de band[L..L+F2-1],
# só fora das plantas (x < 350 em cima; x >= 190 embaixo), para as plantas não ficarem borradas.
F2 = 36
for r in range(y0 - F2, y0):                       # canto de cima, últimas F2 linhas
    w = (r - (y0 - F2) + 1) / F2
    out[r, :350] = (1 - w) * a[r, :350] + w * band[L - (y0 - r), :350]
for k in range(F2):                                # canto de baixo, primeiras F2 linhas
    r = y0 + L + k
    w = (k + 1) / F2
    out[r, 190:] = (1 - w) * band[L + k, 190:] + w * out[r, 190:]
# Faixas ao lado das plantas, com mistura curta e só onde não há planta:
#  - borda direita (x >= 350), logo abaixo da planta de cima (que termina na linha ~286): últimas 14 linhas do canto de cima
#  - borda esquerda (x < 50), onde a planta de baixo ainda não chegou: primeiras F2 linhas do canto de baixo
F3 = 14
for r in range(y0 - F3, y0):
    w = (r - (y0 - F3) + 1) / F3
    out[r, 350:] = (1 - w) * a[r, 350:] + w * band[L - (y0 - r), 350:]
for k in range(F2):
    r = y0 + L + k
    w = (k + 1) / F2
    out[r, :50] = (1 - w) * band[L + k, :50] + w * out[r, :50]
Image.fromarray(out.clip(0, 255).astype(np.uint8), 'RGBA').save(HD / 'pergaminho-continuo.webp', quality=93, alpha_quality=100, method=6)
print('pergaminho-continuo.webp', out.shape[1], out.shape[0], f'(corte {TOP} 118 {BOTTOM} 190; trecho repetido: {L} linhas)')
