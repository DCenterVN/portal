# Lỗi nhìn portal, lượt 3

Nền `473d8e313e3d56cc630713624469a2750f81f7b6`. Chưa có ảnh thật. **Claude chạy** script `.aidlc/runs/PORTAL-MOTION-001/capture-audit.mjs` theo `capture-guide.md`.

`pnpm dev` exit 1 do thiếu node_modules/Next; chưa mở cổng hay gọi Kong. Không có `audit/*.png` trong lượt này. Không dùng preview cũ và không tạo ảnh minh hoạ làm bằng chứng. Cột ảnh dưới đây là tên crop script sẽ tạo, chưa phải đường dẫn ảnh đã tồn tại.

V-01 là yêu cầu bắt buộc của brief, đã đối chiếu mã. V-02 đến V-08 là bảy nghi vấn từ mã, chưa kiểm bằng mắt. Thứ tự là mức ưu tiên dự kiến, chưa phải xếp hạng từ ảnh thật. Chỉ sửa nghi vấn sau khi Claude xác nhận bằng ảnh.

| ID | Mức dự kiến | Ảnh cắt | Màn | File:line tại nền | Lỗi bằng lời thường | Đề xuất CSS/class, giữ cấu trúc | Trạng thái |
|---|---|---|---|---|---|---|---|
| V-01 | Cao, bắt buộc dòng đầu | Chưa có; `audit/before-V-01-{normal,hover,focus}-375-light.png` và ba tổ hợp còn lại | Login, register, reset; nơi dùng PasswordInput ở staff | `components/patterns/password-input.tsx:13–16`; `components/ui/button.tsx:21` | Nút ẩn/hiện mật khẩu dùng Button ghost, size icon, bị class size-10 ép 40×40. Hover đổ cả khối nền secondary đè lên input. | Scope riêng toggle: nền transparent ở mọi trạng thái, shadow-none, icon muted rồi đậm khi hover; giữ vùng bấm size-10. Bỏ ring trên khối 40px; dùng pseudo-element absolute quanh icon 16px với outline 1px khi focus-visible. Pseudo không đổi DOM/geometry. Giữ disabled, aria-pressed/label và type=button. | Bắt buộc sửa theo brief; chưa có ảnh trước/sau. |
| V-02 | Cao nếu tràn mobile | Chưa có; `audit/before-V-02-375-light.png` và ba tổ hợp còn lại | Catalog `/products` | `features/products/products-view.tsx:189–218` | Ba nút lọc để cùng một hàng, không wrap; nhãn có số lượng có thể vượt chiều rộng 375px. | Chỉ khi ảnh xác nhận: thêm max-w-full và flex-wrap cho chính cụm hiện có; giữ thứ tự, gap và kích thước nút. Không đổi thành dropdown/thanh lọc mới. | Nghi vấn; thử số lượng thực có nhiều chữ số. |
| V-03 | Cao nếu nút lấn cột | Chưa có; `audit/before-V-03-1440-light.png` và ba tổ hợp còn lại | Form tạo chỉ tiêu | `features/production/targets-view.tsx:134,152`; `components/ui/button.tsx:29` | Cột xoá chỉ 40px nhưng nút icon mặc định 44px. Nút có thể lấn cột hoặc lệch hàng ô nhập. | Nếu ảnh xác nhận: scope class w-10/h-11 cho nút xoá trong hàng này, vùng bấm vẫn ≥40px; giữ grid hiện có, không đổi thứ tự/label. | Nghi vấn; không sửa global size icon. |
| V-04 | Vừa | Chưa có; `audit/before-V-04-375-light.png` và ba tổ hợp còn lại | Ô tìm catalog | `features/products/products-view.tsx:180`; `components/ui/input.tsx:10` | Icon cao 16px đặt top-2.5, tâm 18px trong input cao 44px, dễ nhìn lệch lên khoảng 4px. | Đổi riêng icon sang top-1/2 -translate-y-1/2, giữ left-3, size-4 và padding input. | Nghi vấn có căn cứ số đo mã; cần ảnh. |
| V-05 | Vừa | Chưa có; `audit/before-V-05-1440-light.png` và ba tổ hợp còn lại | Chi tiết món ACTIVE | `features/products/product-detail-view.tsx:116–135` | Stepper có khung ngoài, hai nút outline lại có viền trong, dễ thành ba ô viền lồng nhau. | Nếu ảnh xác nhận: class border-transparent/shadow-none cho hai nút bên trong, giữ khung ngoài, màu, cỡ và focus. Không đổi variant chung. | Nghi vấn; không đổi dữ liệu/giới hạn quantity. |
| V-06 | Vừa | Chưa có; `audit/before-V-06-375-light.png` và ba tổ hợp còn lại | Popup login/register và dialog hiện có | `components/ui/dialog.tsx:266` | Nút đóng có khối hover tint 44px. Có thể lấn chữ hoặc nhìn nặng cùng kiểu nút mắt. | Nếu ảnh xác nhận: nền transparent, chỉ đổi màu icon; focus-visible vòng mảnh quanh icon qua pseudo, giữ hit area44px, vị trí và hành vi Esc/trả focus. | Nghi vấn; ảnh crop hover cần Claude chụp bổ sung nếu crop thường chưa đủ. |
| V-07 | Thấp | Chưa có; `audit/before-V-07-1440-light.png` và ba tổ hợp còn lại | Tiêu đề catalog/console dùng PageHeader | `components/ui/page.tsx:45` | Icon tiêu đề đặt trên nền sky-500/10, dễ lạc màu với token nền của portal. | Nếu ảnh xác nhận nền tint thừa: bỏ đúng class bg-sky-500/10, dùng bg-transparent. Giữ hộp size-9, màu icon, gap và vị trí để chữ không nhảy. | Nghi vấn; không đổi màu thương hiệu. |
| V-08 | Thấp | Chưa có; `audit/before-V-08-1440-light.png` và ba tổ hợp còn lại | Ô nhập form chỉ tiêu và ô tìm dùng Input | `components/ui/input.tsx:10,14` | Input có border1.5px cộng shadow card; trong card/form nhiều lớp có thể nhìn viền/bóng dày. Login đã tự shadow-none nên không suy từ ảnh login sang mọi input. | Chỉ khi ảnh nhiều nơi xác nhận: shadow-none trên Input, giữ border/focus/radius. Nếu chỉ một nơi xấu, scope class tại nơi đó và sửa Files planned/slice trước khi code. | Nghi vấn; ảnh hưởng nhiều consumer, phải so nơi dùng chung. |

Chưa thấy nút ⋮ trong các phần mã vừa đối chiếu. Không đặt ID lỗi cho phần tử chưa quan sát. Badge/chip, chữ và khoảng cách vẫn cần rà trên toàn bộ 40 ảnh. Nếu phát hiện lỗi ngoài bảng, bổ sung V-09 trở đi với crop, file:line, class và cập nhật plan trước triển khai.

## Ma trận chụp

| Màn | Route/trạng thái | 1440 sáng | 1440 tối | 375 sáng | 375 tối |
|---|---|---|---|---|---|
| Trang chủ | `/` vãng lai | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Chi tiết món | Chọn món ACTIVE theo tên trên `/products` | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Giỏ | `/cart`, ghi rõ rỗng/có món thật | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Đăng nhập | `/login` redirect popup | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Đăng ký | `/register` redirect popup | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Kích hoạt | `/activate`, không token | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Quên mật khẩu | `/forgot-password` | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Console | `/console`, phiên QA thật | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Danh sách | `/production/targets` | Claude chạy | Claude chạy | Claude chạy | Claude chạy |
| Form tạo | Bấm “Tạo chỉ tiêu”, không gửi | Claude chạy | Claude chạy | Claude chạy | Claude chạy |

Sau khi Claude chạy: mở ảnh, xếp lại mức xấu, đổi cột ảnh thành link ảnh thật, xác nhận/bác từng nghi vấn. Mỗi dòng nhận sửa phải có ảnh after cùng state; không kết luận sửa xong từ unit test.
