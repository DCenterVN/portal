import { test, expect, type Page, type Locator } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { stripVTControlCharacters } from 'node:util';

const root = resolve(process.cwd(), '..');
const evidence = resolve(root, 'plans/261029-merge-chain/dev-e2e');
const sharedPath = resolve(root, '.cache/tmp/dev-walkthrough-created.json');
const prefix = 'E2E-261030-';
const pngBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAFklEQVR4nGO4ZKNAEmIY1TCqYfhqAABAMS4Q2MTH0AAAAABJRU5ErkJggg==', 'base64');
const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-/i;
const accounts: Record<string, string> = {};
for (const line of readFileSync(`${homedir()}/.local/state/dcentervn/qa/role-accounts.env`, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
  if (match) accounts[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
}
const secrets = Object.entries(accounts).filter(([key]) => /PASSWORD|TOKEN|SECRET/.test(key)).map(([, value]) => value).filter(Boolean);
function safe(value: string): string {
  for (const secret of secrets) value = value.replaceAll(secret, '[redacted]');
  return stripVTControlCharacters(value).replace(/eyJ[A-Za-z0-9_.-]+/g, '[token redacted]')
    .replace(/https?:\/\/[^\s"<>]+/g, url => { try { const parsed = new URL(url); return parsed.origin + parsed.pathname; } catch { return '[URL redacted]'; } });
}
function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.slice(0, 4).map(clean);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([key]) => !/token|password|secret|cookie|authorization|signature|form_fields|upload_url|download_url/i.test(key)).map(([key, item]) => [key, clean(item)]));
  return typeof value === 'string' ? safe(value).slice(0, 500) : value;
}
type Row = { scenario: string; step: string; status: string; image: string; url: string; notes: string; network: unknown[] };
type Created = { supplierId?: string; supplierName?: string; supplierCode?: string; agreementCode?: string; materialName?: string; materialId?: string; packageName?: string; packageId?: string };
function created(): Created { return existsSync(sharedPath) ? JSON.parse(readFileSync(sharedPath, 'utf8')) : {}; }
function saveCreated(data: Created) { writeFileSync(sharedPath, JSON.stringify({ ...created(), ...data }, null, 2)); }
function observed<T>(promise: Promise<T>): Promise<T> { void promise.catch(() => {}); return promise; }

function walkthrough(page: Page, scenario: string) {
  const rows: Row[] = [];
  const network: unknown[] = [];
  const pending = new Set<Promise<void>>();
  mkdirSync(resolve(evidence, scenario), { recursive: true });
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    network.push({ method: request.method(), origin: url.origin, path: url.pathname, failure: safe(request.failure()?.errorText ?? 'unknown') });
  });
  page.on('console', message => { if (message.type() === 'error') network.push({ console: safe(message.text()) }); });
  page.on('response', response => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith('/api/') && !url.pathname.startsWith('/inventory-docs')) return;
    const task = (async () => {
      const request = response.request();
      const auth = url.pathname.startsWith('/api/auth');
      const entry: Record<string, unknown> = { method: request.method(), path: url.pathname, status: response.status() };
      if (!auth && request.method() !== 'GET') {
        try { entry.request = clean(request.postDataJSON()); } catch { entry.request = '[binary/form omitted]'; }
      }
      if (!auth && (response.status() >= 400 || request.method() !== 'GET' || url.pathname.includes('/food-packs/'))) {
        try { entry.response = clean(await response.json()); } catch { entry.response = '[non-JSON omitted]'; }
      }
      network.push(entry);
    })().catch(() => {});
    pending.add(task); void task.finally(() => pending.delete(task));
  });
  async function step(name: string, action: () => Promise<void>) {
    const available = Number(readFileSync('/proc/meminfo', 'utf8').match(/MemAvailable:\s+(\d+)/)?.[1] ?? 0) / 1024;
    if (available < 3000) throw new Error(`BLOCKED RAM available ${Math.floor(available)} MB < 3000 MB`);
    const start = network.length;
    let notes = '', succeeded = true;
    try { await action(); } catch (error) { succeeded = false; notes = safe(error instanceof Error ? error.message : String(error)); }
    await Promise.allSettled([...pending]);
    const text = await page.locator('body').innerText().catch(() => '');
    const uuidLeak = uuid.test(text);
    if (uuidLeak) notes += `${notes ? '; ' : ''}UUID visible in innerText`;
    const image = `${scenario}/${String(rows.length + 1).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: resolve(evidence, image), fullPage: true, animations: 'disabled' });
    rows.push({ scenario, step: name, status: succeeded && !uuidLeak ? 'PASS' : 'FAIL', image, url: safe(page.url()), notes, network: network.slice(start) });
    writeFileSync(resolve(evidence, `${scenario}.json`), JSON.stringify(rows, null, 2));
    console.log(`${scenario} ${name}: ${rows.at(-1)?.status}`);
    return succeeded;
  }
  async function finish() {
    await Promise.allSettled([...pending]);
    writeFileSync(resolve(evidence, `${scenario}-network.json`), JSON.stringify(network, null, 2));
    expect(rows.filter(row => row.status !== 'PASS').map(row => row.step), 'Walkthrough failed steps; see evidence JSON').toEqual([]);
  }
  return { step, finish };
}

async function pick(scope: Page | Locator, label: string, name: string) {
  const input = scope.getByRole('combobox', { name: label, exact: true });
  await input.scrollIntoViewIfNeeded();
  await input.fill(name);
  await expect(input).toHaveAttribute('aria-expanded', 'true');
  await expect(scope.getByRole('option', { name, exact: true })).toBeVisible();
  await input.press('Enter');
  await expect(input).toHaveAttribute('aria-expanded', 'false');
}
async function login(page: Page, role: 'ADMIN' | 'FOOD_DEV') {
  await page.goto('/staff/login');
  await page.locator('input[name="identifier"]').fill(accounts[`ROLE_${role}_EMAIL`]);
  await page.locator('input[name="password"]').fill(accounts[`ROLE_${role}_PASSWORD`]);
  const response = observed(page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/staff/login' && r.request().method() === 'POST'));
  await page.getByRole('button', { name: 'Đăng nhập nhân viên', exact: true }).click();
  expect((await response).status()).toBe(200);
  await page.waitForURL(url => url.pathname !== '/staff/login');
}
async function branch(page: Page) {
  await page.goto('/staff/switch-branch');
  const select = page.locator('select[name="branch_id"]');
  await expect(select).toBeEnabled();
  await select.selectOption(accounts.QA_BRANCH_ID);
}
async function continueBranch(page: Page) {
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click();
  await page.waitForURL(url => !url.pathname.startsWith('/staff/switch-'));
}

test('ADMIN DEV supplier, agreement, reference prices and photo', async ({ page }) => {
  const walk = walkthrough(page, 'admin');
  const suffix = Date.now().toString(36);
  const supplierName = `${prefix}NCC-${suffix}`;
  const supplierCode = `${prefix}NCC-${suffix}`;
  const agreementCode = `${prefix}HD-${suffix}`;
  const png = resolve(root, '.cache/tmp/E2E-261030-supplier.png');
  writeFileSync(png, pngBytes);
  await walk.step('login', () => login(page, 'ADMIN'));
  await walk.step('branch-selection', () => branch(page));
  await walk.step('branch-selected', () => continueBranch(page));
  await walk.step('supplier-list', async () => {
    await page.goto('/inventory/suppliers');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nhà cung cấp', exact: true })).toBeVisible();
  });
  await walk.step('supplier-form', async () => {
    await page.getByRole('button', { name: 'Thêm nhà cung cấp', exact: true }).click();
    await page.getByLabel('Mã nhà cung cấp', { exact: true }).fill(supplierCode);
    await page.getByLabel('Tên nhà cung cấp', { exact: true }).fill(supplierName);
  });
  await walk.step('supplier-created', async () => {
    const saved = observed(page.waitForResponse(r => new URL(r.url()).pathname === '/api/inventory/suppliers' && r.request().method() === 'POST'));
    await page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true }).click();
    const response = await saved; expect(response.status()).toBe(201);
    const body = await response.json();
    saveCreated({ supplierId: (body.data ?? body).id, supplierName, supplierCode, agreementCode });
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByLabel('Tìm nhà cung cấp theo tên hoặc mã').fill(supplierCode);
    await expect(page.getByRole('link', { name: supplierName, exact: true })).toBeVisible();
  });
  await walk.step('supplier-detail', async () => {
    await page.getByRole('link', { name: supplierName, exact: true }).click();
    await expect(page.getByRole('heading', { name: supplierName, exact: true })).toBeVisible();
  });
  await walk.step('agreement-form', async () => {
    await page.getByRole('tab', { name: 'Bảng giá', exact: true }).click();
    await page.getByRole('button', { name: 'Lập bảng giá mới', exact: true }).click();
    await page.getByLabel('Mã bảng giá', { exact: true }).fill(agreementCode);
    await page.getByLabel('Hiệu lực từ', { exact: true }).fill('2026-10-30');
    await page.getByLabel('Hiệu lực đến', { exact: true }).fill('2027-10-30');
    const input = page.getByRole('combobox', { name: 'Nguyên liệu', exact: true });
    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await page.getByRole('option').first().click();
    await page.getByLabel('Giá VND / đơn vị', { exact: true }).fill('25000');
  });
  await walk.step('agreement-created', async () => {
    const saved = observed(page.waitForResponse(r => /\/agreements$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'));
    await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
    expect((await saved).status()).toBe(201);
    await expect(page.getByRole('article').filter({ hasText: agreementCode })).toContainText('Nháp');
  });
  await walk.step('agreement-view', async () => {
    const card = page.getByRole('article').filter({ hasText: agreementCode });
    await expect(card).toContainText('25.000');
    await card.getByRole('button', { name: 'Mở bản nháp', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });
  await walk.step('agreement-applied', async () => {
    const saved = observed(page.waitForResponse(r => /\/versions$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'));
    await page.getByRole('button', { name: 'Áp dụng bảng giá', exact: true }).click();
    expect((await saved).status()).toBe(201);
    await expect(page.getByRole('article').filter({ hasText: agreementCode })).toContainText('Đã áp dụng');
  });
  await walk.step('reference-prices', async () => {
    await page.goto(`/inventory/suppliers/${created().supplierId}`);
    await page.getByRole('tab', { name: 'Bảng giá', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Bảng giá tham chiếu', exact: true })).toContainText(agreementCode);
  });
  await walk.step('supplier-photo-selected', async () => {
    await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
    await page.getByLabel('Chọn ảnh', { exact: true }).setInputFiles(png);
    const preview = page.getByRole('img', { name: 'Xem trước ảnh nhà cung cấp', exact: true });
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(16);
  });
  await walk.step('supplier-photo-uploaded', async () => {
    await page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator(`img[alt="Ảnh nhà cung cấp ${supplierName}"]`)).toBeVisible();
  });
  await walk.step('supplier-photo-after-reload', async () => {
    await page.reload();
    const photo = page.locator(`img[alt="Ảnh nhà cung cấp ${supplierName}"]`);
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });
  await walk.finish();
});

test('ADMIN DEV valid PNG photo retry', async ({ page }) => {
  const walk = walkthrough(page, 'admin-photo-retry');
  const data = created();
  const png = resolve(root, '.cache/tmp/E2E-261030-supplier.png');
  writeFileSync(png, pngBytes);
  await walk.step('login', () => login(page, 'ADMIN'));
  await walk.step('branch-selection', () => branch(page));
  await walk.step('branch-selected', () => continueBranch(page));
  await walk.step('valid-png-selected', async () => {
    if (!data.supplierId) throw new Error('Run ADMIN walkthrough first to create supplier');
    await page.goto(`/inventory/suppliers/${data.supplierId}`);
    await page.getByRole('button', { name: 'Sửa thông tin', exact: true }).click();
    await page.getByLabel('Chọn ảnh', { exact: true }).setInputFiles(png);
    const preview = page.getByRole('img', { name: 'Xem trước ảnh nhà cung cấp', exact: true });
    await expect(preview).toBeVisible();
    await expect.poll(() => preview.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBe(16);
  });
  await walk.step('valid-png-upload', async () => {
    await page.getByRole('button', { name: 'Lưu nhà cung cấp', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
  await walk.step('valid-png-after-reload', async () => {
    await page.reload();
    const photo = page.locator(`img[alt="Ảnh nhà cung cấp ${data.supplierName}"]`);
    await expect(photo).toBeVisible();
    await expect.poll(() => photo.evaluate(el => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  });
  await walk.finish();
});

test('FOOD_DEV DEV read only supplier and inline material picker', async ({ page }) => {
  const walk = walkthrough(page, 'food-dev');
  await walk.step('login', () => login(page, 'FOOD_DEV'));
  await walk.step('branch-selection', () => branch(page));
  await walk.step('branch-selected', () => continueBranch(page));
  await walk.step('supplier-list-readonly', async () => {
    await page.goto('/inventory/suppliers');
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Thêm nhà cung cấp', exact: true })).toHaveCount(0);
  });
  await walk.step('supplier-detail-readonly', async () => {
    const data = created();
    if (data.supplierId) await page.goto(`/inventory/suppliers/${data.supplierId}`);
    else await page.getByRole('table').getByRole('link').first().click();
    await expect(page.getByRole('tab', { name: 'Bảng giá', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sửa thông tin|Ngừng hợp tác|Khôi phục hợp tác/ })).toHaveCount(0);
  });
  await walk.step('supplier-reference-readonly', async () => {
    await page.getByRole('tab', { name: 'Bảng giá', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Bảng giá tham chiếu', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /Lập bảng giá mới|Mở bản nháp|Ngừng dùng|Gắn chứng từ/ })).toHaveCount(0);
  });
  const packs = page.getByRole('region', { name: 'Gói và công thức', exact: true });
  await walk.step('recipe-existing-open', async () => {
    await page.goto('/production/food-plans');
    await page.getByRole('tab', { name: 'Gói + công thức', exact: true }).click();
    await packs.getByRole('button', { name: /^Xem / }).first().click();
    await packs.getByRole('button', { name: /^(Tạo|Sửa) công thức$/ }).click();
    await expect(packs.getByRole('form', { name: 'Biên tập công thức', exact: true })).toBeVisible();
  });
  await walk.step('package-create-form', async () => {
    await packs.getByRole('button', { name: 'Tạo gói', exact: true }).first().click();
    const form = packs.getByRole('form', { name: 'Biên tập gói', exact: true });
    const input = form.getByRole('combobox', { name: 'Họ món của gói', exact: true });
    await input.scrollIntoViewIfNeeded(); await input.click();
    await expect(form.getByRole('option').first()).toBeVisible();
    await input.press('ArrowDown'); await input.press('Enter');
    const packageName = `${prefix}Goi-${Date.now().toString(36)}`;
    await form.getByLabel('Tên gói', { exact: true }).fill(packageName);
    saveCreated({ packageName });
  });
  await walk.step('package-created', async () => {
    const saved = observed(page.waitForResponse(r => /\/sales\/packages$/.test(new URL(r.url()).pathname) && r.request().method() === 'POST'));
    await packs.getByRole('form', { name: 'Biên tập gói', exact: true }).getByRole('button', { name: 'Lưu gói', exact: true }).click();
    const response = await saved; expect(response.status()).toBe(201);
    const body = await response.json(); saveCreated({ packageId: (body.data ?? body).id });
    await expect(packs.getByRole('button', { name: 'Tạo công thức', exact: true })).toBeVisible();
  });
  await walk.step('recipe-new-open', async () => {
    await packs.getByRole('button', { name: 'Tạo công thức', exact: true }).click();
    await expect(packs.getByRole('form', { name: 'Biên tập công thức', exact: true })).toBeVisible();
  });
  const picker = packs.getByRole('region', { name: 'Chọn nguyên liệu', exact: true }).first();
  await walk.step('material-picker-list', async () => {
    const input = picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true });
    await input.click();
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    await expect(picker.getByRole('listbox')).toBeVisible();
    await input.press('Escape');
  });
  await walk.step('material-group-level-1', async () => { await pick(picker, 'Nhóm cấp 1', 'Thịt'); });
  await walk.step('material-group-level-2', async () => {
    const input = picker.getByRole('combobox', { name: 'Nhóm cấp 2', exact: true });
    await input.scrollIntoViewIfNeeded(); await input.fill('');
    const option = picker.getByRole('option').first();
    await expect(option).toBeVisible();
    const name = (await option.innerText()).trim();
    await input.press('Enter');
    await expect(input).toHaveValue(name);
    await picker.getByRole('button', { name: 'Lọc nguyên liệu', exact: true }).click();
    await expect(picker).toHaveAttribute('aria-busy', 'false');
  });
  const materialName = `${prefix}me-chua-${Date.now().toString(36)}`;
  await walk.step('material-unknown-name', async () => {
    await picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true }).fill(materialName);
    await expect(picker.getByRole('button', { name: `Tạo nguyên liệu “${materialName}”`, exact: true })).toBeVisible();
  });
  const form = picker.getByRole('form', { name: 'Tạo nguyên liệu', exact: true });
  await walk.step('material-inline-create-form', async () => {
    await picker.getByRole('button', { name: `Tạo nguyên liệu “${materialName}”`, exact: true }).click();
    await pick(form, 'Nhóm cấp 1', 'Trái cây');
    await pick(form, 'Nhóm cấp 2', 'Trái cây tươi');
    await form.getByRole('combobox', { name: 'Đơn vị', exact: true }).selectOption('KG');
  });
  await walk.step('material-created-in-row', async () => {
    const saved = observed(page.waitForResponse(r => new URL(r.url()).pathname === '/api/sales/skus' && r.request().method() === 'POST'));
    await form.getByRole('button', { name: 'Tạo nguyên liệu', exact: true }).click();
    const response = await saved; expect(response.status()).toBe(201);
    const body = await response.json(); saveCreated({ materialName, materialId: (body.data ?? body).id });
    await expect(packs.getByRole('group', { name: materialName, exact: true })).toBeVisible();
  });
  await walk.step('material-duplicate-form', async () => {
    const other = `${prefix}duplicate-${Date.now().toString(36)}`;
    await picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true }).fill(other);
    await picker.getByRole('button', { name: `Tạo nguyên liệu “${other}”`, exact: true }).click();
    await form.getByLabel('Tên', { exact: true }).fill(materialName);
    await pick(form, 'Nhóm cấp 1', 'Trái cây');
    await pick(form, 'Nhóm cấp 2', 'Trái cây tươi');
  });
  await walk.step('material-duplicate-rejected', async () => {
    const duplicate = observed(page.waitForResponse(r => new URL(r.url()).pathname === '/api/sales/skus' && r.request().method() === 'POST'));
    await form.getByRole('button', { name: 'Tạo nguyên liệu', exact: true }).click();
    expect((await duplicate).status()).toBe(409);
    await expect(form.getByRole('status')).toContainText(`Đã có ${materialName}`);
    await expect(form.getByRole('button', { name: 'Dùng nguyên liệu đã có', exact: true })).toBeVisible();
  });
  await walk.finish();
});
