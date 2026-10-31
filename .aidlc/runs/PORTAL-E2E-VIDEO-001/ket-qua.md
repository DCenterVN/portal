# Kết quả hành trình nghiệp vụ

## S4

Chạy trên DEV `http://localhost:3002` bằng `npm run e2e:record -- e2e/journeys/kho.spec.ts`. Một ca dài, dữ liệu NCC, hợp đồng, phiếu nhập và mã lô có hậu tố thời gian. Hai nguyên liệu KG lấy từ danh mục hiện có qua bộ chọn UI; không dùng fixture NCC/hợp đồng cũ. Mọi thao tác ghi qua UI, API chỉ đọc kết quả. PNG thật 1×1, 70 byte, tạo bằng Buffer trong test; từng mục đích có bytes khác nhau.

| Bước | Kết quả | Bằng chứng nghiệp vụ |
|---|---|---|
| 1. Tạo NCC | PASS | NCC mới lưu `ACTIVE`, đúng tên đã nhập |
| 2. Lập và áp dụng bảng giá | PASS | Hai dòng KG, giá 25.000 và 40.000 VND, có chứng từ; phiên bản `ACTIVE` |
| 3. Tạo phiếu hai dòng | PASS | 10 kg và 5 kg; tự điền giá, chốt cặp tham chiếu hợp đồng/dòng giá; tổng dự kiến 450.000 VND; phiếu `DRAFT` |
| 4. Thiếu ảnh thì chặn nhận | PASS | Điền đủ lô, lượng, HSD, nhiệt độ nhưng nút nhận bị khóa; 0 lệnh receive, lượng thực nhận cả hai dòng vẫn 0 |
| 5. Tải ảnh và nhận lệch | PASS | Sáu ảnh hàng/chứng từ/lệch hoàn tất; thiếu riêng chứng từ hoặc ảnh lệch vẫn khóa nút; đúng 2 lệnh receive, hai lô `RECEIVED`, thực nhận 8 kg và 6 kg |
| 6. Giải trình lệch | PASS | Ghi dự kiến 15 kg, thực nhận 14 kg, có giải thích và ảnh lệch |
| 7. Lượng và tiền thực nhận | FAIL | Dòng và lô đúng 8/6 kg, tiền dòng đúng 200.000/240.000 VND. Tổng ở cấp phiếu giữ 450.000, màn lịch sử dùng nhãn “Tổng thực nhận” thay vì hiển thị 440.000 VND |
| 8. Tăng tồn | CHƯA CHẠY | Dừng tại bước 7. Không kết luận tồn hoặc giá vốn đủ điều kiện QC đã đúng |

Hai lượt đầu sửa lỗi test: trace đã được runner bật sẵn; finalize ảnh trả 200 theo handler, không phải 201. Lượt ba phát hiện tổng phiếu 450.000 khác tổng thực nhận 440.000. `inbound-read.md:58` không quy định trường tổng cấp phiếu phải đổi sau receive, nên lượt cuối giữ nguyên kỳ vọng tiền nghiệp vụ và kiểm trực tiếp nhãn tổng trên UI, không ép thay contract API. Tối đa 4 lượt, không retry tự động, không skip hoặc sửa app/backend.

Lượt cuối: 4 setup PASS, 1 hành trình FAIL tại `e2e/journeys/kho.spec.ts:237`. Video: `e2e-report/data/e96dbb1b4df7ee8506c6d48a0d117dc9fc5cab23.webm`. Báo cáo: `e2e-report/index.html`. Trace: `node_modules/.cache/playwright-results/journeys-kho-KHO-bảng-giá--1e995-lượng-tồn-và-tiền-thực-nhận-desktop/trace.zip`. Ảnh cuối đã xem xác nhận màn hiển thị 450.000 VND bên trên hai dòng 200.000 và 240.000 VND.

## Lỗi chức năng

### S4: lịch sử nhập hiển thị sai tổng tiền thực nhận — ĐÃ SỬA (af60b57), chạy lại 1/11 trên :3003 PASS

- Hành trình: KHO, bước 7; màn `/inventory/suppliers/[id]?tab=receipts`.
- Mong đợi: dự kiến `10 × 25.000 + 5 × 40.000 = 450.000`; khi nhận `8 kg` và `6 kg`, “Tổng thực nhận: 440.000 VND”, khớp tổng hai dòng `200.000 + 240.000`.
- Thực tế: receipt `RECEIVING`, hai dòng actual_quantity/actual_amount_vnd đúng, hai lô thuộc đúng phiếu và dòng, lượng initial/remaining đúng 8/6. `total_amount_vnd` vẫn 450000. Portal dùng trường này để hiện “Tổng thực nhận: 450.000 VND”.
- Nghi ngờ chính: `features/inventory/supplier-receipts-view.tsx:30` lấy nguyên `receipt.total_amount_vnd` cho nhãn thực nhận; trong khi tiền thực nhận từng dòng đã có ở `features/inventory/supplier-receipts-view.tsx:38`.
- Đối chiếu backend: `/home/dawn/work/ticket/inventory/internal/store/receipt_evidence.sql.go:56` cộng lượng nhận và đổi trạng thái, không đổi total_amount_vnd; `/home/dawn/work/ticket/inventory/internal/application/supplier_receipts.go:53` trả nguyên tổng này; `/home/dawn/work/ticket/inventory/internal/store/query/supplier_receipts.sql:16` tính riêng actual_amount_vnd theo lượng thực nhận. Chưa kết luận backend phải thay nghĩa trường tổng. Contract màn đọc: `/home/dawn/work/ticket/inventory/.aidlc/specs/inbound-read.md:60` yêu cầu tách thực nhận và dự kiến.

### S5: bảng giá NCC ACTIVE chưa cấp được giá vốn cho món dùng nguyên liệu mới — ĐÃ SỬA (inventory 97cdc03 + production d26766c), chạy lại 1/11 PASS

- Hành trình MÓN → BÁN, bước 6; màn `/production/food-plans?tab=dishes&draft=…`. Ca đỏ tại `e2e/journeys/mon-ban.spec.ts:215`, lượt 4/4, ngày 01/11/2026 giờ Việt Nam.
- Mong đợi theo S5: nguyên liệu mới đã có bảng giá NCC ACTIVE `100000 VND/KG`, hai suất dùng `0,2 KG` trực tiếp và `0,02 KG` qua gói gia vị, hao hụt 0%; giá vốn đầy đủ `20000 + 2000 = 22000 VND/kit`, `11000 VND/suất`.
- Thực tế: bảng giá `HD-MON-1793467078704` version 2, `status=ACTIVE`, `effective_status=ACTIVE`, hiệu lực 01/11/2026–31/12/2027; đúng SKU `01a192f8-60fb-71fe-89f0-e376f7172d8a`, UOM KG, giá 100000. Phản hồi UI cost-preview HTTP 200, đúng hai lượng `0.2` và `0.02 KG`, nhưng cả hai dòng `missing=NO_PRICE`, `unit_price_vnd=null`, `cost_vnd=null`, `price_source=null`; `complete=false`, tổng/kit và tổng/suất đều 0. UI hiện hai dòng “Chưa có giá”, “Tổng / kit: 0 ₫ · chưa đủ”. Đã xem ảnh cuối xác nhận.
- Nghi ngờ chính: `/home/dawn/work/ticket/production/internal/adapter/sales/material_catalog.go:253` lấy quote từ batch sales; dòng 260 chỉ gọi `seedQuote`, dòng 268 bỏ nguyên liệu thiếu giá/quy cách seed. Không đọc bảng giá inventory ở đường này. `/home/dawn/work/ticket/production/internal/application/cost_preview.go:96` đánh dấu NO_PRICE khi không có quote. Portal hiển thị đúng phản hồi tại `features/production/dishes/dish-cost-view.tsx:9` và dòng 10.
- Đây là chỗ thiếu nối nguồn giá của hành trình S5, không kết luận inventory lưu sai bảng giá hoặc portal tính sai lượng. `production/.aidlc/specs/recipe-cost-preview.md:10` định nghĩa tra PriceSource và thiếu quote thì báo thiếu giá; implementation riêng này chỉ dùng giá seed. Kết quả chưa chứng minh giá vốn kế toán sau QC hay giá sàn bán hàng. Không đổi kỳ vọng sang 0, không thêm seed bằng API, không sửa app/backend.
- Video FOOD_DEV: `e2e-report/data/a300455f00a24e152ac6cc0f8f9ed4d2cd8fc9a7.webm`; video kho: `e2e-report/data/71607e1dfd91de7928fad31d6da0cb161e6290c7.webm`. Trace: `node_modules/.cache/playwright-results/journeys-mon-ban-MÓN-→-BÁN-28c02-i-mở-bán-đúng-giá-cho-khách-desktop/trace.zip`. Trong trace có attachment JSON của versions và cost-preview để đối chiếu cùng SKU.

### Mới sau chạy lại 1/11: không có thao tác "Mở bán" cho món đã hoàn tất

- Hành trình MÓN → BÁN, bước 8; ca đỏ tại `e2e/journeys/mon-ban.spec.ts:342` (lượt cuối, chạy cả 3 file).
- Mong đợi: sau bước 7 (món DONE, biến thể 2 người) người dùng bấm nút mở bán, nhập giá 55.000 ₫ và xác nhận; biến thể thành "Đang bán"; khách xem được món ở bước 9.
- Thực tế: trên màn món không có nút "Mở bán" (không tìm thấy phần tử, hết 5 giây). Đường duy nhất tới giá bán là `/sales/pricing`, bắt người dùng gõ UUID sản phẩm, biến thể, định mức, bảng giá (`features/sales/pricing-floor-view.tsx:110`–`114`, đề xuất giá dòng 128), không phải đường mở bán từ món. Bước 9 chưa chạy được.
- Đây là lệch L11 đã ghi trong `hanh-trinh.md` mục 5.12 (chưa có thao tác kích hoạt mở bán). Không đổi kỳ vọng, không gọi API ghi để vượt.

### Giới hạn chưa kiểm: tồn khả dụng và giá vốn sau QC

Theo `inventory/.aidlc/specs/inbound-receiving.md`, lot chưa `APPROVED` không tăng tồn khả dụng. `inventory/.aidlc/specs/receipt-cost-lineage.md` chỉ cho fact của lot đạt QC đóng góp vào giá vốn. Code nhận hàng tạo lot `RECEIVED` tại `inventory/internal/application/goods_receipt_receive.go:138`; stock projection chạy theo sự kiện duyệt lot tại `inventory/internal/application/stock_projection_service.go:16`. Hành trình hiện chỉ thao tác nhận hàng, chưa có thao tác QC qua UI. Cập nhật chạy lại 1/11: bước 7 đã PASS nên bước 8 chạy, nhưng chưa có màn QC nhập kho (features/inventory không có màn duyệt lô; phía inventory chỉ có API `qc-decisions`), nên bước 8 chỉ chứng minh lô RECEIVED KHÔNG làm tăng tồn (chênh 0 ở cả hai SKU). Tồn tăng 8 kg/6 kg và giá vốn sau QC: CHƯA KIỂM, chưa có màn. Không ghi đây là lỗi cộng tồn backend, không gọi API ghi để vượt gate QC. Thành tiền nhập 440.000 cũng chưa chứng minh giá vốn đủ điều kiện QC hoặc công thức bình quân theo lượng nhận.

## S5

Chạy `npm run e2e:record -- e2e/journeys/mon-ban.spec.ts` trên DEV :3002, tối đa 4 lượt, không retry tự động. Một ca dài, 9 bước tiếng Việt, các phiên FOOD_DEV/WAREHOUSE/CUSTOMER tách bằng storageState. Dữ liệu mới gồm nguyên liệu, NCC, bảng giá, họ món, gói gia vị/công thức và nháp món; tên có hậu tố thời gian. Nguyên liệu được gán hai cấp nhóm có sẵn, không tạo taxonomy mới. Nhánh âm chọn một nguyên liệu chưa phân nhóm có sẵn qua UI, không sửa nguyên liệu đó. Mọi thao tác ghi qua UI; API chủ động gọi chỉ GET, phản hồi POST được quan sát từ thao tác UI.

| Bước | Kết quả lượt cuối | Bằng chứng |
|---|---|---|
| 1. Tạo nguyên liệu và gán nhóm | PASS | Tên mới, KG, có mã nhóm, UI xếp vào ngăn Rau, nháp hai người dùng 100 g/suất |
| 2. Kho cấp giá nguyên liệu | PASS | Bảng giá mới ACTIVE, đúng SKU/KG/100000 VND, hiệu lực đang áp dụng |
| 3. Tạo gói gia vị | PASS | Gói mới, công thức BOM_ACTIVE gồm đúng 10 G, yield 100%, chọn vào món, gia vị bắt buộc |
| 4. Chặn nguyên liệu chưa nhóm | PASS | Cảnh báo đúng nhóm/ngăn, nút hoàn tất khóa, 0 lệnh hoàn tất, nháp OPEN/progress rỗng sau lưu; tải lại vẫn khóa; thay về nguyên liệu có nhóm thì nút mở |
| 5. Kho không sửa món | PASS | Cùng nháp đúng tên; tên, lượng, lưu và hoàn tất bị khóa; GET nháp trước/sau giống nhau |
| 6. Giá vốn đủ 22.000 VND | FAIL | HTTP 200, lượng đúng 0.2/0.02 KG nhưng hai NO_PRICE, complete=false, tổng 0/chưa đủ |
| 7. Hoàn tất tạo gói nguyên liệu/bộ món | CHƯA CHẠY | Dừng tại bước 6 |
| 8. Mở bán 55.000 VND | CHƯA CHẠY | Dừng tại bước 6; còn thiếu UI nối định giá/kích hoạt như hành trình 5.9–5.12 đã ghi |
| 9. Khách đăng nhập xem đúng giá | CHƯA CHẠY | Trang khách vẫn about:blank; không coi video trống là bằng chứng |

Kết quả: 4 setup PASS; hành trình 0/1 PASS, 5/9 bước PASS trọn vẹn, 1 FAIL, 3 chưa chạy. Ba lượt đầu sửa lỗi test: phạm vi hai bộ chọn nguyên liệu; nhãn select đơn vị gồm nội dung lựa chọn; nguyên liệu không nhóm kéo theo cả thiếu ngăn đóng gói. Lượt 4 tới lỗi chức năng giá, giữ assert đỏ. Không chạy lượt 5.

HTML mới nhất: `e2e-report/index.html`. Video và trace S5 ở mục lỗi phía trên. Các đường dẫn S4 thuộc lượt trước; runner Playwright thay output/report khi chạy S5, không coi chúng là artifact còn được giữ ở báo cáo hiện tại.
