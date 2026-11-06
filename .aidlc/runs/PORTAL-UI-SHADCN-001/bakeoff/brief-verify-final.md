# Brief: chạy kiểm tra portal-ui-shadcn và báo kết quả (CHỈ ĐỌC, không sửa code)

CONTEXT: worktree này (nhánh feat/portal-ui-shadcn, chưa commit) vừa xong đợt sửa UI. Cần kết quả kiểm tra thật.

REQUIRED: chạy lần lượt từng lệnh dưới đây ở thư mục gốc worktree, KHÔNG qua pipe, ghi exit code thật của từng lệnh:
1. `pnpm vitest run components app features lib --exclude lib/api/supplier-contract-bff.test.ts`
2. `pnpm lint`
3. `pnpm tsc --noEmit`
4. `node scripts/check-structure.mjs --strict`
5. `pnpm next build --webpack`  (xong thì `git restore next-env.d.ts`)
6. `python3 ~/agent_skills/sdlc/engine/archcheck.py` — đếm số mục NEW và stale; liệt kê mục NEW theo rule id + file.

CONSTRAINT: không sửa file nguồn, không sửa baseline, không commit, không cài package. Không in mật khẩu/token/DSN. Lệnh fail thì ghi 10 dòng lỗi đầu, KHÔNG tự sửa. Không hỏi lại — thiếu gì thì ghi vào báo cáo.

OUTPUT: ghi file `.aidlc/runs/PORTAL-UI-SHADCN-001/bakeoff/result-final-codex.md` gồm: bảng lệnh | exit | số liệu chính (số test pass/fail, số NEW/stale) | thời gian chạy; rồi danh sách mục archcheck NEW. ≤60 dòng.
