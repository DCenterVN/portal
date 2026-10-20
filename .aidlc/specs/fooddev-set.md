# FOOD_DEV set, FOODDEV-SET-001

## Usecase
FOOD_DEV tạo product DRAFT theo tên, target APPROVED rồi set nhiều nguyên liệu qua picker server, không nhập UUID. Một kit N suất, tổng suất nguyên = kit × servings_per_set; lưu/reload và sửa với revision server. PREPARATION không hiện thao tác review/publish/resume. WAREHOUSE có trang nhu cầu chỉ đọc, mọi quyền menu/API hỏi org, không so tên role.
Picker q/category gồm con/month/include_unknown/price_min/price_max/price_uom/cursor/limit dùng sales catalog. Hiển thị chưa có dữ liệu mùa khi scope toàn NULL, NULL khác quanh năm. Giá bán seed tham khảo theo KG/L/EA, thiếu quy cách không chọn được. Bảng kho có tổng đầy đủ và số dòng ẩn sau filter; không tạo PO/receipt/lot, không ghi to_buy khi chưa đọc tồn. 403/409/503 hiển thị rõ, không biến lỗi thành danh sách rỗng. E2E hai QA thật qua BFF/Kong, tên ngẫu nhiên và giữ dữ liệu/history; finally chỉ restore grants.

## API
BFF giữ contract sales và production, session xác thực ở server, không tin scope header từ browser.
| method | path | request | responses |
|---|---|---|---|
| GET | /api/sales/skus | - | 200, 400, 401, 403, 422, 503 |
| GET | /api/production/food-plans/{id}/material-requirements | - | 200, 400, 401, 403, 404, 422, 503 |
| GET | /api/production/targets/{id}/material-requirements | - | 200, 400, 401, 403, 404, 422, 503 |
