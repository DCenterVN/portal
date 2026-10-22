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

const kitInit = () => {
  let g;
  const rgba = color => {
    g ??= Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true });
    g.clearRect(0, 0, 1, 1); g.fillStyle = color; g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (top, under) => [0, 1, 2].map(i => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
  const bg = el => {
    const layers = [];
    for (let n = el; n; n = n.parentElement) {
      const c = rgba(getComputedStyle(n).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] >= 1) break;
    }
    return layers.reduceRight((under, top) => over(top, under), [255, 255, 255, 1]);
  };
  const lum = c => { const [r, g2, b] = c.slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g2 + 0.0722 * b; };
  const contrastOf = el => {
    const under = bg(el);
    const fg = over(rgba(getComputedStyle(el).color), under);
    const [hi, lo] = [lum(fg), lum(under)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  };
  window.__kit = { rgba, bg, contrastOf, alpha: el => rgba(getComputedStyle(el).backgroundColor)[3] };
};

const EYE = /^(Hiện|Ẩn) mật khẩu$/;
const PAGES = [
  ['login popup', '/login', page => page.getByRole('dialog').waitFor()],
  ['staff login', '/staff/login', page => page.getByLabel('Email hoặc số điện thoại nhân viên', { exact: true }).waitFor()],
  ['reset password', '/reset-password?token=motion-test', page => page.locator('input[type="password"]').first().waitFor()],
];

const alpha = locator => locator.evaluate(el => ({ bg: window.__kit.alpha(el), image: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }));
const iconContrast = locator => locator.evaluate(el => window.__kit.contrastOf(el.querySelector('svg')));
const expectFlat = (state, label) => {
  expect(state.bg, `${label}: nền phải trong suốt`).toBe(0);
  expect(state.image, `${label}: không gradient`).toBe('none');
  expect(state.shadow, `${label}: không bóng`).toBe('none');
};

async function openPage(browser, [, path, ready], options) {
  const { context, page } = await openAs(browser, null, options);
  await context.addInitScript(kitInit);
  await page.goto(path);
  await ready(page);
  await settle(page, 600);
  return { context, page, eye: page.getByRole('button', { name: EYE }).first() };
}

for (const entry of PAGES) for (const size of ['desktop', 'mobile']) for (const theme of ['light', 'dark']) {
  test(`visual controls V-01 ${entry[0]} ${size} ${theme}: toggle mật khẩu trong suốt mọi trạng thái, icon đậm khi hover, vòng focus quanh icon`, async ({ browser }) => {
    const { context, page, eye } = await openPage(browser, entry, { size, theme });
    const box = await eye.boundingBox();
    expect(box.width, 'vùng bấm rộng').toBeGreaterThanOrEqual(40);
    expect(box.height, 'vùng bấm cao').toBeGreaterThanOrEqual(40);

    expectFlat(await alpha(eye), 'thường');
    const resting = await iconContrast(eye);

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    expectFlat(await alpha(eye), 'hover');
    expect(await iconContrast(eye), 'icon đậm hơn khi hover').toBeGreaterThan(resting);

    await page.mouse.down();
    await page.waitForTimeout(250);
    expectFlat(await alpha(eye), 'active');
    await page.mouse.move(2, 2);
    await page.mouse.up();

    await page.locator('input[type="password"]').first().focus();
    await page.keyboard.press('Tab');
    await expect(eye).toBeFocused();
    await page.waitForTimeout(250);
    expectFlat(await alpha(eye), 'focus');
    const ring = await eye.evaluate(el => {
      const own = getComputedStyle(el);
      const pseudo = ['::before', '::after'].map(p => ({ s: getComputedStyle(el, p), p })).find(({ s }) => s.content !== 'none' && (s.boxShadow !== 'none' || parseFloat(s.borderTopWidth) > 0 || s.outlineStyle !== 'none'));
      return { ownOutline: own.outlineStyle === 'none' || parseFloat(own.outlineWidth) === 0, pseudoWidth: pseudo ? parseFloat(pseudo.s.width) : null };
    });
    expect(ring.ownOutline, 'hộp nút không có outline').toBe(true);
    expect(ring.pseudoWidth, 'phải có vòng mảnh bằng pseudo-element').not.toBeNull();
    expect(ring.pseudoWidth).toBeGreaterThanOrEqual(16);
    expect(ring.pseudoWidth).toBeLessThanOrEqual(28);

    await eye.evaluate(el => { el.disabled = true; });
    await page.waitForTimeout(250);
    expectFlat(await alpha(eye), 'disabled');
    await context.close();
  });
}

test('visual controls V-01 giữ hành vi: bấm đổi loại ô, aria-pressed và nhãn, bàn phím Space/Enter vẫn bật tắt', async ({ browser }) => {
  const { context, page } = await openPage(browser, PAGES[0], {});
  const dialog = page.getByRole('dialog');
  const field = dialog.locator('input[name="password"]');
  const eye = dialog.getByRole('button', { name: 'Hiện mật khẩu', exact: true });
  await expect(field).toHaveAttribute('type', 'password');
  await eye.click();
  await expect(field).toHaveAttribute('type', 'text');
  const hide = dialog.getByRole('button', { name: 'Ẩn mật khẩu', exact: true });
  await expect(hide).toHaveAttribute('aria-pressed', 'true');
  await hide.focus();
  await page.keyboard.press('Enter');
  await expect(field).toHaveAttribute('type', 'password');
  await expect(dialog.getByRole('button', { name: 'Hiện mật khẩu', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await context.close();
});
