// Codex chụp portal thật; không mock, trace, HAR, storageState hoặc log bí mật.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const targetsOnly = process.argv.includes('--targets-only');
const screens = targetsOnly ? ['targets-list', 'targets-form'] : ['home', 'detail', 'cart', 'login', 'register', 'activate', 'forgot', 'console', 'targets-list', 'targets-form'];
const sizes = [{ width: 1440, height: 900 }, { width: 375, height: 844 }];
const themes = ['light', 'dark'];
if (process.argv.includes('--check')) {
  console.log(`${screens.length * sizes.length * themes.length} tổ hợp màn chính; 8 ID crop; chỉ kiểm ma trận, chưa chụp UI.`);
  process.exit(0);
}

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const phase = process.env.CAPTURE_PHASE || 'before';
if (!['before', 'after'].includes(phase)) throw new Error('CAPTURE_PHASE phải là before hoặc after.');
const baseURL = process.env.PORTAL_E2E_BASE || 'http://localhost:3000';
const parsedBase = new URL(baseURL);
if (!['localhost', '127.0.0.1'].includes(parsedBase.hostname)) throw new Error('Chỉ chụp portal QA local.');
const out = process.env.MOTION_AUDIT_DIR || '/home/dawn/work/ticket/plans/261022-ui-motion/audit';
if (existsSync(join(out, `${phase}-manifest.json`))) throw new Error('Đã có manifest. Giữ baseline và dùng thư mục audit mới.');
const productName = process.env.MOTION_PRODUCT_NAME;
if (productName && /[0-9a-f]{8}-[0-9a-f]{4}-/i.test(productName)) throw new Error('MOTION_PRODUCT_NAME phải là tên món QA thật.');
const qaPath = (process.env.QA_ROLE_ENV || `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
const accounts = {};
try {
  for (const line of (await readFile(qaPath, 'utf8')).split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) accounts[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
} catch { throw new Error('Không đọc được QA_ROLE_ENV.'); }
const role = process.env.MOTION_STAFF_ROLE || 'FOOD_DEV';
if (!['FOOD_DEV', 'ADMIN'].includes(role)) throw new Error('MOTION_STAFF_ROLE phải là FOOD_DEV hoặc ADMIN.');
for (const key of ['ROLE_CUSTOMER_EMAIL', 'ROLE_CUSTOMER_PASSWORD', `ROLE_${role}_EMAIL`, `ROLE_${role}_PASSWORD`]) {
  if (!accounts[key]) throw new Error(`QA_ROLE_ENV thiếu ${key}.`);
}
// Có thể dùng dependency đã có ở portal gốc, không tạo link hoặc cài vào worktree.
const requireInstalled = createRequire(resolve(process.env.MOTION_MODULE_ROOT || '/home/dawn/work/ticket/portal', 'package.json'));
const { chromium } = requireInstalled('@playwright/test');
const browser = await chromium.launch({ executablePath: process.env.PW_BROWSER_PATH || '/opt/brave.com/brave/brave' });
const records = [];
const filename = (label, viewport, theme) => `${phase}-${label}-${viewport.width}-${theme}.png`;
await mkdir(out, { recursive: true });

async function open(page, path) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  if (!response || !response.ok()) throw new Error('Không tải được màn.');
}
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2300);
}
async function save(page, label, viewport, theme, locator) {
  await settle(page);
  const file = filename(label, viewport, theme);
  // Input trống không cần mask, vì mask cả input sẽ che nút mắt chồng lên nó.
  const mask = [];
  for (const field of await page.locator('input[type="password"], input[name="identifier"], input[autocomplete="username"]').all()) {
    if (await field.evaluate(el => Boolean(el.value))) mask.push(field);
  }
  const options = { path: join(out, file), animations: 'disabled', mask };
  if (locator) await locator.screenshot(options);
  else await page.screenshot({ ...options, fullPage: true });
  records.push({ screen: label, width: viewport.width, height: viewport.height, theme, phase, status: 'captured', file });
}
async function attempt(label, viewport, theme, work) {
  try { await work(); }
  catch {
    // Không ghi Error.message vì Playwright có thể chứa mật khẩu hoặc URL token.
    records.push({ screen: label, width: viewport.width, height: viewport.height, theme, phase, status: 'blocked', reason: 'Thiếu màn, dữ liệu, quyền hoặc selector. Codex kiểm trực tiếp.' });
  }
  console.log(`${viewport.width} ${theme} ${label}: ${records.at(-1)?.status}`);
}
async function login(page, kind) {
  const customer = kind === 'CUSTOMER';
  await open(page, customer ? '/login' : '/staff/login');
  await settle(page);
  const form = customer ? page.getByRole('dialog') : page;
  await form.getByLabel(customer ? 'Email hoặc số điện thoại' : 'Email hoặc số điện thoại nhân viên', { exact: true }).fill(accounts[`ROLE_${kind}_EMAIL`]);
  await form.getByLabel('Mật khẩu', { exact: true }).fill(accounts[`ROLE_${kind}_PASSWORD`]);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === (customer ? '/api/auth/login' : '/api/auth/staff/login') && r.request().method() === 'POST');
  await form.getByRole('button', { name: customer ? 'Đăng nhập' : 'Đăng nhập nhân viên', exact: true }).click();
  if ((await response).status() !== 200) throw new Error('Không đăng nhập được QA.');
  await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?)$/);
}
async function context(viewport, theme) {
  const value = await browser.newContext({ baseURL, viewport, colorScheme: theme, locale: 'vi-VN', deviceScaleFactor: 1 });
  value.setDefaultTimeout(15000);
  await value.addInitScript(selected => {
    localStorage.setItem('dcenter_theme', selected);
    document.documentElement.dataset.theme = selected;
    document.documentElement.classList.toggle('dark', selected === 'dark');
  }, theme);
  await value.addCookies([{ name: 'NEXT_LOCALE', value: 'vi', url: baseURL }]);
  return value;
}
async function crop(page, id, viewport, theme, locator) {
  await attempt(id, viewport, theme, () => save(page, id, viewport, theme, locator));
}

try {
  for (const viewport of sizes) for (const theme of themes) {
    const guest = await context(viewport, theme);
    const customer = await context(viewport, theme);
    const staff = await context(viewport, theme);
    try {
      const page = await guest.newPage();
      for (const [label, path, marker] of [
        ['home', '/', () => page.locator('#hero-title')],
        ['login', '/login', () => page.getByRole('dialog')],
        ['register', '/register', () => page.getByRole('dialog')],
        ['activate', '/activate', () => page.getByRole('button', { name: 'Gửi lại liên kết kích hoạt', exact: true })],
        ['forgot', '/forgot-password', () => page.getByRole('button', { name: 'Gửi liên kết đặt lại', exact: true })],
      ]) {
        if (targetsOnly) break;
        await attempt(label, viewport, theme, async () => {
          await open(page, path);
          await marker().waitFor({ state: 'visible' });
          await save(page, label, viewport, theme);
        });
        if (label !== 'login') continue;
        const eye = page.getByRole('button', { name: 'Hiện mật khẩu', exact: true });
        await crop(page, 'V-01-normal', viewport, theme, eye);
        await attempt('V-01-hover', viewport, theme, async () => { await eye.hover(); await save(page, 'V-01-hover', viewport, theme, eye); });
        await page.mouse.move(0, 0);
        await attempt('V-01-focus', viewport, theme, async () => {
          // Tab từ input mật khẩu để dùng :focus-visible, không click nút.
          await page.getByRole('dialog').locator('input[name="password"]').focus();
          await page.keyboard.press('Tab');
          if (!await eye.evaluate(el => el === document.activeElement)) throw new Error('Sai thứ tự focus.');
          await save(page, 'V-01-focus', viewport, theme, eye);
        });
        await crop(page, 'V-06', viewport, theme, page.getByRole('button', { name: 'Đóng hộp thoại', exact: true }));
        await attempt('V-06-hover', viewport, theme, async () => {
          const close = page.getByRole('button', { name: 'Đóng hộp thoại', exact: true });
          await close.hover();
          await save(page, 'V-06-hover', viewport, theme, close);
        });
      }
      const cp = await customer.newPage();
      const sp = await staff.newPage();
      let customerOK = false, staffOK = false;
      if (!targetsOnly) try { await login(cp, 'CUSTOMER'); customerOK = true; } catch { /* Ghi từng màn blocked bên dưới. */ }
      try { await login(sp, role); staffOK = true; } catch { /* Không lưu chi tiết login. */ }
      for (const label of targetsOnly ? [] : ['detail', 'cart', 'home-signed', 'catalog', 'mini-cart']) {
        await attempt(label, viewport, theme, async () => {
          if (!customerOK) throw new Error('Thiếu phiên QA.');
          if (label === 'home-signed') {
            await open(cp, '/');
            await cp.getByRole('heading', { level: 1 }).filter({ hasText: 'bữa tối' }).waitFor();
          } else if (label === 'cart') {
            await open(cp, '/cart');
            await cp.getByRole('heading', { name: 'Giỏ Hàng & Tạo Đơn Hàng', exact: true }).waitFor();
          } else if (label === 'mini-cart') {
            await open(cp, '/');
            await settle(cp);
            const trigger = cp.getByRole('button', { name: /^Giỏ hàng, \d+ món$/ });
            await trigger.click();
            await trigger.locator('..').locator('[id]').last().waitFor({ state: 'visible' });
          } else {
            await open(cp, '/products');
            await cp.getByPlaceholder('Tìm theo tên SKU, mã vạch...').waitFor();
            if (label === 'detail') {
              // Chỉ chọn tên ACTIVE thực đang hiển thị; thiếu dữ liệu thì ghi blocked.
              await cp.getByRole('button', { name: /^Đang mở bán \(/ }).click();
              await settle(cp);
              const activeLinks = cp.locator('tbody tr').filter({ hasText: 'ACTIVE' }).getByRole('link');
              const selectedName = productName || (await activeLinks.first().count() ? await activeLinks.first().innerText() : '');
              if (!selectedName) throw new Error('Catalog không có món ACTIVE.');
              await cp.getByRole('link', { name: selectedName, exact: true }).click();
              await cp.getByRole('heading', { name: selectedName, exact: true }).waitFor();
              await cp.getByRole('button', { name: 'Giảm số lượng', exact: true }).waitFor();
            }
          }
          await save(cp, label, viewport, theme);
          if (label === 'detail') await crop(cp, 'V-05', viewport, theme, cp.getByRole('button', { name: 'Giảm số lượng', exact: true }).locator('..'));
          if (label === 'catalog') {
            await crop(cp, 'V-02', viewport, theme, cp.getByRole('button', { name: /^Tất cả \(/ }).locator('..'));
            await crop(cp, 'V-04', viewport, theme, cp.getByPlaceholder('Tìm theo tên SKU, mã vạch...').locator('..'));
            await crop(cp, 'V-07', viewport, theme, cp.getByRole('heading', { level: 1 }).locator('../../..'));
            await crop(cp, 'V-08-catalog', viewport, theme, cp.getByPlaceholder('Tìm theo tên SKU, mã vạch...').locator('..'));
          }
        });
      }
      for (const label of targetsOnly ? screens : ['console', 'targets-list', 'targets-form']) {
        await attempt(label, viewport, theme, async () => {
          if (!staffOK) throw new Error('Thiếu phiên QA.');
          let targetRows;
          if (label !== 'console') {
            // Trang SSR bắt lỗi thành []; heading đơn thuần không đủ chứng minh đọc thành công.
            const response = await staff.request.get(new URL('/api/production/targets', baseURL).href);
            console.log(`${viewport.width} ${theme} ${label}: preflight HTTP ${response.status()}`);
            if (!response.ok()) throw new Error('Không đọc được danh sách qua phiên QA.');
            const payload = await response.json();
            const data = payload?.data ?? payload;
            targetRows = data?.items === null && data?.total === 0 ? [] : data?.items;
            if (!Array.isArray(targetRows)) throw new Error('Không có danh sách hợp đồng thật.');
          }
          await open(sp, label === 'console' ? '/console' : '/production/targets');
          await sp.getByRole('heading', { name: label === 'console' ? 'Console vận hành' : 'Chỉ tiêu sản xuất', exact: true }).waitFor();
          for (const target of targetRows || []) {
            if (typeof target.title !== 'string' || !target.title) throw new Error('Thiếu tên chỉ tiêu thật.');
            await sp.getByRole('cell', { name: target.title, exact: true }).first().waitFor();
          }
          if (label === 'targets-form') {
            await sp.getByRole('button', { name: 'Tạo chỉ tiêu', exact: true }).first().click();
            await sp.getByLabel('Tiêu đề', { exact: true }).waitFor();
            // Không điền hoặc gửi. QA chọn thực thể bằng tên khi chạy test tương tác sau này.
          }
          await save(sp, label, viewport, theme);
          if (label === 'targets-form') {
            const remove = sp.getByRole('button', { name: 'Xóa dòng', exact: true });
            if (await remove.count()) await crop(sp, 'V-03', viewport, theme, remove.locator('..'));
            else records.push({ screen: 'V-03', width: viewport.width, theme, phase, status: 'not-present', reason: 'Form không có nút Xóa dòng.' });
            await crop(sp, 'V-08', viewport, theme, sp.getByLabel('Tiêu đề', { exact: true }).locator('..'));
          }
        });
      }
    } finally { await Promise.all([guest.close(), customer.close(), staff.close()]); }
  }
} finally {
  await browser.close();
  const main = records.filter(r => screens.includes(r.screen));
  const captured = main.filter(r => r.status === 'captured').length;
  const expectedMain = screens.length * sizes.length * themes.length;
  await writeFile(join(out, `${phase}-manifest.json`), JSON.stringify({ phase, baseURL, expectedMain, capturedMain: captured, records }, null, 2) + '\n');
  console.log(`Ảnh màn chính ${captured}/${expectedMain}. Xem manifest; không phải kiểm PASS giao diện.`);
  if (captured !== expectedMain || records.some(r => r.status === 'blocked')) process.exitCode = 1;
}
