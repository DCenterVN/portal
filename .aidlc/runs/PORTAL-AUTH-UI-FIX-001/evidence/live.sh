#!/usr/bin/env bash
# S1-S4 live check via BFF portal. exit!=0 on any failure.
set -o pipefail
B=${BASE:-http://localhost:3000}; PW='REDACTED'
D=$(mktemp -d); FAIL=0
ok(){ echo "PASS $*"; }; bad(){ echo "FAIL $*"; FAIL=1; }
H=(-H 'Content-Type: application/json' -H 'Sec-Fetch-Site: same-origin')
login(){ # jar path id [redirect] -> body file $D/body, headers $D/hdr
  local j=$1 p=$2 id=$3 r=$4
  curl -s -D $D/hdr -o $D/body -c $j -b $j "${H[@]}" -d "{\"identifier\":\"$id\",\"password\":\"${5:-$PW}\"${r:+,\"redirect\":\"$r\"}}" $B$p
  sleep 1
}
code(){ head -1 $D/hdr | awk '{print $2}'; }
nextp(){ python3 -c 'import json,sys;print(json.load(open(sys.argv[1])).get("next_path",""))' $D/body 2>/dev/null; }
logout_check(){ # label jar
  curl -s -D $D/lh -o /dev/null -b $2 -c $2 "${H[@]}" -X POST $B/api/auth/logout
  local c; c=$(awk 'NR==1{print $2}' $D/lh); local miss=""
  for n in access_token refresh_token CSRF-Token portal_plane; do
    grep -i "^set-cookie: $n=" $D/lh | grep -qiE 'max-age=0|expires=Thu, 01 Jan 1970' || miss="$miss $n"
  done
  [ "$c" = 200 ] && [ -z "$miss" ] && ok "S1 logout $1 ->200, cleared 4 cookies" || bad "S1 logout $1 status=$c not-cleared:$miss"
}
# S1 + S2 customer
J=$D/c.jar; login $J /api/auth/login customer.s9@e2e.test /cart
[ "$(code)" = 200 ] && [ "$(nextp)" = /cart ] && ok "S2 customer redirect=/cart -> /cart" || bad "S2 customer /cart: $(code) $(nextp)"
logout_check customer $J
for r in '//evil.com' 'https://evil.com'; do
  J=$D/c2.jar; login $J /api/auth/login customer.s9@e2e.test "$r"
  [ "$(code)" = 200 ] && [ "$(nextp)" = / ] && ok "S2 customer redirect=$r -> /" || bad "S2 customer $r: $(code) $(nextp)"
  curl -s -o /dev/null -b $J -c $J "${H[@]}" -X POST $B/api/auth/logout
done
J=$D/c3.jar; login $J /api/auth/login customer.s9@e2e.test "" 'sai-mat-khau-1234'
[ "$(code)" = 401 ] && ok "S2 wrong password -> 401" || bad "S2 wrong password: $(code)"
# S2 unactivated
UE="unact.$RANDOM$$@e2e.test"
curl -s -o /dev/null "${H[@]}" -d "{\"email\":\"$UE\",\"password\":\"$PW\",\"display_name\":\"Unact\"}" $B/api/auth/register; sleep 1
J=$D/u.jar; login $J /api/auth/login "$UE"
[ "$(code)" = 403 ] && grep -q NOT_ACTIVATED $D/body && ok "S2 PROVISIONED login -> 403 NOT_ACTIVATED" || bad "S2 unactivated: $(code)"
# staff
J=$D/s.jar; login $J /api/auth/staff/login employee.s9@e2e.test /sales/pricing
S1=$(code); NP=$(nextp); echo "INFO employee redirect=/sales/orders -> $S1 next=$NP"
[ "$S1" = 200 ] && [ "$NP" = /sales/pricing ] && ok "S2 employee redirect=/sales/pricing kept (next=$NP)" || bad "S2 employee login $S1"
logout_check employee $J
J=$D/s2.jar; login $J /api/auth/staff/login employee.s9@e2e.test '/sales/orders'
[ "$(code)" = 200 ] && [ "$(nextp)" = /console ] && ok "S2 employee redirect outside CONSOLE_ROUTES (/sales/orders) dropped (next=$(nextp))" || bad "S2 employee evil: $(code) $(nextp)"
curl -s -o /dev/null -b $J -c $J "${H[@]}" -X POST $B/api/auth/logout
# superadmin
J=$D/p.jar; login $J /api/auth/staff/login padmin.44186658@e2e.test
[ "$(code)" = 200 ] && ok "S2 padmin login next=$(nextp)" || bad "S2 padmin login $(code)"
ROOT=1a80b5f2-d649-4df2-8ead-565ea5e4d1eb
# S4 superadmin matrix
curl -s -b $J -o $D/m0.json -w '%{http_code}' $B/api/platform/companies/$ROOT/role-matrix > $D/c; [ "$(cat $D/c)" = 200 ] && ok "S4 superadmin GET role-matrix 200" || bad "S4 superadmin GET $(cat $D/c)"
python3 - $D <<'PY'
import json,sys
d=sys.argv[1]; m=json.load(open(d+"/m0.json"))["data"]
cr=set("create read update delete import export".split())
for code,acts in m.items():
    if code in ("OWNER","CUSTOMER") or not acts: continue
    add=next((a for a in m["OWNER"] if a not in acts and a.startswith("sales:")),None)
    if not add: continue
    json.dump({"role":code,"orig":acts,"changed":acts+[add],"extra":[a for a in acts if a.split(":")[-1] not in cr]},open(d+"/pick.json","w")); break
PY
RC=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["role"])' $D/pick.json)
put(){ python3 -c 'import json,sys;print(json.dumps({"actions":json.load(open(sys.argv[1]))[sys.argv[2]]}))' $D/pick.json $1 > $D/body.put; curl -s -b $J -o $D/put.out -w '%{http_code}' "${H[@]}" -X PUT -d @$D/body.put $B/api/platform/companies/$ROOT/role-matrix/roles/$RC; }
P1=$(put changed); P2=$(put orig)
curl -s -b $J -o $D/m1.json $B/api/platform/companies/$ROOT/role-matrix
python3 - $D "$P1" "$P2" <<'PY' && ok "S4 PUT role $RC +1 action ($P1) then restored ($P2); extra keys kept, matrix identical" || bad "S4 PUT/restore p1=$P1 p2=$P2"
import json,sys
d,p1,p2=sys.argv[1:4]; pk=json.load(open(d+"/pick.json"))
a=json.load(open(d+"/m0.json")); b=json.load(open(d+"/m1.json"))
def norm(m): return {k:sorted(v) for k,v in m["data"].items()}
sys.exit(0 if p1=="200" and p2=="200" and norm(a)==norm(b) and all(e in norm(b)[pk["role"]] for e in pk["extra"]) else 1)
PY
echo "INFO extra(non-CRUDIE) keys on $RC: $(python3 -c 'import json;print(json.load(open("'$D'/pick.json"))["extra"])')"
curl -s -o /dev/null -b $J -c $J "${H[@]}" -X POST $B/api/auth/logout
# OWNER
J=$D/o.jar; login $J /api/auth/staff/login newowner.44186658@e2e.test
echo "INFO owner login $(code) next=$(nextp)"
curl -s -b $J -o $D/o.json -w '%{http_code}' "$B/api/org/company/role-matrix?org_id=$ROOT" > $D/c; [ "$(cat $D/c)" = 200 ] && ok "S4 OWNER GET /org/company/role-matrix 200" || bad "S4 OWNER GET $(cat $D/c)"
curl -s -b $J -o /dev/null -w '%{http_code}' "${H[@]}" -X PUT -d @$D/body.put $B/api/platform/companies/$ROOT/role-matrix/roles/$RC > $D/c; [ "$(cat $D/c)" = 403 ] && ok "S4 OWNER PUT -> 403" || bad "S4 OWNER PUT $(cat $D/c)"
curl -s -o /dev/null -D $D/rh -b $J $B/roles; RS=$(awk 'NR==1{print $2}' $D/rh); LOC=$(grep -i '^location:' $D/rh | tr -d '\r')
[ "$RS" = 307 -o "$RS" = 308 ] && echo "$LOC" | grep -q '/company' && ok "S4 /roles -> $RS $LOC" || bad "S4 /roles $RS $LOC"
logout_check owner $J
# S3 pages
for t in login register; do
  o=$(curl -s -o /dev/null -w '%{http_code} %{redirect_url}' "$B/$t?redirect=/cart"); [ "${o%% *}" = 307 ] && [[ "$o" == *"/?auth=$t&redirect=%2Fcart" ]] && ok "S3 /$t -> landing popup (307)" || bad "S3 /$t $o"
  c=$(curl -s -o /dev/null -w '%{http_code}' "$B/?auth=$t"); [ "$c" = 200 ] && ok "S3 /?auth=$t 200" || bad "S3 /?auth=$t $c"
done
c=$(curl -s -o /dev/null -w '%{http_code}' $B/staff/login); [ "$c" = 200 ] && ok "S3 /staff/login 200" || bad "S3 /staff/login $c"
rm -rf $D; exit $FAIL
