import { test, expect, type Page } from "@playwright/test";
import { z } from "zod";
import { decodePlatform } from "../../lib/api/platform-contract";
import { pick } from "../fooddev-v2/helpers";
import { readManifest, sessionApi } from "../setup/api";

test.use({ storageState: process.env.PORTAL_WAREHOUSE_STATE ?? "/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json" });
const display = (iso: string) => iso.split("-").reverse().join("/");
const historySchema = z.object({ items: z.array(z.object({
  id: z.string().uuid(), supplier_ref: z.string().uuid(), status: z.string(), total_amount_vnd: z.number(),
  lines: z.array(z.object({ sku_ref: z.string().uuid(), expected_quantity: z.coerce.number(), unit_cost_vnd: z.number().int().nonnegative() })),
})) });

async function start(page: Page, date: string) {
  const { fixture } = readManifest();
  await page.goto("/inventory/goods-receipts/new");
  await expect(page.getByRole("heading", { name: "Tạo phiếu nhập", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phiếu nhập", exact: true })).toBeDisabled();
  await pick(page, "Nhà cung cấp", fixture.supplier_name);
  await pick(page, "Nguyên liệu dòng 1", fixture.material_name);
  await page.getByLabel("Ngày dự kiến nhập", { exact: true }).fill(display(date));
  await page.getByLabel("Số lượng dòng 1", { exact: true }).fill("2");
}

async function submitAndRead(page: Page, price: number) {
  const { fixture, ids } = readManifest();
  const result = page.waitForResponse(response => new URL(response.url()).pathname === "/api/inventory/goods-receipts" && response.request().method() === "POST");
  await page.getByRole("button", { name: "Tạo phiếu nhập", exact: true }).click();
  const response = await result;
  expect(response.status()).toBe(201);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const created = decodePlatform(await response.json(), z.object({ id: z.string().uuid(), status: z.literal("DRAFT") }));
  await expect(page.getByRole("status")).toContainText("Đã tạo phiếu nhập");
  const history = await sessionApi(page.context()).get(`/api/inventory/suppliers/${fixture.supplier_id}/goods-receipts`);
  expect(history.status()).toBe(200);
  const receipt = decodePlatform(await history.json(), historySchema).items.find(item => item.id === created.id);
  expect(receipt).toMatchObject({ id: created.id, status: "DRAFT", supplier_ref: fixture.supplier_id, total_amount_vnd: 2 * price, lines: [{ sku_ref: ids.GARLIC, expected_quantity: 2, unit_cost_vnd: price }] });
}

test("TC-05/10/16: picker tên, giá tham chiếu và giá nhập sửa được trong/ngoài kỳ", async ({ page }) => {
  test.setTimeout(90_000);
  const { fixture } = readManifest();
  let writes = 0;
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/inventory/goods-receipts" && request.method() === "POST") writes++; });
  await start(page, fixture.valid_from);
  const price = page.getByRole("spinbutton", { name: "Đơn giá dòng 1", exact: true });
  await expect(price).toHaveValue(String(fixture.unit_price_vnd));
  await expect(page.getByText(`Giá tham chiếu: ${fixture.unit_price_vnd.toLocaleString("vi-VN")} VND`, { exact: true })).toBeVisible();
  await expect(price).toBeEditable();
  await price.fill("26000");
  await expect(page.getByRole("status").filter({ hasText: "Giá nhập khác bảng giá tham chiếu" })).toBeVisible();
  expect(writes).toBe(0);
  await submitAndRead(page, 26000);
  expect(writes).toBe(1);
  const outside = new Date(`${fixture.valid_to}T12:00:00Z`);
  outside.setUTCDate(outside.getUTCDate() + 1);
  await start(page, outside.toISOString().slice(0, 10));
  await expect(price).toHaveValue("");
  await expect(page.getByText(/^Giá tham chiếu:/)).toHaveCount(0);
  await expect(page.getByText("Chưa có giá tham chiếu cho một số dòng. Nhập đơn giá thực tế để tiếp tục.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tạo phiếu nhập", exact: true })).toBeDisabled();
  expect(writes).toBe(1);
  await price.fill("27000");
  await expect(page.getByRole("button", { name: "Tạo phiếu nhập", exact: true })).toBeEnabled();
  await submitAndRead(page, 27000);
  expect(writes).toBe(2);
  expect(await page.locator("main").innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});

test("TC-16: đơn giá 0 hợp lệ, khác ô đơn giá bỏ trống", async ({ page }) => {
  test.setTimeout(60_000);
  await start(page, readManifest().fixture.valid_from);
  const price = page.getByRole("spinbutton", { name: "Đơn giá dòng 1", exact: true });
  const create = page.getByRole("button", { name: "Tạo phiếu nhập", exact: true });
  await expect(price).toHaveValue("25000");
  await price.fill("");
  await expect(create).toBeDisabled();
  await price.fill("0");
  await expect(create).toBeEnabled();
  await submitAndRead(page, 0);
});
