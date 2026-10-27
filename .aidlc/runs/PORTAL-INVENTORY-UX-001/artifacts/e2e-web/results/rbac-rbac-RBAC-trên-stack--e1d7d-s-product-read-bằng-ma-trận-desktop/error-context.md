# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rbac/rbac.spec.ts >> RBAC trên stack thật >> 1. ADMIN tắt rồi bật sales:product:read bằng ma trận
- Location: e2e/rbac/rbac.spec.ts:178:3

# Error details

```
Error: Đọc ma trận qua BFF

expect(received).toBe(expected) // Object.is equality

Expected: 200
Received: 401
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]
  - main [ref=e17]:
    - status [ref=e18]:
      - paragraph [ref=e22]: Đang xác minh quyền truy cập…
```

# Test source

```ts
  1   | import { readFileSync } from "node:fs";
  2   | import { homedir } from "node:os";
  3   | import { randomUUID } from "node:crypto";
  4   | import { test, expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
  5   | import { decodeJwt } from "jose";
  6   | import { z } from "zod";
  7   | import { decodePlatform, pageSchema, roleMatrixSchema } from "../../lib/api/platform-contract";
  8   | import messages from "../../messages/vi.json" with { type: "json" };
  9   | 
  10  | const matrixPath = "/api/org/company/role-matrix";
  11  | const membershipsPath = "/api/org/company/memberships";
  12  | const productPath = "/api/sales/products";
  13  | const permission = "sales:product:read";
  14  | const memberSchema = z.object({
  15  |   id: z.string().uuid(), user_id: z.string().uuid(), branch_id: z.string().uuid(),
  16  |   role_codes: z.array(z.string()).nullable(), status: z.enum(["ACTIVE", "SUSPENDED"]),
  17  | });
  18  | const t = messages.memberships;
  19  | let admin: BrowserContext;
  20  | let adminPage: Page;
  21  | let originalGrants: string[] | undefined;
  22  | let originalMember: z.infer<typeof memberSchema> | undefined;
  23  | let accounts: Record<string, string>;
  24  | 
  25  | function readAccounts() {
  26  |   const path = process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`;
  27  |   let source: string;
  28  |   try { source = readFileSync(path.replace(/^~\//, `${homedir()}/`), "utf8"); }
  29  |   catch { throw new Error("Không đọc được QA_ROLE_ENV; cần stack và tài khoản QA thật."); }
  30  |   const values: Record<string, string> = {};
  31  |   for (const line of source.split(/\r?\n/)) {
  32  |     const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  33  |     if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  34  |   }
  35  |   return { ...values, ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)) };
  36  | }
  37  | 
  38  | async function login(page: Page, role: "ADMIN" | "SALES" | "CUSTOMER", email = accounts[`ROLE_${role}_EMAIL`], password = accounts[`ROLE_${role}_PASSWORD`]) {
  39  |   if (!email || !password) throw new Error(`Thiếu tài khoản QA ${role}.`);
  40  |   const customer = role === "CUSTOMER";
  41  |   await page.goto(customer ? "/login" : "/staff/login");
  42  |   const form = customer ? page.getByRole("dialog") : page;
  43  |   await form.getByLabel(customer ? messages.customerAuth.identifier : messages.employeeAuth.identifier, { exact: true }).fill(email);
  44  |   await form.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password)
  45  |     .catch(() => { throw new Error("Không nhập được mật khẩu đăng nhập."); });
  46  |   const result = page.waitForResponse((response) => response.url().endsWith(customer ? "/api/auth/login" : "/api/auth/staff/login") && response.request().method() === "POST");
  47  |   await form.getByRole("button", { name: customer ? messages.customerAuth.login : messages.employeeAuth.login, exact: true }).click();
  48  |   expect((await result).status(), `Đăng nhập ${role}`).toBe(200);
  49  |   await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?)$/);
  50  |   const token = (await page.context().cookies()).find(cookie => cookie.name === "access_token")?.value;
  51  |   expect(Boolean(token), "Login issues an identity session").toBe(true);
  52  |   const claims = decodeJwt(token!);
  53  |   expect(claims.org_id).toBe(accounts.QA_BRANCH_ID);
  54  |   expect(claims.branch_id).toBe(accounts.QA_BRANCH_ID);
  55  | 
  56  | }
  57  | 
  58  | async function grants(request: APIRequestContext) {
  59  |   const response = await request.get(matrixPath);
> 60  |   expect(response.status(), "Đọc ma trận qua BFF").toBe(200);
      |                                                    ^ Error: Đọc ma trận qua BFF
  61  |   return decodePlatform(await response.json(), roleMatrixSchema).SALES;
  62  | }
  63  | 
  64  | async function members(request: APIRequestContext) {
  65  |   const all: z.infer<typeof memberSchema>[] = [];
  66  |   for (let page = 1; ; page++) {
  67  |     const response = await request.get(`${membershipsPath}?page=${page}&limit=20`);
  68  |     expect(response.status(), "Đọc memberships qua BFF").toBe(200);
  69  |     const result = decodePlatform(await response.json(), pageSchema(memberSchema));
  70  |     all.push(...result.items);
  71  |     if (result.items.length < result.limit) return all;
  72  |   }
  73  | }
  74  | 
  75  | async function restoreGrants() {
  76  |   if (!originalGrants) return;
  77  |   let response = await admin.request.put(`${matrixPath}/roles/SALES`, { data: { actions: originalGrants } });
  78  |   if (response.status() === 401) {
  79  |     await login(adminPage, "ADMIN");
  80  |     response = await admin.request.put(`${matrixPath}/roles/SALES`, { data: { actions: originalGrants } });
  81  |   }
  82  |   expect(response.status(), "Khôi phục grants SALES").toBe(200);
  83  |   expect([...new Set(await grants(admin.request))].sort()).toEqual([...new Set(originalGrants)].sort());
  84  | }
  85  | 
  86  | async function restoreStatus() {
  87  |   if (!originalMember) return;
  88  |   let response = await admin.request.patch(`${membershipsPath}/${originalMember.id}`, { data: { status: originalMember.status } });
  89  |   if (response.status() === 401) {
  90  |     await login(adminPage, "ADMIN");
  91  |     response = await admin.request.patch(`${membershipsPath}/${originalMember.id}`, { data: { status: originalMember.status } });
  92  |   }
  93  |   expect(response.status(), "Khôi phục status SALES").toBe(200);
  94  |   expect((await members(admin.request)).find((member) => member.id === originalMember?.id)?.status).toBe(originalMember.status);
  95  | }
  96  | 
  97  | async function togglePermission(enabled: boolean) {
  98  |   await adminPage.goto("/platform/role-matrix");
  99  |   await adminPage.getByRole("radio", { name: "SALES", exact: true }).click();
  100 |   const checkbox = adminPage.getByRole("checkbox", { name: permission, exact: true });
  101 |   await checkbox.setChecked(enabled);
  102 |   const saved = adminPage.waitForResponse((response) => response.url().endsWith(`${matrixPath}/roles/SALES`) && response.request().method() === "PUT");
  103 |   await adminPage.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  104 |   expect((await saved).status(), "Lưu ma trận bằng UI").toBe(200);
  105 |   await expect(adminPage.getByText("Đã cập nhật quyền của SALES.", { exact: true }).first()).toBeVisible();
  106 |   expect((await grants(admin.request)).includes(permission)).toBe(enabled);
  107 | }
  108 | 
  109 | async function openMemberships(page: Page) {
  110 |   await page.goto("/memberships");
  111 |   if (!new URL(page.url()).pathname.startsWith("/staff/switch-")) return;
  112 |   if (!originalMember) throw new Error("Chưa có membership MAIN.");
  113 |   if (new URL(page.url()).pathname === "/staff/switch-org") {
  114 |     await page.getByLabel(messages.employeeAuth.company, { exact: true }).selectOption(originalMember.branch_id);
  115 |     await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
  116 |     await page.waitForURL(/\/(console|staff\/switch-branch)(\?|$)/);
  117 |   }
  118 |   if (new URL(page.url()).pathname === "/staff/switch-branch") {
  119 |     await page.getByLabel(messages.employeeAuth.branch, { exact: true }).selectOption(originalMember.branch_id);
  120 |     await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
  121 |     await page.waitForURL(/\/console$/);
  122 |   }
  123 |   await page.goto("/memberships");
  124 | }
  125 | 
  126 | async function membershipRow(page: Page) {
  127 |   if (!originalMember) throw new Error("Chưa có membership SALES gốc.");
  128 |   await openMemberships(page);
  129 |   for (;;) {
  130 |     await expect(page.getByRole("heading", { name: t.title, exact: true })).toBeVisible();
  131 |     await expect(page.getByRole("button", { name: t.editRoles, exact: true }).first()).toBeVisible();
  132 |     await expect(page.getByRole("status", { name: t.loading })).toBeHidden();
  133 |     const row = page.getByRole("row").filter({ has: page.getByText(originalMember.user_id, { exact: true }) });
  134 |     if (await row.count()) return row;
  135 |     const next = page.getByRole("button", { name: t.next, exact: true });
  136 |     await expect(next, "Tìm membership SALES qua phân trang UI").toBeEnabled();
  137 |     const loaded = page.waitForResponse((response) => response.url().includes(`${membershipsPath}?`) && response.request().method() === "GET");
  138 |     await next.click();
  139 |     expect((await loaded).status()).toBe(200);
  140 |   }
  141 | }
  142 | 
  143 | async function changeStatus(page: Page, suspended: boolean) {
  144 |   const row = await membershipRow(page);
  145 |   const changed = page.waitForResponse((response) => response.url().endsWith(`${membershipsPath}/${originalMember?.id}`) && response.request().method() === "PATCH");
  146 |   await row.getByRole("button", { name: suspended ? t.suspend : t.activate, exact: true }).click();
  147 |   expect((await changed).status()).toBe(200);
  148 |   await expect(row.getByText(suspended ? t.SUSPENDED : t.ACTIVE, { exact: true })).toBeVisible();
  149 | }
  150 | 
  151 | test.use({ trace: "off", screenshot: "off", video: "off" });
  152 | 
  153 | test.describe("RBAC trên stack thật", () => {
  154 |   test.describe.configure({ mode: "serial", timeout: 120_000 });
  155 | 
  156 |   test.beforeAll(async ({ browser, baseURL }) => {
  157 |     accounts = readAccounts();
  158 |     admin = await browser.newContext({ baseURL });
  159 |     adminPage = await admin.newPage();
  160 |     await login(adminPage, "ADMIN");
```