import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { test, expect } from "@playwright/test";
import messages from "../../messages/vi.json" with { type: "json" };

const e2eDir = `${homedir()}/work/ticket/.cache/e2e`;
const accountsPath = `${e2eDir}/accounts.env`;
const accounts: Record<string, string> = {};

test.beforeAll(() => {
  if (!existsSync(accountsPath)) throw new Error("Thiếu ~/work/ticket/.cache/e2e/accounts.env");
  for (const line of readFileSync(accountsPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
    if (match) accounts[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
});

for (const role of ["WAREHOUSE", "ADMIN", "CUSTOMER", "FOODDEV"]) {
  test(`Đăng nhập ${role}`, async ({ page, context }) => {
    const email = accounts[`E2E_${role}_EMAIL`];
    const password = accounts[`E2E_${role}_PASSWORD`];
    test.skip(!email || !password, `Thiếu E2E_${role}_EMAIL hoặc E2E_${role}_PASSWORD`);
    const customer = role === "CUSTOMER";
    await page.goto(customer ? "/login" : "/staff/login");
    const form = customer ? page.getByRole("dialog") : page;
    await form.getByLabel(customer ? messages.customerAuth.identifier : messages.employeeAuth.identifier, { exact: true }).fill(email);
    await form.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password)
      .catch(() => { throw new Error(`Không nhập được mật khẩu ${role}.`); });
    const logged = page.waitForResponse(response => new URL(response.url()).pathname === (customer ? "/api/auth/login" : "/api/auth/staff/login") && response.request().method() === "POST");
    await form.getByRole("button", { name: customer ? messages.customerAuth.login : messages.employeeAuth.login, exact: true }).click();
    expect((await logged).status(), `Đăng nhập ${role}`).toBe(200);
    await page.waitForURL(url => customer ? url.pathname === "/" : /^\/(console|platform(?:\/role-matrix)?)\/?$/.test(url.pathname));
    if (customer) await expect(page.getByRole("dialog")).toBeHidden();
    mkdirSync(`${e2eDir}/state`, { recursive: true });
    await context.storageState({ path: `${e2eDir}/state/${role.toLowerCase()}.json` });
  });
}
