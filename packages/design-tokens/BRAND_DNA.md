# Việt Sạch — Brand DNA & Design System Specification

> **Phiên bản:** 1.0.0 — Bản chuẩn hóa thẩm mỹ & kiến trúc giao diện  
> **Áp dụng cho:** Tất cả ứng dụng (`apps/web`, `apps/admin`, mobile) và các AI Agents (Antigravity, Codex, Kiro, Cursor).  
> **Nguyên tắc cốt lõi:** Bắt buộc tuân thủ 100% — Chống phân mảnh giao diện ("mỗi đứa một kiểu").

---

## 1. Bản sắc Thương hiệu (Brand Essence)

- **Tên thương hiệu:** **Việt Sạch** (Hệ sinh thái Nông sản Chuỗi lạnh & Logistics DCenterVN).
- **Định vị:** Chuỗi cung ứng thực phẩm sạch hữu cơ, bảo quản kho lạnh sâu (-18,5 °C), kiểm định VietGAP nghiêm ngặt và minh bạch từ nông trại tới bàn ăn.
- **Phong cách thị giác (Visual Direction):** **Premium Editorial & Organic Freshness**
  - Vẻ đẹp sang trọng, tinh tế như một tạp chí ẩm thực cao cấp (sử dụng font có chân *Noto Serif* cho tiêu đề).
  - Kết hợp với sự chính xác, mạch lạc của công nghệ chuỗi lạnh IoT (sử dụng font không chân *Be Vietnam Pro* cho dữ liệu và điều khiển).
  - Không đi theo phong cách AI đại trà (nút vuông thô, màu bùn đất, bóng gắt); thay vào đó là bề mặt kính mờ (**Frosted glass blur**), đổ bóng màu nền tự nhiên (ambient tinted shadows), và viền mỏng thanh thoát.

---

## 2. Quy tắc Ngôn từ & Định dạng (Terminology & Voice)

| Danh mục | BẮT BUỘC (DO) | TUYỆT ĐỐI CẤM (DON'T) |
|---|---|---|
| **Thuật ngữ thực thể** | `Chi nhánh`, `Kho lạnh`, `Hub tổng kho`, `Trung tâm điều phối` | 🚫 CẤM dùng từ `Resort` (quy tắc bất biến của nền tảng). |
| **Viết hoa chữ cái** | **100% Sentence case**: *Kiểm định chất lượng*, *Chuỗi lạnh ổn định* | 🚫 CẤM viết HOA TOÀN BỘ (ALL CAPS): `STITCH DESIGN SYSTEM`, `IOT ACTIVE`. |
| **Tiền tệ Việt Nam** | `Intl.NumberFormat("vi-VN")`: `35.000 ₫`, `1.250.000 ₫` | 🚫 CẤM viết: `35000 vnd`, `35k`, `1,250,000VND`. |
| **Nhiệt độ chuỗi lạnh** | Sử dụng dấu phẩy thập phân: `-18,5 °C`, `5,0 °C` | 🚫 CẤM viết: `-18.5C`, `5 deg`. |
| **Khối lượng / Trọng lượng** | `1.250 kg`, `250,0 g`, `búp (300g)` | 🚫 CẤM viết: `1250kgs`, `kg.`. |
| **Thời gian & Ngày tháng** | `28/08/2026 · 14:30` | 🚫 CẤM dùng format lẫn lộn MM/DD/YYYY. |

---

## 3. Hệ màu Thương hiệu Chuẩn (Dual-Theme Color System)

### 3.1. Giao diện Sáng — "Organic Morning Mist" (Light Mode)
Mang cảm giác trong lành, tinh khiết của sương mai trên nông trại hữu cơ:

```css
:root, [data-theme="light"] {
  --color-bg: #f8faf9;            /* Nền tổng thể: Sương hữu cơ sáng nhẹ */
  --color-panel: #ffffff;         /* Bề mặt thẻ: Trắng tinh khiết */
  --color-panel-strong: #f0f4f1;  /* Bề mặt phụ/Khung tìm kiếm */
  --color-ink: #141c18;           /* Chữ chính: Than chì xanh đậm, độ tương phản cao */
  --color-muted: #59655e;         /* Chữ phụ/Ghi chú: Xám xanh nhã nhặn */
  --color-line: #e3eae4;          /* Đường viền: Tinh tế, không gắt */
  --color-teal: #1e5e23;          /* Xanh Forest thương hiệu: Nút chính, hành động */
  --color-teal-2: #144418;        /* Xanh Forest đậm khi hover */
  --color-cold: #0284c7;          /* Xanh băng chuỗi lạnh logistics (-18,5°C) */
  --color-gold: #d97706;          /* Hổ phách ấm (gốm nung Bát Tràng) */
  --color-success: #16a34a;       /* Xanh ngọc VietGAP đạt chuẩn */
  --color-danger: #dc2626;        /* Đỏ cảnh báo rủi ro nhiệt độ */
}
```

### 3.2. Giao diện Tối — "Premium Vietnamese Harvest" (Stitch Dark Mode)
Chuẩn theo thiết kế Stitch: Không dùng màu đen thuần `#000000`, mà sử dụng màu **Than chì Olive sâu** (`#121410`):

```css
[data-theme="dark"], .dark {
  --color-bg: #121410;            /* Nền than chì olive sâu hữu cơ */
  --color-panel: #181b16;         /* Thẻ cấp 1: Olive than chì sẫm */
  --color-panel-strong: #222620;  /* Thẻ cấp 2/Hộp thoại nổi */
  --color-ink: #f1f3ee;           /* Chữ chính: Trắng ngà tự nhiên */
  --color-muted: #9ba496;         /* Chữ phụ: Xám lá nhạt */
  --color-line: #2d3329;          /* Đường viền olive trầm */
  --color-teal: #4ade80;          /* Xanh ngọc lục bảo phát sáng */
  --color-teal-2: #22c55e;        /* Xanh ngọc khi hover */
  --color-cold: #38bdf8;          /* Xanh băng tuyết phát sáng */
  --color-gold: #f59e0b;          /* Hổ phách rực rỡ */
  --color-success: #34d399;       /* Xanh ngọc VietGAP */
  --color-danger: #f87171;        /* Đỏ san hô cảnh báo */
}
```

---

## 4. Ngôn ngữ Thị giác Kính Mờ & Chiều Sâu (Frosted Glass & Depth)

Mọi thành phần nổi (Modals, Toasts, Badges trên ảnh, Dropdowns, Thanh điều hướng) **BẮT BUỘC** áp dụng hiệu ứng kính mờ:

1. **Thẻ nổi trên ảnh (Badges on Images):**
   - Đặt ở các góc (`top-2.5 left-2.5` và `top-2.5 right-2.5`), **tuyệt đối không đè lên giữa ảnh**.
   - Áp dụng lớp phủ gradient nhẹ trên ảnh (`from-black/40 via-transparent to-black/10`).
   - Style chuẩn: `backdrop-blur-md bg-black/55 border border-white/25 text-white text-[11px] font-semibold rounded-full`.
2. **Hộp thoại & Khung nổi (Dialogs & Drawers):**
   - Lớp nền mờ hậu cảnh: `bg-black/60 backdrop-blur-sm`.
   - Khung hộp thoại: `backdrop-blur-xl bg-[var(--color-panel-strong)] border border-[var(--color-line)] shadow-2xl rounded-2xl`.
3. **Thẻ thông báo (Toasts):**
   - `backdrop-blur-md bg-[var(--color-panel-strong)]/90 border-l-4 shadow-xl rounded-xl`.
4. **Đổ bóng (Ambient Shadows):**
   - Dùng bóng đổ mờ rộng, hòa trộn nhẹ với sắc xanh tự nhiên (`rgba(20, 45, 28, 0.08)`), không dùng bóng đen đục 100%.

---

## 5. Quy chuẩn Font chữ & Thứ bậc (Typography DNA)

| Vai trò | Font Family | Tỷ lệ & Trọng lượng | Ứng dụng |
|---|---|---|---|
| **Tiêu đề lớn / Hero** | `Noto Serif` | `text-2xl` đến `text-4xl`, `font-bold`, `leading-tight` | Tên trang, tiêu đề chiến dịch, câu chuyện thương hiệu. |
| **Tiêu đề thẻ / Sản phẩm** | `Noto Serif` | `text-base` hoặc `text-lg`, `font-bold`, `leading-snug` | Tên sản phẩm, tiêu đề modal, tên lô hàng QC. |
| **Nội dung / Dữ liệu** | `Be Vietnam Pro` | `text-sm`, `font-normal`, `leading-relaxed` | Đoạn văn, mô tả kiểm định, nhật ký vận hành. |
| **Nhãn điều khiển / Nút** | `Be Vietnam Pro` | `text-xs` hoặc `text-sm`, `font-semibold` | Nút bấm, menu điều hướng, nhãn form nhập. |
| **Chỉ số / Giá cả** | `Noto Serif` | `text-lg` đến `text-2xl`, `font-bold` | Giá niêm yết (35.000 ₫), nhiệt độ (-18,5 °C). |

> **Tại sao chọn Be Vietnam Pro & Noto Serif?**
> Cả 2 font đều được tinh chỉnh hoàn hảo cho hệ thống dấu thanh tiếng Việt phức tạp (dấu hỏi, ngã, nặng xếp tầng), không bao giờ bị cắt chữ (clipping) hay nhảy dòng bất thường.

---

## 6. Quy chuẩn Thành phần Lõi (Component Rules)

### 6.1. Thẻ Sản phẩm (`ProductCard`)
- **Tỉ lệ khung ảnh:** Chuẩn 4:3 hoặc 16:10, bo góc `rounded-xl`.
- **Hiệu ứng hover:** Zoom ảnh mượt `duration-700 ease-out group-hover:scale-105`, nâng thẻ `hover:-translate-y-1.5 hover:shadow-xl`.
- **Badges:** Tách biệt 2 góc trên, dạng Frosted Glass Pill với chấm chỉ thị màu ngọc / đèn LED xanh băng.
- **Nút hành động:** Nút bo góc tròn `rounded-xl` màu xanh Forest (`bg-[var(--color-teal)]`), có icon `+` giỏ hàng và hiệu ứng xúc giác `active:scale-95`.

### 6.2. Nút bấm (`Button`)
- Chiều cao chạm tối thiểu trên di động: **44px** (`min-h-[44px]`).
- 6 biến thể chuẩn: `primary`, `secondary`, `cold`, `danger`, `outline`, `ghost`.
- Hiệu ứng click: `active:scale-[0.98]` mang lại phản hồi chân thực.

### 6.3. Huy hiệu (`Badge`)
- Kiểu dáng: Dạng con nhộng (`rounded-full`), cỡ chữ `text-xs font-semibold`.
- Tùy chọn `pulse={true}`: Đèn LED nhịp thở cho các trạng thái trực tiếp (IoT Sensor, Nhiệt độ thực, Đang vận chuyển).
- Biến thể `glass`: Dùng trên nền hình ảnh hoặc video.

---

## 7. Bảng Kiểm Tra Cho Lập Trình Viên & AI (Checklist)

Trước khi commit code hoặc hoàn thành một màn hình mới, hãy tự kiểm tra:
- [ ] Màn hình có hiển thị đẹp trên cả **Giao diện Sáng** và **Giao diện Tối (Stitch)** không?
- [ ] Các thẻ nổi trên ảnh có dùng `backdrop-blur` và không che khuất món ăn không?
- [ ] Có từ nào vi phạm từ cấm `resort` không?
- [ ] Tất cả các tiêu đề, badge có tuân thủ **Sentence case** (không viết ALL CAPS) không?
- [ ] Giá tiền có hiển thị đúng chuẩn `Intl` `35.000 ₫` không?
- [ ] File code viết tay có đảm bảo $\le 300$ dòng vật lý không?
