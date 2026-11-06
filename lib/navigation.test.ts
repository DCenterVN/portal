import { describe, expect, it } from "vitest";
import { consoleNavFor, consoleRouteAllowed } from "./navigation";

const route = "/production/material-requirements";
const visible = (permissions: string[]) => consoleNavFor(new Set(permissions)).flatMap(group => group.items).some(item => item.href === route);
describe("requirements permission", () => {
  it("shows the menu and permits the page with material_requirement:read", () => {
    expect(visible(["production:material_requirement:read"])).toBe(true);
    expect(consoleRouteAllowed(route, new Set(["production:material_requirement:read"]))).toBe(true);
  });
  it.each([[], ["WAREHOUSE"], ["FOOD_DEV"], ["ADMIN"], ["production:food_plan:read"], ["production:target:create"]].map(permissions => ({ permissions })))("hides without the exact permission: %j", ({ permissions }) => {
    expect(visible(permissions)).toBe(false);
    expect(consoleRouteAllowed(route, new Set(permissions))).toBe(false);
  });
});

import { CONSOLE_ROUTES, isEmployeeRoute } from "@/lib/fetcher";

describe("NCC và tạo phiếu theo action riêng", () => {
  it.each(["/inventory/suppliers", "/inventory/suppliers/detail"])("chặn deep link %s sau revoke", path => {
    expect(consoleRouteAllowed(path, new Set())).toBe(false);
    expect(consoleRouteAllowed(path, new Set(["ADMIN"]))).toBe(false);
    expect(consoleRouteAllowed(path, new Set(["inventory:supplier:read"]))).toBe(true);
    expect(consoleRouteAllowed(path, new Set(["inventory:shelf_placement:read"]))).toBe(false);
  });
  it("menu cụ thể không kế thừa broad inventory match", () => {
    const items = consoleNavFor(new Set(["inventory:supplier:read", "inventory:goods_receipt:create"])).flatMap(group => group.items);
    expect(items.map(item => item.href)).toContain("/inventory/suppliers");
    expect(items.map(item => item.href)).toContain("/inventory/goods-receipts/new");
    expect(consoleRouteAllowed("/inventory/goods-receipts/new", new Set(["inventory:supplier:read"]))).toBe(false);
  });
});

describe("AC-4 menu Sản phẩm theo sales:product:read", () => {
  const productRoute = "/sales/products";
  const items = (permissions: string[]) => consoleNavFor(new Set(permissions)).flatMap(group => group.items);
  it("hiện mục Sản phẩm và cho vào trang khi có đúng sales:product:read", () => {
    expect(items(["sales:product:read"])).toContainEqual(expect.objectContaining({ href: productRoute, label: "Sản phẩm" }));
    expect(consoleRouteAllowed(productRoute, new Set(["sales:product:read"]))).toBe(true);
    expect(consoleRouteAllowed(`${productRoute}/x`, new Set(["sales:product:read"]))).toBe(true);
  });
  it.each([[], ["SALES"], ["ADMIN"], ["sales:product:create"], ["sales:product_listing:update"], ["sales:price_book:create"], ["sales:catalog:read"]].map(permissions => ({ permissions })))("AC-4 ẩn menu và chặn trang khi thiếu quyền đọc: %j", ({ permissions }) => {
    expect(items(permissions).some(item => item.href === productRoute)).toBe(false);
    expect(consoleRouteAllowed(productRoute, new Set(permissions))).toBe(false);
  });
  it("AC-4 chỉ so action, không so tên role: mã role trùng tên không mở menu", () => {
    expect(items(["SALES", "ADMIN", "FOOD_DEV"]).some(item => item.href === productRoute)).toBe(false);
  });
  it("AC-4 Bảng giá vẫn cần price_book:create, quyền đọc sản phẩm không mở", () => {
    expect(items(["sales:product:read"]).some(item => item.href === "/sales/pricing")).toBe(false);
    expect(consoleRouteAllowed("/sales/pricing", new Set(["sales:product:read"]))).toBe(false);
  });
  it("AC-3 CONSOLE_ROUTES có /sales/products để proxy dùng phiên nhân viên", () => {
    expect(CONSOLE_ROUTES).toContain(productRoute);
    expect(isEmployeeRoute(productRoute)).toBe(true);
  });
  it("AC-1 /products của khách không là route console", () => {
    expect(isEmployeeRoute("/products")).toBe(false);
  });
});

import { breadcrumbFor, isActive, type NavGroup } from "./navigation";

describe("breadcrumbFor", () => {
  const nav: NavGroup[] = [
    { title: "Tổng quan", items: [{ href: "/console", label: "Bảng điều khiển", match: "/console" }] },
    { title: "Kho", items: [
      { href: "/inventory/suppliers", label: "Nhà cung cấp", match: "/inventory/suppliers" },
      { href: "/inventory/goods-receipts/new", label: "Tạo phiếu nhập", match: "/inventory/goods-receipts/new" },
    ] },
  ];
  it("isActive matches the route and its descendants only", () => {
    expect(isActive("/inventory/suppliers/x", "/inventory/suppliers")).toBe(true);
    expect(isActive("/inventory/suppliersx", "/inventory/suppliers")).toBe(false);
  });
  it("is group > item for a nested page and drops the group when it repeats the item", () => {
    expect(breadcrumbFor(nav, "/inventory/suppliers/detail")).toEqual([{ label: "Kho" }, { label: "Nhà cung cấp" }]);
    expect(breadcrumbFor(nav, "/console")).toEqual([{ label: "Tổng quan" }, { label: "Bảng điều khiển" }]);
    expect(breadcrumbFor([{ title: "X", items: [{ href: "/x", label: "X", match: "/x" }] }], "/x")).toEqual([{ label: "X" }]);
  });
  it("is empty when no menu item matches (permission-hidden or unknown path)", () => {
    expect(breadcrumbFor(nav, "/branches")).toEqual([]);
  });
  it("prefers the deepest match", () => {
    const deep: NavGroup[] = [{ title: "G", items: [
      { href: "/a", label: "A", match: "/a" }, { href: "/a/b", label: "AB", match: "/a/b" },
    ] }];
    expect(breadcrumbFor(deep, "/a/b/c")).toEqual([{ label: "G" }, { label: "AB" }]);
  });
});
