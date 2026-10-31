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
  await expect(scope.getByRole('option', { name: new RegExp(`^${escaped}(?:\\s|$)`) })).toBeVisible();
  await input.press('Enter');
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
  await screen(page, 'food-dev-login');
}
