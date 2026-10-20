import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";
import { test, expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";
import { z } from "zod";
import { decodePlatform, pageSchema, roleMatrixSchema } from "../../lib/api/platform-contract";
import messages from "../../messages/vi.json" with { type: "json" };

const matrixPath = "/api/org/company/role-matrix";
const membershipsPath = "/api/org/company/memberships";
const productPath = "/api/sales/products";
const permission = "sales:product:read";
const memberSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid(), branch_id: z.string().uuid(),
  role_codes: z.array(z.string()).nullable(), status: z.enum(["ACTIVE", "SUSPENDED"]),
});
const mailListSchema = z.object({ messages: z.array(z.object({ ID: z.string(), To: z.array(z.object({ Address: z.string() })) })) });
const mailSchema = z.object({ To: z.array(z.object({ Address: z.string() })), Text: z.string(), HTML: z.string() });
const t = messages.memberships;
let admin: BrowserContext;
let adminPage: Page;
let originalGrants: string[] | undefined;
let originalMember: z.infer<typeof memberSchema> | undefined;
let accounts: Record<string, string>;

function readAccounts() {
  const path = process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`;
  let source: string;
  try { source = readFileSync(path.replace(/^~\//, `${homedir()}/`), "utf8"); }
  catch { throw new Error("Không đọc được QA_ROLE_ENV; cần stack và tài khoản QA thật."); }
  const values: Record<string, string> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return { ...values, ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined)) };
}

async function login(page: Page, role: "ADMIN" | "SALES" | "CUSTOMER", email = accounts[`ROLE_${role}_EMAIL`], password = accounts[`ROLE_${role}_PASSWORD`]) {
  if (!email || !password) throw new Error(`Thiếu tài khoản QA ${role}.`);
  const customer = role === "CUSTOMER";
  await page.goto(customer ? "/login" : "/staff/login");
  await page.getByLabel(customer ? messages.customerAuth.identifier : messages.employeeAuth.identifier, { exact: true }).fill(email);
  await page.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password)
    .catch(() => { throw new Error("Không nhập được mật khẩu đăng nhập."); });
  const result = page.waitForResponse((response) => response.url().endsWith(customer ? "/api/auth/login" : "/api/auth/staff/login") && response.request().method() === "POST");
  await page.getByRole("button", { name: customer ? messages.customerAuth.login : messages.employeeAuth.login, exact: true }).click();
  expect((await result).status(), `Đăng nhập ${role}`).toBe(200);
  await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?)$/);
}

async function grants(request: APIRequestContext) {
  const response = await request.get(matrixPath);
  expect(response.status(), "Đọc ma trận qua BFF").toBe(200);
  return decodePlatform(await response.json(), roleMatrixSchema).SALES;
}

async function members(request: APIRequestContext) {
  const all: z.infer<typeof memberSchema>[] = [];
  for (let page = 1; ; page++) {
    const response = await request.get(`${membershipsPath}?page=${page}&limit=20`);
    expect(response.status(), "Đọc memberships qua BFF").toBe(200);
    const result = decodePlatform(await response.json(), pageSchema(memberSchema));
    all.push(...result.items);
    if (result.items.length < result.limit) return all;
  }
}

async function restoreGrants() {
  if (!originalGrants) return;
  let response = await admin.request.put(`${matrixPath}/roles/SALES`, { data: { actions: originalGrants } });
  if (response.status() === 401) {
    await login(adminPage, "ADMIN");
    response = await admin.request.put(`${matrixPath}/roles/SALES`, { data: { actions: originalGrants } });
  }
  expect(response.status(), "Khôi phục grants SALES").toBe(200);
  expect([...new Set(await grants(admin.request))].sort()).toEqual([...new Set(originalGrants)].sort());
}

async function restoreStatus() {
  if (!originalMember) return;
  let response = await admin.request.patch(`${membershipsPath}/${originalMember.id}`, { data: { status: originalMember.status } });
  if (response.status() === 401) {
    await login(adminPage, "ADMIN");
    response = await admin.request.patch(`${membershipsPath}/${originalMember.id}`, { data: { status: originalMember.status } });
  }
  expect(response.status(), "Khôi phục status SALES").toBe(200);
  expect((await members(admin.request)).find((member) => member.id === originalMember?.id)?.status).toBe(originalMember.status);
}

async function togglePermission(enabled: boolean) {
  await adminPage.goto("/platform/role-matrix");
  await adminPage.getByRole("radio", { name: "SALES", exact: true }).click();
  const checkbox = adminPage.getByRole("checkbox", { name: permission, exact: true });
  await checkbox.setChecked(enabled);
  const saved = adminPage.waitForResponse((response) => response.url().endsWith(`${matrixPath}/roles/SALES`) && response.request().method() === "PUT");
  await adminPage.getByRole("button", { name: "Lưu thay đổi", exact: true }).click();
  expect((await saved).status(), "Lưu ma trận bằng UI").toBe(200);
  await expect(adminPage.getByText("Đã cập nhật quyền của SALES.", { exact: true }).first()).toBeVisible();
  expect((await grants(admin.request)).includes(permission)).toBe(enabled);
}

async function openMemberships(page: Page) {
  await page.goto("/memberships");
  if (!new URL(page.url()).pathname.startsWith("/staff/switch-")) return;
  if (!originalMember) throw new Error("Chưa có membership MAIN.");
  if (new URL(page.url()).pathname === "/staff/switch-org") {
    await page.getByLabel(messages.employeeAuth.company, { exact: true }).selectOption(originalMember.branch_id);
    await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
    await page.waitForURL(/\/(console|staff\/switch-branch)(\?|$)/);
  }
  if (new URL(page.url()).pathname === "/staff/switch-branch") {
    await page.getByLabel(messages.employeeAuth.branch, { exact: true }).selectOption(originalMember.branch_id);
    await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
    await page.waitForURL(/\/console$/);
  }
  await page.goto("/memberships");
}

async function membershipRow(page: Page) {
  if (!originalMember) throw new Error("Chưa có membership SALES gốc.");
  await openMemberships(page);
  for (;;) {
    await expect(page.getByRole("heading", { name: t.title, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: t.editRoles, exact: true }).first()).toBeVisible();
    await expect(page.getByRole("status", { name: t.loading })).toBeHidden();
    const row = page.getByRole("row").filter({ has: page.getByText(originalMember.user_id, { exact: true }) });
    if (await row.count()) return row;
    const next = page.getByRole("button", { name: t.next, exact: true });
    await expect(next, "Tìm membership SALES qua phân trang UI").toBeEnabled();
    const loaded = page.waitForResponse((response) => response.url().includes(`${membershipsPath}?`) && response.request().method() === "GET");
    await next.click();
    expect((await loaded).status()).toBe(200);
  }
}

async function changeStatus(page: Page, suspended: boolean) {
  const row = await membershipRow(page);
  const changed = page.waitForResponse((response) => response.url().endsWith(`${membershipsPath}/${originalMember?.id}`) && response.request().method() === "PATCH");
  await row.getByRole("button", { name: suspended ? t.suspend : t.activate, exact: true }).click();
  expect((await changed).status()).toBe(200);
  await expect(row.getByText(suspended ? t.SUSPENDED : t.ACTIVE, { exact: true })).toBeVisible();
}

async function inviteLink(request: APIRequestContext, email: string) {
  const mailpit = "http://127.0.0.1:8025/api/v1";
  let id: string | undefined;
  await expect.poll(async () => {
    const response = await request.get(`${mailpit}/search`, { params: { query: `to:${email}` } });
    expect(response.status(), "Mailpit search").toBe(200);
    const result = mailListSchema.parse(await response.json());
    id = result.messages.find((mail) => mail.To.some((recipient) => recipient.Address.toLowerCase() === email))?.ID;
    return Boolean(id);
  }, { timeout: 30_000, message: "Mail mời đúng người nhận phải tới Mailpit" }).toBe(true);
  const response = await request.get(`${mailpit}/message/${encodeURIComponent(id ?? "")}`);
  expect(response.status()).toBe(200);
  const mail = mailSchema.parse(await response.json());
  expect(mail.To.some((recipient) => recipient.Address.toLowerCase() === email)).toBe(true);
  const match = `${mail.Text}\n${mail.HTML}`.match(/https?:\/\/[^\s<>"']*\/invite\/accept\?token=[^\s<>"']+/);
  if (!match) throw new Error("Mail không có link nhận lời mời.");
  const url = new URL(match[0].replace(/&amp;/g, "&"));
  if (!url.searchParams.get("token")) throw new Error("Link mời thiếu token.");
  return `${url.pathname}${url.search}`;
}

test.use({ trace: "off", screenshot: "off", video: "off" });

test.describe("RBAC trên stack thật", () => {
  test.describe.configure({ mode: "serial", timeout: 120_000 });

  test.beforeAll(async ({ browser, baseURL }) => {
    accounts = readAccounts();
    admin = await browser.newContext({ baseURL });
    adminPage = await admin.newPage();
    await login(adminPage, "ADMIN");
    originalGrants = await grants(admin.request);
    expect(originalGrants).toContain(permission);
    const sales = (await members(admin.request)).filter((member) => member.user_id === accounts.ROLE_SALES_USER_ID);
    expect(sales, "QA SALES có đúng một membership MAIN").toHaveLength(1);
    originalMember = sales[0];
    expect(originalMember.status).toBe("ACTIVE");
  });

  test.afterAll(async () => {
    if (!admin) return;
    try { await restoreStatus(); }
    finally {
      try { await restoreGrants(); }
      finally { await admin.close(); }
    }
  });

  test("1. ADMIN tắt rồi bật sales:product:read bằng ma trận", async ({ page }) => {
    await login(page, "SALES");
    expect((await page.request.get(productPath)).status()).toBe(200);
    try {
      await togglePermission(false);
      expect((await page.request.get(productPath)).status(), "Request kế tiếp sau revoke").toBe(403);
      await togglePermission(true);
      expect((await page.request.get(productPath)).status(), "Request kế tiếp sau grant").toBe(200);
    } finally { await restoreGrants(); }
  });

  test("2. SALES đang đăng nhập bị chặn rồi truy cập lại với cùng phiên", async ({ page }) => {
    await login(page, "SALES");
    const before = (await page.context().cookies()).find((cookie) => cookie.name === "access_token")?.value;
    expect(Boolean(before), "Phiên SALES có access cookie").toBe(true);
    try {
      await togglePermission(false);
      expect((await page.request.get(productPath)).status()).toBe(403);
      await togglePermission(true);
      expect((await page.request.get(productPath)).status()).toBe(200);
      const after = (await page.context().cookies()).find((cookie) => cookie.name === "access_token")?.value;
      expect(after === before, "SALES dùng cùng access token, không đăng nhập lại").toBe(true);
    } finally { await restoreGrants(); }
  });

  test("3. CUSTOMER không mở được khu quản trị và ma trận", async ({ page }) => {
    await login(page, "CUSTOMER");
    await page.goto("/platform");
    await expect.poll(async () => {
      const redirected = !new URL(page.url()).pathname.startsWith("/platform");
      const denied = await page.getByText(/Tài khoản này không có quyền mở nội dung|Bạn không có quyền/).isVisible();
      return redirected || denied;
    }).toBe(true);
    await expect(page.getByRole("heading", { name: "Ma trận quyền", exact: true })).toHaveCount(0);
    expect((await page.request.get(matrixPath)).status()).toBe(403);
  });

  test("4. ADMIN khoá rồi mở membership SALES bằng UI", async ({ page }) => {
    await login(page, "SALES");
    expect((await page.request.get(productPath)).status()).toBe(200);
    try {
      await changeStatus(adminPage, true);
      expect((await page.request.get(productPath)).status(), "SALES mất quyền ngay khi SUSPENDED").toBe(403);
      await changeStatus(adminPage, false);
      expect((await page.request.get(productPath)).status(), "SALES truy cập lại khi ACTIVE").toBe(200);
    } finally { await restoreStatus(); }
  });

  test("5. ADMIN mời SALES, nhận mail, đặt mật khẩu và đăng nhập nhân viên", async ({ page }) => {
    const email = `s9-${randomUUID()}@dcentervn.local`;
    const password = `S9-${randomUUID()}!`;
    await openMemberships(adminPage);
    await adminPage.getByRole("button", { name: t.add, exact: true }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByLabel(t.name, { exact: true }).fill("S9 SALES");
    await dialog.getByLabel(t.email, { exact: true }).fill(email);
    await expect(dialog.getByRole("checkbox", { name: t.roleLabels.SALES, exact: true })).toBeChecked();
    const created = adminPage.waitForResponse((response) => response.url().endsWith(membershipsPath) && response.request().method() === "POST");
    await dialog.getByRole("button", { name: t.save, exact: true }).click();
    const response = await created;
    expect(response.status()).toBe(201);
    const member = decodePlatform(await response.json(), memberSchema);
    expect(member.role_codes).toEqual(["SALES"]);
    await expect(dialog).toBeHidden();
    const link = await inviteLink(page.request, email);
    try { await page.goto(link); }
    catch { throw new Error("Không mở được link mời từ Mailpit."); }
    await page.getByLabel(messages.employeeAuth.newPassword, { exact: true }).fill(password)
      .catch(() => { throw new Error("Không nhập được mật khẩu mới."); });
    await page.getByLabel(messages.employeeAuth.confirmPassword, { exact: true }).fill(password)
      .catch(() => { throw new Error("Không nhập được xác nhận mật khẩu."); });
    const accepted = page.waitForResponse((result) => result.url().endsWith("/api/auth/staff/invite/accept") && result.request().method() === "POST");
    await page.getByRole("button", { name: messages.employeeAuth.invite, exact: true }).click();
    expect((await accepted).status()).toBe(200);
    await expect(page.getByRole("status")).toHaveText(messages.employeeAuth.inviteDone);
    await login(page, "SALES", email, password);
    await expect(page.getByRole("link", { name: "Bảng giá", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Thành viên", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ma trận quyền", exact: true })).toHaveCount(0);
    expect((await page.request.get(membershipsPath)).status()).toBe(403);
    expect((await page.request.get(matrixPath)).status()).toBe(403);
    const persisted = (await members(admin.request)).find((item) => item.id === member.id);
    expect(persisted).toEqual(member);
    expect([...new Set(await grants(admin.request))].sort()).toEqual([...new Set(originalGrants)].sort());
  });
});
