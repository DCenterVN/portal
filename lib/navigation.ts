import {
  Boxes, ClipboardCheck, Factory, FileSpreadsheet, LayoutDashboard, ListChecks, Package, PackagePlus, ShieldCheck,
  Store, Tag, Truck, Users, Warehouse, Building2, KeyRound, ScrollText, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; match: string; icon?: LucideIcon };
export type NavGroup = { title: string; icon?: LucideIcon; items: NavItem[] };
type NavRule = NavItem & { action?: string };

export const CONSOLE_NAV: { title: string; icon: LucideIcon; items: NavRule[] }[] = [
  { title: "Tổng quan", icon: LayoutDashboard, items: [{ href: "/console", label: "Tổng quan", match: "/console", icon: LayoutDashboard }] },
  { title: "Kho", icon: Warehouse, items: [
    { href: "/inventory/goods-receipts/new", label: "Nhập hàng", match: "/inventory/goods-receipts/new", icon: PackagePlus, action: "inventory:goods_receipt:create" },
    { href: "/inventory/shelves", label: "Kệ hàng", match: "/inventory/shelves", icon: Warehouse, action: "inventory:shelf_placement:read" },
    { href: "/inventory/stock-transfers", label: "Chuyển hàng", match: "/inventory/stock-transfers", icon: Truck, action: "inventory:transfer:read" },
    { href: "/inventory/suppliers", label: "Nhà cung cấp", match: "/inventory/suppliers", icon: Store, action: "inventory:supplier:read" },
  ] },
  {
    title: "Sản xuất",
    icon: Factory,
    items: [
      { href: "/production/targets", label: "Chỉ tiêu", match: "/production/targets", icon: ListChecks, action: "production:target:read" },
      { href: "/production/food-plans", label: "Món & thực đơn", match: "/production/food-plans", icon: FileSpreadsheet, action: "production:food_plan:read" },
      { href: "/production/material-requirements", label: "Nhu cầu nguyên liệu", match: "/production/material-requirements", icon: Boxes, action: "production:material_requirement:read" },
      { href: "/production/orders", label: "Lệnh sản xuất", match: "/production/orders", icon: Factory, action: "production:order:read" },
      { href: "/production/qc", label: "Kiểm định", match: "/production/qc", icon: ClipboardCheck, action: "production:qc:update" },
    ],
  },
  { title: "Bán hàng", icon: Tag, items: [
    { href: "/sales/products", label: "Sản phẩm", match: "/sales/products", icon: Package, action: "sales:product:read" },
    { href: "/sales/pricing", label: "Bảng giá", match: "/sales/pricing", icon: Tag, action: "sales:price_book:create" },
  ] },
  {
    title: "Quản trị",
    icon: ShieldCheck,
    items: [
      { href: "/branches", label: "Chi nhánh", match: "/branches", icon: Building2, action: "org:membership:read" },
      { href: "/memberships", label: "Nhân viên", match: "/memberships", icon: Users, action: "org:membership:read" },
      { href: "/roles", label: "Vai trò & quyền", match: "/roles", icon: KeyRound, action: "org:company:read" },
      { href: "/audit", label: "Nhật ký", match: "/audit", icon: ScrollText, action: "org:company:read" },
    ],
  },
];

export function isActive(pathname: string, match: string): boolean {
  return pathname === match || pathname.startsWith(`${match}/`);
}

export function consoleNavFor(actions: ReadonlySet<string>): NavGroup[] {
  return CONSOLE_NAV
    .map((group) => ({
      title: group.title,
      icon: group.icon,
      items: group.items
        .filter((item) => !item.action || actions.has(item.action))
        .map(({ action: _action, ...item }) => item),
    }))
    .filter((group) => group.items.length > 0);
}

export function openGroups(nav: NavGroup[], pathname: string, saved: readonly string[]): string[] {
  if (nav.length <= 2) return nav.map((group) => group.title);
  return nav
    .filter((group) => saved.includes(group.title) || group.items.some((item) => isActive(pathname, item.match)))
    .map((group) => group.title);
}

export function consoleRouteAllowed(pathname: string, actions: ReadonlySet<string>): boolean {
  const item = CONSOLE_NAV.flatMap((group) => group.items).find((entry) => isActive(pathname, entry.match));
  return !item?.action || actions.has(item.action);
}

type WorkspaceRule = { href: string; label: string; action: string; icon: LucideIcon };
const WORKSPACE_NAV: Record<"platform" | "company", WorkspaceRule[]> = {
  platform: [
    { href: "/platform/role-matrix", label: "roleMatrix", action: "org:role:update", icon: KeyRound },
    { href: "/platform/audit", label: "audit", action: "org:company:read", icon: ScrollText },
  ],
  company: [{ href: "/company", label: "myCompany", action: "org:company:read", icon: Building2 }],
};

/** Platform / company workspace menu; `label` is an i18n key resolved by the caller. */
export function navFor(plane: "platform" | "company", actions: ReadonlySet<string>, root: string): NavItem[] {
  const suffix = plane === "company" ? `?org_id=${encodeURIComponent(root)}` : "";
  return WORKSPACE_NAV[plane]
    .filter((rule) => actions.has(rule.action))
    .map((rule) => ({ href: `${rule.href}${suffix}`, label: rule.label, match: rule.href, icon: rule.icon }));
}

export type Crumb = { label: string; href?: string };

/** Group title > item label for the deepest item matching `pathname`; empty when no item matches. */
export function breadcrumbFor(nav: NavGroup[], pathname: string): Crumb[] {
  let best: { group: string; item: NavItem } | undefined;
  for (const group of nav) {
    for (const item of group.items) {
      if (isActive(pathname, item.match) && (!best || item.match.length > best.item.match.length)) best = { group: group.title, item };
    }
  }
  if (!best) return [];
  const section = best.group === best.item.label ? [] : [{ label: best.group }];
  return [...section, { label: best.item.label }];
}
