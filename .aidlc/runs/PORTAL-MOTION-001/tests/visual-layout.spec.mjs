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

const COMBOS = [['desktop', 'light'], ['desktop', 'dark'], ['mobile', 'light'], ['mobile', 'dark']];
const SEARCH = 'Tìm theo tên sản phẩm...';
const FILTERS = [/^Tất cả \(/, /^Đang mở bán \(/, /^Bản nháp \(/];

async function seeAs(browser, kind, options) {
  const session = await openAs(browser, kind, options);
  await session.context.addInitScript(kitInit);
  return session;
}
async function catalog(browser, options) {
  const session = await seeAs(browser, 'SALES', options);
  await session.page.goto('/sales/products');
  await session.page.getByPlaceholder(SEARCH).waitFor();
  await settle(session.page, 700);
  return session;
}

for (const [size, theme] of COMBOS) {
  test(`visual store V-02+V-10 catalog ${size} ${theme}: cụm lọc và nút tạo nằm trong khung, trang không tràn ngang`, async ({ browser }) => {
    const { context, page } = await catalog(browser, { size, theme });
    const view = SIZES[size].width;
    const overflow = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    expect(overflow.scroll, 'scrollWidth').toBeLessThanOrEqual(overflow.client);
    const filters = await Promise.all(FILTERS.map(name => page.getByRole('button', { name }).boundingBox()));
    const bar = await page.getByRole('button', { name: FILTERS[0] }).locator('xpath=../..').boundingBox();
    filters.forEach((box, i) => {
      expect(box.x, `lọc ${i} trái`).toBeGreaterThanOrEqual(bar.x - 0.5);
      expect(box.x + box.width, `lọc ${i} phải`).toBeLessThanOrEqual(bar.x + bar.width + 0.5);
    });
    expect([...filters].sort((p, q) => p.y - q.y || p.x - q.x), 'thứ tự giữ nguyên').toEqual(filters);
    const createButton = page.getByRole('button', { name: 'Tạo sản phẩm mới', exact: true });
    if (await createButton.count()) {
      const create = await createButton.boundingBox();
      expect(create.x + create.width, 'nút Tạo sản phẩm mới trong viewport').toBeLessThanOrEqual(view);
      expect(create.x).toBeGreaterThanOrEqual(0);
      expect(create.height, 'cỡ nút giữ nguyên').toBeGreaterThanOrEqual(40);
    }
    await context.close();
  });

  test(`visual store V-04 ô tìm ${size} ${theme}: tâm kính lúp trùng tâm input`, async ({ browser }) => {
    const { context, page } = await catalog(browser, { size, theme });
    const input = page.getByPlaceholder(SEARCH);
    const icon = input.locator('xpath=..').locator('svg').first();
    const [i, s] = await Promise.all([input.boundingBox(), icon.boundingBox()]);
    expect(Math.abs((s.y + s.height / 2) - (i.y + i.height / 2)), 'lệch tâm dọc (px)').toBeLessThanOrEqual(1);
    expect(s.width, 'cỡ icon giữ nguyên').toBeCloseTo(16, 0);
    expect(s.x - i.x, 'icon vẫn cách mép trái 12px').toBeCloseTo(12, 0);
    await context.close();
  });

  test(`visual dialog V-06 nút đóng popup ${size} ${theme}: hover không đổ khối nền, vùng bấm và vị trí giữ nguyên`, async ({ browser }) => {
    const { context, page } = await seeAs(browser, null, { size, theme });
    await page.goto('/login');
    const dialog = page.getByRole('dialog');
    await dialog.waitFor();
    await settle(page, 700);
    const close = dialog.getByRole('button', { name: 'Đóng hộp thoại', exact: true });
    const state = () => close.evaluate(el => ({ bg: window.__kit.alpha(el), image: getComputedStyle(el).backgroundImage, contrast: window.__kit.contrastOf(el.querySelector('svg')) }));
    const before = { box: await close.boundingBox(), ...(await state()) };
    expect(before.box.width).toBeGreaterThanOrEqual(44);
    expect(before.box.height).toBeGreaterThanOrEqual(44);
    expect(before.bg, 'nền thường').toBe(0);
    await close.hover();
    await page.waitForTimeout(300);
    const after = { box: await close.boundingBox(), ...(await state()) };
    expect(after.bg, 'nền hover trong suốt').toBe(0);
    expect(after.image).toBe('none');
    expect(after.contrast, 'icon đậm hơn khi hover').toBeGreaterThan(before.contrast);
    expect(after.box).toEqual(before.box);
    await context.close();
  });
}

const headerIcon = locator => locator.evaluate(h1 => {
  const box = h1.parentElement?.parentElement?.previousElementSibling;
  if (!box || !box.querySelector('svg')) return null;
  const rect = box.getBoundingClientRect();
  return { bg: window.__kit.alpha(box), image: getComputedStyle(box).backgroundImage, width: rect.width, height: rect.height };
});

for (const [size, theme] of COMBOS) {
  for (const [label, kind, path, heading] of [['catalog', 'SALES', '/sales/products', null], ['page header', 'FOOD_DEV', '/console', 'Console vận hành']]) {
    test(`visual console V-07 ${label} ${size} ${theme}: ô icon tiêu đề không còn nền xanh, cỡ 36px giữ nguyên`, async ({ browser }) => {
      const { context, page } = await seeAs(browser, kind, { size, theme });
      await page.goto(path);
      if (heading) await page.getByRole('heading', { name: heading, exact: true }).waitFor();
      else await page.getByPlaceholder(SEARCH).waitFor();
      await settle(page, 700);
      const icon = await headerIcon(page.getByRole('heading', { level: 1 }).first());
      expect(icon, 'màn phải có ô icon trong PageHeader').not.toBeNull();
      expect(icon.bg, 'nền ô icon').toBe(0);
      expect(icon.image).toBe('none');
      expect(icon.width).toBeCloseTo(36, 0);
      expect(icon.height).toBeCloseTo(36, 0);
      await context.close();
    });
  }
}

const FOOTER_ROUTES = [[null, '/'], ['CUSTOMER', '/products'], ['CUSTOMER', '/cart']];
for (const [size, theme] of COMBOS) {
  test(`visual footer V-11 ${size} ${theme}: tên liên kết, hover và dòng pháp lý đọc rõ (tương phản ≥ 4.5) trên mọi route`, async ({ browser }) => {
    for (const [kind, path] of FOOTER_ROUTES) {
      const { context, page } = await seeAs(browser, kind, { size, theme });
      await page.goto(path);
      const footer = page.locator('footer').last();
      await footer.waitFor();
      await settle(page, 600);
      const links = footer.getByRole('link');
      expect(await links.count(), `${path}: footer có liên kết`).toBeGreaterThan(0);
      const read = el => el.evaluate(node => window.__kit.contrastOf(node));
      expect(await read(links.first()), `${path}: tên liên kết`).toBeGreaterThanOrEqual(4.5);
      const legal = footer.locator('div > span').last();
      expect(await read(legal), `${path}: dòng pháp lý`).toBeGreaterThanOrEqual(4.5);
      const resting = await read(links.first());
      await links.first().hover();
      await page.waitForTimeout(300);
      expect(await read(links.first()), `${path}: hover`).toBeGreaterThanOrEqual(Math.max(4.5, resting));
      await context.close();
    }
  });
}
