import { test, expect, type Page } from '@playwright/test';
import { z } from 'zod';
import { login, pick, screen } from './helpers';
import { contentSchema, draftSchema } from '../../lib/api/dishes';

const sales = '/api/food-packs/sales';
const packSchema = z.object({ slot: z.string(), package_ref: z.string(), lines: z.array(z.object({ sku_ref: z.string(), quantity: z.string(), uom: z.string(), yield_pct: z.string() })) });
const detailSchema = z.object({ product: z.object({ id: z.string() }), variants: z.array(z.object({ set_ref: z.string(), servings: z.number(), journey: z.string(), packs: z.array(packSchema) })) });
const completedSchema = z.object({ ok: z.literal(true), product_ref: z.string(), set_ref: z.string() });
const costSchema = z.object({ complete: z.boolean(), lines: z.array(z.object({ sku_ref: z.string(), missing: z.string().nullable(), cost_vnd: z.number().nullable() })) });
const fixture = (key: string) => { const value = process.env[`FOODDEV_${key}_ID`]; if (!value) throw new Error(`Missing fixture ${key}`); return value; };

async function api<T>(page: Page, path: string, schema: z.ZodType<T>, method = 'GET', body?: unknown, status = 200) {
  const response = await page.evaluate(async ({ path, method, body }) => {
    const result = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: result.status, body: await result.json() };
  }, { path, method, body });
  const value: unknown = response.body;
  if (response.status !== status) {
    await test.info().attach('api-failure', { body: JSON.stringify({ path, method, request: body, status: response.status, response: value }, null, 2), contentType: 'application/json' });
  }
  expect(response.status, `${method} ${path}`).toBe(status);
  return schema.parse(value && typeof value === 'object' && 'data' in value ? value.data : value);
}

async function detail(page: Page, product: string) { return api(page, `/api/dishes/${product}`, detailSchema); }
async function open(page: Page, product: string) {
  await page.goto(`/production/food-plans?tab=dishes&mon=${product}`);
  await expect(page.getByRole('button', { name: 'Tạo bản sửa', exact: true })).toBeVisible();
  await screen(page, 'dish-detail');
}
async function begin(page: Page, button: string) {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === `${sales}/dish-drafts` && r.request().method() === 'POST');
  await page.getByRole('button', { name: button, exact: true }).first().click();
  expect((await response).status()).toBe(201);
  await page.waitForURL(url => url.searchParams.has('draft'));
  await expect(page.getByLabel('Tên món', { exact: true })).toBeVisible();
  return new URL(page.url()).searchParams.get('draft') ?? '';
}
async function save(page: Page) {
  const response = page.waitForResponse(r => /\/sales\/dish-drafts\/[^/]+$/.test(new URL(r.url()).pathname) && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Lưu nháp', exact: true }).click();
  expect((await response).status()).toBe(200);
  await expect(page.getByRole('status').filter({ hasText: /^Đã lưu/ })).toBeVisible();
}
async function finish(page: Page) {
  await fields(page);
  const response = page.waitForResponse(r => /\/api\/dishes\/drafts\/[^/]+\/complete$/.test(new URL(r.url()).pathname));
  await page.getByRole('button', { name: 'Hoàn tất món', exact: true }).click();
  const result = await response;
  if (!result.ok()) await test.info().attach('complete-failure', { body: await result.text(), contentType: 'application/json' });
  expect(result.status()).toBe(200);
  const completed = completedSchema.parse(await result.json());
  await page.waitForURL(url => url.searchParams.get('mon') === completed.product_ref && !url.searchParams.has('draft'));
  await expect(page.getByRole('tab', { name: /Đã hoàn tất/ }).first()).toBeVisible();
  await screen(page, 'dish-completed');
  return completed;
}
async function ingredient(page: Page, name: string, quantity: string) {
  await page.getByRole('button', { name: 'Thêm dòng nguyên liệu', exact: true }).click();
  await screen(page, 'after-add-ingredient');
  const picker = page.getByRole('region', { name: 'Chọn nguyên liệu', exact: true });
  await pick(picker, 'Nguyên liệu', name);
  await page.getByRole('textbox', { name: /^Lượng \/ suất dòng/ }).last().fill(quantity);
}
async function fields(page: Page) {
  const name = page.getByLabel('Tên món', { exact: true });
  expect(await name.evaluate(el => el instanceof HTMLInputElement && el.readOnly)).toBe(await page.getByRole('heading', { name: /^(Tạo biến thể|Tạo bản sửa)$/ }).count() > 0);
  await expect(page.getByLabel('Hashtag', { exact: true })).toBeEditable();
  const revision = await page.getByRole('heading', { name: 'Tạo bản sửa', exact: true }).count() > 0;
  const locked = revision || await page.getByRole('heading', { name: 'Tạo biến thể', exact: true }).count() > 0;
  if (!locked) await expect(page.getByRole('combobox', { name: 'Danh mục', exact: true })).toHaveAttribute('aria-expanded', /true|false/);
  else await expect(page.getByLabel('Danh mục', { exact: true })).toHaveJSProperty('tagName', 'OUTPUT');
  if (!revision) await expect(page.getByRole('combobox', { name: 'Khẩu phần', exact: true })).toBeVisible();
  else await expect(page.getByLabel('Khẩu phần', { exact: true })).toHaveText(/người/);
  const rows = page.getByRole('region', { name: 'Nguyên liệu món', exact: true }).getByRole('row');
  for (const row of await rows.all()) {
    if (await row.getByRole('columnheader').count()) continue;
    // §6.2 only quantity and loss may be edited; all derived cells contain no controls.
    for (const column of [2, 4, 5, 6]) await expect(row.getByRole('cell').nth(column).locator('input,select,textarea,[contenteditable="true"]')).toHaveCount(0);
    await expect(row.getByRole('textbox', { name: /^Lượng/ })).toBeEditable();
    await expect(row.getByRole('spinbutton', { name: /^Hao hụt/ })).toBeEditable();
    await expect(row.getByRole('button', { name: /^Chọn \/ thay/ }).locator('svg')).toBeVisible();
  }
  const spice = page.getByRole('region', { name: 'Gia vị', exact: true });
  for (const combo of await spice.getByRole('combobox').all()) await expect(combo).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Giá vốn ước tính', exact: true }).locator('..').locator('input,select,textarea')).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: /Mã món|Mã gói|Mã set/ })).toHaveCount(0);
  await screen(page, 'dish-field-types');
}

let m1 = '';
test.beforeEach(async ({ page }) => { await login(page); });

test.describe('M1 và các món dẫn xuất', () => {
  test.describe.configure({ mode: 'serial' });
  test('T1: M1 không tinh bột, nháp thiếu bền sau tải lại, hoàn tất', async ({ page }) => {
    const id = await begin(page, 'Tạo món');
    await page.getByLabel('Tên món', { exact: true }).fill('M1 Thịt trâu xào rau muống S13');
    await ingredient(page, 'Thịt trâu S13', '');
    await save(page);
    const stored = await api(page, `${sales}/dish-drafts/${id}`, z.object({ draft: draftSchema }));
    await page.reload();
    await expect(page.getByLabel('Tên món', { exact: true })).toHaveValue('M1 Thịt trâu xào rau muống S13');
    await expect(page.getByRole('textbox', { name: 'Lượng / suất dòng 1', exact: true })).toHaveValue('');
    await expect(page.getByRole('combobox', { name: 'Danh mục', exact: true })).toHaveValue('');
    expect((await api(page, `${sales}/dish-drafts/${id}`, z.object({ draft: draftSchema }))).draft.content).toEqual(stored.draft.content);
    await screen(page, 'T1-incomplete-reloaded');
    await pick(page, 'Danh mục', 'Món E2E');
    await page.getByLabel('Hashtag', { exact: true }).fill('trau, xao, rau-muong');
    await page.getByRole('textbox', { name: 'Lượng / suất dòng 1', exact: true }).fill('150');
    await ingredient(page, 'Rau muống S13', '200');
    await ingredient(page, 'Tỏi S13', '10');
    await page.getByRole('button', { name: 'Thêm gia vị', exact: true }).click();
    await pick(page, 'Gói gia vị 1', 'E2E Gói gia vị');
    await expect(page.getByRole('checkbox', { name: 'Cho bỏ gói 1', exact: true })).toBeDisabled();
    await expect(page.getByText(/Tổng \/ suất: 360 g\. Tổng \/ kit: 720 g/)).toBeVisible();
    const complete = await finish(page); m1 = complete.product_ref;
    const dish = await detail(page, m1);
    expect(dish.variants[0].packs.map(p => p.slot).sort()).toEqual(['DAM', 'RAU']);
    expect(dish.variants[0].journey).toBe('DONE');
    await page.getByRole('button', { name: 'Về danh sách món', exact: true }).click();
    await expect(page.getByRole('row').filter({ hasText: 'M1 Thịt trâu xào rau muống S13' })).toContainText('Đã hoàn tất');
    await screen(page, 'T1-list-done');
  });

  test('T2: nhân bản M1 → M2, chỉ gói đổi có ref mới', async ({ page }) => {
    const before = await detail(page, m1);
    await open(page, m1); await begin(page, 'Nhân bản');
    await page.getByLabel('Tên món', { exact: true }).fill('M2 Thịt bò xào rau muống S13');
    const index = before.variants[0].packs.flatMap(p => p.lines).findIndex(l => l.sku_ref === fixture('BUFFALO')) + 1;
    await page.getByRole('button', { name: `Chọn / thay nguyên liệu dòng ${index}`, exact: true }).click();
    await pick(page.getByRole('region', { name: 'Chọn nguyên liệu', exact: true }), 'Nguyên liệu', 'Thịt bò S13');
    const complete = await finish(page);
    expect(complete.product_ref).not.toBe(m1);
    const copied = await detail(page, complete.product_ref);
    const ref = (dish: z.infer<typeof detailSchema>, slot: string) => dish.variants[0].packs.find(p => p.slot === slot)?.package_ref;
    expect(ref(copied, 'RAU')).toBe(ref(before, 'RAU'));
    expect(ref(copied, 'DAM')).not.toBe(ref(before, 'DAM'));
    expect(await detail(page, m1)).toEqual(before);
  });

  test('T3: biến thể 4 người dùng lại gói; REVISION OPEN trùng trả 409 và mở nháp cũ', async ({ page }) => {
    const before = await detail(page, m1);
    await open(page, m1); const variantDraft = await begin(page, 'Tạo biến thể');
    await expect(page.getByRole('combobox', { name: 'Khẩu phần', exact: true })).toHaveValue('4');
    await expect(page.getByRole('combobox', { name: 'Khẩu phần', exact: true }).locator('option[value="2"]')).toHaveCount(0);
    await expect(page.getByText(/Tổng \/ kit: 1\.440 g/)).toBeVisible();
    const rows = page.getByRole('region', { name: 'Nguyên liệu món', exact: true }).getByRole('row');
    for (const amount of ['600', '800', '40']) await expect(rows.getByRole('cell', { name: amount, exact: true })).toBeVisible();
    const variant = await finish(page);
    const after = await detail(page, m1);
    expect(after.variants).toHaveLength(2);
    expect(after.variants.find(v => v.set_ref === variant.set_ref)?.packs).toEqual(before.variants[0].packs);
    const stored = await api(page, `${sales}/dish-drafts/${variantDraft}`, z.object({ draft: draftSchema }));
    const duplicate = await api(page, `${sales}/dish-drafts`, z.object({ draft: draftSchema }), 'POST', { kind: 'VARIANT', source_product_ref: m1, source_set_ref: before.variants[0].set_ref, content: stored.draft.content }, 201);
    const rejected = await api(page, `/api/dishes/drafts/${duplicate.draft.id}/complete`, z.object({ errors: z.array(z.object({ existing: z.object({ set_ref: z.string() }).optional() })) }), 'POST', undefined, 409);
    expect(rejected.errors.some(e => e.existing?.set_ref === variant.set_ref)).toBe(true);
    // The second revision must hit the backend's unique OPEN constraint, through the UI.
    await page.getByRole('tab', { name: '2 người · Đã hoàn tất', exact: true }).click();
    const draft = await begin(page, 'Tạo bản sửa');
    await fields(page);
    await open(page, m1);
    await page.getByRole('tab', { name: '2 người · Đã hoàn tất', exact: true }).click();
    const conflict = page.waitForResponse(r => new URL(r.url()).pathname === `${sales}/dish-drafts` && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Tạo bản sửa', exact: true }).click();
    const response = await conflict;
    expect(response.status()).toBe(409);
    expect(z.object({ errors: z.object({ existing: z.object({ id: z.string() }) }) }).parse(await response.json()).errors.existing.id).toBe(draft);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Đã có nháp bản sửa');
    await screen(page, 'T3-existing-revision');
    await page.getByRole('button', { name: 'Mở bản đang có', exact: true }).click();
    await page.waitForURL(url => url.searchParams.get('draft') === draft);
    await fields(page);
  });
});

test('T5: tạo nguyên liệu chưa có ngay trong màn Món', async ({ page }) => {
  await begin(page, 'Tạo món');
  await page.getByRole('button', { name: 'Thêm dòng nguyên liệu', exact: true }).click();
  const picker = page.getByRole('region', { name: 'Chọn nguyên liệu', exact: true });
  await picker.getByRole('combobox', { name: 'Nguyên liệu', exact: true }).fill('Me theo mùa S13');
  await picker.getByRole('button', { name: 'Tạo nguyên liệu “Me theo mùa S13”', exact: true }).click();
  const form = picker.getByRole('form', { name: 'Tạo nguyên liệu', exact: true });
  await pick(form, 'Nhóm cấp 1', 'Trái cây'); await pick(form, 'Nhóm cấp 2', 'Trái cây tươi');
  await form.getByRole('combobox', { name: 'Đơn vị', exact: true }).selectOption('KG');
  const created = page.waitForResponse(r => new URL(r.url()).pathname === '/api/sales/skus' && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Tạo nguyên liệu', exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByRole('region', { name: 'Nguyên liệu món', exact: true }).getByRole('row').filter({ hasText: 'Me theo mùa S13' })).toBeVisible();
  await fields(page); await save(page); await page.reload();
  await expect(page.getByRole('region', { name: 'Nguyên liệu món', exact: true })).toContainText('Me theo mùa S13');
  await screen(page, 'T5-created-material');
});

test('T6: bản sửa M4 thay theo mùa, PREPARATION giữ nhu cầu đã ghim', async ({ page }) => {
  const requirements = `/api/production/food-plans/${fixture('PREPARATION')}/material-requirements`;
  const demand = z.object({ computed_at: z.string() }).passthrough().transform(value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'computed_at')));
  const before = await api(page, requirements, demand);
  const oldDish = await detail(page, fixture('M4'));
  await open(page, fixture('M4')); await begin(page, 'Tạo bản sửa');
  const index = oldDish.variants[0].packs.flatMap(p => p.lines).findIndex(l => l.sku_ref === fixture('OKRA')) + 1;
  await page.getByRole('button', { name: `Chọn / thay nguyên liệu dòng ${index}`, exact: true }).click();
  await pick(page.getByRole('region', { name: 'Chọn nguyên liệu', exact: true }), 'Nguyên liệu', 'Dọc mùng S13');
  await expect(page.getByRole('button', { name: 'Hoàn tất món', exact: true })).toBeDisabled();
  await page.getByLabel('Lý do sửa', { exact: true }).fill('Đổi đậu bắp sang dọc mùng theo mùa');
  const completed = await finish(page);
  expect(completed.set_ref).toBe(fixture('M4_SET'));
  const revised = await detail(page, fixture('M4'));
  expect(revised.variants[0].packs.find(p => p.slot === 'RAU')?.package_ref).not.toBe(oldDish.variants[0].packs.find(p => p.slot === 'RAU')?.package_ref);
  expect(revised.variants[0].packs.find(p => p.slot === 'DAM')).toEqual(oldDish.variants[0].packs.find(p => p.slot === 'DAM'));
  expect(await api(page, requirements, demand)).toEqual(before);
  const serialized = JSON.stringify(before);
  expect(serialized).toContain(fixture('OKRA')); expect(serialized).not.toContain(fixture('TARO'));
  await expect(page.getByText(/Đổi đậu bắp sang dọc mùng theo mùa/)).toBeVisible();
  await screen(page, 'T6-pinned-preparation');
});

test('Giá vốn: đúng một nguyên liệu thiếu giá, dòng và tổng báo chưa đủ', async ({ page }) => {
  await begin(page, 'Tạo món');
  await ingredient(page, 'Dọc mùng S13', '100');
  await ingredient(page, 'Tỏi S13', '10');
  await page.getByRole('button', { name: 'Thêm gia vị', exact: true }).click();
  await pick(page, 'Gói gia vị 1', 'E2E Gói gia vị');
  await save(page);
  await expect(page.getByRole('heading', { name: 'Giá vốn ước tính', exact: true }).locator('..').getByText('Chưa có giá', { exact: true })).toHaveCount(1);
  await expect(page.getByText(/Tổng \/ kit:.*chưa đủ/)).toBeVisible();
  await expect(page.getByText(/Tổng \/ suất:.*chưa đủ/)).toBeVisible();
  const content = contentSchema.parse((await api(page, `${sales}/dish-drafts/${new URL(page.url()).searchParams.get('draft')}`, z.object({ draft: draftSchema }))).draft.content);
  const cost = await api(page, '/api/food-packs/production/recipes/cost-preview', costSchema, 'POST', { servings: 2, lines: content.ingredients.filter(l => l.sku_ref).map(({ sku_ref, quantity, uom, yield_pct }) => ({ sku_ref, quantity, uom, yield_pct })), packages: [{ sku_ref: fixture('SEASONING'), quantity: 1 }] });
  expect(cost.complete).toBe(false);
  expect(cost.lines.filter(l => l.missing)).toEqual([expect.objectContaining({ sku_ref: fixture('TARO'), missing: 'NO_PRICE', cost_vnd: null })]);
  await fields(page); await screen(page, 'cost-missing-price');
});

test('S14d: tạo 2 món liên tiếp trong cùng phiên → 2 nháp khác nhau', async ({ page }) => {
  const session = await page.evaluate(() => {
    const marker = crypto.randomUUID();
    Object.assign(window, { s14dSession: marker });
    return marker;
  });
  const first = await begin(page, 'Tạo món');
  await page.getByLabel('Tên món', { exact: true }).fill('S14d Món A');
  await save(page);
  await screen(page, 'S14d-first-draft');
  await page.getByRole('button', { name: 'Về danh sách món', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Tạo món', exact: true })).toBeVisible();
  const second = await begin(page, 'Tạo món');
  await page.getByLabel('Tên món', { exact: true }).fill('S14d Món B');
  await save(page);
  expect(await page.evaluate(() => Reflect.get(window, 's14dSession'))).toBe(session);
  expect(second).not.toBe(first);
  for (const [id, name] of [[first, 'S14d Món A'], [second, 'S14d Món B']]) {
    const { draft } = await api(page, `${sales}/dish-drafts/${id}`, z.object({ draft: draftSchema }));
    expect(draft).toMatchObject({ id, kind: 'CREATE', status: 'OPEN', content: { name } });
  }
  await screen(page, 'S14d-second-draft');
});

test('S14d: Nháp đang soạn có nút Tải thêm', async ({ page }) => {
  const seeded: string[] = [];
  for (let index = 0; index < 41; index++) {
    const name = `S14d Phân trang ${index + 1}`;
    const { draft } = await api(page, `${sales}/dish-drafts`, z.object({ draft: draftSchema }), 'POST', {
      kind: index % 2 ? 'COPY' : 'CREATE',
      ...(index % 2 ? { source_product_ref: fixture('M4'), source_set_ref: fixture('M4_SET') } : {}),
      content: contentSchema.parse({ schema_version: 1, name, servings: 2 }),
    }, 201);
    expect(draft.status).toBe('OPEN');
    seeded.push(name);
  }
  const listSchema = z.object({ items: z.array(z.object({ id: z.string(), title: z.string().nullable(), kind: z.enum(['CREATE', 'COPY']), status: z.literal('OPEN') })), next_cursor: z.string().nullable() });
  const expected: z.infer<typeof listSchema>['items'] = [];
  let cursor: string | null = '';
  do {
    const query = new URLSearchParams({ status: 'OPEN', kind: 'CREATE,COPY', limit: '20', cursor });
    const result: z.infer<typeof listSchema> = await api(page, `${sales}/dish-drafts?${query}`, listSchema);
    expected.push(...result.items);
    cursor = result.next_cursor;
  } while (cursor);
  expect(new Set(expected.map(row => row.id)).size).toBe(expected.length);
  await page.reload();
  const drafts = page.getByRole('heading', { name: 'Nháp đang soạn', exact: true }).locator('..');
  const rows = drafts.getByRole('button', { name: 'Tiếp tục nháp', exact: true });
  const more = drafts.getByRole('button', { name: 'Tải thêm', exact: true });
  await expect(rows).toHaveCount(20);
  await expect(more).toBeVisible();
  await screen(page, 'S14d-drafts-first-page');
  let count = 20;
  while (count < expected.length) {
    await more.click();
    count = Math.min(count + 20, expected.length);
    await expect(rows).toHaveCount(count);
    const titles = await rows.evaluateAll(buttons => buttons.map(button => button.parentElement?.querySelector('span')?.textContent?.split(' · ')[0] ?? ''));
    expect(titles).toEqual(expected.slice(0, count).map(row => row.title || 'Món chưa đặt tên'));
    await screen(page, `S14d-drafts-${count}`);
  }
  await expect(more).toHaveCount(0);
  for (const name of seeded) await expect(drafts.locator('span').filter({ hasText: new RegExp(`^${name} ·`) })).toHaveCount(1);
});
