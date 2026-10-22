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

const HERO = [
  ['eyebrow', [[550, 180], [700, 180]]],
  ['h1', [[750, 300]]],
  ['mô tả', [[550, 620], [700, 620]]],
  ['CTA', [[550, 760], [700, 760]]],
  ['visual', [[600, 900], [900, 900], [1100, 900]]],
];

const heroProbe = () => {
  window.__hero = { anims: {}, samples: [] };
  const findHero = () => {
    const section = document.querySelector('section[aria-labelledby="hero-title"]');
    if (!section) return {};
    const byText = (tag, text) => [...section.querySelectorAll(tag)].find(el => el.textContent.includes(text));
    return {
      eyebrow: byText('p', 'Thực phẩm có hành trình rõ ràng'),
      h1: section.querySelector('#hero-title'),
      'mô tả': byText('p', 'Bếp Tươi kết nối'),
      CTA: byText('a', 'Khám phá sản phẩm')?.parentElement,
      visual: section.querySelector('[role="img"]'),
    };
  };
  const t0 = performance.now();
  const tick = () => {
    const els = findHero();
    const t = performance.now() - t0;
    const row = { t };
    for (const [name, el] of Object.entries(els)) {
      if (!el) continue;
      const chain = [];
      for (let n = el; n && n.tagName !== 'SECTION'; n = n.parentElement) chain.push(...n.getAnimations());
      chain.push(...el.getAnimations({ subtree: true }));
      for (const a of chain) {
        const timing = a.effect.getTiming();
        const key = `${name}|${timing.duration}|${timing.delay}`;
        window.__hero.anims[key] = { name, duration: Number(timing.duration), delay: Number(timing.delay) };
      }
      const s = getComputedStyle(el);
      row[name] = { opacity: parseFloat(s.opacity), transform: s.transform, filter: s.filter, top: el.offsetTop, height: el.offsetHeight };
    }
    window.__hero.samples.push(row);
    if (t < 4000) requestAnimationFrame(tick);
  };
  const start = () => (document.querySelector('section[aria-labelledby="hero-title"]') ? tick() : performance.now() - t0 < 4000 ? requestAnimationFrame(start) : 0);
  start();
};

async function loadHero(browser, options) {
  const { context, page } = await openAs(browser, null, options);
  await context.addInitScript(heroProbe);
  await page.goto('/');
  await page.locator('#hero-title').waitFor();
  await page.waitForTimeout(4300);
  const data = await page.evaluate(() => window.__hero);
  return { context, page, data };
}
const lastRow = data => data.samples.at(-1);

test('motion-store hero: mỗi phần tử vào đúng độ trễ và thời lượng của mẫu #216', async ({ browser }) => {
  const { context, data } = await loadHero(browser);
  const anims = Object.values(data.anims);
  for (const [name, pairs] of HERO) {
    const own = anims.filter(a => a.name === name);
    for (const [duration, delay] of pairs) {
      expect(own.some(a => a.duration === duration && a.delay === delay), `${name}: cần animation ${duration}ms trễ ${delay}ms, thấy ${JSON.stringify(own)}`).toBe(true);
    }
  }
  await context.close();
});

test('motion-store hero: trạng thái cuối hiện đủ, không còn dịch, mờ hay blur', async ({ browser }) => {
  const { context, data } = await loadHero(browser);
  const first = data.samples.find(row => row.visual);
  const last = lastRow(data);
  for (const [name] of HERO) {
    expect(last[name].opacity, `${name} opacity cuối`).toBe(1);
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], `${name} transform cuối`).toContain(last[name].transform);
    expect(last[name].filter, `${name} filter cuối`).toBe('none');
  }
  expect(first.visual.opacity, 'visual phải bắt đầu mờ dần vào').toBeLessThan(1);
  const done = name => data.samples.find(row => row[name]?.opacity >= 0.99)?.t ?? Infinity;
  expect(done('eyebrow')).toBeLessThan(done('h1'));
  expect(done('h1')).toBeLessThan(done('mô tả'));
  expect(done('mô tả')).toBeLessThan(done('CTA'));
  expect(done('CTA')).toBeLessThan(done('visual'));
  await context.close();
});

test('motion-store hero: không chia chữ thành span và vẫn có đúng một h1', async ({ browser }) => {
  const { context, page } = await loadHero(browser);
  expect(await page.locator('h1').count()).toBe(1);
  expect(await page.locator('#hero-title span:not(.text-p-text)').count(), 'h1 nguyên khối').toBe(0);
  await context.close();
});

for (const size of ['desktop', 'mobile']) {
  test(`motion-store hero: CLS ≤ 0.01 và hộp bố cục không dịch lúc vào (${size})`, async ({ browser }) => {
    const { context, page, data } = await loadHero(browser, { size });
    expect(await readCls(page), 'LayoutShift gồm cả hadRecentInput').toBeLessThanOrEqual(0.01);
    for (const [name] of HERO) {
      const tops = data.samples.map(row => row[name]?.top).filter(v => v !== undefined);
      const heights = data.samples.map(row => row[name]?.height).filter(v => v !== undefined);
      expect(Math.max(...tops) - Math.min(...tops), `${name} offsetTop`).toBeLessThanOrEqual(1);
      expect(Math.max(...heights) - Math.min(...heights), `${name} offsetHeight`).toBeLessThanOrEqual(1);
    }
    await context.close();
  });
}

test('motion-store hero: reduced-motion bỏ trượt/scale/blur, chỉ fade ≤120ms, trạng thái cuối ngay', async ({ browser }) => {
  const { context, data } = await loadHero(browser, { reduced: true });
  expect(Object.values(data.anims).filter(a => a.duration > 120), 'animation dài hơn 120ms').toEqual([]);
  for (const row of data.samples) for (const [name] of HERO) {
    if (!row[name]) continue;
    expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], `${name} transform`).toContain(row[name].transform);
    expect(row[name].filter, `${name} filter`).toBe('none');
  }
  const settled = data.samples.find(row => row.t >= 200);
  for (const [name] of HERO) expect(settled[name].opacity, `${name} sau 200ms`).toBe(1);
  await context.close();
});

test('motion-store hero: tắt JS vẫn thấy toàn bộ hero', async ({ browser }) => {
  const { context, page } = await openAs(browser, null, { js: false });
  await page.goto('/');
  const section = page.locator('section[aria-labelledby="hero-title"]');
  await expect(section.locator('#hero-title')).toBeVisible();
  for (const target of [section.locator('#hero-title'), section.getByText('Thực phẩm có hành trình rõ ràng'), section.getByText('Bếp Tươi kết nối'), section.getByRole('link', { name: 'Khám phá sản phẩm' }), section.getByRole('img', { name: 'Ảnh rau củ tươi được tuyển chọn' })]) {
    await expect(target).toHaveCSS('opacity', '1');
    await expect(target).toBeVisible();
  }
  await context.close();
});

test('motion-store hero: Home đã đăng nhập có chuyển động vào, trạng thái cuối đủ và không dịch bố cục', async ({ browser }) => {
  const { context, page } = await openAs(browser, 'CUSTOMER');
  await context.addInitScript(() => {
    window.__home = new Set();
    const t0 = performance.now();
    const tick = () => {
      for (const a of document.querySelector('section[aria-label="Giới thiệu"]')?.getAnimations({ subtree: true }) ?? []) window.__home.add(`${a.effect.getTiming().duration}|${a.effect.getTiming().delay}`);
      if (performance.now() - t0 < 3000) requestAnimationFrame(tick);
    };
    tick();
  });
  await page.goto('/');
  const hero = page.getByRole('region', { name: 'Giới thiệu' });
  await hero.getByRole('heading', { level: 1 }).waitFor();
  await page.waitForTimeout(3200);
  expect(await page.evaluate(() => window.__home.size), 'Home hero chưa có chuyển động nào').toBeGreaterThan(0);
  for (const target of [hero.getByRole('heading', { level: 1 }), hero.getByRole('link', { name: 'Chọn meal kit tuần này' })]) await expect(target).toHaveCSS('opacity', '1');
  expect(await readCls(page)).toBeLessThanOrEqual(0.01);
  await context.close();
});
