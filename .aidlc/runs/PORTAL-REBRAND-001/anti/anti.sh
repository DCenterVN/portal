#!/usr/bin/env bash
set -euo pipefail
umask 077
ANTI="$(cd "$(dirname "$0")" && pwd)"
PORTAL="$(cd "$ANTI/../../../.." && pwd)"
OUT="$ANTI/out"
cd "$PORTAL"
PHASE="${1:-}"
SECRET_DIR=''

blocked() { echo "BLOCKED $*" >&2; exit 2; }

make_secrets() {
  SECRET_DIR="$(mktemp -d /tmp/portal-anti-secrets.XXXXXXXX)"
  printf '%s\n' "$SECRET_DIR" > "$OUT/secret-dir.txt"
}

# PID reuse is not ownership. Verify the recorded Linux start time and group.
process_stamp() {
  python3 - "$1" <<'PY'
import pathlib, sys
try:
    fields = pathlib.Path('/proc/' + sys.argv[1] + '/stat').read_text().rsplit(') ', 1)[1].split()
    if fields[0] == 'Z' or fields[2] != sys.argv[1]:
        sys.exit(1)
    print(fields[19])
except OSError:
    sys.exit(1)
PY
}

record_process() {
  local name=$1 pid=$2 stamp=''
  printf '%s\n' "$pid" > "$OUT/$name.pid"
  for ((attempt=0; attempt<50; attempt++)); do
    stamp="$(process_stamp "$pid" || true)"
    [[ -z "$stamp" ]] || break
    sleep .1
  done
  [[ -n "$stamp" ]] || blocked "$name process did not start"
  printf '%s\n' "$stamp" > "$OUT/$name.start"
}

stop_process() {
  local name=$1 pid stamp current
  [[ -f "$OUT/$name.pid" && -f "$OUT/$name.start" ]] || return 0
  pid="$(cat "$OUT/$name.pid")"
  stamp="$(cat "$OUT/$name.start")"
  [[ "$pid" =~ ^[0-9]+$ ]] || return 0
  current="$(process_stamp "$pid" || true)"
  [[ -n "$current" && "$current" == "$stamp" ]] || return 0
  kill -TERM -- "-$pid" 2>/dev/null || true
  for ((attempt=0; attempt<50; attempt++)); do
    current="$(process_stamp "$pid" || true)"
    [[ "$current" == "$stamp" ]] || return 0
    sleep .1
  done
  kill -KILL -- "-$pid" 2>/dev/null || true
}

finalize() {
  local code=$1
  stop_process brave
  stop_process server
  if [[ -f "$OUT/secret-dir.txt" ]]; then
    local secrets
    secrets="$(cat "$OUT/secret-dir.txt")"
    if [[ "$secrets" =~ ^/tmp/portal-anti-secrets\.[A-Za-z0-9]+$ ]]; then
      rm -rf -- "$secrets"
    fi
  fi
  if [[ -f "$OUT/brave-profile.txt" ]]; then
    local profile
    profile="$(cat "$OUT/brave-profile.txt")"
    if [[ "$profile" =~ ^/tmp/portal-anti-brave\.[A-Za-z0-9]+$ ]]; then
      rm -rf -- "$profile"
    fi
  fi
  git diff --binary HEAD > "$OUT/tracked-after.diff"
  if ! cmp -s "$OUT/tracked-before.diff" "$OUT/tracked-after.diff"; then
    echo 'FAIL tracked files changed during run; preserve evidence, do not repair.' >&2
    code=1
  fi
  python3 - "$OUT/run.json" "$code" <<'PY'
import json, sys
from datetime import datetime, timezone
path = sys.argv[1]
with open(path) as file:
    run = json.load(file)
code = int(sys.argv[2])
previous = run.get('phase_exit_code', 0)
code = 1 if 1 in (code, previous) else code or previous
run.update(end=datetime.now(timezone.utc).isoformat(), exit_code=code)
with open(path, 'w') as file:
    json.dump(run, file, indent=2)
sys.exit(code)
PY
}

phase_exit() {
  local code=$?
  trap - EXIT INT TERM
  [[ -z "$SECRET_DIR" ]] || rm -rf -- "$SECRET_DIR"
  if [[ "$PHASE" == start && "$code" != 0 ]]; then
    finalize "$code" || code=$?
  elif [[ "$PHASE" == lighthouse && "$code" != 0 ]]; then
    python3 - "$OUT/run.json" "$code" <<'PY'
import json, sys
p = sys.argv[1]
with open(p) as f:
    run = json.load(f)
run['phase_exit_code'] = int(sys.argv[2])
with open(p, 'w') as f:
    json.dump(run, f, indent=2)
PY
  fi
  exit "$code"
}

login() {
  local account=$1
  # Credentials only enter private /tmp files; never argv, logs, or repo.
  python3 - "$ANTI/accounts.local.md" "$account" "$SECRET_DIR/body.json" <<'PY'
import json, pathlib, re, sys
try:
    text = pathlib.Path(sys.argv[1]).read_text()
    password = re.search(r'^PASSWORD:\s*(.+)$', text, re.M)[1].strip().strip('`')
    emails = [row.split('|')[2].strip().strip('`') for row in text.splitlines()
              if row.startswith('|') and len(row.split('|')) == 6
              and row.split('|')[2].strip().strip('`').split('@')[0] == sys.argv[2]]
    if len(emails) != 1:
        raise ValueError()
    pathlib.Path(sys.argv[3]).write_text(json.dumps(dict(email=emails[0], password=password)))
except (OSError, TypeError, ValueError, IndexError):
    print('BLOCKED required seeded account unavailable', file=sys.stderr)
    sys.exit(2)
PY
  : > "$SECRET_DIR/response.headers"
  LOGIN_CODE="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 \
    --request POST --header 'Content-Type: application/json' \
    --data-binary "@$SECRET_DIR/body.json" --dump-header "$SECRET_DIR/response.headers" \
    http://127.0.0.1:3000/api/auth/login || true)"
  [[ "$LOGIN_CODE" == 200 ]] || blocked "login BFF ${LOGIN_CODE:-000}"
  rm -f -- "$SECRET_DIR/body.json"
}

case "$PHASE" in
  start)
    [[ ! -e "$OUT/run.json" ]] || { echo 'Run already exists. Stop; no rerun until green, no evidence overwrite.' >&2; exit 1; }
    mkdir -p "$OUT/shots"
    python3 - "$OUT/run.json" <<'PY'
import json, sys
from datetime import datetime, timezone
with open(sys.argv[1], 'x') as file:
    json.dump({'start': datetime.now(timezone.utc).isoformat(), 'end': None, 'exit_code': None}, file)
PY
    git diff --binary HEAD > "$OUT/tracked-before.diff"
    trap phase_exit EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    for port in 3000 9222; do
      if python3 - "$port" <<'PY'
# ANTI_PORT_PROBE: any TCP listener, including a non-HTTP foreign process.
import socket, sys
with socket.socket() as sock:
    sock.settimeout(2)
    sys.exit(0 if sock.connect_ex(('127.0.0.1', int(sys.argv[1]))) == 0 else 1)
PY
      then
        blocked "port $port already occupied; do not kill another process."
      fi
    done
    unset npm_config_cache
    export NPM_CONFIG_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/portal-anti-npm"
    CHROME_PATH="$(command -v brave-browser || command -v brave || true)"
    [[ -n "$CHROME_PATH" ]] || blocked 'Brave unavailable'
    [[ -f "$PORTAL/.env.local" ]] || blocked 'portal .env.local unavailable'
    npm run build 2>&1 | tee "$OUT/build.log"
    mkdir -p .next/standalone/.next
    cp -a .next/static .next/standalone/.next/
    cp -a public .next/standalone/
    # Node 22 loads dotenv for this process only; never copy or source secrets.
    HOSTNAME=127.0.0.1 PORT=3000 setsid node --env-file="$PORTAL/.env.local" \
      .next/standalone/server.js > "$OUT/server.log" 2>&1 < /dev/null &
    record_process server "$!"
    ready=0
    for ((attempt=0; attempt<60; attempt++)); do
      if [[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 2 http://127.0.0.1:3000/login || true)" == 200 ]]; then
        ready=1
        break
      fi
      kill -0 "$(cat "$OUT/server.pid")" 2>/dev/null || break
      sleep 1
    done
    [[ "$ready" == 1 ]] || blocked '/login never returned 200'
    make_secrets
    login customer.s9
    BRAVE_PROFILE="$(mktemp -d /tmp/portal-anti-brave.XXXXXXXX)"
    printf '%s\n' "$BRAVE_PROFILE" > "$OUT/brave-profile.txt"
    setsid "$CHROME_PATH" --user-data-dir="$BRAVE_PROFILE" --remote-debugging-port=9222 \
      --no-first-run --no-default-browser-check http://127.0.0.1:3000/login \
      > "$OUT/brave.log" 2>&1 < /dev/null &
    record_process brave "$!"
    echo 'Ready. Record UI-1..UI-7 in this Brave window, then run anti.sh lighthouse and anti.sh stop.'
    ;;
  lighthouse)
    [[ -f "$OUT/run.json" ]] || blocked 'start phase missing'
    python3 - "$OUT/run.json" <<'PY'
import json, sys
with open(sys.argv[1]) as f:
    r = json.load(f)
if r['end'] is not None or r.get('lighthouse_started'):
    print('BLOCKED run ended or Lighthouse already attempted', file=sys.stderr)
    sys.exit(2)
r['lighthouse_started'] = True
with open(sys.argv[1], 'w') as f:
    json.dump(r, f, indent=2)
PY
    trap phase_exit EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    make_secrets
    for route in home login console; do
      url_path="/$route"
      [[ "$route" != home ]] || url_path='/'
      headers=()
      if [[ "$route" == console ]]; then
        login employee.s9
        python3 - "$SECRET_DIR/response.headers" "$SECRET_DIR/lh-headers.json" <<'PY'
import json, pathlib, sys
from http.cookies import SimpleCookie
cookies = SimpleCookie()
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
    if line.lower().startswith('set-cookie:'):
        cookies.load(line.split(':', 1)[1].strip())
if 'access_token' not in cookies:
    print('BLOCKED login BFF missing access_token cookie', file=sys.stderr)
    sys.exit(2)
pathlib.Path(sys.argv[2]).write_text(json.dumps({'Cookie': 'access_token=' + cookies['access_token'].value}))
PY
        headers+=("--extra-headers=$SECRET_DIR/lh-headers.json")
      fi
      for form in mobile desktop; do
        flags=()
        [[ "$form" != desktop ]] || flags+=(--preset=desktop)
        npx --yes lighthouse "http://127.0.0.1:3000$url_path" --port=9222 \
          "${flags[@]}" "${headers[@]}" --output=json --output-path="$SECRET_DIR/lh.json" \
          > "$SECRET_DIR/lh.log" 2>&1
        # Lighthouse can echo extraHeaders in JSON/logs. Strip credential
        # values before publishing JSON; audit measurements stay unchanged.
        python3 - "$SECRET_DIR/lh.json" "$SECRET_DIR/response.headers" "$OUT/lh-$route-$form.json" <<'PY'
import json, pathlib, sys
from http.cookies import SimpleCookie
content = pathlib.Path(sys.argv[1]).read_text()
cookies = SimpleCookie()
header = pathlib.Path(sys.argv[2])
if header.exists():
    for line in header.read_text().splitlines():
        if line.lower().startswith('set-cookie:'):
            cookies.load(line.split(':', 1)[1].strip())
    for cookie in cookies.values():
        if cookie.value:
            content = content.replace(cookie.value, '<redacted>')
report = json.loads(content)
report.get('configSettings', {}).pop('extraHeaders', None)
pathlib.Path(sys.argv[3]).write_text(json.dumps(report))
PY
        if [[ "$route" == console ]]; then
          python3 - "$OUT/lh-$route-$form.json" <<'PY'
import json, sys
from urllib.parse import urlsplit
with open(sys.argv[1]) as f:
    report = json.load(f)
if urlsplit(report.get('finalUrl', '')).path.rstrip('/') == '/login':
    print('BLOCKED console Lighthouse ended on /login', file=sys.stderr)
    sys.exit(2)
PY
        fi
        echo "Lighthouse $route $form complete"
      done
    done
    ;;
  stop)
    [[ -f "$OUT/run.json" ]] || blocked 'start phase missing'
    finalize 0
    ;;
  *) echo 'Usage: anti.sh start|lighthouse|stop' >&2; exit 2 ;;
esac
