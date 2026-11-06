import { randomUUID } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { z } from "zod";
import messages from "../../messages/vi.json" with { type: "json" };

const c = messages.customerAuth;
const membershipsPath = "/api/org/company/memberships";

function mutation(page: Page, path: string, method: string) {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === method);
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

test("KHÁCH: đăng ký, kích hoạt email, đăng nhập rồi đi các màn cửa hàng", async ({ browser }, info) => {
  test.setTimeout(360_000);
  const video = process.env.E2E_RECORD === "1" ? {
    recordVideo: { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top" as const, fontSize: 22 } },
  } : {};
  const customer = await browser.newContext({ ...video });
  customer.setDefaultTimeout(15_000);
  const customerPage = await customer.newPage();
  const suffix = Date.now();
  const customerEmail = `khach-s0-${suffix}@dcentervn.local`;
  const customerPhone = `09${String(suffix).slice(-8)}`;
  const customerName = `Khách S0 ${suffix}`;
  const initialPassword = `S0-${randomUUID()}!`;
  const chosenPassword = `S0-${randomUUID()}!`;
  let activationLink = "";
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, async () => {
      const overlay = await customerPage.screencast.showOverlay(`<div style="position:absolute;bottom:8px;left:8px;right:8px;padding:12px;background:#222;color:white;font-size:22px">${name}</div>`);
      try { await action(); } finally { await overlay.dispose(); }
    });
  }
  try {
    await step("Bước 1: Khách đăng ký bằng email mới, điền đủ bốn trường và được nhắc kiểm tra hộp thư", async () => {
      await customerPage.goto("/register");
      const form = customerPage.getByRole("dialog");
      await form.getByLabel(c.displayName, { exact: true }).fill(customerName);
      await form.getByLabel(c.email, { exact: true }).fill(customerEmail);
      await form.getByLabel(c.phone, { exact: true }).fill(customerPhone);
      await form.getByLabel(c.password, { exact: true }).fill(initialPassword)
        .catch(() => { throw new Error("Không nhập được mật khẩu đăng ký."); });
      await expect(form.getByLabel(c.displayName, { exact: true })).toHaveValue(customerName);
      await expect(form.getByLabel(c.email, { exact: true })).toHaveValue(customerEmail);
      await expect(form.getByLabel(c.phone, { exact: true })).toHaveValue(customerPhone);
      await expect(form.getByLabel(c.password, { exact: true })).not.toHaveValue("");
      await info.attach("form-dang-ky", { body: await customerPage.screenshot(), contentType: "image/png" });
      const registered = mutation(customerPage, "/api/auth/register", "POST");
      await form.getByRole("button", { name: c.createAccount, exact: true }).click();
      const registeredResponse = await registered;
      expect(registeredResponse.request().postDataJSON()).toMatchObject({ email: customerEmail, display_name: customerName, phone: customerPhone });
      expect(registeredResponse.status()).toBe(202);
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
      await info.attach("form-kich-hoat", { body: await customerPage.screenshot(), contentType: "image/png" });
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
      const me = await customer.request.get("/api/auth/me");
      expect(me.status()).toBe(200);
      const profile = JSON.stringify(await me.json());
      await info.attach("ho-so-khach", { body: profile, contentType: "application/json" });
      expect(profile, "Hồ sơ khách phải có tên đã đăng ký").toContain(customerName);
      expect(profile, "Hồ sơ khách phải có email đã đăng ký").toContain(customerEmail);
      expect((await customer.request.get(membershipsPath)).status()).toBe(403);
    });
    await step("Bước 5: Khách đã đăng nhập đi các màn cửa hàng: trang chủ, sản phẩm, giỏ, đơn hàng, hồ sơ", async () => {
      for (const [path, name] of [["/", "trang-chu"], ["/products", "san-pham"], ["/cart", "gio-hang"], ["/orders", "don-hang"], ["/me", "ho-so"]] as const) {
        const response = await customerPage.goto(path);
        expect(response?.status(), `Mở ${path}`).toBeLessThan(400);
        expect(new URL(customerPage.url()).pathname, `Khách đăng nhập không bị đẩy khỏi ${path}`).toBe(path);
        await expect(customerPage.locator("main, body").first()).toBeVisible();
        await customerPage.screenshot({ timeout: 10_000 }).then(body => info.attach(`khach-${name}`, { body, contentType: "image/png" })).catch(() => {});
      }
      await customerPage.goto("/products");
      const firstProduct = customerPage.locator('a[href^="/products/"]').first();
      if (await firstProduct.count()) {
        await firstProduct.click();
        await customerPage.waitForURL(/\/products\/[^/]+$/);
        await customerPage.screenshot({ timeout: 10_000 }).then(body => info.attach("khach-chi-tiet-san-pham", { body, contentType: "image/png" })).catch(() => {});
      }
    });
  } finally {
    await customerPage.screenshot({ path: info.outputPath("khach-cuoi.png"), fullPage: true }).catch(() => {});
    const recording = customerPage.video();
    await customer.close();
    if (recording) await info.attach("video-khach", { path: await recording.path(), contentType: "video/webm" });
  }
});
