import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from "@playwright/test";
import { z } from "zod";
import { decodePlatform } from "../../lib/api/platform-contract";
import messages from "../../messages/vi.json" with { type: "json" };

const identity = z.object({ id: z.string().uuid(), status: z.string() });
const familySchema = z.object({ product: identity.extend({ name: z.string() }) });
const rawSchema = z.object({ id: z.string().uuid(), name: z.string(), sku_code: z.string(), uom_code: z.string(), selectable: z.boolean() });
const materialPage = z.object({ items: z.array(rawSchema) });
const metadata = z.object({ product_ref: z.string().uuid(), code: z.string(), name: z.string(), variant_label: z.string(), net_weight_g: z.number(), uom_code: z.literal("EA"), temperature_regime: z.string() });
const packageSchema = metadata.extend({ id: z.string().uuid(), updated_at: z.string(), status: z.string() });
const optionSchema = z.object({ sku_ref: z.string().uuid(), quantity: z.number().int().positive(), is_default: z.boolean() }).strict();
const slotSchema = z.object({ slot: z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]), swappable: z.boolean(), removable: z.boolean(), options: z.array(optionSchema) }).strict();
const setSchema = packageSchema.extend({ tags: z.array(z.string()), slots: z.array(slotSchema) });
const componentSchema = z.object({ sku_ref: z.string().uuid(), name: z.string().nullable(), quantity: z.string(), uom: z.string(), yield_pct: z.string() }).strict();
const stepSchema = z.object({ instruction: z.string(), duration_seconds: z.number().int().nonnegative() }).strict();
const recipeSchema = z.object({ id: z.string().uuid(), output_sku_ref: z.string().uuid(), version: z.number().int().positive(), bom_code: z.string(), components: z.array(componentSchema), prep_steps: z.array(stepSchema) });
const labelsSchema = z.object({ allergen_summary: z.object({ known: z.boolean(), contains: z.array(z.string()) }), avoidance_flags: z.array(z.string()), diet_flags: z.array(z.string()).nullable(), updated_at: z.string() });
const evaluationSchema = z.object({ diet_flags: z.array(z.string()), derived_hashtags: z.array(z.string()), unknown: z.array(z.object({ sku_ref: z.string(), fields: z.array(z.string()) })) });
const pinSchema = z.object({ sku_ref: z.string().uuid(), bom_ref: z.string().uuid(), version: z.number().int().positive() }).strict();
const snapshotSchema = z.object({
  schema_version: z.literal(1), set_ref: z.string().uuid(), set_updated_at: z.string(),
  slot_ratios: z.array(z.object({ slot: z.string(), options: z.array(z.object({ sku_ref: z.string().uuid().nullable(), ratio: z.string() }).strict()) }).strict()),
  slots_snapshot: z.array(slotSchema), recipe_versions: z.array(pinSchema),
}).strict();
const planSchema = z.object({ id: z.string().uuid(), revision: z.number().int().positive(), planned_quantity: z.union([z.number(), z.string()]).transform(String), servings_per_set: z.number(), pack_plan: snapshotSchema });
const requirementSchema = z.object({
  all_lines: z.array(z.object({ sku_ref: z.string().uuid(), name: z.string(), quantity: z.string(), uom: z.string() })),
  total: z.number(), hidden_count: z.number(), plan_revisions: z.record(z.number()),
});
type Family = z.infer<typeof familySchema>["product"];
type Raw = z.infer<typeof rawSchema>;
type FoodSet = z.infer<typeof setSchema>;
type Pack = { value: z.infer<typeof packageSchema>; recipe: z.infer<typeof recipeSchema> };
type Role = "FOOD_DEV" | "WAREHOUSE";
const fixtures = [
  { key: "bun", code: "FH-547898", label: "Bún tươi", quantity: "0.200", yield: "100", vegan: true },
  { key: "dau", code: "FH-746610", label: "Đạm đậu", quantity: "0.150", yield: "100", vegan: true },
  { key: "rau", code: "FH-758248", label: "Rau xanh", quantity: "0.050", yield: "100", vegan: true },
  { key: "bo", code: "FH-643268", label: "Cốt bò", quantity: "0.100", yield: "80", vegan: false },
  { key: "nam", code: "FH-548262", label: "Cốt nấm", quantity: "0.100", yield: "100", vegan: true },
] satisfies Array<{ key: string; code: string; label: string; quantity: string; yield: string; vegan: boolean }>;
type Fixture = (typeof fixtures)[number];

function qaAccounts() {
  const file = (process.env.QA_ROLE_ENV ?? `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  let text: string;
  try { text = readFileSync(file, "utf8"); } catch { throw new Error("Cần QA_ROLE_ENV và stack QA thật."); }
  const values: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  for (const role of ["FOOD_DEV", "WAREHOUSE"] satisfies Role[]) {
    for (const field of ["EMAIL", "PASSWORD"]) {
      const key = `ROLE_${role}_${field}`;
      if (process.env[key]) values[key] = process.env[key];
      if (!values[key]) throw new Error(`Thiếu tài khoản QA ${role}.`);
    }
  }
  return values;
}
async function login(page: Page, accounts: Record<string, string>, role: Role) {
  await page.goto("/staff/login");
  await page.getByLabel(messages.employeeAuth.identifier, { exact: true }).fill(accounts[`ROLE_${role}_EMAIL`]);
  await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(accounts[`ROLE_${role}_PASSWORD`])
    .catch(() => { throw new Error("Không nhập được mật khẩu QA."); });
  const response = changed(page, "/api/auth/staff/login", "POST");
  await page.getByRole("button", { name: messages.employeeAuth.login, exact: true }).click();
  expect((await response).status(), `Đăng nhập ${role}`).toBe(200);
  await page.waitForURL(/\/(console|platform(?:\/role-matrix)?)$/);
}
function changed(page: Page, path: string, method: string) {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === method);
}
async function decoded<T>(response: Response, schema: { parse(value: unknown): T }, status: number): Promise<T> {
  expect(response.status(), "HTTP response").toBe(status);
  return decodePlatform(await response.json(), schema);
}
async function read<T>(request: APIRequestContext, path: string, schema: { parse(value: unknown): T }): Promise<T> {
  const response = await request.get(path);
  expect(response.status(), `GET ${path}`).toBe(200);
  return decodePlatform(await response.json(), schema);
}
async function pick(scope: Locator, label: string, name: string) {
  const combobox = scope.getByRole("combobox", { name: label, exact: true });
  if (await combobox.inputValue() === name) {
    await expect(combobox).toHaveValue(name);
    return;
  }
  await combobox.fill(name.split(/\s+/).slice(0, 2).join(" "));
  await scope.getByRole("option", { name, exact: true }).click();
}
async function chooseRaw(page: Page, picker: Locator, raw: Raw) {
  await picker.getByLabel("Tìm nguyên liệu", { exact: true }).fill(raw.name);
  const loaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && new URL(r.url()).searchParams.get("q") === raw.name && r.request().method() === "GET");
  await picker.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
  expect((await loaded).status()).toBe(200);
  await picker.getByRole("button", { name: `Chọn ${raw.name}`, exact: true }).click();
}
async function createFamilyAndTarget(page: Page, tag: string) {
  await page.goto("/production/targets");
  await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
  await page.getByLabel("Tên sản phẩm", { exact: true }).fill(`Bún Huế ${tag}`);
  await page.getByLabel("Slug sản phẩm", { exact: true }).fill(`e1-bun-${tag.toLowerCase()}`);
  const productResponse = changed(page, "/api/sales/products", "POST");
  await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
  const family = (await decoded(await productResponse, familySchema, 201)).product;
  await expect(page.getByRole("combobox", { name: "Sản phẩm", exact: true })).toHaveValue(family.name);
  await page.getByLabel("Tiêu đề", { exact: true }).fill(`Kế hoạch Bún Huế ${tag}`);
  await page.getByLabel("Tổng suất chỉ tiêu", { exact: true }).fill("100");
  const targetResponse = changed(page, "/api/production/targets", "POST");
  await page.getByRole("button", { name: "Lưu chỉ tiêu", exact: true }).click();
  const target = await decoded(await targetResponse, identity, 201);
  expect(target.status).toBe("APPROVED");
  await page.goto(`/production/food-plans?target_id=${target.id}`);
  return { family, target };
}
async function declareLabels(page: Page, raw: Raw, plant: boolean) {
  const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
  const card = region.getByRole("heading", { name: "Khai báo nhãn nguyên liệu", exact: true }).locator("..");
  await chooseRaw(page, card.getByRole("region", { name: "Chọn nguyên liệu", exact: true }), raw);
  const form = card.getByRole("form", { name: "Nhãn nguyên liệu", exact: true });
  await expect(form.getByRole("heading", { name: raw.name, exact: true })).toBeVisible();
  await form.getByLabel("Đã khai báo dị ứng", { exact: true }).check();
  await form.getByRole("combobox", { name: "Chế độ ăn nguyên liệu", exact: true }).selectOption(plant ? "VEGETARIAN" : "none");
  const saved = changed(page, `/api/food-packs/sales/skus/${raw.id}/labels`, "PATCH");
  await form.getByRole("button", { name: "Lưu nhãn nguyên liệu", exact: true }).click();
  const labels = await decoded(await saved, labelsSchema, 200);
  expect(labels.allergen_summary.known).toBe(true);
  expect(labels.diet_flags).toEqual(plant ? ["VEGETARIAN"] : []);
  return labels;
}
async function createPack(page: Page, family: Family, raw: Raw, fixture: Fixture, tag: string): Promise<Pack> {
  const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
  await region.getByRole("button", { name: "Tạo gói", exact: true }).first().click();
  const form = region.getByRole("form", { name: "Biên tập gói", exact: true });
  await pick(form, "Họ món của gói", family.name);
  await form.getByLabel("Mã gói", { exact: true }).fill(`E1-${tag}-${fixture.key}`);
  await form.getByLabel("Tên gói", { exact: true }).fill(`${fixture.label} ${tag}`);
  const saved = changed(page, "/api/food-packs/sales/packages", "POST");
  await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
  const value = await decoded(await saved, packageSchema, 201);
  await region.getByRole("button", { name: "Tạo công thức", exact: true }).click();
  const recipeForm = region.getByRole("form", { name: "Biên tập công thức", exact: true });
  await chooseRaw(page, recipeForm.locator("..").getByRole("region", { name: "Chọn nguyên liệu", exact: true }), raw);
  await recipeForm.getByLabel("Định lượng 1", { exact: true }).fill(fixture.quantity);
  await recipeForm.getByRole("combobox", { name: "Đơn vị 1", exact: true }).selectOption("KG");
  await recipeForm.getByLabel("Yield % 1", { exact: true }).fill(fixture.yield);
  await recipeForm.getByRole("button", { name: "Thêm bước chế biến", exact: true }).click();
  await recipeForm.getByLabel("Hướng dẫn 1", { exact: true }).fill(`Sơ chế ${fixture.label.toLowerCase()} ${tag}`);
  const recipeResponse = changed(page, `/api/food-packs/production/packages/${value.id}/recipes`, "POST");
  await recipeForm.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  const recipe = await decoded(await recipeResponse, recipeSchema, 201);
  expect(recipe.version).toBe(1);
  expect(recipe.bom_code).toBe(`${value.code}-v1`);
  expect(recipe.components).toEqual([{ sku_ref: raw.id, name: raw.name, quantity: fixture.quantity, uom: "KG", yield_pct: fixture.yield }]);
  await expect(region.getByText(recipe.bom_code, { exact: false })).toBeVisible();
  return { value, recipe };
}
async function createSet(page: Page, family: Family, packs: Record<string, Pack>, tag: string, vegetarian: boolean) {
  const region = page.getByRole("region", { name: "Set", exact: true });
  await region.getByRole("button", { name: "Tạo set món", exact: true }).first().click();
  const form = region.getByRole("form", { name: "Biên tập set món", exact: true });
  await pick(form, "Họ món", family.name);
  await form.getByLabel("Mã set", { exact: true }).fill(`E1-${tag}-set-${vegetarian ? "chay" : "bo"}`);
  await form.getByLabel("Tên set", { exact: true }).fill(`Bún ${vegetarian ? "chay" : "bò"} Huế ${tag}`);
  await form.getByLabel("Hashtag tay", { exact: true }).fill(`qa-pack, ui-e1, run-${tag.toLowerCase()}`);
  const draftResponse = changed(page, "/api/food-packs/sales/sets", "POST");
  await form.getByRole("button", { name: "Lưu set món", exact: true }).click();
  const draft = await decoded(await draftResponse, setSchema, 201);
  await region.getByRole("button", { name: "Sửa set món", exact: true }).click();
  for (const slot of [
    { id: "TINH_BOT", label: "Tinh bột", keys: ["bun"] }, { id: "DAM", label: "Đạm", keys: ["dau"] },
    { id: "RAU", label: "Rau", keys: ["rau"] }, { id: "COT", label: "Cốt", keys: vegetarian ? ["nam", "bo"] : ["bo", "nam"] },
  ]) {
    await form.getByRole("combobox", { name: "Thêm ô", exact: true }).selectOption(slot.id);
    const group = form.getByRole("group", { name: slot.label, exact: true });
    if (slot.id === "COT") await group.getByLabel("Cho đổi gói", { exact: true }).check();
    for (const key of slot.keys) await pick(group, "Thêm gói theo tên", packs[key].value.name);
  }
  const saved = changed(page, `/api/food-packs/sales/sets/${draft.id}`, "PUT");
  await form.getByRole("button", { name: "Lưu set món", exact: true }).click();
  const result = await decoded(await saved, setSchema, 200);
  expect(result.slots).toHaveLength(4);
  expect(result.status).toBe("ACTIVE");
  return result;
}
async function openSet(page: Page, set: FoodSet) {
  const region = page.getByRole("region", { name: "Set", exact: true });
  await region.getByLabel("Tìm set theo tên", { exact: true }).fill(set.name);
  const loaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/food-packs/sales/sets" && new URL(r.url()).searchParams.get("q") === set.name);
  await region.getByRole("button", { name: "Tìm set", exact: true }).click();
  expect((await loaded).status()).toBe(200);
  const evaluated = changed(page, `/api/food-packs/production/sets/${set.id}/evaluate`, "POST");
  await region.getByRole("button", { name: `Xem ${set.name}`, exact: true }).click();
  return decoded(await evaluated, evaluationSchema, 200);
}
async function createPlan(page: Page, targetId: string, family: Family, set: FoodSet, packs: Record<string, Pack>, tag: string) {
  await page.getByRole("tab", { name: "Thực đơn", exact: true }).click();
  const panel = page.getByRole("tabpanel", { name: "Thực đơn", exact: true });
  await panel.getByRole("button", { name: "Tạo set", exact: true }).first().click();
  const form = panel.getByRole("form", { name: "Tạo set", exact: true });
  await pick(form, "Sản phẩm thuộc chỉ tiêu", family.name);
  await form.getByLabel("Mã set", { exact: true }).fill(`E1-PLAN-${tag}`);
  await form.getByLabel("Khẩu phần", { exact: true }).fill(`100 suất ${tag}`);
  await form.getByLabel("Số kit", { exact: true }).fill("25");
  await form.getByLabel("Số suất mỗi kit", { exact: true }).fill("4");
  await form.getByRole("combobox", { name: "Nguồn định mức", exact: true }).selectOption("pack");
  await form.getByLabel("Tìm set món", { exact: true }).fill(set.name);
  const loaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/food-packs/sales/sets" && new URL(r.url()).searchParams.get("q") === set.name);
  await form.getByRole("button", { name: "Tìm set", exact: true }).click();
  expect((await loaded).status()).toBe(200);
  await pick(form, "Set món trong họ món", set.name);
  await form.getByLabel(`Tỉ lệ Cốt ${packs.bo.value.name}`, { exact: true }).fill("80");
  await form.getByLabel(`Tỉ lệ Cốt ${packs.nam.value.name}`, { exact: true }).fill("20");
  await expect(form.getByText("Tổng suất: 100 EA. Tối đa 1.000.000 suất.", { exact: true })).toBeVisible();
  const saved = changed(page, `/api/production/targets/${targetId}/food-plans`, "POST");
  await form.getByRole("button", { name: "Lưu set", exact: true }).click();
  const result = await decoded(await saved, planSchema, 201);
  expect(result.planned_quantity).toBe("100.000");
  expect(result.pack_plan.set_updated_at).toBe(set.updated_at);
  expect(result.pack_plan.recipe_versions).toHaveLength(5);
  expect(result.pack_plan.slot_ratios.find(slot => slot.slot === "COT")?.options).toEqual([
    { sku_ref: packs.bo.value.id, ratio: "0.800000" }, { sku_ref: packs.nam.value.id, ratio: "0.200000" },
  ]);
  return result;
}
async function warehouseDenials(request: APIRequestContext, data: {
  family: Family; set: FoodSet; pack: Pack; raw: Raw; labels: z.infer<typeof labelsSchema>;
  plan: z.infer<typeof planSchema>; targetId: string; tag: string;
}) {
  const { family, set, pack, raw, labels, plan, targetId, tag } = data;
  const packInput = metadata.parse(pack.value);
  const recipeInput = { components: pack.recipe.components.map(({ sku_ref, quantity, uom, yield_pct }) => ({ sku_ref, quantity, uom, yield_pct })), prep_steps: pack.recipe.prep_steps };
  const snapshot = plan.pack_plan;
  const planInput = { product_ref: family.id, planned_quantity: "100", servings_per_set: 4, pack_plan: { schema_version: snapshot.schema_version, set_ref: snapshot.set_ref, set_updated_at: snapshot.set_updated_at, slot_ratios: snapshot.slot_ratios } };
  const requests = [
    ["POST", "/api/food-packs/sales/sets", { ...metadata.parse(set), code: `DENY-SET-${tag}`, tags: set.tags }],
    ["PUT", `/api/food-packs/sales/sets/${set.id}`, { tags: set.tags, slots: set.slots, expected_updated_at: set.updated_at }],
    ["POST", "/api/food-packs/sales/packages", { ...packInput, code: `DENY-PACK-${tag}` }],
    ["PUT", `/api/food-packs/sales/packages/${pack.value.id}`, { ...packInput, expected_updated_at: pack.value.updated_at }],
    ["POST", `/api/food-packs/production/packages/${pack.value.id}/recipes`, recipeInput],
    ["PUT", `/api/food-packs/production/packages/${pack.value.id}/recipes/${pack.recipe.version}`, { ...recipeInput, expected_version: pack.recipe.version }],
    ["PATCH", `/api/food-packs/sales/skus/${raw.id}/labels`, { allergen_summary: labels.allergen_summary, avoidance_flags: labels.avoidance_flags, diet_flags: labels.diet_flags, expected_updated_at: labels.updated_at }],
    ["POST", `/api/production/targets/${targetId}/food-plans`, { ...planInput, variant_sku_code: `DENY-PLAN-${tag}`, serving_size: "100 suất" }],
    ["PUT", `/api/production/food-plans/${plan.id}`, { ...planInput, expected_revision: plan.revision }],
  ] satisfies Array<[string, string, unknown]>;
  for (const [method, path, body] of requests) {
    const response = await request.fetch(path, { method, data: body });
    expect(response.status(), `${method} ${path} bằng cookie WAREHOUSE`).toBe(403);
  }
}

test.use({ trace: "off", screenshot: "off", video: "off" });
test.describe("FOODDEV-PACK E1 QA thật", () => {
  test.describe.configure({ mode: "serial", timeout: 420_000 });
  test("FOOD_DEV soạn gói/set, đổi nhãn, pin 100 suất 80/20; WAREHOUSE đọc oracle và write403", async ({ page, browser, baseURL }) => {
    const accounts = qaAccounts(), tag = randomInt(36 ** 4).toString(36).padStart(4, "0").toUpperCase();
    const warehouse = await browser.newContext({ baseURL });
    try {
      const warehousePage = await warehouse.newPage();
      await login(page, accounts, "FOOD_DEV");
      await login(warehousePage, accounts, "WAREHOUSE");
      const { family, target } = await createFamilyAndTarget(page, tag);
      await page.getByRole("tab", { name: "Gói + công thức", exact: true }).click();
      const raws: Record<string, Raw> = {}, packs: Record<string, Pack> = {};
      const declared: Record<string, z.infer<typeof labelsSchema>> = {};
      for (const fixture of fixtures) {
        const catalog = await read(page.request, `/api/sales/skus?kind=RAW_MATERIAL&q=${fixture.code}`, materialPage);
        const raw = catalog.items.find(item => item.sku_code === fixture.code);
        if (!raw || !raw.selectable || raw.uom_code !== "KG") throw new Error(`Thiếu raw KG QA ${fixture.code}; chạy seed thật trước E1.`);
        raws[fixture.key] = raw;
        declared[fixture.key] = await declareLabels(page, raw, fixture.vegan);
      }
      for (const fixture of fixtures) packs[fixture.key] = await createPack(page, family, raws[fixture.key], fixture, tag);
      await page.getByRole("tab", { name: "Set", exact: true }).click();
      const beef = await createSet(page, family, packs, tag, false);
      const vegetarian = await createSet(page, family, packs, tag, true);
      expect(vegetarian.slots.flatMap(slot => slot.options.map(option => option.sku_ref)).sort())
        .toEqual(beef.slots.flatMap(slot => slot.options.map(option => option.sku_ref)).sort());
      const initial = await openSet(page, beef);
      expect(initial.diet_flags).toEqual([]);
      expect(initial.unknown).toEqual([]);
      const sets = page.getByRole("region", { name: "Set", exact: true });
      await expect(sets.getByText("Chay", { exact: true })).toHaveCount(0);
      const swappedResponse = changed(page, `/api/food-packs/production/sets/${beef.id}/evaluate`, "POST");
      await sets.getByRole("combobox", { name: "Cốt", exact: true }).selectOption(packs.nam.value.id);
      const swapped = await decoded(await swappedResponse, evaluationSchema, 200);
      expect(swapped.diet_flags).toEqual(["VEGETARIAN"]);
      expect(swapped.derived_hashtags).toEqual(["vegetarian"]);
      await expect(sets.getByText("Chay", { exact: true })).toBeVisible();
      await expect(sets.getByText("vegetarian", { exact: true })).toBeVisible();
      expect((await openSet(page, vegetarian)).diet_flags).toEqual(["VEGETARIAN"]);
      const saved = await createPlan(page, target.id, family, beef, packs, tag);
      await page.reload();
      await page.getByRole("tab", { name: "Thực đơn", exact: true }).click();
      const panel = page.getByRole("tabpanel", { name: "Thực đơn", exact: true });
      const row = panel.getByRole("row").filter({ hasText: `E1-PLAN-${tag}` });
      await expect(row.getByRole("cell", { name: "100.000 EA", exact: true })).toBeVisible();
      await expect(row.getByRole("cell", { name: "1", exact: true })).toBeVisible();
      const planPath = `/api/production/food-plans/${saved.id}`;
      expect(await read(page.request, planPath, planSchema)).toEqual(saved);
      await warehousePage.goto(`/production/material-requirements?target_id=${target.id}`);
      await expect(warehousePage.getByRole("heading", { name: "Nhu cầu nguyên liệu", exact: true })).toBeVisible();
      const oracle = { bun: "20.000", dau: "15.000", rau: "5.000", bo: "10.000", nam: "2.000" };
      for (const [key, quantity] of Object.entries(oracle)) {
        const line = warehousePage.getByRole("row").filter({ has: warehousePage.getByText(raws[key].name, { exact: true }) });
        await expect(line.getByRole("cell", { name: `${quantity} KG`, exact: true })).toBeVisible();
      }
      const requirementsPath = `/api/production/targets/${target.id}/material-requirements`;
      const before = await read(warehouse.request, requirementsPath, requirementSchema);
      expect(before.total).toBe(5);
      expect(before.plan_revisions[saved.id]).toBe(1);
      for (const [key, quantity] of Object.entries(oracle)) expect(before.all_lines.find(line => line.sku_ref === raws[key].id)?.quantity).toBe(quantity);
      await warehouseDenials(warehouse.request, { family, set: beef, pack: packs.bun, raw: raws.bun, labels: declared.bun, plan: saved, targetId: target.id, tag });
      expect(await read(page.request, planPath, planSchema)).toEqual(saved);
      expect((await read(warehouse.request, requirementsPath, requirementSchema)).all_lines).toEqual(before.all_lines);
      expect(await read(page.request, `/api/food-packs/sales/sets/${beef.id}`, setSchema)).toEqual(beef);
      expect(await read(page.request, `/api/food-packs/sales/packages/${packs.bun.value.id}`, packageSchema)).toEqual(packs.bun.value);
      expect(await read(page.request, `/api/food-packs/production/packages/${packs.bun.value.id}/recipes/1`, recipeSchema)).toEqual(packs.bun.recipe);
      expect(await read(page.request, `/api/food-packs/sales/skus/${raws.bun.id}/labels`, labelsSchema)).toEqual(declared.bun);
      // Exercise the actual re-open UI after persistence and warehouse checks.
      await row.getByRole("button", { name: "Sửa set", exact: true }).click();
      const edit = panel.getByRole("form", { name: "Sửa set", exact: true });
      await expect(edit.getByLabel("Số kit", { exact: true })).toHaveValue("25");
      await expect(edit.getByLabel("Số suất mỗi kit", { exact: true })).toHaveValue("4");
      await expect(edit.getByLabel(`Tỉ lệ Cốt ${packs.bo.value.name}`, { exact: true })).toHaveValue("80.0000");
      await expect(edit.getByLabel(`Tỉ lệ Cốt ${packs.nam.value.name}`, { exact: true })).toHaveValue("20.0000");
    } finally {
      await warehouse.close();
    }
  });
});
