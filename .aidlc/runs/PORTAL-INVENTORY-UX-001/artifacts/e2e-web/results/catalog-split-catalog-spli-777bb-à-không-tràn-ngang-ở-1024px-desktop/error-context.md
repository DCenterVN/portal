# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: catalog-split/catalog-split.spec.ts >> AC-7 #019 và sửa wrap/icon ở console /sales/products >> icon tìm kiếm căn giữa ô nhập và không tràn ngang ở 1024px
- Location: e2e/catalog-split/catalog-split.spec.ts:239:5

# Error details

```
Error: Đọc quyền qua /api/auth/context

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]
  - generic [ref=e12]:
    - link "Bỏ qua tới nội dung" [ref=e13] [cursor=pointer]:
      - /url: "#main"
    - complementary [ref=e14]:
      - paragraph [ref=e27]: Chưa chọn chi nhánh
      - navigation "Điều hướng quản trị" [ref=e28]:
        - generic [ref=e29]:
          - heading "Tổng quan" [level=2] [ref=e30]
          - list [ref=e31]:
            - listitem [ref=e32]:
              - link "Bảng điều khiển" [ref=e33] [cursor=pointer]:
                - /url: /console
    - generic [ref=e40]:
      - banner [ref=e41]:
        - generic [ref=e42]:
          - button "Toggle sidebar" [expanded] [ref=e43] [cursor=pointer]
          - generic [ref=e44]:
            - button "Chuyển sang giao diện tối" [ref=e45] [cursor=pointer]
            - button "Tài khoản của Tài khoản" [ref=e47]:
              - generic [aria-hidden] [ref=e48]: T
              - generic [ref=e49]: Tài khoản
      - main [ref=e50]:
        - status [ref=e51]:
          - paragraph [ref=e55]: Đang tải nhân viên…
```

# Test source

```ts
  1   | import { readFileSync } from "node:fs";
  2   | import { homedir } from "node:os";
  3   | import { test, expect, type Page } from "@playwright/test";
  4   | import messages from "../../messages/vi.json" with { type: "json" };
  5   | 
  6   | const READ = "sales:product:read";
  7   | const STAFF_ONLY = /Tạo sản phẩm|Kích hoạt|\bSKU\b|[Bb]arcode|[Mm]ã vạch|DRAFT|Bản nháp/;
  8   | type Kind = "CUSTOMER" | "SALES" | "WAREHOUSE" | "PROCESSING_STAFF" | "FOOD_DEV";
  9   | 
  10  | function accounts(): Record<string, string> {
  11  |   const path = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  12  |   let source: string;
  13  |   try { source = readFileSync(path, "utf8"); } catch { throw new Error("Không đọc được QA_ROLE_ENV; cần stack và tài khoản QA thật."); }
  14  |   const values: Record<string, string> = {};
  15  |   for (const line of source.split(/\r?\n/)) {
  16  |     const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  17  |     if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  18  |   }
  19  |   return values;
  20  | }
  21  | 
  22  | async function login(page: Page, kind: Kind) {
  23  |   const env = accounts();
  24  |   const email = env[`ROLE_${kind}_EMAIL`], password = env[`ROLE_${kind}_PASSWORD`];
  25  |   if (!email || !password) throw new Error(`Thiếu tài khoản QA ${kind}.`);
  26  |   const customer = kind === "CUSTOMER";
  27  |   await page.goto(customer ? "/login" : "/staff/login");
  28  |   const form = customer ? page.getByRole("dialog") : page;
  29  |   await form.getByLabel(customer ? messages.customerAuth.identifier : messages.employeeAuth.identifier, { exact: true }).fill(email);
  30  |   await form.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password);
  31  |   const result = page.waitForResponse((r) => new URL(r.url()).pathname === (customer ? "/api/auth/login" : "/api/auth/staff/login") && r.request().method() === "POST");
  32  |   await form.getByRole("button", { name: customer ? messages.customerAuth.login : messages.employeeAuth.login, exact: true }).click();
  33  |   expect((await result).status(), `Đăng nhập ${kind}`).toBe(200);
  34  |   await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?|staff\/switch-(?:org|branch))/);
  35  | }
  36  | 
  37  | async function permissionsOf(page: Page): Promise<string[]> {
  38  |   const response = await page.request.get("/api/auth/context");
> 39  |   expect(response.status(), "Đọc quyền qua /api/auth/context").toBe(200);
      |                                                                ^ Error: Đọc quyền qua /api/auth/context
  40  |   return (await response.json()).permissions ?? [];
  41  | }
  42  | 
  43  | async function firstStaffWithout(page: Page, kinds: Kind[]): Promise<Kind | undefined> {
  44  |   for (const kind of kinds) {
  45  |     await page.context().clearCookies();
  46  |     await login(page, kind);
  47  |     if (!(await permissionsOf(page)).includes(READ)) return kind;
  48  |   }
  49  | }
  50  | 
  51  | async function expectStoreClean(page: Page) {
  52  |   await page.goto("/products");
  53  |   const main = page.locator("main, [role=main], body").first();
  54  |   await expect(page.getByRole("heading").first()).toBeVisible();
  55  |   await expect(main).not.toContainText(STAFF_ONLY);
  56  |   await expect(page.getByRole("table")).toHaveCount(0);
  57  |   await expect(page.locator('a[href="/sales/products"]')).toHaveCount(0);
  58  |   expect(new URL(page.url()).pathname).toBe("/products");
  59  | }
  60  | 
  61  | async function hasCards(page: Page) {
  62  |   await page.goto("/products");
  63  |   await page.waitForLoadState("load");
  64  |   return (await page.locator('a[href^="/products/"]').count()) > 0;
  65  | }
  66  | 
  67  | test.describe("AC-1 /products là catalog của khách", () => {
  68  |   test("anonymous không thấy control nhân viên", async ({ page }) => {
  69  |     await expectStoreClean(page);
  70  |   });
  71  | 
  72  |   test("anonymous thấy card có tên + giá, không thấy UUID", async ({ page }) => {
  73  |     test.skip(!(await hasCards(page)), "Stack chưa có món ACTIVE để hiện card; cần dữ liệu SALES-FLOW-001.");
  74  |     const card = page.locator('a[href^="/products/"]').first();
  75  |     await expect(card).toContainText(/₫/);
  76  |     expect(await page.locator("main, body").first().innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/);
  77  |     await expect(page.getByRole("button", { name: /yêu thích/i })).toHaveCount(0);
  78  |   });
  79  | 
  80  |   test("khách đã đăng nhập cũng không thấy control nhân viên", async ({ page }) => {
  81  |     await login(page, "CUSTOMER");
  82  |     await expectStoreClean(page);
  83  |   });
  84  | 
  85  |   test("AC-2 chi tiết món công khai không có nút kích hoạt, SKU, barcode", async ({ page }) => {
  86  |     test.skip(!(await hasCards(page)), "Stack chưa có món ACTIVE; cần dữ liệu SALES-FLOW-001.");
  87  |     await page.locator('a[href^="/products/"]').first().click();
  88  |     await page.waitForURL(/\/products\/[^/]+$/);
  89  |     await expect(page.getByRole("heading").first()).toBeVisible();
  90  |     await expect(page.locator("main, body").first()).not.toContainText(STAFF_ONLY);
  91  |     await expect(page.getByRole("button", { name: /Kích hoạt/ })).toHaveCount(0);
  92  |   });
  93  | });
  94  | 
  95  | test.describe("AC-3/AC-4 /sales/products trong console", () => {
  96  |   test("staff có sales:product:read thấy menu Sản phẩm và màn quản trị", async ({ page }) => {
  97  |     await login(page, "SALES");
  98  |     test.skip(!(await permissionsOf(page)).includes(READ), "Tài khoản QA SALES chưa có sales:product:read trong ma trận.");
  99  |     await page.goto("/console");
  100 |     const link = page.locator('a[href="/sales/products"]');
  101 |     await expect(link).toBeVisible();
  102 |     await link.click();
  103 |     await page.waitForURL(/\/sales\/products$/);
  104 |     await expect(page.getByRole("heading", { name: /Sản phẩm/ }).first()).toBeVisible();
  105 |     await expect(page.getByText("Không có quyền truy cập")).toHaveCount(0);
  106 |   });
  107 | 
  108 |   test("staff không có quyền đọc không thấy menu, vào URL trực tiếp bị chặn và không gọi staff list", async ({ page }) => {
  109 |     const kind = await firstStaffWithout(page, ["WAREHOUSE", "PROCESSING_STAFF", "FOOD_DEV"]);
  110 |     test.skip(!kind, "Mọi vai QA khác đều đang có sales:product:read; không có tài khoản thiếu quyền để thử.");
  111 |     const listCalls: string[] = [];
  112 |     page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/sales/products") listCalls.push(request.method()); });
  113 |     await page.goto("/console");
  114 |     await expect(page.locator('a[href="/sales/products"]')).toHaveCount(0);
  115 |     await page.goto("/sales/products");
  116 |     await expect(page.getByText("Không có quyền truy cập")).toBeVisible();
  117 |     expect(listCalls).toEqual([]);
  118 |   });
  119 | 
  120 |   test("khách không vào được /sales/products", async ({ page }) => {
  121 |     await login(page, "CUSTOMER");
  122 |     await page.goto("/sales/products");
  123 |     await expect(page.getByRole("button", { name: /Tạo sản phẩm/ })).toHaveCount(0);
  124 |     expect(new URL(page.url()).pathname).not.toBe("/sales/products");
  125 |   });
  126 | });
  127 | 
  128 | test.describe("AC-6 bố cục", () => {
  129 |   test("không tràn ngang ở /products", async ({ page }) => {
  130 |     await page.goto("/products");
  131 |     await page.waitForLoadState("load");
  132 |     expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  133 |   });
  134 | 
  135 |   test("mobile 390: bộ lọc mở bằng sheet, Esc đóng, không tràn ngang", async ({ page }, info) => {
  136 |     test.skip(info.project.name !== "mobile", "Chỉ chạy ở project mobile 390.");
  137 |     await page.goto("/products");
  138 |     await page.waitForLoadState("load");
  139 |     const open = page.getByRole("button", { name: /Bộ lọc/ });
```