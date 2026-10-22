const { chromium } = require('/home/dawn/work/ticket/portal/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = '/home/dawn/work/ticket/plans/261022-ui-motion/preview';
const output = '/home/dawn/wt/portal-motion/.aidlc/runs/PORTAL-MOTION-001/artifacts';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/brave.com/brave/brave', headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  const errors = [], requests = [], results = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (['xhr', 'fetch'].includes(r.resourceType())) requests.push(r.url()); });
  await page.addInitScript(() => {
    window.previewShifts = [];
    new PerformanceObserver(list => list.getEntries().forEach(e => window.previewShifts.push({ value: e.value, recent: e.hadRecentInput }))).observe({ type: 'layout-shift', buffered: true });
  });
  for (const width of [375, 768, 1024, 1440]) {
    for (const theme of ['light', 'dark']) {
      for (const reducedMotion of ['no-preference', 'reduce']) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion });
        await page.goto('file://' + base + '/index.html');
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; return document.fonts.ready; }, theme);
        await page.waitForTimeout(reducedMotion === 'reduce' ? 80 : 2200);
        assert.equal(await page.locator('.product:visible').count(), 6);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'horizontal overflow');
        await page.getByRole('button', { name: 'Nấu nhanh', exact: true }).click();
        assert.equal(await page.locator('.product:visible').count(), 4);
        await page.getByRole('button', { name: 'Rau củ', exact: true }).click();
        assert.equal(await page.locator('.product:visible').count(), 2);
        await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
        await page.getByRole('button', { name: 'Tăng Gà áp chảo rau củ', exact: true }).click();
        await page.getByRole('button', { name: 'Thêm Gà áp chảo rau củ vào giỏ', exact: true }).click();
        assert.equal(await page.locator('#cart-count').textContent(), '2');
        assert.equal(await page.locator('#cart-total').textContent(), '258.000 ₫');
        assert(await page.locator('#page-content').evaluate(el => el.inert));
        await page.keyboard.press('Escape');
        assert(await page.getByRole('button', { name: 'Thêm Gà áp chảo rau củ vào giỏ', exact: true }).evaluate(el => el === document.activeElement));
        assert(await page.locator('#cart-drawer').evaluate(el => el.inert));
        await page.getByRole('button', { name: 'Bản cũ', exact: true }).click();
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--bg').trim()), theme === 'dark' ? '#0F0F11' : '#F4F4F5');
        await page.getByRole('button', { name: 'Bản mới', exact: true }).click();
        if (reducedMotion === 'reduce') {
          assert.equal(await page.locator('.u216 [data-s]').first().evaluate(el => getComputedStyle(el).opacity), '1');
          assert.equal(await page.locator('.u240-dr').evaluate(el => getComputedStyle(el).transitionDuration), '0s');
          assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
        }
        const shifts = await page.evaluate(() => window.previewShifts);
        results.push({ width, theme, reducedMotion, checks: 'grid/filter/quantity/cart/Escape/focus/version/reduced PASS', clsWithoutRecentInput: shifts.filter(x => !x.recent).reduce((s, x) => s + x.value, 0) });
        console.log('PASS', width, theme, reducedMotion);
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('file://' + base + '/index.html');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: base + '/desktop.png', fullPage: true });
  await page.locator('#email').fill('preview@example.com');
  await page.locator('#password').fill('preview-only');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  assert(await page.locator('#submit-login').isDisabled());
  assert.equal(await page.locator('#login-status').textContent(), 'Đang kiểm tra…');
  await page.locator('#login-form').screenshot({ path: base + '/login-loading.png' });
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#password').getAttribute('aria-invalid'), 'true');
  assert.equal(await page.locator('#password').inputValue(), 'preview-only');
  assert(await page.locator('#password').evaluate(el => el === document.activeElement));
  await page.locator('#login-form').screenshot({ path: base + '/login-error.png' });
  await page.getByRole('button', { name: 'Hiện mật khẩu' }).click();
  assert.equal(await page.locator('#password').getAttribute('type'), 'text');
  await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
  await page.locator('#password').fill('');
  await page.locator('#email').fill('');
  await page.getByRole('button', { name: 'Thêm Gà áp chảo rau củ vào giỏ', exact: true }).click();
  await page.waitForTimeout(550);
  await page.screenshot({ path: base + '/drawer.png' });
  const first = page.locator('#cart-drawer a').first();
  await first.focus();
  await page.keyboard.press('Shift+Tab');
  assert(await page.locator('#continue-shopping').evaluate(el => el === document.activeElement));
  await page.keyboard.press('Tab');
  assert(await first.evaluate(el => el === document.activeElement));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Chế độ tối' }).click();
  await page.screenshot({ path: base + '/desktop-dark.png', fullPage: true });
  await page.getByRole('button', { name: 'Chế độ sáng' }).click();
  await page.setViewportSize({ width: 375, height: 844 });
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({ path: base + '/mobile.png', fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#email').fill('preview@example.com');
  await page.locator('#password').fill('preview-only');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  assert.equal(await page.locator('#submit-login').evaluate(el => getComputedStyle(el).transitionDuration.split(',').every(x => parseFloat(x) === 0)), true);
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('#login-form').evaluate(el => getComputedStyle(el).animationName), 'none');
  assert.equal(errors.length, 0, errors.join('\n'));
  assert.equal(requests.length, 0, 'unexpected API request');
  fs.writeFileSync(output + '/preview-verification.json', JSON.stringify({ scope: 'Static HTML preview only; not app production receipts', matrix: results, login: 'loading/error/password visibility/preserved input/reduced PASS', keyboard: 'focus trap/Escape/restore PASS', pageErrors: errors, apiRequests: requests, screenshots: ['desktop.png', 'mobile.png', 'desktop-dark.png', 'drawer.png', 'login-loading.png', 'login-error.png'] }, null, 2) + '\n');
  console.log('RESULT matrix 16/16 PASS; login + keyboard PASS; pageErrors=0; API requests=0');
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; });
