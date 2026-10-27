import { readFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { decodePlatform, roleMatrixSchema } from "../../lib/api/platform-contract";

test.use({ storageState: { cookies: [], origins: [] }, trace: "off", video: "off", screenshot: "off" });

async function browserRequest(page: Page, path: string, method = "GET", data?: Record<string, string[]>, headers?: Record<string, string>) {
  return page.evaluate(async ({ path, method, data, headers }) => {
    const response = await fetch(path, { method, headers: { ...headers, ...(data ? { "Content-Type": "application/json" } : {}) }, body: data ? JSON.stringify(data) : undefined });
    const body: unknown = await response.json();
    return { status: response.status, cacheControl: response.headers.get("cache-control"), body };
  }, { path, method, data, headers });
}

test("TC-09: thu hồi quyền WAREHOUSE chặn API, menu và deep link trong cùng phiên", async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const contextPath = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!contextPath) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  const fixture = JSON.parse(readFileSync(contextPath, "utf8")) as { fixture: { supplier_id: string } };
  const permission = "inventory:supplier:read";
  const admin = await browser.newContext({ baseURL, storageState: process.env.PORTAL_ADMIN_STATE ?? "/home/dawn/work/ticket/.cache/tmp/ux8-admin-storage.json" });
  const warehouse = await browser.newContext({ baseURL, storageState: process.env.PORTAL_WAREHOUSE_STATE ?? "/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json" });
  const adminPage = await admin.newPage();
  const page = await warehouse.newPage();
  await adminPage.goto("/staff/login");
  await expect(adminPage.getByRole("region", { name: "Cổng nhân viên", exact: true })).toBeVisible();
  await page.goto("/inventory/suppliers");
  let original: string[] | undefined;
  try {
    const matrix = await browserRequest(adminPage, "/api/org/company/role-matrix");
    expect(matrix.status).toBe(200);
    original = decodePlatform(matrix.body, roleMatrixSchema).WAREHOUSE;
    expect(Array.isArray(original), "Có catalogue WAREHOUSE thật").toBe(true);
    const granted = await browserRequest(adminPage, "/api/org/company/role-matrix/roles/WAREHOUSE", "PUT", { actions: [...new Set([...original, permission])] });
    expect(granted.status).toBe(200);
    await page.goto("/inventory/suppliers");
    await expect(page.getByRole("heading", { name: "Nhà cung cấp", exact: true })).toBeVisible();
    const before = await browserRequest(page, `/api/inventory/suppliers/${fixture.fixture.supplier_id}`);
    expect(before.status, "Quyền được grant có hiệu lực qua backend").toBe(200);
    const revoked = await browserRequest(adminPage, "/api/org/company/role-matrix/roles/WAREHOUSE", "PUT", { actions: original.filter(action => action !== permission) });
    expect(revoked.status).toBe(200);
    const denied = await browserRequest(page, `/api/inventory/suppliers/${fixture.fixture.supplier_id}`, "GET", undefined, { "X-Roles": "ADMIN", "X-Permissions": permission });
    expect(denied.status, "Tên role/header giả không khôi phục quyền").toBe(403);
    expect(denied.cacheControl).toContain("no-store");
    await page.reload();
    await expect(page.getByText("Không có quyền truy cập", { exact: false }).first()).toBeVisible();
    await expect(page.locator('a[href="/inventory/suppliers"]')).toHaveCount(0);
    await page.goto(`/inventory/suppliers/${fixture.fixture.supplier_id}?tab=agreements`);
    await expect(page.getByText("Không có quyền truy cập", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Lập bảng giá mới", exact: true })).toHaveCount(0);
    const after = await browserRequest(adminPage, `/api/inventory/suppliers/${fixture.fixture.supplier_id}`);
    expect(after.status).toBe(200);
    expect(after.body, "API bị deny không đổi nhà cung cấp").toEqual(before.body);
  } finally {
    if (original) {
      const restored = await browserRequest(adminPage, "/api/org/company/role-matrix/roles/WAREHOUSE", "PUT", { actions: original });
      expect(restored.status, "Khôi phục ma trận quyền WAREHOUSE").toBe(200);
      const current = await browserRequest(adminPage, "/api/org/company/role-matrix");
      expect(current.status).toBe(200);
      expect(decodePlatform(current.body, roleMatrixSchema).WAREHOUSE.slice().sort()).toEqual(original.slice().sort());
    }
    await warehouse.close();
    await admin.close();
  }
});

test("TC-09: khách và anonymous không được đọc/ghi hợp đồng qua BFF", async ({ page, browser, baseURL }) => {
  const contextPath = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!contextPath) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  const { fixture } = JSON.parse(readFileSync(contextPath, "utf8")) as { fixture: { supplier_id: string } };
  const path = `/api/inventory/suppliers/${fixture.supplier_id}/agreements`;
  expect((await page.request.get(path)).status()).toBe(401);
  expect((await page.request.post(path, { data: {} })).status()).toBe(401);
  const customer = await browser.newContext({ baseURL, storageState: process.env.PORTAL_CUSTOMER_STATE ?? "/home/dawn/work/ticket/.cache/tmp/ux8-customer-storage.json" });
  const customerPage = await customer.newPage();
  await customerPage.goto("/products");
  expect((await browserRequest(customerPage, path)).status).toBe(403);
  expect((await browserRequest(customerPage, path, "POST", {})).status).toBe(403);
  await customerPage.goto(`/inventory/suppliers/${fixture.supplier_id}?tab=agreements`);
  await expect(customerPage.getByRole("button", { name: "Lập bảng giá mới", exact: true })).toHaveCount(0);
  await customer.close();
});
