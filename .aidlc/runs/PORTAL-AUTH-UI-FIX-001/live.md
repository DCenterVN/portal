# S5 — Live (Kong :8000 + portal :3000)

Script chạy lại được: `evidence/live.sh` (integration, 21 mục), `evidence/e2e.sh`. Receipt: `artifacts/verification.json` (PASS 6/6, head ee7e72f).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Đăng xuất xoá access_token, refresh_token, CSRF-Token, portal_plane | PASS | live.sh |
| `?redirect=/cart` giữ đúng, `//evil.com` bị bỏ | PASS | live.sh |
| Khách chưa kích hoạt → 403 `reason: NOT_ACTIVATED` | PASS | evidence/fix-not-activated.txt |
| Superadmin PUT ma trận 200 rồi trả lại như cũ; OWNER PUT 403 | PASS | live.sh |
| `/roles` → 307 `/company` | PASS | live.sh |
| `/login`, `/register` → 307 popup `/?auth=…&redirect=…` | PASS | live.sh, evidence/s8-s9.txt |
| Sidebar theo key quyền (employee 30 key, OWNER 69, superadmin không vào console) | PASS | evidence/s8-s9.txt |
| Nghiệm thu UI bằng trình duyệt | Anti S7 | anti-walkthrough.md |
| 429 thật | Chưa đo | — |

Kong dev dùng `evidence/kong.merged.yml` (kong.yml main + service customer); thiếu route customer ở dev-infra là nợ S12.
