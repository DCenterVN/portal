import { test, expect } from "@playwright/test";
import { credentials, enterFirstBranch, login } from "../account/helpers";

const admin = credentials("ADMIN");
const shots = "/home/dawn/work/ticket/.cache/e2e/sidebar-submenu";

test("Sidebar quản trị có menu con", async ({ page }) => {
  test.setTimeout(180_000);
  const nav = page.getByRole("navigation", { name: "Điều hướng quản trị" });
  const group = (name: string) => nav.getByRole("button", { name, exact: true });

  await test.step("Đăng nhập ADMIN và vào bảng điều khiển", async () => {
    await login(page, admin.email, admin.password, true);
    await page.goto("/console");
    await enterFirstBranch(page);
    await page.goto("/console");
    await expect(nav.getByRole("link", { name: "Tổng quan", exact: true })).toBeVisible();
  });

  await test.step("Mở nhóm Kho", async () => {
    await group("Kho").click();
    await expect(group("Kho")).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Nhập hàng", exact: true })).toBeVisible();
    await page.screenshot({ path: `${shots}/kho-mo.png` });
  });

  await test.step("Mở nhóm Sản xuất", async () => {
    await group("Sản xuất").click();
    await expect(nav.getByRole("link", { name: "Món & thực đơn", exact: true })).toBeVisible();
    await page.screenshot({ path: `${shots}/san-xuat-mo.png` });
  });

  await test.step("Vào Món & thực đơn, breadcrumb Sản xuất > Món & thực đơn", async () => {
    await nav.getByRole("link", { name: "Món & thực đơn", exact: true }).click();
    await page.waitForURL(/\/production\/food-plans/);
    const crumbs = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(crumbs).toContainText("Sản xuất");
    await expect(crumbs).toContainText("Món & thực đơn");
    await expect(nav.getByRole("link", { name: "Món & thực đơn", exact: true })).toHaveAttribute("aria-current", "page");
    await page.screenshot({ path: `${shots}/breadcrumb.png` });
  });

  await test.step("Tải lại trang, nhóm Sản xuất vẫn mở và Kho vẫn nhớ", async () => {
    await page.reload();
    await expect(group("Sản xuất")).toHaveAttribute("aria-expanded", "true");
    await expect(group("Kho")).toHaveAttribute("aria-expanded", "true");
    await expect(nav.getByRole("link", { name: "Món & thực đơn", exact: true })).toBeVisible();
    await page.screenshot({ path: `${shots}/tai-lai.png` });
  });

  await test.step("Thu sidebar về icon, bấm icon Sản xuất thì menu bật ra", async () => {
    await page.getByRole("button", { name: "Bật/tắt thanh bên" }).first().click();
    await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toBeVisible();
    await nav.getByRole("button", { name: "Sản xuất", exact: true }).click();
    const menu = page.getByRole("menu");
    await expect(menu.getByRole("menuitem", { name: "Món & thực đơn" })).toBeVisible();
    await expect(page.locator('[data-slot="sidebar"][data-state="collapsed"]')).toBeVisible();
    await page.screenshot({ path: `${shots}/thu-gon-menu-bat-ra.png` });
  });
});
