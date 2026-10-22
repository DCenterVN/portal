import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire('/home/dawn/work/ticket/portal/package.json');
const { chromium } = require('@playwright/test');
const accounts = {};
for (const line of (await readFile(process.env.QA_ROLE_ENV, 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  if (match) accounts[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
}
const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave' });
try {
  for (const role of ['FOOD_DEV', 'ADMIN']) {
    const context = await browser.newContext({ baseURL: 'http://localhost:3000', locale: 'vi-VN' });
    const page = await context.newPage();
    try {
      await page.goto('/staff/login');
      await page.waitForTimeout(2000);
      await page.getByLabel('Email hoặc số điện thoại nhân viên', { exact: true }).fill(accounts[`ROLE_${role}_EMAIL`]);
      await page.getByLabel('Mật khẩu', { exact: true }).fill(accounts[`ROLE_${role}_PASSWORD`]);
      const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/staff/login' && r.request().method() === 'POST');
      await page.getByRole('button', { name: 'Đăng nhập nhân viên', exact: true }).click();
      const loginResponse = await response;
      const body = await loginResponse.json();
      console.log(role, 'login HTTP', loginResponse.status(), 'keys', Object.keys(body), 'data keys', Object.keys(body.data || {}));
      await page.waitForTimeout(2500);
      const path = new URL(page.url()).pathname;
      console.log(role, 'route', /^\/(staff\/login|switch-org|switch-branch|console|platform)$/.test(path) ? path : '[other route]');
      console.log(role, 'headings', await page.getByRole('heading').allTextContents());
      console.log(role, 'button count', await page.getByRole('button').count());
      console.log(role, 'cookie names', (await context.cookies()).map(cookie => cookie.name));
      const res = await context.request.get('/api/production/targets');
      console.log(role, 'targets HTTP', res.status());
      const payload = await res.json();
      console.log(role, 'targets shape', { keys: Object.keys(payload), dataKeys: Object.keys(payload?.data || {}), itemsArray: Array.isArray(payload?.data?.items), itemsNull: payload?.data?.items === null, total: payload?.data?.total });
    } catch { console.log(role, 'probe blocked; no payload logged.'); }
    finally { await context.close(); }
  }
} finally { await browser.close(); }
