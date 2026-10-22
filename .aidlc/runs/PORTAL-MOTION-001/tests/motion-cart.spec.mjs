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

const PANEL = 'button[aria-label^="Giỏ hàng"] + div';
const trigger = page => page.getByRole('button', { name: /^Giỏ hàng, \d+ món$/ });

async function openHome(browser, options) {
  const session = await openAs(browser, 'CUSTOMER', options);
  await session.page.goto('/');
  await session.page.getByRole('heading', { level: 1 }).waitFor();
  await settle(session.page, 800);
  return session;
}
const panelOf = async page => {
  const id = await trigger(page).getAttribute('aria-controls');
  return id ? page.locator(`[id="${id}"]`) : page.locator('[data-nonexistent-panel]');
};

test('motion-store cart: panel vào 450ms cubic-bezier(.3,1,.3,1), dịch ngắn và fade', async ({ browser }) => {
  const { context, page } = await openHome(browser);
  const recording = startRecording(page, PANEL, 1000);
  await page.waitForTimeout(60);
  await trigger(page).click();
  const anims = await recording;
  expect(has(anims, 450, undefined, 'cubic-bezier(0.3,1,0.3,1)'), `cần 450ms cubic-bezier(.3,1,.3,1), thấy ${JSON.stringify(anims)}`).toBe(true);
  const slide = anims.flatMap(a => a.transforms).flatMap(t => [...t.matchAll(/(-?[\d.]+)px/g)].map(m => Math.abs(parseFloat(m[1]))));
  expect(Math.max(0, ...slide), 'dịch ngắn hợp panel').toBeGreaterThan(0);
  expect(Math.max(0, ...slide)).toBeLessThanOrEqual(24);
  await context.close();
});

test('motion-store cart: aria-expanded đổi ngay, đóng/unmount ngay kể cả giữa lúc animate', async ({ browser }) => {
  const { context, page } = await openHome(browser);
  const opened = await trigger(page).evaluate(el => { el.click(); return el.getAttribute('aria-expanded'); });
  expect(opened).toBe('true');
  await page.waitForTimeout(100);
  const closed = await trigger(page).evaluate(el => { el.click(); return [el.getAttribute('aria-expanded'), el.getAttribute('aria-controls')]; });
  expect(closed, 'đóng khi animation còn chạy: aria-expanded=false, panel đã unmount').toEqual(['false', null]);
  await context.close();
});

test('motion-store cart: bấm nhanh liên tiếp không kẹt, panel chỉ có một bản', async ({ browser }) => {
  const { context, page } = await openHome(browser);
  await trigger(page).evaluate(el => { for (let i = 0; i < 5; i++) el.click(); });
  await page.waitForTimeout(700);
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'true');
  const id = await trigger(page).getAttribute('aria-controls');
  expect(await page.locator(`[id="${id}"]`).count()).toBe(1);
  await page.keyboard.press('Escape');
  await expect(trigger(page)).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger(page)).toBeFocused();
  await context.close();
});

test('motion-store cart: giữ Popover hiện có, không thêm scrim, thanh tiến độ hay nút xoá; rộng 320px trên desktop', async ({ browser }) => {
  const { context, page } = await openHome(browser);
  await trigger(page).click();
  const box = await (await panelOf(page)).boundingBox();
  expect(Math.round(box.width)).toBe(320);
  await settle(page, 700);
  expect(await page.locator('[role="progressbar"]').count(), 'thanh miễn phí vận chuyển').toBe(0);
  expect(await (await panelOf(page)).getByRole('button', { name: /xóa|xoá/i }).count(), 'nút xoá dòng').toBe(0);
  expect(await page.locator('div.fixed.inset-0').count(), 'scrim').toBe(0);
  await context.close();
});

test('motion-store cart: CLS ≤ 0.01 và hộp nút giỏ không dịch khi mở/đóng', async ({ browser }) => {
  const { context, page } = await openHome(browser);
  const before = await trigger(page).boundingBox();
  for (let i = 0; i < 3; i++) {
    await trigger(page).click();
    await page.waitForTimeout(600);
    await trigger(page).click();
    await page.waitForTimeout(200);
  }
  const after = await trigger(page).boundingBox();
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeLessThanOrEqual(1);
  expect(await readCls(page), 'LayoutShift gồm cả hadRecentInput').toBeLessThanOrEqual(0.01);
  await context.close();
});

test('motion-store cart: reduced-motion bỏ trượt, chỉ fade ≤120ms, panel hiện ngay', async ({ browser }) => {
  const { context, page } = await openHome(browser, { reduced: true });
  const recording = startRecording(page, PANEL, 900);
  await page.waitForTimeout(60);
  const opened = await trigger(page).evaluate(el => { el.click(); return el.getAttribute('aria-expanded'); });
  expect(opened).toBe('true');
  const anims = await recording;
  expect(anims.filter(a => a.duration > 120), 'animation dài hơn 120ms').toEqual([]);
  expect(moves(anims), 'còn trượt').toEqual([]);
  await expect(await panelOf(page)).toBeVisible();
  await context.close();
});
