import { readManifest } from "../setup/api";
import { test, expect, type Page, type Locator } from '@playwright/test';

export async function screen(page: Page, name: string) {
  expect(await page.locator('body').innerText(), `UUID trên màn ${name}`).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
  await page.screenshot({ path: test.info().outputPath(`${name}.png`), fullPage: true, animations: 'disabled' });
}

export async function pick(scope: Page | Locator, label: string, name: string) {
  const input = scope.getByRole('combobox', { name: label, exact: true });
  await input.scrollIntoViewIfNeeded();
  await input.fill(name);
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const option = scope.getByRole('option', { name: new RegExp(`^${escaped}(?:\\s|$)`) });
  await expect(option).toBeVisible();
  await option.click();
  await expect(scope.getByRole('listbox')).toHaveCount(0);
}

export async function login(page: Page) {
  const email = process.env.FOODDEV_EMAIL;
  const password = process.env.FOODDEV_PASSWORD;
  if (!email || !password) throw new Error('Runner phải cấp FOODDEV_EMAIL và FOODDEV_PASSWORD');
  await page.goto('/staff/login?redirect=/production/food-plans');
  await page.locator('input[name="identifier"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/staff/login' && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Đăng nhập nhân viên', exact: true }).click();
  expect((await response).status()).toBe(200);
  await page.waitForURL('**/production/food-plans');
  await expect(page.getByRole('button', { name: 'Tạo món', exact: true }).first()).toBeVisible();
  await filterDishes(page);
  await screen(page, 'food-dev-login');
}

export function fixture(key: string) {
  const id = readManifest().ids[key];
  if (!id) throw new Error(`Missing fixture ${key}`);
  return id;
}
export function dataName(key: string) {
  const data = readManifest();
  return data.names[key] ?? `${key} ${data.suffix}`;
}

export async function filterDishes(page: Page) {
  const data = readManifest();
  const search = page.getByLabel('Tìm món', { exact: true });
  if (await search.inputValue() !== data.suffix) {
    const loaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/food-packs/sales/dishes' && new URL(response.url()).searchParams.get('q') === data.suffix);
    await search.fill(data.suffix);
    expect((await loaded).status()).toBe(200);
  }
  await expect(page.getByRole('row').filter({ hasText: data.names.M4 })).toBeVisible();
  await expect(page.getByRole('row').filter({ hasText: /[0-9a-f]{8}-[0-9a-f]{4}-/i })).toHaveCount(0);
}

export async function pickVariant(page: Page, name: string) {
  const combo = page.getByRole('combobox', { name: 'Mã set', exact: true });
  await combo.click();
  await expect(combo).toHaveAttribute('aria-expanded', 'true');
  const option = page.getByRole('option').filter({ hasText: name });
  while (!await option.count()) {
    const more = page.getByRole('button', { name: 'Thêm biến thể từ trang sau', exact: true });
    await expect(more, 'Tìm biến thể qua phân trang UI').toBeEnabled();
    const loaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/food-packs/sales/sets' && response.request().method() === 'GET');
    await more.click();
    expect((await loaded).status()).toBe(200);
    await expect.poll(async () => !await more.count() || await more.isEnabled()).toBe(true);
    await combo.click();
    await expect(combo).toHaveAttribute('aria-expanded', 'true');
  }
  await option.click();
  await expect(page.getByRole('listbox')).toHaveCount(0);
}
