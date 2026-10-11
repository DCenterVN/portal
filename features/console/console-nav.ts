import { Boxes, Factory, LayoutDashboard, ShoppingCart, Warehouse } from "lucide-react";
import type { ShellNavGroup, ShellNavItem } from "@/components/layout/console-shell";

type NavRule = ShellNavItem & { action?: string };

export const CONSOLE_NAV: { title: string; items: NavRule[] }[] = [
  { title: "Tổng quan", items: [{ href: "/console", label: "Bảng điều khiển", match: "/console", icon: LayoutDashboard }] },
  {
    title: "Tổ chức",
    items: [
      { href: "/branches", label: "Chi nhánh", match: "/branches", icon: Warehouse, action: "org:membership:list" },
      { href: "/memberships", label: "Thành viên", match: "/memberships", icon: LayoutDashboard, action: "org:membership:list" },
      { href: "/roles", label: "Vai trò", match: "/roles", icon: LayoutDashboard, action: "org:company:read" },
    ],
  },
  { title: "Kho", items: [{ href: "/inventory/shelves", label: "Kệ hàng", match: "/inventory", icon: Warehouse, action: "inventory:shelf_placement:read" }] },
  {
    title: "Sản xuất",
    items: [
      { href: "/production/targets", label: "Chỉ tiêu", match: "/production/targets", icon: Factory, action: "production:target:read" },
      { href: "/production/food-plans", label: "Kế hoạch", match: "/production/food-plans", icon: Boxes, action: "production:food_plan:read" },
      { href: "/production/orders", label: "Lệnh sản xuất", match: "/production/orders", icon: Factory, action: "production:order:read" },
      { href: "/production/qc", label: "Kiểm định", match: "/production/qc", icon: Boxes, action: "production:qc:decide" },
    ],
  },
  { title: "Bán hàng", items: [{ href: "/sales/pricing", label: "Bảng giá", match: "/sales/pricing", icon: ShoppingCart, action: "sales:price_floor_policy:read" }] },
];

export function consoleNavFor(actions: ReadonlySet<string>): ShellNavGroup[] {
  return CONSOLE_NAV
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => !item.action || actions.has(item.action))
        .map(({ action: _action, ...item }) => item),
    }))
    .filter((group) => group.items.length > 0);
}
