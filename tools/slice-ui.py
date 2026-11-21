"""Recorta assets/ui-src/elementos.webp em peças individuais (assets/ui/*.webp).

- Peças sem texto: recorte direto, com o canal alfa original.
- Peças com texto em inglês gravado (barra de abas, botões, mensagens): gera versão "vazia"
  (tampa esquerda + coluna limpa repetida + tampa direita), pronta para border-image.
- Ícones claros (pessoa, disquete, seta...): extraídos como silhueta creme com alfa.

Requer numpy, scipy e Pillow (instalados em D:\\dev-tools\\tmp\\pylib).
Uso: python tools/slice-ui.py
"""
import sys
from pathlib import Path

sys.path.insert(0, 'D:/dev-tools/tmp/pylib')
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'ui-src' / 'elementos.webp'
OUT = ROOT / 'assets' / 'ui'
OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert('RGBA')
arr = np.array(im)
opaque = arr[:, :, 3] > 24
lab, _ = ndi.label(ndi.binary_dilation(opaque, iterations=2))
boxes = {i: sl for i, sl in enumerate(ndi.find_objects(lab), 1) if sl is not None}


def save(img, name):
    img.save(OUT / f'{name}.webp', lossless=True, method=6)
    print(f'{name}: {img.size}')


def piece(comp, name):
    """Recorta o componente `comp` (id da segmentação), apagando vizinhos."""
    ys, xs = boxes[comp]
    sub = arr[ys, xs].copy()
    keep = ndi.binary_dilation(lab[ys, xs] == comp, iterations=1)
    sub[~keep, 3] = 0
    out = Image.fromarray(sub)
    bbox = out.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    save(out.crop(bbox), name)


def blank_bar(comp, name, left, right, sample_x):
    """Esvazia peça horizontal: tampa esq. + coluna `sample_x` repetida + tampa dir."""
    ys, xs = boxes[comp]
    sub = Image.fromarray(arr[ys, xs].copy())
    w, h = sub.size
    col = sub.crop((sample_x, 0, sample_x + 1, h))
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    for x in range(left, w - right):
        out.paste(col, (x, 0))
    out.paste(sub.crop((0, 0, left, h)), (0, 0))
    out.paste(sub.crop((w - right, 0, w, h)), (w - right, 0))
    save(out, name)


def glyph(comp, box, name, color=(236, 224, 196)):
    """Silhueta clara sobre fundo escuro: `box` = (x0, y0, x1, y1) relativo ao componente."""
    ys, xs = boxes[comp]
    sub = arr[ys, xs][box[1]:box[3], box[0]:box[2], :3].astype(float)
    lum = sub @ np.array([0.299, 0.587, 0.114])
    edge = np.concatenate([lum[0], lum[-1], lum[:, 0], lum[:, -1]])
    bg = np.median(edge)
    a = np.clip((lum - bg) / max(1.0, np.percentile(lum, 99.5) - bg), 0, 1)
    a = np.clip((a - 0.18) / 0.82, 0, 1)
    out = np.zeros((*a.shape, 4), np.uint8)
    out[:, :, :3] = color
    out[:, :, 3] = (a * 255).astype(np.uint8)
    img = Image.fromarray(out)
    bbox = img.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    save(img.crop(bbox), name)


# ---- peças sem texto ----
for comp, name in {
    1: 'logo', 9: 'faixa-marrom', 18: 'faixa-clara', 19: 'placa-verde', 8: 'fita-louros-a', 20: 'fita-louros-b',
    26: 'cartao', 27: 'cartao-pena', 39: 'cartao-pena-estreito', 37: 'moldura-paisagem', 38: 'pergaminho-rasgado',
    21: 'cartao-lista', 28: 'espada-flores', 41: 'flores-grandes', 43: 'flores-azuis', 52: 'passaro', 55: 'borboleta',
    49: 'icone-livro', 50: 'icone-estrela', 51: 'icone-coroa', 44: 'losango',
    53: 'divisor-a', 56: 'divisor-b', 57: 'divisor-c',
    10: 'ornamento-estrela', 13: 'ornamento-pena', 12: 'ornamento-coroa', 17: 'ornamento-lua', 15: 'ornamento-sol',
    14: 'ornamento-flor', 25: 'ornamento-folha-a', 24: 'ornamento-folha-b', 22: 'ornamento-pluma', 23: 'ornamento-ampulheta',
    3: 'botao-mais', 4: 'botao-lapis', 5: 'botao-lixeira', 6: 'botao-copiar', 7: 'botao-engrenagem',
}.items():
    piece(comp, name)

# medalhão: o componente 40 tem 4 anéis iguais; fica só o primeiro
ys, xs = boxes[40]
sub = arr[ys, xs].copy()
w = sub.shape[1] // 4
medal = Image.fromarray(sub[:, :w])
save(medal.crop(medal.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()), 'medalhao')

# ---- peças com texto gravado -> versão vazia ----
blank_bar(2, 'barra-abas-vazia', left=26, right=26, sample_x=32)
blank_bar(30, 'botao-verde-vazio', left=10, right=10, sample_x=12)
blank_bar(31, 'botao-vinho-vazio', left=10, right=10, sample_x=12)
blank_bar(33, 'botao-marrom-vazio', left=10, right=10, sample_x=12)
blank_bar(29, 'aviso-info-vazio', left=12, right=12, sample_x=10)
blank_bar(32, 'aviso-ok-vazio', left=12, right=12, sample_x=10)
blank_bar(34, 'aviso-alerta-vazio', left=12, right=12, sample_x=10)

# ---- ícones (silhuetas claras) ----
glyph(2, (38, 14, 66, 52), 'ic-pessoa')
glyph(2, (162, 14, 192, 52), 'ic-estrela')
glyph(2, (280, 14, 312, 52), 'ic-livro')
glyph(2, (396, 14, 428, 52), 'ic-baixar')
glyph(30, (12, 6, 44, 42), 'ic-disquete')
glyph(33, (12, 6, 44, 42), 'ic-x')
glyph(35, (12, 6, 44, 42), 'ic-mais')
