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

## catalog-split

Các ca đăng nhập dùng tài khoản có sẵn; ca cần món hoặc quyền có thể bị bỏ qua khi thiếu dữ liệu phù hợp. Mỗi tên sinh theo kích thước và giao diện có một bảng riêng; thao tác lặp trong cùng ca được gộp. Chỉ mô tả điều mã kiểm thử khẳng định, chưa có kết quả chạy mới.

### anonymous không thấy control nhân viên

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục món khi chưa đăng nhập. | Có tiêu đề; không có bảng, liên kết quản trị hay thao tác nhân viên. | `sales/.aidlc/specs/product-lifecycle.md:16`; `org/.aidlc/specs/role-matrix.md:11` | — |

### anonymous thấy card có tên + giá, không thấy UUID

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục và xem thẻ món đầu tiên nếu có món. | Thẻ có ký hiệu đồng; nội dung không lộ mã định danh dài và không có nút yêu thích. | `sales/.aidlc/specs/product-lifecycle.md:16` | Tên ca nói có tên và giá nhưng chỉ kiểm ký hiệu tiền, chưa kiểm tên hoặc số tiền; `e2e/catalog-split/catalog-split.spec.ts:75`. |

### khách đã đăng nhập cũng không thấy control nhân viên

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập khách rồi mở danh mục món. | Đăng nhập thành công; danh mục không có bảng, liên kết quản trị hay thao tác nhân viên. | `auth/.aidlc/specs/login-session.md:11`; `sales/.aidlc/specs/product-lifecycle.md:16` | — |

### AC-2 chi tiết món công khai không có nút kích hoạt, SKU, barcode

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục rồi bấm món đầu tiên nếu có món. | Đến chi tiết công khai, có tiêu đề và không có nội dung hoặc nút quản trị. | `sales/.aidlc/specs/product-lifecycle.md:16` | — |
| Chưa kiểm | Kiểm giá và điều kiện mở bán của món đang xem. | Chỉ món đủ điều kiện được công khai. | `sales/.aidlc/specs/product-lifecycle.md:16` | Ca chỉ kiểm nội dung hiển thị và ẩn thao tác nhân viên; `e2e/catalog-split/catalog-split.spec.ts:90`. |

### staff có sales:product:read thấy menu Sản phẩm và màn quản trị

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng có quyền đọc sản phẩm. | Đăng nhập thành công; bỏ qua ca nếu tài khoản chưa được cấp quyền. | `auth/.aidlc/specs/login-session.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Mở trang điều hành rồi bấm Sản phẩm. | Đến màn quản trị, có tiêu đề Sản phẩm và không báo thiếu quyền. | `org/.aidlc/specs/authorization-check.md:15` | — |

### staff không có quyền đọc không thấy menu, vào URL trực tiếp bị chặn và không gọi staff list

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Lần lượt đăng nhập nhân viên kho, chế biến hoặc phát triển món để tìm người thiếu quyền đọc sản phẩm. | Có người thiếu quyền; nếu mọi người đều có quyền thì bỏ qua ca. | `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Mở trang điều hành rồi mở thẳng màn quản trị sản phẩm. | Không có liên kết Sản phẩm, báo không có quyền và không gửi yêu cầu đọc danh sách quản trị. | `org/.aidlc/specs/authorization-check.md:15` | — |

### khách không vào được /sales/products

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập khách rồi mở thẳng màn quản trị sản phẩm. | Không có nút tạo sản phẩm và được chuyển khỏi màn quản trị. | `org/.aidlc/specs/role-matrix.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |

### không tràn ngang ở /products

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục món. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:132`. |

### mobile 390: bộ lọc mở bằng sheet, Esc đóng, không tràn ngang

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Trên điện thoại rộng 390 điểm ảnh, mở danh mục rồi bấm Bộ lọc. | Nút cao ít nhất 44 điểm ảnh; khung lọc mở, có ô nhập và không làm tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:135`. |
| 2 | Bấm phím Escape. | Khung lọc đóng; con trỏ bàn phím trở lại nút Bộ lọc. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:150`. |

### desktop: bộ lọc nằm sẵn trong trang, không phải sheet

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục trên máy tính. | Không có hộp thoại; ô Sắp xếp nằm sẵn trên trang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:155`. |

### không tràn ngang ở 375px, light; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 375 điểm ảnh, giao diện sáng. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Bấm Bộ lọc và đọc khung lọc. | Có ô nhập; nút mở và Xoá lọc cao ít nhất 44 điểm ảnh; trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:190`. |
| 3 | Bấm phím Escape. | Khung lọc đóng; con trỏ bàn phím trở về nút Bộ lọc. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:193`. |

### không tràn ngang ở 375px, dark; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 375 điểm ảnh, giao diện tối. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Bấm Bộ lọc và đọc khung lọc. | Có ô nhập; nút mở và Xoá lọc cao ít nhất 44 điểm ảnh; trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:190`. |
| 3 | Bấm phím Escape. | Khung lọc đóng; con trỏ bàn phím trở về nút Bộ lọc. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:193`. |

### không tràn ngang ở 768px, light; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 768 điểm ảnh, giao diện sáng. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Bấm Bộ lọc và đọc khung lọc. | Có ô nhập; nút mở và Xoá lọc cao ít nhất 44 điểm ảnh; trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:190`. |
| 3 | Bấm phím Escape. | Khung lọc đóng; con trỏ bàn phím trở về nút Bộ lọc. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:193`. |

### không tràn ngang ở 768px, dark; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 768 điểm ảnh, giao diện tối. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Bấm Bộ lọc và đọc khung lọc. | Có ô nhập; nút mở và Xoá lọc cao ít nhất 44 điểm ảnh; trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:190`. |
| 3 | Bấm phím Escape. | Khung lọc đóng; con trỏ bàn phím trở về nút Bộ lọc. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:193`. |

### không tràn ngang ở 1024px, light; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 1024 điểm ảnh, giao diện sáng. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Đọc vùng lọc. | Không có hộp thoại; ô Sắp xếp hiển thị. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:181`. |

### không tràn ngang ở 1024px, dark; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 1024 điểm ảnh, giao diện tối. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Đọc vùng lọc. | Không có hộp thoại; ô Sắp xếp hiển thị. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:181`. |

### không tràn ngang ở 1440px, light; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 1440 điểm ảnh, giao diện sáng. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Đọc vùng lọc. | Không có hộp thoại; ô Sắp xếp hiển thị. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:181`. |

### không tràn ngang ở 1440px, dark; sheet lọc có Esc/focus/control ≥44px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 1440 điểm ảnh, giao diện tối. | Trang không tràn ngang. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:183`. |
| 2 | Đọc vùng lọc. | Không có hộp thoại; ô Sắp xếp hiển thị. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:181`. |

### mở sheet và gõ lọc không làm dịch bố cục trang

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở danh mục ở chiều rộng 375 điểm ảnh, mở Bộ lọc, gõ “bún” rồi bấm phím Escape. | Vị trí dọc và chiều cao nút Bộ lọc thay đổi không quá một điểm ảnh. | `sales/.aidlc/specs/product-lifecycle.md:16` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:207`. |

### ba nút trạng thái giữ #019, chọn đơn và aria-pressed đúng

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng, mở quản trị sản phẩm ở chiều rộng 1440 điểm ảnh. | Có ô tìm theo tên; bỏ qua nếu thiếu quyền đọc. | `auth/.aidlc/specs/login-session.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Lần lượt chọn Đang mở bán, Bản nháp rồi Tất cả. | Mỗi lần chỉ một trạng thái được chọn; chuyển màu nền 350 mili giây và màu chữ 300 mili giây. | `org/.aidlc/specs/authorization-check.md:15` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:233`. |

### icon tìm kiếm căn giữa ô nhập và không tràn ngang ở 375px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng, mở quản trị sản phẩm ở chiều rộng 375 điểm ảnh. | Có ô tìm theo tên; bỏ qua nếu thiếu quyền đọc. | `auth/.aidlc/specs/login-session.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Đọc ô tìm và ba nút trạng thái. | Biểu tượng tìm lệch tâm dọc không quá một điểm ảnh; trang không tràn ngang; các nút không vượt viền phải. | `org/.aidlc/specs/authorization-check.md:15` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:243`. |

### icon tìm kiếm căn giữa ô nhập và không tràn ngang ở 768px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng, mở quản trị sản phẩm ở chiều rộng 768 điểm ảnh. | Có ô tìm theo tên; bỏ qua nếu thiếu quyền đọc. | `auth/.aidlc/specs/login-session.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Đọc ô tìm và ba nút trạng thái. | Biểu tượng tìm lệch tâm dọc không quá một điểm ảnh; trang không tràn ngang; các nút không vượt viền phải. | `org/.aidlc/specs/authorization-check.md:15` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:243`. |

### icon tìm kiếm căn giữa ô nhập và không tràn ngang ở 1024px

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng, mở quản trị sản phẩm ở chiều rộng 1024 điểm ảnh. | Có ô tìm theo tên; bỏ qua nếu thiếu quyền đọc. | `auth/.aidlc/specs/login-session.md:11`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Đọc ô tìm và ba nút trạng thái. | Biểu tượng tìm lệch tâm dọc không quá một điểm ảnh; trang không tràn ngang; các nút không vượt viền phải. | `org/.aidlc/specs/authorization-check.md:15` | Chưa có yêu cầu bố cục tương ứng trong hành trình; `e2e/catalog-split/catalog-split.spec.ts:243`. |


## fooddev-pack

Dùng tài khoản phát triển món và nhân viên kho có sẵn, cùng năm nguyên liệu đã chuẩn bị. Các lần khai nhãn, tạo gói và công thức được gộp theo nhóm thao tác; ca có cả đọc dữ liệu và gửi lệnh trực tiếp ngoài màn hình.

### FOOD_DEV soạn gói/set, đổi nhãn, pin 100 suất 80/20; WAREHOUSE đọc oracle và write403

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và nhân viên kho ở hai phiên. | Cả hai đăng nhập thành công. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Mở Chỉ tiêu, tạo sản phẩm nháp rồi lưu chỉ tiêu 100 suất. | Chọn đúng sản phẩm mới; chỉ tiêu được duyệt. | `portal/.aidlc/specs/fooddev-set.md:4` | Ca điền đường dẫn sản phẩm bằng tay dù yêu cầu tự sinh từ tên; `e2e/fooddev-pack/fooddev-pack.spec.ts:108`. |
| 3 | Mở Gói + công thức, lần lượt khai nhãn cho bún, đạm đậu, rau xanh, cốt bò và cốt nấm. | Đã khai báo dị ứng; bốn nguyên liệu thực vật có nhãn chay, cốt bò không có. | `portal/.aidlc/specs/fooddev-set.md:8` | — |
| 4 | Tạo năm gói thuộc họ món, chọn nguyên liệu, lượng, đơn vị ki lô gam và tỷ lệ thu hồi rồi lưu hướng dẫn chế biến. | Công thức đầu tiên giữ đúng lượng, đơn vị và tỷ lệ; cốt bò thu hồi 80 phần trăm, bốn gói còn lại 100 phần trăm. | `portal/.aidlc/specs/fooddev-set.md:10` | Ca tự nhập mã gói dù mã phải tự sinh và chỉ đọc; `e2e/fooddev-pack/fooddev-pack.spec.ts:142`. |
| 5 | Bấm thẻ Set, tạo rồi sửa hai bộ bún bò và bún chay với bốn ô tinh bột, đạm, rau và cốt. | Hai bộ dùng cùng tập gói, cốt mặc định khác nhau và cho đổi gói. | `portal/.aidlc/specs/fooddev-set.md:8` | Ca tìm thẻ Set trong khi màn hiện đặt tên Set (nâng cao); `e2e/fooddev-pack/fooddev-pack.spec.ts:279`. |
| 6 | Xem bộ bún bò rồi đổi cốt bò sang cốt nấm; mở tiếp bộ bún chay. | Ban đầu không có nhãn Chay; đổi cốt thì có Chay và nhãn tương ứng, bộ bún chay cũng được tính là chay. | `portal/.aidlc/specs/fooddev-set.md:8` | — |
| 7 | Mở Thực đơn, chọn họ món và bộ bún bò, nhập 25 bộ, bốn suất mỗi bộ và tỷ lệ cốt bò 80, cốt nấm 20 phần trăm rồi lưu. | Tổng 100 suất; dữ liệu giữ năm phiên bản công thức và hai tỷ lệ đã chốt. | `portal/.aidlc/specs/fooddev-set.md:11` | Ca gõ mã thực đơn và số suất mỗi bộ dù yêu cầu chọn bộ và tự lấy khẩu phần; `e2e/fooddev-pack/fooddev-pack.spec.ts:208`. |
| 8 | Tải lại thực đơn và đọc lại dữ liệu đã lưu. | Có 100 suất, bản sửa lần một; dữ liệu bằng kết quả vừa lưu. | `portal/.aidlc/specs/fooddev-set.md:11` | — |
| 9 | Nhân viên kho mở Nhu cầu nguyên liệu của chỉ tiêu. | Bún 20, đạm đậu 15, rau 5, cốt bò 10, cốt nấm 2 ki lô gam; đủ năm dòng, dùng bản sửa lần một. | `portal/.aidlc/specs/fooddev-set.md:11` | — |
| 10 | Dùng phiên kho gửi trực tiếp chín lệnh tạo hoặc sửa bộ món, gói, công thức, nhãn và thực đơn. | Tất cả bị từ chối; thực đơn, nhu cầu, bộ món, gói, công thức và nhãn đọc lại giữ nguyên. | `portal/.aidlc/specs/fooddev-set.md:4` | Các lệnh ghi bị từ chối được gửi trực tiếp, chưa thử thao tác qua màn hình; `e2e/fooddev-pack/fooddev-pack.spec.ts:252`. |
| 11 | Quay lại thực đơn bằng phiên phát triển món, mở Sửa set. | Giữ 25 bộ, bốn suất mỗi bộ và tỷ lệ cốt 80/20. | `portal/.aidlc/specs/fooddev-set.md:11` | — |
| Chưa kiểm | Thử tỷ lệ sai và xung đột hai người sửa. | Không chốt nhu cầu sai; xung đột giữ dữ liệu đang nhập. | `portal/.aidlc/specs/fooddev-set.md:10`; `portal/.aidlc/specs/fooddev-set.md:11` | Chỉ lưu một tỷ lệ hợp lệ với một người sửa; `e2e/fooddev-pack/fooddev-pack.spec.ts:218`. |
| Chưa kiểm | Tính giá sàn, đề xuất và duyệt giá rồi mở bán. | Giá được duyệt trước khi mở bán. | `sales/.aidlc/specs/price-book.md:9`; `sales/.aidlc/specs/product-lifecycle.md:14` | Ca dừng ở thực đơn và nhu cầu kho; `e2e/fooddev-pack/fooddev-pack.spec.ts:326`. |


## fooddev-set

Ba phiên quản trị viên, phát triển món và kho đăng nhập bằng tài khoản có sẵn. Các thao tác khôi phục quyền trong phần kết thúc ca là lệnh trực tiếp, không phải thao tác trên bảng quyền.

### FOOD_DEV tạo và sửa set; kho chỉ đọc; revoke có hiệu lực ngay và restore đúng snapshot

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập ba nhân viên; đọc và giữ tập quyền kho ban đầu. | Kho có quyền đọc nhu cầu nguyên liệu. | `org/.aidlc/specs/authorization-check.md:16` | — |
| 2 | Mở Chỉ tiêu, tạo sản phẩm nháp rồi lưu chỉ tiêu tám suất trong hai ngày. | Sản phẩm ở trạng thái nháp, chỉ tiêu được duyệt. | `portal/.aidlc/specs/fooddev-set.md:4` | Ca nhập đường dẫn sản phẩm bằng tay dù yêu cầu tự sinh; `e2e/fooddev-set/fooddev-set.spec.ts:88`. |
| 3 | Bấm Tạo set của chỉ tiêu, nhập mã và khẩu phần rồi chọn ba nguyên liệu ki lô gam, mỗi loại lượng 0,333. | Có đủ ba nguyên liệu để soạn thực đơn. | `portal/.aidlc/specs/fooddev-set.md:4` | — |
| 4 | Lọc nguyên liệu theo một danh mục. | Yêu cầu lọc thành công; lượng dòng ba vẫn là 0,333. | `portal/.aidlc/specs/fooddev-set.md:4` | — |
| 5 | Lưu, tải lại, mở sửa, nhập hai bộ rồi lưu và tải lại lần nữa. | Bản sửa tăng từ một lên hai; bốn suất mỗi bộ thành tám suất; dữ liệu đọc lại khớp. | `portal/.aidlc/specs/fooddev-set.md:4` | — |
| 6 | Nhân viên kho mở Nhu cầu nguyên liệu. | Mỗi nguyên liệu cần 2,664 ki lô gam; đủ ba dòng và đúng bản sửa thực đơn. | `portal/.aidlc/specs/fooddev-set.md:11` | — |
| 7 | Lọc tháng một, bỏ nguyên liệu chưa biết mùa và nhập giá từ một đồng. | Tập nhu cầu đầy đủ giữ nguyên; số dòng hiển thị cộng số dòng ẩn bằng tổng. | `portal/.aidlc/specs/fooddev-set.md:4` | — |
| 8 | Dùng phiên kho gửi trực tiếp lệnh tạo chỉ tiêu, tạo hoặc sửa thực đơn, duyệt, xuất bản và tiếp tục bàn giao. | Mọi lệnh bị từ chối; sau mỗi lệnh, thực đơn giữ nguyên. | `portal/.aidlc/specs/fooddev-set.md:4` | Chỉ thử lệnh trực tiếp, chưa kiểm nút ghi bị ẩn trên màn kho; `e2e/fooddev-set/fooddev-set.spec.ts:177`. |
| 9 | Quản trị viên thu hồi quyền đọc nhu cầu bằng lệnh trực tiếp. | Yêu cầu đọc kế tiếp của phiên kho bị từ chối. | `org/.aidlc/specs/authorization-check.md:16` | — |
| 10 | Khôi phục đúng tập quyền kho ban đầu ở phần kết thúc ca. | Đọc lại tập quyền khớp; phiên kho đọc được nhu cầu trở lại. | `org/.aidlc/specs/authorization-check.md:16` | — |
| Chưa kiểm | Thử hai người sửa cùng thực đơn. | Không ghi đè nhu cầu đã chốt; giữ nội dung nhập khi xung đột. | `portal/.aidlc/specs/fooddev-set.md:10` | Ca chỉ kiểm tăng bản sửa tuần tự; `e2e/fooddev-set/fooddev-set.spec.ts:142`. |


## fooddev-v2

Mỗi ca đăng nhập nhân viên phát triển món rồi mở trang soạn món; ba ca ở tệp fooddev-v2.spec.ts còn mở thẻ Set (nâng cao) trước khi bắt đầu. Ba ca đầu tệp dishes.spec.ts chạy nối tiếp và dùng món tạo ở ca đầu. Dữ liệu món, nguyên liệu và thực đơn nguồn cần có sẵn theo từng ca. Các mã ngắn trong tên ca được giữ nguyên văn.

### T1: M1 không tinh bột, nháp thiếu bền sau tải lại, hoàn tất

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Bấm Tạo món, đặt tên món thịt trâu rồi thêm thịt trâu nhưng để trống lượng. | Có nháp món chưa đầy đủ. | `sales/.aidlc/specs/dishes.md:8` | — |
| 3 | Lưu nháp và tải lại. | Tên món, lượng rỗng và danh mục rỗng giữ nguyên; nội dung lưu trước và sau tải lại bằng nhau. | `sales/.aidlc/specs/dishes.md:10` | — |
| 4 | Chọn danh mục, nhập nhãn, lượng thịt 150, thêm rau muống 200 và tỏi 10. | Các nguyên liệu được chọn vào dòng. | `sales/.aidlc/specs/dishes.md:10` | — |
| 5 | Thêm gói gia vị. | Không cho bỏ gia vị; tổng mỗi suất 360 gam, mỗi bộ 720 gam. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 6 | Đọc các ô rồi bấm Hoàn tất món. | Tên và danh mục sửa được; lượng và hao hụt sửa được, phần suy ra và giá vốn chỉ đọc; món có ô đạm và rau, trạng thái đã hoàn tất. | `sales/.aidlc/specs/dishes.md:12`; `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 7 | Bấm Về danh sách món. | Dòng món vừa tạo hiện Đã hoàn tất. | `sales/.aidlc/specs/dishes.md:12` | — |
| Chưa kiểm | Tính, duyệt giá và mở bán món vừa hoàn tất. | Chỉ mở bán sau khi đủ giá và điều kiện sản phẩm. | `sales/.aidlc/specs/product-lifecycle.md:14` | Hoàn tất soạn món chưa kiểm mở bán; `e2e/fooddev-v2/dishes.spec.ts:48`. |

### T2: nhân bản M1 → M2, chỉ gói đổi có ref mới

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Mở món thịt trâu đã tạo, bấm Nhân bản rồi đặt tên món thịt bò. | Nháp nhân bản mở với nội dung nguồn. | `sales/.aidlc/specs/dishes.md:8` | — |
| 3 | Thay thịt trâu bằng thịt bò, đọc các ô rồi hoàn tất. | Món mới khác món nguồn; gói rau được dùng lại, gói đạm đổi; dữ liệu món nguồn giữ nguyên. | `sales/.aidlc/specs/dishes.md:9` | — |
| Chưa kiểm | Thử nhân bản món ngoài phạm vi được phép. | Không đọc hoặc tạo nháp từ nguồn không được phép. | `sales/.aidlc/specs/dishes.md:8` | Ca chỉ dùng nguồn hợp lệ trong cùng phạm vi; `e2e/fooddev-v2/dishes.spec.ts:129`. |

### T3: biến thể 4 người dùng lại gói; REVISION OPEN trùng trả 409 và mở nháp cũ

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Mở món thịt trâu rồi bấm Tạo biến thể. | Mặc định bốn người, không có lựa chọn hai người; tổng mỗi bộ 1.440 gam, các lượng 600, 800 và 40 gam. | `sales/.aidlc/specs/dishes.md:8` | — |
| 3 | Đọc các ô rồi hoàn tất biến thể. | Tên và danh mục khóa; có hai biến thể, biến thể mới dùng lại gói nguồn. | `sales/.aidlc/specs/dishes.md:9` | — |
| 4 | Gửi trực tiếp lệnh tạo nháp biến thể trùng rồi hoàn tất nháp đó. | Từ chối do xung đột, trả đúng biến thể đã có. | `sales/.aidlc/specs/dishes.md:8` | Thử trùng biến thể bằng lệnh trực tiếp thay vì thao tác trên màn; `e2e/fooddev-v2/dishes.spec.ts:154`. |
| 5 | Chọn biến thể hai người và bấm Tạo bản sửa, đọc các ô. | Có nháp bản sửa; tên, danh mục và khẩu phần khóa. | `sales/.aidlc/specs/dishes.md:13` | — |
| 6 | Mở lại món, chọn biến thể hai người rồi bấm Tạo bản sửa lần nữa. | Báo đã có nháp bản sửa và trả đúng nháp đã mở. | `sales/.aidlc/specs/dishes.md:13` | — |
| 7 | Bấm Mở bản đang có. | Đến đúng nháp cũ; các trường vẫn khóa đúng. | `sales/.aidlc/specs/dishes.md:13` | — |
| Chưa kiểm | Thử sửa món đang bán hoặc đổi nguồn đã lưu. | Từ chối nguồn đang bán và giữ nguồn bất biến. | `sales/.aidlc/specs/dishes.md:9`; `sales/.aidlc/specs/dishes.md:13` | Ca chỉ tạo bản sửa cho món đã hoàn tất; `e2e/fooddev-v2/dishes.spec.ts:159`. |

### T5: tạo nguyên liệu chưa có ngay trong màn Món

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Tạo món, thêm dòng nguyên liệu, tìm “Me theo mùa S13” rồi chọn tạo nguyên liệu. | Mở biểu mẫu ngay trong vùng chọn. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 3 | Chọn nhóm Trái cây, nhóm con Trái cây tươi và đơn vị ki lô gam rồi tạo. | Tạo thành công; dòng nguyên liệu món hiện tên vừa tạo. | `portal/.aidlc/specs/fooddev-fields.md:10` | — |
| 4 | Đọc các ô, lưu nháp và tải lại. | Nháp còn nguyên liệu vừa tạo; ô giá vốn và các giá trị suy ra chỉ đọc. | `sales/.aidlc/specs/dishes.md:10` | — |

### T6: bản sửa M4 thay theo mùa, PREPARATION giữ nhu cầu đã ghim

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Đọc nhu cầu thực đơn đã chốt và mở món nguồn theo mùa, bấm Tạo bản sửa. | Giữ được dữ liệu nguồn để đối chiếu. | `sales/.aidlc/specs/dishes.md:9` | — |
| 3 | Thay đậu bắp bằng dọc mùng. | Chưa cho hoàn tất khi thiếu lý do sửa. | `sales/.aidlc/specs/dishes.md:10` | — |
| 4 | Nhập lý do đổi theo mùa, đọc các ô rồi hoàn tất. | Giữ cùng bộ món; gói rau thay mới, gói đạm giữ nguyên; hiện lý do sửa. | `sales/.aidlc/specs/dishes.md:9` | — |
| 5 | Đọc lại nhu cầu thực đơn đã chốt. | Nhu cầu giữ nguyên, vẫn có đậu bắp và không có dọc mùng. | `portal/.aidlc/specs/fooddev-set.md:11` | — |
| Chưa kiểm | Thử nhận hoặc xuất kho sau khi sửa món. | Lượng kho theo thực đơn đã chốt. | `portal/.aidlc/specs/fooddev-set.md:11` | Chỉ đối chiếu dữ liệu nhu cầu, chưa thực hiện nghiệp vụ kho; `e2e/fooddev-v2/dishes.spec.ts:213`. |

### Giá vốn: đúng một nguyên liệu thiếu giá, dòng và tổng báo chưa đủ

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Tạo món, thêm dọc mùng lượng 100, tỏi lượng 10 và một gói gia vị rồi lưu nháp. | Có dữ liệu để xem giá vốn. | `production/.aidlc/specs/recipe-cost-preview.md:10` | — |
| 3 | Đọc khung giá vốn và đối chiếu kết quả tính trực tiếp. | Đúng một dòng Chưa có giá; tổng mỗi bộ và mỗi suất báo chưa đủ; dòng dọc mùng có chi phí rỗng, tổng chưa đầy đủ. | `production/.aidlc/specs/recipe-cost-preview.md:11` | — |
| 4 | Đọc loại các ô. | Khung giá vốn không có ô cho sửa. | `production/.aidlc/specs/recipe-cost-preview.md:11` | — |
| Chưa kiểm | So giá bằng không, sai đơn vị và gói chưa có công thức. | Phân biệt thiếu giá với giá không đồng và các nguyên nhân thiếu khác. | `production/.aidlc/specs/recipe-cost-preview.md:10` | Chỉ thử một nguyên liệu chưa có giá; `e2e/fooddev-v2/dishes.spec.ts:230`. |
| Chưa kiểm | Đối chiếu số tiền khi đủ giá và kiểm không ghi bảng giá. | Tổng đúng; xem trước không làm đổi giá đã lưu. | `production/.aidlc/specs/recipe-cost-preview.md:11` | Ca không khẳng định tổng tiền cụ thể hoặc dữ liệu bảng giá giữ nguyên; `e2e/fooddev-v2/dishes.spec.ts:231`. |

### S14d: tạo 2 món liên tiếp trong cùng phiên → 2 nháp khác nhau

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Tạo món thứ nhất, đặt tên rồi lưu nháp. | Lưu thành công. | `sales/.aidlc/specs/dishes.md:8` | — |
| 3 | Về danh sách, tạo món thứ hai, đặt tên khác rồi lưu. | Hai nháp khác nhau, cùng phiên trang, mỗi nháp đúng tên và còn mở. | `sales/.aidlc/specs/dishes.md:8` | — |

### S14d: Nháp đang soạn có nút Tải thêm

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món và mở trang soạn món. | Thấy nút Tạo món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Chuẩn bị 41 nháp tạo mới hoặc nhân bản bằng lệnh trực tiếp; đọc đủ các trang nháp để đối chiếu. | Nháp còn mở; danh sách nguồn không lặp bản ghi. | `sales/.aidlc/specs/dishes.md:8` | Dữ liệu phân trang được tạo bằng lệnh trực tiếp, không soạn 41 món trên màn; `e2e/fooddev-v2/dishes.spec.ts:263`. |
| 3 | Tải lại rồi đọc Nháp đang soạn. | Có 20 dòng và nút Tải thêm. | `sales/.aidlc/specs/dishes.md:10` | Hành trình mới dẫn phần lưu nháp, chưa dẫn yêu cầu phân trang tại sales/.aidlc/specs/dishes.md:14; `e2e/fooddev-v2/dishes.spec.ts:286`. |
| 4 | Bấm Tải thêm cho đến hết. | Mỗi lượt thêm tối đa 20 dòng, đúng thứ tự nguồn; hết dữ liệu thì mất nút; 41 tên chuẩn bị đều hiện đúng một lần. | `sales/.aidlc/specs/dishes.md:10` | Hành trình chưa có bước tải thêm nháp tương ứng; `e2e/fooddev-v2/dishes.spec.ts:296`. |

### AC-4: nhóm hai cấp, tạo nguyên liệu tại dòng và xử lý trùng tên

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món rồi mở thẻ Set (nâng cao). | Có nút Tạo set món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Mở Gói + công thức, xem gói đạm và mở tạo hoặc sửa công thức. | Có hai ô chọn nhóm nguyên liệu. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 3 | Chọn nhóm Thịt rồi mở nhóm con. | Có lựa chọn Trâu. | `portal/.aidlc/specs/fooddev-fields.md:8` | — |
| 4 | Tìm “me chua”, chọn tạo mới, chọn nhóm Trái cây, nhóm con Trái cây tươi và đơn vị ki lô gam rồi tạo. | Không tìm thấy trước khi tạo; tạo xong hiện nguyên liệu trong công thức. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 5 | Mở tạo một nguyên liệu khác rồi đổi tên thành “Mè Chua”, chọn cùng hai nhóm và gửi. | Báo trùng với me chua; có nút Dùng nguyên liệu đã có. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 6 | Bấm Dùng nguyên liệu đã có. | Biểu mẫu đóng; chỉ còn một nhóm me chua trong công thức. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |

### AC-5: set Đạm Rau Gia vị không tinh bột; UI và API giữ gia vị bắt buộc

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món rồi mở thẻ Set (nâng cao). | Có nút Tạo set món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Tạo bộ món, chọn họ món và khẩu phần hai người, nhập mã, tên và nhãn rồi lưu. | Tạo nháp bộ món thành công. | `portal/.aidlc/specs/fooddev-set.md:8` | — |
| 3 | Mở sửa, lần lượt thêm ô Đạm, Rau và Cốt gia vị rồi chọn gói tương ứng. | Không có ô tinh bột. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 4 | Đọc tùy chọn bỏ gia vị rồi lưu. | Tùy chọn bị khóa và không được chọn; có lời giải thích; dữ liệu giữ đúng ba ô. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 5 | Tải lại và xem bộ vừa lưu. | Ô Đạm chứa gói đã chọn. | `portal/.aidlc/specs/fooddev-set.md:8` | — |
| 6 | Gửi trực tiếp lệnh cho phép bỏ gia vị cuối cùng rồi đọc lại bộ món. | Bị từ chối; gia vị lưu vẫn không được bỏ. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |

### AC-6/7: bảy trường là danh sách/chỉ đọc, không hiện UUID trên mọi màn đã đi

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên phát triển món rồi mở thẻ Set (nâng cao). | Có nút Tạo set món. | `portal/.aidlc/specs/employee-ux.md:8` | — |
| 2 | Mở Gói + công thức và bấm Tạo gói, nhập tên rồi đọc mã và chế độ nhiệt. | Mã tự sinh, chỉ đọc; mặc định mát, có thêm đông lạnh và nhiệt độ thường. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 3 | Mở Chỉ tiêu và bấm Tạo chỉ tiêu, nhập tên sản phẩm. | Đường dẫn tự sinh từ tên; đơn vị chỉ đọc là suất. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| 4 | Nhập tiêu đề, chọn sản phẩm có sẵn rồi lưu chỉ tiêu. | Lưu thành công. | `portal/.aidlc/specs/fooddev-set.md:4` | — |
| 5 | Bấm Tạo set của chỉ tiêu, mở Thực đơn và tạo thực đơn, chọn bộ đã tạo ở ca trước. | Mã chọn từ danh sách; khẩu phần và số suất mỗi bộ chỉ đọc, tự hiện hai người và hai suất. | `portal/.aidlc/specs/fooddev-fields.md:4` | — |
| Chưa kiểm | Lưu thực đơn và đọc lại nhu cầu. | Khẩu phần chỉ được nhân một lần. | `portal/.aidlc/specs/fooddev-set.md:11` | Ca dừng ở biểu mẫu chưa lưu thực đơn; `e2e/fooddev-v2/fooddev-v2.spec.ts:158`. |


## rbac

Quản trị viên đăng nhập và giữ tập quyền, trạng thái nhân viên bán hàng trước bộ ca. Các ca đăng nhập khách hoặc nhân viên có sẵn, riêng ca cuối tạo nhân viên mới. Sau ca, quyền và trạng thái được khôi phục bằng lệnh trực tiếp; nhân viên mới bị khóa để kết thúc kiểm thử.

### 1. ADMIN tắt rồi bật sales:product:read bằng ma trận

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng và đọc danh sách sản phẩm. | Đăng nhập và đọc thành công. | `portal/.aidlc/specs/employee-ux.md:8`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Quản trị viên mở Ma trận quyền, chọn vai trò bán hàng, bỏ quyền đọc sản phẩm rồi lưu. | Có thông báo cập nhật; yêu cầu đọc kế tiếp của nhân viên bán hàng bị từ chối. | `org/.aidlc/specs/org-admin.md:21`; `org/.aidlc/specs/authorization-check.md:16` | — |
| 3 | Quản trị viên bật lại quyền đọc sản phẩm rồi lưu. | Nhân viên bán hàng đọc lại được; cuối ca khôi phục đúng tập quyền ban đầu. | `org/.aidlc/specs/org-admin.md:21` | — |
| Chưa kiểm | Thử bỏ quyền bắt buộc của quản trị viên. | Từ chối thay đổi làm mất quyền bắt buộc. | `org/.aidlc/specs/role-matrix.md:15` | Ca chỉ sửa quyền của nhân viên bán hàng; `e2e/rbac/rbac.spec.ts:181`. |

### 2. SALES đang đăng nhập bị chặn rồi truy cập lại với cùng phiên

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng và đọc danh sách sản phẩm. | Đăng nhập và đọc thành công. | `portal/.aidlc/specs/employee-ux.md:8`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Quản trị viên mở Ma trận quyền, chọn vai trò bán hàng, bỏ quyền đọc sản phẩm rồi lưu. | Có thông báo cập nhật; yêu cầu đọc kế tiếp của nhân viên bán hàng bị từ chối. | `org/.aidlc/specs/org-admin.md:21`; `org/.aidlc/specs/authorization-check.md:16` | — |
| 3 | Quản trị viên bật lại quyền đọc sản phẩm rồi lưu. | Nhân viên bán hàng đọc lại được; cuối ca khôi phục đúng tập quyền ban đầu. | `org/.aidlc/specs/org-admin.md:21` | — |
| 4 | Đối chiếu phiên trước và sau đổi quyền. | Giữ nguyên phiên truy cập, không đăng nhập lại. | `org/.aidlc/specs/authorization-check.md:16` | — |

### 3. CUSTOMER không mở được khu quản trị và ma trận

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập khách rồi mở khu quản trị. | Chuyển khỏi khu quản trị hoặc hiện lời từ chối; không có tiêu đề Ma trận quyền. | `org/.aidlc/specs/role-matrix.md:11` | — |
| 2 | Dùng phiên khách gửi trực tiếp yêu cầu đọc ma trận. | Bị từ chối. | `org/.aidlc/specs/authorization-check.md:14` | — |

### 4. ADMIN khoá rồi mở membership SALES bằng UI

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Đăng nhập nhân viên bán hàng và đọc danh sách sản phẩm. | Đăng nhập và đọc thành công. | `portal/.aidlc/specs/employee-ux.md:8`; `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Quản trị viên mở Thành viên, chọn công ty hoặc chi nhánh nếu được yêu cầu, tìm nhân viên bán hàng qua các trang rồi bấm khóa. | Trạng thái thành tạm ngừng; yêu cầu đọc sản phẩm kế tiếp của nhân viên bị từ chối. | `org/.aidlc/specs/org-admin.md:14`; `org/.aidlc/specs/org-admin.md:18` | — |
| 3 | Bấm mở lại nhân viên đó. | Trạng thái hoạt động; đọc sản phẩm thành công, cuối ca trả trạng thái ban đầu. | `org/.aidlc/specs/org-admin.md:14` | — |
| Chưa kiểm | Khóa hoặc gỡ vai trò quản trị viên cuối cùng. | Từ chối, dữ liệu và lịch sử giữ nguyên. | `org/.aidlc/specs/org-admin.md:19` | Ca chỉ khóa nhân viên bán hàng; `e2e/rbac/rbac.spec.ts:218`. |

### 5. ADMIN tạo SALES với mật khẩu và nhân viên đăng nhập ngay

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Quản trị viên mở Thành viên, chọn công ty hoặc chi nhánh nếu cần, bấm thêm nhân viên. | Mở biểu mẫu tạo nhân viên. | `org/.aidlc/specs/org-admin.md:12` | — |
| 2 | Nhập tên, thư điện tử và mật khẩu ban đầu; giữ vai trò bán hàng đang chọn rồi lưu. | Tạo thành công; dữ liệu có đúng vai trò bán hàng; biểu mẫu đóng. | `org/.aidlc/specs/org-admin.md:12`; `org/.aidlc/specs/org-admin.md:13` | — |
| 3 | Nhân viên mới đăng nhập ngay bằng mật khẩu vừa cấp. | Có liên kết Bảng giá; không có liên kết Thành viên và Ma trận quyền. | `org/.aidlc/specs/org-admin.md:13` | — |
| 4 | Gửi trực tiếp yêu cầu đọc thành viên và ma trận bằng phiên nhân viên mới. | Cả hai bị từ chối; quản trị viên đọc lại thành viên khớp, tập quyền bán hàng không đổi. | `org/.aidlc/specs/authorization-check.md:15` | — |
| 5 | Khóa nhân viên mới bằng lệnh trực tiếp ở phần kết thúc ca. | Lệnh khóa thành công; đọc lại trạng thái tạm ngừng. | `org/.aidlc/specs/org-admin.md:14` | — |
| Chưa kiểm | Thử cấp nhân viên với thư điện tử đã tồn tại hoặc không đủ quyền. | Không tạo trùng thành viên và không cho người thiếu quyền tạo nhân viên. | `org/.aidlc/specs/org-admin.md:12`; `org/.aidlc/specs/org-admin.md:13` | Ca chỉ tạo tài khoản mới hợp lệ bằng quản trị viên; `e2e/rbac/rbac.spec.ts:236`. |


## supplier-contract

Dùng phiên kho, quản trị viên, khách và nhà cung cấp cùng nguyên liệu đã chuẩn bị. Ca quyền dùng phiên có sẵn; không có bước gõ mật khẩu. Ca bảng giá và phiếu nhập còn giữ kỳ vọng nghiệp vụ cũ, ghi rõ ở cột Lệch.

### TC-09: thu hồi quyền WAREHOUSE chặn API, menu và deep link trong cùng phiên

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở cổng nhân viên ở phiên quản trị viên và mở Nhà cung cấp ở phiên kho. | Cổng nhân viên hiển thị; hai phiên sẵn sàng. | `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Quản trị viên đọc quyền kho và cấp quyền đọc nhà cung cấp bằng lệnh trực tiếp. | Kho mở được danh sách và đọc được hồ sơ. | `org/.aidlc/specs/org-admin.md:21`; `org/.aidlc/specs/authorization-check.md:16` | — |
| 3 | Thu hồi quyền đọc; từ phiên kho gửi yêu cầu đọc kèm lời tự nhận có quyền quản trị. | Bị từ chối; trả lời không được lưu để dùng lại. | `org/.aidlc/specs/authorization-check.md:15`; `org/.aidlc/specs/authorization-check.md:16` | — |
| 4 | Tải lại danh sách rồi mở thẳng phần Bảng giá trong hồ sơ nhà cung cấp. | Báo không có quyền; mất liên kết Nhà cung cấp và không có nút lập bảng giá. | `org/.aidlc/specs/authorization-check.md:15` | — |
| 5 | Quản trị viên đọc lại hồ sơ rồi khôi phục đúng tập quyền kho ban đầu. | Hồ sơ không đổi; tập quyền đọc lại khớp. | `org/.aidlc/specs/org-admin.md:21` | — |

### TC-09: khách và anonymous không được đọc/ghi hợp đồng qua BFF

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Không đăng nhập, gửi trực tiếp yêu cầu đọc và tạo bảng giá. | Cả hai yêu cầu bị từ chối vì chưa đăng nhập. | `org/.aidlc/specs/authorization-check.md:15` | — |
| 2 | Dùng phiên khách mở danh mục rồi gửi trực tiếp yêu cầu đọc và tạo bảng giá. | Cả hai yêu cầu bị từ chối vì thiếu quyền. | `org/.aidlc/specs/authorization-check.md:14` | — |
| 3 | Khách mở thẳng phần Bảng giá trong hồ sơ nhà cung cấp. | Không có nút Lập bảng giá mới. | `org/.aidlc/specs/authorization-check.md:14` | — |
| Chưa kiểm | Thử ghi nội dung hợp lệ và đối chiếu dữ liệu sau từ chối. | Không có bảng giá mới hoặc thay đổi trái quyền. | `org/.aidlc/specs/authorization-check.md:14` | Lệnh tạo dùng nội dung rỗng và chưa đọc lại dữ liệu; `e2e/supplier-contract/permissions.spec.ts:78`. |

### TC-05/10/16: picker tên, giá chỉ đọc và ngày ngoài hợp đồng chặn tạo phiếu

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở Tạo phiếu nhập bằng phiên kho. | Có tiêu đề; chưa cho tạo khi thiếu dữ liệu. | `portal/.aidlc/specs/supplier-contract.md:23` | — |
| 2 | Tìm và chọn nhà cung cấp, nguyên liệu bằng tên nếu chưa có đúng lựa chọn. | Hai ô giữ đúng tên đã chuẩn bị. | `portal/.aidlc/specs/supplier-contract.md:21` | — |
| 3 | Nhập ngày đầu hiệu lực và lượng hai. | Giá hợp đồng hiển thị đúng; được tạo; không có ô nhập mã kỹ thuật hoặc giá tay. | `portal/.aidlc/specs/supplier-contract.md:23` | Ca buộc giá chỉ đọc trong khi đặc tả giá nhập thực tế cho sửa với cảnh báo; `e2e/supplier-contract/receipt-gate.spec.ts:32`. |
| 4 | Đổi ngày sang sau ngày hết hạn một ngày. | Bị khóa tạo, báo chưa có hợp đồng đã áp dụng; chưa gửi lệnh tạo. | `inventory/.aidlc/specs/receipt-cost-lineage.md:15` | Ca chặn mọi tạo phiếu ngoài kỳ dù đặc tả cho phép không gửi cặp tham chiếu giá; `e2e/supplier-contract/receipt-gate.spec.ts:36`. |
| 5 | Đổi ngày về ngày cuối hiệu lực rồi bấm tạo một lần. | Tạo thành công đúng một lần, có thông báo; nội dung không lộ mã dài và trang không tràn ngang. | `inventory/.aidlc/specs/inbound-receiving.md:22` | — |
| Chưa kiểm | Nhận hàng, đổi hoặc ngừng bảng giá rồi đọc lại tiền phiếu. | Giữ giá đã chốt; tiền theo lượng thực nhận. | `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | Ca kết thúc sau khi tạo phiếu; `e2e/supplier-contract/receipt-gate.spec.ts:46`. |
| Chưa kiểm | Kiểm tra chất lượng và thử nhận lại sau lỗi. | Chỉ lô đạt đóng góp giá vốn; không cộng kho hoặc ghi giá vốn hai lần. | `inventory/.aidlc/specs/receipt-cost-lineage.md:17` | Ca không nhận hàng hoặc kiểm tra chất lượng; `e2e/supplier-contract/receipt-gate.spec.ts:47`. |

### TC-01/03/04/10/11: NCC, nháp, tệp, áp dụng và ngừng dùng bằng UI

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở Nhà cung cấp, bấm thêm, nhập mã và tên rồi lưu. | Tạo nhà cung cấp thành công. | `inventory/.aidlc/specs/supplier-management.md:12` | — |
| 2 | Tìm theo mã, mở hồ sơ rồi vào Bảng giá và bấm Lập bảng giá mới. | Tiêu đề hồ sơ đúng tên; mở biểu mẫu bảng giá. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 3 | Nhập mã bảng giá, kỳ hiệu lực, chọn nguyên liệu theo tên và nhập giá 25.000 đồng; mở phần hiệu lực riêng và nhập ngày dòng giá. | Biểu mẫu có một dòng giá trong kỳ. | `inventory/.aidlc/specs/supplier-price-agreement.md:18` | — |
| 4 | Chọn một tệp hợp đồng rồi bấm Bỏ tệp đã chọn. | Tên tệp từng hiển thị; chưa xin quyền tải hoặc tải dữ liệu tệp lên. | `inventory/.aidlc/specs/supplier-contract-document.md:12` | — |
| 5 | Bấm Lưu nháp. | Tạo nháp thành công; thẻ bảng giá hiện Nháp. | `inventory/.aidlc/specs/supplier-price-agreement.md:18` | — |
| 6 | Mở bản nháp và bấm Áp dụng bảng giá khi chưa có chứng từ. | Ca đòi báo Chọn chứng từ chính trước khi áp dụng; chưa xin tải tệp. | `inventory/.aidlc/specs/supplier-price-agreement.md:19` | Ca bắt chứng từ trong khi đặc tả hiện cho áp dụng khi không có chứng từ; `e2e/supplier-contract/supplier-contract.spec.ts:72`. |
| 7 | Chọn lại tệp hợp đồng rồi lưu nháp. | Chưa cho áp dụng khi chưa lưu; lưu thành công một bản mới. | `inventory/.aidlc/specs/supplier-contract-document.md:13` | — |
| 8 | Mở lại nháp rồi bấm Áp dụng bảng giá. | Áp dụng thành công; đúng một lần xin tải và một lần tải tệp; thấy giá 25.000 đồng và nút Tải chứng từ, không còn nút mở nháp. | `inventory/.aidlc/specs/supplier-price-agreement.md:19` | — |
| 9 | Đọc phần nội dung chính. | Không lộ mã dài và trang không tràn ngang. | `portal/.aidlc/specs/supplier-contract.md:25` | — |
| 10 | Bấm Ngừng dùng, nhập lý do rồi xác nhận. | Chưa nhập lý do thì không cho xác nhận; ngừng thành công, vẫn giữ giá 25.000 đồng và không cho mở nháp. | `inventory/.aidlc/specs/supplier-price-agreement.md:20` | — |
| Chưa kiểm | Đổi giá hoặc ngừng bảng giá đã dùng trên phiếu rồi nhận hàng. | Giá đã chốt trên phiếu giữ nguyên. | `inventory/.aidlc/specs/receipt-cost-lineage.md:16` | Ca chỉ đọc giá trên thẻ hợp đồng, chưa có phiếu liên quan; `e2e/supplier-contract/supplier-contract.spec.ts:100`. |
| Chưa kiểm | Thử trùng kỳ, lặp nguyên liệu cùng đơn vị hoặc gửi lại lệnh áp dụng. | Từ chối dữ liệu trùng; gửi lại không tạo thêm bản. | `inventory/.aidlc/specs/supplier-price-agreement.md:18`; `inventory/.aidlc/specs/supplier-price-agreement.md:21` | Chỉ lập một bảng giá hợp lệ và áp dụng một lần; `e2e/supplier-contract/supplier-contract.spec.ts:82`. |
| Chưa kiểm | Thử tải và mở chứng từ bằng người thiếu quyền. | Không lộ chứng từ hợp đồng trái quyền. | `inventory/.aidlc/specs/supplier-contract-document.md:13`; `org/.aidlc/specs/authorization-check.md:15` | Ca chỉ kiểm nút Tải chứng từ có mặt, chưa bấm tải; `e2e/supplier-contract/supplier-contract.spec.ts:89`. |


## visual

Bộ này chỉ so ảnh, chưa kiểm hành trình nghiệp vụ. Tên ca màn hình lấy nguyên văn từ danh sách trong preview.spec.ts. Ca màn hình bị bỏ qua khi sai loại thiết bị, khi đang tạo ảnh chuẩn, khi chưa có đường dẫn hoặc thiếu ảnh chuẩn; Main luôn bị bỏ qua vì không có đường dẫn. Không tạo hay cập nhật ảnh chuẩn trong S2b.

### tokens

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Mở màn đăng nhập nhân viên, hoặc bản xem trước khi bật chế độ tạo ảnh chuẩn. | Trang nguồn được mở. | Chưa có đặc tả so ảnh trong hành trình. | Mở trang để lấy màu, không thực hiện đăng nhập; `e2e/visual/preview.spec.ts:31`. |
| 2 | Hiện bảng màu sáng và tối do ca chèn vào, chờ chữ sẵn sàng rồi so ảnh. | Ảnh bảng màu khớp tuyệt đối, không cho lệch điểm ảnh. | Chưa có đặc tả so ảnh trong hành trình. | Ca chèn bảng màu vào trang, không kiểm màn nghiệp vụ; `e2e/visual/preview.spec.ts:32`. |

### Main

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Xét điều kiện chạy màn bảng màu. | Bỏ qua vì không có đường dẫn; bảng màu được so ở ca tokens. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:74`. |

### Landing

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở / trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### LandingMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở / trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreHome

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở / trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreHomeMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở / trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreCatalog

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /products trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreCatalogMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /products trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreProduct

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /products/demo trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreProductMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /products/demo trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreCheckout

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /cart trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreCheckoutMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /cart trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreAuth

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /cart trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StoreAuthMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /cart trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### ConsoleDashboard

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /console trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### ConsoleTable

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /sales/orders trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### ConsoleRecord

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /sales/orders/demo trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### ConsoleForm

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /sales/products/new trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### ConsoleLogin

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /staff/login trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### States

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /states-preview trên máy tính, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |

### StatesMobile

| Bước | Làm gì (lời thường) | Mong thấy gì | Use case (`spec path:line`) | Lệch |
|---|---|---|---|---|
| 1 | Nếu có ảnh chuẩn và đúng thiết bị, mở /states-preview trên điện thoại, chờ chữ sẵn sàng rồi so ảnh toàn trang. | Ảnh khớp ảnh chuẩn trong mức sai khác cấu hình; thiếu ảnh chuẩn thì bỏ qua. | Chưa có đặc tả so ảnh trong hành trình. | Chỉ xét điều kiện hoặc so ảnh, chưa kiểm tiền, kho hay phân quyền; `e2e/visual/preview.spec.ts:76`. |
