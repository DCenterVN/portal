#!/usr/bin/env bash
# AC-1/AC-2 e2e: login -> authenticated page 200 -> logout -> same page redirects to login with redirect param.
set -o pipefail
B=http://localhost:3000; H=(-H 'Content-Type: application/json' -H 'Sec-Fetch-Site: same-origin'); F=0
flow(){ # label loginpath id page expectloc
  J=$(mktemp); curl -s -o /dev/null -c $J -b $J "${H[@]}" -d "{\"identifier\":\"$3\",\"password\":\"REDACTED\"}" $B$2; sleep 1
  a=$(curl -s -o /dev/null -w '%{http_code}' -b $J $B$4)
  curl -s -o /dev/null -b $J -c $J "${H[@]}" -X POST $B/api/auth/logout
  curl -s -o /dev/null -D $J.h -b $J $B$4; b=$(awk 'NR==1{print $2}' $J.h); l=$(grep -i '^location:' $J.h | tr -d '\r')
  if [ "$a" = 200 ] && [ "$b" = 307 ] && echo "$l" | grep -q "$5"; then echo "PASS $1: $4 $a -> logout -> $b $l"; else echo "FAIL $1: before=$a after=$b $l"; F=1; fi
  rm -f $J $J.h
}
flow customer /api/auth/login customer.s9@e2e.test /cart '/login?redirect=%2Fcart'
flow employee /api/auth/staff/login employee.s9@e2e.test /console '/staff/login?redirect=%2Fconsole'
exit $F
