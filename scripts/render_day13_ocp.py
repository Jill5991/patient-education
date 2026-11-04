"""Render count-accurate oral-contraceptive diagrams for Day 13.

Pillow is used only to rasterize deterministic vector-style primitives. Every
blister drawn here contains the exact active/inactive count of its sheet.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TYPES = {
    "alyssa": (24, 4), "diane35": (21, 0),
    "gynera-meliane": (21, 0), "loestrin": (24, 4),
    "marvelon-21": (21, 0), "marvelon-28": (21, 7),
    "mercilon-21": (21, 0), "mercilon-28": (21, 7),
    "winstop-28": (21, 7), "winstop-30": (21, 7),
}
INK = "#253044"
PINK = "#d44b80"
LIGHT = "#f8e8ef"
PALE = "#fff7fa"
MUTED = "#929ba9"
FONT_PATH = "/System/Library/Fonts/Supplemental/Arial.ttf"
FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"


def font(size, bold=False):
    return ImageFont.truetype(FONT_BOLD if bold else FONT_PATH, size)


def circle(draw, box, fill, outline=INK, width=4):
    draw.ellipse(box, fill=fill, outline=outline, width=width)


def pack(draw, x, y, active, inactive, scale=1, muted=False,
         strike_inactive=False, mark_active=()):
    """Seven columns; active tablets precede the inactive tablets."""
    count = active + inactive
    rows = (count + 6) // 7
    gap = int(58 * scale)
    radius = int(20 * scale)
    pad = int(35 * scale)
    w = pad * 2 + 6 * gap + radius * 2
    h = pad * 2 + (rows - 1) * gap + radius * 2
    draw.rounded_rectangle((x, y, x+w, y+h), radius=26*scale,
                           fill="#f7f8fa" if muted else PALE,
                           outline=MUTED if muted else INK, width=5)
    for i in range(count):
        cx = x + pad + radius + (i % 7) * gap
        cy = y + pad + radius + (i // 7) * gap
        fill = "#dee1e6" if muted else (LIGHT if i < active else "#ffffff")
        circle(draw, (cx-radius, cy-radius, cx+radius, cy+radius),
               fill, MUTED if muted else INK, 3)
        if not muted and i < active:
            circle(draw, (cx-radius+7, cy-radius+7, cx+radius-7, cy+radius-7),
                   PINK, PINK, 2)
        if i in mark_active:
            draw.ellipse((cx-radius-8, cy-radius-8, cx+radius+8, cy+radius+8),
                         outline=PINK, width=7)
        if strike_inactive and i >= active:
            draw.line((cx-radius-8, cy-radius-8, cx+radius+8, cy+radius+8), fill=PINK, width=6)
            draw.line((cx+radius+8, cy-radius-8, cx-radius-8, cy+radius+8), fill=PINK, width=6)
    return (w, h)


def badge(draw, center_x, y, value, label=None):
    s = str(value)
    box = draw.textbbox((0, 0), s, font=font(54, True))
    tw = box[2]-box[0]
    draw.rounded_rectangle((center_x-tw/2-24, y, center_x+tw/2+24, y+78),
                           radius=26, fill=LIGHT, outline=PINK, width=3)
    draw.text((center_x-tw/2, y+5), s, font=font(54, True), fill=INK)


def arrow(draw, x1, y1, x2, y2):
    draw.line((x1, y1, x2-22, y2), fill=PINK, width=18)
    draw.polygon(((x2, y2), (x2-34, y2-26), (x2-34, y2+26)), fill=PINK)


def clock(draw, cx, cy):
    circle(draw, (cx-105, cy-105, cx+105, cy+105), "white", INK, 8)
    draw.line((cx, cy, cx, cy-64), fill=INK, width=8)
    draw.line((cx, cy, cx+52, cy+32), fill=INK, width=8)
    circle(draw, (cx-9, cy-9, cx+9, cy+9), PINK, PINK)


def cup(draw, x, y):
    draw.polygon(((x, y), (x+130, y), (x+108, y+150), (x+22, y+150)),
                 fill="#e9f3f7")
    draw.line((x, y, x+22, y+150, x+108, y+150, x+130, y), fill=INK, width=6, joint="curve")
    draw.line((x+15, y+70, x+115, y+70), fill="#6cc5dc", width=7)


def tablet(draw, cx, cy, count=1):
    for i in range(count):
        xx = cx + (i-(count-1)/2)*82
        circle(draw, (xx-30, cy-30, xx+30, cy+30), LIGHT, INK, 5)
        draw.line((xx-16, cy+16, xx+16, cy-16), fill=PINK, width=4)


def days(draw, x, y, count=7, crossed=False):
    for i in range(count):
        xx = x+i*62
        draw.rounded_rectangle((xx, y, xx+49, y+52), radius=8,
                               fill=LIGHT if crossed else "#fff", outline=INK, width=3)
        if crossed:
            draw.line((xx+10, y+9, xx+39, y+43), fill=PINK, width=5)
    badge(draw, x+3*62+25, y+90, count)


def draw_step(draw, step, active, inactive):
    is21 = inactive == 0
    if step == 1:
        w, h = pack(draw, 250, 150, active, inactive, 1.42)
        clock(draw, 960, 385)
        badge(draw, 580, 690, f"{active}+{inactive}" if inactive else active)
    elif step == 2:
        if is21:
            pack(draw, 65, 260, active, 0, .82, muted=True)
            arrow(draw, 520, 425, 650, 425)
            days(draw, 690, 320, 7)
        else:
            pack(draw, 75, 225, active, inactive, .92, muted=True)
            arrow(draw, 535, 425, 670, 425)
            pack(draw, 705, 225, active, inactive, .92)
            badge(draw, 290, 690, active+inactive)
            badge(draw, 925, 690, f"{active}+{inactive}")
    elif step == 3:
        if is21:
            days(draw, 95, 320, 7)
            arrow(draw, 560, 425, 680, 425)
            pack(draw, 715, 250, active, 0, .87)
            badge(draw, 900, 650, 8)
        else:
            clock(draw, 260, 400)
            tablet(draw, 530, 400)
            arrow(draw, 610, 400, 730, 400)
            cup(draw, 850, 335)
            badge(draw, 560, 645, 1)
    elif step == 4:
        if is21:
            clock(draw, 250, 390)
            tablet(draw, 520, 390)
            arrow(draw, 610, 390, 730, 390)
            cup(draw, 850, 320)
        else:
            tablet(draw, 300, 320, 2)
            arrow(draw, 420, 320, 570, 320)
            tablet(draw, 660, 320)
            days(draw, 345, 570, 7)
    elif step == 5:
        if is21:
            pack(draw, 80, 250, active, 0, .82, muted=True)
            days(draw, 405, 280, 7, crossed=True)
            arrow(draw, 865, 425, 990, 425)
            # A small but complete new 21-tablet blister.
            pack(draw, 1000, 300, active, 0, .37)
        else:
            pack(draw, 80, 230, active, inactive, .9, strike_inactive=True)
            arrow(draw, 535, 425, 670, 425)
            pack(draw, 710, 230, active, inactive, .9)
            badge(draw, 290, 690, inactive)
            badge(draw, 930, 690, f"{active}+{inactive}")


def main():
    total = 0
    for med, (active, inactive) in TYPES.items():
        for step in range(1, 6):
            image = Image.new("RGB", (1200, 896), "white")
            draw = ImageDraw.Draw(image)
            draw_step(draw, step, active, inactive)
            dest = ROOT / "assets" / "img" / med / f"step-{step:02d}.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            image.save(dest, optimize=True)
            total += 1
    print(f"Rendered {total} count-accurate diagrams")


if __name__ == "__main__":
    main()
