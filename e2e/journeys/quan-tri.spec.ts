import { randomUUID } from "node:crypto";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { z } from "zod";
import { decodePlatform, pageSchema } from "../../lib/api/platform-contract";
import messages from "../../messages/vi.json" with { type: "json" };
import { enterFirstBranch } from "../account/helpers";

const t = messages.memberships;
const c = messages.customerAuth;
const membershipsPath = "/api/org/company/memberships";

const productsPath = "/api/sales/products";

const memberSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid(), branch_id: z.string().uuid(),
  role_codes: z.array(z.string()).nullable().transform(value => value ?? []),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
type Member = z.infer<typeof memberSchema>;

function mutation(page: Page, path: string, method: string) {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === method);
}

async function members(context: BrowserContext) {
  const all: Member[] = [];
  for (let page = 1; ; page++) {
    const response = await context.request.get(`${membershipsPath}?page=${page}&limit=20`);
    expect(response.status(), "Đọc danh sách nhân viên").toBe(200);
    const result = decodePlatform(await response.json(), pageSchema(memberSchema));
    all.push(...result.items);
    if (result.items.length < result.limit) return all;
  }
}

async function enterCompany(page: Page) {
  await page.goto("/memberships");
  await enterFirstBranch(page);
}

async function memberRow(page: Page, member: Member) {
  const loaded = page.waitForResponse(response => new URL(response.url()).pathname === membershipsPath && response.request().method() === "GET");
  await page.goto("/memberships");
  let response = await loaded;
  for (;;) {
    expect(response.status()).toBe(200);
    const result = decodePlatform(await response.json(), pageSchema(memberSchema));
    await expect(page.getByRole("status", { name: t.loading })).toBeHidden();
    await expect(page.getByRole("button", { name: t.editRoles, exact: true })).toHaveCount(result.items.length);
    const index = result.items.findIndex(item => item.id === member.id);
    if (index >= 0) {
      // UI chưa hiện tên/email; dùng thứ tự GET của chính trang đang xem.
      return page.getByRole("row").filter({ has: page.getByRole("button", { name: t.editRoles, exact: true }) }).nth(index);
    }
    const next = page.getByRole("button", { name: t.next, exact: true });
    await expect(next, "Nhân viên phải có trong phân trang UI").toBeEnabled();
    const nextPage = page.waitForResponse(item => new URL(item.url()).pathname === membershipsPath && item.request().method() === "GET");
    await next.click();
    response = await nextPage;
  }
}

async function changeStatus(page: Page, member: Member, suspended: boolean, status = 200) {
  const row = await memberRow(page, member);
  const changed = mutation(page, `${membershipsPath}/${member.id}`, "PATCH");
  await row.getByRole("button", { name: suspended ? t.suspend : t.activate, exact: true }).click();
  expect((await changed).status(), "Kết quả khoá/mở đúng nhân viên").toBe(status);
  if (status === 200) await expect(row.getByText(suspended ? t.SUSPENDED : t.ACTIVE, { exact: true })).toBeVisible();
}

async function login(page: Page, email: string, password: string, customer: boolean) {
  await page.goto(customer ? "/login" : "/staff/login");
  const form = customer ? page.getByRole("dialog") : page;
  const labels = customer ? c : messages.employeeAuth;
  await form.getByLabel(labels.identifier, { exact: true }).fill(email);
  await form.getByLabel(labels.password, { exact: true }).fill(password)
    .catch(() => { throw new Error("Không nhập được mật khẩu đăng nhập."); });
  const logged = mutation(page, customer ? "/api/auth/login" : "/api/auth/staff/login", "POST");
  await form.getByRole("button", { name: labels.login, exact: true }).click();
  expect((await logged).status(), "Đăng nhập tài khoản vừa tạo").toBe(200);
  await page.waitForURL(url => customer ? url.pathname === "/" : /^\/(console|platform(?:\/role-matrix)?)\/?$/.test(url.pathname));
  if (customer) await expect(page.getByRole("dialog")).toBeHidden();
  expect((await page.context().cookies()).some(cookie => cookie.name === "access_token")).toBe(true);
}

test("QUẢN TRỊ: ADMIN đi các màn quản trị, tạo nhân viên Bán hàng, khoá và mở lại, bảo vệ ADMIN cuối", async ({ browser }, info) => {
  test.setTimeout(300_000);
  const video = process.env.E2E_RECORD === "1" ? {
    recordVideo: { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top" as const, fontSize: 22 } },
  } : {};
  const admin = await browser.newContext({ storageState: process.env.PORTAL_ADMIN_STATE, ...video });
  const sales = await browser.newContext({ ...video });
  for (const context of [admin, sales]) context.setDefaultTimeout(15_000);
  const adminPage = await admin.newPage();
  const salesPage = await sales.newPage();
  const suffix = Date.now();
  const salesEmail = `sales-s0-${suffix}@dcentervn.local`;
  const initialPassword = `S0-${randomUUID()}!`;
  let newMember: Member | undefined;
  let salesSuspended = false;
  let session = "";
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, async () => {
      const overlay = await adminPage.screencast.showOverlay(`<div style="position:absolute;bottom:8px;left:8px;right:8px;padding:12px;background:#222;color:white;font-size:22px">${name}</div>`);
      try { await action(); } finally { await overlay.dispose(); }
    });
  }
  try {
    await step("Bước 1: ADMIN vào công ty và đi các màn quản trị: tổng quan, thành viên, chi nhánh, công ty và vai trò", async () => {
      await enterCompany(adminPage);
      for (const [path, name] of [["/console", "tong-quan"], ["/memberships", "thanh-vien"], ["/branches", "chi-nhanh"], ["/company", "vai-tro-cong-ty"]] as const) {
        const response = await adminPage.goto(path);
        expect(response?.status(), `Mở ${path}`).toBeLessThan(400);
        expect(new URL(adminPage.url()).pathname, `ADMIN không bị đẩy khỏi ${path}`).toBe(path);
        await adminPage.screenshot({ timeout: 10_000 }).then(body => info.attach(`quan-tri-${name}`, { body, contentType: "image/png" })).catch(() => {});
      }
    });
    await step("Bước 2: ADMIN tạo nhân viên Bán hàng mới, điền đủ tên, email, mật khẩu, chọn vai trò", async () => {
      await adminPage.goto("/memberships");
      await adminPage.getByRole("button", { name: t.add, exact: true }).click();
      const dialog = adminPage.getByRole("dialog");
      await dialog.getByLabel(t.name, { exact: true }).fill(`Bán hàng S0 ${suffix}`);
      await dialog.getByLabel(t.email, { exact: true }).fill(salesEmail);
      await dialog.getByLabel(t.password, { exact: true }).fill(initialPassword)
        .catch(() => { throw new Error("Không nhập được mật khẩu nhân viên."); });
      await expect(dialog.getByRole("checkbox", { name: t.roleLabels.SALES, exact: true })).toBeChecked();
      await info.attach("form-nhan-vien", { body: await adminPage.screenshot(), contentType: "image/png" });
      const created = mutation(adminPage, membershipsPath, "POST");
      await dialog.getByRole("button", { name: t.save, exact: true }).click();
      const response = await created;
      expect(response.status()).toBe(201);
      newMember = decodePlatform(await response.json(), memberSchema);
      expect(newMember.role_codes).toEqual(["SALES"]);
      expect(newMember.status).toBe("ACTIVE");
      await expect(dialog).toBeHidden();
      expect((await members(admin)).find(member => member.id === newMember?.id)).toEqual(newMember);
    });
    await step("Bước 3: SALES mới đăng nhập ngay, thấy Bảng giá và đọc được sản phẩm", async () => {
      await login(salesPage, salesEmail, initialPassword, false);
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toBeVisible();
      expect((await sales.request.get(productsPath)).status()).toBe(200);
      expect((await sales.request.get(membershipsPath)).status()).toBe(403);
      session = (await sales.cookies()).find(cookie => cookie.name === "access_token")?.value ?? "";
      expect(Boolean(session)).toBe(true);
    });
    await step("Bước 4: ADMIN khoá SALES, yêu cầu kế tiếp trả 403 và menu Bảng giá biến mất", async () => {
      if (!newMember) throw new Error("Chưa tạo nhân viên SALES.");
      await changeStatus(adminPage, newMember, true);
      salesSuspended = true;
      expect((await members(admin)).find(member => member.id === newMember?.id)?.status).toBe("SUSPENDED");
      expect((await sales.request.get(productsPath)).status(), "Không chờ hết hạn phiên").toBe(403);
      await salesPage.reload();
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toHaveCount(0);
      expect((await sales.cookies()).find(cookie => cookie.name === "access_token")?.value === session, "Giữ phiên SALES khi bị khoá").toBe(true);
    });
    await step("Bước 5: ADMIN mở lại SALES, cùng phiên đọc được sản phẩm và thấy lại Bảng giá", async () => {
      if (!newMember) throw new Error("Chưa tạo nhân viên SALES.");
      await changeStatus(adminPage, newMember, false);
      salesSuspended = false;
      expect((await members(admin)).find(member => member.id === newMember?.id)?.status).toBe("ACTIVE");
      expect((await sales.request.get(productsPath)).status()).toBe(200);
      await salesPage.goto("/console");
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toBeVisible();
      expect((await sales.cookies()).find(cookie => cookie.name === "access_token")?.value === session, "Có lại quyền không đăng nhập lại").toBe(true);
    });
    await step("Bước 6: Thử khoá ADMIN cuối cùng bị chặn 409, dữ liệu giữ nguyên", async () => {
      const admins = (await members(admin)).filter(member => member.status === "ACTIVE" && member.role_codes.includes("ADMIN"));
      expect(admins, "DEV phải có đúng một ADMIN hoạt động để chứng minh invariant, không khoá nhân viên có sẵn làm fixture").toHaveLength(1);
      const lastAdmin = admins[0];
      await info.attach("admin-cuoi-truoc", { body: JSON.stringify(lastAdmin), contentType: "application/json" });
      await changeStatus(adminPage, lastAdmin, true, 409);
      await expect(adminPage.getByText(t.lastAdmin, { exact: true })).toBeVisible();
      expect((await members(admin)).find(member => member.id === lastAdmin.id)).toEqual(lastAdmin);
    });
    await step("Bước 7: Thử hạ ADMIN cuối xuống Bán hàng bị chặn 409, vai trò vẫn giữ nguyên", async () => {
      const before = (await members(admin)).find(member => member.status === "ACTIVE" && member.role_codes.includes("ADMIN"));
      if (!before) throw new Error("Không có ADMIN hoạt động.");
      const row = await memberRow(adminPage, before);
      await row.getByRole("button", { name: t.editRoles, exact: true }).click();
      const dialog = adminPage.getByRole("dialog");
      await dialog.getByRole("checkbox", { name: t.roleLabels.ADMIN, exact: true }).uncheck();
      await dialog.getByRole("checkbox", { name: t.roleLabels.SALES, exact: true }).check();
      const changed = mutation(adminPage, `${membershipsPath}/${before.id}/roles`, "PUT");
      await dialog.getByRole("button", { name: t.save, exact: true }).click();
      expect((await changed).status()).toBe(409);
      await expect(dialog.getByText(t.lastAdmin, { exact: true })).toBeVisible();
      expect((await members(admin)).find(member => member.id === before.id)).toEqual(before);
      await dialog.getByRole("button", { name: t.cancel, exact: true }).click();
    });
  } finally {
    const memberToRestore = newMember;
    if (salesSuspended && memberToRestore) await test.step("Khôi phục: mở lại nhân viên SALES vừa tạo bằng UI", () => changeStatus(adminPage, memberToRestore, false));
    for (const [name, context, page] of [["admin", admin, adminPage], ["sales", sales, salesPage]] as const) {
      await page.screenshot({ path: info.outputPath(`${name}-cuoi.png`), fullPage: true }).catch(() => {});
      const recording = page.video();
      await context.close();
      if (recording) await info.attach(`video-${name}`, { path: await recording.path(), contentType: "video/webm" });
    }
  }
});
