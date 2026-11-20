"""Builds the extension icon (images/icon.png, 256x256) from art/unicorn.png.
Run:  python scripts/make-icon.py   (requires: pip install pillow)"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
S = 1024  # draw at high resolution, downscale at the end
TOP, BOTTOM = (0x62, 0xBE, 0xCB), (0x3B, 0x8B, 0x99)  # the teal of the "You are sweet." card

bg = Image.new('RGBA', (S, S))
px = ImageDraw.Draw(bg)
for y in range(S):
    t = y / (S - 1)
    px.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM)) + (255,))

# soft glow behind the unicorn
glow = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ImageDraw.Draw(glow).ellipse((150, 140, 870, 860), fill=(255, 255, 255, 70))
bg = Image.alpha_composite(bg, glow.filter(ImageFilter.GaussianBlur(90)))

# crop to the visible pixels, fit inside an even margin, and center on the
# visual center of mass (the mane is heavier than the face, so a plain
# bounding-box center looks off to one side)
uni = Image.open(ROOT / 'art' / 'unicorn.png').convert('RGBA')
uni = uni.crop(uni.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox())
box = int(S * 0.8)
uni.thumbnail((box, box), Image.LANCZOS)
alpha = uni.getchannel('A').resize((uni.width // 8, uni.height // 8))
w, h = alpha.size
total = cx = cy = 0
pixels = alpha.get_flattened_data() if hasattr(alpha, 'get_flattened_data') else alpha.getdata()
for i, a in enumerate(pixels):
    total += a
    cx += (i % w) * a
    cy += (i // w) * a
cx, cy = cx / total * 8, cy / total * 8
# blend mass center with box center so neither the face nor the mane gets cut
ox = round(S / 2 - (0.55 * cx + 0.45 * uni.width / 2))
oy = round(S / 2 - (0.35 * cy + 0.65 * uni.height / 2))
margin = int(S * 0.06)
ox = max(margin, min(S - margin - uni.width, ox))
oy = max(margin, min(S - margin - uni.height, oy))
bg.alpha_composite(uni, (ox, oy))

mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=int(S * 0.22), fill=255)
out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
out.paste(bg, (0, 0), mask)
out.resize((256, 256), Image.LANCZOS).save(ROOT / 'images' / 'icon.png', optimize=True)
print('images/icon.png done')

# Hero artwork for the showcase page (images/hero.webp): the unicorn cropped to its
# visible pixels and sized for a ~420px-tall slot on high-density screens.
hero = Image.open(ROOT / 'art' / 'unicorn.png').convert('RGBA')
hero = hero.crop(hero.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox())
hero.thumbnail((720, 720), Image.LANCZOS)
hero.save(ROOT / 'images' / 'hero.webp', quality=86, method=6)
print('images/hero.webp done', hero.size)
