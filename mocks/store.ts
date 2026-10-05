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

// Cart API will replace this placeholder when use-cart is introduced.
export const STORE_CART_COUNT_PLACEHOLDER = 0;
