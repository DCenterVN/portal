# Deploy portal lên Vercel

## Trước khi public
- Đọc báo cáo audit `codex-portal-public-vercel.out.md` trong thư mục plans của ticket.
- Dawn quyết định giữ lịch sử hay tạo bản public một commit; chưa tự động đổi visibility.
- Rà email cá nhân, ảnh, `.aidlc/` và ghi chú nội bộ; token hết hạn vẫn là dữ liệu từng bị lộ.
- CI phải xanh cả `verify` và `secrets`; đặt hai job này làm required checks cho main.

## Project
- Tạo project Vercel trong đúng team, root `.` của repo portal, framework Next.js.
- Chọn Node `22.x`; `.mise.toml` ghim Node `22.23.1`, pnpm `9.15.4` cho CI.
- Install command `pnpm install --frozen-lockfile`, build command `pnpm run build`.
- Giữ Output Directory mặc định Next.js; Vercel tự nhận `packageManager`, không cần `vercel.json`.
- Nếu import Git để tạo project, vào Project Settings → Git → Disconnect ngay sau đó.
- Chỉ GitHub workflow deploy qua CLI; tắt Git auto-deploy để tránh deploy vượt CI hoặc trùng lần.
- CI gọi `deploy.yml` qua `needs: [verify, secrets]`: PR nội bộ → Preview, push main → Production.
- PR fork và Dependabot không deploy, không nhận Vercel secrets; không dùng `pull_request_target`.
- Chỉ cho contributor đáng tin tạo branch nội bộ vì build PR nội bộ được dùng deployment token.

## Environment variables trên Vercel
- Cấu hình cho cả Preview và Production, rồi redeploy nếu đổi.
- `NEXT_PUBLIC_SITE_URL=https://<domain-public>` là URL công khai hợp lệ, tuyệt đối không chứa secret.
- Preview dùng URL/domain preview riêng nếu cần kiểm canonical/CSRF; không dùng hostname nội bộ.
- `PORTAL_AUTH_MODE=prod`, tuyệt đối không sao chép `dev` từ `.env.example` lên Vercel.
- Chưa có BE: bỏ trống toàn bộ `*_INTERNAL_URL`, `*_SERVICE_URL`, `PORTAL_INTERNAL_URL`.
- Bỏ trống `PORTAL_CLIENT_IP_SOURCE`; `trusted-kong` không phù hợp request vào Vercel trực tiếp.
- Landing và form auth render được; catalog báo không khả dụng, đăng nhập trả 503.
- `/traceability/[code]` hiện có thể trả 500; `/readyz` trả 503 khi chưa có BE.
- Khi có BE, khai `AUTH_SERVICE_URL` và các `ORG/SALES/INVENTORY/PRODUCTION_INTERNAL_URL`.
- API Lab/readiness còn dùng `AUTH/INTEGRATION/NOTIFICATION_INTERNAL_URL`; xem bảng env trong báo cáo.
- Các URL BE phải là endpoint HTTPS truy cập được từ Vercel; tên compose/IP LAN không dùng được.
- Vercel không có IP egress cố định theo mô hình đã chọn; BE cần xác thực, không dựa vào allowlist IP FE.
- Chưa cần DB/Redis hay OAuth secret: app hiện không đọc các biến tương ứng trong `.env.example`.

## Ba GitHub secrets
- Repo → Settings → Secrets and variables → Actions → New repository secret.
- `VERCEL_TOKEN`: Vercel Account Settings → Tokens, tạo token đúng team và thời hạn cần dùng.
- `VERCEL_ORG_ID`: Team Settings → General → Team ID, hoặc `orgId` trong `.vercel/project.json`.
- `VERCEL_PROJECT_ID`: Project Settings → General → Project ID, hoặc `projectId` cùng file trên.
- Không commit `.vercel/` hoặc token; workflow chỉ truyền secrets vào bước deploy.
- CLI ghim `vercel@48.0.0`; build chạy trên Vercel và dùng env của đúng Preview/Production.
- Sandbox offline chưa chạy thử CLI/network; kiểm lần CI đầu trước khi công bố domain.

## Domain và nghiệm thu
- Project Settings → Domains: thêm domain, tạo DNS theo đúng record Vercel hiển thị, chờ TLS xanh.
- Đặt `NEXT_PUBLIC_SITE_URL` bằng domain HTTPS đó, deploy lại production.
- Kiểm `/`, `/products`, `/login`, `/staff/login`, `/healthz`; chấp nhận BE offline như trên.
- Kiểm PR fork chỉ có CI và PR nội bộ chỉ ra Preview; merge main mới ra Production.
