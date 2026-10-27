import { test, expect, type Page } from '@playwright/test';
import { readFileSync, writeFileSync, existsSync, chmodSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { randomBytes } from 'node:crypto';
const base = process.env.PORTAL_BASE_URL || 'http://127.0.0.1:3003';
const state = process.env.PORTAL_WAREHOUSE_STATE || '/home/dawn/work/ticket/.cache/tmp/supplier-bf3-storage.json';
const evidence = process.env.SUPPLIER_UX_EVIDENCE || '/home/dawn/work/ticket/.aidlc/runs/SUPPLIER-UX-002/artifacts/e2e-web/fix-review';
test.use({ storageState: state });
test.beforeAll(async ({ browser }) => {
  mkdirSync(evidence, { recursive: true });
  mkdirSync(dirname(state), { recursive: true });
  if (existsSync(state)) {
    const reusable = await browser.newContext({ storageState: state });
    const probe = await reusable.newPage();
    await probe.goto(base + '/inventory/suppliers', { waitUntil: 'domcontentloaded' });
    const status = await probe.evaluate(async () => (await fetch('/api/inventory/suppliers?limit=1')).status);
    if (status === 200) {
      await reusable.storageState({ path: state });
      chmodSync(state, 0o600);
      await reusable.close();
      console.log('Reused supplier-bf3 storageState; no QA login');
      return;
    }
    await reusable.close();
    if (status === 403) throw new Error('chan portal-3003-site-url');
    if (![401, 403].includes(status)) throw new Error('StorageState probe HTTP ' + status);
  }
  const counter = join(dirname(state), 'supplier-fixrev-login-count.txt');
  if (existsSync(counter) && Number(readFileSync(counter, 'utf8')) >= 1) throw new Error('chan login-limit: already used one new QA login');
  writeFileSync(counter, '1');
  const source = readFileSync(process.env.QA_ROLE_ENV || '/home/dawn/.local/state/dcentervn/qa/role-accounts.env', 'utf8');
  const accounts = Object.fromEntries(source.split(/\r?\n/).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]));
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
  let response;
  try { response = await context.request.post(base + '/api/auth/staff/login', { headers: { Origin: base }, data: { identifier: accounts.ROLE_WAREHOUSE_EMAIL, password: accounts.ROLE_WAREHOUSE_PASSWORD } }); }
  catch { throw new Error('Không gọi được đăng nhập QA WAREHOUSE'); }
  if (response.status() === 403) throw new Error('chan portal-3003-site-url');
  if (response.status() !== 200) throw new Error('Đăng nhập QA WAREHOUSE HTTP ' + response.status());
  await context.storageState({ path: state });
  chmodSync(state, 0o600);
  await context.close();
});
test.afterEach(async ({ page }, info) => { if (info.status !== 'passed') await shot(page, 'failed-' + info.line).catch(() => {}); });
async function shot(page: Page, name: string) { await page.screenshot({ path: evidence + '/bf4-' + name + '.png', fullPage: true, animations: 'disabled' }); }
async function openForm(page: Page) {
  await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Nhà cung cấp', exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
  await shot(page, '00-supplier-list');
  await page.getByRole('button', { name: 'Thêm nhà cung cấp', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Thêm nhà cung cấp', exact: true })).toBeVisible();
}
test('NCC: email sai hiện lỗi tiếng Việt dưới trường', async ({ page }) => {
  await openForm(page);
  await shot(page, '01-form-general');
  const sheetAboveToolbar = await page.getByRole('button', { name: 'Thêm nhà cung cấp', exact: true }).evaluate(element => {
    const box = element.getBoundingClientRect();
    return Boolean(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('[role="dialog"]'));
  });
  expect(sheetAboveToolbar, 'Sheet phải phủ toolbar phía sau').toBe(true);
  await page.getByLabel('Email', { exact: true }).click();
  await page.getByLabel('Email', { exact: true }).fill('sai-email');
  await page.getByLabel('Email', { exact: true }).blur();
  await expect(page.getByRole('alert').filter({ hasText: 'Email không đúng định dạng.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true })).toBeDisabled();
  await shot(page, '02-email-validation');
  const uncovered = await page.getByLabel('Email', { exact: true }).evaluate(element => {
    const box = element.getBoundingClientRect();
    const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    return top === element;
  });
  expect(uncovered, 'Trường Email phải hiện phía trên chân Lưu, không bị che').toBe(true);
  const scrollBottom = await page.getByLabel('Email', { exact: true }).evaluate(element => {
    let parent = element.parentElement;
    while (parent && !['auto', 'scroll'].includes(getComputedStyle(parent).overflowY)) parent = parent.parentElement;
    return parent ? parent.getBoundingClientRect().bottom : Infinity;
  });
  const cancel = await page.getByRole('button', { name: 'Huỷ', exact: true }).boundingBox();
  if (!cancel) throw new Error('Không thấy nút Huỷ');
  expect(scrollBottom, 'Vùng cuộn phải kết thúc trước các nút chân sheet').toBeLessThanOrEqual(cancel.y);
});
test('NCC: tạo đủ hồ sơ, cây nhiều cha, sửa và reload, lịch sử nhập', async ({ page }) => {
  const lookup = page.waitForResponse(response => new URL(response.url()).pathname === '/api/inventory/material-categories');
  await openForm(page);
  const suffix = randomBytes(2).toString('hex').toUpperCase();
  const name = 'E2E-NCC-' + new Date().toLocaleTimeString('vi-VN', { hour12: false }).replaceAll(':', '') + '-' + suffix;
  const code = 'E2E-CODE-' + suffix;
  let createdId: string | undefined;
  try {
  for (const [label, value] of [['Tên nhà cung cấp', name], ['Mã nhà cung cấp', code], ['Mã số thuế', '0312345678'], ['Số nhà, đường', '12 Nguyễn Trãi'], ['Tỉnh, thành phố', 'TP Hồ Chí Minh'], ['Phường, xã', 'Bến Thành'], ['Người liên hệ', 'Nguyễn An'], ['Điện thoại', '0901234567'], ['Email', 'an@example.com']]) {
    await page.getByLabel(label, { exact: true }).fill(value);
    if (label === 'Phường, xã') await shot(page, '03-address');
  }
  await shot(page, '04-contact');
  await page.locator('summary').filter({ hasText: 'Ghi chú nội bộ' }).click();
  await page.getByLabel('Ghi chú nội bộ', { exact: true }).fill('Giao hàng trước 8 giờ');
  await shot(page, '04-note');
  const status = (await lookup).status();
  if ([404, 405].includes(status)) {
    await page.getByRole('alert').filter({ hasText: 'Không tải được nhóm nguyên liệu' }).scrollIntoViewIfNeeded();
    await shot(page, '05-dev-taxonomy-blocked');
    throw new Error('chan e2e-web-dev-chua-build GET /inventory/material-categories ' + status);
  }
  expect(status, 'taxonomy inventory DEV').toBe(200);
  for (const [parent, children] of [['Thịt', ['Gà', 'Lợn']], ['Thủy hải sản', ['Cá', 'Tôm']]] satisfies [string, string[]][]) {
    await page.getByLabel('Tìm nhóm nguyên liệu', { exact: true }).fill(parent);
    for (const label of children) {
      await page.getByRole('checkbox', { name: label, exact: true }).click();
      await expect(page.getByRole('checkbox', { name: parent, exact: true })).toHaveAttribute('aria-checked', 'mixed');
      await shot(page, '05-category-' + label);
    }
  }
  await page.getByLabel('Tìm nhóm nguyên liệu', { exact: true }).fill('');
  for (const label of ['Thịt', 'Thủy hải sản']) await expect(page.getByRole('checkbox', { name: label, exact: true })).toHaveAttribute('aria-checked', 'mixed');
  await expect(page.getByRole('group', { name: 'Đã chọn', exact: true })).toContainText('Đã chọn 4 nhóm con');
  await page.getByRole('checkbox', { name: 'Thịt', exact: true }).scrollIntoViewIfNeeded();
  await shot(page, '05-category-picker');
  const saved = page.waitForResponse(response => new URL(response.url()).pathname === '/api/inventory/suppliers' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true }).click();
  const createResponse = await saved;
  expect(createResponse.status()).toBe(201);
  const createBody = await createResponse.json();
  createdId = (createBody.data || createBody).id;
  await expect(page.getByRole('dialog', { name: 'Thêm nhà cung cấp', exact: true })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Tìm nhà cung cấp theo tên hoặc mã' }).fill(name);
  await expect(page.getByRole('link', { name, exact: true })).toBeVisible();
  await shot(page, '06-saved-list');
  await page.getByRole('link', { name, exact: true }).click();
  await page.waitForURL('**/inventory/suppliers/' + createdId);
  await page.reload();
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(page.locator('body')).toContainText(code);
  for (const value of [ '0312345678', '12 Nguyễn Trãi, Bến Thành, TP Hồ Chí Minh', 'Nguyễn An', '0901234567', 'an@example.com', 'Giao hàng trước 8 giờ', 'Gà', 'Lợn', 'Cá', 'Tôm']) await expect(page.getByText(value, { exact: true })).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/e30=|\[object Object\]|Error|Loading|Supplier|Save|Cancel|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  await shot(page, '06-created-reloaded');
  await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
  await page.getByLabel('Điện thoại', { exact: true }).fill('+84987654321');
  await page.getByRole('checkbox', { name: 'Tôm', exact: true }).click();
  await shot(page, '07-edit');
  const updated = page.waitForResponse(response => response.url().includes('/api/inventory/suppliers/') && response.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true }).click();
  expect((await updated).status()).toBe(200);
  await page.reload();
  await expect(page.getByRole('link', { name: '+84987654321', exact: true })).toBeVisible();
  await expect(page.getByText('Tôm', { exact: true })).toHaveCount(0);
  for (const label of ['Gà', 'Lợn', 'Cá']) await expect(page.getByText(label, { exact: true })).toBeVisible();
  await shot(page, '08-edited-reloaded');
  for (const value of [name, '0312345678', '12 Nguyễn Trãi, Bến Thành, TP Hồ Chí Minh', 'Nguyễn An', 'an@example.com', 'Giao hàng trước 8 giờ']) await expect(page.getByText(value, { exact: true }).first()).toBeVisible();
  } finally {
    if (createdId) {
      await page.goto('/inventory/suppliers/' + createdId, { waitUntil: 'domcontentloaded' });
      await page.getByRole('button', { name: 'Ngừng hợp tác', exact: true }).click();
      await page.getByLabel('Lý do', { exact: true }).fill('Dọn dữ liệu E2E sau kiểm thử hồ sơ NCC');
      const suspended = page.waitForResponse(response => response.url().includes('/suspend') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Xác nhận thay đổi', exact: true }).click();
      expect((await suspended).status()).toBe(200);
      await page.reload();
      await expect(page.getByText('Đã ngừng hợp tác', { exact: true })).toBeVisible();
      await shot(page, '10-cleanup-suspended');
      console.log('Created supplier suspended after E2E');
    }
  }

});
test('NCC DEMO: mở hồ sơ và lịch sử nhập', async ({ page }) => {
  await page.goto('/inventory/suppliers', { waitUntil: 'domcontentloaded' });
  await page.getByRole('textbox', { name: 'Tìm nhà cung cấp theo tên hoặc mã' }).fill('DEMO-NCC-');
  const row = page.getByRole('row').filter({ hasText: 'DEMO-NCC-' }).first();
  await expect(row).toBeVisible();
  const demoLink = row.getByRole('link').first();
  const demoName = await demoLink.innerText();
  await demoLink.click();
  await page.waitForURL(/\/inventory\/suppliers\/[^/]+$/);
  await expect(page.getByRole('heading', { name: demoName, exact: true })).toBeVisible();
  await shot(page, '11-demo-profile');
  await page.getByRole('tab', { name: 'Lịch sử nhập', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Lịch sử nhập', exact: true })).toBeVisible();
  await expect(page.getByText('Đang tải lịch sử nhập', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Không tải được lịch sử nhập', { exact: false })).toHaveCount(0);
  const history = page.getByRole('region', { name: 'Lịch sử nhập', exact: true });
  await expect(history.getByText('Chưa có phiếu nhập cho nhà cung cấp này trong chi nhánh đang làm việc', { exact: true }).or(history.locator('article').first())).toBeVisible();
  expect(await page.locator('body').innerText()).not.toMatch(/e30=|\[object Object\]|[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
  await shot(page, '12-demo-receipt-history');
});

