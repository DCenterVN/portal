# PORTAL-REBRAND-001 — S9 Anti kit

Đã tạo đúng 4 file dưới `.aidlc/runs/PORTAL-REBRAND-001/anti/`; không sửa app/components/features/lib, plan/testkit, tokens hay operations. Không chạy production build/start, Brave hoặc Lighthouse trong phiên tạo kit.

| File | Nội dung |
|---|---|
| `anti-test.md` | Brief tiếng Việt cho Anti/Antigravity; Brave, real seeded role accounts, Kong :8000; hard bans; 56 cell UI-1..UI-7; keyboard, reduced motion, computed contrast, document.fonts tiếng Việt; schema, fake-run signals và fixed report |
| `anti.sh` | `set -euo pipefail`; production build + tee; background start/pid/trap; `/login` 200; timestamp start/end; Brave profile riêng và sáu Lighthouse JSON; giữ session thật cho console, tracked diff trước/sau; từ chối rerun |
| `anti_check.py` | Stdlib only; route First Load JS kB/MB/B ≤200kB, run window, Lighthouse freshness/route/a11y/mobile LCP; đủ 56 cells, numeric measurements, contrast oracle recomputed, loaded font evidence, runtime counters; PNG header/width/size/hash; exit 0 PASS, 1 FAIL, 2 BLOCKED |
| `kit-report.md` | Bàn giao kit và kết quả verification/mutation này |

Dữ kiện coordinator đã hoàn tất: full brand gate **0 errors**, brand self-test đạt, `npm test` **350/350**, lint/typecheck đạt, archcheck **0 new**; TC-8 token drift **none**. `operations.generated.ts` drift ngoài phạm vi, không regenerate. Các dữ kiện này không phải lần chạy mới của người tạo kit hoặc Anti.

`hs-run plan next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001` trả exit 0 nhưng **state=unresolved** do không có `phases/phase-*.md`. Đã đọc plan, S9/TC-6/TC-9/AC-3..10, ui-cases/errors/contrast-table, ba template AUTH và Shell checker. Phạm vi ghi do user chỉ định giới hạn trong `anti/`; không scaffold, refresh board, sửa approval hoặc tạo delivery receipts. Không tuyên bố harness approval/ship đã hoàn tất.

## Self-test output

Lệnh: `python3 -B .aidlc/runs/PORTAL-REBRAND-001/anti/anti_check.py --self-test` — exit **0**. Fixtures dùng `TemporaryDirectory`, PNG tổng hợp được encode bằng stdlib; không có fixture nào lưu vào `anti/out/` hay được trình bày như ảnh UI thật.

```text
PASS self-test positive fixture
PASS self-test reject missing cell
PASS self-test reject PASS without measurements
PASS self-test reject contrast 4.3
PASS self-test reject duplicate screenshot
PASS self-test reject wrong-width PNG
PASS self-test reject LH a11y 0.89
PASS self-test reject First Load 210 kB
PASS self-test reject LH fetchTime outside window
PASS self-test reject mobile LCP 2501
PASS self-test BLOCKED distinct from PASS (exit 2)
SELF-TEST: 11/11 PASS (synthetic fixtures only)
```

## Mutation table

Mỗi mutation áp dụng lên **bản sao grader trong temp directory**; chạy `--self-test` bằng subprocess. Grader gốc không bị thay đổi. Mỗi bản sao phải exit 1 và in FAIL đúng negative test; không tính syntax error/crash là killed.

| Mutation | Thay đổi bản sao | Self-test đỏ | Exit | Kết quả |
|---|---|---|---:|---|
| M1 | Bỏ condition contrast ratio/threshold/computed agreement | `FAIL self-test reject contrast 4.3` → `10/11 FAIL` | 1 | KILLED |
| M2 | Bỏ duplicate SHA256 condition | `FAIL self-test reject duplicate screenshot` → `10/11 FAIL` | 1 | KILLED |
| M3 | Nới mobile LCP từ 2500 lên 5000ms | `FAIL self-test reject mobile LCP 2501` → `10/11 FAIL` | 1 | KILLED |

**Mutation killed/total: 3/3 (100%).** `bash -n anti.sh` đạt; Python AST parse đạt. Grader trên empty evidence trả exit 1 và không crash. Không chạy `npm test`, lint hoặc typecheck lại vì không thay runtime code.

## Bàn giao / pickup

Kit đã sẵn sàng; browser acceptance vẫn **chưa đo**. Anti chạy `bash .aidlc/runs/PORTAL-REBRAND-001/anti/anti.sh` từ portal với network, Brave và operator env/accounts thật; chỉ ghi `anti/out/**`. Thiếu account/backend/resource ghi BLOCKED đúng cell, không substitute. Sau runner exit, chạy grader một lần và dán output thật theo brief. Cần coordinator review observations/ảnh/font glyphs/route-state coverage; file grader kiểm tính đầy đủ và nhất quán của bằng chứng, không chứng minh browser actions đã xảy ra từ các boolean tự khai.

Không có background process do phiên tạo kit khởi động; không có UI/Lighthouse PASS hoặc S9 completion receipt được tạo.

## Fix 2

This section supersedes the original kit's First Load JS source and run instructions. User-authorized S9 kit fix only; no app/components/features/lib/config edits. Moved `anti/out` → `anti/out-run1` intact as run-1 evidence. New runner writes only fresh `anti/out`; brief never reads the archive, grader rejects archived input before reading files.

Run 1 observed: runner exit **126**, Lighthouse `Permission denied` from npm cache on NTFS; build compiled with route table but no First Load JS column; standalone warning from `next start`; checker **31 errors / 16 BLOCKED**, 40 claimed PASS cells unreliable because of duplicate screenshots and authenticated login-form evidence.

- Runner: external `NPM_CONFIG_CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/portal-anti-npm"`; lowercase override unset; Brave profile from `mktemp -d` under `/tmp`, removed at cleanup. Starts `HOSTNAME=127.0.0.1 PORT=3000 node .next/standalone/server.js` after copying static/public into standalone build outputs. Tracked-before/after diff check retained.
- Bundle oracle: raw Lighthouse `resource-summary` script `transferSize` **≤200000 bytes (200 kB)** for each audited route/form; require and record `total-byte-weight` separately. Build still requires `Compiled successfully`, route table and `/`, `/login`, `/console`. Measurement-source plan deviation and Turbopack reason appended to `testkit/errors.md` for Dawn; transferred JS is not equivalent to First Load JS.
- Auth evidence: every non-BLOCKED cell needs route-complete `final_urls` and representative `screenshot_url`; login path outside UI-2 fails `unauthenticated`. Before each authenticated cell Anti logs in, verifies console URL + heading, verifies each target route, and re-logins on redirect within the same runner run. UI-7 login coverage stays in UI-2/Lighthouse so its cell URLs never claim authenticated login-page coverage.
- Prerequisites: only auth/org/customer/integration/notification + VT-21 currently available. Dawn supplies sales/inventory/production readiness and seeded customer, branch employee, platform admin, company owner accounts, product id and trace code in private `anti/accounts.local.md`. Added `anti/.gitignore`; check-ignore confirms exclusion. Missing real prerequisites legitimately BLOCKED; never print secrets.

### Verification tails

Red phase: new tests **11/14 FAIL** before fixing checks. Final commands and tails (`fix2-validation.txt` holds full output):

```text
$ python3 -B .aidlc/runs/PORTAL-REBRAND-001/anti/anti_check.py --self-test
PASS self-test reject authenticated final_url /login
PASS self-test reject missing final_urls
PASS self-test reject authenticated screenshot /login
PASS self-test reject LH fetchTime outside window
PASS self-test reject mobile LCP 2501
PASS self-test BLOCKED distinct from PASS (exit 2)
SELF-TEST: 15/15 PASS (synthetic fixtures only)
exit=0

$ bash -n .aidlc/runs/PORTAL-REBRAND-001/anti/anti.sh
(no output)
exit=0
```

| Temp-copy mutation | Actual self-test tail | Exit | Result |
|---|---|---:|---|
| Drop login-path checks | `FAIL self-test reject authenticated final_url /login`; `FAIL self-test reject authenticated screenshot /login`; `SELF-TEST: 13/15 FAIL` | 1 | KILLED |
| Drop script-size check | `FAIL self-test reject LH script 210 kB`; `SELF-TEST: 14/15 FAIL` | 1 | KILLED |

**Mutation killed/total: 2/2 (100%).** Mutants were temporary copies, removed afterwards; failures are assertion results, not syntax errors. Original grader remains intact. Build-without-route-table and script-210-kB fixtures reject their evidence; positive fixture accepts Turbopack-style build output without byte columns.

### Where it started

Run-1 kit could not execute Lighthouse or satisfy its obsolete bundle source, and accepted authenticated login screenshots.

### Decisions locked + what shipped

Kit-only fixes above, authorized by the explicit user request. `hs-run plan next --plan /mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001` remains `state=unresolved` because phases are absent; no scaffold, approval, delivery receipt, commit or push generated. Direct red→green verification is reported as kit validation, not harness completion.

### Key files for next session

Base: `/mnt/win_d/feature/ticket/portal/.aidlc/runs/PORTAL-REBRAND-001/`. Updated `anti/anti-test.md`, `anti/anti.sh`, `anti/anti_check.py`, `anti/.gitignore`, `anti/kit-report.md`; added `anti/fix2-validation.txt`; appended `testkit/errors.md`.

### Running state

No server or Brave process started by this fix session; fresh `anti/out` not created. Run-1 archive retained.

### Verification

15/15 self-tests, bash syntax exit 0, mutations 2/2 killed; local account ignore confirmed. No live UI/Lighthouse acceptance measured and no S9 PASS claimed.

### Deferred + open questions

Dawn's service/account/resource prerequisites and coordinator review of actual screenshots/URL/heading evidence.

### Pick up here

Dawn creates private `anti/accounts.local.md` and supplies missing prerequisites. Anti then follows updated brief, executes one fresh runner run, and grades only its new `anti/out` after cleanup.
