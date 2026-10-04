#!/usr/bin/env python3
"""File-evidence grader for S9; synthetic self-tests never attest live UI."""
import argparse
import hashlib
import json
import math
import random
import re
import struct
import sys
import tempfile
import time
import zlib
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlsplit

CASES = tuple(f"UI-{n}" for n in range(1, 8))
THEMES = ("light", "dark")
WIDTHS = (375, 768, 1024, 1440)
CELLS = {(c, t, w) for c in CASES for t in THEMES for w in WIDTHS}
ROOT = Path(__file__).resolve().parent
CASE_ROUTES = {
    "UI-1": ("/",),
    "UI-2": ("/login", "/register", "/forgot-password", "/reset-password"),
    "UI-3": ("/console", "/branches", "/memberships", "/roles", "/inventory/shelves"),
    "UI-4": ("/products", "/products/[^/]+", "/cart", "/orders", "/me", "/production/targets", "/production/orders", "/production/qc"),
    "UI-5": ("/traceability/[^/]+",),
    "UI-6": ("/platform", "/company"),
}
CASE_ROUTES["UI-7"] = CASE_ROUTES["UI-1"] + CASE_ROUTES["UI-3"] + CASE_ROUTES["UI-4"] + CASE_ROUTES["UI-5"]
VI = "Bữa ăn tươi ngon: Nguyễn, tiếng Việt, ă â ê ô ơ ư đ á ề ỗ ự"


def stamp(value):
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp needs timezone")
    return parsed.timestamp()


def numeric(value):
    return type(value) in (int, float) and math.isfinite(value)


def contrast(foreground, background):
    def luminance(colour):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", colour):
            raise ValueError("computed colour must be opaque #RRGGBB")
        channels = [int(colour[n:n + 2], 16) / 255 for n in (1, 3, 5)]
        linear = [c / 12.92 if c <= .04045 else ((c + .055) / 1.055) ** 2.4 for c in channels]
        return sum(c * weight for c, weight in zip(linear, (.2126, .7152, .0722)))
    a, b = luminance(foreground), luminance(background)
    return (max(a, b) + .05) / (min(a, b) + .05)


def read_oracle(path):
    rows = {}
    pattern = r"\| (light|dark) \| ([\w-]+) (#[\da-fA-F]{6}) \| ([\w-]+) (#[\da-fA-F]{6}) \| [\d.]+:1 \| ([\d.]+):1 \|"
    for theme, fg_role, fg, bg_role, bg, threshold in re.findall(pattern, path.read_text()):
        rows[theme, fg_role, bg_role] = (fg.lower(), bg.lower(), float(threshold))
    if not rows:
        raise ValueError("empty contrast oracle")
    return rows


def check_contrasts(samples, theme, oracle):
    if not isinstance(samples, list) or not samples:
        raise ValueError("missing contrast samples")
    kinds = set()
    for sample in samples:
        kind = sample["kind"]
        threshold = {"text": 4.5, "ui": 3.0}[kind]
        fg, bg, minimum = oracle[theme, sample["fg_role"], sample["bg_role"]]
        measured = contrast(sample["foreground"], sample["background"])
        ratio = sample["ratio"]
        if (sample["foreground"].lower(), sample["background"].lower()) != (fg, bg):
            raise ValueError("computed colours outside approved oracle")
        # Mutation target: remove this entire condition to test contrast sensitivity.
        if not numeric(ratio) or measured < threshold or ratio < threshold or abs(ratio - measured) > .02 or minimum != threshold:
            raise ValueError("contrast below threshold or disagrees with computed oracle")
        kinds.add(kind)
    if kinds != {"text", "ui"}:
        raise ValueError("need both text and UI contrast")


def check_measurements(m, theme, oracle):
    for key in ("console_errors", "http_5xx"):
        if type(m[key]) is not int or m[key] != 0:
            raise ValueError(f"{key} must be integer zero")
    if m["horizontal_overflow"] is not False:
        raise ValueError("horizontal_overflow must be false")
    for key in ("Tab", "Shift+Tab", "Esc", "focus_visible", "reduced_motion"):
        if m["interaction"][key] is not True:
            raise ValueError(f"interaction {key} failed")
    fonts = m["fonts"]
    if fonts["sample"] != VI or fonts["ready"] is not True:
        raise ValueError("Vietnamese document.fonts evidence missing")
    for slot, name in (("heading", "Quicksand"), ("body", "Nunito")):
        record = fonts[slot]
        if name.lower() not in record["family"].lower() or record["check"] is not True:
            raise ValueError(f"{slot} font not loaded")
        if not record["loaded_faces"] or any(face["status"] != "loaded" or name.lower() not in face["family"].lower() for face in record["loaded_faces"]):
            raise ValueError(f"{slot} loaded faces missing")
        if not numeric(record["size_px"]) or record["size_px"] <= 0:
            raise ValueError("font size measurement missing")
    check_contrasts(m["contrasts"], theme, oracle)


def check_final_urls(cell):
    urls = cell.get("final_urls")
    if not isinstance(urls, list) or not urls or any(not isinstance(url, str) for url in urls):
        raise ValueError("final_urls must be a nonempty URL list")
    paths = []
    for value in urls:
        url = urlsplit(value)
        # Mutation target: never accept a login redirect as authenticated evidence.
        if url.path.rstrip("/") == "/login" and cell["case"] != "UI-2":
            raise ValueError("unauthenticated: final_url /login")
        if url.scheme != "http" or url.netloc != "127.0.0.1:3000" or url.fragment:
            raise ValueError("final_urls outside runner origin")
        if not any(re.fullmatch(route, url.path) for route in CASE_ROUTES[cell["case"]]):
            raise ValueError("final_urls path outside case routes")
        paths.append(url.path)
    if any(not any(re.fullmatch(route, path) for path in paths) for route in CASE_ROUTES[cell["case"]]):
        raise ValueError("final_urls missing case route coverage")
    screenshot_url = cell.get("screenshot_url")
    if isinstance(screenshot_url, str) and urlsplit(screenshot_url).path.rstrip("/") == "/login" and cell["case"] != "UI-2":
        raise ValueError("unauthenticated: screenshot_url /login")
    if not isinstance(screenshot_url, str) or screenshot_url not in urls:
        raise ValueError("screenshot_url must identify a captured final_urls entry")


def grade(out, oracle_path):
    if "out-run1" in out.resolve().parts:
        return ["archived evidence is not a grading input"], 0
    errors, blocked, hashes, seen = [], 0, set(), set()
    start = end = 0
    try:
        run = json.loads((out / "run.json").read_text())
        start, end = stamp(run["start"]), stamp(run["end"])
        if not (0 < start < end <= time.time() + 60 and 120 <= end - start <= 86400):
            raise ValueError("implausible run window (120..86400 seconds)")
        if type(run["exit_code"]) is not int or run["exit_code"] != 0:
            raise ValueError("runner failed")
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        errors.append(f"run: {exc}")
    try:
        log = (out / "build.log").read_text()
        if not re.search(r"Route\s*\(", log) or "Compiled successfully" not in log:
            raise ValueError("route table / Compiled successfully missing")
        routes = set(re.findall(r"(?:[○●ƒλ]\s+|[├└]\s*[─ ]*)(/\S*)", log))
        if not {"/", "/login", "/console"} <= routes:
            raise ValueError("route table required routes missing")
    except (OSError, ValueError) as exc:
        errors.append(f"build: {exc}")
    for route, name in (("/", "home"), ("/login", "login"), ("/console", "console")):
        for form in ("mobile", "desktop"):
            label = f"lh-{name}-{form}"
            try:
                lh = json.loads((out / f"{label}.json").read_text())
                if not start <= stamp(lh["fetchTime"]) <= end:
                    raise ValueError("fetchTime outside run window")
                url = urlsplit(lh["finalUrl"])
                if url.scheme != "http" or url.netloc != "127.0.0.1:3000" or url.path != route or url.query or url.fragment:
                    raise ValueError(f"finalUrl does not match {route}")
                score = lh["categories"]["accessibility"]["score"]
                if not numeric(score) or not .90 <= score <= 1:
                    raise ValueError("a11y <0.90 or invalid")
                if lh.get("runtimeError") or lh["configSettings"]["formFactor"] != form:
                    raise ValueError("runtimeError or wrong formFactor")
                items = lh["audits"]["resource-summary"]["details"]["items"]
                scripts = [item["transferSize"] for item in items if item["resourceType"] == "script"]
                if len(scripts) != 1 or not numeric(scripts[0]) or scripts[0] < 0:
                    raise ValueError("script transferSize missing/invalid")
                # Mutation target: script transfer-size ceiling, decimal kB.
                if scripts[0] > 200000:
                    raise ValueError("script transferSize >200 kB")
                total = lh["audits"]["total-byte-weight"]["numericValue"]
                if not numeric(total) or total < scripts[0]:
                    raise ValueError("total-byte-weight missing/invalid")
                lcp = lh["audits"]["largest-contentful-paint"]["numericValue"]
                if not numeric(lcp) or lcp < 0:
                    raise ValueError("LCP missing/invalid")
                if form == "mobile" and lcp > 2500:
                    raise ValueError("mobile LCP >2500 ms")
            except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
                errors.append(f"{label}: {exc}")
    try:
        oracle = read_oracle(oracle_path)
        data = json.loads((out / "cases.json").read_text())
        if data["schema"] != "portal-s9/1" or not isinstance(data["cells"], list):
            raise ValueError("wrong cases schema")
        for index, cell in enumerate(data["cells"]):
            label = f"cell[{index}]"
            try:
                key = cell["case"], cell["theme"], cell["viewport"]
                label = "-".join(map(str, key))
                if type(key[2]) is not int or key not in CELLS or key in seen:
                    raise ValueError("unexpected/duplicate cell")
                seen.add(key)
                status = cell["status"]
                if status not in ("PASS", "FAIL", "BLOCKED"):
                    raise ValueError("invalid status")
                if not start <= stamp(cell["captured_at"]) <= end:
                    raise ValueError("captured_at outside run window")
                if status == "BLOCKED":
                    blocked += 1
                    if not isinstance(cell.get("reason"), str) or not cell["reason"].strip():
                        raise ValueError("BLOCKED needs reason")
                    continue
                check_final_urls(cell)
                if status == "FAIL":
                    errors.append(f"{label}: recorded FAIL ({cell.get('reason', 'no reason')})")
                if status == "PASS":
                    check_measurements(cell["measurements"], key[1], oracle)
                path = out / "shots" / f"{label}.png"
                image = path.read_bytes()
                if len(image) < 24 or image[:8] != b"\x89PNG\r\n\x1a\n" or image[12:16] != b"IHDR":
                    raise ValueError("not PNG/IHDR")
                width, height = struct.unpack(">II", image[16:24])
                if width != key[2] or height <= 0 or len(image) <= 20 * 1024:
                    raise ValueError("wrong-width PNG or <=20 KiB")
                digest = hashlib.sha256(image).hexdigest()
                if digest in hashes:
                    raise ValueError("duplicate screenshot hash")
                hashes.add(digest)
            except (OSError, ValueError, KeyError, TypeError, AttributeError, struct.error) as exc:
                errors.append(f"{label}: {exc}")
        missing = CELLS - seen
        if missing:
            errors.append(f"missing cell: {sorted(missing)}")
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        errors.append(f"cases: {exc}")
    return errors, blocked


def fixture(out):
    """Independent synthetic positives: genuine PNG encoding, no real UI claims."""
    now = int(time.time())
    iso = lambda ts: datetime.fromtimestamp(ts, timezone.utc).isoformat()
    out.mkdir()
    (out / "shots").mkdir()
    (out / "run.json").write_text(json.dumps({"start": iso(now - 600), "end": iso(now), "exit_code": 0}))
    (out / "build.log").write_text("Compiled successfully\nRoute (app)\n┌ ○ /\n├ ○ /login\n└ ƒ /console\n")
    oracle = out / "oracle.md"
    oracle.write_text("| light | ink #2A1D17 | surface #FFFFFF | 16.32:1 | 4.5:1 |\n| light | focus #B93623 | surface #FFFFFF | 5.81:1 | 3.0:1 |\n| dark | ink #F8EFE5 | surface #2A211C | 13.86:1 | 4.5:1 |\n| dark | focus #F07A5F | surface #2A211C | 5.74:1 | 3.0:1 |\n")
    cells = []
    rng = random.Random(901)
    for case, theme, width in sorted(CELLS):
        palette = ("#2A1D17", "#B93623", "#FFFFFF") if theme == "light" else ("#F8EFE5", "#F07A5F", "#2A211C")
        # Constants below are independently rounded expected ratios, not copied from validator.
        ratios = (16.3224, 5.8118) if theme == "light" else (13.8553, 5.7445)
        samples = [dict(kind=kind, fg_role=role, bg_role="surface", foreground=fg, background=palette[2], ratio=ratio) for kind, role, fg, ratio in zip(("text", "ui"), ("ink", "focus"), palette[:2], ratios)]
        fonts = {"sample": VI, "ready": True}
        for slot, name, size in (("heading", "Quicksand", 24), ("body", "Nunito", 16)):
            fonts[slot] = {"family": name, "size_px": size, "check": True, "loaded_faces": [{"family": name, "status": "loaded"}]}
        measurements = dict(contrasts=samples, fonts=fonts, console_errors=0, http_5xx=0, horizontal_overflow=False, interaction={k: True for k in ("Tab", "Shift+Tab", "Esc", "focus_visible", "reduced_motion")})
        cells.append(dict(case=case, theme=theme, viewport=width, status="PASS", captured_at=iso(now - 60), measurements=measurements, final_urls=["http://127.0.0.1:3000" + route for route in {"UI-1": ["/"], "UI-2": ["/login", "/register", "/forgot-password", "/reset-password"], "UI-3": ["/console", "/branches", "/memberships", "/roles", "/inventory/shelves"], "UI-4": ["/products", "/products/seeded-id", "/cart", "/orders", "/me", "/production/targets", "/production/orders", "/production/qc"], "UI-5": ["/traceability/seeded-code"], "UI-6": ["/platform", "/company"], "UI-7": ["/", "/console", "/products", "/products/seeded-id", "/cart", "/orders", "/me", "/production/targets", "/production/orders", "/production/qc", "/branches", "/memberships", "/roles", "/inventory/shelves", "/traceability/seeded-code"]}[case]]))
        def chunk(name, payload):
            return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", zlib.crc32(name + payload))
        pixels = b"".join(b"\0" + rng.randbytes(width) for _ in range(80))
        image = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, 80, 8, 0, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(pixels)) + chunk(b"IEND", b"")
        (out / "shots" / f"{case}-{theme}-{width}.png").write_bytes(image)
    for cell in cells:
        cell["screenshot_url"] = cell["final_urls"][0]
    (out / "cases.json").write_text(json.dumps({"schema": "portal-s9/1", "cells": cells}))
    for name, route in (("home", "/"), ("login", "/login"), ("console", "/console")):
        for form in ("mobile", "desktop"):
            lh = {"fetchTime": iso(now - 30), "finalUrl": f"http://127.0.0.1:3000{route}", "categories": {"accessibility": {"score": .95}}, "configSettings": {"formFactor": form}, "audits": {"largest-contentful-paint": {"numericValue": 2400}, "resource-summary": {"details": {"items": [{"resourceType": "script", "transferSize": 190000}]}}, "total-byte-weight": {"numericValue": 350000}}}
            (out / f"lh-{name}-{form}.json").write_text(json.dumps(lh))
    return oracle


def self_test():
    results = []
    with tempfile.TemporaryDirectory(prefix="portal-s9-self-") as directory:
        out = Path(directory) / "out"
        oracle = fixture(out)
        errors, blocked = grade(out, oracle)
        results.append(("positive fixture", not errors and blocked == 0))
        if errors:
            print("positive errors:", errors)
        original = {p: p.read_bytes() for p in out.rglob("*") if p.is_file()}
        trials = (("missing cell", "missing cell"), ("PASS without measurements", "measurements"), ("contrast 4.3", "contrast"), ("duplicate screenshot", "duplicate screenshot"), ("wrong-width PNG", "wrong-width PNG"), ("LH a11y 0.89", "a11y"), ("LH script 210 kB", "script transferSize"), ("build without route table", "route table"), ("authenticated final_url /login", "unauthenticated"), ("missing final_urls", "final_urls"), ("authenticated screenshot /login", "unauthenticated"), ("LH fetchTime outside window", "fetchTime"), ("mobile LCP 2501", "LCP"))
        for name, expected in trials:
            for path, content in original.items():
                path.write_bytes(content)
            data = json.loads((out / "cases.json").read_text())
            lh_path = out / "lh-home-mobile.json"
            lh = json.loads(lh_path.read_text())
            if name == "missing cell":
                data["cells"].pop()
            elif name == "PASS without measurements":
                data["cells"][0].pop("measurements")
            elif name == "contrast 4.3":
                data["cells"][0]["measurements"]["contrasts"][0]["ratio"] = 4.3
            elif name == "duplicate screenshot":
                (out / "shots/UI-2-light-375.png").write_bytes((out / "shots/UI-1-light-375.png").read_bytes())
            elif name == "wrong-width PNG":
                path = out / "shots/UI-1-light-375.png"
                image = bytearray(path.read_bytes())
                image[16:20] = struct.pack(">I", 376)
                image[29:33] = struct.pack(">I", zlib.crc32(image[12:29]))
                path.write_bytes(image)
            elif name == "LH a11y 0.89":
                lh["categories"]["accessibility"]["score"] = .89
            elif name == "LH script 210 kB":
                lh["audits"]["resource-summary"]["details"]["items"][0]["transferSize"] = 210000
            elif name == "build without route table":
                (out / "build.log").write_text("Compiled successfully\n")
            elif name == "authenticated final_url /login":
                cell = next(c for c in data["cells"] if c["case"] == "UI-3")
                cell["final_urls"] = ["http://127.0.0.1:3000/login"]
            elif name == "authenticated screenshot /login":
                cell = next(c for c in data["cells"] if c["case"] == "UI-4")
                cell["screenshot_url"] = "http://127.0.0.1:3000/login"
            elif name == "missing final_urls":
                data["cells"][0].pop("final_urls")
            elif name == "LH fetchTime outside window":
                lh["fetchTime"] = "2000-01-01T00:00:00Z"
            elif name == "mobile LCP 2501":
                lh["audits"]["largest-contentful-paint"]["numericValue"] = 2501
            (out / "cases.json").write_text(json.dumps(data))
            lh_path.write_text(json.dumps(lh))
            errors, blocked = grade(out, oracle)
            results.append((f"reject {name}", bool(errors) and any(expected in e for e in errors)))
        for path, content in original.items():
            path.write_bytes(content)
        data = json.loads((out / "cases.json").read_text())
        data["cells"][0].update(status="BLOCKED", reason="real seeded role account unavailable")
        data["cells"][0].pop("measurements")
        (out / "cases.json").write_text(json.dumps(data))
        errors, blocked = grade(out, oracle)
        results.append(("BLOCKED distinct from PASS (exit 2)", not errors and blocked == 1 and verdict(errors, blocked) == 2))
    for name, ok in results:
        print(f"{'PASS' if ok else 'FAIL'} self-test {name}")
    passed = sum(ok for _, ok in results)
    print(f"SELF-TEST: {passed}/{len(results)} {'PASS' if passed == len(results) else 'FAIL'} (synthetic fixtures only)")
    return int(passed != len(results))


def verdict(errors, blocked):
    return 1 if errors else 2 if blocked else 0


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("out", nargs="?", type=Path, default=ROOT / "out")
    parser.add_argument("--oracle", type=Path, default=ROOT.parent / "testkit/contrast-table.md")
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        return self_test()
    errors, blocked = grade(args.out, args.oracle)
    for error in errors:
        print(f"FAIL {error}")
    code = verdict(errors, blocked)
    print(f"BLOCKED cells: {blocked}/56")
    print(f"VERDICT: {('PASS', 'FAIL', 'BLOCKED')[code]} errors={len(errors)} blocked={blocked}")
    return code


if __name__ == "__main__":
    sys.exit(main())
