import {
  Boxes, ClipboardCheck, Factory, FileSpreadsheet, LayoutDashboard, ListChecks, MapPin, Package, PackagePlus, ShieldCheck,
  Store, Tag, Truck, Users, UtensilsCrossed, Warehouse, Building2, KeyRound, ScrollText, type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; match: string; icon?: LucideIcon };
export type NavGroup = { title: string; icon?: LucideIcon; items: NavItem[] };
const KITCHEN = "CENTRAL_KITCHEN";
type NavRule = NavItem & { action?: string; also?: string[]; branch?: string; gate?: string };

export const CONSOLE_NAV: { title: string; icon: LucideIcon; items: NavRule[] }[] = [
  { title: "Tổng quan", icon: LayoutDashboard, items: [{ href: "/console", label: "Tổng quan", match: "/console", icon: LayoutDashboard }] },
  { title: "Kho", icon: Warehouse, items: [
    { href: "/inventory/goods-receipts/new", label: "Nhập hàng", match: "/inventory/goods-receipts", icon: PackagePlus, action: "inventory:goods_receipt:create", branch: KITCHEN, gate: "/inventory/goods-receipts/new" },
    { href: "/inventory/inbound-qc", label: "Kiểm đầu vào", match: "/inventory/inbound-qc", icon: ClipboardCheck, action: "inventory:qc:update" },
    { href: "/inventory/stock", label: "Tồn kho", match: "/inventory/stock", icon: Boxes, action: "inventory:stock:read" },
    { href: "/inventory/shelves", label: "Kệ hàng", match: "/inventory/shelves", icon: Warehouse, action: "inventory:shelf_placement:read" },
    { href: "/inventory/storage-locations", label: "Vị trí kho", match: "/inventory/storage-locations", icon: MapPin, action: "inventory:lot:read" },
    { href: "/inventory/stock-transfers", label: "Chuyển hàng", match: "/inventory/stock-transfers", icon: Truck, action: "inventory:transfer:read" },
    { href: "/inventory/suppliers", label: "Nhà cung cấp", match: "/inventory/suppliers", icon: Store, action: "inventory:supplier:read", branch: KITCHEN },
  ] },
  {
    title: "Sản xuất",
    icon: Factory,
    items: [
      { href: "/production/materials", label: "Nguyên liệu", match: "/production/materials", icon: Boxes, action: "sales:product:read" },
      { href: "/production/dishes", label: "Món ăn", match: "/production/dishes", icon: UtensilsCrossed, action: "sales:product:read" },
      { href: "/production/targets", label: "Chỉ tiêu", match: "/production/targets", icon: ListChecks, action: "production:target:read" },
      { href: "/production/food-plans", label: "Thực đơn", match: "/production/food-plans", icon: FileSpreadsheet, action: "production:food_plan:read" },
      { href: "/production/material-requirements", label: "Nhu cầu nguyên liệu", match: "/production/material-requirements", icon: Boxes, action: "production:material_requirement:read" },
      { href: "/production/orders", label: "Lệnh sản xuất", match: "/production/orders", icon: Factory, action: "production:order:read" },
      { href: "/production/qc", label: "Kiểm định", match: "/production/qc", icon: ClipboardCheck, action: "production:qc:update" },
    ],
  },
  { title: "Bán hàng", icon: Tag, items: [
    { href: "/sales/orders", label: "Đơn hàng", match: "/sales/orders", icon: ClipboardCheck, action: "sales:order:read" },
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

const holds = (item: NavRule, actions: ReadonlySet<string>) => (!item.action || actions.has(item.action)) && (item.also ?? []).every((key) => actions.has(key));
const inBranch = (item: NavRule, branchType?: string) => !item.branch || branchType === undefined || item.branch === branchType;

export function consoleNavFor(actions: ReadonlySet<string>, branchType?: string): NavGroup[] {
  return CONSOLE_NAV
    .map((group) => ({
      title: group.title,
      icon: group.icon,
      items: group.items
        .filter((item) => inBranch(item, branchType) && holds(item, actions))
        .map(({ action: _action, also: _also, branch: _branch, gate: _gate, ...item }) => item),
    }))
    .filter((group) => group.items.length > 0);
}

export function openGroups(nav: NavGroup[], pathname: string, saved: readonly string[]): string[] {
  if (nav.length <= 2) return nav.map((group) => group.title);
  return nav
    .filter((group) => saved.includes(group.title) || group.items.some((item) => isActive(pathname, item.match)))
    .map((group) => group.title);
}

export type RouteDenial = { reason: "branch"; branch: string } | { reason: "permission" } | null;

export function consoleRouteDenial(pathname: string, actions: ReadonlySet<string>, branchType?: string): RouteDenial {
  const item = CONSOLE_NAV.flatMap((group) => group.items).find((entry) => isActive(pathname, entry.match));
  if (!item) return null;
  if (!inBranch(item, branchType)) return { reason: "branch", branch: item.branch ?? "" };
  if (item.gate && !isActive(pathname, item.gate)) return null;
  return holds(item, actions) ? null : { reason: "permission" };
}

export function consoleRouteTitle(pathname: string): string {
  for (const group of CONSOLE_NAV) {
    const item = group.items.find((entry) => isActive(pathname, entry.match));
    if (item) return group.title === item.label ? item.label : `${group.title} › ${item.label}`;
  }
  return "";
}

export function consoleRouteAllowed(pathname: string, actions: ReadonlySet<string>, branchType?: string): boolean {
  return consoleRouteDenial(pathname, actions, branchType) === null;
}

export type Crumb = ({ label: string } | { labelKey: string }) & { href?: string };

const AUXILIARY_ROUTES = [
  { href: "/account", labelKey: "account.title" },
];

export function breadcrumbFor(nav: NavGroup[], pathname: string): Crumb[] {
  const auxiliary = AUXILIARY_ROUTES.find(route => route.href === pathname);
  if (auxiliary) return [{ labelKey: auxiliary.labelKey }];
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
