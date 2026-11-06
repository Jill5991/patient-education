#!/usr/bin/env python3
"""Build compact WebP copies of illustration PNGs without changing source art."""

from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import shutil
import subprocess


ROOT = Path(__file__).resolve().parents[1]
MAX_SIDE = 840
QUALITY = 86


def dimensions(path: Path) -> tuple[int, int]:
    with path.open("rb") as source:
        header = source.read(24)
    if header[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"Not a PNG: {path}")
    return int.from_bytes(header[16:20], "big"), int.from_bytes(header[20:24], "big")


def convert(source: Path) -> tuple[int, int]:
    destination = source.with_suffix(".webp")
    if destination.exists() and destination.stat().st_mtime >= source.stat().st_mtime:
        return source.stat().st_size, destination.stat().st_size
    width, height = dimensions(source)
    scale = min(1.0, MAX_SIDE / max(width, height))
    target_width, target_height = round(width * scale), round(height * scale)
    command = ["cwebp", "-quiet", "-q", str(QUALITY), "-m", "6"]
    if scale < 1:
        command += ["-resize", str(target_width), str(target_height)]
    command += [str(source), "-o", str(destination)]
    subprocess.run(command, check=True)
    return source.stat().st_size, destination.stat().st_size


def main() -> None:
    if not shutil.which("cwebp"):
        raise SystemExit("cwebp is required to build illustration WebP files")
    sources = sorted((ROOT / "assets").rglob("*.png"))
    with ThreadPoolExecutor(max_workers=4) as pool:
        sizes = list(pool.map(convert, sources))
    original = sum(before for before, _ in sizes)
    compact = sum(after for _, after in sizes)
    print(f"{len(sources)} images: {original / 1048576:.1f} MiB PNG -> {compact / 1048576:.1f} MiB WebP ({compact / original:.1%})")


if __name__ == "__main__":
    main()
