import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

test.use({ storageState: process.env.PORTAL_WAREHOUSE_STATE ?? "/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json", trace: "off", video: "off", screenshot: "off" });

test("TC-05/10/16: picker tên, giá chỉ đọc và ngày ngoài hợp đồng chặn tạo phiếu", async ({ page }) => {
  test.setTimeout(90_000);
  const contextPath = process.env.SUPPLIER_CONTRACT_CONTEXT;
  if (!contextPath) throw new Error("Thiếu SUPPLIER_CONTRACT_CONTEXT từ runner cô lập.");
  const { fixture } = JSON.parse(readFileSync(contextPath, "utf8")) as {
    fixture: { supplier_name: string; material_name: string; valid_from: string; valid_to: string; unit_price_vnd: number; uom: string };
  };
  let writes = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/inventory/goods-receipts" && request.method() === "POST") writes++; });
  await page.goto("/inventory/goods-receipts/new");
  await expect(page.getByRole("heading", { name: "Tạo phiếu nhập", exact: true })).toBeVisible();
  const create = page.getByRole("button", { name: "Tạo phiếu nhập", exact: true });
  await expect(create).toBeDisabled();
  for (const [label, name] of [["Nhà cung cấp", fixture.supplier_name], ["Nguyên liệu dòng 1", fixture.material_name]]) {
    const input = page.getByRole("combobox", { name: label, exact: true });
    if (await input.inputValue() !== name) {
      await input.fill(name.slice(0, Math.min(12, name.length)));
      await page.getByRole("option").filter({ hasText: name }).click();
    }
    await expect(input).toHaveValue(name);
  }
  const display = (iso: string) => iso.split("-").reverse().join("/");
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill(display(fixture.valid_from));
  await page.getByLabel("Số lượng dòng 1", { exact: true }).fill("2");
  await expect(page.getByLabel("Giá hợp đồng dòng 1", { exact: true })).toHaveText(`${fixture.unit_price_vnd.toLocaleString("vi-VN")} VND`);
  await expect(create).toBeEnabled();
  await expect(page.locator('input[name="unit_price_vnd"], input[name="supplier_ref"], input[name="sku_ref"]')).toHaveCount(0);
  const after = new Date(`${fixture.valid_to}T12:00:00Z`);
  after.setUTCDate(after.getUTCDate() + 1);
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill(display(after.toISOString().slice(0, 10)));
  await expect(create).toBeDisabled();
  await expect(page.getByRole("alert").filter({ hasText: "Chưa có hợp đồng đã áp dụng" })).toBeVisible();
  expect(writes, "Ngày ngoài hợp đồng không gửi lệnh tạo phiếu").toBe(0);
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill(display(fixture.valid_to));
  await expect(create).toBeEnabled();
  const response = page.waitForResponse(response => new URL(response.url()).pathname === "/api/inventory/goods-receipts" && response.request().method() === "POST");
  await create.click();
  const created = await response;
  expect(created.status()).toBe(201);
  expect(created.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByRole("status")).toContainText("Đã tạo phiếu nhập");
  expect(writes).toBe(1);
  expect(await page.locator("main").innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
