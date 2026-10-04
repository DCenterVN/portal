# Dev environment evidence — 2026-10-04

Status: **BLOCKED, not ready**. This session cannot access Docker or open localhost sockets. No stack-up, reset or live E2E success is claimed. No production/configuration file was changed.

## Commands actually run and real output

1. Stack inspection:
```sh
docker compose -p dcentervn-local --project-directory /mnt/win_d/feature/ticket/dev-infra ps
```
```text
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.45/containers/json?filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.oneoff%3DFalse%22%3Atrue%2C%22com.docker.compose.project%3Ddcentervn-local%22%3Atrue%7D%7D": dial unix /var/run/docker.sock: connect: operation not permitted
```

2. Read only relevant non-secret portal .env.local endpoint values:
```sh
python3 - <<'PYENV'
from pathlib import Path
p=Path('.env.local')
if not p.exists(): print('ENV_LOCAL_MISSING')
else:
 for line in p.read_text().splitlines():
  if line.startswith(('AUTH_SERVICE_URL=','ORG_INTERNAL_URL=','ORG_SERVICE_URL=','CUSTOMER_INTERNAL_URL=','CUSTOMER_SERVICE_URL=','INTEGRATION_INTERNAL_URL=')): print(line)
PYENV
```
```text
AUTH_SERVICE_URL=http://127.0.0.1:8000
ORG_INTERNAL_URL=http://127.0.0.1:8000
ORG_SERVICE_URL=http://127.0.0.1:8000
INTEGRATION_INTERNAL_URL=http://127.0.0.1:8000
```
No customer endpoint key was printed. These values point to Kong's port, but do not meet Dawn's `localhost` spelling requirement. Intended pre-COOK configuration (owner supplies it; not changed here): AUTH_SERVICE_URL, ORG_INTERNAL_URL, ORG_SERVICE_URL, CUSTOMER_INTERNAL_URL and INTEGRATION_INTERNAL_URL all `http://localhost:8000`. Portal origin `http://localhost:3000`; Mailpit `http://localhost:8025`. No container IPs.

3. Location route probe:
```sh
curl -sS --max-time 10 -o /dev/null -w 'KONG_HTTP=%{http_code}\n' http://localhost:8000/locations/vn/provinces
```
```text
curl: (7) failed to open socket: Operation not permitted
KONG_HTTP=000
```
This proves neither route health nor the 34 provinces/3,321 communes. The E2E must discover a Hà Nội Xã from live data and save it through UI.

4. Rate-counter reset attempt (password read into child environment, never printed; scans real keys rather than assuming Docker bridge IP):
```sh
python3 - <<'PYRESET'
import os, subprocess
from pathlib import Path
p=Path('/mnt/win_d/feature/ticket/dev-infra/.env')
try:
 password=next(line.split('=',1)[1] for line in p.read_text().splitlines() if line.startswith('REDIS_PASSWORD='))
 env=dict(os.environ, REDISCLI_AUTH=password)
 cmd=['docker','compose','-p','dcentervn-local','--project-directory','/mnt/win_d/feature/ticket/dev-infra','exec','-T','-e','REDISCLI_AUTH','redis','redis-cli','--scan','--pattern','rl:*']
 r=subprocess.run(cmd,env=env,text=True,capture_output=True)
 if r.returncode:
  print(r.stderr.strip()); print('RATE_RESET_BLOCKED: scan failed; no keys deleted')
 else:
  keys=[k for k in r.stdout.splitlines() if k.startswith(('rl:invite:','rl:forgot:','rl:login:'))]
  if keys:
   r=subprocess.run(cmd[:cmd.index('--scan')]+['DEL',*keys],env=env,text=True,capture_output=True)
   print(r.stdout.strip() or r.stderr.strip()); print('RATE_RESET_EXIT='+str(r.returncode))
  else: print('RATE_RESET: no invite/forgot/login keys found')
except Exception as e: print('RATE_RESET_BLOCKED: '+type(e).__name__)
PYRESET
```
```text
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.45/containers/json?filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.project%3Ddcentervn-local%22%3Atrue%2C%22com.docker.compose.service%3Dredis%22%3Atrue%7D%7D": dial unix /var/run/docker.sock: connect: operation not permitted
RATE_RESET_BLOCKED: scan failed; no keys deleted
```
Reset was requested and attempted but did not happen. In permitted dev terminal rerun this block with shared-dev coordination; it deletes only invite/forgot/login counters, never FLUSHDB. The separate Kong gateway counter remains subject to its normal window; if 429 occurs, stop and run later, never automated retry.

5. Explicit stack-up attempt:
```sh
docker compose -p dcentervn-local --project-directory /mnt/win_d/feature/ticket/dev-infra up -d
```
```text
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock: Get "http://%2Fvar%2Frun%2Fdocker.sock/v1.45/containers/json?all=1&filters=%7B%22label%22%3A%7B%22com.docker.compose.config-hash%22%3Atrue%2C%22com.docker.compose.project%3Ddcentervn-local%22%3Atrue%7D%7D": dial unix /var/run/docker.sock: connect: operation not permitted
```
Stack-up did not succeed (exit 1).

## Commands to run later (NOT executed here)

Do not rebuild/restart the shared stack blindly. In a permitted terminal, `docker compose ... ps` must show running/healthy auth, org, customer, integration, notification, Kong, Redis, Postgres and Kafka. If any is stopped, its owner runs the existing compose up workflow. Expected deployment versions include D-135/D-136. Capture real ps output before marking environment READY.

After endpoint correction and task approval:
```sh
npm run dev -- --hostname localhost
npm exec --no -- playwright test .aidlc/runs/PORTAL-BASE-UI-001/testkit/happy.spec.ts --workers=1
```
Run portal server in a separate terminal. Playwright must already be installed; do not let npm install packages implicitly. Expected result: one live test PASS with both OWNER and employee mail acceptance, mandatory Hà Nội address in GET /customer/me + DB, lock and unlock readback, zero happy-path console errors/5xx. Expected result is a future assertion, **not evidence of a passed run**. Negative/state screenshots and per-slice gates are specified in plan.md.
