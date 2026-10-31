# Backlog: portal

<!-- One user story per line: `- US-001: As a <role> I want <x> so that <y> (spec: .aidlc/specs/<feature>.md)`.
     Tasks = runs: `sdlc.py new <TASK> --story US-001 --sprint 01`. Progress: `sdlc.py board` -> planning/board.md.
     Specs and ADRs are small files, one feature / one decision each, linked from plan.md - never pasted. -->

- US-UI-001: Operator portal UI and auth screens
- US-UI-002: As a customer, employee, or organization owner I want separate API-backed journeys for shopping, branch work, and organization administration so I can complete my tasks with no cross-scope access (specs: ../sales/.aidlc/specs/order-lifecycle.md, ../org/.aidlc/specs/org-admin.md, ../org/.aidlc/specs/employee-onboard.md).

- US-INVENTORY-UX-001: Nhân viên kho chọn đúng nhà cung cấp và nguyên liệu, đọc được tổng phiếu nhập và thông tin NCC để lập phiếu không phụ thuộc hợp đồng bắt buộc (plan: .aidlc/runs/PORTAL-INVENTORY-UX-001/plan.md).
- US-INBOUND-UX-001: (Dawn 31/10) Nhân viên kho mở phiếu nháp, nhận hàng từng dòng kèm ảnh hàng + chứng từ giao hàng (bắt buộc), ghi lệch số lượng có ảnh, để lô vào kho có bằng chứng (backend: ../inventory/.aidlc/specs/inbound-receiving.md, inbound-trace-storage.md).
- US-DISH-GUARD-001: (Dawn 31/10) FOOD_DEV không hoàn tất được món khi có nguyên liệu chưa thuộc nhóm hợp lệ, để ngăn đóng gói không bị gán sai (theo handoff 31/10 mục 3.3).
- US-E2E-VIDEO-001: (Dawn 31/10) Dawn xem được e2e đã làm gì: mỗi ca có video + trace + kịch bản tiếng Việt từng bước, codex chạy và gửi lại kết quả, để Dawn tự tin trước khi merge.
