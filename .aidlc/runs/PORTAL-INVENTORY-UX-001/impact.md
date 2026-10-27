# Tiền kiểm phạm vi PORTAL-INVENTORY-UX-001, lượt 2

Worktree price-a, 27/10/2026. Audit kế hoạch, không phải receipt hay kết quả triển khai. R2 chỉ sửa tài liệu run và file DONE theo brief.

## Delta so với lượt 1

- Còn 9 slice, 31 file. Giữ S1–S6/S8–S10 để tránh nhầm ID bàn giao; bỏ S7 và 5 file API giá khỏi Files planned.
- S4 chỉ ghép ngày/bảng/tổng và tách hook/container, giữ giá read-only/coverage/price_line_ref, draft/payload/quyền/key hiện tại. Không còn phần B chờ backend giá.
- S8 chỉ spec/câu chữ picker/ngày/bảng/list/chip, giữ API/DTO/errors và luật giá hiện tại. S9 chỉ UX và POST theo contract hiện hữu, không giá tay/no-refs/Q5/Q6.
- Nullable, Q5/Q6, giá gần nhất và SKU→nhóm sang 5 slice dự kiến cuối plan, đề xuất PORTAL-RECEIPT-PRICE-001 sau INVENTORY-PRICE-NULLABLE-001. Không đăng ký check giá tương lai trong verification UX.
- AC-7/S9 có R33: full suite task xanh 1 lần, thêm 3 lượt không retry bằng storageState theo quyền, full e2e/integration repo 1 lượt. Flaky là chưa xong, ghi ca+ảnh; không skip/retry để xanh.
- Engine sdlc.py:830–834 dùng gate_missing toàn task khi done. Unit slice PASS chưa đủ để tick; r2 loại check chờ backend giá khỏi task, giữ gate và tính trung thực verification.

## Graph và caller đã rà ở lượt 1

- Audit lượt 1 dùng graph price-a-portal, index 2026-10-27T00:06:37Z: search EntityPicker, trace inbound 7 caller trực tiếp; check_index_coverage có test/e2e gaps, đã đọc source bù. R2 không refresh index và không claim discovery mới.
- Scope search lượt 1: EntityPicker/entity-picker trong components/features/app/e2e/lib, không chỉ inventory. R2 thay phạm vi plan, không sửa source.

| Caller runtime | Regression giữ trong task |
|---|---|
| features/inventory/goods-receipt-form.tsx:95,98 | NCC/NL serializeValue=false; form test S4, web S9. |
| features/inventory/supplier-agreement-form.tsx:26 | NL tên/mã/UOM; supplier-agreement-form.test.tsx read-only. |
| features/inventory/shelves-view.tsx:111 | Lệnh sản xuất; shelves-view.test.tsx giữ callback/state khi focus mở list. |
| features/production/targets-view.tsx:135 | Product; targets-view.test.tsx và production.test.tsx. |
| features/production/food-plans-view.tsx:148,158 | Product/food set; production.test.tsx. |
| features/production/food-sets-view.tsx:208,215 | Family/package; production.test.tsx. |
| features/production/packages-view.tsx:153 | Family; production.test.tsx. |

Giữ value/onChange/serializeValue/filter/maxOptions/name. Không thêm i18n provider bắt buộc cho primitive; default props tương thích caller cũ. Query không là ID, chevron/Enter không submit.

## Bằng chứng nguồn và tác động r2

File:line source dưới đây giữ từ audit lượt 1, không khẳng định line đứng yên khi worker khác sửa.

| File:line | Tác động trong phạm vi mới |
|---|---|
| components/ui/entity-picker.tsx:53,58,103,108 | Filter tên+meta đã có, required sau blur/invalid. S1 thêm click/focus/chevron và focus boundary, không viết lại search. Web xác minh lỗi sớm brief phản ánh. |
| components/ui/entity-picker.test.tsx:97,128,234 | Oracle no-match expanded theo panel; giữ ArrowDown/required/no UUID, thêm pointer/focus/keyboard. |
| features/inventory/goods-receipt-form.tsx:43,55,71,96 | Draft branch sku/quantity, valid bắt price_line_ref, date native. S4 giữ guard/draft/payload, chỉ tách và ghép layout/ngày. |
| features/inventory/goods-receipt-form.test.tsx:6 | Giữ oracle không có ô unit_cost_vnd, giá read-only/quyền; thêm bảng/tổng/ngày. |
| lib/api/goods-receipts.ts:9,17; lib/api/inventory/types.ts:5 | API optional giá/refs không cho phép UI tự bật giá mới. Chuyển read-only regression, không trong Files planned. |
| lib/api/supplier-agreements.ts:50,60 | Giữ resolver missing/error/multiple và semantics hiện tại, không sửa client lấy giá gần nhất. |
| lib/api/sales.ts:259; lib/api/inventory/types.ts:1 | sales.category_ref không là inventory leaf code. SKU mapping/filter chuyển task sau; list/chip NCC dùng material_category_codes đã có. |
| features/inventory/use-suppliers.ts:14,23 | S5 đổi default ACTIVE, giữ debounce250/cancel/reset cursor. |
| features/inventory/supplier-category-picker.tsx:17,39 | Renderer cha/chip đã dùng cả form, S6 tái dùng, không tạo bản song song. |
| features/inventory/supplier-detail-view.tsx:33,50 | Hồ sơ đã có renderer+taxonomy loader, giữ loading/error/migration. |
| lib/api/supplier-contract-bff.test.ts:18–21 | Oracle snapshot byte equality giữ nguyên. Progress lượt4 báo1271/1272 unit, fail snapshot; báo cáo cũ, r2 không chạy lại/claim baseline xanh. |
| frame.lock.json:33–34; scripts/frame-lock.mjs:13–30 | Picker/test/icons thuộc frame; S10 sinh manifest đúng delta owner review, không sửa FRAME_GLOBS/gate. |
| playwright.config.ts:19,23 | Gốc desktop/mobile và webServer3000. Config run-local không inherit server, BASE_URL>3003. |
| e2e/supplier-contract/receipt-gate.spec.ts:7,16,34,40 | Đổi ngày/selector và setup login sang state đã cấp; giữ giá read-only/ngoài kỳ chặn, không thành manual hợp lệ. |
| e2e/supplier-contract/supplier-contract.spec.ts:17–27,63–64; permissions.spec.ts:46,77 | Đổi selector nhãn thật + auth setup sang state theo quyền, giữ oracle auth/revoke/restore. Config state không tự vô hiệu explicit login trong spec. |
| e2e/visual/preview.spec.ts:72 | Screen tests phụ thuộc project.name=desktop. Hồi quy giữ desktop 1440×900, updateSnapshots=none, testDir tuyệt đối và snapshotPathTemplate theo {testDir} để config lồng không đổi baseline/skip. catalog-split.spec.ts:154 cũng phụ thuộc tên desktop; task filter/auth state không áp cho hồi quy vì catalog cần anonymous. |
| .aidlc/specs/supplier-contract.md:11 | Read-only/coverage phù hợp r2. S8 chỉ thêm UX, không bỏ luật giá/API hiện tại. |

## Test/fixture/snapshot

- Unit sửa: picker/form/list/category/detail; thêm date/line helpers/table tests. API goods-receipts/supplier-agreements tests read-only, không đổi expectations giá.
- mocks/supplier-contract.ts chỉ thêm contact/taxonomy theo shape API, giữ supplierID/materialID/agreements/defaults và giá sentinel999999. Web success dùng backend/fixture hiện tại thật, không mock.
- Regression read-only: shelves-view, targets-view, production, supplier-agreement-form, supplier-agreements-view, supplier-form, supplier-receipts-view; API goods-receipts/supplier-agreements/suppliers/material-categories/supplier-contract-bff.
- Gate read-only: app/rebrand.test.ts, app/ui-rules-gate.test.ts, app/frame-lock.test.ts, app/layout-gate.test.ts. Lock sinh qua tool có review, không nới assertion.
- Visual có preview.spec.ts và tokens desktop/mobile PNG, chưa có baseline inventory. Ảnh UX mới trong run/artifacts/e2e-web theo bước/lượt; không accept lại baseline shell/token.
- contracts/inventory.public.yaml và lib/contracts/operations.generated.ts dirty từ SUPPLIER, owner S41b riêng, không trong31file. Không sửa bytes/generated/oracle trong UX.
- R2 liệt kê full repo e2e: rbac/catalog-split/fooddev-set/fooddev-pack/supplier-contract/visual; integration tests/integration/portal-backend.it.test.ts. Project desktop chạy tất cả e2e một lượt, vitest tests/integration một lượt; không gọi riêng inventory-ux là hồi quy repo.
- Hồi quy có mutation cần fixture/account scopes QA, dữ liệu riêng mỗi lượt, cleanup API/UI. Thiếu môi trường không skip; >10 phút ghi chan e2e-web. R33 tái dùng state, retries=0, workers=1; không waitForTimeout/tăng timeout bừa.

## Giao thoa SUPPLIER-UX-002

Master tại /home/dawn/work/ticket/.aidlc/runs/SUPPLIER-UX-002/plan.md. Bảng intersection tính lại từ31file r2 bằng parser engine, bỏ prefix portal/ của master; tick là master đọc được, không là receipt/runtime.

| Slice master | Tick | File trùng trong r2 |
|---|---|---|
| S0b | [x] | frame.lock.json |
| S2 | [x] | features/inventory/suppliers-view.test.tsx, features/inventory/suppliers-view.tsx, features/inventory/use-suppliers.ts |
| S3 | [x] | features/inventory/supplier-detail-view.test.tsx, features/inventory/supplier-detail-view.tsx |
| S4 | [x] | features/inventory/supplier-detail-view.tsx |
| S6 | [x] | messages/vi.json, mocks/supplier-contract.ts |
| S10a | [x] | features/inventory/supplier-detail-view.test.tsx |
| S11 | [x] | features/inventory/supplier-detail-view.tsx |
| S20 | [ ] | app/(console)/inventory/goods-receipts/new/page.tsx, features/inventory/goods-receipt-container.tsx, features/inventory/goods-receipt-form.test.tsx, features/inventory/goods-receipt-form.tsx, features/inventory/use-goods-receipt.ts |
| S33 | [ ] | features/inventory/supplier-detail-view.tsx |
| S40a | [x] | messages/en.json, messages/vi.json |
| S40 | [x] | features/inventory/supplier-category-picker.test.tsx, features/inventory/supplier-category-picker.tsx, features/inventory/supplier-detail-view.tsx |
| S48 | [x] | features/inventory/supplier-detail-view.test.tsx, features/inventory/supplier-detail-view.tsx |


Thứ tự/owner:

1. Coordinator bàn giao file đã xong, giữ dirty diff. S20 chồng5file S4, chọn một owner layout hiện tại; không chờ S20 giá mới hoặc tự tick task kia. Phần giá S20 giao task giá riêng.
2. Frame owner phụ trách S1/S10. S1/S2/S3→S4, S5→S6, S8→S9→S10 theo plan; S8 giữ nội dung giá cũ.
3. S33 cùng sửa supplier-detail-view.tsx; task khác dùng messages/frame/fixture chung phải bàn giao trước/sau, không ghi đè ảnh/field ngoài UX.
4. S19/S25/S31/S39 API/types giá không còn intersection Files planned r2. Nullable/S41b/Q5/Q6/MAP giá mới giao task sau. Nếu lỗi nền snapshot tái hiện trong hồi quy, báo owner, không giả PASS hoặc nhét backend vào UX.

## Kích thước và giới hạn lượt r2

- Scope code hiện có theo audit lượt1 ≤400dòng; entity-picker.test.tsx315dòng cần giữ≤400. production.test.tsx1086/app/rebrand.test.ts1015 read-only, D-INVUX-001 đề xuất chưa ghi sổ.
- Không chạy new/use/approve/verify/done/board CLI, không sửa backlog/ACTIVE/trace/UI. Chỉ import parser thật với -B và lint spec có sẵn, không tạo receipt tay.
- preflight.json lượt1 giữ nguyên; r2-preflight.json ghi hash trước r2, validation.md kiểm tra mới. Hash không là verification sản phẩm.
- R2 đọc sdlc/sdlc-plan/unslop, tối đa3skill; reviewer hard-mode do sdlc-plan yêu cầu chỉ đọc, không chạy sản phẩm.
- START.md và ../AGENTS.md theo router không tồn tại; dùng CODEX.md/SKILL_ROUTER/RTK, AGENTS.md/AI_CONTEXT.md thực tế và tài liệu brief.
- RAM khả dụng đầu r2 4987MiB≥3000. Không workload nặng/server/browser/test sản phẩm, không chạm :3000–3003. DONE ngoài run là ngoại lệ output của brief.
