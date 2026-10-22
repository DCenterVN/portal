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

const STEPPER = 'div:has(> button[aria-label="Tăng số lượng"])';

async function activeProductName(page) {
  await page.goto('/products');
  await page.getByPlaceholder('Tìm theo tên SKU, mã vạch...').waitFor();
  await page.getByRole('button', { name: /^Đang mở bán \(/ }).click();
  await settle(page, 800);
  const links = page.locator('tbody tr').filter({ hasText: 'ACTIVE' }).getByRole('link');
  return (await links.count()) ? (await links.first().innerText()).trim() : '';
}
async function openDetail(browser, options) {
  const session = await openAs(browser, 'CUSTOMER', options);
  const name = await activeProductName(session.page);
  if (!name) {
    await session.context.close();
    test.skip(true, 'chưa có món ACTIVE');
  }
  await session.page.getByRole('link', { name, exact: true }).click();
  await session.page.getByRole('heading', { name, exact: true }).waitFor();
  const down = session.page.getByRole('button', { name: 'Giảm số lượng', exact: true });
  const up = session.page.getByRole('button', { name: 'Tăng số lượng', exact: true });
  const value = down.locator('xpath=../span');
  await settle(session.page);
  return { ...session, down, up, value };
}

test('motion-store quantity: số trên span đổi ngay, bấm nhanh không mất lần bấm nào', async ({ browser }) => {
  const { context, page, down, up, value } = await openDetail(browser);
  const now = await up.evaluate(el => { el.click(); return el.parentElement.querySelector('span').textContent; });
  expect(now, 'ngay sau click').toBe('2');
  await page.evaluate(() => { const b = [...document.querySelectorAll('button[aria-label="Tăng số lượng"]')][0]; for (let i = 0; i < 6; i++) b.click(); });
  await expect(value).toHaveText('8');
  await page.evaluate(() => { const b = document.querySelector('button[aria-label="Giảm số lượng"]'); for (let i = 0; i < 12; i++) b.click(); });
  await expect(value).toHaveText('1');
  await context.close();
});

test('motion-store quantity: không đếm trung gian, chỉ một lần thay nội dung và không gọi API', async ({ browser }) => {
  const { context, page, up, value } = await openDetail(browser);
  const calls = [];
  page.on('request', request => { if (new URL(request.url()).pathname.startsWith('/api/')) calls.push(request.method()); });
  await value.evaluate(el => {
    window.__texts = [];
    new MutationObserver(() => window.__texts.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
  });
  await up.click();
  await page.waitForTimeout(900);
  expect(await page.evaluate(() => window.__texts.filter((t, i, all) => t !== all[i - 1])), 'chuỗi giá trị hiện ra').toEqual(['2']);
  expect(calls, 'bấm số lượng không được gửi request').toEqual([]);
  await context.close();
});

test('motion-store quantity: span số phản hồi 550ms spring, nút transform 400ms spring và nền 250ms ease', async ({ browser }) => {
  const { context, page, up, value } = await openDetail(browser);
  const recording = startRecording(page, STEPPER, 1200);
  await page.waitForTimeout(60);
  await up.click();
  const anims = await recording;
  expect(has(anims, 550, undefined, SPRING), `span 550ms spring, thấy ${JSON.stringify(anims)}`).toBe(true);
  for (const button of [up, page.getByRole('button', { name: 'Giảm số lượng', exact: true })]) {
    const rules = await transitionsOf(button);
    expect(rules.find(r => r.prop === 'transform'), 'transform').toMatchObject({ duration: 400, easing: SPRING });
    expect(rules.find(r => r.prop === 'background-color'), 'background-color').toMatchObject({ duration: 250, easing: 'ease' });
  }
  await expect(value).toHaveText('2');
  await context.close();
});

test('motion-store quantity: CLS ≤ 0.01, hộp stepper không đổi cao hoặc vị trí khi 1→2', async ({ browser }) => {
  const { context, page, down, up } = await openDetail(browser);
  const box = async () => ({ down: await down.boundingBox(), up: await up.boundingBox() });
  const before = await box();
  await up.click();
  await page.waitForTimeout(800);
  const after = await box();
  expect(Math.abs(after.down.y - before.down.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.down.height - before.down.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(after.down.x - before.down.x), 'nút giảm không trôi ngang').toBeLessThanOrEqual(1);
  expect(Math.abs(after.up.x - before.up.x), 'nút tăng không trôi ngang').toBeLessThanOrEqual(2);
  expect(await readCls(page), 'LayoutShift gồm cả hadRecentInput').toBeLessThanOrEqual(0.01);
  await context.close();
});

test('motion-store quantity: reduced-motion không trượt/scale số, chỉ fade ≤120ms, số cuối ngay', async ({ browser }) => {
  const { context, page, up, value } = await openDetail(browser, { reduced: true });
  const recording = startRecording(page, STEPPER, 900);
  await page.waitForTimeout(60);
  const now = await up.evaluate(el => { el.click(); return el.parentElement.querySelector('span').textContent; });
  expect(now).toBe('2');
  const anims = await recording;
  expect(anims.filter(a => a.duration > 120), 'animation dài hơn 120ms').toEqual([]);
  expect(moves(anims), 'còn trượt/scale').toEqual([]);
  await expect(value).toHaveText('2');
  await context.close();
});
