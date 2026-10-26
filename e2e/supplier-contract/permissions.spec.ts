import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { test, expect } from "@playwright/test";
import { decodePlatform, roleMatrixSchema } from "../../lib/api/platform-contract";

test.use({ trace: "off", video: "off", screenshot: "off" });

test("TC-09: thu hồi quyền WAREHOUSE chặn API, menu và deep link trong cùng phiên", async ({ browser, baseURL }) => {
  test.setTimeout(90_000);
  const path = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  const accounts = Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  const contextPath = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!contextPath) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  const fixture = JSON.parse(readFileSync(contextPath, "utf8")) as { fixture: { supplier_id: string } };
  const permission = "inventory:supplier:read";
  const admin = await browser.newContext({ baseURL });
  const warehouse = await browser.newContext({ baseURL });
  let original: string[] | undefined;
  try {
    for (const [role, context] of [["ADMIN", admin], ["WAREHOUSE", warehouse]] as const) {
      if (!accounts[`ROLE_${role}_EMAIL`] || !accounts[`ROLE_${role}_PASSWORD`]) throw new Error(`Thiếu role-${role}.`);
      const response = await context.request.post("/api/auth/staff/login", { headers: { Origin: baseURL ?? "http://localhost:3000" }, data: { identifier: accounts[`ROLE_${role}_EMAIL`], password: accounts[`ROLE_${role}_PASSWORD`] } }).catch(() => { throw new Error(`Không đăng nhập được QA ${role}.`); });
      expect(response.status(), `Đăng nhập ${role}`).toBe(200);
    }
    const matrix = await admin.request.get("/api/org/company/role-matrix");
    expect(matrix.status()).toBe(200);
    original = decodePlatform(await matrix.json(), roleMatrixSchema).WAREHOUSE;
    expect(Array.isArray(original), "Có catalogue WAREHOUSE thật").toBe(true);
    const granted = await admin.request.put("/api/org/company/role-matrix/roles/WAREHOUSE", { data: { actions: [...new Set([...original, permission])] } });
    expect(granted.status()).toBe(200);
    const page = await warehouse.newPage();
    await page.goto("/inventory/suppliers");
    await expect(page.getByRole("heading", { name: "Nhà cung cấp", exact: true })).toBeVisible();
    const before = await warehouse.request.get(`/api/inventory/suppliers/${fixture.fixture.supplier_id}`);
    expect(before.status(), "Quyền được grant có hiệu lực qua backend").toBe(200);
    const revoked = await admin.request.put("/api/org/company/role-matrix/roles/WAREHOUSE", { data: { actions: original.filter(action => action !== permission) } });
    expect(revoked.status()).toBe(200);
    const denied = await warehouse.request.get(`/api/inventory/suppliers/${fixture.fixture.supplier_id}`, { headers: { "X-Roles": "ADMIN", "X-Permissions": permission } });
    expect(denied.status(), "Tên role/header giả không khôi phục quyền").toBe(403);
    expect(denied.headers()["cache-control"]).toContain("no-store");
    await page.reload();
    await expect(page.getByText("Không có quyền truy cập", { exact: false }).first()).toBeVisible();
    await expect(page.locator('a[href="/inventory/suppliers"]')).toHaveCount(0);
    await page.goto(`/inventory/suppliers/${fixture.fixture.supplier_id}?tab=agreements`);
    await expect(page.getByText("Không có quyền truy cập", { exact: false }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Lập hợp đồng mới", exact: true })).toHaveCount(0);
    const after = await admin.request.get(`/api/inventory/suppliers/${fixture.fixture.supplier_id}`);
    expect(after.status()).toBe(200);
    expect(await after.json(), "API bị deny không đổi nhà cung cấp").toEqual(await before.json());
  } finally {
    if (original) {
      const restored = await admin.request.put("/api/org/company/role-matrix/roles/WAREHOUSE", { data: { actions: original } });
      expect(restored.status(), "Khôi phục ma trận quyền WAREHOUSE").toBe(200);
      const current = await admin.request.get("/api/org/company/role-matrix");
      expect(current.status()).toBe(200);
      expect(decodePlatform(await current.json(), roleMatrixSchema).WAREHOUSE.slice().sort()).toEqual(original.slice().sort());
    }
    await warehouse.close();
    await admin.close();
  }
});

test("TC-09: khách và anonymous không được đọc/ghi hợp đồng qua BFF", async ({ page, baseURL }) => {
  const contextPath = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!contextPath) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  const { fixture } = JSON.parse(readFileSync(contextPath, "utf8")) as { fixture: { supplier_id: string } };
  const path = `/api/inventory/suppliers/${fixture.supplier_id}/agreements`;
  expect((await page.request.get(path)).status()).toBe(401);
  expect((await page.request.post(path, { data: {} })).status()).toBe(401);
  const credentialPath = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  const accounts = Object.fromEntries(readFileSync(credentialPath, "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  const login = await page.request.post("/api/auth/login", { headers: { Origin: baseURL ?? "http://localhost:3000" }, data: { identifier: accounts.ROLE_CUSTOMER_EMAIL, password: accounts.ROLE_CUSTOMER_PASSWORD } }).catch(() => { throw new Error("Không đăng nhập được QA CUSTOMER."); });
  expect(login.status()).toBe(200);
  expect((await page.request.get(path)).status()).toBe(403);
  expect((await page.request.post(path, { data: {} })).status()).toBe(403);
  await page.goto(`/inventory/suppliers/${fixture.supplier_id}?tab=agreements`);
  await expect(page.getByRole("button", { name: "Lập hợp đồng mới", exact: true })).toHaveCount(0);
});
