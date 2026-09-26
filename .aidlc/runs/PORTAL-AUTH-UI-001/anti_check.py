#!/usr/bin/env python3
"""Grades Antigravity's evidence for PORTAL-AUTH-UI-001 from raw files, live DB and service logs (frontend.md FE-15..FE-20)."""
import hashlib, json, os, re, subprocess, sys
from datetime import datetime

A = sys.argv[1]
DI = os.path.join(A, "../../../../../dev-infra")
MIN_TESTS = 86
ROUTES = ["login", "register", "activate", "forgot-password", "reset-password"]
# shot -> phrase the settled page must show (from the page's innerText dump <shot>.txt)
SHOTS = {"01-register-empty": "Nhân viên không tự đăng ký", "02-register-error": "ít nhất 12 ký tự",
         "03-register-ok": "Kiểm tra hộp thư", "04-activate-bad-token": "không hợp lệ", "05-activate-resent": "Đã gửi lại liên kết",
         "06-activate-ok": "Tài khoản đã được kích hoạt", "07-login-error": "không đúng", "08-login-customer-home": "Khám phá sản phẩm",
         "09-customer-console-blocked": "Khám phá sản phẩm", "10-login-staff-console": "Anti Staff",
         "11-forgot-ok": "Nếu email này có tài khoản", "12-reset-bad-token": "không hợp lệ", "13-reset-ok": "Đã đặt lại mật khẩu",
         "14-login-new-password": "Khám phá sản phẩm", "15-login-mobile": "Quên mật khẩu?"}
UNSETTLED = ("Đang tải", "Đang xác thực", "Compiling")
MIN_SPAN, MIN_GAP = 90, 2  # seconds: a person clicking through 15 screens, not a batch script
MAX_GAP_MIN, SPREAD = 15, 2.5  # UNMEASURED guess: only sample is a script run (gaps 6.6..8.3s, spread 1.26); set from a human baseline, then gate
SCRIPT_EXT = (".js", ".cjs", ".mjs", ".ts", ".py", ".sh")
STAFF_HEADER_DEBT = "Nguyễn Văn Quản"  # hardcoded navbar user, fixed by PORTAL-CONSOLE-SHELL-001
URLS = {"customer": "/", "customer-redirect": "/", "staff": "/console"}
env = dict(l.strip().split("=", 1) for l in open(f"{A}/run.env") if "=" in l)
RUN, EMAIL, STAFF = int(env["RUN"]), env["EMAIL"], env["STAFF"]
fails = []


def gate(name, ok, got):
    print(f"{'PASS' if ok else 'FAIL'} {name}: {got}")
    if not ok:
        fails.append(name)


def read(p):
    try:
        return open(os.path.join(A, p)).read()
    except OSError:
        return ""


def sql(db, q):
    r = subprocess.run(["docker", "compose", "exec", "-T", "postgres", "psql", "-U", "postgres", "-d", db, "-qAtc", q],
                       cwd=DI, capture_output=True, text=True)
    return r.stdout.strip()


def logs(container):
    r = subprocess.run(["docker", "logs", "--since", str(RUN), container], capture_output=True, text=True)
    return r.stdout + r.stderr


def since_run(col):
    return f"{col} >= to_timestamp({RUN})"


strip = lambda s: sorted(l for l in s.splitlines() if "PORTAL-AUTH-UI-001/anti" not in l)
before, after = strip(read("git_status_before.txt")), strip(read("git_status_after.txt"))
gate("G1 no file edited by tester", bool(read("preflight.txt")) and before == after, set(before) ^ set(after) or "clean")

m = re.search(r"Tests\s+(\d+) passed", read("unit.log"))
passed = int(m.group(1)) if m else 0
gate("G2 unit tests", read("unit.exit").strip() == "0" and passed >= MIN_TESTS and " failed" not in read("unit.log"),
     f"exit={read('unit.exit').strip() or 'missing'} passed={passed} (min {MIN_TESTS})")
gate("G2 archcheck 0 new", re.search(r"\b0 new\b", read("arch.log")) is not None, read("arch.log").strip().splitlines()[-1:] or "missing")

c = sql("auth_db", f"select status, {since_run('last_authenticated_at')}, {since_run('password_changed_at')} from users where email='{EMAIL}'")
gate("G3 customer registered, activated, logged in, reset (db)", c == "ACTIVE|t|t", c or "no user")
s = sql("auth_db", f"select status, {since_run('last_authenticated_at')} from users where email='{STAFF}'")
gate("G3 staff logged in (db)", s == "ACTIVE|t", s or "no staff (run anti.sh staff)")
tokens = set(sql("auth_db", f"select payload->'variables'->>'token' from outbox_events where payload->>'recipient'='{EMAIL}'").split())
used = set(read("ui/tokens.txt").split())
gate("G3 tokens came from outbox", len(used) >= 2 and used <= tokens, f"outbox={len(tokens)} used={len(used)} foreign={len(used - tokens)}")

urls = dict(l.split(None, 1) for l in read("ui/urls.txt").splitlines() if len(l.split(None, 1)) == 2)
path = lambda u: re.sub(r"^https?://[^/]+", "", u.strip()).split("?")[0] or "/"
gate("G4 login routes by audience", all(path(urls.get(k, "?")) == v for k, v in URLS.items()),
     {k: urls.get(k, "missing").strip() for k in URLS})

hashes, bad, text_bad, times = {}, [], [], []  # hash -> expected phrase: identical shots are fine only for the same screen state (08/09/14 = home)
for name, phrase in SHOTS.items():
    p = os.path.join(A, "ui", name + ".png")
    try:
        b = open(p, "rb").read()
    except OSError:
        bad.append(f"{name}:missing"); continue
    if not b.startswith(b"\x89PNG") or len(b) < 5000 or os.path.getmtime(p) < RUN:
        bad.append(f"{name}:invalid")
    h = hashlib.sha256(b).hexdigest()
    if hashes.setdefault(h, phrase) != phrase:
        bad.append(f"{name}:same image as a different state")
    times.append(os.path.getmtime(p))
    t = read(f"ui/{name}.txt")
    if phrase not in t or any(u in t for u in UNSETTLED):
        text_bad.append(f"{name}:{'no text' if not t else 'loading' if any(u in t for u in UNSETTLED) else 'missing ' + repr(phrase)}")
gate("G5 screenshots (FE-15)", not bad and len(times) == len(SHOTS), bad or f"{len(times)} shots, {len(hashes)} distinct images")
gate("G5 each screen settled and shows its state", not text_bad, text_bad or "all settled")
times.sort()
gaps = [b - a for a, b in zip(times, times[1:])]
span, min_gap = (times[-1] - times[0], min(gaps)) if gaps else (0, 0)
gate("G5 taken by hand, not a batch script", span >= MIN_SPAN and min_gap >= MIN_GAP,
     f"span={span:.0f}s (min {MIN_SPAN}) min_gap={min_gap:.1f}s (min {MIN_GAP})")
# a person's pace varies and U6/U13 need a terminal command; a script with sleep() gives near-equal gaps
max_gap = max(gaps) if gaps else 0
print(f"INFO pace, not gated until a human baseline exists: gaps {min_gap:.1f}..{max_gap:.1f}s "
      f"spread {max_gap / max(min_gap, 0.1):.2f} (script sample: 6.6..8.3s, spread 1.26)")
scripts = [f for f in os.listdir(A) if f.endswith(SCRIPT_EXT)]
gate("G5 no automation script", not scripts, scripts or "none")
# ponytail: pace baseline = 5 clean human runs appended here (outside anti/, which `start` wipes); then gate MAX_GAP_MIN/SPREAD
if not scripts and gaps and f"RUN={RUN} " not in read("../pace-samples.txt"):
    with open(os.path.join(A, "../pace-samples.txt"), "a") as f:
        f.write(f"RUN={RUN} gaps={min_gap:.1f}..{max_gap:.1f}s spread={max_gap / max(min_gap, 0.1):.2f} span={span:.0f}s\n")
print(f"INFO pace samples {len(read('../pace-samples.txt').splitlines())}/5 (need 5 human runs to set the pace gate)")
gate("G5 action log", len(read("ui/actions.log").splitlines()) >= len(SHOTS), f"{len(read('ui/actions.log').splitlines())} lines")

scores, lcp = {}, {}
for r in ROUTES:
    try:
        d = json.loads(read(f"lh/{r}.json"))
        fresh = datetime.fromisoformat(d["fetchTime"].replace("Z", "+00:00")).timestamp() >= RUN
        scores[r] = d["categories"]["accessibility"]["score"] if fresh and d["requestedUrl"].rstrip("/").endswith("/" + r) else "stale"
        lcp[r] = round(d["audits"]["largest-contentful-paint"]["numericValue"] / 1000, 1)
    except (ValueError, KeyError, TypeError):
        scores[r] = "missing"
gate("G6 lighthouse a11y >= 0.9 (FE-17)", all(isinstance(v, (int, float)) and v >= 0.9 for v in scores.values()), scores)
print(f"INFO LCP seconds on next dev, not gated (FE-18 needs a production build): {lcp}")

errs = re.findall(r'"path": "([^"]+)", "status": 5\d\d', logs("dcentervn-local-auth-1") + logs("dcentervn-local-org-1"))
gate("G7 0 responses >= 500 in auth/org (FE-19)", not errs, errs[:5] or "0")
console = read("ui/console.txt")
statuses = [int(x) for x in re.findall(r"status of (\d{3})", console)]
noise = re.compile(r"React DevTools|\[HMR\]|\[Fast Refresh\]|\[DOM\] Password forms|status of 40[01] |^Total messages: ")  # last = Playwright MCP dump header
bad_lines = [l.strip()[:100] for l in console.splitlines()
             if re.search(r"(?i)error|uncaught|failed|hydrat|warning", l) and not noise.search(l)]
gate("G7 browser console clean (FE-19)", bool(console) and not bad_lines and 401 in statuses,
     "console.txt missing" if not console else bad_lines[:3] or ("no 401 from U7: console not really captured" if 401 not in statuses else f"clean, expected 4xx={len(statuses)}"))
gate("G8 report", "Kết luận" in read("report.md"), "report.md present" if read("report.md") else "missing")

header = read("ui/10-login-staff-console.txt").split("Console vận hành")[0]
debt = STAFF_HEADER_DEBT in header or "Anti Staff" not in header
print(f"{'DEBT' if debt else 'PASS'} U10 console header shows the logged-in staff: "
      f"{'hardcoded ' + repr(STAFF_HEADER_DEBT) + ' -> PORTAL-CONSOLE-SHELL-001' if debt else 'Anti Staff'}")

print(f"\nVERDICT: {'PASS' if not fails else 'FAIL ' + ', '.join(fails)}{' (known debt: U10 header)' if debt else ''}")
sys.exit(1 if fails else 0)
