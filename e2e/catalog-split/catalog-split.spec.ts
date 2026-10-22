import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { test, expect, type Page } from "@playwright/test";
import messages from "../../messages/vi.json" with { type: "json" };

const READ = "sales:product:read";
const STAFF_ONLY = /Tạo sản phẩm|Kích hoạt|\bSKU\b|[Bb]arcode|[Mm]ã vạch|DRAFT|Bản nháp/;
type Kind = "CUSTOMER" | "SALES" | "WAREHOUSE" | "PROCESSING_STAFF" | "FOOD_DEV";

function accounts(): Record<string, string> {
  const path = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  let source: string;
  try { source = readFileSync(path, "utf8"); } catch { throw new Error("Không đọc được QA_ROLE_ENV; cần stack và tài khoản QA thật."); }
  const values: Record<string, string> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
  return values;
}

async function login(page: Page, kind: Kind) {
  const env = accounts();
  const email = env[`ROLE_${kind}_EMAIL`], password = env[`ROLE_${kind}_PASSWORD`];
  if (!email || !password) throw new Error(`Thiếu tài khoản QA ${kind}.`);
  const customer = kind === "CUSTOMER";
  await page.goto(customer ? "/login" : "/staff/login");
  const form = customer ? page.getByRole("dialog") : page;
  await form.getByLabel(customer ? messages.customerAuth.identifier : messages.employeeAuth.identifier, { exact: true }).fill(email);
  await form.getByLabel(messages.employeeAuth.password, { exact: true }).fill(password);
  const result = page.waitForResponse((r) => new URL(r.url()).pathname === (customer ? "/api/auth/login" : "/api/auth/staff/login") && r.request().method() === "POST");
  await form.getByRole("button", { name: customer ? messages.customerAuth.login : messages.employeeAuth.login, exact: true }).click();
  expect((await result).status(), `Đăng nhập ${kind}`).toBe(200);
  await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?|staff\/switch-(?:org|branch))/);
}

async function permissionsOf(page: Page): Promise<string[]> {
  const response = await page.request.get("/api/auth/context");
  expect(response.status(), "Đọc quyền qua /api/auth/context").toBe(200);
  return (await response.json()).permissions ?? [];
}

async function firstStaffWithout(page: Page, kinds: Kind[]): Promise<Kind | undefined> {
  for (const kind of kinds) {
    await page.context().clearCookies();
    await login(page, kind);
    if (!(await permissionsOf(page)).includes(READ)) return kind;
  }
}

async function expectStoreClean(page: Page) {
  await page.goto("/products");
  const main = page.locator("main, [role=main], body").first();
  await expect(page.getByRole("heading").first()).toBeVisible();
  await expect(main).not.toContainText(STAFF_ONLY);
  await expect(page.getByRole("table")).toHaveCount(0);
  await expect(page.locator('a[href="/sales/products"]')).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe("/products");
}

async function hasCards(page: Page) {
  await page.goto("/products");
  await page.waitForLoadState("networkidle");
  return (await page.locator('a[href^="/products/"]').count()) > 0;
}

test.describe("AC-1 /products là catalog của khách", () => {
  test("anonymous không thấy control nhân viên", async ({ page }) => {
    await expectStoreClean(page);
  });

  test("anonymous thấy card có tên + giá, không thấy UUID", async ({ page }) => {
    test.skip(!(await hasCards(page)), "Stack chưa có món ACTIVE để hiện card; cần dữ liệu SALES-FLOW-001.");
    const card = page.locator('a[href^="/products/"]').first();
    await expect(card).toContainText(/₫/);
    expect(await page.locator("main, body").first().innerText()).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/);
    await expect(page.getByRole("button", { name: /yêu thích/i })).toHaveCount(0);
  });

  test("khách đã đăng nhập cũng không thấy control nhân viên", async ({ page }) => {
    await login(page, "CUSTOMER");
    await expectStoreClean(page);
  });

  test("AC-2 chi tiết món công khai không có nút kích hoạt, SKU, barcode", async ({ page }) => {
    test.skip(!(await hasCards(page)), "Stack chưa có món ACTIVE; cần dữ liệu SALES-FLOW-001.");
    await page.locator('a[href^="/products/"]').first().click();
    await page.waitForURL(/\/products\/[^/]+$/);
    await expect(page.getByRole("heading").first()).toBeVisible();
    await expect(page.locator("main, body").first()).not.toContainText(STAFF_ONLY);
    await expect(page.getByRole("button", { name: /Kích hoạt/ })).toHaveCount(0);
  });
});

test.describe("AC-3/AC-4 /sales/products trong console", () => {
  test("staff có sales:product:read thấy menu Sản phẩm và màn quản trị", async ({ page }) => {
    await login(page, "SALES");
    test.skip(!(await permissionsOf(page)).includes(READ), "Tài khoản QA SALES chưa có sales:product:read trong ma trận.");
    await page.goto("/console");
    const link = page.locator('a[href="/sales/products"]');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL(/\/sales\/products$/);
    await expect(page.getByRole("heading", { name: /Sản phẩm/ }).first()).toBeVisible();
    await expect(page.getByText("Không có quyền truy cập")).toHaveCount(0);
  });

  test("staff không có quyền đọc không thấy menu, vào URL trực tiếp bị chặn và không gọi staff list", async ({ page }) => {
    const kind = await firstStaffWithout(page, ["WAREHOUSE", "PROCESSING_STAFF", "FOOD_DEV"]);
    test.skip(!kind, "Mọi vai QA khác đều đang có sales:product:read; không có tài khoản thiếu quyền để thử.");
    const listCalls: string[] = [];
    page.on("request", (request) => { if (new URL(request.url()).pathname === "/api/sales/products") listCalls.push(request.method()); });
    await page.goto("/console");
    await expect(page.locator('a[href="/sales/products"]')).toHaveCount(0);
    await page.goto("/sales/products");
    await expect(page.getByText("Không có quyền truy cập")).toBeVisible();
    expect(listCalls).toEqual([]);
  });

  test("khách không vào được /sales/products", async ({ page }) => {
    await login(page, "CUSTOMER");
    await page.goto("/sales/products");
    await expect(page.getByRole("button", { name: /Tạo sản phẩm/ })).toHaveCount(0);
    expect(new URL(page.url()).pathname).not.toBe("/sales/products");
  });
});

test.describe("AC-6 bố cục", () => {
  test("không tràn ngang ở /products", async ({ page }) => {
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });

  test("mobile 390: bộ lọc mở bằng sheet, Esc đóng, không tràn ngang", async ({ page }, info) => {
    test.skip(info.project.name !== "mobile", "Chỉ chạy ở project mobile 390.");
    await page.goto("/products");
    await page.waitForLoadState("networkidle");
    const open = page.getByRole("button", { name: /Bộ lọc/ });
    await expect(open).toBeVisible();
    const box = await open.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await open.click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("textbox").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(open).toBeFocused();
  });

  test("desktop: bộ lọc nằm sẵn trong trang, không phải sheet", async ({ page }, info) => {
    test.skip(info.project.name !== "desktop", "Chỉ chạy ở project desktop.");
    await page.goto("/products");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByLabel(/Sắp xếp/).first()).toBeVisible();
  });
});
