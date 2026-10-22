import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { test, expect } from '@playwright/test';

const BASE = process.env.PORTAL_E2E_BASE ?? 'http://localhost:3000';
const SIZES = { desktop: { width: 1440, height: 900 }, mobile: { width: 375, height: 844 } };
const norm = value => String(value).replace(/\s+/g, '');
const SPRING = 'cubic-bezier(0.34,1.45,0.64,1)';

function qaAccounts() {
  const file = (process.env.QA_ROLE_ENV ?? `${homedir()}/.local/state/dcentervn/qa/role-accounts.env`).replace(/^~\//, `${homedir()}/`);
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { throw new Error('Không đọc được QA_ROLE_ENV.'); }
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Z_]+)=(.*)$/);
    if (match) values[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return values;
}

const themeInit = theme => {
  localStorage.setItem('dcenter_theme', theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
};
const clsInit = () => {
  window.__cls = 0;
  try { new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true }); } catch { /* không hỗ trợ */ }
};

async function newContext(browser, { size = 'desktop', theme = 'light', reduced = false, js = true } = {}) {
  const context = await browser.newContext({
    baseURL: BASE, viewport: SIZES[size], colorScheme: theme, locale: 'vi-VN', deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: js,
  });
  context.setDefaultTimeout(20000);
  await context.addInitScript(themeInit, theme);
  await context.addInitScript(clsInit);
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'vi', url: BASE }]);
  return context;
}

const sessions = new Map();
async function signIn(context, kind) {
  if (sessions.has(kind)) return context.addCookies(sessions.get(kind));
  const accounts = qaAccounts();
  const customer = kind === 'CUSTOMER';
  for (const key of [`ROLE_${kind}_EMAIL`, `ROLE_${kind}_PASSWORD`]) if (!accounts[key]) throw new Error(`QA_ROLE_ENV thiếu tài khoản ${kind}.`);
  const page = await context.newPage();
  await page.goto(customer ? '/login' : '/staff/login');
  const form = customer ? page.getByRole('dialog') : page;
  await form.getByLabel(customer ? 'Email hoặc số điện thoại' : 'Email hoặc số điện thoại nhân viên', { exact: true }).fill(accounts[`ROLE_${kind}_EMAIL`]);
  await form.getByLabel('Mật khẩu', { exact: true }).fill(accounts[`ROLE_${kind}_PASSWORD`]);
  const response = page.waitForResponse(r => new URL(r.url()).pathname === (customer ? '/api/auth/login' : '/api/auth/staff/login') && r.request().method() === 'POST');
  await form.getByRole('button', { name: customer ? 'Đăng nhập' : 'Đăng nhập nhân viên', exact: true }).click();
  expect((await response).status(), `Đăng nhập ${kind}`).toBe(200);
  await page.waitForURL(customer ? /\/$/ : /\/(console|platform(?:\/role-matrix)?)$/);
  sessions.set(kind, await context.cookies());
  await page.close();
}
async function openAs(browser, kind, options) {
  const context = await newContext(browser, options);
  if (kind) await signIn(context, kind);
  return { context, page: await context.newPage() };
}

const settle = async (page, ms = 400) => { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(ms); };
const readCls = page => page.evaluate(() => window.__cls ?? 0);

function startRecording(page, selector, ms = 1500) {
  return page.evaluate(({ selector, ms }) => new Promise(resolve => {
    const seen = new Map();
    const t0 = performance.now();
    const tick = () => {
      for (const root of document.querySelectorAll(selector)) for (const a of root.getAnimations({ subtree: true })) {
        const timing = a.effect.getTiming();
        const frames = a.effect.getKeyframes();
        const name = a.transitionProperty ?? a.animationName ?? '';
        const key = [name, timing.duration, timing.delay].join('|') + frames.map(f => f.easing).join(',');
        if (!seen.has(key)) seen.set(key, {
          name, duration: Number(timing.duration), delay: Number(timing.delay),
          easings: [timing.easing, ...frames.map(f => f.easing)].map(e => String(e).replace(/\s+/g, '')),
          transforms: frames.map(f => f.transform).filter(Boolean), opacities: frames.map(f => f.opacity).filter(v => v !== undefined),
        });
      }
      performance.now() - t0 < ms ? requestAnimationFrame(tick) : resolve([...seen.values()]);
    };
    tick();
  }), { selector, ms });
}
const has = (list, duration, delay, easing) => list.some(a => a.duration === duration && (delay === undefined || a.delay === delay) && (!easing || a.easings.includes(easing)));
const moves = list => list.filter(a => a.transforms.some(t => t && t !== 'none' && !/^translate\(0(px)?,? ?0(px)?\)$/.test(t) && !/^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t)));

const transitionsOf = locator => locator.evaluate(el => {
  const s = getComputedStyle(el);
  const list = value => value.split(/,(?![^(]*\))/).map(x => x.trim());
  const props = list(s.transitionProperty), durations = list(s.transitionDuration), easings = list(s.transitionTimingFunction);
  return props.map((prop, i) => ({ prop, duration: parseFloat(durations[i % durations.length]) * (durations[i % durations.length].endsWith('ms') ? 1 : 1000), easing: easings[i % easings.length].replace(/\s+/g, '') }));
});

const FILTERS = [/^Tất cả \(/, /^Đang mở bán \(/, /^Bản nháp \(/];

async function openCatalog(browser, options) {
  const session = await openAs(browser, 'SALES', options);
  const search = session.page.getByPlaceholder('Tìm theo tên sản phẩm...');
  await session.page.goto('/sales/products');
  for (let attempt = 0; attempt < 3; attempt++) {
    if (await search.waitFor({ timeout: 8000 }).then(() => true, () => false)) break;
    await session.page.reload();
  }
  await search.waitFor();
  await settle(session.page);
  return session;
}
const buttons = page => FILTERS.map(name => page.getByRole('button', { name }));
const pressedCount = page => page.locator('button[aria-pressed="true"]').filter({ hasText: /^(Tất cả|Đang mở bán|Bản nháp) \(/ }).count();

test('motion-store filter: nút lọc chuyển nền 350ms và màu 300ms ease, không animate padding/width', async ({ browser }) => {
  const { context, page } = await openCatalog(browser);
  for (const button of buttons(page)) {
    const rules = await transitionsOf(button);
    const get = prop => rules.find(r => r.prop === prop);
    expect(get('background-color')?.duration, 'background-color').toBe(350);
    expect(get('color')?.duration, 'color').toBe(300);
    expect(get('background-color').easing).toBe('ease');
    expect(rules.map(r => r.prop).filter(p => ['all', 'padding', 'width', 'padding-left', 'padding-right'].includes(p)), 'thuộc tính cấm').toEqual([]);
  }
  await context.close();
});

test('motion-store filter: dấu Check vào với opacity 250ms ease và transform 450ms spring', async ({ browser }) => {
  const { context, page } = await openCatalog(browser);
  const recording = startRecording(page, 'button[aria-pressed="true"]', 900);
  await page.waitForTimeout(60);
  await buttons(page)[1].click();
  const anims = await recording;
  expect(has(anims, 250, undefined, 'ease'), `opacity 250ms ease, thấy ${JSON.stringify(anims)}`).toBe(true);
  expect(has(anims, 450, undefined, SPRING), `transform 450ms spring, thấy ${JSON.stringify(anims)}`).toBe(true);
  await context.close();
});

test('motion-store filter: aria-pressed đổi ngay khi bấm, vẫn chọn đơn ALL/ACTIVE/DRAFT', async ({ browser }) => {
  const { context, page } = await openCatalog(browser);
  for (const index of [1, 2, 0, 2, 1]) {
    await buttons(page)[index].click();
    await expect(buttons(page)[index], `nút ${index} sau click`).toHaveAttribute('aria-pressed', 'true');
    expect(await pressedCount(page), 'chỉ một nút được chọn').toBe(1);
  }
  await context.close();
});

test('motion-store filter: bấm nhanh liên tiếp lấy lần bấm cuối, không mất thao tác', async ({ browser }) => {
  const { context, page } = await openCatalog(browser);
  const order = [0, 1, 2, 1, 0, 2, 0, 1, 2, 1];
  await page.evaluate(sequence => {
    const labels = [/^Tất cả \(/, /^Đang mở bán \(/, /^Bản nháp \(/];
    const all = [...document.querySelectorAll('button')];
    for (const i of sequence) all.find(b => labels[i].test(b.textContent.trim()))?.click();
  }, order);
  await page.waitForTimeout(600);
  const last = order.at(-1);
  await expect(buttons(page)[last]).toHaveAttribute('aria-pressed', 'true');
  expect(await pressedCount(page)).toBe(1);
  await context.close();
});

test('motion-store filter: CLS ≤ 0.01, hàng nút không đổi vị trí dọc và chiều cao khi chọn', async ({ browser }) => {
  const { context, page } = await openCatalog(browser);
  const before = await Promise.all(buttons(page).map(b => b.boundingBox()));
  for (const index of [1, 2, 0]) {
    await buttons(page)[index].click();
    await page.waitForTimeout(500);
    const after = await Promise.all(buttons(page).map(b => b.boundingBox()));
    after.forEach((box, i) => {
      expect(Math.abs(box.y - before[i].y), `nút ${i} y`).toBeLessThanOrEqual(1);
      expect(Math.abs(box.height - before[i].height), `nút ${i} cao`).toBeLessThanOrEqual(1);
    });
  }
  expect(await readCls(page), 'LayoutShift gồm cả hadRecentInput').toBeLessThanOrEqual(0.01);
  await context.close();
});

test('motion-store filter: reduced-motion bỏ trượt/scale, chỉ fade ≤120ms, trạng thái cuối ngay', async ({ browser }) => {
  const { context, page } = await openCatalog(browser, { reduced: true });
  for (const button of buttons(page)) for (const rule of await transitionsOf(button)) {
    expect(rule.duration, `${rule.prop} reduced`).toBeLessThanOrEqual(120);
  }
  const recording = startRecording(page, 'button[aria-pressed="true"]', 700);
  await page.waitForTimeout(60);
  await buttons(page)[2].click();
  await expect(buttons(page)[2]).toHaveAttribute('aria-pressed', 'true');
  const anims = await recording;
  expect(anims.filter(a => a.duration > 120), 'animation dài hơn 120ms').toEqual([]);
  expect(moves(anims), 'còn trượt/scale').toEqual([]);
  await context.close();
});
