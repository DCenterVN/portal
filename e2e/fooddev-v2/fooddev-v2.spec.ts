import { test, expect, type Page, type Locator } from '@playwright/test';
import { z } from 'zod';
import { login, pick, screen } from './helpers';

const family = process.env.FOODDEV_FAMILY_NAME || 'E2E Họ món';
const protein = process.env.FOODDEV_PROTEIN_NAME || 'E2E Gói đạm';
const vegetable = process.env.FOODDEV_VEGETABLE_NAME || 'E2E Gói rau';
const seasoning = process.env.FOODDEV_SEASONING_NAME || 'E2E Gói gia vị';
const rule = 'Món cần ít nhất một gói gia vị không được bỏ';
const setSchema = z.object({ id: z.string(), updated_at: z.string(), tags: z.array(z.string()), slots: z.array(z.object({ slot: z.string(), swappable: z.boolean(), removable: z.boolean(), options: z.array(z.object({ sku_ref: z.string(), quantity: z.number(), is_default: z.boolean() })) })) });
const setResponseSchema = z.union([setSchema, z.object({ data: setSchema }).transform(body => body.data)]);
let savedSet: z.infer<typeof setSchema>;

test.describe.configure({ mode: 'serial' });

async function readonly(scope: Page | Locator, label: string) {
  const field = scope.getByLabel(label, { exact: true });
  await expect(field).toBeVisible();
  expect(await field.evaluate(element => element.tagName === 'OUTPUT' || (element instanceof HTMLInputElement && element.readOnly)), `${label} phải chỉ đọc`).toBe(true);
  await expect(scope.getByRole('textbox', { name: label, exact: true })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await login(page);
  await page.getByRole('tab', { name: 'Set (nâng cao)', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Set', exact: true }).getByRole('button', { name: 'Tạo set món', exact: true }).first()).toBeVisible();
  await screen(page, 'food-dev-login');
});

test('AC-4: nhóm hai cấp, tạo nguyên liệu tại dòng và xử lý trùng tên', async ({ page }) => {
  await page.getByRole('tab', { name: 'Gói + công thức', exact: true }).click();
  const packs = page.getByRole('region', { name: 'Gói và công thức', exact: true });
  await packs.getByRole('button', { name: `Xem ${protein}`, exact: true }).click();
  await packs.getByRole('button', { name: /^(Tạo|Sửa) công thức$/ }).click();
  const picker = packs.getByRole('region', { name: 'Chọn nguyên liệu', exact: true }).first();
  await expect(picker.getByRole('combobox', { name: 'Nhóm cấp 1', exact: true })).toBeVisible();
  await expect(picker.getByRole('combobox', { name: 'Nhóm cấp 2', exact: true })).toBeVisible();
  await pick(picker, 'Nhóm cấp 1', 'Thịt');
  await picker.getByRole('combobox', { name: 'Nhóm cấp 2', exact: true }).click();
  await expect(picker.getByRole('option', { name: 'Trâu', exact: true })).toBeVisible();
  await screen(page, 'groups-thit-trau');
  await picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true }).fill('me chua');
  await expect(picker.getByText('Không có nguyên liệu phù hợp', { exact: true })).toBeVisible();
  await picker.getByRole('button', { name: 'Tạo nguyên liệu “me chua”', exact: true }).click();
  const form = picker.getByRole('form', { name: 'Tạo nguyên liệu', exact: true });
  await pick(form, 'Nhóm cấp 1', 'Trái cây');
  await pick(form, 'Nhóm cấp 2', 'Trái cây tươi');
  await form.getByRole('combobox', { name: 'Đơn vị', exact: true }).selectOption('KG');
  await screen(page, 'material-create-form');
  const created = page.waitForResponse(response => new URL(response.url()).pathname === '/api/sales/skus' && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Tạo nguyên liệu', exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(packs.getByRole('group', { name: 'me chua', exact: true })).toBeVisible();
  await screen(page, 'material-in-recipe-row');
  await picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true }).fill('nguyên liệu thử trùng');
  await picker.getByRole('button', { name: 'Tạo nguyên liệu “nguyên liệu thử trùng”', exact: true }).click();
  await form.getByLabel('Tên', { exact: true }).fill('Mè Chua');
  await pick(form, 'Nhóm cấp 1', 'Trái cây');
  await pick(form, 'Nhóm cấp 2', 'Trái cây tươi');
  const duplicate = page.waitForResponse(response => new URL(response.url()).pathname === '/api/sales/skus' && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Tạo nguyên liệu', exact: true }).click();
  expect((await duplicate).status()).toBe(409);
  await expect(form.getByRole('status')).toContainText('Đã có me chua');
  await expect(form.getByRole('button', { name: 'Dùng nguyên liệu đã có', exact: true })).toBeVisible();
  await screen(page, 'duplicate-material');
  await form.getByRole('button', { name: 'Dùng nguyên liệu đã có', exact: true }).click();
  await expect(form).toHaveCount(0);
  await expect(packs.getByRole('group', { name: 'me chua', exact: true })).toHaveCount(1);
  await screen(page, 'existing-material-selected');
});

test('AC-5: set Đạm Rau Gia vị không tinh bột; UI và API giữ gia vị bắt buộc', async ({ page }) => {
  const sets = page.getByRole('region', { name: 'Set', exact: true });
  await sets.getByRole('button', { name: 'Tạo set món', exact: true }).first().click();
  const form = sets.getByRole('form', { name: 'Biên tập set món', exact: true });
  await pick(form, 'Họ món', family);
  await expect(form.getByRole('combobox', { name: 'Khẩu phần', exact: true })).toBeVisible();
  await form.getByRole('combobox', { name: 'Khẩu phần', exact: true }).selectOption('2 người');
  await form.getByLabel('Mã set', { exact: true }).fill('E2E-V2-SET');
  await form.getByLabel('Tên set', { exact: true }).fill('E2E Set không tinh bột');
  await form.getByLabel('Hashtag tay', { exact: true }).fill('e2e, fooddev, khong-tinh-bot');
  const draft = page.waitForResponse(response => new URL(response.url()).pathname === '/api/food-packs/sales/sets' && response.request().method() === 'POST');
  await form.getByRole('button', { name: 'Lưu set món', exact: true }).click();
  expect((await draft).status()).toBe(201);
  await screen(page, 'set-draft');
  await sets.getByRole('button', { name: 'Sửa set món', exact: true }).click();
  for (const [slot, label, pack] of [['DAM', 'Đạm', protein], ['RAU', 'Rau', vegetable], ['COT', 'Cốt (gia vị)', seasoning]]) {
    await form.getByRole('combobox', { name: 'Thêm ô', exact: true }).selectOption(slot);
    const group = form.getByRole('group', { name: label, exact: true });
    await pick(group, 'Thêm gói theo tên', pack);
  }
  await expect(form.getByRole('group', { name: 'Tinh bột', exact: true })).toHaveCount(0);
  const spice = form.getByRole('group', { name: 'Cốt (gia vị)', exact: true });
  await expect(spice.getByRole('checkbox', { name: 'Cho bỏ ô', exact: true })).toBeDisabled();
  await expect(spice.getByRole('checkbox', { name: 'Cho bỏ ô', exact: true })).not.toBeChecked();
  await expect(form).toContainText(rule);
  await screen(page, 'last-seasoning-ui-blocked');
  const saved = page.waitForResponse(response => /\/api\/food-packs\/sales\/sets\/[^/]+$/.test(new URL(response.url()).pathname) && response.request().method() === 'PUT');
  await form.getByRole('button', { name: 'Lưu set món', exact: true }).click();
  const response = await saved;
  expect(response.status()).toBe(200);
  savedSet = setResponseSchema.parse(await response.json());
  expect(savedSet.slots.map(slot => slot.slot)).toEqual(['DAM', 'RAU', 'COT']);
  await page.reload();
  await sets.getByRole('button', { name: 'Xem E2E Set không tinh bột', exact: true }).click();
  await expect(sets.getByRole('combobox', { name: 'Đạm', exact: true })).toContainText(protein);
  await screen(page, 'set-saved-reloaded');
  const rejected = await page.evaluate(async ({ id, data }) => {
    const response = await fetch(`/api/food-packs/sales/sets/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    return { status: response.status, text: await response.text() };
  }, { id: savedSet.id, data: { tags: savedSet.tags, expected_updated_at: savedSet.updated_at, slots: savedSet.slots.map(slot => ({ ...slot, removable: slot.slot === 'COT' })) } });
  expect(rejected.status).toBe(422);
  expect(rejected.text).toContain(rule);
  const unchanged = await page.evaluate(async id => {
    const response = await fetch(`/api/food-packs/sales/sets/${id}`);
    return { status: response.status, body: await response.json() };
  }, savedSet.id);
  expect(unchanged.status).toBe(200);
  expect(setResponseSchema.parse(unchanged.body).slots.find(slot => slot.slot === 'COT')?.removable).toBe(false);
});

test('AC-6/7: bảy trường là danh sách/chỉ đọc, không hiện UUID trên mọi màn đã đi', async ({ page }) => {
  await page.getByRole('tab', { name: 'Gói + công thức', exact: true }).click();
  const packs = page.getByRole('region', { name: 'Gói và công thức', exact: true });
  await packs.getByRole('button', { name: 'Tạo gói', exact: true }).first().click();
  const packForm = packs.getByRole('form', { name: 'Biên tập gói', exact: true });
  await readonly(packForm, 'Mã gói');
  await packForm.getByLabel('Tên gói', { exact: true }).fill('Gói thử sinh mã');
  await expect(packForm.getByLabel('Mã gói', { exact: true })).toHaveText(/^GOI-THU-SINH-MA-[A-F0-9]{4}$/);
  await expect(packForm.getByRole('combobox', { name: 'Chế độ nhiệt', exact: true })).toHaveValue('CHILLED');
  await expect(packForm.getByRole('combobox', { name: 'Chế độ nhiệt', exact: true }).locator('option')).toHaveText(['Mát 0–4 °C', 'Đông lạnh', 'Nhiệt độ thường']);
  await screen(page, 'package-readonly-code-and-temperature');
  await page.goto('/production/targets');
  await page.getByRole('button', { name: 'Tạo chỉ tiêu', exact: true }).first().click();
  await readonly(page, 'Slug sản phẩm');
  await page.getByLabel('Tên sản phẩm', { exact: true }).fill('Món thử chỉ tiêu');
  await expect(page.getByLabel('Slug sản phẩm', { exact: true })).toHaveText('mon-thu-chi-tieu');
  await readonly(page, 'Đơn vị');
  await expect(page.getByLabel('Đơn vị', { exact: true })).toHaveText('suất');
  await screen(page, 'target-slug-unit');
  await page.getByLabel('Tiêu đề', { exact: true }).fill('E2E Chỉ tiêu FOODDEV V2');
  await pick(page, 'Sản phẩm', family);
  const target = page.waitForResponse(response => new URL(response.url()).pathname === '/api/production/targets' && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Lưu chỉ tiêu', exact: true }).click();
  expect((await target).status()).toBe(201);
  const row = page.getByRole('row').filter({ hasText: 'E2E Chỉ tiêu FOODDEV V2' });
  await screen(page, 'target-saved');
  await row.getByRole('link', { name: 'Tạo set', exact: true }).click();
  await page.getByRole('tab', { name: 'Thực đơn', exact: true }).click();
  await page.getByRole('button', { name: 'Tạo set', exact: true }).first().click();
  const plan = page.getByRole('form', { name: 'Tạo set', exact: true });
  await expect(plan.getByRole('combobox', { name: 'Mã set', exact: true })).toBeVisible();
  await readonly(plan, 'Khẩu phần');
  await readonly(plan, 'Số suất mỗi kit');
  await pick(plan, 'Mã set', 'E2E-V2-SET');
  await expect(plan.getByLabel('Khẩu phần', { exact: true })).toHaveText('2 người');
  await expect(plan.getByLabel('Số suất mỗi kit', { exact: true })).toHaveText('2');
  await screen(page, 'menu-variant-servings-readonly');
});
