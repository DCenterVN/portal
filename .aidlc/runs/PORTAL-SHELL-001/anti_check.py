#!/usr/bin/env python3
from hashlib import sha256
from pathlib import Path
from struct import unpack
import sys

ROOT = Path(__file__).parent
EVIDENCE = ROOT / "evidence"
ROLES = ("customer", "employee", "platform")
THEMES = ("light", "dark")
WIDTHS = (390, 1440)


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        raise ValueError("not a PNG")
    return unpack(">II", data[16:24])


def main() -> int:
    errors: list[str] = []
    hashes: set[str] = set()
    expected = [f"{role}-{theme}-{width}.png" for role in ROLES for theme in THEMES for width in WIDTHS]

    for name in expected:
        path = EVIDENCE / name
        if not path.exists():
            errors.append(f"missing {name}")
            continue
        try:
            width, height = png_size(path)
        except ValueError as error:
            errors.append(f"{name}: {error}")
            continue
        expected_width = int(name.removesuffix(".png").rsplit("-", 1)[1])
        if width != expected_width or height < 700:
            errors.append(f"{name}: dimensions {width}x{height}")
        if path.stat().st_size < 20_000:
            errors.append(f"{name}: suspiciously small ({path.stat().st_size} bytes)")
        digest = sha256(path.read_bytes()).hexdigest()
        if digest in hashes:
            errors.append(f"{name}: duplicate image")
        hashes.add(digest)

    if not (ROOT / "ui-cases.md").exists():
        errors.append("missing ui-cases.md")
    if errors:
        print("FAIL PORTAL-SHELL-001 UI evidence")
        print("\n".join(f"- {error}" for error in errors))
        return 1
    print(f"PASS PORTAL-SHELL-001 UI evidence: {len(expected)}/{len(expected)} PNG")
    return 0


if __name__ == "__main__":
    sys.exit(main())
