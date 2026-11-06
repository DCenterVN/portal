import { Buffer } from "node:buffer";
import { homedir } from "node:os";
import { crc32, deflateSync } from "node:zlib";
import { test, expect, type Locator, type Page, type Response } from "@playwright/test";
import { z } from "zod";
import { draftSchema } from "../../lib/api/dishes";
import { agreementSchema } from "../../lib/api/supplier-agreements";
import { pick } from "../fooddev-v2/helpers";

const materialSchema = z.object({ id: z.string().uuid(), name: z.string(), material_group_code: z.string().nullable(), uom_code: z.string() });
const costSchema = z.object({ complete: z.boolean(), total_vnd: z.number(), per_serving_vnd: z.number(), lines: z.array(z.object({ sku_ref: z.string(), quantity: z.string(), uom: z.string(), cost_vnd: z.number().nullable(), missing: z.string().nullable() })) });
const detailSchema = z.object({ product: z.object({ id: z.string(), name: z.string() }), variants: z.array(z.object({ set_ref: z.string(), journey: z.string(), servings: z.number(), packs: z.array(z.object({ slot: z.string(), package_ref: z.string(), lines: z.array(z.object({ sku_ref: z.string(), quantity: z.string(), uom: z.string(), yield_pct: z.string() })) })) })) });
const sales = "/api/food-packs/sales";
const supplierSchema = z.object({ id: z.string().uuid(), status: z.literal("ACTIVE"), tax_code: z.string().nullish(), contact_name: z.string().nullish(), contact_phone: z.string().nullish(), contact_email: z.string().nullish(), note: z.string().nullish(), address: z.object({ line: z.string(), ward: z.string(), province: z.string() }).nullish() });

function png(red: number) {
  function chunk(type: string, body: Buffer) {
    const payload = Buffer.concat([Buffer.from(type), body]);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(body.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(payload));
    return Buffer.concat([size, payload, checksum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  return { name: `mon-ban-${red}.png`, mimeType: "image/png", buffer: Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, red, 90, 140, 255]))), chunk("IEND", Buffer.alloc(0)),
  ]) };
}

function data(value: unknown): unknown {
  return value && typeof value === "object" && "data" in value ? value.data : value;
}

async function decoded<S extends z.ZodTypeAny>(response: Response, schema: S, status = 201): Promise<z.output<S>> {
  const body: unknown = await response.json();
  await test.info().attach(new URL(response.url()).pathname, { body: JSON.stringify({ status: response.status(), body }, null, 2), contentType: "application/json" });
  expect(response.status(), JSON.stringify(body)).toBe(status);
  return schema.parse(data(body));
}

function mutation(page: Page, path: string, method = "POST") {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === method);
}

async function choose(scope: Page | Locator, label: string, name: string) {
  await scope.getByRole("combobox", { name: label, exact: true }).fill(name);
  await scope.getByRole("option").filter({ hasText: name }).click();
}

test("FOOD_DEV: nguyên liệu có nhóm, định lượng và giá vốn đủ, gói mở bán đúng giá cho khách", async ({ browser }, info) => {
  test.setTimeout(360_000);
  const recordVideo = process.env.E2E_RECORD === "1" ? { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top" as const, fontSize: 22 } } : undefined;
  const fooddev = await browser.newContext({ storageState: process.env.PORTAL_FOODDEV_STATE ?? `${homedir()}/work/ticket/.cache/e2e/state/fooddev.json`, recordVideo });
  const warehouse = await browser.newContext({ storageState: process.env.PORTAL_WAREHOUSE_STATE, recordVideo });
  const customer = await browser.newContext({ storageState: process.env.PORTAL_CUSTOMER_STATE, recordVideo });
  const page = await fooddev.newPage();
  const kho = await warehouse.newPage();
  const khach = await customer.newPage();
  for (const activePage of [page, kho, khach]) activePage.setDefaultTimeout(15000);
  const suffix = Date.now().toString();
  const ingredientName = `Me món bán ${suffix}`;
  const dishName = `Món me hành trình ${suffix}`;
  const packName = `Gia vị me ${suffix}`;
  const supplierName = `NCC món bán ${suffix}`;
  const agreementCode = `HD-MON-${suffix}`;
  const salePrice = 55000;
  const profile = {
    tax_code: `03${suffix.slice(-8)}`, address: { line: "45 Lê Lợi", ward: "Bến Thành", province: "TP. Hồ Chí Minh" },
    contact_name: "Lê Thị Rau", contact_phone: `09${suffix.slice(-8)}`, contact_email: `mon-${suffix}@example.vn`,
    note: "Rau me giao theo mùa, gọi trước 1 ngày.",
  };
  let material: z.infer<typeof materialSchema>;
  let draftID = "";
  let draftURL = "";
  let productID = "";
  let packID = "";
  let completeWrites = 0;
  async function shot(target: Page | Locator, name: string) {
    const body = "goto" in target ? await target.screenshot({ fullPage: true }) : await target.screenshot();
    await info.attach(name, { body, contentType: "image/png" });
  }
  page.on("request", request => {
    if (request.method() === "POST" && /\/api\/dishes\/drafts\/[^/]+\/complete$/.test(new URL(request.url()).pathname)) completeWrites++;
  });
  async function step(activePage: Page, title: string, body: () => Promise<void>) {
    await test.step(title, async () => {
      const overlay = await activePage.screencast.showOverlay(`<div style="position:absolute;bottom:8px;left:8px;right:8px;padding:12px;background:#222;color:white;font-size:22px">${title}</div>`);
      try { await body(); } finally { await overlay.dispose(); }
    });
  }
  async function draft() {
    const response = await fooddev.request.get(`${sales}/dish-drafts/${draftID}`);
    expect(response.status()).toBe(200);
    return z.object({ draft: draftSchema }).parse(data(await response.json())).draft;
  }
  async function save() {
    await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: /^Đã lưu/ })).toBeVisible();
  }
  try {
    await step(page, "Bước 1: Người soạn món tạo nguyên liệu mới và chọn đủ hai cấp nhóm", async () => {
      await page.goto("/production/food-plans?tab=dishes");
      const created = mutation(page, `${sales}/dish-drafts`);
      await page.getByRole("button", { name: "Tạo món", exact: true }).first().click();
      draftID = (await decoded(await created, z.object({ draft: draftSchema }))).draft.id;
      await page.waitForURL(url => url.searchParams.get("draft") === draftID);
      draftURL = page.url();
      await page.getByLabel("Tên món", { exact: true }).fill(dishName);
      await page.getByRole("combobox", { name: "Danh mục", exact: true }).click();
      await page.getByRole("option").first().click();
      await page.getByLabel("Hashtag", { exact: true }).fill(`me, hanh-trinh, mon-ban-${suffix}`);
      await page.getByRole("combobox", { name: "Khẩu phần", exact: true }).selectOption("2");
      await page.getByRole("button", { name: "Thêm dòng nguyên liệu", exact: true }).click();
      const picker = page.getByRole("region", { name: "Chọn nguyên liệu", exact: true });
      await picker.getByRole("combobox", { name: "Nguyên liệu", exact: true }).fill(ingredientName);
      await picker.getByRole("button", { name: `Tạo nguyên liệu “${ingredientName}”`, exact: true }).click();
      const form = picker.getByRole("form", { name: "Tạo nguyên liệu", exact: true });
      await pick(form, "Nhóm cấp 1", "Trái cây");
      await pick(form, "Nhóm cấp 2", "Trái cây tươi");
      await form.getByRole("combobox", { name: "Đơn vị", exact: true }).selectOption("KG");
      await form.getByRole("combobox", { name: /^Dị ứng/ }).selectOption("known");
      await form.getByRole("checkbox", { name: "SOYBEANS", exact: true }).check();
      await form.getByRole("checkbox", { name: "SPICY", exact: true }).check();
      await form.getByRole("combobox", { name: /^Chế độ ăn/ }).selectOption("VEGETARIAN");
      for (const month of [6, 7, 8]) await form.getByRole("checkbox", { name: `Tháng ${month}`, exact: true }).check();
      await shot(form, "form-nguyen-lieu");
      const rawCreated = mutation(page, "/api/sales/skus");
      await form.getByRole("button", { name: "Tạo nguyên liệu", exact: true }).click();
      const rawResponse = await rawCreated;
      expect(rawResponse.request().postDataJSON()).toMatchObject({ name: ingredientName, uom_code: "KG", allergens: ["SOYBEANS"], avoidance_flags: ["SPICY"], diet_flags: ["VEGETARIAN"], season_months: [6, 7, 8] });
      material = await decoded(rawResponse, materialSchema);
      expect(material.name).toBe(ingredientName);
      expect(material.material_group_code).toBeTruthy();
      expect(material.uom_code).toBe("KG");
      await page.getByRole("textbox", { name: "Lượng / suất dòng 1", exact: true }).fill("100");
      await page.getByLabel("Hao hụt % dòng 1", { exact: true }).fill("0");
      await expect(page.getByLabel("Hao hụt % dòng 1", { exact: true })).toHaveValue("0");
      await expect(page.getByRole("region", { name: "Nguyên liệu món", exact: true }).getByRole("row").filter({ hasText: ingredientName })).toContainText("Rau");
      await save();
    });

    await step(kho, "Bước 2: Kho lập và áp dụng bảng giá nguyên liệu mới 100.000 đồng mỗi kg", async () => {
      await kho.goto("/inventory/suppliers");
      await kho.getByRole("button", { name: "Thêm nhà cung cấp", exact: true }).click();
      const dialog = kho.getByRole("dialog");
      await dialog.getByLabel("Chọn ảnh", { exact: true }).setInputFiles(png(30));
      await dialog.getByLabel("Mã nhà cung cấp", { exact: true }).fill(`MON-${suffix}`);
      await dialog.getByLabel("Tên nhà cung cấp", { exact: true }).fill(supplierName);
      await dialog.getByLabel("Mã số thuế", { exact: true }).fill(profile.tax_code);
      await dialog.getByLabel("Số nhà, đường", { exact: true }).fill(profile.address.line);
      await dialog.getByLabel("Tỉnh, thành phố", { exact: true }).fill(profile.address.province);
      await dialog.getByLabel("Phường, xã", { exact: true }).fill(profile.address.ward);
      await dialog.getByLabel("Người liên hệ", { exact: true }).fill(profile.contact_name);
      await dialog.getByLabel("Điện thoại", { exact: true }).fill(profile.contact_phone);
      await dialog.getByLabel("Email", { exact: true }).fill(profile.contact_email);
      await dialog.getByRole("checkbox").nth(1).check();
      await expect(dialog.getByText("Đã chọn 1 nhóm con", { exact: true })).toBeVisible();
      await dialog.getByText("Ghi chú nội bộ", { exact: true }).first().click();
      await dialog.getByRole("textbox", { name: "Ghi chú nội bộ", exact: true }).fill(profile.note);
      await dialog.getByLabel("Chọn ảnh", { exact: true }).scrollIntoViewIfNeeded();
      await shot(dialog, "form-ncc-1-anh-ten-ma-thue");
      await dialog.getByLabel("Người liên hệ", { exact: true }).scrollIntoViewIfNeeded();
      await shot(dialog, "form-ncc-2-dia-chi-lien-he");
      await dialog.getByText("Đã chọn 1 nhóm con", { exact: true }).scrollIntoViewIfNeeded();
      await shot(dialog, "form-ncc-3-nhom");
      await dialog.getByRole("textbox", { name: "Ghi chú nội bộ", exact: true }).scrollIntoViewIfNeeded();
      await shot(dialog, "form-ncc-4-ghi-chu");
      const created = mutation(kho, "/api/inventory/suppliers");
      const photoDone = kho.waitForResponse(response => /\/photo\/finalize$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
      await dialog.getByRole("button", { name: "Lưu nhà cung cấp", exact: true }).click();
      const createdResponse = await created;
      expect(createdResponse.request().postDataJSON()).toMatchObject({ code: `MON-${suffix}`, name: supplierName, ...profile });
      const supplier = await decoded(createdResponse, supplierSchema);
      expect(supplier).toMatchObject({ tax_code: profile.tax_code, contact_name: profile.contact_name, contact_phone: profile.contact_phone, contact_email: profile.contact_email, note: profile.note, address: profile.address });
      expect((await photoDone).status(), "Ảnh nhà cung cấp phải lưu được").toBe(200);
      await kho.goto(`/inventory/suppliers/${supplier.id}?tab=agreements`);
      await kho.getByRole("button", { name: "Lập bảng giá mới", exact: true }).click();
      await kho.getByLabel("Mã bảng giá", { exact: true }).fill(agreementCode);
      const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
      const nextYear = Number(today.slice(0, 4)) + 1;
      await kho.getByLabel("Hiệu lực từ", { exact: true }).fill(today);
      await kho.getByLabel("Hiệu lực đến", { exact: true }).fill(`${nextYear}-12-31`);
      await choose(kho, "Nguyên liệu", ingredientName);
      await kho.getByLabel("Giá VND / đơn vị", { exact: true }).fill("100000");
      await kho.getByText("Hiệu lực riêng, thuế và giao hàng", { exact: true }).click();
      await kho.getByLabel("Dòng giá từ ngày", { exact: true }).fill(today);
      await kho.getByLabel("Dòng giá đến ngày", { exact: true }).fill(`${nextYear}-12-31`);
      await kho.getByLabel("Thuế", { exact: true }).selectOption("VAT_INCLUDED");
      await kho.getByLabel("Giao hàng", { exact: true }).selectOption("DELIVERED");
      await kho.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").setInputFiles(png(50));
      await kho.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").scrollIntoViewIfNeeded();
      await shot(kho, "form-bang-gia-chung-tu");
      await kho.getByLabel("Mã bảng giá", { exact: true }).scrollIntoViewIfNeeded();
      await shot(kho, "form-bang-gia");
      const saved = mutation(kho, `/api/inventory/suppliers/${supplier.id}/agreements`);
      await kho.getByRole("button", { name: "Lưu nháp", exact: true }).click();
      const agreement = await decoded(await saved, agreementSchema);
      const card = kho.getByRole("article").filter({ hasText: agreementCode });
      await card.getByRole("button", { name: "Mở bản nháp", exact: true }).click();
      const applied = mutation(kho, `/api/inventory/suppliers/${supplier.id}/agreements/${agreement.agreement_id}/versions`);
      await kho.getByRole("button", { name: "Áp dụng bảng giá", exact: true }).click();
      const active = await decoded(await applied, agreementSchema);
      expect(active.status).toBe("ACTIVE");
      expect(active.lines).toHaveLength(1);
      expect(active.lines[0]).toMatchObject({ sku_ref: material.id, uom: "KG", unit_price_vnd: 100000, valid_from: today, valid_to: `${nextYear}-12-31`, tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED" });
      expect(active.valid_from).toBe(today);
      expect(active.valid_to).toBe(`${nextYear}-12-31`);
      expect(active.document_ref ?? active.primary_document_ref, "Chứng từ hợp đồng phải gắn được vào bảng giá").toBeTruthy();
      await expect(card).toContainText("Đã áp dụng");
    });

    await step(page, "Bước 3: Tạo gói gia vị mới với công thức 10 g nguyên liệu cho một suất", async () => {
      await page.goto("/production/targets");
      await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
      const familyName = `Họ món me ${suffix}`;
      await page.getByLabel("Tên sản phẩm", { exact: true }).fill(familyName);
      const familyCreated = mutation(page, "/api/sales/products");
      await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
      await decoded(await familyCreated, z.object({ product: z.object({ id: z.string(), name: z.literal(familyName) }) }));
      await page.goto("/production/food-plans?tab=packages");
      const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
      await region.getByRole("button", { name: "Tạo gói", exact: true }).first().click();
      const form = region.getByRole("form", { name: "Biên tập gói", exact: true });
      await pick(form, "Họ món của gói", familyName);
      await form.getByLabel("Tên gói", { exact: true }).fill(packName);
      await form.getByLabel("Quy cách gói", { exact: true }).fill("Hũ nhỏ 10 g");
      await form.getByRole("combobox", { name: /^Chế độ nhiệt/ }).selectOption("AMBIENT");
      await form.getByLabel("Khối lượng gói (g)", { exact: true }).fill("10");
      await shot(form, "form-goi");
      const packCreated = mutation(page, `${sales}/packages`);
      await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
      const packResponse = await packCreated;
      expect(packResponse.request().postDataJSON()).toMatchObject({ name: packName, variant_label: "Hũ nhỏ 10 g", temperature_regime: "AMBIENT", net_weight_g: 10 });
      packID = (await decoded(packResponse, z.object({ id: z.string(), name: z.literal(packName), variant_label: z.literal("Hũ nhỏ 10 g"), temperature_regime: z.literal("AMBIENT"), net_weight_g: z.literal(10) }))).id;
      await region.getByRole("button", { name: "Tạo công thức", exact: true }).click();
      // Bộ chọn của công thức đứng trước bộ chọn khai báo nhãn nguyên liệu.
      await choose(region.getByRole("region", { name: "Chọn nguyên liệu", exact: true }).first(), "Nguyên liệu", ingredientName);
      const recipe = region.getByRole("form", { name: "Biên tập công thức", exact: true });
      await recipe.getByLabel("Định lượng 1", { exact: true }).fill("10");
      await recipe.getByRole("combobox", { name: /^Đơn vị 1\b/ }).selectOption("G");
      await recipe.getByLabel("Yield % 1", { exact: true }).fill("100");
      await recipe.getByRole("button", { name: "Thêm bước chế biến", exact: true }).click();
      await recipe.getByLabel("Hướng dẫn 1", { exact: true }).fill("Rắc đều gói me lên món trước khi dọn.");
      await recipe.getByLabel("Thời gian (giây) 1", { exact: true }).fill("30");
      await shot(recipe, "form-cong-thuc");
      const recipeCreated = mutation(page, `/api/food-packs/production/packages/${packID}/recipes`);
      await recipe.getByRole("button", { name: "Lưu công thức", exact: true }).click();
      const stored = await decoded(await recipeCreated, z.object({ status: z.string(), components: z.array(z.object({ sku_ref: z.string(), quantity: z.string(), uom: z.string(), yield_pct: z.string() })), prep_steps: z.array(z.object({ instruction: z.string(), duration_seconds: z.number() })) }));
      expect(stored.status).toBe("BOM_ACTIVE");
      expect(stored.prep_steps, "Bước chế biến phải lưu được").toEqual([{ instruction: "Rắc đều gói me lên món trước khi dọn.", duration_seconds: 30 }]);
      expect(stored.components).toEqual([{ sku_ref: material.id, quantity: "10", uom: "G", yield_pct: "100" }]);
      await page.goto(draftURL);
      await page.getByRole("button", { name: "Thêm gia vị", exact: true }).click();
      await pick(page, "Gói gia vị 1", packName);
      await expect(page.getByRole("checkbox", { name: "Cho bỏ gói 1", exact: true })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Hoàn tất món", exact: true })).toBeEnabled();
      await save();
    });

    await step(page, "Bước 4: Nguyên liệu chưa phân nhóm chặn hoàn tất, nháp vẫn được giữ", async () => {
      await page.getByRole("button", { name: "Chọn / thay nguyên liệu dòng 1", exact: true }).click();
      const picker = page.getByRole("region", { name: "Chọn nguyên liệu", exact: true });
      await pick(picker, "Nhóm cấp 1", "Chưa phân nhóm");
      await picker.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
      await picker.getByRole("combobox", { name: "Nguyên liệu", exact: true }).click();
      await picker.getByRole("option").filter({ hasText: "Chưa phân nhóm" }).first().click();
      await expect(page.getByRole("cell", { name: "Chưa có nhóm", exact: true })).toBeVisible();
      await expect(page.getByText(/^Còn thiếu:/)).toHaveText("Còn thiếu: Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất; Món cần 2–6 ngăn đóng gói");
      await expect(page.getByRole("button", { name: "Hoàn tất món", exact: true })).toBeDisabled();
      await save();
      const blocked = await draft();
      expect(blocked.status).toBe("OPEN");
      expect(blocked.progress).toEqual({});
      expect(completeWrites).toBe(0);
      await page.reload();
      await expect(page.getByRole("button", { name: "Hoàn tất món", exact: true })).toBeDisabled();
      await page.getByRole("button", { name: "Chọn / thay nguyên liệu dòng 1", exact: true }).click();
      await choose(page.getByRole("region", { name: "Chọn nguyên liệu", exact: true }), "Nguyên liệu", ingredientName);
      await expect(page.getByRole("button", { name: "Hoàn tất món", exact: true })).toBeEnabled();
      await save();
    });

    await step(kho, "Bước 5: Kho mở cùng nháp nhưng không sửa hay hoàn tất được món", async () => {
      const before = await draft();
      await kho.goto(draftURL);
      await expect(kho.getByLabel("Tên món", { exact: true })).toHaveValue(dishName);
      await expect(kho.getByLabel("Tên món", { exact: true })).toBeDisabled();
      await expect(kho.getByRole("textbox", { name: "Lượng / suất dòng 1", exact: true })).toBeDisabled();
      await expect(kho.getByRole("button", { name: "Lưu nháp", exact: true })).toBeDisabled();
      await expect(kho.getByRole("button", { name: /^(Hoàn tất món|Đang hoàn tất…)$/ })).toBeDisabled();
      expect(await draft()).toEqual(before);
    });

    await step(page, "Bước 6: Hai suất gồm 200 g món và 20 g gia vị có giá vốn đủ 22.000 đồng", async () => {
      const saved = (await draft()).content;
      expect(saved).toMatchObject({ name: dishName, servings: 2 });
      expect(saved.category_ref, "Danh mục món phải lưu được").toBeTruthy();
      expect(saved.tags).toEqual(["me", "hanh-trinh", `mon-ban-${suffix}`]);
      expect(saved.ingredients).toMatchObject([{ sku_ref: material.id, quantity: "100", yield_pct: "100" }]);
      expect(saved.seasonings).toMatchObject([{ package_ref: packID }]);
      await expect(page.getByLabel("Hao hụt % dòng 1", { exact: true }), "Hao hụt đã nhập phải hiện lại sau khi lưu và tải lại").toHaveValue("0");
      await shot(page, "form-mon-truoc-hoan-tat");
      const preview = page.waitForResponse(response => new URL(response.url()).pathname === "/api/food-packs/production/recipes/cost-preview" && response.request().method() === "POST" && response.request().postDataJSON().packages.length === 1);
      await page.reload();
      const cost = await decoded(await preview, costSchema, 200);
      await expect(page.getByText("Tổng / suất: 100 g. Tổng / kit: 200 g.", { exact: true })).toBeVisible();
      expect(cost.lines).toHaveLength(2);
      expect(cost.lines.map(line => ({ sku: line.sku_ref, quantity: Number(line.quantity), uom: line.uom }))).toEqual([{ sku: material.id, quantity: 0.2, uom: "KG" }, { sku: material.id, quantity: 0.02, uom: "KG" }]);
      expect(cost.complete, "Bảng giá ACTIVE 100.000 VND/KG phải cung cấp đủ giá cho nguyên liệu mới").toBe(true);
      expect(cost.lines.map(line => line.missing)).toEqual([null, null]);
      expect(cost.lines.map(line => line.cost_vnd)).toEqual([20000, 2000]);
      expect(cost.total_vnd).toBe(22000);
      expect(cost.per_serving_vnd).toBe(11000);
      await expect(page.getByText("Tổng / kit: 22.000 ₫", { exact: true })).toBeVisible();
      await expect(page.getByText("Tổng / suất: 11.000 ₫", { exact: true })).toBeVisible();
    });

    await step(page, "Bước 7: Hoàn tất món tạo gói rau đúng 100 g mỗi suất và bộ món hai người", async () => {
      const completed = mutation(page, `/api/dishes/drafts/${draftID}/complete`);
      await page.getByRole("button", { name: "Hoàn tất món", exact: true }).click();
      const result = await decoded(await completed, z.object({ ok: z.literal(true), product_ref: z.string(), set_ref: z.string() }), 200);
      productID = result.product_ref;
      await page.waitForURL(url => url.searchParams.get("mon") === productID && !url.searchParams.has("draft"));
      const response = await fooddev.request.get(`/api/dishes/${productID}`);
      expect(response.status()).toBe(200);
      const dish = detailSchema.parse(data(await response.json()));
      expect(dish.product.name).toBe(dishName);
      expect(dish.variants).toHaveLength(1);
      expect(dish.variants[0]).toMatchObject({ set_ref: result.set_ref, journey: "DONE", servings: 2 });
      expect(dish.variants[0].packs).toHaveLength(1);
      expect(dish.variants[0].packs[0]).toMatchObject({ slot: "RAU", lines: [{ sku_ref: material.id, quantity: "100", uom: "G", yield_pct: "100" }] });
      expect((await draft()).status).toBe("COMPLETED");
    });

    await step(page, "Bước 8: Mở bán món vừa hoàn tất với giá 55.000 đồng", async () => {
      // Hành trình hiện chưa có UI nối DONE với định giá/kích hoạt (hanh-trinh.md 5.9–5.12).
      // Giữ yêu cầu này đỏ nếu không có thao tác mở bán; không ghi API để vượt màn.
      await expect(page.getByRole("button", { name: "Mở bán", exact: true }), "Món DONE cần thao tác mở bán qua UI").toBeVisible();
      await page.getByRole("button", { name: "Mở bán", exact: true }).click();
      await page.getByLabel("Giá bán đề xuất (VND)", { exact: true }).fill(String(salePrice));
      await page.getByRole("button", { name: "Xác nhận mở bán", exact: true }).click();
      await expect(page.getByRole("tab", { name: "2 người · Đang bán", exact: true })).toBeVisible();
      const response = await fooddev.request.get(`/api/dishes/${productID}`);
      expect(response.status()).toBe(200);
      expect(detailSchema.parse(data(await response.json())).variants[0].journey).toBe("SELLING");
    });

    await step(khach, "Bước 9: Khách đã đăng nhập thấy đúng món mới với giá 55.000 đồng", async () => {
      const session = await customer.request.get("/api/auth/context");
      expect(session.status(), "Phiên khách phải còn đăng nhập khi xem món mới").toBe(200);
      await khach.goto(`/products/${productID}`);
      await expect(khach.getByRole("heading", { name: dishName, exact: true })).toBeVisible();
      await expect(khach.getByText("55.000 ₫", { exact: true })).toBeVisible();
    });
  } finally {
    for (const [role, activePage, context] of [["fooddev", page, fooddev], ["warehouse", kho, warehouse], ["customer", khach, customer]] as const) {
      if (activePage.url() !== "about:blank") await activePage.screenshot({ path: info.outputPath(`mon-ban-${role}-cuoi.png`), fullPage: true }).catch(() => {});
      const video = activePage.video();
      await context.close();
      if (video) await info.attach(`video-${role}`, { path: await video.path(), contentType: "video/webm" });
    }
  }
});
