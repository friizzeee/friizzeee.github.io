"""Images rendues par render_walk.py (PNG) → images du site (WebP), plus l'image d'accueil et corners.json.

  python tools/plan-sequence/to_webp.py DOSSIER_DU_RENDU public/plan/16x9 [--width 1920] [--quality 72]

L'image 0 sert aussi d'image d'accueil (poster.webp, meilleure qualité) : c'est elle qu'on voit avant que le
trajet soit chargé, et la seule qu'on voit sans JavaScript.
"""
import json, os, shutil, sys
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
argv = sys.argv[3:]
width = int(argv[argv.index('--width') + 1]) if '--width' in argv else 1920
quality = int(argv[argv.index('--quality') + 1]) if '--quality' in argv else 72

with open(os.path.join(src, 'corners.json'), encoding='utf-8') as f:
    track = json.load(f)
os.makedirs(dst, exist_ok=True)
total = 0
for i in range(track['frames']):
    im = Image.open(os.path.join(src, f'{i:04d}.png')).convert('RGB')
    if im.width != width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    out = os.path.join(dst, f'{i:04d}.webp')
    # L'image 0 est identique à l'image d'accueil : le canevas prend le relais sans que rien ne bouge.
    im.save(out, 'WEBP', quality=86 if i == 0 else quality, method=6)
    total += os.path.getsize(out)
    if i == 0:
        shutil.copyfile(out, os.path.join(dst, 'poster.webp'))
shutil.copyfile(os.path.join(src, 'corners.json'), os.path.join(dst, 'corners.json'))
print(f"{track['frames']} images, {total / 1e6:.1f} Mo, {total / track['frames'] / 1e3:.0f} Ko en moyenne")
