import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { test, expect } from '@playwright/test';
import messages from '../../../../messages/vi.json' with { type: 'json' };

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

const BUSY = messages.customerAuth.loginPending;
const WRONG = { identifier: 'motion.khong.ton.tai@example.com', password: 'Sai-mat-khau-12345' };
const SHAKE_EASING = 'cubic-bezier(0.36,0.07,0.19,0.97)';

async function openLogin(browser, options) {
  const session = await openAs(browser, null, options);
  await session.page.goto('/login');
  const dialog = session.page.getByRole('dialog');
  await dialog.waitFor();
  await settle(session.page, 600);
  await dialog.getByLabel('Email hoặc số điện thoại', { exact: true }).fill(WRONG.identifier);
  await dialog.getByLabel('Mật khẩu', { exact: true }).fill(WRONG.password);
  return { ...session, dialog, submit: dialog.getByRole('button', { name: messages.customerAuth.login, exact: true }) };
}
const loginRequests = page => {
  const seen = [];
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/auth/login' && request.method() === 'POST') seen.push(Date.now()); });
  return seen;
};

test('motion-store login: alert lỗi rung 500ms cubic-bezier(.36,.07,.19,.97), hiện ngay và request đi ngay', async ({ browser }) => {
  const { context, page, dialog, submit } = await openLogin(browser);
  const requests = loginRequests(page);
  const recording = startRecording(page, '[role="alert"]', 1500);
  await page.waitForTimeout(60);
  const clickedAt = Date.now();
  await submit.click();
  const alert = dialog.getByRole('alert');
  await alert.waitFor();
  const anims = await recording;
  expect(requests, 'đúng một POST login').toHaveLength(1);
  expect(requests[0] - clickedAt, 'request không bị animation làm trễ').toBeLessThanOrEqual(150);
  expect(has(anims, 500, undefined, SHAKE_EASING), `rung 500ms, thấy ${JSON.stringify(anims)}`).toBe(true);
  expect(moves(anims).length, 'rung bằng transform').toBeGreaterThan(0);
  await expect(dialog.getByLabel('Email hoặc số điện thoại', { exact: true })).toBeFocused();
  await context.close();
});

test('motion-store login: alert rung không đổi hộp bố cục, không morph width/radius của thẻ', async ({ browser }) => {
  const { context, page, dialog, submit } = await openLogin(browser);
  await submit.click();
  const alert = dialog.getByRole('alert');
  await alert.waitFor();
  const probe = () => alert.evaluate(el => ({ left: el.offsetLeft, top: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, radius: getComputedStyle(el).borderTopLeftRadius }));
  const first = await probe();
  for (let i = 0; i < 6; i++) {
    await page.waitForTimeout(90);
    expect(await probe(), `mẫu ${i}`).toEqual(first);
  }
  await context.close();
});

test('motion-store login: nhãn busy fade 200ms, nút khoá, bấm đúp chỉ gửi một request', async ({ browser }) => {
  const { context, page, dialog, submit } = await openLogin(browser);
  const requests = loginRequests(page);
  await page.route('**/api/auth/login', async route => { await new Promise(r => setTimeout(r, 900)); await route.continue(); });
  const recording = startRecording(page, '[role="dialog"] form button[type="submit"]', 1100);
  await page.waitForTimeout(60);
  await submit.dblclick();
  const busy = dialog.getByRole('button', { name: BUSY, exact: true });
  await expect(busy).toBeVisible();
  await expect(busy).toBeDisabled();
  const anims = await recording;
  expect(has(anims, 200), `fade busy 200ms, thấy ${JSON.stringify(anims)}`).toBe(true);
  await dialog.getByRole('alert').waitFor();
  expect(requests, 'một POST dù bấm đúp').toHaveLength(1);
  await context.close();
});

test('motion-store login: reduced-motion bỏ rung, alert hiện ngay, busy chỉ fade ≤120ms', async ({ browser }) => {
  const { context, page, dialog, submit } = await openLogin(browser, { reduced: true });
  const recording = startRecording(page, '[role="dialog"] [role="alert"], [role="dialog"] form button[type="submit"]', 1500);
  await page.waitForTimeout(60);
  await submit.click();
  await dialog.getByRole('alert').waitFor();
  const anims = await recording;
  expect(moves(anims), 'còn rung/trượt').toEqual([]);
  expect(anims.filter(a => a.duration > 120), 'animation dài hơn 120ms').toEqual([]);
  await expect(dialog.getByRole('alert')).toBeVisible();
  await context.close();
});
