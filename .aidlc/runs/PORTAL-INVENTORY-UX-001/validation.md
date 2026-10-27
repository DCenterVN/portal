# Kiểm tra plan lượt 2, 27/10/2026

Đối chiếu codex-plan-inventory-ux-r2.md và R33. Đây là kiểm tra tài liệu, không là receipt SDLC hay PASS sản phẩm.

## Cấu trúc và scope

- `rtk proxy python3 -B .aidlc/runs/PORTAL-INVENTORY-UX-001/check-plan-r2.py` exit 0.
- Script import engine thật, gọi `sdlc.plan_problems(load_policy(portal), plan)` trả `[]`; không gọi CLI new/use/approve/verify/done/board, không tạo receipt/trace.
- 9 slice ID duy nhất S1–S6/S8–S10; 31 file duy nhất; số file từng slice: S1=3, S2=2, S3=4, S4=5, S5=4, S6=4, S8=3, S9=5, S10=1. Mọi file slice nằm trong Files planned, mọi file planned có slice. Giới hạn ≤12 slice/≤5 file đạt.
- Files planned dùng đúng bullet đường dẫn trong backtick. Test command từng slice đầy đủ, bắt đầu rtk. Requirements có AC trực tiếp, không bị heading con che; cả 4 stage tài liệu được engine nhận.
- Tóm tắt 10 dòng, trọn trong 15 dòng đầu. Plan/impact/validation và các file code hiện có trong scope ≤400 dòng. Regression file nợ >400 chỉ read-only theo D-INVUX-001.
- Loại 5 file giá khỏi Files planned: lib/api/goods-receipts.ts, goods-receipts.test.ts, supplier-agreements.ts, supplier-agreements.test.ts, inventory/types.ts. S4 chỉ layout/guard hiện tại; S8 chỉ UX/i18n/spec tương ứng; S9 không POST giá mới.
- Cuối plan có đúng 5 slice dự kiến P1–P5 của PORTAL-RECEIPT-PRICE-001 sau INVENTORY-PRICE-NULLABLE-001, đủ phụ thuộc và owner inventory backend/portal. Không nằm trong Slices/Files planned và không là check chờ backend của task UX.
- Tính lại intersection31file với master SUPPLIER-UX-002, chuẩn hoá prefix portal/: 12 slice master trùng. S20/S4 chồng5file phải bàn giao một owner layout, không chờ giá mới.

## Spec và R33

- `rtk proxy python3 -B /home/dawn/agent_skills/sdlc/engine/speccheck.py --lint .aidlc/specs/supplier-contract.md` exit 0, output `ok   supplier-contract.md`.
- Spec có sẵn được lint read-only, không sửa ngoài run. S8 tương lai giữ luật giá read-only/coverage/API/DTO/errors, chỉ bổ sung UI.
- AC-7 có “e2e web stable 3/3”. S9 có lần đầu toàn suite task, thêm `--repeat-each=3 --retries=0 --workers=1`, full e2e repo project desktop `--repeat-each=1 --retries=0 --workers=1`, và full vitest tests/integration một lượt.
- Task suite gồm inventory-ux + 3 supplier-contract specs, storageState theo quyền dùng lại, sửa setup explicit login để không login thêm trong 3 lượt. Giữ oracle giá/quyền/revoke/restore.
- Full repo project giữ desktop1440×900, screenshot options gốc/updateSnapshots=none, absolute testDir và snapshotPathTemplate theo {testDir}; không thừa kế webServer3000, task filter/state không áp sang repo. Visual/catalog không skip do đổi tên project hoặc trỏ nhầm baseline.
- RAM ≥3000MiB trước từng lượt, runtime>3003, screenshot từng bước/lượt, report X/Y x3 và lỗi flaky. Flaky chưa xong; không waitForTimeout/retry/tăng timeout bừa/skip để xanh. DONE triển khai sau này cần stable 3/3 hoặc flaky <ca>, khác DONE plan-r2 lần này.

## Rà độc lập

- Reviewer hard-mode do sdlc-plan yêu cầu đọc brief/plan/source liên quan, không sửa file hoặc chạy sản phẩm.
- Hai phát hiện đã đưa vào S9/Tests planned: config storageState không loại login tường minh trong spec; project chromium-repo làm visual/catalog desktop skip và config lồng làm lệch baseline.
- Bổ sung auth setup trong đúng5file S9, giữ project desktop và đường dẫn baseline tuyệt đối; không mở rộng file hoặc thay oracle giá. Reviewer đọc lại xác nhận hai lỗi đã giải quyết, không còn vấn đề trọng yếu trong plan/impact; validation này đã cập nhật counts/phụ thuộc r2.

## Giới hạn và bàn giao

- r2-preflight.json ghi1074file repo ngoài run trước sửa; check hash và inventory cuối đều không đổi. ACTIVE vẫn PORTAL-CATALOG-SPLIT-001; backlog/board/gate/baseline/trace/code/fixture/generated không sửa.
- preflight.json và engine-bootstrap/ lượt1 giữ nguyên. Lần đầu import parser thiếu đường dẫn otlp, đã thêm engine.parent vào sys.path; kiểm tra cuối exit0, không sửa engine.
- RAM khả dụng đầu lượt4987MiB≥3000. Không unit/e2e/browser/server/build/container, không chạm :3000–3003; không approve/commit/push. Những test trong plan là dự kiến sau duyệt, không claim đã xanh.
- File DONE ngoài run là ngoại lệ output được brief chỉ định, ghi đúng counts 9/31/5 và r33 co. Các ghi khác chỉ thuộc run này.
- Lỗi snapshot nền ghi ở audit trước vẫn cần owner xử lý riêng nếu tái hiện trong hồi quy; không giả suite nền PASS hoặc skip để đóng task. Không phụ thuộc tính năng giá tương lai để thực hiện slice UX.

## Pick up here

Đọc plan.md và impact.md; coordinator bàn giao owner S20/frame, runtime/account/fixtures hiện hành. Chỉ cook sau quy trình duyệt của repo, giữ giá hiện tại. Task giá đề xuất cuối plan có scope/approval/verification riêng, không thêm check nullable/MAP/Q5/Q6 vào UX.
