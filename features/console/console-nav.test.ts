import { describe, expect, it } from "vitest";
import { consoleNavFor, consoleRouteAllowed } from "./console-nav";

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
