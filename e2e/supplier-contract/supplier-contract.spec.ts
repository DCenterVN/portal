import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { randomBytes } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import messages from "../../messages/vi.json" with { type: "json" };

test.use({ trace: "off", video: "off", screenshot: "off" });

function fixture() {
  const path = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!path) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  return JSON.parse(readFileSync(path, "utf8")) as {
    fixture: { material_name: string; valid_from: string; valid_to: string };
  };
}

test.beforeEach(async ({ page }) => {
  const path = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  const accounts = Object.fromEntries(readFileSync(path, "utf8").split(/\r?\n/).filter(line => line && !line.startsWith("#") && line.includes("=")).map(line => [line.slice(0, line.indexOf("=")), line.slice(line.indexOf("=") + 1)]));
  if (!accounts.ROLE_WAREHOUSE_EMAIL || !accounts.ROLE_WAREHOUSE_PASSWORD) throw new Error("Thiếu role-WAREHOUSE.");
  await page.goto("/staff/login");
  await page.getByLabel(messages.employeeAuth.identifier, { exact: true }).fill(accounts.ROLE_WAREHOUSE_EMAIL);
  await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(accounts.ROLE_WAREHOUSE_PASSWORD).catch(() => { throw new Error("Không nhập được mật khẩu QA."); });
  const login = page.waitForResponse(response => new URL(response.url()).pathname === "/api/auth/staff/login" && response.request().method() === "POST");
  await page.getByRole("button", { name: messages.employeeAuth.login, exact: true }).click();
  expect((await login).status(), "Đăng nhập WAREHOUSE qua BFF thật").toBe(200);
  await page.waitForURL(/\/console$/);
});

async function pick(page: Page, label: string, name: string) {
  const input = page.getByRole("combobox", { name: label, exact: true });
  if (await input.inputValue() === name) return;
  await input.fill(name.slice(0, Math.min(12, name.length)));
  await page.getByRole("option").filter({ hasText: name }).click();
  await expect(input).toHaveValue(name);
}

test("TC-01/03/04/10/11: NCC, nháp, tệp, áp dụng và ngừng dùng bằng UI", async ({ page }) => {
  test.setTimeout(120_000);
  const { fixture: seed } = fixture();
  const suffix = randomBytes(2).toString("hex").toUpperCase();
  const name = `Gạo An Bình QA${suffix}`;
  const code = `DEMO-NCC-${suffix}`;
  const agreementCode = `DEMO-HD-${suffix}`;
  let presigns = 0;
  let directUploads = 0;
  page.on("request", request => {
    const path = new URL(request.url()).pathname;
    if (path.endsWith("/contract-documents/presign") && request.method() === "POST") presigns++;
    if (/^\/inventory-docs(?:\/|$)/.test(path) && request.method() === "POST") directUploads++;
  });
  await page.goto("/inventory/suppliers");
  await expect(page.getByRole("heading", { name: "Nhà cung cấp", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Thêm nhà cung cấp", exact: true }).click();
  await page.getByLabel("Mã nhà cung cấp", { exact: true }).fill(code);
  await page.getByLabel("Tên nhà cung cấp", { exact: true }).fill(name);
  const created = page.waitForResponse(response => new URL(response.url()).pathname === "/api/inventory/suppliers" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu nhà cung cấp", exact: true }).click();
  expect((await created).status()).toBe(201);
  await page.getByLabel("Tìm nhà cung cấp theo tên hoặc mã").fill(code);
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Hợp đồng", exact: true }).click();
  await page.getByRole("button", { name: "Lập hợp đồng mới", exact: true }).click();
  await page.getByLabel("Mã hợp đồng", { exact: true }).fill(agreementCode);
  await page.getByLabel("Hiệu lực từ", { exact: true }).fill(seed.valid_from);
  await page.getByLabel("Hiệu lực đến", { exact: true }).fill(seed.valid_to);
  await pick(page, "Nguyên liệu", seed.material_name);
  await page.getByLabel("Giá VND / đơn vị", { exact: true }).fill("25000");
  await page.getByLabel("Dòng giá từ ngày", { exact: true }).fill(seed.valid_from);
  await page.getByLabel("Dòng giá đến ngày", { exact: true }).fill(seed.valid_to);
  const pdf = { name: `DEMO-hop-dong-${suffix}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% DEMO TEST ONLY\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n") };
  await page.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").setInputFiles(pdf);
  await expect(page.getByText(pdf.name, { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Bỏ tệp đã chọn", exact: true }).click();
  expect(presigns, "Chọn/bỏ tệp chỉ giữ trong RAM").toBe(0);
  expect(directUploads).toBe(0);
  const draft = page.waitForResponse(response => /\/agreements$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
  expect((await draft).status()).toBe(201);
  const card = page.getByRole("article").filter({ hasText: agreementCode });
  await expect(card).toContainText("Bản nháp");
  await card.getByRole("button", { name: "Mở bản nháp", exact: true }).click();
  await page.getByRole("button", { name: "Áp dụng bảng giá", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Chọn chứng từ chính trước khi áp dụng");
  expect(presigns).toBe(0);
  await page.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").setInputFiles(pdf);
  const applied = page.waitForResponse(response => /\/versions$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Áp dụng bảng giá", exact: true }).click();
  expect((await applied).status()).toBe(201);
  expect(presigns).toBe(1);
  expect(directUploads, "Bytes đi bằng multipart trực tiếp qua Kong").toBe(1);
  await expect(card).toContainText("Đã áp dụng");
  await expect(card).toContainText("25.000");
  await expect(card.getByRole("button", { name: "Mở bản nháp", exact: true })).toHaveCount(0);
  await expect(card.getByRole("button", { name: "Tải chứng từ", exact: true })).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  await card.getByRole("button", { name: "Ngừng dùng", exact: true }).click();
  await expect(page.getByRole("button", { name: "Xác nhận ngừng dùng", exact: true })).toBeDisabled();
  await page.getByLabel("Lý do ngừng dùng", { exact: true }).fill("DEMO kiểm tra giữ lịch sử");
  const stopped = page.waitForResponse(response => /\/versions$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
  await page.getByRole("button", { name: "Xác nhận ngừng dùng", exact: true }).click();
  expect((await stopped).status()).toBe(201);
  await expect(card).toContainText("Đã ngừng dùng");
  await expect(card).toContainText("25.000");
  await expect(card.getByRole("button", { name: "Mở bản nháp", exact: true })).toHaveCount(0);
});
