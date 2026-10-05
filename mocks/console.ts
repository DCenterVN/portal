// Static navigation for the existing console routes.
import { Boxes, Factory, LayoutDashboard, ShoppingCart, Warehouse } from "lucide-react";

export const CONSOLE_NAV = [
  {
    title: "Tổng quan",
    items: [{ href: "/console", label: "Bảng điều khiển", match: "/console", icon: LayoutDashboard }],
  },
  {
    title: "Tổ chức",
    items: [
      { href: "/branches", label: "Chi nhánh", match: "/branches", icon: Warehouse },
      { href: "/memberships", label: "Thành viên", match: "/memberships", icon: LayoutDashboard },
      { href: "/roles", label: "Vai trò", match: "/roles", icon: LayoutDashboard },
    ],
  },
  {
    title: "Kho",
    items: [{ href: "/inventory/shelves", label: "Kệ hàng", match: "/inventory", icon: Warehouse }],
  },
  {
    title: "Sản xuất",
    items: [
      { href: "/production/targets", label: "Chỉ tiêu", match: "/production/targets", icon: Factory },
      { href: "/production/food-plans", label: "Kế hoạch", match: "/production/food-plans", icon: Boxes },
      { href: "/production/orders", label: "Lệnh sản xuất", match: "/production/orders", icon: Factory },
      { href: "/production/qc", label: "Kiểm định", match: "/production/qc", icon: Boxes },
    ],
  },
  {
    title: "Bán hàng",
    items: [{ href: "/sales/pricing", label: "Bảng giá", match: "/sales/pricing", icon: ShoppingCart }],
  },
];

