"""Amplia as peças de assets/ui/ com Real-ESRGAN (x4plus) e grava em assets/ui-hd/ (3x do original).

Fluxo: webp -> png temporário -> realesrgan 4x -> reduz para 3x (Lanczos, alfa pré-multiplicado) -> webp.
Peças pequenas (< 40 mil pixels) saem em webp sem perdas; as grandes em qualidade 92.

Requer: Pillow (D:\\dev-tools\\tmp\\pylib) e o Real-ESRGAN-ncnn-vulkan em D:\\dev-tools\\realesrgan
(pacote realesrgan-ncnn-vulkan-20220424-windows.zip, do repositório xinntao/Real-ESRGAN).
Uso: python tools/upscale-ui.py
"""
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, 'D:/dev-tools/tmp/pylib')
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'assets' / 'ui'
OUT = ROOT / 'assets' / 'ui-hd'
WORK = Path('D:/dev-tools/tmp/up')
EXE = Path('D:/dev-tools/realesrgan/realesrgan-ncnn-vulkan.exe')
FACTOR = 3  # fator final em relação ao original

if not EXE.exists():
    sys.exit(f'Real-ESRGAN não encontrado em {EXE}')

shutil.rmtree(WORK, ignore_errors=True)
(WORK / 'in').mkdir(parents=True)
(WORK / 'out').mkdir()
OUT.mkdir(parents=True, exist_ok=True)

names = sorted(p.stem for p in SRC.glob('*.webp'))
for n in names:
    Image.open(SRC / f'{n}.webp').convert('RGBA').save(WORK / 'in' / f'{n}.png')

subprocess.run(
    [str(EXE), '-i', str(WORK / 'in'), '-o', str(WORK / 'out'), '-n', 'realesrgan-x4plus', '-s', '4', '-f', 'png'],
    cwd=EXE.parent, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
)

total = 0
for n in names:
    orig = Image.open(SRC / f'{n}.webp')
    big = Image.open(WORK / 'out' / f'{n}.png').convert('RGBA')
    target = (orig.width * FACTOR, orig.height * FACTOR)
    # alfa pré-multiplicado evita halo claro/escuro nas bordas transparentes
    small = big.convert('RGBa').resize(target, Image.LANCZOS).convert('RGBA')
    path = OUT / f'{n}.webp'
    if target[0] * target[1] < 40000:
        small.save(path, lossless=True, method=6)
    else:
        small.save(path, quality=92, alpha_quality=100, method=6)
    total += path.stat().st_size
    print(f'{n}: {orig.size} -> {target}  {path.stat().st_size // 1024} KB')
print(f'{len(names)} peças, {total // 1024} KB no total')
