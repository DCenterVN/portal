import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { expect, type Page, type APIRequestContext } from "@playwright/test";
import { z } from "zod";
import messages from "../../messages/vi.json" with { type: "json" };

export const a = messages.account;
const accounts = new Map<string, string>();
for (const line of readFileSync(`${homedir()}/work/ticket/.cache/e2e/accounts.env`, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (match) accounts.set(match[1], match[2].trim().replace(/^(["\x27])(.*)\1$/, "$2"));
}
export function credentials(role: string) {
  const email = accounts.get(`E2E_${role}_EMAIL`);
  const password = accounts.get(`E2E_${role}_PASSWORD`);
  if (!email || !password) throw Error(`Thiếu tài khoản ${role}`);
  return { email, password };
}
export function response(page: Page, path: string, method: string) {
  return page.waitForResponse(res => new URL(res.url()).pathname === path && res.request().method() === method);
}
export async function login(page: Page, email: string, password: string, staff = false) {
  await page.goto(staff ? "/staff/login" : "/login");
  const form = staff ? page : page.getByRole("dialog");
  const labels = staff ? messages.employeeAuth : messages.customerAuth;
  await form.getByLabel(labels.identifier, { exact: true }).fill(email);
  await form.getByLabel(labels.password, { exact: true }).fill(password).catch(secretInputFailure);
  const logged = response(page, staff ? "/api/auth/staff/login" : "/api/auth/login", "POST");
  await form.getByRole("button", { name: labels.login, exact: true }).click();
  expect((await logged).status(), "Đăng nhập thành công").toBe(200);
  await page.waitForURL(url => staff ? !url.pathname.startsWith("/staff/login") : url.pathname === "/" && !url.searchParams.has("auth"));
  if (staff) await enterFirstBranch(page);
  await page.goto(staff ? "/account" : "/me");
  if (staff && new URL(page.url()).pathname.startsWith("/staff/switch-")) {
    await enterFirstBranch(page);
    await page.goto("/account");
  }
  if (staff) {
    await expect(page.getByRole("tab", { name: messages.record.info, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: messages.record.personal, level: 2 })).toBeVisible();
  } else {
    await expect(page.getByRole("heading", { name: a.title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: a.displayName, level: 2 })).toBeVisible();
  }
}
export async function enterFirstBranch(page: Page) {
  if (!new URL(page.url()).pathname.startsWith("/staff/switch-")) return;
  const first = page.getByRole("option").first();
  if (await first.waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false)) await first.click();
  await page.waitForURL(url => !url.pathname.startsWith("/staff/switch-"));
}
function secretInputFailure(): never { throw Error("Không nhập được trường bảo mật"); }
export async function saveName(page: Page, name: string) {
  const nameSection = page.getByLabel(a.displayName, { exact: true }).locator("xpath=ancestor::form");
  const input = nameSection.getByLabel(a.displayName, { exact: true });
  await input.waitFor({ state: "visible" });
  if ((await input.inputValue()) === name) return;
  await input.fill(name);
  const saved = response(page, "/api/auth/profile", "PATCH");
  await nameSection.getByRole("button", { name: a.save, exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(nameSection.getByRole("button", { name: a.save, exact: true })).toBeDisabled();
}
const mailboxSchema = z.object({ messages: z.array(z.object({ ID: z.string(), To: z.array(z.object({ Address: z.string() })) })) });
export const mailSchema = z.object({ Text: z.string(), HTML: z.string() });
export async function mailIds(page: Page, email: string) {
  const res = await page.context().request.get("http://127.0.0.1:8025/api/v1/messages?limit=100");
  expect(res.status(), "Đọc Mailpit thật").toBe(200);
  return mailboxSchema.parse(await res.json()).messages.filter(mail => mail.To.some(to => to.Address === email)).map(mail => mail.ID);
}
export async function changeEmail(page: Page, email: string, password: string, confirmed: () => void) {
  const previous = new Set(await mailIds(page, email));
  const emailRow = page.locator("dt", { hasText: a.email }).locator("..");
  await emailRow.getByRole("button", { name: a.change, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: a.changeEmail, exact: true })).toBeVisible();
  await dialog.getByLabel(a.newEmail, { exact: true }).fill(email);
  await dialog.getByLabel(a.currentPassword, { exact: true }).fill(password).catch(secretInputFailure);
  const sent = response(page, "/api/auth/email/change", "POST");
  await dialog.getByRole("button", { name: a.sendConfirmation, exact: true }).click();
  expect((await sent).status(), "Gửi yêu cầu đổi email").toBe(202);
  await expect(dialog).toBeHidden();
  let id = "";
  await expect.poll(async function newMail() {
    id = (await mailIds(page, email)).find(value => !previous.has(value)) || "";
    return Boolean(id);
  }, { timeout: 45_000, message: "Nhận thư xác nhận mới trong Mailpit" }).toBe(true);
  const mailResponse = await page.context().request.get(`http://127.0.0.1:8025/api/v1/message/${id}`);
  const mail = mailSchema.parse(await mailResponse.json());
  const links = `${mail.Text}\n${mail.HTML}`.match(/https?:\/\/[^\s<>"\x27]+/g) || [];
  const link = links.map(value => new URL(value.replaceAll("&amp;", "&"))).find(url => url.pathname === "/email/confirm" && url.searchParams.has("token"));
  expect(Boolean(link), "Thư Mailpit phải chứa liên kết /email/confirm").toBe(true);
  const local = new URL(page.url());
  local.pathname = link!.pathname;
  local.search = link!.search;
  await page.goto(local.href).catch(function navigationFailure() { throw Error("Không mở được trang xác nhận"); });
  await expect(page).toHaveURL(/\/email\/confirm$/);
  const done = response(page, "/api/auth/email/confirm", "POST");
  await page.getByRole("button", { name: a.confirm, exact: true }).click();
  const result = await done;
  if (result.ok()) confirmed();
  expect(result.status(), "Xác nhận đổi email").toBe(200);
  await expect(page.getByText(a.emailConfirmed, { exact: true })).toBeVisible();
}
export async function changePassword(page: Page, current: string, next: string, changed: () => void) {
  const passwordRow = page.locator("dt", { hasText: a.password }).locator("..");
  await passwordRow.getByRole("button", { name: a.change, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: a.changePassword, exact: true })).toBeVisible();
  await dialog.getByLabel(a.currentPassword, { exact: true }).fill(current).catch(secretInputFailure);
  await dialog.getByLabel(a.newPassword, { exact: true }).fill(next).catch(secretInputFailure);
  await dialog.getByLabel(a.repeatPassword, { exact: true }).fill(next).catch(secretInputFailure);
  const done = response(page, "/api/auth/password/change", "POST");
  await dialog.getByRole("button", { name: a.changePassword, exact: true }).click();
  const result = await done;
  if (result.ok()) changed();
  expect(result.status(), "Đổi mật khẩu thành công").toBe(204);
  await page.waitForURL(url => url.pathname === "/login" || url.pathname === "/staff/login" || url.searchParams.get("auth") === "login");
}
export async function resetPhoneKong(request: APIRequestContext, email: string, password: string) {
  const loginRes = await request.post("http://localhost:8000/auth/web/login", {
    data: { email, password },
  });
  if (!loginRes.ok()) throw Error("Không đăng nhập được Kong để dọn dẹp số điện thoại");
  const data = await loginRes.json();
  const token = data.access_token;
  if (!token) throw Error("Thiếu token từ Kong để dọn dẹp số điện thoại");
  for (let attempt = 0; attempt < 3; attempt++) {
    const patchRes = await request.patch("http://localhost:8000/auth/profile", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      data: {
        phone: "",
        current_password: password,
      },
    });
    if (patchRes.status() === 429) {
      const retryHeader = patchRes.headers()["retry-after"];
      const delay = (Number(retryHeader) || 60) * 1000;
      await new Promise(resolve => { setTimeout(resolve, delay); });
      continue;
    }
    expect(patchRes.status(), "Dọn dẹp số điện thoại về rỗng qua Kong").toBe(200);
    break;
  }
}
