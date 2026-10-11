import { Boxes, Factory, LayoutDashboard, ShoppingCart, Warehouse, type LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; match: string; icon?: LucideIcon };
type NavRule = NavItem & { action?: string };

export const CONSOLE_NAV: { title: string; items: NavRule[] }[] = [
  { title: "Tổng quan", items: [{ href: "/console", label: "Bảng điều khiển", match: "/console", icon: LayoutDashboard }] },
  {
    title: "Tổ chức",
    items: [
      { href: "/branches", label: "Chi nhánh", match: "/branches", icon: Warehouse, action: "org:membership:read" },
      { href: "/memberships", label: "Thành viên", match: "/memberships", icon: LayoutDashboard, action: "org:membership:read" },
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
      { href: "/production/qc", label: "Kiểm định", match: "/production/qc", icon: Boxes, action: "production:qc:update" },
    ],
  },
  { title: "Bán hàng", items: [{ href: "/sales/pricing", label: "Bảng giá", match: "/sales/pricing", icon: ShoppingCart, action: "sales:price_floor_policy:read" }] },
];

export function consoleNavFor(actions: ReadonlySet<string>): { title: string; items: NavItem[] }[] {
  return CONSOLE_NAV
    .map((group) => ({
      title: group.title,
      items: group.items
        .filter((item) => !item.action || actions.has(item.action))
        .map(({ action: _action, ...item }) => item),
    }))
    .filter((group) => group.items.length > 0);
}

export function consoleRouteAllowed(pathname: string, actions: ReadonlySet<string>): boolean {
  const item = CONSOLE_NAV.flatMap((group) => group.items).find((entry) => pathname === entry.match || pathname.startsWith(`${entry.match}/`));
  return !item?.action || actions.has(item.action);
}
