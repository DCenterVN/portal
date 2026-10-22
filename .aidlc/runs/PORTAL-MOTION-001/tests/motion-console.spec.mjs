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

const TOKENS = { '--motion-press': '80ms', '--motion-hover': '120ms', '--motion-enter': '180ms', '--motion-exit': '120ms', '--motion-sheet': '220ms' };
const EASE_ENTER = 'cubic-bezier(0.2,0.8,0.2,1)';
const account = page => page.getByRole('button', { name: /^Tài khoản của / });
const scale = async locator => locator.evaluate(el => { const m = getComputedStyle(el).transform.match(/matrix\(([^)]+)\)/); return m ? parseFloat(m[1].split(',')[0]) : 1; });

async function openTargets(browser, options) {
  const session = await openAs(browser, 'FOOD_DEV', options);
  await session.page.goto('/production/targets');
  await session.page.getByRole('heading', { name: 'Chỉ tiêu sản xuất', exact: true }).waitFor();
  await settle(session.page, 600);
  return { ...session, create: session.page.getByRole('button', { name: 'Tạo chỉ tiêu', exact: true }).first() };
}
async function openMemberships(browser, options) {
  const session = await openAs(browser, 'ADMIN', options);
  await session.page.goto('/memberships');
  await settle(session.page, 800);
  const add = session.page.getByRole('button', { name: 'Thêm nhân viên', exact: true });
  if (!(await add.count())) {
    await session.context.close();
    test.skip(true, 'vai ADMIN QA không thấy nút Thêm nhân viên ở /memberships');
  }
  return { ...session, add };
}

test('motion-console token: --motion-* có thật trên :root của console', async ({ browser }) => {
  const { context, page } = await openTargets(browser);
  const values = await page.evaluate(names => Object.fromEntries(names.map(n => [n, getComputedStyle(document.documentElement).getPropertyValue(n).trim()])), Object.keys(TOKENS));
  expect(values).toEqual(TOKENS);
  await context.close();
});

test('motion-console button: bấm scale .97 trong <100ms (80ms ease-out), nhả thì bung lại', async ({ browser }) => {
  const { context, page, create } = await openTargets(browser);
  const rules = await transitionsOf(create);
  expect(rules.find(r => r.prop === 'transform'), 'transform').toMatchObject({ duration: 80, easing: 'ease-out' });
  const box = await create.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(100);
  expect(await scale(create), 'scale khi giữ').toBeCloseTo(0.97, 2);
  await page.mouse.move(2, 2);
  await page.mouse.up();
  await page.waitForTimeout(150);
  expect(await scale(create), 'scale sau nhả').toBeCloseTo(1, 2);
  await context.close();
});

test('motion-console button: hover đổi nền 120ms ease-out, không dịch layout', async ({ browser }) => {
  const { context, page, create } = await openTargets(browser);
  const rules = await transitionsOf(create);
  expect(rules.find(r => r.prop === 'background-color'), 'background-color').toMatchObject({ duration: 120, easing: 'ease-out' });
  const before = { box: await create.boundingBox(), bg: await create.evaluate(el => getComputedStyle(el).backgroundColor) };
  await create.hover();
  await page.waitForTimeout(250);
  const after = { box: await create.boundingBox(), bg: await create.evaluate(el => getComputedStyle(el).backgroundColor) };
  expect(after.bg).not.toBe(before.bg);
  expect(after.box).toEqual(before.box);
  await context.close();
});

test('motion-console popover: vào 180ms cubic-bezier(.2,.8,.2,1) trượt 4–8px, Esc đóng ngay và trả focus', async ({ browser }) => {
  const { context, page } = await openTargets(browser);
  const recording = startRecording(page, 'button[aria-haspopup="menu"] + div', 900);
  await page.waitForTimeout(60);
  await account(page).click();
  const anims = await recording;
  expect(has(anims, 180, undefined, EASE_ENTER), `180ms ease vào, thấy ${JSON.stringify(anims)}`).toBe(true);
  const px = anims.flatMap(a => a.transforms).flatMap(t => [...t.matchAll(/(-?[\d.]+)px/g)].map(m => Math.abs(parseFloat(m[1])))).filter(v => v > 0);
  expect(px.length, 'có trượt').toBeGreaterThan(0);
  expect(Math.min(...px)).toBeGreaterThanOrEqual(4);
  expect(Math.max(...px)).toBeLessThanOrEqual(8);
  await page.waitForTimeout(100);
  const state = await page.evaluate(async () => {
    const trigger = document.querySelector('button[aria-haspopup="menu"]');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 0));
    return [trigger.getAttribute('aria-expanded'), document.querySelector('[role="menu"]') === null, document.activeElement === trigger];
  });
  expect(state, 'Esc: đóng ngay, menu unmount, focus về trigger').toEqual(['false', true, true]);
  await context.close();
});

test('motion-console popover: đóng/mở liên tiếp khi đang animate không kẹt', async ({ browser }) => {
  const { context, page } = await openTargets(browser);
  for (let i = 0; i < 4; i++) { await account(page).click(); await page.waitForTimeout(60); }
  await expect(account(page)).toHaveAttribute('aria-expanded', 'false');
  await account(page).click();
  await expect(page.getByRole('menuitem', { name: 'Tài khoản', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Escape');
  await expect(account(page)).toBeFocused();
  await context.close();
});

for (const [size, duration] of [['desktop', 220], ['mobile', 220]]) {
  test(`motion-console dialog: vào ${duration}ms cubic-bezier(.2,.8,.2,1), Tab giữ trong hộp, Esc đóng ngay và trả focus (${size})`, async ({ browser }) => {
    const { context, page, add } = await openMemberships(browser, { size });
    const recording = startRecording(page, '[role="dialog"]', 900);
    await page.waitForTimeout(60);
    await add.click();
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    const anims = await recording;
    expect(has(anims, duration, undefined, EASE_ENTER), `${duration}ms ease vào, thấy ${JSON.stringify(anims)}`).toBe(true);
    expect(anims.some(a => a.duration === 300), 'sheet 300ms cũ không được còn trong console').toBe(false);
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]')), `Tab lần ${i + 1} ra khỏi dialog`).toBe(true);
    }
    await page.keyboard.press('Escape');
    expect(await dialog.count(), 'đóng ngay').toBe(0);
    await expect(add).toBeFocused();
    await context.close();
  });
}

test('motion-console dialog: Esc giữa lúc animate đóng ngay, mở lại vẫn chạy đủ', async ({ browser }) => {
  const { context, page, add } = await openMemberships(browser);
  await add.click();
  await page.waitForTimeout(50);
  await page.keyboard.press('Escape');
  expect(await page.getByRole('dialog').count()).toBe(0);
  await expect(add).toBeFocused();
  await add.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await context.close();
});

test('motion-console scope: store/login giữ nhịp gốc, không nhận token console', async ({ browser }) => {
  const { context, page } = await openAs(browser, null, { size: 'mobile' });
  await page.goto('/login');
  const recording = startRecording(page, '[role="dialog"]', 700);
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const anims = await recording;
  expect(anims.some(a => a.duration === 220 || a.duration === 180), `login popup nhận nhịp console: ${JSON.stringify(anims)}`).toBe(false);
  const submit = dialog.getByRole('button', { name: 'Đăng nhập', exact: true });
  const rules = await transitionsOf(submit);
  expect(rules.some(r => r.duration === 80 || r.duration === 120), 'nút store không được đổi sang 80/120ms').toBe(false);
  await context.close();
});

test('motion-console reduced: không scale khi bấm, popover và dialog chỉ fade ≤120ms, luồng chính vẫn chạy', async ({ browser }) => {
  const { context, page, create } = await openTargets(browser, { reduced: true });
  const box = await create.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(150);
  expect(await scale(create), 'scale khi reduced').toBeCloseTo(1, 2);
  await page.mouse.move(2, 2);
  await page.mouse.up();
  const recording = startRecording(page, 'button[aria-haspopup="menu"] + div', 800);
  await page.waitForTimeout(60);
  await account(page).click();
  await expect(page.getByRole('menuitem', { name: 'Tài khoản', exact: true })).toBeVisible();
  const anims = await recording;
  expect(moves(anims), 'còn trượt/scale').toEqual([]);
  expect(anims.filter(a => a.duration > 120), 'dài hơn 120ms').toEqual([]);
  await page.keyboard.press('Escape');
  await expect(account(page)).toBeFocused();
  await context.close();
});

test('motion-console CLS ≤ 0.01 khi bấm nút, mở popover và hover', async ({ browser }) => {
  const { context, page, create } = await openTargets(browser);
  await create.hover();
  await account(page).click();
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  expect(await readCls(page), 'LayoutShift gồm cả hadRecentInput').toBeLessThanOrEqual(0.01);
  await context.close();
});
