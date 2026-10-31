import { randomUUID } from "node:crypto";
import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import { z } from "zod";
import { decodePlatform, pageSchema } from "../../lib/api/platform-contract";
import messages from "../../messages/vi.json" with { type: "json" };

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

async function enterCompany(page: Page, branchId: string) {
  await page.goto("/memberships");
  if (new URL(page.url()).pathname === "/staff/switch-org") {
    await page.getByLabel(messages.employeeAuth.company, { exact: true }).selectOption(branchId);
    await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
    await page.waitForURL(/\/(console|staff\/switch-branch)(\?|$)/);
  }
  if (new URL(page.url()).pathname === "/staff/switch-branch") {
    await page.getByLabel(messages.employeeAuth.branch, { exact: true }).selectOption(branchId);
    await page.getByRole("button", { name: messages.employeeAuth.continue, exact: true }).click();
    await page.waitForURL(/\/console$/);
  }
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

test("KHÁCH + QUẢN TRỊ: kích hoạt email, SALES mất và lấy lại quyền, bảo vệ ADMIN cuối", async ({ browser }, info) => {
  test.setTimeout(300_000);
  const video = process.env.E2E_RECORD === "1" ? {
    recordVideo: { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top" as const, fontSize: 22 } },
  } : {};
  const customer = await browser.newContext({ ...video });
  const admin = await browser.newContext({ storageState: process.env.PORTAL_ADMIN_STATE, ...video });
  const sales = await browser.newContext({ ...video });
  for (const context of [customer, admin, sales]) context.setDefaultTimeout(15_000);
  const customerPage = await customer.newPage();
  const adminPage = await admin.newPage();
  const salesPage = await sales.newPage();
  const suffix = Date.now();
  const customerEmail = `khach-s6-${suffix}@dcentervn.local`;
  const salesEmail = `sales-s6-${suffix}@dcentervn.local`;
  const initialPassword = `S6-${randomUUID()}!`;
  const chosenPassword = `S6-${randomUUID()}!`;
  let activationLink = "";
  let newMember: Member | undefined;
  let salesSuspended = false;
  let session = "";
  const outcomes: { step: string; status: string }[] = [];
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, async () => {
      try { await action(); outcomes.push({ step: name, status: "PASS" }); }
      catch (error) { outcomes.push({ step: name, status: "FAIL" }); throw error; }
    });
  }
  try {
    await step("Bước 1: Khách đăng ký bằng email mới và được nhắc kiểm tra hộp thư", async () => {
      await customerPage.goto("/register");
      const form = customerPage.getByRole("dialog");
      await form.getByLabel(c.displayName, { exact: true }).fill(`Khách S6 ${suffix}`);
      await form.getByLabel(c.email, { exact: true }).fill(customerEmail);
      await form.getByLabel(c.password, { exact: true }).fill(initialPassword)
        .catch(() => { throw new Error("Không nhập được mật khẩu đăng ký."); });
      const registered = mutation(customerPage, "/api/auth/register", "POST");
      await form.getByRole("button", { name: c.createAccount, exact: true }).click();
      expect((await registered).status()).toBe(202);
      await expect(form.getByText(c.checkInbox, { exact: true })).toBeVisible();
      await expect(form).toContainText(customerEmail);
      expect((await customer.cookies()).some(cookie => cookie.name === "access_token")).toBe(false);
    });
    await step("Bước 2: Đọc đúng email kích hoạt của khách mới trong Mailpit", async () => {
      const mailSchema = z.object({ messages: z.array(z.object({ ID: z.string(), To: z.array(z.object({ Address: z.string() })) })) });
      let mailID = "";
      await expect.poll(async () => {
        const response = await customer.request.get("http://localhost:8025/api/v1/messages?limit=100");
        expect(response.status()).toBe(200);
        const mailbox = mailSchema.parse(await response.json());
        mailID = mailbox.messages.find(mail => mail.To.some(to => to.Address === customerEmail))?.ID ?? "";
        return Boolean(mailID);
      }, { timeout: 45_000, message: "Mailpit phải nhận email cho khách vừa đăng ký" }).toBe(true);
      const response = await customer.request.get(`http://localhost:8025/api/v1/message/${mailID}`);
      expect(response.status()).toBe(200);
      const mail = z.object({ To: z.array(z.object({ Address: z.string() })), Text: z.string(), HTML: z.string() }).parse(await response.json());
      expect(mail.To.map(to => to.Address)).toContain(customerEmail);
      const links = `${mail.Text}\n${mail.HTML}`.match(/https?:\/\/[^\s<>"']+/g) ?? [];
      activationLink = links.map(link => link.replace(/&amp;/g, "&")).find(link => {
        const url = new URL(link);
        return url.pathname === "/activate" && Boolean(url.searchParams.get("token"));
      }) ?? "";
      expect(Boolean(activationLink), "Email phải có link /activate kèm token").toBe(true);
      await info.attach("email-kich-hoat", { body: JSON.stringify({ recipient: customerEmail, mailID, activationPath: new URL(activationLink).pathname }), contentType: "application/json" });
    });
    await step("Bước 3: Mở link email, tự đặt mật khẩu mới rồi kích hoạt, chưa tự đăng nhập", async () => {
      let activationWrites = 0;
      customerPage.on("request", request => {
        if (new URL(request.url()).pathname === "/api/auth/activate" && request.method() === "POST") activationWrites++;
      });
      await customerPage.goto(activationLink);
      await expect(customerPage.getByLabel(c.newPassword, { exact: true })).toBeVisible();
      expect(activationWrites, "Mở link chưa được tự kích hoạt").toBe(0);
      await customerPage.getByLabel(c.newPassword, { exact: true }).fill(chosenPassword)
        .catch(() => { throw new Error("Không nhập được mật khẩu kích hoạt."); });
      await customerPage.getByLabel(c.confirmPassword, { exact: true }).fill(chosenPassword)
        .catch(() => { throw new Error("Không nhập được xác nhận mật khẩu."); });
      const activated = mutation(customerPage, "/api/auth/activate", "POST");
      await customerPage.getByRole("button", { name: c.activationSubmit, exact: true }).click();
      expect((await activated).status()).toBe(200);
      expect(activationWrites).toBe(1);
      await expect(customerPage.getByText(c.activationDone, { exact: true })).toBeVisible();
      await expect(customerPage.getByRole("link", { name: c.login, exact: true })).toHaveAttribute("href", "/login");
      expect((await customer.cookies()).some(cookie => cookie.name === "access_token")).toBe(false);
    });
    await step("Bước 4: Khách đăng nhập được bằng mật khẩu vừa đặt, không có quyền quản trị", async () => {
      await login(customerPage, customerEmail, chosenPassword, true);
      expect((await customer.request.get("/api/auth/me")).status()).toBe(200);
      expect((await customer.request.get(membershipsPath)).status()).toBe(403);
    });
    await step("Bước 5: ADMIN tạo nhân viên Bán hàng mới, trạng thái đang hoạt động", async () => {
      await enterCompany(adminPage, (await members(admin))[0].branch_id);
      await adminPage.goto("/memberships");
      await adminPage.getByRole("button", { name: t.add, exact: true }).click();
      const dialog = adminPage.getByRole("dialog");
      await dialog.getByLabel(t.name, { exact: true }).fill(`Bán hàng S6 ${suffix}`);
      await dialog.getByLabel(t.email, { exact: true }).fill(salesEmail);
      await dialog.getByLabel(t.password, { exact: true }).fill(initialPassword)
        .catch(() => { throw new Error("Không nhập được mật khẩu nhân viên."); });
      await expect(dialog.getByRole("checkbox", { name: t.roleLabels.SALES, exact: true })).toBeChecked();
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
    await step("Bước 6: SALES mới đăng nhập ngay, thấy Bảng giá và đọc được sản phẩm", async () => {
      await login(salesPage, salesEmail, initialPassword, false);
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toBeVisible();
      expect((await sales.request.get(productsPath)).status()).toBe(200);
      expect((await sales.request.get(membershipsPath)).status()).toBe(403);
      session = (await sales.cookies()).find(cookie => cookie.name === "access_token")?.value ?? "";
      expect(Boolean(session)).toBe(true);
    });
    await step("Bước 7: ADMIN khoá SALES, yêu cầu kế tiếp trả 403 và menu Bảng giá biến mất", async () => {
      if (!newMember) throw new Error("Chưa tạo nhân viên SALES.");
      await changeStatus(adminPage, newMember, true);
      salesSuspended = true;
      expect((await members(admin)).find(member => member.id === newMember?.id)?.status).toBe("SUSPENDED");
      expect((await sales.request.get(productsPath)).status(), "Không chờ hết hạn phiên").toBe(403);
      await salesPage.reload();
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toHaveCount(0);
      expect((await sales.cookies()).find(cookie => cookie.name === "access_token")?.value === session, "Giữ phiên SALES khi bị khoá").toBe(true);
    });
    await step("Bước 8: ADMIN mở lại SALES, cùng phiên đọc được sản phẩm và thấy lại Bảng giá", async () => {
      if (!newMember) throw new Error("Chưa tạo nhân viên SALES.");
      await changeStatus(adminPage, newMember, false);
      salesSuspended = false;
      expect((await members(admin)).find(member => member.id === newMember?.id)?.status).toBe("ACTIVE");
      expect((await sales.request.get(productsPath)).status()).toBe(200);
      await salesPage.goto("/console");
      await expect(salesPage.getByRole("link", { name: "Bảng giá", exact: true })).toBeVisible();
      expect((await sales.cookies()).find(cookie => cookie.name === "access_token")?.value === session, "Có lại quyền không đăng nhập lại").toBe(true);
    });
    await step("Bước 9: Thử khoá ADMIN cuối cùng bị chặn 409, dữ liệu giữ nguyên", async () => {
      const admins = (await members(admin)).filter(member => member.status === "ACTIVE" && member.role_codes.includes("ADMIN"));
      expect(admins, "DEV phải có đúng một ADMIN hoạt động để chứng minh invariant, không khoá nhân viên có sẵn làm fixture").toHaveLength(1);
      const lastAdmin = admins[0];
      await info.attach("admin-cuoi-truoc", { body: JSON.stringify(lastAdmin), contentType: "application/json" });
      await changeStatus(adminPage, lastAdmin, true, 409);
      await expect(adminPage.getByText(t.lastAdmin, { exact: true })).toBeVisible();
      expect((await members(admin)).find(member => member.id === lastAdmin.id)).toEqual(lastAdmin);
    });
    await step("Bước 10: Thử hạ ADMIN cuối xuống Bán hàng bị chặn 409, vai trò vẫn giữ nguyên", async () => {
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
    await info.attach("ket-qua-tung-buoc", { body: JSON.stringify(outcomes, null, 2), contentType: "application/json" });
    const memberToRestore = newMember;
    if (salesSuspended && memberToRestore) await test.step("Khôi phục: mở lại nhân viên SALES vừa tạo bằng UI", () => changeStatus(adminPage, memberToRestore, false));
    for (const [name, context, page] of [["khach", customer, customerPage], ["admin", admin, adminPage], ["sales", sales, salesPage]] as const) {
      await page.screenshot({ path: info.outputPath(`${name}-cuoi.png`), fullPage: true }).catch(() => {});
      const recording = page.video();
      await context.close();
      if (recording) await info.attach(`video-${name}`, { path: await recording.path(), contentType: "video/webm" });
    }
  }
});
