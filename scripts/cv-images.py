# Images du CV montrées dans la carte « Mon CV » : la première page de chaque PDF, en WebP de 1300 px de large.
# À relancer après chaque mise à jour du CV :  python scripts/cv-images.py   (pip install pymupdf pillow)
from pathlib import Path

import fitz
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WIDTH = 1300

for lang, pdf in (('fr', 'cv.pdf'), ('en', 'cv_en.pdf')):
    page = fitz.open(ROOT / 'assets' / 'previews' / pdf)[0]
    # rendu quatre fois plus grand puis réduit : un texte plus net qu'un rendu direct
    pix = page.get_pixmap(matrix=fitz.Matrix(4, 4), alpha=False)
    image = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
    image = image.resize((WIDTH, round(page.rect.height * WIDTH / page.rect.width)), Image.LANCZOS)
    out = ROOT / 'assets' / 'cv' / f'cv-{lang}-1.webp'
    out.parent.mkdir(exist_ok=True)
    image.save(out, 'WEBP', quality=86, method=6)
    print(out.relative_to(ROOT), image.size, f'{out.stat().st_size // 1024} Ko')
