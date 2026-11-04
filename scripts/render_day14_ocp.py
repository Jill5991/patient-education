"""Render the four Day-14 contraceptive sheets with exact pack counts."""

from pathlib import Path
from PIL import Image, ImageDraw
import render_day13_ocp as base

ROOT = Path(__file__).resolve().parents[1]
PHASE_COLORS = ("#9b654f", "#ffffff", "#f1d96b")


def triphasic_pack(draw, x, y, scale=1, muted=False, skip_placebo=False):
    gap = int(58 * scale)
    radius = int(20 * scale)
    pad = int(35 * scale)
    width = pad * 2 + 6 * gap + 2 * radius
    height = pad * 2 + 3 * gap + 2 * radius
    draw.rounded_rectangle((x, y, x+width, y+height), radius=26*scale,
                           fill="#f7f8fa" if muted else base.PALE,
                           outline=base.MUTED if muted else base.INK, width=5)
    for i in range(28):
        cx = x + pad + radius + (i % 7) * gap
        cy = y + pad + radius + (i // 7) * gap
        phase = 0 if i < 6 else 1 if i < 11 else 2
        color = "#dee1e6" if muted else (PHASE_COLORS[phase] if i < 21 else "#ffffff")
        pill_radius = radius + 5 if i >= 21 else radius - 2
        base.circle(draw, (cx-pill_radius, cy-pill_radius, cx+pill_radius, cy+pill_radius),
                    color, base.MUTED if muted else base.INK, 3)
        if skip_placebo and i >= 21:
            draw.line((cx-radius-8, cy-radius-8, cx+radius+8, cy+radius+8),
                      fill=base.PINK, width=6)
            draw.line((cx+radius+8, cy-radius-8, cx-radius-8, cy+radius+8),
                      fill=base.PINK, width=6)


def triphasic_step(draw, step):
    if step == 0:
        start_step(draw, 21, 7, triphasic=True)
    elif step == 1:
        triphasic_pack(draw, 250, 150, 1.42)
        base.clock(draw, 960, 385)
        base.badge(draw, 580, 690, "6+5+10+7")
    elif step == 2:
        triphasic_pack(draw, 75, 225, .92, muted=True)
        base.arrow(draw, 535, 425, 670, 425)
        triphasic_pack(draw, 705, 225, .92)
        base.badge(draw, 290, 690, 28)
        base.badge(draw, 925, 690, "6+5+10+7")
    elif step in (3, 4):
        base.draw_step(draw, step, 24, 4)
    elif step == 5:
        triphasic_pack(draw, 80, 230, .9, skip_placebo=True)
        base.arrow(draw, 535, 425, 670, 425)
        triphasic_pack(draw, 710, 230, .9)
        base.badge(draw, 290, 690, 7)
        base.badge(draw, 930, 690, "6+5+10+7")


def xin_step(draw, step):
    if step == 0:
        start_step(draw, 21, 0)
    elif step == 1:
        base.draw_step(draw, 1, 21, 0)
    elif step == 2:
        base.pack(draw, 60, 295, 21, 0, .7, muted=True)
        base.days(draw, 395, 285, 7)
        base.arrow(draw, 850, 425, 960, 425)
        base.pack(draw, 985, 320, 21, 0, .42)
        base.badge(draw, 1075, 690, 8)
    elif step == 3:
        base.draw_step(draw, 3, 24, 4)
    elif step == 4:
        base.draw_step(draw, 4, 24, 4)
    else:
        base.draw_step(draw, 5, 21, 0)


def start_step(draw, active, inactive, triphasic=False):
    if triphasic:
        triphasic_pack(draw, 80, 245, .9)
    else:
        base.pack(draw, 80, 245, active, inactive, .9, mark_active=(0,))
    base.arrow(draw, 535, 425, 675, 425)
    base.tablet(draw, 735, 425)
    base.cup(draw, 890, 345)
    label = "6+5+10+7" if triphasic else (f"{active}+{inactive}" if inactive else active)
    base.badge(draw, 300, 680, label)
    base.badge(draw, 735, 680, 1)


def main():
    for med in ("winstop-t28", "xin-wu-ren", "yasmin", "yaz"):
        for step in range(6):
            image = Image.new("RGB", (1200, 896), "white")
            draw = ImageDraw.Draw(image)
            if med == "winstop-t28":
                triphasic_step(draw, step)
            elif med == "xin-wu-ren":
                xin_step(draw, step)
            elif med == "yasmin":
                if step == 0:
                    start_step(draw, 21, 0)
                else:
                    base.draw_step(draw, step, 21, 0)
            else:
                if step == 0:
                    start_step(draw, 24, 4)
                else:
                    base.draw_step(draw, step, 24, 4)
            dest = ROOT / "assets" / "img" / med / f"step-{step:02d}.png"
            dest.parent.mkdir(parents=True, exist_ok=True)
            image.save(dest, optimize=True)
    print("Rendered 24 count-accurate Day-14 diagrams")


if __name__ == "__main__":
    main()
