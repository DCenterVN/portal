import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname } from "node:path";
import { test, expect, type Page, type Response } from "@playwright/test";
import { z } from "zod";
import { decodePlatform } from "../../lib/api/platform-contract";
import { pick, pickVariant } from "../fooddev-v2/helpers";
import { manifestPath, manifestSchema, sessionApi } from "./api";

const suffix = Date.now().toString();
const names: Record<string, string> = Object.fromEntries([
  "Họ món", "Gói đạm", "Gói rau", "Gói gia vị", "M4", "M1 Thịt trâu xào rau muống", "M2 Thịt bò xào rau muống", "Me theo mùa", "me chua", "Set không tinh bột", "Chỉ tiêu", "S14d Món A", "S14d Món B",
].map(name => [name, `${name} ${suffix}`]));
names["SET-V2"] = `E2E-V2-SET-${suffix}`;
const ids: Record<string, string> = {};
const rawSchema = manifestSchema.shape.materials.valueSchema;
const materials: z.infer<typeof manifestSchema>["materials"] = {};
const lines: z.infer<typeof manifestSchema>["fixture"]["lines"] = [];
const fixture = { lines, supplier_id: "", supplier_name: `NCC S7 ${suffix}`, material_name: "", valid_from: "2026-10-01", valid_to: `${new Date().getFullYear() + 1}-12-31`, unit_price_vnd: 25000, uom: "KG" };
const state = `${homedir()}/work/ticket/.cache/e2e/state`;
const identity = z.object({ id: z.string() });
function changed(page: Page, path: string, method = "POST") {
  return page.waitForResponse(r => new URL(r.url()).pathname === path && r.request().method() === method);
}
async function decoded<T>(response: Response, schema: z.ZodType<T>, status = 201) {
  expect(response.status(), await response.text()).toBe(status);
  const body: unknown = await response.json();
  return schema.parse(body && typeof body === "object" && "data" in body ? body.data : body);
}
function persist() {
  mkdirSync(dirname(manifestPath), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ suffix, names, ids, fixture, materials }, null, 2));
}

test.describe.configure({ mode: "serial", timeout: 90_000 });
test.use({ storageState: `${state}/fooddev.json` });

test("Đọc nguyên liệu có sẵn và tạo họ món riêng cho lượt chạy", async ({ page }) => {
  const response = await sessionApi(page.context()).get("/api/sales/skus?kind=RAW_MATERIAL&q=S13");
  expect(response.status()).toBe(200);
  const catalog = decodePlatform(await response.json(), z.object({ items: z.array(rawSchema) }));
  for (const [key, name] of [["BUFFALO", "Thịt trâu S13"], ["BEEF", "Thịt bò S13"], ["GREENS", "Rau muống S13"], ["GARLIC", "Tỏi S13"], ["OKRA", "Đậu bắp S13"], ["TARO", "Dọc mùng S13"], ["INVENTORY_GARLIC", "E2E-261031-Tỏi S13"], ["INVENTORY_GREENS", "E2E-261031-Rau muống S13"]]) {
    const raw = catalog.items.find(item => item.name === name);
    if (!raw) throw new Error(`Thiếu nguyên liệu tham chiếu ${name}`);
    materials[key] = raw; ids[key] = raw.id; names[name] = raw.name;
  }
  fixture.material_name = materials.GARLIC.name;
  for (const { key, price } of [{ key: "INVENTORY_GARLIC", price: 25000 }, { key: "INVENTORY_GREENS", price: 35000 }]) {
    lines.push({ name: materials[key].name, sku_ref: materials[key].id, unit_price_vnd: price, uom: "KG" });
  }
  await page.goto("/production/targets");
  await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
  await page.getByLabel("Tên sản phẩm", { exact: true }).fill(names["Họ món"]);
  const created = changed(page, "/api/sales/products");
  await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
  ids.FAMILY = (await decoded(await created, z.object({ product: identity }))).product.id;
  persist();
});

for (const [key, raw, name] of [["PROTEIN", "BUFFALO", "Gói đạm"], ["VEGETABLE", "OKRA", "Gói rau"], ["SEASONING", "GARLIC", "Gói gia vị"]]) {
  test(`Tạo ${name} và công thức qua UI`, async ({ page }) => {
    await page.goto("/production/food-plans");
    await page.getByRole("tab", { name: "Gói + công thức", exact: true }).click();
    const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
    await region.getByRole("button", { name: "Tạo gói", exact: true }).first().click();
    const form = region.getByRole("form", { name: "Biên tập gói", exact: true });
    await pick(form, "Họ món của gói", names["Họ món"]);
    await form.getByLabel("Tên gói", { exact: true }).fill(names[name]);
    const created = changed(page, "/api/food-packs/sales/packages");
    await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
    ids[key] = (await decoded(await created, identity)).id;
    await region.getByRole("button", { name: "Tạo công thức", exact: true }).click();
    await pick(region.getByRole("region", { name: "Chọn nguyên liệu", exact: true }).first(), "Nguyên liệu", materials[raw].name);
    const recipe = region.getByRole("form", { name: "Biên tập công thức", exact: true });
    await recipe.getByLabel("Định lượng 1", { exact: true }).fill("10");
    await recipe.getByRole("combobox", { name: /^Đơn vị 1\b/ }).selectOption("G");
    await recipe.getByRole("button", { name: "Thêm bước chế biến", exact: true }).click();
    await recipe.getByLabel("Hướng dẫn 1", { exact: true }).fill(`Sơ chế ${suffix}`);
    const saved = changed(page, `/api/food-packs/production/packages/${ids[key]}/recipes`);
    await recipe.getByRole("button", { name: "Lưu công thức", exact: true }).click();
    await decoded(await saved, identity);
    persist();
  });
}

test("Tạo M4 và PREPARATION ghim định mức qua UI", async ({ page }) => {
  await page.goto("/production/food-plans");
  const draft = changed(page, "/api/food-packs/sales/dish-drafts");
  await page.getByRole("button", { name: "Tạo món", exact: true }).first().click();
  const draftID = (await decoded(await draft, z.object({ draft: identity }))).draft.id;
  await page.getByLabel("Tên món", { exact: true }).fill(names.M4);
  await page.getByRole("combobox", { name: "Danh mục", exact: true }).click();
  const category = page.getByRole("option").first();
  names["Món E2E"] = (await category.innerText()).split(" · ")[0];
  await category.click();
  await page.getByLabel("Hashtag", { exact: true }).fill(`s7, mau-mon, mon-${suffix}`);
  await page.getByRole("combobox", { name: "Khẩu phần", exact: true }).selectOption("2");
  for (const [index, raw] of [materials.BUFFALO, materials.OKRA].entries()) {
    await page.getByRole("button", { name: "Thêm dòng nguyên liệu", exact: true }).click();
    await pick(page.getByRole("region", { name: "Chọn nguyên liệu", exact: true }), "Nguyên liệu", raw.name);
    await page.getByRole("textbox", { name: `Lượng / suất dòng ${index + 1}`, exact: true }).fill("100");
  }
  await page.getByRole("button", { name: "Thêm gia vị", exact: true }).click();
  await pick(page, "Gói gia vị 1", names["Gói gia vị"]);
  const completed = changed(page, `/api/dishes/drafts/${draftID}/complete`);
  await page.getByRole("button", { name: "Hoàn tất món", exact: true }).click();
  const dish = await decoded(await completed, z.object({ product_ref: z.string(), set_ref: z.string() }), 200);
  ids.M4 = dish.product_ref; ids.M4_SET = dish.set_ref;
  await page.goto("/production/targets");
  await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
  await pick(page, "Sản phẩm", names.M4);
  await page.getByLabel("Tiêu đề", { exact: true }).fill(names["Chỉ tiêu"]);
  await page.getByLabel("Tổng suất chỉ tiêu", { exact: true }).fill("8");
  const target = changed(page, "/api/production/targets");
  await page.getByRole("button", { name: "Lưu chỉ tiêu", exact: true }).click();
  ids.TARGET = (await decoded(await target, identity)).id;
  await page.goto(`/production/food-plans?target_id=${ids.TARGET}`);
  await page.getByRole("tab", { name: "Thực đơn", exact: true }).click();
  await page.getByRole("button", { name: "Tạo set", exact: true }).first().click();
  await pickVariant(page, names.M4);
  await page.getByLabel("Số kit", { exact: true }).fill("4");
  await page.getByRole("combobox", { name: "Nguồn định mức", exact: true }).selectOption("pack");
  const plan = changed(page, `/api/production/targets/${ids.TARGET}/food-plans`);
  await page.getByRole("button", { name: "Lưu set", exact: true }).click();
  ids.PREPARATION = (await decoded(await plan, identity)).id;
  persist();
});

test("Tạo NCC và bảng giá ACTIVE làm dữ liệu chung", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, storageState: `${state}/warehouse.json` });
  try {
    const page = await context.newPage();
    await page.goto("/inventory/suppliers");
    await page.getByRole("button", { name: "Thêm nhà cung cấp", exact: true }).click();
    await page.getByLabel("Mã nhà cung cấp", { exact: true }).fill(`S7-${suffix}`);
    await page.getByLabel("Tên nhà cung cấp", { exact: true }).fill(fixture.supplier_name);
    const created = changed(page, "/api/inventory/suppliers");
    await page.getByRole("button", { name: "Lưu nhà cung cấp", exact: true }).click();
    fixture.supplier_id = (await decoded(await created, identity)).id;
    await page.goto(`/inventory/suppliers/${fixture.supplier_id}?tab=agreements`);
    await page.getByRole("button", { name: "Lập bảng giá mới", exact: true }).click();
    await page.getByLabel("Mã bảng giá", { exact: true }).fill(`HD-S7-${suffix}`);
    await page.getByLabel("Hiệu lực từ", { exact: true }).fill(fixture.valid_from);
    await page.getByLabel("Hiệu lực đến", { exact: true }).fill(fixture.valid_to);
    const prices = [{ name: fixture.material_name, unit_price_vnd: fixture.unit_price_vnd }, ...lines];
    for (const [index, line] of prices.entries()) {
      if (index) await page.getByRole("button", { name: "Thêm dòng giá", exact: true }).click();
      const row = page.getByRole("table", { name: "Các dòng bảng giá", exact: true }).getByRole("row").nth(index + 1);
      await pick(row, "Nguyên liệu", line.name);
      await row.getByLabel("Giá VND / đơn vị", { exact: true }).fill(String(line.unit_price_vnd));
    }
    await page.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").setInputFiles({ name: `S7-${suffix}.pdf`, mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\n% S7 test\n%%EOF\n") });
    const saved = changed(page, `/api/inventory/suppliers/${fixture.supplier_id}/agreements`);
    await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
    const agreement = await decoded(await saved, z.object({ agreement_id: z.string() }));
    const card = page.getByRole("article").filter({ hasText: `HD-S7-${suffix}` });
    await card.getByRole("button", { name: "Mở bản nháp", exact: true }).click();
    const applied = changed(page, `/api/inventory/suppliers/${fixture.supplier_id}/agreements/${agreement.agreement_id}/versions`);
    await page.getByRole("button", { name: "Áp dụng bảng giá", exact: true }).click();
    await decoded(await applied, z.object({ status: z.literal("ACTIVE") }));
    persist(); manifestSchema.parse({ suffix, names, ids, fixture, materials });
  } finally { await context.close(); }
});
