#!/usr/bin/env bash
# AC-3/AC-4 live via BFF: /account is a staff route, customers stay on /me.
set -o pipefail
B=${BASE:-http://localhost:3000}; PW='REDACTED'; F=0
H=(-H 'Content-Type: application/json' -H 'Sec-Fetch-Site: same-origin')
ok(){ echo "PASS $*"; }; bad(){ echo "FAIL $*"; F=1; }
get(){ curl -s -o /dev/null -D - ${2:+-b $2} --max-time 90 $B$1 | tr -d '\r'; }
st(){ echo "$1" | awk 'NR==1{print $2}'; }; loc(){ echo "$1" | grep -i '^location:' | cut -d' ' -f2; }
login(){ curl -s -o /dev/null -c $1 -b $1 "${H[@]}" -d "{\"identifier\":\"$3\",\"password\":\"$PW\"}" $B$2; sleep 1; }
r=$(get /account); [ "$(st "$r")" = 307 ] && [[ "$(loc "$r")" == /staff/login?redirect=%2Faccount* ]] && ok "anon /account -> $(loc "$r")" || bad "anon /account $(st "$r") $(loc "$r")"
S=$(mktemp); login $S /api/auth/staff/login employee.s9@e2e.test
for p in /account /console; do r=$(get $p $S); [ "$(st "$r")" = 200 ] && ok "staff $p 200" || bad "staff $p $(st "$r") $(loc "$r")"; done
C=$(mktemp); login $C /api/auth/login customer.s9@e2e.test
r=$(get /me $C); [ "$(st "$r")" = 200 ] && ok "customer /me 200" || bad "customer /me $(st "$r")"
r=$(get /account $C); [ "$(st "$r")" = 307 ] && [[ "$(loc "$r")" == /staff/* ]] && ok "customer /account (same as other console routes, proxy.ts:33) -> $(loc "$r")" || bad "customer /account $(st "$r") $(loc "$r")"
for J in $S $C; do curl -s -o /dev/null -b $J -c $J "${H[@]}" -X POST $B/api/auth/logout; rm -f $J; done
exit $F
