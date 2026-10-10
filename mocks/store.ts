// mock — replace when real API exists
// Store navigation and footer content will come from the public-site CMS API.
export const STORE_NAV = [
  { href: "/", label: "Trang chủ", match: "/" },
  { href: "/products", label: "Sản phẩm", match: "/products" },
  { href: "/traceability", label: "Truy xuất nguồn gốc", match: "/traceability" },
];

export const STORE_FOOTER = {
  columns: [
    {
      title: "Việt Sạch",
      links: [
        { href: "/about", label: "Về chúng tôi" },
        { href: "/contact", label: "Liên hệ" },
      ],
    },
    {
      title: "Mua sắm",
      links: [
        { href: "/products", label: "Sản phẩm" },
        { href: "/orders", label: "Đơn hàng" },
      ],
    },
    {
      title: "Hỗ trợ",
      links: [
        { href: "/shipping", label: "Giao hàng" },
        { href: "/returns", label: "Đổi trả" },
      ],
    },
    {
      title: "Kết nối",
      links: [
        { href: "/traceability", label: "Truy xuất nguồn gốc" },
        { href: "/contact", label: "Chăm sóc khách hàng" },
      ],
    },
  ],
  legal: ["© Việt Sạch", "Chính sách bảo mật", "Điều khoản sử dụng"],
};

// Cart preview, account and favourites for the frame, tests and visual baselines; replace with the cart/wishlist APIs.
// Add order: oldest first. Five lines so the mini-cart shows the newest three and "+2 món khác".
export const STORE_CART_ITEMS = [
  { id: "dau-hu-sot-ca-chua", name: "Đậu hũ sốt cà chua", quantity: 2, priceVnd: 89000 },
  { id: "ga-xe-phay-rau-ram", name: "Gà xé phay rau răm", quantity: 1, priceVnd: 69000 },
  { id: "ca-hoi-ap-chao", name: "Cá hồi áp chảo sốt chanh dây", quantity: 1, priceVnd: 159000 },
  { id: "suon-rim-man-ngot", name: "Sườn rim mặn ngọt", quantity: 3, priceVnd: 199000 },
  { id: "bo-luc-lac-khoai-tay", name: "Bò lúc lắc khoai tây", quantity: 1, priceVnd: 129000 },
];

export const STORE_ACCOUNT = { name: "Khách thân thiết" };

export const STORE_FAVORITES_COUNT = 4;
