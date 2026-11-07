import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { deflateSync } from "node:zlib";
import { expect, type Page } from "@playwright/test";
import messages from "../../messages/vi.json" with { type: "json" };

const accounts = new Map<string, string>();
for (const line of readFileSync(`${homedir()}/work/ticket/.cache/e2e/accounts.env`, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (match) accounts.set(match[1], match[2].trim().replace(/^(["'])(.*)\1$/, "$2"));
}

export const dir = process.env.E2E_SHOT_DIR || "/home/dawn/work/ticket/.cache/e2e/branch-5g";
export const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/;
export const shown = (page: Page) => page.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll("[title],[aria-label],[placeholder]")].flatMap(element => ["title", "aria-label", "placeholder"].map(name => element.getAttribute(name) ?? ""))].join("\n"));
export const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

export type Role = "WAREHOUSE" | "WAREHOUSE_CAUGIAY" | "SALES_CAUGIAY" | "ADMIN";

async function signIn(page: Page, role: Role) {
  const email = accounts.get(`DEV_${role}_EMAIL`);
  const password = accounts.get(`DEV_${role}_PASSWORD`);
  if (!email || !password) throw Error(`Thiếu tài khoản ${role}`);
  await page.context().clearCookies();
  await page.goto("/staff/login");
  const labels = messages.employeeAuth;
  await page.getByLabel(labels.identifier, { exact: true }).fill(email);
  await page.getByLabel(labels.password, { exact: true }).fill(password).catch(() => { throw Error("Không nhập được trường bảo mật"); });
  const logged = page.waitForResponse(res => new URL(res.url()).pathname === "/api/auth/staff/login" && res.request().method() === "POST");
  await page.getByRole("button", { name: labels.login, exact: true }).click();
  expect((await logged).status(), "Đăng nhập thành công").toBe(200);
  await page.waitForURL(url => !url.pathname.startsWith("/staff/login"));
}

export async function loginDirect(page: Page, role: Role) {
  await signIn(page, role);
  await page.waitForURL(url => url.pathname === "/console");
  await expect(page.getByRole("heading", { name: "Console vận hành" })).toBeVisible();
}

export async function loginToChooser(page: Page, role: Role) {
  await signIn(page, role);
  await page.waitForURL(url => url.pathname === "/staff/switch-branch");
  await expect(page.getByRole("heading", { name: "Chọn chi nhánh" })).toBeVisible();
}

export async function loginAs(page: Page, role: Role) {
  await signIn(page, role);
  await page.goto("/console");
  if (new URL(page.url()).pathname.startsWith("/staff/switch-")) {
    const first = page.getByRole("option").first();
    if (await first.waitFor({ state: "visible", timeout: 5_000 }).then(() => true, () => false)) await first.click();
  }
  await page.waitForURL(url => url.pathname === "/console");
  await expect(page.getByRole("heading", { name: "Console vận hành" })).toBeVisible();
}

export async function openTransfers(page: Page) {
  const link = page.getByRole("link", { name: "Chuyển hàng", exact: true });
  if (!await link.isVisible()) await page.getByRole("button", { name: "Kho", exact: true }).click();
  await link.click();
  await page.waitForURL(url => url.pathname === "/inventory/stock-transfers");
  await expect(page.getByRole("heading", { name: "Chuyển hàng", exact: true })).toBeVisible();
}

function crc32(bytes: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(body));
  return Buffer.concat([head, body, tail]);
}

export function photo(red: number, green: number, blue: number, width = 160, height = 100): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.from(Array.from({ length: width }, () => [red, green, blue]).flat())]);
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

export async function hideDevBadge(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal{display:none!important}";
      document.head.append(style);
    });
  });
}

type Stock = Record<string, number>;

export async function branchStock(page: Page): Promise<Stock> {
  const context = await (await page.request.get("/api/auth/context")).json();
  const branch: string = context.active_context.branch_id;
  const body = await (await page.request.get(`/api/inventory/stock-levels?branch_ref=${branch}`)).json();
  const items: Array<{ sku_ref: string; branch_ref: string; on_hand_quantity: number }> = (body.data ?? body).items ?? [];
  return Object.fromEntries(items.filter(item => item.branch_ref === branch).map(item => [item.sku_ref, Math.round(item.on_hand_quantity * 1000)]));
}
