Chạy ghi hình: `npm run e2e:record -- e2e/<bộ>`
Mở báo cáo: `npx playwright show-report e2e-report`
Bấm ca → Video/Trace để xem lại.

## inventory-ux

Chạy bộ này bằng cách thay `<bộ>` bằng `inventory-ux`. Các ca dùng phiên nhân viên kho và nhà cung cấp, hai nguyên liệu, giá đã chuẩn bị sẵn. Không có bước đăng nhập hay lập bảng giá trong ba ca này.

Đường dẫn bắt đầu bằng `portal/` hoặc `inventory/` tính từ `/home/dawn/work/ticket`, giống `hanh-trinh.md`. Dẫn chứng kiểm thử tính từ bản làm việc hiện tại. Tên ca giữ nguyên văn; phần mô tả dùng lời thường.

Mỗi số là một thao tác hoặc lần đọc trên màn hình, theo thứ tự kiểm thử, kể cả bước mở trang chung trước mỗi ca. Khi ô chọn đã có đúng tên thì ca bỏ qua việc gõ và chọn tên đó. Chụp ảnh và kiểm dữ liệu lưu bên dưới không tính thành thao tác màn hình. Dòng “Chưa kiểm” không phải bước đã chạy. Dấu “—” trong cột Lệch nghĩa chưa thấy lệch ở phần được kiểm, không khẳng định đã kiểm hết yêu cầu.

### TC-07: hai dòng, ngày Việt, tổng hợp đồng và tạo nháp đọc lại

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở trang tạo phiếu nhập. | Thấy ô Nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 2 | Gõ một phần tên nhà cung cấp đã chuẩn bị, nếu ô chưa có đúng tên. | Có tên cần chọn trong danh sách. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 3 | Chọn nhà cung cấp đó, nếu ô chưa có đúng tên. | Ô Nhà cung cấp hiện đúng tên. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 4 | Gõ `27/10/2026` vào Ngày dự kiến nhập. | Ngày được nhập theo thứ tự ngày, tháng, năm. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 5 | Gõ một phần tên nguyên liệu thứ nhất ở dòng 1, nếu chưa chọn đúng. | Có nguyên liệu cần chọn. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 6 | Chọn nguyên liệu thứ nhất, nếu chưa chọn đúng. | Dòng 1 hiện đúng tên nguyên liệu. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 7 | Gõ `2.5` vào Số lượng dòng 1. | Đã nhập lượng hai phẩy năm cho dòng 1. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 8 | Bấm Thêm dòng nhập. | Có dòng 2; con trỏ vào ô Nguyên liệu dòng 2. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 9 | Gõ một phần tên nguyên liệu thứ hai ở dòng 2, nếu chưa chọn đúng. | Có nguyên liệu cần chọn. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 10 | Chọn nguyên liệu thứ hai, nếu chưa chọn đúng. | Dòng 2 hiện đúng tên nguyên liệu. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 11 | Gõ `1` vào Số lượng dòng 2. | Đã nhập lượng một cho dòng 2. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 12 | Đọc Tổng tiền dự kiến. | Tổng bằng lượng hai phẩy năm nhân giá dòng 1, làm tròn về đồng, cộng giá dòng 2; hiển thị số tiền theo cách viết Việt Nam và đơn vị đồng. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 13 | Tải lại trang tạo phiếu. | Ngày vẫn là 27/10/2026 và dòng 2 vẫn giữ đúng tên nguyên liệu. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 14 | Bấm Tạo phiếu nhập khi nút đã cho phép bấm. | Thấy “Đã tạo phiếu nhập”. Ca còn kiểm chỉ tạo một phiếu. | `inventory/.aidlc/specs/inbound-receiving.md:22`; `portal/.aidlc/specs/supplier-contract.md:23` | Chỉ bấm một lần; chưa chứng minh bấm hai lần vẫn chỉ tạo một phiếu như `portal/.aidlc/specs/supplier-contract.md:23` yêu cầu. Thao tác tại `e2e/inventory-ux/inventory-ux.spec.ts:48`, kiểm một lần ghi tại `e2e/inventory-ux/inventory-ux.spec.ts:54`. |
| 15 | Mở thẳng phần Lịch sử nhập trong hồ sơ nhà cung cấp vừa chọn. | Đến phần lịch sử của nhà cung cấp đó. | `inventory/.aidlc/specs/receipt-cost-lineage.md:15`; `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | — |
| 16 | Tải lại trang lịch sử. | Lịch sử được tải lại; ca kiểm dữ liệu lưu có phiếu nháp, đúng nhà cung cấp, tổng tiền và hai lượng đã nhập. | `inventory/.aidlc/specs/receipt-cost-lineage.md:15`; `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | — |
| 17 | Đọc phần Lịch sử nhập. | Thấy ít nhất một phiếu và số tiền tổng trong phần lịch sử. | `inventory/.aidlc/specs/receipt-cost-lineage.md:15`; `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | Màn hình chỉ được kiểm có phiếu đầu tiên và tổng tiền, chưa chứng minh chính phiếu mới tạo hiện đủ trạng thái, hai dòng và lượng trên màn; các chi tiết này chỉ được kiểm trong dữ liệu trả về. `e2e/inventory-ux/inventory-ux.spec.ts:60`; `e2e/inventory-ux/inventory-ux.spec.ts:67`; `e2e/inventory-ux/inventory-ux.spec.ts:68`. |
| Chưa kiểm | Thử nhà cung cấp không đủ điều kiện hoặc dòng hàng sai. | Không tạo phiếu khi nhà cung cấp không hoạt động, không đủ hạng, chứng từ bắt buộc chưa xác minh hoặc hết hạn; dòng hàng phải hợp lệ. | `inventory/.aidlc/specs/inbound-receiving.md:22` | Ca chỉ dùng dữ liệu hợp lệ, chưa thử các điều kiện từ chối này; `e2e/inventory-ux/inventory-ux.spec.ts:28`; `e2e/inventory-ux/inventory-ux.spec.ts:31`. |
| Chưa kiểm | Thử xóa dòng, giới hạn dòng và các trường hợp giá hoặc lượng đặc biệt. | Không xóa dòng cuối; thêm hoặc xóa trả con trỏ đúng; tối đa 100 dòng; kiểm ba số lẻ, làm tròn, tràn số, thiếu giá khác giá bằng không và giá chỉ đọc. | `portal/.aidlc/specs/supplier-contract.md:23` | Ca chỉ thêm dòng thứ hai và kiểm một tổng tiền, chưa kiểm các trường hợp còn lại; `e2e/inventory-ux/inventory-ux.spec.ts:33`; `e2e/inventory-ux/inventory-ux.spec.ts:38`. Yêu cầu giá chỉ đọc ở `portal/.aidlc/specs/supplier-contract.md:23` còn khác yêu cầu cho sửa giá thực tế ở `inventory/.aidlc/specs/receipt-cost-lineage.md:15`. |
| Chưa kiểm | Đổi hoặc ngừng bảng giá rồi đọc lại phiếu và nhận hàng. | Giá đã chốt giữ nguyên; tiền nhận hàng theo lượng thực nhận. | `inventory/.aidlc/specs/receipt-cost-lineage.md:15`; `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | Ca kết thúc ở lịch sử phiếu nháp, chưa đổi bảng giá hoặc nhận hàng; `e2e/inventory-ux/inventory-ux.spec.ts:62`; `e2e/inventory-ux/inventory-ux.spec.ts:69`. |
| Chưa kiểm | Thử lại khi tạo phiếu lỗi và kiểm nội dung nháp sau tải lại. | Giữ nháp theo chi nhánh; thử lại cùng nội dung không tạo trùng; khi đang lưu không sửa được biểu mẫu. | `portal/.aidlc/specs/supplier-contract.md:23` | Chưa thử lỗi, gửi lại hoặc khóa biểu mẫu; sau tải lại chỉ khẳng định ngày và tên nguyên liệu dòng 2, chưa kiểm hết nội dung nháp; `e2e/inventory-ux/inventory-ux.spec.ts:40`; `e2e/inventory-ux/inventory-ux.spec.ts:41`; `e2e/inventory-ux/inventory-ux.spec.ts:42`; `e2e/inventory-ux/inventory-ux.spec.ts:48`. |

### TC-08: không tìm thấy và ngày sai không tạo phiếu

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở trang tạo phiếu nhập. | Thấy ô Nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 2 | Gõ `zzzz-khong-co-ncc` vào ô Nhà cung cấp. | Danh sách hiện “Không tìm thấy”. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 3 | Gõ một phần tên nhà cung cấp đã chuẩn bị. | Có tên cần chọn trong danh sách. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 4 | Chọn nhà cung cấp đó. | Ô hiện đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 5 | Gõ `31/02/2026` vào Ngày dự kiến nhập. | Ô nhận chuỗi ngày để kiểm tra khi rời ô. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 6 | Rời ô Ngày dự kiến nhập. | Thấy “Nhập ngày hợp lệ”; nút Tạo phiếu nhập không cho bấm. Ca còn kiểm chưa có lần gửi tạo phiếu. | `portal/.aidlc/specs/supplier-contract.md:23` | Chưa điền nguyên liệu và số lượng nên việc nút bị khóa, không gửi tạo phiếu chưa tách riêng được nguyên nhân ngày sai; `e2e/inventory-ux/inventory-ux.spec.ts:78`; `e2e/inventory-ux/inventory-ux.spec.ts:82`; `e2e/inventory-ux/inventory-ux.spec.ts:83`. |
| Chưa kiểm | Thử tìm không dấu, theo mã, danh sách rỗng và lỗi tải. | Tìm đúng theo tên hoặc mã; phân biệt không có kết quả với chưa có dữ liệu; lỗi tải không cho chọn dữ liệu cũ. | `portal/.aidlc/specs/supplier-contract.md:21` | Chỉ thử một chuỗi không có kết quả rồi chọn theo tên; `e2e/inventory-ux/inventory-ux.spec.ts:75`; `e2e/inventory-ux/inventory-ux.spec.ts:78`. |
| Chưa kiểm | Thử chọn bằng bàn phím và sửa tên sau khi đã chọn. | Bấm phím Enter chọn mà không gửi phiếu; phím Escape hoặc Tab đóng danh sách; sửa nội dung tìm bỏ lựa chọn cũ. | `portal/.aidlc/specs/supplier-contract.md:21` | Ca chỉ gõ và bấm chọn trong danh sách, chưa kiểm các thao tác này; `e2e/inventory-ux/inventory-ux.spec.ts:18`; `e2e/inventory-ux/inventory-ux.spec.ts:19`. |
| Chưa kiểm | Thử ngày năm nhuận, ngày hợp lệ trở lại và cách hiển thị ngày khác. | Kiểm đúng lịch và năm nhuận; ngày vẫn theo thứ tự ngày, tháng, năm trong mọi ngôn ngữ. | `portal/.aidlc/specs/supplier-contract.md:23` | Ca chỉ thử ngày 31/02/2026 rồi dừng; `e2e/inventory-ux/inventory-ux.spec.ts:79`; `e2e/inventory-ux/inventory-ux.spec.ts:84`. |

### TC-07/12: list ACTIVE, hồ sơ chip và bảng không tràn sáng tối

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở trang tạo phiếu nhập. | Thấy ô Nhà cung cấp. | Không có bước tương ứng trong yêu cầu danh sách và hồ sơ tại `portal/.aidlc/specs/supplier-contract.md:25`. | Bước mở trang dùng chung chạy cả trước ca hồ sơ, ngoài hành trình đang kiểm; `e2e/inventory-ux/inventory-ux.spec.ts:24`; `e2e/inventory-ux/inventory-ux.spec.ts:87`. |
| 2 | Mở trang danh sách nhà cung cấp. | Bộ lọc mặc định là đang hoạt động. | `portal/.aidlc/specs/supplier-contract.md:25`; `inventory/.aidlc/specs/supplier-management.md:22` | — |
| 3 | Gõ mười ký tự đầu tên nhà cung cấp đã chuẩn bị vào ô tìm theo tên hoặc mã. | Thấy liên kết mang đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25`; `inventory/.aidlc/specs/supplier-management.md:22` | — |
| 4 | Bấm tên nhà cung cấp đó. | Hồ sơ hiện tiêu đề đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25` | Tên ca nói đến nhãn nhóm nhưng chỉ kiểm tiêu đề và chụp ảnh, chưa kiểm tên nhóm cha hoặc nhãn nhóm con; `e2e/inventory-ux/inventory-ux.spec.ts:93`; `e2e/inventory-ux/inventory-ux.spec.ts:94`. |
| 5 | Đổi chiều rộng cửa sổ sang 375 điểm ảnh, chiều cao 900 điểm ảnh. | Cửa sổ chuyển sang kích thước cần xem. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 6 | Tải lại trang hồ sơ. | Tiêu đề vẫn đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 7 | Xem hồ sơ ở giao diện sáng. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 8 | Xem hồ sơ ở giao diện tối. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 9 | Đổi chiều rộng cửa sổ sang 768 điểm ảnh, chiều cao 900 điểm ảnh. | Cửa sổ chuyển sang kích thước cần xem. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 10 | Tải lại trang hồ sơ. | Tiêu đề vẫn đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 11 | Xem hồ sơ ở giao diện sáng. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 12 | Xem hồ sơ ở giao diện tối. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 13 | Đổi chiều rộng cửa sổ sang 1024 điểm ảnh, chiều cao 900 điểm ảnh. | Cửa sổ chuyển sang kích thước cần xem. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 14 | Tải lại trang hồ sơ. | Tiêu đề vẫn đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 15 | Xem hồ sơ ở giao diện sáng. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 16 | Xem hồ sơ ở giao diện tối. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 17 | Đổi chiều rộng cửa sổ sang 1440 điểm ảnh, chiều cao 900 điểm ảnh. | Cửa sổ chuyển sang kích thước cần xem. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 18 | Tải lại trang hồ sơ. | Tiêu đề vẫn đúng tên nhà cung cấp. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 19 | Xem hồ sơ ở giao diện sáng. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| 20 | Xem hồ sơ ở giao diện tối. | Phần nội dung chính không hiện mã định danh dài hoặc chuỗi dữ liệu lỗi; trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca đổi giao diện trực tiếp trong trang, chưa bấm nút đổi giao diện; `e2e/inventory-ux/inventory-ux.spec.ts:100`. |
| Chưa kiểm | Đổi bộ lọc trạng thái, tìm theo mã và tải thêm danh sách. | Lọc và tìm đúng; đổi điều kiện tìm bắt đầu lại danh sách, không giữ kết quả cũ. | `portal/.aidlc/specs/supplier-contract.md:25`; `inventory/.aidlc/specs/supplier-management.md:22` | Ca chỉ kiểm trạng thái mặc định rồi tìm một tên; `e2e/inventory-ux/inventory-ux.spec.ts:88`; `e2e/inventory-ux/inventory-ux.spec.ts:89`. |
| Chưa kiểm | Đọc sáu cột, nhãn nhóm, liên hệ và mở bảng giá từ danh sách. | Đủ mã, tên, nhóm cha, liên hệ, trạng thái, bảng giá; nhãn dài đọc được khi trỏ hoặc đưa con trỏ bàn phím vào; thiếu liên hệ có lời báo. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca chỉ tìm liên kết tên và chụp ảnh danh sách, chưa kiểm nội dung các cột hay mở bảng giá; `e2e/inventory-ux/inventory-ux.spec.ts:90`; `e2e/inventory-ux/inventory-ux.spec.ts:91`. |
| Chưa kiểm | Xem trạng thái đang tải, rỗng, lỗi và xóa lọc; xem nhóm chưa khai hoặc nhóm cũ trong hồ sơ. | Có lời báo đúng trạng thái; xóa lọc về mọi trạng thái; lỗi tải nhóm không che liên hệ và địa chỉ. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca chỉ mở một hồ sơ có sẵn; `e2e/inventory-ux/inventory-ux.spec.ts:92`; `e2e/inventory-ux/inventory-ux.spec.ts:93`. |
| Chưa kiểm | Xem bảng cuộn riêng và mở danh sách chọn trong khung hẹp. | Bảng cuộn trong khung riêng; danh sách chọn không bị cắt. | `portal/.aidlc/specs/supplier-contract.md:25` | Ca chỉ đo cả trang không tràn ngang trên hồ sơ, chưa kiểm bảng cuộn riêng hay danh sách chọn bị cắt; `e2e/inventory-ux/inventory-ux.spec.ts:101`; `e2e/inventory-ux/inventory-ux.spec.ts:102`. |
