"""Downscale oversized PNG/JPEG assets used on the public site."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]

JOBS = [
    (ROOT / "src/assets/kettlebell-badge.png", 720, 80, "PNG"),
    (ROOT / "src/assets/defit-logo.png", 384, 80, "PNG"),
    (ROOT / "public/h2f/infographic.jpg", 1400, 72, "JPEG"),
    (ROOT / "public/h2f/why-h2f.png", 1200, 80, "PNG"),
]


def compress(path: Path, max_width: int, quality: int, fmt: str) -> None:
    if not path.exists():
        print("skip missing", path)
        return
    before = path.stat().st_size
    with Image.open(path) as img:
        img = img.convert("RGBA") if fmt == "PNG" else img.convert("RGB")
        if img.width > max_width:
            height = int(img.height * (max_width / img.width))
            img = img.resize((max_width, height), Image.Resampling.LANCZOS)
        save_kwargs = {"optimize": True}
        if fmt == "JPEG":
            save_kwargs.update(quality=quality, progressive=True)
        elif fmt == "PNG":
            save_kwargs.update(optimize=True)
        img.save(path, format=fmt, **save_kwargs)
    after = path.stat().st_size
    print(f"{path.name}: {before} -> {after} ({after / before:.0%})")


if __name__ == "__main__":
    for job in JOBS:
        compress(*job)
