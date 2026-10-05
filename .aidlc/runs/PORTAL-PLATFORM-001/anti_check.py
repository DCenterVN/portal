#!/usr/bin/env python3
"""Grader for Anti's UI run. Numbers come from files, DB and git, never from Anti's report."""
from __future__ import annotations
import hashlib
import json
import re
import statistics
import subprocess
import struct
import sys
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent
EVIDENCE = ROOT / "evidence"
# Per route: the four states that screen really has (a module list or a matrix is never empty).
ROUTES = {
    "companies": ("loading", "empty", "error", "success"),
    "company": ("loading", "notfound", "readonly", "success"),
    "matrix": ("loading", "notfound", "readonly", "success"),
    "support": ("loading", "empty", "error", "success"),
    "staff": ("loading", "denied", "error", "success"),
    "audit": ("loading", "empty", "error", "success"),
    "my-company": ("loading", "picker", "error", "success"),
    "company-support": ("loading", "empty", "error", "success"),
}
# Interaction captures, desktop only.
FLOWS = (
    "onboard-validation", "onboard-success", "module-confirm", "core-locked", "matrix-edit", "matrix-400",
    "breakglass-confirm", "breakglass-409", "staff-409-duplicate", "consent-saved", "owner-approve",
    "owner-409", "customer-denied", "dark-companies",
    "matrix-typing", "module-scheduled", "support-org-down",
)
VIEWPORTS = {"1440": (1440, 0), "390": (390, 0)}


def png_size(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise ValueError("invalid PNG signature")
    offset = 8
    seen_header = False
    while offset + 12 <= len(data):
        size = struct.unpack(">I", data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        end = offset + 12 + size
        if end > len(data):
            raise ValueError("truncated PNG chunk")
        payload = data[offset + 8:offset + 8 + size]
        expected_crc = struct.unpack(">I", data[offset + 8 + size:end])[0]
        if zlib.crc32(kind + payload) & 0xffffffff != expected_crc:
            raise ValueError("bad PNG chunk checksum")
        if kind == b"IHDR":
            if seen_header or size != 13:
                raise ValueError("invalid IHDR")
            width, height = struct.unpack(">II", payload[:8])
            seen_header = True
        if kind == b"IEND":
            if size or end != len(data) or not seen_header:
                raise ValueError("invalid IEND")
            return width, height
        offset = end
    raise ValueError("missing PNG end")


def validate() -> list[str]:
    errors: list[str] = []
    hashes: dict[str, str] = {}
    for slug, states in ROUTES.items():
        route = slug
        for state in states:
            for width in ("1440", "390"):
                path = EVIDENCE / f"{route}-{state}-{width}.png"
                if not path.is_file():
                    errors.append(f"missing screenshot: {path.name}")
                    continue
                try:
                    actual_width, actual_height = png_size(path)
                    if actual_width != int(width) or actual_height < 300:
                        errors.append(f"wrong viewport size: {path.name} is {actual_width}x{actual_height}")
                    digest = __import__("hashlib").sha256(path.read_bytes()).hexdigest()
                    if digest in hashes:
                        errors.append(f"duplicate screenshot: {path.name} = {hashes[digest]}")
                    hashes[digest] = path.name
                except (OSError, ValueError, struct.error) as exc:
                    errors.append(f"invalid screenshot {path.name}: {exc}")
        scores: list[float] = []
        lcp: list[float] = []
        for run in range(1, 4):
            report = EVIDENCE / f"{slug}.lighthouse-run{run}.json"
            if not report.is_file():
                errors.append(f"missing Lighthouse report: {report.name}")
                continue
            try:
                result = json.loads(report.read_text())
                score = result["categories"]["accessibility"]["score"]
                lcp_value = result["audits"]["largest-contentful-paint"]["numericValue"]
                if not isinstance(score, (int, float)) or not isinstance(lcp_value, (int, float)):
                    raise ValueError("score and LCP must be numeric")
                scores.append(float(score)); lcp.append(float(lcp_value))
            except (OSError, KeyError, ValueError, TypeError, json.JSONDecodeError) as exc:
                errors.append(f"invalid Lighthouse report {report.name}: {exc}")
        if len(scores) == 3 and min(scores) < 0.90:
            errors.append(f"accessibility below 0.90: {slug}")
        if len(lcp) == 3 and statistics.median(lcp) > 2500:
            errors.append(f"median mobile LCP above 2500ms: {slug}")
    for flow in FLOWS:
        path = EVIDENCE / f"flow-{flow}-1440.png"
        if not path.is_file():
            errors.append(f"missing flow screenshot: {path.name}")
            continue
        try:
            png_size(path)
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            if digest in hashes:
                errors.append(f"duplicate screenshot: {path.name} = {hashes[digest]}")
            hashes[digest] = path.name
        except (OSError, ValueError, struct.error) as exc:
            errors.append(f"invalid screenshot {path.name}: {exc}")
    expected = 64 + len(FLOWS)
    if len(hashes) != expected:
        errors.append(f"expected {expected} distinct screenshots, found {len(hashes)}")
    return errors + run_checks()


def psql(db: str, sql: str) -> str:
    out = subprocess.run(["docker", "exec", "dcentervn-local-postgres-1", "psql", "-U", "postgres", "-d", db, "-Atc", sql],
                         capture_output=True, text=True, timeout=30)
    if out.returncode:
        raise RuntimeError(out.stderr.strip())
    return out.stdout.strip()


def run_checks() -> list[str]:
    """RUN marker in DB, untouched repo, no automation scripts."""
    errors: list[str] = []
    marker = EVIDENCE / "run.json"
    try:
        run = json.loads(marker.read_text())
        run_id, started = str(run["run_id"]), str(run["started_at"])
        if not re.fullmatch(r"[A-Z0-9]{4,12}", run_id):
            raise ValueError("run_id must be 4-12 upper-case letters/digits")
    except (OSError, KeyError, ValueError, json.JSONDecodeError) as exc:
        return [f"invalid evidence/run.json: {exc}"]
    code = f"ANTI-{run_id}"
    try:
        root = psql("org_db", f"select id from branches where code = '{code}' and created_at >= '{started}'::timestamptz")
        if not root:
            errors.append(f"DB: no company {code} created after {started} (onboard was not done in the UI)")
        else:
            actions = set(psql("org_db", f"select distinct action from audit_logs where coalesce(root_branch_id, on_behalf_of_root_branch_id) = '{root}'").split())
            for need in ("support_access.break_glass",):
                if need not in actions:
                    errors.append(f"DB: audit for {code} lacks {need}")
            modes = set(psql("org_db", f"select mode from support_access_grants where root_branch_id = '{root}' and approved_by_user_id is not null").split())
            if "OWNER_APPROVED" not in modes:
                errors.append(f"DB: no OWNER_APPROVED grant on {code} (OWNER approve flow not done)")
    except (RuntimeError, subprocess.TimeoutExpired, FileNotFoundError) as exc:
        errors.append(f"DB check failed: {exc}")
    baseline = (EVIDENCE / "git-baseline.txt").read_text().splitlines() if (EVIDENCE / "git-baseline.txt").is_file() else None
    status = subprocess.run(["git", "status", "--porcelain"], cwd=ROOT.parents[2], capture_output=True, text=True).stdout.splitlines()
    now = sorted(line for line in status if "PORTAL-PLATFORM-001" not in line)
    if baseline is None:
        errors.append("missing evidence/git-baseline.txt")
    elif now != sorted(baseline):
        errors.append("git status changed outside the evidence folder: " + "; ".join(sorted(set(now) ^ set(baseline))))
    mine = {"seed-fixtures.sh", "reset-login-limit.sh"}
    scripts = [p.name for p in EVIDENCE.rglob("*") if p.suffix in {".js", ".ts", ".py", ".sh", ".mjs"} and p.name not in mine]
    if scripts:
        errors.append("automation scripts are not allowed in evidence/: " + ", ".join(sorted(scripts)))
    return errors


if __name__ == "__main__":
    problems = validate()
    if problems:
        print("BLOCKED: UI evidence is incomplete or failed")
        for problem in problems:
            print(f"- {problem}")
        sys.exit(1)
    print(f"PASS: {64 + len(FLOWS)} distinct screenshots; 24 Lighthouse reports meet thresholds; DB run marker and git clean")
