"""
Generates assets/bot-profile.jpg - the Telegram bot's profile photo.
Run once with: python3 generate_profile_image.py
Not part of the running bot; this is a one-time design asset generator.
"""
from PIL import Image, ImageDraw, ImageFont
import math

SIZE = 640
FONT_PATH = "/mnt/skills/examples/canvas-design/canvas-fonts/BigShoulders-Bold.ttf"

# Two-tone "sale" gradient: vivid orange -> hot pink/red, diagonal top-left to bottom-right.
COLOR_A = (255, 122, 26)   # vivid orange
COLOR_B = (230, 52, 98)    # hot pink-red

img = Image.new("RGB", (SIZE, SIZE))
pixels = img.load()
for y in range(SIZE):
    for x in range(SIZE):
        t = (x + y) / (2 * SIZE)  # 0 at top-left, 1 at bottom-right
        r = int(COLOR_A[0] + (COLOR_B[0] - COLOR_A[0]) * t)
        g = int(COLOR_A[1] + (COLOR_B[1] - COLOR_A[1]) * t)
        b = int(COLOR_A[2] + (COLOR_B[2] - COLOR_A[2]) * t)
        pixels[x, y] = (r, g, b)

draw = ImageDraw.Draw(img)

# Subtle darker ring near the edge for depth/definition against chat backgrounds.
ring_margin = 14
draw.ellipse(
    [ring_margin, ring_margin, SIZE - ring_margin, SIZE - ring_margin],
    outline=(255, 255, 255, 60),
    width=6,
)

# Large centered "%" - universally reads as "discount" regardless of language,
# and stays legible even when Telegram crops this to a small circular avatar.
font_big = ImageFont.truetype(FONT_PATH, 380)
text = "%"
bbox = draw.textbbox((0, 0), text, font=font_big)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
tx = (SIZE - tw) / 2 - bbox[0]
ty = (SIZE - th) / 2 - bbox[1] - 30  # nudge up to leave room for the tag below

# Soft drop shadow then the white glyph on top.
draw.text((tx + 6, ty + 8), text, font=font_big, fill=(0, 0, 0, 90))
draw.text((tx, ty), text, font=font_big, fill=(255, 255, 255))

# Small "GK" wordmark tag near the bottom, like a price tag.
font_small = ImageFont.truetype(FONT_PATH, 86)
tag_text = "GK"
bbox2 = draw.textbbox((0, 0), tag_text, font=font_small)
tw2, th2 = bbox2[2] - bbox2[0], bbox2[3] - bbox2[1]
tx2 = (SIZE - tw2) / 2 - bbox2[0]
ty2 = SIZE - 175 - bbox2[1]
draw.text((tx2, ty2), tag_text, font=font_small, fill=(255, 255, 255, 235))

img.save("/home/claude/grab-karo-deals-bot/assets/bot-profile.jpg", "JPEG", quality=92)
print("Saved bot-profile.jpg")
