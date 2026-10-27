# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: fooddev-set/fooddev-set.spec.ts >> FOODDEV-SET E1 QA thật >> FOOD_DEV tạo và sửa set; kho chỉ đọc; revoke có hiệu lực ngay và restore đúng snapshot
- Location: e2e/fooddev-set/fooddev-set.spec.ts:70:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]:
    - generic [ref=e10]:
      - text: Compiling
      - generic [ref=e11]:
        - generic [ref=e12]: .
        - generic [ref=e13]: .
        - generic [ref=e14]: .
  - alert [ref=e15]
  - generic [ref=e16]:
    - link "Bỏ qua tới nội dung" [ref=e17] [cursor=pointer]:
      - /url: "#main"
    - complementary [ref=e18]:
      - generic [ref=e30]:
        - paragraph [ref=e31]: QA Fresh
        - paragraph [ref=e32]: QA Fresh
      - navigation "Điều hướng quản trị" [ref=e33]:
        - generic [ref=e34]:
          - heading "Tổng quan" [level=2] [ref=e35]
          - list [ref=e36]:
            - listitem [ref=e37]:
              - link "Bảng điều khiển" [ref=e38] [cursor=pointer]:
                - /url: /console
        - generic [ref=e45]:
          - heading "Sản xuất" [level=2] [ref=e46]
          - list [ref=e47]:
            - listitem [ref=e48]:
              - link "Chỉ tiêu" [ref=e49] [cursor=pointer]:
                - /url: /production/targets
            - listitem [ref=e53]:
              - link "Kế hoạch" [ref=e54] [cursor=pointer]:
                - /url: /production/food-plans
            - listitem [ref=e66]:
              - link "Nhu cầu nguyên liệu" [ref=e67] [cursor=pointer]:
                - /url: /production/material-requirements
        - generic [ref=e79]:
          - heading "Bán hàng" [level=2] [ref=e80]
          - list [ref=e81]:
            - listitem [ref=e82]:
              - link "Sản phẩm" [ref=e83] [cursor=pointer]:
                - /url: /sales/products
    - generic [ref=e95]:
      - banner [ref=e96]:
        - generic [ref=e97]:
          - button "Toggle sidebar" [expanded] [ref=e98] [cursor=pointer]
          - generic [ref=e99]:
            - button "Chuyển sang giao diện tối" [ref=e100] [cursor=pointer]
            - button "Tài khoản của QA role" [ref=e102]:
              - generic [aria-hidden] [ref=e103]: Q
              - generic [ref=e104]:
                - text: QA role
                - generic [ref=e105]: qa-roles-food_dev@dcentervn.local
      - main [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e116]:
            - heading "Console vận hành" [level=1] [ref=e118]
            - paragraph [ref=e119]: Dữ liệu trực tiếp theo phạm vi tổ chức và quyền của phiên đăng nhập hiện tại
          - generic [ref=e120]:
            - generic [ref=e121]:
              - heading "Người dùng" [level=3] [ref=e123]
              - strong [ref=e128]: QA role
            - generic [ref=e129]:
              - heading "Phạm vi" [level=3] [ref=e131]
              - generic [ref=e136]:
                - strong [ref=e137]: "1"
                - text: chi nhánh được truy cập
            - generic [ref=e138]:
              - heading "Quyền hiệu lực" [level=3] [ref=e140]
              - generic [ref=e144]:
                - strong [ref=e145]: "18"
                - text: action key từ Org
          - generic [ref=e146]:
            - heading "Tổ chức và chi nhánh" [level=3] [ref=e148]
            - generic [ref=e150]:
              - strong [ref=e151]: QA Fresh
              - generic [ref=e152]: QA Fresh
              - generic [ref=e153]: FOOD_DEV
          - generic [ref=e154]:
            - heading "Quyền đã phân giải" [level=3] [ref=e156]
            - table [ref=e160]:
              - rowgroup [ref=e161]:
                - row [ref=e162]:
                  - columnheader "Tài nguyên" [ref=e163]
                  - columnheader "C" [ref=e164]
                  - columnheader "R" [ref=e165]
                  - columnheader "U" [ref=e166]
                  - columnheader "D" [ref=e167]
                  - columnheader "I" [ref=e168]
                  - columnheader "E" [ref=e169]
                  - columnheader "Khác" [ref=e170]
              - rowgroup [ref=e171]:
                - row [ref=e172]:
                  - cell "production:food_plan" [ref=e173]
                  - cell [ref=e174]:
                    - checkbox "production:food_plan:create" [checked] [disabled] [ref=e175]
                  - cell [ref=e179]:
                    - checkbox "production:food_plan:read" [checked] [disabled] [ref=e180]
                  - cell [ref=e184]:
                    - checkbox "production:food_plan:update" [checked] [disabled] [ref=e185]
                  - cell [ref=e189]:
                    - checkbox "production:food_plan:delete" [disabled] [ref=e190]
                  - cell [ref=e192]:
                    - checkbox "production:food_plan:import" [disabled] [ref=e193]
                  - cell [ref=e195]:
                    - checkbox "production:food_plan:export" [disabled] [ref=e196]
                  - cell "—" [ref=e198]
                - row [ref=e199]:
                  - cell "production:material_requirement" [ref=e200]
                  - cell [ref=e201]:
                    - checkbox "production:material_requirement:create" [disabled] [ref=e202]
                  - cell [ref=e204]:
                    - checkbox "production:material_requirement:read" [checked] [disabled] [ref=e205]
                  - cell [ref=e209]:
                    - checkbox "production:material_requirement:update" [disabled] [ref=e210]
                  - cell [ref=e212]:
                    - checkbox "production:material_requirement:delete" [disabled] [ref=e213]
                  - cell [ref=e215]:
                    - checkbox "production:material_requirement:import" [disabled] [ref=e216]
                  - cell [ref=e218]:
                    - checkbox "production:material_requirement:export" [disabled] [ref=e219]
                  - cell "—" [ref=e221]
                - row [ref=e222]:
                  - cell "production:recipe" [ref=e223]
                  - cell [ref=e224]:
                    - checkbox "production:recipe:create" [checked] [disabled] [ref=e225]
                  - cell [ref=e229]:
                    - checkbox "production:recipe:read" [checked] [disabled] [ref=e230]
                  - cell [ref=e234]:
                    - checkbox "production:recipe:update" [checked] [disabled] [ref=e235]
                  - cell [ref=e239]:
                    - checkbox "production:recipe:delete" [checked] [disabled] [ref=e240]
                  - cell [ref=e244]:
                    - checkbox "production:recipe:import" [disabled] [ref=e245]
                  - cell [ref=e247]:
                    - checkbox "production:recipe:export" [disabled] [ref=e248]
                  - cell "—" [ref=e250]
                - row [ref=e251]:
                  - cell "production:target" [ref=e252]
                  - cell [ref=e253]:
                    - checkbox "production:target:create" [checked] [disabled] [ref=e254]
                  - cell [ref=e258]:
                    - checkbox "production:target:read" [checked] [disabled] [ref=e259]
                  - cell [ref=e263]:
                    - checkbox "production:target:update" [disabled] [ref=e264]
                  - cell [ref=e266]:
                    - checkbox "production:target:delete" [disabled] [ref=e267]
                  - cell [ref=e269]:
                    - checkbox "production:target:import" [disabled] [ref=e270]
                  - cell [ref=e272]:
                    - checkbox "production:target:export" [disabled] [ref=e273]
                  - cell "—" [ref=e275]
                - row [ref=e276]:
                  - cell "sales:product" [ref=e277]
                  - cell [ref=e278]:
                    - checkbox "sales:product:create" [checked] [disabled] [ref=e279]
                  - cell [ref=e283]:
                    - checkbox "sales:product:read" [checked] [disabled] [ref=e284]
                  - cell [ref=e288]:
                    - checkbox "sales:product:update" [checked] [disabled] [ref=e289]
                  - cell [ref=e293]:
                    - checkbox "sales:product:delete" [disabled] [ref=e294]
                  - cell [ref=e296]:
                    - checkbox "sales:product:import" [disabled] [ref=e297]
                  - cell [ref=e299]:
                    - checkbox "sales:product:export" [disabled] [ref=e300]
                  - cell "—" [ref=e302]
                - row [ref=e303]:
                  - cell "sales:product_listing" [ref=e304]
                  - cell [ref=e305]:
                    - checkbox "sales:product_listing:create" [disabled] [ref=e306]
                  - cell [ref=e308]:
                    - checkbox "sales:product_listing:read" [disabled] [ref=e309]
                  - cell [ref=e311]:
                    - checkbox "sales:product_listing:update" [checked] [disabled] [ref=e312]
                  - cell [ref=e316]:
                    - checkbox "sales:product_listing:delete" [disabled] [ref=e317]
                  - cell [ref=e319]:
                    - checkbox "sales:product_listing:import" [disabled] [ref=e320]
                  - cell [ref=e322]:
                    - checkbox "sales:product_listing:export" [disabled] [ref=e323]
                  - cell "—" [ref=e325]
                - row [ref=e326]:
                  - cell "sales:variant" [ref=e327]
                  - cell [ref=e328]:
                    - checkbox "sales:variant:create" [checked] [disabled] [ref=e329]
                  - cell [ref=e333]:
                    - checkbox "sales:variant:read" [checked] [disabled] [ref=e334]
                  - cell [ref=e338]:
                    - checkbox "sales:variant:update" [checked] [disabled] [ref=e339]
                  - cell [ref=e343]:
                    - checkbox "sales:variant:delete" [checked] [disabled] [ref=e344]
                  - cell [ref=e348]:
                    - checkbox "sales:variant:import" [disabled] [ref=e349]
                  - cell [ref=e351]:
                    - checkbox "sales:variant:export" [disabled] [ref=e352]
                  - cell "—" [ref=e354]
          - complementary [ref=e355]:
            - strong [ref=e356]: Giới hạn backend hiện tại
            - list [ref=e357]:
              - listitem [ref=e358]: Backend chưa có API service-health tổng hợp
              - listitem [ref=e359]: Backend chưa có API audit feed cho portal
              - listitem [ref=e360]: Order hiện chỉ hỗ trợ tạo trạng thái CREATED
```

# Test source

```ts
  1   | import { randomUUID } from "node:crypto";
  2   | import { readFileSync } from "node:fs";
  3   | import { homedir } from "node:os";
  4   | import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
  5   | import { z } from "zod";
  6   | import { decodePlatform, roleMatrixSchema } from "../../lib/api/platform-contract";
  7   | import messages from "../../messages/vi.json" with { type: "json" };
  8   | 
  9   | const matrixPath = "/api/org/company/role-matrix";
  10  | const permission = "production:material_requirement:read";
  11  | const identity = z.object({ id: z.string().uuid(), status: z.string() });
  12  | const component = z.object({ sku_ref: z.string().uuid(), quantity: z.union([z.string(), z.number()]).transform(String), uom: z.string() });
  13  | const planSchema = z.object({
  14  |   id: z.string().uuid(), revision: z.number().int().positive(), servings_per_set: z.number(),
  15  |   planned_quantity: z.union([z.string(), z.number()]).transform(String), components: z.array(component),
  16  | }).passthrough();
  17  | const material = z.object({ id: z.string().uuid(), name: z.string(), selectable: z.boolean(), uom_code: z.string() });
  18  | const catalog = z.object({ items: z.array(material), next_cursor: z.string() });
  19  | const line = z.object({ sku_ref: z.string().uuid(), quantity: z.string(), uom: z.string() });
  20  | const requirements = z.object({
  21  |   all_lines: z.array(line), lines: z.array(line), total: z.number(), hidden_count: z.number(), plan_revisions: z.record(z.number()),
  22  | });
  23  | 
  24  | function accountsFromFile() {
  25  |   const file = (process.env.QA_ROLE_ENV ?? `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  26  |   let source: string;
  27  |   try { source = readFileSync(file, "utf8"); }
  28  |   catch { throw new Error("Cần QA_ROLE_ENV và stack QA thật."); }
  29  |   const values: Record<string, string> = {};
  30  |   for (const text of source.split(/\r?\n/)) {
  31  |     const match = text.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  32  |     if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  33  |   }
  34  |   for (const [key, value] of Object.entries(process.env)) if (value !== undefined) values[key] = value;
  35  |   return values;
  36  | }
  37  | async function login(page: Page, accounts: Record<string, string>, role: "ADMIN" | "FOOD_DEV" | "WAREHOUSE") {
  38  |   const email = accounts[`ROLE_${role}_EMAIL`], password = accounts[`ROLE_${role}_PASSWORD`];
  39  |   if (!email || !password) throw new Error(`Thiếu tài khoản QA ${role}.`);
  40  |   await page.goto("/staff/login");
  41  |   await page.getByLabel(messages.employeeAuth.identifier, { exact: true }).fill(email);
  42  |   await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password)
  43  |     .catch(() => { throw new Error("Không nhập được mật khẩu QA."); });
  44  |   const logged = page.waitForResponse(r => r.url().endsWith("/api/auth/staff/login") && r.request().method() === "POST");
  45  |   await page.getByRole("button", { name: messages.employeeAuth.login, exact: true }).click();
  46  |   expect((await logged).status(), `Đăng nhập ${role}`).toBe(200);
  47  |   await page.waitForURL(/\/(console|platform(?:\/role-matrix)?)$/);
  48  | }
  49  | async function warehouseGrants(request: APIRequestContext) {
  50  |   const result = await request.get(matrixPath);
> 51  |   expect(result.status()).toBe(200);
      |                           ^ Error: expect(received).toBe(expected) // Object.is equality
  52  |   const matrix = decodePlatform(await result.json(), roleMatrixSchema);
  53  |   expect(matrix.WAREHOUSE, "Baseline phải có WAREHOUSE").toBeDefined();
  54  |   return matrix.WAREHOUSE;
  55  | }
  56  | async function readPlan(request: APIRequestContext, path: string) {
  57  |   const result = await request.get(path);
  58  |   expect(result.status()).toBe(200);
  59  |   return decodePlatform(await result.json(), planSchema);
  60  | }
  61  | // Oracle uses integer thousandths independently of production decimal code.
  62  | function quantityFor(portions: bigint) {
  63  |   const thousandths = 333n * portions;
  64  |   return `${thousandths / 1000n}.${String(thousandths % 1000n).padStart(3, "0")}`;
  65  | }
  66  | 
  67  | test.use({ trace: "off", screenshot: "off", video: "off" });
  68  | test.describe("FOODDEV-SET E1 QA thật", () => {
  69  |   test.describe.configure({ mode: "serial", timeout: 180_000 });
  70  |   test("FOOD_DEV tạo và sửa set; kho chỉ đọc; revoke có hiệu lực ngay và restore đúng snapshot", async ({ browser, baseURL, page }) => {
  71  |     const accounts = accountsFromFile();
  72  |     const warehouse = await browser.newContext({ baseURL });
  73  |     const admin = await browser.newContext({ baseURL });
  74  |     const warehousePage = await warehouse.newPage(), adminPage = await admin.newPage();
  75  |     let snapshot: string[] | undefined;
  76  |     let requirementPath: string | undefined;
  77  |     let grantsChanged = false;
  78  |     try {
  79  |       await login(page, accounts, "FOOD_DEV");
  80  |       await login(warehousePage, accounts, "WAREHOUSE");
  81  |       await login(adminPage, accounts, "ADMIN");
  82  |       snapshot = [...await warehouseGrants(admin.request)];
  83  |       expect(snapshot).toContain(permission);
  84  |       const tag = randomUUID(), name = `E1 product ${tag}`, title = `E1 target ${tag}`, setCode = `E1-${tag}`;
  85  |       await page.goto("/production/targets");
  86  |       // PageHeader renders before the optional EmptyState action with the same name.
  87  |       await page.getByRole("button", { name: "Tạo chỉ tiêu", exact: true }).first().click();
  88  |       await page.getByLabel("Tên sản phẩm", { exact: true }).fill(name);
  89  |       await page.getByLabel("Slug sản phẩm", { exact: true }).fill(`e1-${tag}`);
  90  |       const productCreated = page.waitForResponse(r => r.url().endsWith("/api/sales/products") && r.request().method() === "POST");
  91  |       await page.getByRole("button", { name: "Tạo product DRAFT", exact: true }).click();
  92  |       const productResponse = await productCreated;
  93  |       expect(productResponse.status()).toBe(201);
  94  |       const product = decodePlatform(await productResponse.json(), z.object({ product: identity })).product;
  95  |       expect(product.status).toBe("DRAFT");
  96  |       await expect(page.getByRole("combobox", { name: "Sản phẩm", exact: true })).toHaveValue(name);
  97  |       await page.getByLabel("Tiêu đề", { exact: true }).fill(title);
  98  |       await page.getByLabel("Từ ngày", { exact: true }).fill("2026-10-20");
  99  |       await page.getByLabel("Đến ngày", { exact: true }).fill("2026-10-21");
  100 |       await page.getByLabel("Tổng suất chỉ tiêu", { exact: true }).fill("8");
  101 |       const targetCreated = page.waitForResponse(r => r.url().endsWith("/api/production/targets") && r.request().method() === "POST");
  102 |       await page.getByRole("button", { name: "Lưu chỉ tiêu", exact: true }).click();
  103 |       const targetResponse = await targetCreated;
  104 |       expect(targetResponse.status()).toBe(201);
  105 |       const target = decodePlatform(await targetResponse.json(), identity);
  106 |       expect(target.status).toBe("APPROVED");
  107 |       const targetRow = page.getByRole("row").filter({ has: page.getByText(title, { exact: true }) });
  108 |       await targetRow.getByRole("link", { name: "Tạo set", exact: true }).click();
  109 |       const catalogLoaded = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && r.request().method() === "GET");
  110 |       // Header button precedes the EmptyState button with the same name.
  111 |       await page.getByRole("button", { name: "Tạo set", exact: true }).first().click();
  112 |       const catalogResponse = await catalogLoaded;
  113 |       expect(catalogResponse.status()).toBe(200);
  114 |       const candidates = decodePlatform(await catalogResponse.json(), catalog).items.filter(m => m.selectable && m.uom_code === "KG").slice(0, 3);
  115 |       expect(candidates, "Trang picker cần ít nhất 3 nguyên liệu KG để kiểm oracle").toHaveLength(3);
  116 |       await page.getByLabel("Mã set", { exact: true }).fill(setCode);
  117 |       await page.getByLabel("Khẩu phần", { exact: true }).fill(`Khẩu phần ${tag}`);
  118 |       for (const item of candidates) await page.getByRole("button", { name: `Chọn ${item.name}`, exact: true }).click();
  119 |       for (let i = 1; i <= 3; i++) await page.getByLabel(`Định lượng ${i}`, { exact: true }).fill("0.333");
  120 |       const picker = page.getByRole("region", { name: "Chọn nguyên liệu", exact: true });
  121 |       const category = picker.getByRole("combobox", { name: "Danh mục", exact: true }); // getByLabel text would include the option texts
  122 |       await expect.poll(() => category.locator("option").count(), { timeout: 20000 }).toBeGreaterThan(1);
  123 |       const categorySlug = await category.locator("option").nth(1).getAttribute("value");
  124 |       expect(categorySlug, "Catalog có danh mục thật").toBeTruthy();
  125 |       if (!categorySlug) throw new Error("Thiếu danh mục catalog QA.");
  126 |       await category.selectOption(categorySlug);
  127 |       const categoryFiltered = page.waitForResponse(r => new URL(r.url()).pathname === "/api/sales/skus" && new URL(r.url()).searchParams.get("category_slug") === categorySlug);
  128 |       await picker.getByRole("button", { name: "Lọc nguyên liệu", exact: true }).click();
  129 |       expect((await categoryFiltered).status()).toBe(200);
  130 |       await expect(page.getByLabel("Định lượng 3", { exact: true })).toHaveValue("0.333");
  131 |       const created = page.waitForResponse(r => r.url().endsWith(`/api/production/targets/${target.id}/food-plans`) && r.request().method() === "POST");
  132 |       await page.getByRole("button", { name: "Lưu set", exact: true }).click();
  133 |       const createdResponse = await created;
  134 |       expect(createdResponse.status()).toBe(201);
  135 |       const original = decodePlatform(await createdResponse.json(), planSchema);
  136 |       expect(original.revision).toBe(1);
  137 |       expect(original.servings_per_set).toBe(4);
  138 |       const planPath = `/api/production/food-plans/${original.id}`;
  139 |       requirementPath = `/api/production/targets/${target.id}/material-requirements`;
  140 |       await page.reload();
  141 |       const setRow = page.getByRole("row").filter({ has: page.getByText(setCode, { exact: true }) });
  142 |       await expect(setRow.getByRole("cell", { name: String(original.revision), exact: true })).toBeVisible();
  143 |       await setRow.getByRole("button", { name: "Sửa set", exact: true }).click();
  144 |       await page.getByLabel("Số kit", { exact: true }).fill("2");
  145 |       const updated = page.waitForResponse(r => r.url().endsWith(planPath) && r.request().method() === "PUT");
  146 |       await page.getByRole("button", { name: "Lưu set", exact: true }).click();
  147 |       const updateResponse = await updated;
  148 |       expect(updateResponse.status()).toBe(200);
  149 |       expect(z.object({ expected_revision: z.number() }).parse(updateResponse.request().postDataJSON()).expected_revision).toBe(original.revision);
  150 |       const saved = decodePlatform(await updateResponse.json(), planSchema);
  151 |       expect(saved.revision).toBe(original.revision + 1);
```