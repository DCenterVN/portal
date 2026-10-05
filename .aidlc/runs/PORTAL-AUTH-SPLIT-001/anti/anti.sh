#!/usr/bin/env bash
set -euo pipefail
umask 077
ANTI="$(cd "$(dirname "$0")" && pwd)"
PORTAL="$(cd "$ANTI/../../../.." && pwd)"
OUT="$ANTI/out"
KONG=dcentervn-local-api-gateway-1
KONG_ADMIN=http://127.0.0.1:8001
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

# Kong evidence: access log for the whole run window + Prometheus counters before/after.
save_kong() {
  local since
  since="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["start"])' "$OUT/run.json")"
  docker logs --since "$since" "$KONG" > "$OUT/kong-access.log" 2> "$OUT/kong-error.log" || echo 'WARN kong logs unavailable' >&2
  curl --silent --max-time 10 --output "$OUT/kong-metrics-after.prom" "$KONG_ADMIN/metrics" || echo 'WARN kong metrics unavailable' >&2
}

finalize() {
  local code=$1
  save_kong
  stop_process brave
  stop_process server
  stop_process attacker
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
  git diff --binary HEAD | sha256sum > "$OUT/tracked-after.diff"
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
  if [[ "$PHASE" != start || "$code" != 0 ]]; then
    [[ -z "$SECRET_DIR" ]] || rm -rf -- "$SECRET_DIR"
  fi
  if [[ "$PHASE" == start && "$code" != 0 ]]; then
    finalize "$code" || code=$?

  fi
  exit "$code"
}

readiness() {
  # An invalid, credential-free same-origin request must reach the live BFF.
  LOGIN_CODE="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 20 \
    --request POST --header 'Content-Type: application/json' \
    --header 'Sec-Fetch-Site: same-origin' \
    --header 'Origin: http://127.0.0.1:3000' --data-binary '{}' \
    http://127.0.0.1:3000/api/auth/staff/login || true)"
  [[ "$LOGIN_CODE" == 400 ]] || blocked "readiness BFF ${LOGIN_CODE:-000} (expected 400)"
}

case "$PHASE" in
  start)
    [[ ! -e "$OUT/run.json" ]] || { echo 'Run already exists. Stop; no rerun until green, no evidence overwrite.' >&2; exit 1; }
    mkdir -p "$OUT/shots"
    python3 - "$OUT/run.json" <<'PY'
import json, sys
from datetime import datetime, timezone
with open(sys.argv[1], 'x') as file:
    import uuid
    json.dump({'runId': str(uuid.uuid4()), 'tester': 'Anti', 'start': datetime.now(timezone.utc).isoformat(), 'end': None, 'exit_code': None}, file)
PY
    git diff --binary HEAD | sha256sum > "$OUT/tracked-before.diff"
    trap phase_exit EXIT
    trap 'exit 130' INT
    trap 'exit 143' TERM
    for port in 3000 9222 3001; do
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
    CHROME_PATH="$(command -v brave-browser || command -v brave || true)"
    [[ -n "$CHROME_PATH" ]] || blocked 'Brave unavailable'
    [[ -f "$PORTAL/.env.local" ]] || blocked 'portal .env.local unavailable'
    [[ -f "$PORTAL/.next/standalone/server.js" ]] || blocked 'prebuilt standalone server missing; Dawn builds separately'
    [[ "$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 5 "$KONG_ADMIN/status" || true)" == 200 ]] \
      || blocked 'Kong admin :8001 unavailable; Dawn starts dev-infra first'
    curl --silent --max-time 10 --output "$OUT/kong-metrics-before.prom" "$KONG_ADMIN/metrics"
    make_secrets
    # Run a private copy: Next runtime caches cannot write into portal source.
    cp -a "$PORTAL/.next/standalone" "$SECRET_DIR/runtime"
    # Standalone builds omit these assets by default. Copy into /tmp only.
    mkdir -p "$SECRET_DIR/runtime/.next"
    [[ ! -d "$PORTAL/.next/static" ]] || cp -a "$PORTAL/.next/static" "$SECRET_DIR/runtime/.next/"
    [[ ! -d "$PORTAL/public" ]] || cp -a "$PORTAL/public" "$SECRET_DIR/runtime/"
    mkdir -p "$SECRET_DIR/attacker"
    cp "$ANTI/attacker.html" "$SECRET_DIR/attacker/attacker.html"
    # Node 22 loads dotenv for this process only; never copy or source secrets.
    HOSTNAME=127.0.0.1 PORT=3000 setsid node --env-file="$PORTAL/.env.local" \
      "$SECRET_DIR/runtime/server.js" > "$SECRET_DIR/server.log" 2>&1 < /dev/null &
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
    readiness
    setsid python3 -m http.server 3001 --bind 127.0.0.1 --directory "$SECRET_DIR/attacker" > "$SECRET_DIR/attacker.log" 2>&1 < /dev/null &
    record_process attacker "$!"
    BRAVE_PROFILE="$(mktemp -d /tmp/portal-anti-brave.XXXXXXXX)"
    printf '%s\n' "$BRAVE_PROFILE" > "$OUT/brave-profile.txt"
    setsid "$CHROME_PATH" --user-data-dir="$BRAVE_PROFILE" --remote-debugging-port=9222 \
      --no-first-run --no-default-browser-check http://127.0.0.1:3000/login \
      > "$SECRET_DIR/brave.log" 2>&1 < /dev/null &
    record_process brave "$!"
    echo 'Ready. Anti follows anti-test.md. Attacker: http://127.0.0.1:3001/attacker.html . Finish: anti.sh stop; python3 anti_check.py.'
    ;;
  stop)
    [[ -f "$OUT/run.json" ]] || blocked 'start phase missing'
    python3 - "$OUT/run.json" <<'PYCODE'
import json, sys
if json.load(open(sys.argv[1]))['end'] is not None:
    print('BLOCKED run already ended; cannot extend capture window', file=sys.stderr)
    sys.exit(2)
PYCODE
    finalize 0
    ;;
  *) echo 'Usage: anti.sh start|stop' >&2; exit 2 ;;
esac
