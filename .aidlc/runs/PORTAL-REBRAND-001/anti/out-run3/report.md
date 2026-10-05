# Report PORTAL-REBRAND-001 S9
Worker: Anti / Antigravity
Browser: Brave Browser 154.1.96.59
Run: 2026-10-04T08:04:57.306290+00:00 → 2026-10-04T08:09:02.040791+00:00; runner exit=1
Operator env: accounts.local.md (seeded customer, branch employee, company owner, platform admin), Kong :8000
| Case | Theme | Viewport | PASS/FAIL/BLOCKED | Expected / observed | Evidence / blocker |
|---|---|---:|---|---|---|
| UI-1 | light | 375 | PASS | UI-1 light visual and typography acceptance | shots/UI-1-light-375.png (http://127.0.0.1:3000/) |
| UI-1 | light | 768 | PASS | UI-1 light visual and typography acceptance | shots/UI-1-light-768.png (http://127.0.0.1:3000/) |
| UI-1 | light | 1024 | PASS | UI-1 light visual and typography acceptance | shots/UI-1-light-1024.png (http://127.0.0.1:3000/) |
| UI-1 | light | 1440 | PASS | UI-1 light visual and typography acceptance | shots/UI-1-light-1440.png (http://127.0.0.1:3000/) |
| UI-1 | dark | 375 | PASS | UI-1 dark visual and typography acceptance | shots/UI-1-dark-375.png (http://127.0.0.1:3000/) |
| UI-1 | dark | 768 | PASS | UI-1 dark visual and typography acceptance | shots/UI-1-dark-768.png (http://127.0.0.1:3000/) |
| UI-1 | dark | 1024 | PASS | UI-1 dark visual and typography acceptance | shots/UI-1-dark-1024.png (http://127.0.0.1:3000/) |
| UI-1 | dark | 1440 | PASS | UI-1 dark visual and typography acceptance | shots/UI-1-dark-1440.png (http://127.0.0.1:3000/) |
| UI-2 | light | 375 | PASS | UI-2 light visual and typography acceptance | shots/UI-2-light-375.png (http://127.0.0.1:3000/login) |
| UI-2 | light | 768 | PASS | UI-2 light visual and typography acceptance | shots/UI-2-light-768.png (http://127.0.0.1:3000/login) |
| UI-2 | light | 1024 | PASS | UI-2 light visual and typography acceptance | shots/UI-2-light-1024.png (http://127.0.0.1:3000/login) |
| UI-2 | light | 1440 | PASS | UI-2 light visual and typography acceptance | shots/UI-2-light-1440.png (http://127.0.0.1:3000/login) |
| UI-2 | dark | 375 | PASS | UI-2 dark visual and typography acceptance | shots/UI-2-dark-375.png (http://127.0.0.1:3000/login) |
| UI-2 | dark | 768 | PASS | UI-2 dark visual and typography acceptance | shots/UI-2-dark-768.png (http://127.0.0.1:3000/login) |
| UI-2 | dark | 1024 | PASS | UI-2 dark visual and typography acceptance | shots/UI-2-dark-1024.png (http://127.0.0.1:3000/login) |
| UI-2 | dark | 1440 | PASS | UI-2 dark visual and typography acceptance | shots/UI-2-dark-1440.png (http://127.0.0.1:3000/login) |
| UI-3 | light | 375 | BLOCKED | Authenticated UI-3 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | light | 768 | BLOCKED | Authenticated UI-3 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | light | 1024 | BLOCKED | Authenticated UI-3 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | light | 1440 | BLOCKED | Authenticated UI-3 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | dark | 375 | BLOCKED | Authenticated UI-3 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | dark | 768 | BLOCKED | Authenticated UI-3 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | dark | 1024 | BLOCKED | Authenticated UI-3 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-3 | dark | 1440 | BLOCKED | Authenticated UI-3 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | light | 375 | BLOCKED | Authenticated UI-4 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | light | 768 | BLOCKED | Authenticated UI-4 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | light | 1024 | BLOCKED | Authenticated UI-4 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | light | 1440 | BLOCKED | Authenticated UI-4 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | dark | 375 | BLOCKED | Authenticated UI-4 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | dark | 768 | BLOCKED | Authenticated UI-4 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | dark | 1024 | BLOCKED | Authenticated UI-4 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-4 | dark | 1440 | BLOCKED | Authenticated UI-4 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | light | 375 | BLOCKED | Authenticated UI-5 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | light | 768 | BLOCKED | Authenticated UI-5 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | light | 1024 | BLOCKED | Authenticated UI-5 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | light | 1440 | BLOCKED | Authenticated UI-5 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | dark | 375 | BLOCKED | Authenticated UI-5 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | dark | 768 | BLOCKED | Authenticated UI-5 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | dark | 1024 | BLOCKED | Authenticated UI-5 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-5 | dark | 1440 | BLOCKED | Authenticated UI-5 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | light | 375 | BLOCKED | Authenticated UI-6 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | light | 768 | BLOCKED | Authenticated UI-6 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | light | 1024 | BLOCKED | Authenticated UI-6 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | light | 1440 | BLOCKED | Authenticated UI-6 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | dark | 375 | BLOCKED | Authenticated UI-6 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | dark | 768 | BLOCKED | Authenticated UI-6 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | dark | 1024 | BLOCKED | Authenticated UI-6 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-6 | dark | 1440 | BLOCKED | Authenticated UI-6 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | light | 375 | BLOCKED | Authenticated UI-7 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | light | 768 | BLOCKED | Authenticated UI-7 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | light | 1024 | BLOCKED | Authenticated UI-7 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | light | 1440 | BLOCKED | Authenticated UI-7 light domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | dark | 375 | BLOCKED | Authenticated UI-7 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | dark | 768 | BLOCKED | Authenticated UI-7 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | dark | 1024 | BLOCKED | Authenticated UI-7 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
| UI-7 | dark | 1440 | BLOCKED | Authenticated UI-7 dark domain view | BLOCKED: BFF /api/auth/login returned 500 (AUTH_SERVICE_URL missing in standalone server; fetch failed to localhost:8080) |
PASS cells: 16/56
FAIL cells: 0/56
BLOCKED cells: 40/56
Build proof: Compiled successfully in build.log with route table containing /, /login, /console
Max Lighthouse script transferSize: KHÔNG CÓ (runner stopped before Lighthouse)
| Route | Form | a11y | LCP ms | Script transfer bytes | Total-byte-weight bytes | fetchTime | finalUrl | Raw JSON |
|---|---|---:|---:|---:|---:|---|---|---|
| / | mobile | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
| / | desktop | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
| /login | mobile | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
| /login | desktop | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
| /console | mobile | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
| /console | desktop | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ | KHÔNG CÓ (runner stopped before Lighthouse) |
Prerequisites missing: AUTH_SERVICE_URL environment variable was not passed to next-server standalone instance by anti.sh runner; caused /api/auth/login to default to localhost:8080 and fail with 500 (fetch failed)
Rule violations / extra commands / reruns: none
Grader output (verbatim):
FAIL run: runner failed
FAIL lh-home-mobile: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-home-mobile.json'
FAIL lh-home-desktop: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-home-desktop.json'
FAIL lh-login-mobile: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-login-mobile.json'
FAIL lh-login-desktop: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-login-desktop.json'
FAIL lh-console-mobile: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-console-mobile.json'
FAIL lh-console-desktop: [Errno 2] No such file or directory: '/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/anti/out/lh-console-desktop.json'
BLOCKED cells: 40/56
VERDICT: FAIL errors=7 blocked=40
Kết luận: VERDICT: FAIL errors=7 blocked=40 (máy chấm: exit 1; không nâng BLOCKED thành PASS)
