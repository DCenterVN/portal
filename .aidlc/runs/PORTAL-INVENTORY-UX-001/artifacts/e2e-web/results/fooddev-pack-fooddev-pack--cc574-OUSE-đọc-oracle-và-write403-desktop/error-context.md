# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fooddev-pack/fooddev-pack.spec.ts >> FOODDEV-PACK E1 QA thật >> FOOD_DEV soạn gói/set, đổi nhãn, pin 100 suất 80/20; WAREHOUSE đọc oracle và write403
- Location: e2e/fooddev-pack/fooddev-pack.spec.ts:261:3

# Error details

```
Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
Response body is not available for a response that was navigated away from. Read response.body() before triggering any navigation.
```

# Page snapshot

```yaml
- generic [active] [ref=f3e1]:
  - generic [ref=f3e2]:
    - link "Bỏ qua tới nội dung" [ref=f3e3] [cursor=pointer]:
      - /url: "#main"
    - complementary [ref=f3e4]:
      - generic [ref=f3e16]:
        - paragraph [ref=f3e17]: QA Fresh
        - paragraph [ref=f3e18]: QA Fresh
      - navigation "Điều hướng quản trị" [ref=f3e19]:
        - generic [ref=f3e20]:
          - heading "Tổng quan" [level=2] [ref=f3e21]
          - list [ref=f3e22]:
            - listitem [ref=f3e23]:
              - link "Bảng điều khiển" [ref=f3e24] [cursor=pointer]:
                - /url: /console
        - generic [ref=f3e31]:
          - heading "Sản xuất" [level=2] [ref=f3e32]
          - list [ref=f3e33]:
            - listitem [ref=f3e34]:
              - link "Chỉ tiêu" [ref=f3e35] [cursor=pointer]:
                - /url: /production/targets
            - listitem [ref=f3e39]:
              - link "Kế hoạch" [ref=f3e40] [cursor=pointer]:
                - /url: /production/food-plans
            - listitem [ref=f3e52]:
              - link "Nhu cầu nguyên liệu" [ref=f3e53] [cursor=pointer]:
                - /url: /production/material-requirements
        - generic [ref=f3e65]:
          - heading "Bán hàng" [level=2] [ref=f3e66]
          - list [ref=f3e67]:
            - listitem [ref=f3e68]:
              - link "Sản phẩm" [ref=f3e69] [cursor=pointer]:
                - /url: /sales/products
    - generic [ref=f3e81]:
      - banner [ref=f3e82]:
        - generic [ref=f3e83]:
          - button "Toggle sidebar" [expanded] [ref=f3e84] [cursor=pointer]
          - generic [ref=f3e85]:
            - button "Chuyển sang giao diện tối" [ref=f3e86] [cursor=pointer]
            - button "Tài khoản của QA role" [ref=f3e88]:
              - generic [aria-hidden] [ref=f3e89]: Q
              - generic [ref=f3e90]:
                - text: QA role
                - generic [ref=f3e91]: qa-roles-food_dev@dcentervn.local
      - main [ref=f3e92]:
        - generic [ref=f3e93]:
          - generic [ref=f3e94]:
            - generic [ref=f3e97]:
              - heading "Chỉ tiêu sản xuất" [level=1] [ref=f3e99]
              - paragraph [ref=f3e100]: Tạo chỉ tiêu đã duyệt cho set chuẩn bị nguyên liệu theo chi nhánh.
            - button "Tạo chỉ tiêu" [ref=f3e102] [cursor=pointer]
          - table [ref=f3e106]:
            - rowgroup [ref=f3e107]:
              - row [ref=f3e108]:
                - columnheader "Mã" [ref=f3e109]
                - columnheader "Tiêu đề" [ref=f3e110]
                - columnheader "Kỳ" [ref=f3e111]
                - columnheader "Trạng thái" [ref=f3e112]
                - columnheader "Thao tác" [ref=f3e113]
            - rowgroup [ref=f3e114]:
              - row [ref=f3e115]:
                - cell [ref=f3e116]:
                  - status [ref=f3e117]:
                    - paragraph [ref=f3e122]: Chưa có chỉ tiêu sản xuất
                    - paragraph [ref=f3e123]: Chỉ tiêu xác định sản phẩm và tổng suất cần chuẩn bị cho chi nhánh.
                    - button "Tạo chỉ tiêu" [ref=f3e125] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=f3e131] [cursor=pointer]
  - alert [ref=f3e135]
```

# Test source

```ts
  1   | import { randomInt } from "node:crypto";
  2   | import { readFileSync } from "node:fs";
  3   | import { homedir } from "node:os";
  4   | import { test, expect, type APIRequestContext, type Locator, type Page, type Response } from "@playwright/test";
  5   | import { z } from "zod";
  6   | import { decodePlatform } from "../../lib/api/platform-contract";
  7   | import messages from "../../messages/vi.json" with { type: "json" };
  8   | 
  9   | const identity = z.object({ id: z.string().uuid(), status: z.string() });
  10  | const familySchema = z.object({ product: identity.extend({ name: z.string() }) });
  11  | const rawSchema = z.object({ id: z.string().uuid(), name: z.string(), sku_code: z.string(), uom_code: z.string(), selectable: z.boolean() });
  12  | const materialPage = z.object({ items: z.array(rawSchema) });
  13  | const metadata = z.object({ product_ref: z.string().uuid(), code: z.string(), name: z.string(), variant_label: z.string(), net_weight_g: z.number(), uom_code: z.literal("EA"), temperature_regime: z.string() });
  14  | const packageSchema = metadata.extend({ id: z.string().uuid(), updated_at: z.string(), status: z.string() });
  15  | const optionSchema = z.object({ sku_ref: z.string().uuid(), quantity: z.number().int().positive(), is_default: z.boolean() }).strict();
  16  | const slotSchema = z.object({ slot: z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]), swappable: z.boolean(), removable: z.boolean(), options: z.array(optionSchema) }).strict();
  17  | const setSchema = packageSchema.extend({ tags: z.array(z.string()), slots: z.array(slotSchema) });
  18  | const componentSchema = z.object({ sku_ref: z.string().uuid(), name: z.string().nullable(), quantity: z.string(), uom: z.string(), yield_pct: z.string() }).strict();
  19  | const stepSchema = z.object({ instruction: z.string(), duration_seconds: z.number().int().nonnegative() }).strict();
  20  | const recipeSchema = z.object({ id: z.string().uuid(), output_sku_ref: z.string().uuid(), version: z.number().int().positive(), bom_code: z.string(), components: z.array(componentSchema), prep_steps: z.array(stepSchema) });
  21  | const labelsSchema = z.object({ allergen_summary: z.object({ known: z.boolean(), contains: z.array(z.string()) }), avoidance_flags: z.array(z.string()), diet_flags: z.array(z.string()).nullable(), updated_at: z.string() });
  22  | const evaluationSchema = z.object({ diet_flags: z.array(z.string()), derived_hashtags: z.array(z.string()), unknown: z.array(z.object({ sku_ref: z.string(), fields: z.array(z.string()) })) });
  23  | const pinSchema = z.object({ sku_ref: z.string().uuid(), bom_ref: z.string().uuid(), version: z.number().int().positive() }).strict();
  24  | const snapshotSchema = z.object({
  25  |   schema_version: z.literal(1), set_ref: z.string().uuid(), set_updated_at: z.string(),
  26  |   slot_ratios: z.array(z.object({ slot: z.string(), options: z.array(z.object({ sku_ref: z.string().uuid().nullable(), ratio: z.string() }).strict()) }).strict()),
  27  |   slots_snapshot: z.array(slotSchema), recipe_versions: z.array(pinSchema),
  28  | }).strict();
  29  | const planSchema = z.object({ id: z.string().uuid(), revision: z.number().int().positive(), planned_quantity: z.union([z.number(), z.string()]).transform(String), servings_per_set: z.number(), pack_plan: snapshotSchema });
  30  | const requirementSchema = z.object({
  31  |   all_lines: z.array(z.object({ sku_ref: z.string().uuid(), name: z.string(), quantity: z.string(), uom: z.string() })),
  32  |   total: z.number(), hidden_count: z.number(), plan_revisions: z.record(z.number()),
  33  | });
  34  | type Family = z.infer<typeof familySchema>["product"];
  35  | type Raw = z.infer<typeof rawSchema>;
  36  | type FoodSet = z.infer<typeof setSchema>;
  37  | type Pack = { value: z.infer<typeof packageSchema>; recipe: z.infer<typeof recipeSchema> };
  38  | type Role = "FOOD_DEV" | "WAREHOUSE";
  39  | const fixtures = [
  40  |   { key: "bun", code: "FH-547898", label: "Bún tươi", quantity: "0.200", yield: "100", vegan: true },
  41  |   { key: "dau", code: "FH-746610", label: "Đạm đậu", quantity: "0.150", yield: "100", vegan: true },
  42  |   { key: "rau", code: "FH-758248", label: "Rau xanh", quantity: "0.050", yield: "100", vegan: true },
  43  |   { key: "bo", code: "FH-643268", label: "Cốt bò", quantity: "0.100", yield: "80", vegan: false },
  44  |   { key: "nam", code: "FH-548262", label: "Cốt nấm", quantity: "0.100", yield: "100", vegan: true },
  45  | ] satisfies Array<{ key: string; code: string; label: string; quantity: string; yield: string; vegan: boolean }>;
  46  | type Fixture = (typeof fixtures)[number];
  47  | 
  48  | function qaAccounts() {
  49  |   const file = (process.env.QA_ROLE_ENV ?? `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  50  |   let text: string;
  51  |   try { text = readFileSync(file, "utf8"); } catch { throw new Error("Cần QA_ROLE_ENV và stack QA thật."); }
  52  |   const values: Record<string, string> = {};
  53  |   for (const line of text.split(/\r?\n/)) {
  54  |     const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  55  |     if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  56  |   }
  57  |   for (const role of ["FOOD_DEV", "WAREHOUSE"] satisfies Role[]) {
  58  |     for (const field of ["EMAIL", "PASSWORD"]) {
  59  |       const key = `ROLE_${role}_${field}`;
  60  |       if (process.env[key]) values[key] = process.env[key];
  61  |       if (!values[key]) throw new Error(`Thiếu tài khoản QA ${role}.`);
  62  |     }
  63  |   }
  64  |   return values;
  65  | }
  66  | async function login(page: Page, accounts: Record<string, string>, role: Role) {
  67  |   await page.goto("/staff/login");
  68  |   await page.getByLabel(messages.employeeAuth.identifier, { exact: true }).fill(accounts[`ROLE_${role}_EMAIL`]);
  69  |   await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(accounts[`ROLE_${role}_PASSWORD`])
  70  |     .catch(() => { throw new Error("Không nhập được mật khẩu QA."); });
  71  |   const response = changed(page, "/api/auth/staff/login", "POST");
  72  |   await page.getByRole("button", { name: messages.employeeAuth.login, exact: true }).click();
  73  |   expect((await response).status(), `Đăng nhập ${role}`).toBe(200);
  74  |   await page.waitForURL(/\/(console|platform(?:\/role-matrix)?)$/);
  75  | }
  76  | function changed(page: Page, path: string, method: string) {
  77  |   return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === method);
  78  | }
  79  | async function decoded<T>(response: Response, schema: { parse(value: unknown): T }, status: number): Promise<T> {
  80  |   expect(response.status(), "HTTP response").toBe(status);
> 81  |   return decodePlatform(await response.json(), schema);
      |                                        ^ Error: response.json: Protocol error (Network.getResponseBody): No resource with given identifier found
  82  | }
  83  | async function read<T>(request: APIRequestContext, path: string, schema: { parse(value: unknown): T }): Promise<T> {
  84  |   const response = await request.get(path);
  85  |   expect(response.status(), `GET ${path}`).toBe(200);
  86  |   return decodePlatform(await response.json(), schema);
  87  | }
  88  | async function pick(scope: Locator, label: string, name: string) {
  89  |   const combobox = scope.getByRole("combobox", { name: label, exact: true });
  90  |   if (await combobox.inputValue() === name) {
  91  |     await expect(combobox).toHaveValue(name);
  92  |     return;
  93  |   }
  94  |   await combobox.fill(name.split(/\s+/).slice(0, 2).join(" "));
  95  |   await scope.getByRole("option", { name, exact: true }).click();
  96  | }
  97  | async function chooseRaw(page: Page, picker: Locator, raw: Raw) {
  98  |   await picker.getByLabel("Tìm nguyên liệu", { exact: true }).fill(raw.name);
  99  |   const loaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && new URL(r.url()).searchParams.get("q") === raw.name && r.request().method() === "GET");
  100 |   await picker.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
  101 |   expect((await loaded).status()).toBe(200);
  102 |   await picker.getByRole("button", { name: `Chọn ${raw.name}`, exact: true }).click();
  103 | }
  104 | async function createFamilyAndTarget(page: Page, tag: string) {
  105 |   await page.goto("/production/targets");
  106 |   await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
  107 |   await page.getByLabel("Tên sản phẩm", { exact: true }).fill(`Bún Huế ${tag}`);
  108 |   await page.getByLabel("Slug sản phẩm", { exact: true }).fill(`e1-bun-${tag.toLowerCase()}`);
  109 |   const productResponse = changed(page, "/api/sales/products", "POST");
  110 |   await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
  111 |   const family = (await decoded(await productResponse, familySchema, 201)).product;
  112 |   await expect(page.getByRole("combobox", { name: "Sản phẩm", exact: true })).toHaveValue(family.name);
  113 |   await page.getByLabel("Tiêu đề", { exact: true }).fill(`Kế hoạch Bún Huế ${tag}`);
  114 |   await page.getByLabel("Tổng suất chỉ tiêu", { exact: true }).fill("100");
  115 |   const targetResponse = changed(page, "/api/production/targets", "POST");
  116 |   await page.getByRole("button", { name: "Lưu chỉ tiêu", exact: true }).click();
  117 |   const target = await decoded(await targetResponse, identity, 201);
  118 |   expect(target.status).toBe("APPROVED");
  119 |   await page.goto(`/production/food-plans?target_id=${target.id}`);
  120 |   return { family, target };
  121 | }
  122 | async function declareLabels(page: Page, raw: Raw, plant: boolean) {
  123 |   const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
  124 |   const card = region.getByRole("heading", { name: "Khai báo nhãn nguyên liệu", exact: true }).locator("..");
  125 |   await chooseRaw(page, card.getByRole("region", { name: "Chọn nguyên liệu", exact: true }), raw);
  126 |   const form = card.getByRole("form", { name: "Nhãn nguyên liệu", exact: true });
  127 |   await expect(form.getByRole("heading", { name: raw.name, exact: true })).toBeVisible();
  128 |   await form.getByLabel("Đã khai báo dị ứng", { exact: true }).check();
  129 |   await form.getByRole("combobox", { name: "Chế độ ăn nguyên liệu", exact: true }).selectOption(plant ? "VEGETARIAN" : "none");
  130 |   const saved = changed(page, `/api/food-packs/sales/skus/${raw.id}/labels`, "PATCH");
  131 |   await form.getByRole("button", { name: "Lưu nhãn nguyên liệu", exact: true }).click();
  132 |   const labels = await decoded(await saved, labelsSchema, 200);
  133 |   expect(labels.allergen_summary.known).toBe(true);
  134 |   expect(labels.diet_flags).toEqual(plant ? ["VEGETARIAN"] : []);
  135 |   return labels;
  136 | }
  137 | async function createPack(page: Page, family: Family, raw: Raw, fixture: Fixture, tag: string): Promise<Pack> {
  138 |   const region = page.getByRole("region", { name: "Gói và công thức", exact: true });
  139 |   await region.getByRole("button", { name: "Tạo gói", exact: true }).first().click();
  140 |   const form = region.getByRole("form", { name: "Biên tập gói", exact: true });
  141 |   await pick(form, "Họ món của gói", family.name);
  142 |   await form.getByLabel("Mã gói", { exact: true }).fill(`E1-${tag}-${fixture.key}`);
  143 |   await form.getByLabel("Tên gói", { exact: true }).fill(`${fixture.label} ${tag}`);
  144 |   const saved = changed(page, "/api/food-packs/sales/packages", "POST");
  145 |   await form.getByRole("button", { name: "Lưu gói", exact: true }).click();
  146 |   const value = await decoded(await saved, packageSchema, 201);
  147 |   await region.getByRole("button", { name: "Tạo công thức", exact: true }).click();
  148 |   const recipeForm = region.getByRole("form", { name: "Biên tập công thức", exact: true });
  149 |   await chooseRaw(page, recipeForm.locator("..").getByRole("region", { name: "Chọn nguyên liệu", exact: true }), raw);
  150 |   await recipeForm.getByLabel("Định lượng 1", { exact: true }).fill(fixture.quantity);
  151 |   await recipeForm.getByRole("combobox", { name: "Đơn vị 1", exact: true }).selectOption("KG");
  152 |   await recipeForm.getByLabel("Yield % 1", { exact: true }).fill(fixture.yield);
  153 |   await recipeForm.getByRole("button", { name: "Thêm bước chế biến", exact: true }).click();
  154 |   await recipeForm.getByLabel("Hướng dẫn 1", { exact: true }).fill(`Sơ chế ${fixture.label.toLowerCase()} ${tag}`);
  155 |   const recipeResponse = changed(page, `/api/food-packs/production/packages/${value.id}/recipes`, "POST");
  156 |   await recipeForm.getByRole("button", { name: "Lưu công thức", exact: true }).click();
  157 |   const recipe = await decoded(await recipeResponse, recipeSchema, 201);
  158 |   expect(recipe.version).toBe(1);
  159 |   expect(recipe.bom_code).toBe(`${value.code}-v1`);
  160 |   expect(recipe.components).toEqual([{ sku_ref: raw.id, name: raw.name, quantity: fixture.quantity, uom: "KG", yield_pct: fixture.yield }]);
  161 |   await expect(region.getByText(recipe.bom_code, { exact: false })).toBeVisible();
  162 |   return { value, recipe };
  163 | }
  164 | async function createSet(page: Page, family: Family, packs: Record<string, Pack>, tag: string, vegetarian: boolean) {
  165 |   const region = page.getByRole("region", { name: "Set", exact: true });
  166 |   await region.getByRole("button", { name: "Tạo set món", exact: true }).first().click();
  167 |   const form = region.getByRole("form", { name: "Biên tập set món", exact: true });
  168 |   await pick(form, "Họ món", family.name);
  169 |   await form.getByLabel("Mã set", { exact: true }).fill(`E1-${tag}-set-${vegetarian ? "chay" : "bo"}`);
  170 |   await form.getByLabel("Tên set", { exact: true }).fill(`Bún ${vegetarian ? "chay" : "bò"} Huế ${tag}`);
  171 |   await form.getByLabel("Hashtag tay", { exact: true }).fill(`qa-pack, ui-e1, run-${tag.toLowerCase()}`);
  172 |   const draftResponse = changed(page, "/api/food-packs/sales/sets", "POST");
  173 |   await form.getByRole("button", { name: "Lưu set món", exact: true }).click();
  174 |   const draft = await decoded(await draftResponse, setSchema, 201);
  175 |   await region.getByRole("button", { name: "Sửa set món", exact: true }).click();
  176 |   for (const slot of [
  177 |     { id: "TINH_BOT", label: "Tinh bột", keys: ["bun"] }, { id: "DAM", label: "Đạm", keys: ["dau"] },
  178 |     { id: "RAU", label: "Rau", keys: ["rau"] }, { id: "COT", label: "Cốt", keys: vegetarian ? ["nam", "bo"] : ["bo", "nam"] },
  179 |   ]) {
  180 |     await form.getByRole("combobox", { name: "Thêm ô", exact: true }).selectOption(slot.id);
  181 |     const group = form.getByRole("group", { name: slot.label, exact: true });
```