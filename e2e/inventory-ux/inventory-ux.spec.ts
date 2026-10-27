import { readFileSync } from "node:fs";
import { test, expect, type Page, type TestInfo } from "@playwright/test";

test.use({ storageState: process.env.PORTAL_WAREHOUSE_STATE ?? "/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json", trace: "off", video: "off", screenshot: "off" });

type PersistedLine = { expected_quantity: string };
type PersistedReceipt = { id: string };
type SeedLine = { name: string; sku_ref: string; unit_price_vnd: number; uom: string };
type Seed = { fixture: { supplier_id: string; supplier_name: string; valid_from: string; lines: SeedLine[] } };
const { fixture } = JSON.parse(readFileSync(process.env.SUPPLIER_CONTRACT_CONTEXT ?? "/home/dawn/work/ticket/.cache/tmp/ux8-context.json", "utf8")) as Seed;
const evidence = ".aidlc/runs/PORTAL-INVENTORY-UX-001/artifacts/e2e-web";
async function shot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: `${evidence}/repeat-${info.repeatEachIndex}/${info.line}-${name}.png`, fullPage: true, animations: "disabled" });
}
async function pick(page: Page, label: string, name: string) {
  const box = page.getByRole("combobox", { name: label, exact: true });
  if (await box.inputValue() !== name) {
    await box.fill(name.slice(0, Math.max(3, Math.floor(name.length / 2))));
    await page.getByRole("option").filter({ hasText: name }).click();
  }
  await expect(box).toHaveValue(name);
}
test.beforeEach(async ({ page }) => {
  await page.goto("/inventory/goods-receipts/new");
  await expect(page.getByRole("combobox", { name: "Nhà cung cấp", exact: true })).toBeVisible();
});
test("TC-07: hai dòng, ngày Việt, tổng hợp đồng và tạo nháp đọc lại", async ({ page }, info) => {
  await pick(page, "Nhà cung cấp", fixture.supplier_name);
  await shot(page, info, "supplier");
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill("27/10/2026");
  await pick(page, "Nguyên liệu dòng 1", fixture.lines[0].name);
  await page.getByLabel("Số lượng dòng 1", { exact: true }).fill("2.5");
  await page.getByRole("button", { name: "Thêm dòng nhập", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Nguyên liệu dòng 2", exact: true })).toBeFocused();
  await pick(page, "Nguyên liệu dòng 2", fixture.lines[1].name);
  await page.getByLabel("Số lượng dòng 2", { exact: true }).fill("1");
  const total = Math.round(2.5 * fixture.lines[0].unit_price_vnd) + fixture.lines[1].unit_price_vnd;
  await expect(page.getByLabel("Tổng tiền dự kiến", { exact: true })).toHaveText(`${total.toLocaleString("vi-VN")} VND`);
  await shot(page, info, "two-lines-total-date");
  await page.reload();
  await expect(page.getByLabel("Ngày dự kiến nhập", { exact: true })).toHaveValue("27/10/2026");
  await expect(page.getByRole("combobox", { name: "Nguyên liệu dòng 2", exact: true })).toHaveValue(fixture.lines[1].name);
  let writes = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/inventory/goods-receipts" && request.method() === "POST") writes++; });
  const response = page.waitForResponse(r => new URL(r.url()).pathname === "/api/inventory/goods-receipts" && r.request().method() === "POST");
  const button = page.getByRole("button", { name: "Tạo phiếu nhập", exact: true });
  await expect(button).toBeEnabled();
  await button.click();
  const created = await response;
  expect(created.status()).toBe(201);
  const body = await created.json();
  const receipt = body.data ?? body;
  await expect(page.getByRole("status")).toContainText("Đã tạo phiếu nhập");
  expect(writes).toBe(1);
  await shot(page, info, "created");
  await page.goto(`/inventory/suppliers/${fixture.supplier_id}?tab=receipts`);
  const historyResponse = page.waitForResponse(r => new URL(r.url()).pathname === `/api/inventory/suppliers/${fixture.supplier_id}/goods-receipts`);
  await page.reload();
  const historyBody = await (await historyResponse).json();
  const persisted = (historyBody.data ?? historyBody).items.find((item: PersistedReceipt) => item.id === receipt.id);
  expect(persisted).toBeDefined();
  expect(persisted.status).toBe("DRAFT");
  expect(persisted.supplier_ref).toBe(fixture.supplier_id);
  expect(persisted.total_amount_vnd).toBe(total);
  expect(persisted.lines.map((line: PersistedLine) => Number(line.expected_quantity))).toEqual([2.5, 1]);
  const history = page.getByRole("region", { name: "Lịch sử nhập", exact: true });
  await expect(history.getByRole("article").first()).toBeVisible();
  await expect(history).toContainText(total.toLocaleString("vi-VN"));
  await shot(page, info, "reloaded-history");
});
test("TC-08: không tìm thấy và ngày sai không tạo phiếu", async ({ page }, info) => {
  let writes = 0;
  page.on("request", r => { if (new URL(r.url()).pathname === "/api/inventory/goods-receipts" && r.method() === "POST") writes++; });
  const box = page.getByRole("combobox", { name: "Nhà cung cấp", exact: true });
  await box.fill("zzzz-khong-co-ncc");
  await expect(page.getByRole("listbox", { name: "Nhà cung cấp", exact: true })).toContainText("Không tìm thấy");
  await shot(page, info, "no-match");
  await pick(page, "Nhà cung cấp", fixture.supplier_name);
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill("31/02/2026");
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).blur();
  await expect(page.getByRole("alert").filter({ hasText: "Nhập ngày hợp lệ" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phiếu nhập", exact: true })).toBeDisabled();
  expect(writes).toBe(0);
  await shot(page, info, "invalid-date");
});
test("TC-07/12: list ACTIVE, hồ sơ chip và bảng không tràn sáng tối", async ({ page }, info) => {
  await page.goto("/inventory/suppliers");
  await expect(page.getByLabel("Lọc trạng thái nhà cung cấp")).toHaveValue("ACTIVE");
  await page.getByLabel("Tìm nhà cung cấp theo tên hoặc mã").fill(fixture.supplier_name.slice(0, 10));
  await expect(page.getByRole("link", { name: fixture.supplier_name, exact: true })).toBeVisible();
  await shot(page, info, "active-list");
  await page.getByRole("link", { name: fixture.supplier_name, exact: true }).click();
  await expect(page.getByRole("heading", { name: fixture.supplier_name, exact: true })).toBeVisible();
  await shot(page, info, "profile-chips");
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({width,height:900});
    await page.reload();
    await expect(page.getByRole("heading", { name: fixture.supplier_name, exact: true })).toBeVisible();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(value => document.documentElement.classList.toggle("dark", value === "dark"), theme);
      expect(await page.locator("main").innerText()).not.toMatch(/e30=|\[object Object\]|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
      await shot(page, info, `profile-${width}-${theme}`);
    }
  }
});
