"""Build web avatars from the full-size portraits.

Reads  assets/avatars/source/<username>.png  (waist-up, head in the upper third)
Writes assets/avatars/<username>.webp        (192x192 greyscale head crop)

Usage:  pip install pillow
        python tools/build-avatars.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'avatars'
SIZE = 192          # 2x the largest on-screen avatar (76px), with headroom
ZOOM = 2.4          # crop is 1/ZOOM of the image ...
FOCUS_Y = 0.20      # ... around the horizontal centre and 20% from the top

def main():
    s = 1 / ZOOM
    x0, y0 = 0.5 - 0.5 * s, FOCUS_Y - FOCUS_Y * s
    built = 0
    for src in sorted((ROOT / 'source').glob('*.png')):
        im = Image.open(src).convert('L')
        w, h = im.size
        box = (round(x0 * w), round(y0 * h), round((x0 + s) * w), round((y0 + s) * h))
        out = ROOT / (src.stem + '.webp')
        im.crop(box).resize((SIZE, SIZE), Image.LANCZOS).save(out, 'WEBP', quality=82, method=6)
        built += 1
    print(f'built {built} avatars in {ROOT}')

if __name__ == '__main__':
    main()
