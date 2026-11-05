"""Draw the Day 15 pen instructions as explicit, auditable SVG diagrams.

All pens have the needle/cartridge on the left and the dose selector/button on
the right. The vertical views rotate that same geometry; they never mirror it.
"""
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets/svg/day15-insulin"

# Product colours follow the manufacturers' device instructions. Labels are
# schematic so the printed medicine name remains the primary identifier.
PENS = {
    "novorapid": ("NovoRapid FlexPen", "#173d74", "#ef7b22", "#ef7b22", False, 7, "2 U", "6 s"),
    "apidra": ("Apidra SoloStar", "#2874bd", "#bfd9ee", "#173d74", False, 7, "2 U", "10 s"),
    "novomix-30": ("NovoMix 30 FlexPen", "#173d74", "#447ac8", "#447ac8", True, 8, "2 U", "6 s"),
    "humalog-mix50": ("Humalog Mix50 KwikPen", "#2265a7", "#ce353c", "#ce353c", True, 8, "2 U", "5 s"),
    "ryzodeg": ("Ryzodeg FlexTouch", "#173d74", "#8abf65", "#173d74", False, 8, "2 U", "6 s"),
}

INK = "#163451"
SKIN = "#f3d2b7"

def txt(x, y, value, size=34, weight=700, color=INK, anchor="middle"):
    return f'<text x="{x}" y="{y}" text-anchor="{anchor}" fill="{color}" font-family="Arial,Helvetica,sans-serif" font-size="{size}" font-weight="{weight}">{escape(str(value))}</text>'

def pen(k, *, needle=False, cap=False, dose="0", ox=0, oy=0, rotate=0):
    name, body, band, button, cloudy, *_ = PENS[k]
    # Fixed device anatomy. In local coordinates, x=205 is the rubber seal,
    # x=870 is the injection button; dose window sits beside the selector.
    parts = [f'<g transform="translate({ox} {oy}) rotate({rotate} 600 440)">']
    if cap:
        parts += [f'<rect x="145" y="388" width="375" height="104" rx="24" fill="{body}" stroke="{INK}" stroke-width="5"/>',
                  f'<rect x="178" y="407" width="150" height="12" rx="6" fill="{band}"/>']
    else:
        parts += [f'<rect x="240" y="392" width="308" height="96" rx="24" fill="#e9f3f9" stroke="{INK}" stroke-width="5"/>',
                  f'<rect x="267" y="408" width="226" height="64" rx="11" fill="{("#f4f3ed" if cloudy else "#ffffff")}" stroke="#7c9ab0" stroke-width="3"/>',
                  '<path d="M295 425h166 M295 440h166 M295 455h166" stroke="#b8cfda" stroke-width="2"/>',
                  f'<rect x="532" y="392" width="285" height="96" rx="14" fill="{body}" stroke="{INK}" stroke-width="5"/>',
                  f'<rect x="554" y="410" width="173" height="60" rx="5" fill="white" stroke="{band}" stroke-width="6"/>',
                  txt(641,450,name.split()[0],19,700,body),
                  f'<rect x="739" y="410" width="60" height="60" rx="8" fill="white" stroke="{INK}" stroke-width="4"/>',
                  txt(769,452,dose,30,700),
                  f'<path d="M812 410v60" stroke="{INK}" stroke-width="4"/>',
                  f'<rect x="817" y="392" width="63" height="96" rx="12" fill="{band}" stroke="{INK}" stroke-width="5"/>',
                  '<path d="M829 405v70 M840 405v70 M851 405v70 M862 405v70" stroke="white" stroke-width="2" opacity=".65"/>',
                  f'<rect x="878" y="407" width="31" height="66" rx="9" fill="{button}" stroke="{INK}" stroke-width="5"/>',
                  f'<rect x="208" y="411" width="32" height="58" rx="5" fill="#e2e8ed" stroke="{INK}" stroke-width="5"/>']
        if needle:
            parts += ['<rect x="178" y="403" width="31" height="74" rx="8" fill="#c8d9e5" stroke="#163451" stroke-width="4"/>',
                      '<path d="M178 440H107" stroke="#365269" stroke-width="4" stroke-linecap="round"/>']
    parts.append('</g>')
    return ''.join(parts)

def arrow(path, color="#e06f29", width=10):
    return f'<path d="{path}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round" marker-end="url(#arrow)"/>'

def ring(x, y, value, color="#e06f29"):
    return f'<circle cx="{x}" cy="{y}" r="72" fill="white" stroke="{color}" stroke-width="7"/>'+txt(x,y+16,value,43,700,color)

def draw(k, index):
    name, body, band, button, cloudy, count, prime, wait = PENS[k]
    steps = (["mix", "check", "attach", "prime", "dose", "clean", "inject", "discard"] if cloudy else
             ["check", "attach", "prime", "dose"] + (["site"] if k == "ryzodeg" else []) + ["clean", "inject", "discard"])
    kind = steps[index]
    p = []
    if kind == "mix":
        p += [pen(k, ox=-5, oy=-185), arrow("M270 370 C420 310 720 310 870 370"),
              pen(k, ox=-5, oy=180, rotate=90), arrow("M425 590 C425 710 775 710 775 590"),
              ring(1030,320,"10×"),ring(1030,685,"10×")]
    elif kind == "check":
        p += [pen(k), '<circle cx="390" cy="250" r="112" fill="white" stroke="#2f87b7" stroke-width="7"/>',
              f'<rect x="319" y="215" width="142" height="70" rx="8" fill="{("#f4f3ed" if cloudy else "#fff")}" stroke="#7c9ab0" stroke-width="5"/>',
              arrow("M405 355 L405 305", "#2f87b7", 6)]
    elif kind == "attach":
        p += [pen(k), '<rect x="65" y="408" width="70" height="64" rx="9" fill="#d8e8f1" stroke="#163451" stroke-width="5"/>',
              '<path d="M135 440h40" stroke="#365269" stroke-width="5"/>',
              arrow("M140 545 H215"),
              '<rect x="167" y="207" width="85" height="62" rx="6" fill="white" stroke="#2f87b7" stroke-width="5"/>',
              '<path d="M184 224l51 34 M235 224l-51 34" stroke="#2f87b7" stroke-width="5"/>',
              arrow("M207 279 V387", "#2f87b7", 6)]
    elif kind == "prime":
        p += [pen(k, needle=True, dose="2", rotate=90),
              '<path d="M600 32 C578 65 583 81 600 87 C617 81 622 65 600 32Z" fill="#3aa8dc"/>',
              arrow("M815 695 V584"), ring(1025,440,prime)]
    elif kind == "dose":
        p += [pen(k,dose="12"), arrow("M795 555 C875 625 970 560 887 503"),
              '<rect x="663" y="194" width="217" height="137" rx="17" fill="white" stroke="#e06f29" stroke-width="7"/>',
              txt(771,286,"12",77),
              arrow("M775 331 V378", "#e06f29", 6)]
    elif kind == "site":
        p += ['<path d="M445 215 C380 230 365 290 382 365 L365 610 C350 655 385 681 410 631 L451 476 L485 493 L484 735 L538 735 L544 525 L655 525 L662 735 L716 735 L715 493 L750 476 L791 631 C816 681 851 655 836 610 L818 365 C835 290 820 230 755 215Z" fill="#fff" stroke="#163451" stroke-width="7"/>',
              '<ellipse cx="600" cy="440" rx="120" ry="70" fill="#a7cfe6" stroke="#2f87b7" stroke-width="5"/>',
              '<ellipse cx="404" cy="410" rx="28" ry="79" fill="#a7cfe6" stroke="#2f87b7" stroke-width="5"/>',
              '<ellipse cx="796" cy="410" rx="28" ry="79" fill="#a7cfe6" stroke="#2f87b7" stroke-width="5"/>',
              '<ellipse cx="510" cy="630" rx="27" ry="65" fill="#a7cfe6" stroke="#2f87b7" stroke-width="5"/>',
              '<ellipse cx="690" cy="630" rx="27" ry="65" fill="#a7cfe6" stroke="#2f87b7" stroke-width="5"/>']
    elif kind == "clean":
        p += ['<path d="M245 615 Q600 565 955 615" fill="none" stroke="#ad735d" stroke-width="10"/>',
              '<path d="M245 615 Q600 565 955 615 L955 730 H245Z" fill="#f3d2b7"/>',
              '<rect x="517" y="395" width="146" height="120" rx="9" fill="white" stroke="#2f87b7" stroke-width="6" transform="rotate(-18 590 455)"/>',
              arrow("M570 335 C450 340 430 490 500 540", "#2f87b7"),
              '<circle cx="955" cy="330" r="70" fill="white" stroke="#2f87b7" stroke-width="6"/>',
              '<path d="M927 330h56" stroke="#2f87b7" stroke-width="5"/>']
    elif kind == "inject":
        # Needle points down; the button is above and dose window stays on pen body.
        p += ['<path d="M240 790 Q600 750 960 790 L960 880 H240Z" fill="#f3d2b7" stroke="#ad735d" stroke-width="6"/>',
              pen(k, needle=True, dose="0", oy=-135, rotate=-90),
              arrow("M858 270 V355"), ring(1015,595,wait)]
    elif kind == "discard":
        p += [pen(k, needle=False, ox=-80, oy=-180),
              '<rect x="240" y="643" width="240" height="102" rx="18" fill="#d8e8f1" stroke="#163451" stroke-width="6"/>',
              '<path d="M270 690h180" stroke="#163451" stroke-width="6"/>',
              arrow("M300 580 C350 620 420 610 450 660"),
              '<rect x="765" y="580" width="195" height="180" rx="15" fill="#f4d49c" stroke="#163451" stroke-width="7"/>',
              '<rect x="790" y="550" width="145" height="36" rx="7" fill="#d98c36" stroke="#163451" stroke-width="6"/>',
              '<path d="M828 568h70" stroke="#163451" stroke-width="6"/>',
              arrow("M465 640 C580 695 690 695 770 635")]
    defs = '<defs><marker id="arrow" markerUnits="userSpaceOnUse" markerWidth="20" markerHeight="20" refX="18" refY="10" orient="auto"><path d="M1 2L18 10L1 18Z" fill="#e06f29"/></marker></defs>'
    title = f'{name}: {kind} (schematic)'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" role="img" aria-label="{escape(title)}"><title>{escape(title)}</title>{defs}<rect width="1200" height="900" fill="white"/><rect x="20" y="20" width="1160" height="860" rx="32" fill="none" stroke="#dce8ee" stroke-width="5"/>{"".join(p)}</svg>\n'

for key, config in PENS.items():
    directory = OUT / key
    directory.mkdir(parents=True, exist_ok=True)
    for i in range(config[5]):
        (directory / f"step-{i:02}.svg").write_text(draw(key, i), encoding="utf-8")
print(f"Wrote {sum(c[5] for c in PENS.values())} Day 15 SVG illustrations to {OUT}")
