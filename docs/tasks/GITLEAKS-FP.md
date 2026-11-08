# GITLEAKS-FP — allowlist hẹp cho 9 báo nhầm gitleaks trên lịch sử portal

Status: DONE

## CONTEXT
- CI job `secrets` chạy `gitleaks detect --source . --config .gitleaks.toml --log-opts="--all" --redact --exit-code 1` (gitleaks 8.21.2) và FAIL với 9 leaks.
- Claude đã kiểm 9 chỗ đều là báo nhầm (rule `generic-api-key`):
  - `lib/api/auth-journey-bff.test.ts` (dòng 1, 39), `app/api/auth/bff.test.ts` (219), `app/api/auth/staff/bff.test.ts` (1), `lib/api/auth-review-fix.test.ts` (10): hằng `identityToken` / `storeToken` giả trong unit test.
  - `.aidlc/runs/PORTAL-MOTION-001/logs/head-control-fix1.json`, `.aidlc/runs/PORTAL-MOTION-001/logs/test-revision.json`: map tên file → mã băm, không phải khoá.
  - `.aidlc/runs/PORTAL-MOTION-001/tests/motion-login.spec.mjs` dòng 104: hằng `WRONG` là mật khẩu cố ý sai cho test rung.
- Binary gitleaks đúng bản: `/home/dawn/work/ticket/.cache/gitleaks/gitleaks`.

## REQUIRED
1. Sửa `.gitleaks.toml`: thêm allowlist HẸP, không tắt rule, không allowlist cả thư mục mã nguồn.
   - Test file: chỉ bỏ qua khi path khớp `\.test\.tsx?$` VÀ match là gán `identityToken` hoặc `storeToken` (regexTarget = "match").
   - `.aidlc/`: thư mục log quy trình cũ (đã bỏ AIDLC), allowlist theo path `^\.aidlc/`.
   - Mỗi allowlist có `description` tiếng Việt ngắn nói vì sao.
2. Giữ nguyên allowlist `frame.lock.json` sẵn có, `useDefault = true`.
3. Không rewrite lịch sử git, không sửa file test.

## CONSTRAINT
- Không commit, push, stash. Không dùng /tmp; tạm dùng /home/dawn/work/ticket/.cache.

## ACTION
Kiểm trên đúng tập ref CI thấy (chỉ nhánh có trên origin), không dùng `--all` trên máy vì máy có commit lẻ không có trên GitHub:
- `/home/dawn/work/ticket/.cache/gitleaks/gitleaks detect --source . --config .gitleaks.toml --log-opts="origin/main" --redact --exit-code 1` → phải exit 0.
- Chứng minh allowlist không quá rộng: tạo tạm 1 file `lib/__gitleaks_probe.ts` (KHÔNG phải test) chứa `const identityToken = "<một chuỗi ngẫu nhiên 40 ký tự>"`, chạy `gitleaks detect --no-git --source lib --config .gitleaks.toml --redact --exit-code 1` → phải FAIL (bắt được). Rồi xoá file probe.
- `git diff --check`.

## OUTPUT
- File này: Status DONE + "## Kết quả" (diff tóm tắt, lệnh + exit code). Câu hỏi ghi cuối.

## Kết quả

- `.gitleaks.toml`: thêm hai allowlist cho rule `generic-api-key`.
  - Unit test: `condition = "AND"`, path `\.test\.tsx?$`, `regexTarget = "match"`, chỉ khớp phép gán chuỗi cho đúng tên `identityToken` hoặc `storeToken`.
  - Quy trình cũ: path `^\.aidlc/`.
  - Mỗi allowlist mới có mô tả tiếng Việt. Giữ nguyên allowlist `frame.lock.json` và `useDefault = true`.
- Dùng gitleaks **8.21.2**, ref `origin/main` tại `7cc4e58`, quét 175 commit.
- Lệnh kiểm tra và exit code:
  - `/home/dawn/work/ticket/.cache/gitleaks/gitleaks version` → **0**, `8.21.2`.
  - `/home/dawn/work/ticket/.cache/gitleaks/gitleaks detect --source . --config .gitleaks.toml --log-opts="origin/main" --redact --exit-code 1` → trước sửa **1**, 9 leaks; sau sửa **0**, không còn leak.
  - Tạo `lib/__gitleaks_probe.ts` chứa phép gán `identityToken` bằng chuỗi ngẫu nhiên 40 ký tự; chạy `/home/dawn/work/ticket/.cache/gitleaks/gitleaks detect --no-git --source lib --config .gitleaks.toml --redact --exit-code 1` kèm report JSON trong cache → **1**, bắt đúng probe bằng rule `generic-api-key`. Đã xoá probe.
  - Kiểm tra bổ sung bằng fixture `.test.ts` trong cache: cùng một chuỗi ngẫu nhiên, gán cho `identityToken`, `storeToken`, `otherToken` → **1**, chỉ bắt dòng `otherToken`. Đã xoá fixture và report tạm.
  - `git diff --check` → **0**.
- Không sửa file test có sẵn, không rewrite lịch sử, không commit/push/stash. Tệp tạm chỉ dùng `/home/dawn/work/ticket/.cache`.

Câu hỏi: không có.
