# Coordinator notes — PORTAL-ACTIVATE-001

Worktree `~/orca/workspaces/portal/portal-activate-001`. Test focused chạy bằng `ESBUILD_BINARY_PATH=$HOME/.local/share/esbuild/esbuild-0.21.5 node node_modules/vitest/vitest.mjs run <files>`.

## 2026-10-06 sáng (Claude)
| Slice | Commit | Nghiệm thu |
|---|---|---|
| S1 RED | `0a51b74` | 6 test đỏ, 3 test xanh (đêm 5/10) |
| S2 RED | `8a54a66` | 35 test đỏ, 207 test xanh |
| S3 GREEN | `7719523` | 251/251 xanh; 5/5 mutation bị bắt (activate thiếu password, success không chặt, rò body upstream, bỏ giới hạn 256 byte, bỏ retryAfterMs); verify PASS |
| S4 | `752061e` + `aed3c9e` | 8/8 xanh; 5/5 mutation bị bắt (đảo label, bỏ qua label tuỳ biến, toggle 40px, toggle submit, toggle không disabled); verify PASS |
| S5 RED | `b98a3c1` | 27 test đỏ, 51 test xanh, đỏ đúng lý do; 2 test cũ (tự kích hoạt khi mở trang) được thay theo plan |
| S6 GREEN | `7a7b5fa` | 481/481 focused; 7/8 mutation bị bắt; verify unit/lint/typecheck/arch/spec PASS |

**Mutation S6 còn sống:** bỏ `history.replaceState` (activate-view.tsx:85, xoá token khỏi URL). Test unit chạy SSR, không có `window`, nên không kiểm được. Plan :129 yêu cầu kiểm end-to-end. **S8 (Anti, browser) bắt buộc kiểm:** sau khi mở `/activate?token=…`, `location.search` phải rỗng. Ngoài ra trang phải có meta `referrer=no-referrer`.

**Ngoài phạm vi S3–S6, cần slice chỉ sửa test (Dawn duyệt lại plan):** 5 test trong `app/api/auth/bff.test.ts` vẫn gửi request chỉ có token. BFF đã bảo mật nên từ chối 400, đây là hành vi đúng. `app/rebrand.test.ts` báo ENOENT vì worktree thiếu `platform-docs/ui/tokens.json` (thiếu môi trường).

| S7 | `946e08f` | Selftest grader 34/34 + runner 9/9, mutant BFF-400 bị bắt. Claude tự phá thêm 4 chỗ (bỏ locationSearchEmpty, bỏ noReferrerMeta, cho phép synthetic, giảm touch-target 44→40) thì selftest đỏ cả 4; verify PASS |
| S8 | `ab30c9e` | RED: bản cũ (portal origin/main + auth:local) 17/17 FAIL. GREEN: auth `secfix-86294ee` (worktree sec-fix-auth-001 `86294ee`) + portal worktree 17/17 PASS, Claude chấm lại cả hai. Chạy 7m11s (~25s/ô). Log auth trong khung giờ: register 202, activate 200 ×1, 400 ×13 (ô negative), login 200/401, resend 202. Quét out/ và out-red/ không thấy token/JWT. UI-OPEN: zeroPostOnMount, locationSearchEmpty, noReferrerMeta đều =1 (đã lấp lỗ mutation S6 M5). verify `e2e_browser_green` PASS |
| S3b | `74beab0` | Chỉ sửa test `bff.test.ts`: 5 fixture cũ chuyển sang gửi {token,password}, thêm ca chỉ có token phải bị 400. Kết quả: 53/53 xanh, verify unit_s3b/lint/typecheck PASS. Mutation: bỏ check password bắt buộc (`auth-journey-bff.ts:171`) thì test đỏ 1/53. rebrand.test.ts báo ENOENT do worktree thiếu platform-docs/ui/tokens.json, lỗi môi trường đã biết |

Sau S8, auth local đã trả về `dcentervn/auth:local-before-s8` (bản phát hành). Image an toàn vẫn giữ ở tag `dcentervn/auth:secfix-86294ee`. Bằng chứng `anti/out/` và `anti/out-red/` chưa commit (untracked), commit cùng gate.

**Thứ tự release (D-147):** portal này gửi `{token,password}`. Auth cũ bỏ qua `password` và kích hoạt bằng token, nên portal mới trên auth cũ không an toàn. Phải deploy auth SEC-FIX trước, rồi mới tới portal (plan :126, OD-1 phương án A).

`done` chưa ghi: pipeline portal đòi check `integration*` và `e2e*`, sẽ có khi S8 xong.

## Review S9 (6/10, subagent hs:code-reviewer, báo cáo `scratchpad/portal-s9-review.md`): BLOCKED
- **C1, Claude đã tự kiểm lại và xác nhận:** `anti/out/kong-access.log` có 21 dòng, **0 dòng 429/503**. Các ô RATE-LIMIT/SERVICE-BUSY ghi 429/503 nhưng Kong cùng giây trả 400. CSRF có 1 POST activate lên upstream; STAFF-INVITE không có `/auth/invite/accept`; JOURNEY-SUCCESS ghi postsSent=1 trong khi Kong có 2 activate; CONCURRENT-SUBMIT không có request upstream. Grader `anti_check.py:490` chỉ kiểm "có 1 response Kong khác 429 trong cửa sổ ô".
- **Đính chính:** dòng S8 phía trên ("GREEN 17/17 PASS, Claude chấm lại") là SAI. Claude chỉ chấm lại output của grader, không đối chiếu từng ô với log Kong. Receipt `e2e_browser_green` của S8 KHÔNG được dùng để ship.
- **N1, đính chính thứ tự release:** probe thật vào auth cũ (`local-before-s8`) với `{token,password}` → 400 "unknown field password" (platform-go DisallowUnknownFields). Ship portal trước = kích hoạt hỏng toàn bộ (fail-closed), không phải chiếm tài khoản. Lỗ D-147 nằm ở auth. Vẫn ship auth trước, rồi portal liền sau trong cùng cửa sổ. Trước khi ra portal: probe Kong bằng token giả, phải nhận BAD_REQUEST/invalid_token; gặp "unknown field" thì dừng. Auth `86294ee` chưa có trên origin/main.
- N2/N3/T1/T6 → slice S6c (codex). C1 → S7b (grader đối chiếu Kong) + S8b (chạy lại, 429/503 thật hoặc BLOCKED). Đã thêm vào plan, chờ Dawn duyệt lại. T2–T5 để nợ nhỏ.
- Mutation riêng của reviewer: bị bắt 3/5. M1 (trim password) sống → T1 lấp. M4 (StrictMode, chỉ dev) sống.

## S6c (6/10 chiều, codex `2541081`): vá N2/N3/T1/T6 từ review S9
- Revert riêng từng file prod về bản trước S6c: activate-view.tsx (N2) đỏ 1, auth-journey-bff.ts (N3+T1) đỏ 5, next.config.mjs (T6) đỏ 1. Script ở `~/.local/share/sec-fix-coordinator/mut-portal-s6c.sh`.
- Mutant M1 của reviewer (BFF trim password) giờ đỏ 1/113, trước đây sống.

## S7b vòng 1 (Anti `9fe2352`, 6/10)
- Replay out/ của S8: đúng 6 FAIL (RATE-LIMIT, SERVICE-BUSY, CSRF, STAFF-INVITE, JOURNEY-SUCCESS, CONCURRENT-SUBMIT), 11 PASS — khớp grep log Kong của Claude.
- Mutation grader (`~/.local/share/sec-fix-coordinator/mut-portal-s7b.py`): G1 csrf, G2 staff route, G3 postsSent, G5 status match KILLED; G4 concurrent activate==0 và G6 owner login status SURVIVED (fixture chỉ xoá toàn bộ traffic / không đổi status owner). Trả S7b vòng 2 cho Anti, cùng file.
- S7b vòng 2 (Anti `caf97cb`, +4 dòng fixture, check_pace không đổi): mutation G1–G6 6/6 KILLED; selftest 42/42; replay S8 out đúng 11 PASS/6 FAIL. verify grader_selftest/runner_selftest/s8_replay_6fail/mut_s7b PASS. S7b đạt.
- S8b giao Anti 6/10 (dispatcher mới; owner kiểu cũ trong plan → AGENT tường minh).
