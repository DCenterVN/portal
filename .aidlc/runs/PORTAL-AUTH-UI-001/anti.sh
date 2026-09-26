#!/usr/bin/env bash
# Test harness for Antigravity on PORTAL-AUTH-UI-001. Every command writes raw output to anti/; anti_check.py grades it.
# usage: bash anti.sh start | staff | unit | rl-reset | url activate|reset | a11y | check
set -uo pipefail
R="$(cd "$(dirname "$0")" && pwd)"; P="$(cd "$R/../../.." && pwd)"; A="$R/anti"; DI="$P/../dev-infra"
PORTAL=http://127.0.0.1:3000
sql() { (cd "$DI" && docker compose exec -T postgres psql -U postgres -d "$1" -qAtc "$2"); }
token() { sql auth_db "select payload->'variables'->>'token' from outbox_events where payload->>'recipient'='$1' order by created_at desc limit 1"; }
post() { curl -s -o /dev/null -w '%{http_code}' -X POST -H 'content-type: application/json' -d "$2" "$PORTAL/api/auth/$1"; }
[[ "${1:-}" != start && ! -f "$A/run.env" ]] && { echo "run 'bash anti.sh start' first"; exit 2; }
[[ -f "$A/run.env" ]] && source "$A/run.env"
case "${1:-}" in
start)
  rm -rf "$A"; mkdir -p "$A/ui" "$A/lh"
  RUN=$(date +%s)
  printf 'RUN=%s\nEMAIL=anti_c_%s@test.local\nSTAFF=anti_s_%s@test.local\n' "$RUN" "$RUN" "$RUN" > "$A/run.env"
  git -C "$P" status --porcelain > "$A/git_status_before.txt"
  curl -s -o /dev/null -w 'portal %{http_code}\n' "$PORTAL/login" | tee "$A/preflight.txt"
  cat "$A/run.env" ;;
staff)
  # ponytail: staff accounts are provisioned by an admin in prod; the harness makes one via register+activate and an org membership row
  echo "register $(post register "{\"email\":\"$STAFF\",\"display_name\":\"Anti Staff\",\"password\":\"AntiStaff123!\"}")"
  sleep 2; T=$(token "$STAFF"); [[ -z "$T" ]] && { echo "NO TOKEN for $STAFF - record FAIL"; exit 1; }
  echo "activate $(post activate "{\"token\":\"$T\"}")"
  U=$(sql auth_db "select id from users where email='$STAFF'")
  B=$(sql org_db "select id from branches where status='ACTIVE' order by created_at limit 1")
  sql org_db "insert into memberships(id,branch_id,user_id,member_type,status,joined_at) values (gen_random_uuid(),'$B','$U','EMPLOYEE','ACTIVE',now())"
  echo "staff ready: $STAFF / AntiStaff123! (branch $B)" | tee "$A/staff.txt" ;;
unit)
  (cd "$P" && npm test) > "$A/unit.log" 2>&1; echo $? > "$A/unit.exit"
  (cd "$P" && python3 ~/agent_skills/sdlc/engine/archcheck.py) > "$A/arch.log" 2>&1
  echo "unit exit=$(cat "$A/unit.exit")"; grep -E "Tests +[0-9]" "$A/unit.log"; tail -1 "$A/arch.log" ;;
rl-reset)
  PW=$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' dcentervn-local-auth-1 | sed -n 's/^AUTH_REDIS_PASSWORD=//p')
  cd "$DI" && docker compose exec -T redis redis-cli -a "$PW" --no-auth-warning --scan --pattern 'rl:*' \
    | xargs -r docker compose exec -T redis redis-cli -a "$PW" --no-auth-warning del >/dev/null; echo "rate limit reset" ;;
url)
  T=$(token "$EMAIL"); [[ -z "$T" ]] && { echo "NO TOKEN for $EMAIL - record FAIL, do not invent one"; exit 1; }
  PAGE=activate; [[ "${2:-}" == reset ]] && PAGE=reset-password
  echo "$T" >> "$A/ui/tokens.txt"; echo "$PORTAL/$PAGE?token=$T" ;;
a11y)
  C=$(find ~/.cache/ms-playwright -path '*chromium-*/chrome-linux64/chrome' -type f | head -1)
  for r in login register activate forgot-password reset-password; do
    CHROME_PATH="$C" npx -y lighthouse@13.5.0 "$PORTAL/$r" --only-categories=accessibility,performance --form-factor=mobile \
      --chrome-flags="--headless=new --no-sandbox" --output=json --output-path="$A/lh/$r.json" --quiet 2>> "$A/lh/stderr.log"
    python3 -c "import json,sys;d=json.load(open(sys.argv[1]));c=d['categories'];print(sys.argv[2],'a11y',c['accessibility']['score'],'perf',c['performance']['score'])" "$A/lh/$r.json" "$r"
  done ;;
check)
  git -C "$P" status --porcelain > "$A/git_status_after.txt"
  python3 "$R/anti_check.py" "$A" | tee "$A/check.txt" ;;
*) sed -n 3p "$0"; exit 2 ;;
esac
