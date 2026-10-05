/**
 * PLAN acceptance specification; not claimed to pass against current portal.
 * Run, once implementation/dependencies are approved and available:
 * npm exec --no -- playwright test .aidlc/runs/PORTAL-BASE-UI-001/testkit/happy.spec.ts --workers=1
 * Expected: 1 passed; ALL PASS line; OWNER + employee accept through UI,
 * mandatory Hanoi address in GET /customer/me + DB, locked/unlocked DB truth.
 * Labels/select controls below define the draft UI contract [ASSUMED].
 * No API mutation substitutes for an A–E screen action. API/SQL mutations
 * below are test bootstrap only (platform role, company/module fixture).
 * No 429 retry; no screenshots or tracing of mail tokens/passwords.
 */
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

const portal = process.env.PORTAL_URL ?? 'http://localhost:3000';
const kong = process.env.KONG ?? 'http://localhost:8000';
const mailpit = process.env.MAILPIT ?? 'http://localhost:8025';
for (const endpoint of [portal, kong, mailpit]) {
  if (new URL(endpoint).hostname !== 'localhost') throw new Error('Use localhost endpoints');
}
const password = 'REDACTED';
const nextPassword = 'Mat-khau-moi-du-dai-2!';
const unwrap = (body: any) => body.data ?? body;
const sql = (db: string, query: string) => execFileSync('docker', [
  'compose', '-p', 'dcentervn-local', '--project-directory', '/mnt/win_d/feature/ticket/dev-infra',
  'exec', '-T', 'postgres', 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1', '-tA', '-d', db, '-c', query,
], { encoding: 'utf8' }).trim();
const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;
async function call(api: APIRequestContext, method: string, path: string, data?: object, token?: string) {
  const response = await api.fetch(`${kong}${path}`, {
    method, data, headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  expect(response.status(), '429 stops the run; never auto-retry').not.toBe(429);
  expect(response.ok(), `${method} ${path} expected success`).toBeTruthy();
  return unwrap(await response.json());
}
async function mail(api: APIRequestContext, email: string, subject?: string) {
  let item: any;
  await expect.poll(async () => {
    const res = await api.get(`${mailpit}/api/v1/search`, { params: { query: `to:${email}` } });
    expect(res.ok()).toBeTruthy();
    const messages = (await res.json()).messages ?? [];
    item = subject ? messages.find((m: any) => m.Subject === subject) : messages[0];
    return Boolean(item);
  }, { timeout: 15000, intervals: [500] }).toBe(true);
  const message = await api.get(`${mailpit}/api/v1/message/${item.ID}`);
  const body = await message.json();
  const found = `${body.Text ?? ''} ${body.HTML ?? ''}`.match(/https?:\/\/[^" <>]+token=[A-Za-z0-9_.~%-]+/);
  expect(found, 'real mail action URL').toBeTruthy();
  const source = new URL(found![0].replaceAll('&amp;', '&'));
  const target = new URL(source.pathname + source.search, portal);
  return { url: target.toString(), subject: item.Subject };
}
async function login(page: Page, email: string, pw = password) {
  await page.goto(`${portal}/login`);
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(pw);
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?|$)/);
}
async function accept(page: Page, url: string) {
  expect(new URL(url).pathname).toBe('/invite/accept');
  await page.goto(url);
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password);
  await page.getByLabel('Nhập lại mật khẩu', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Đặt mật khẩu', exact: true }).click();
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
}
async function selectContext(page: Page, companyName: string) {
  await page.goto(`${portal}/switch-org`);
  await page.getByRole('button', { name: new RegExp(companyName) }).click();
  await expect(page).not.toHaveURL(/\/switch-(org|branch)/);
}
async function noOverflow(page: Page) {
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.setViewportSize({ width: 1440, height: 1000 });
}

test('A–E: real mail, invitations, Hanoi address and staff lock readback', async ({ browser, request }, testInfo) => {
  test.setTimeout(180000);
  const run = Date.now().toString();
  const adminEmail = `padmin.${run}@e2e.test`;
  const ownerEmail = `newowner.${run}@e2e.test`;
  const employeeEmail = `staff.${run}@e2e.test`;
  const companyName = `Cong ty ${run}`;
  const failures: string[] = [];
  const contexts = await Promise.all([browser.newContext(), browser.newContext(), browser.newContext()]);
  const [admin, owner, employee] = await Promise.all(contexts.map(c => c.newPage()));
  for (const page of [admin, owner, employee]) {
    page.on('pageerror', error => failures.push(error.message));
    page.on('console', msg => { if (msg.type() === 'error') failures.push(msg.text()); });
    page.on('response', res => {
      if (res.status() >= 500) failures.push(`${res.status()} ${new URL(res.url()).pathname}`);
      if (res.status() === 429) failures.push('429: stop; no automatic retry');
    });
  }
  try {
    // E: self-register and activate using the real delivered mail through UI.
    await admin.goto(`${portal}/register`);
    await admin.getByLabel('Tên hiển thị', { exact: true }).fill('Admin E2E');
    await admin.getByLabel('Email', { exact: true }).fill(adminEmail);
    await admin.getByLabel('Mật khẩu', { exact: true }).fill(password);
    await admin.getByRole('button', { name: 'Tạo tài khoản', exact: true }).click();
    await expect(admin.getByText('Kiểm tra hộp thư của bạn', { exact: true })).toBeVisible();
    await admin.goto((await mail(request, adminEmail)).url);
    await expect(admin.getByRole('link', { name: 'Đăng nhập', exact: true })).toBeVisible();
    await login(admin, adminEmail);

    // Bootstrap platform role/company, matching AUTH-INVITE-MAIL-001 fixture.
    // Platform onboarding screen is outside A–E and remains shell-owned.
    const adminAuth = await call(request, 'POST', '/auth/native/login', { email: adminEmail, password });
    sql('org_db', `INSERT INTO platform_staff (user_id, role) VALUES (${literal(adminAuth.user.id)}, 'PLATFORM_ADMIN')`);
    const onboard = await request.post(`${kong}/platform/companies`, {
      headers: { Authorization: `Bearer ${adminAuth.access_token}`, 'Idempotency-Key': `onboard-${run}` },
      data: { name: companyName, code: `E2EO-${run}`, contract_ref: `e2e-${run}`, owner_email: ownerEmail, owner_display_name: 'Chu Moi' },
    });
    expect(onboard.status()).toBe(201);
    const company = unwrap(await onboard.json());
    const root = company.root_branch_id ?? company.branch_id ?? company.id;
    sql('org_db', `INSERT INTO company_modules (root_branch_id,module_code,status,contract_ref) VALUES (${literal(root)},'CUSTOMER','ACTIVE',${literal(`e2e-${run}`)}) ON CONFLICT DO NOTHING`);
    const ownerMail = await mail(request, ownerEmail, 'Your company account is ready');
    expect(ownerMail.subject).toBe('Your company account is ready');
    expect(sql('auth_db', `SELECT status || ':' || (password_hash IS NULL) FROM users WHERE email=${literal(ownerEmail)}`)).toBe('PROVISIONED:true');
    // A/E: OWNER invite and context switch through UI.
    await accept(owner, ownerMail.url);
    await login(owner, ownerEmail);
    await selectContext(owner, companyName);

    // B: create invitation through UI, OWNER self-approval -> PROVISIONED.
    await owner.goto(`${portal}/memberships/invitations`);
    await owner.getByRole('button', { name: 'Mời nhân viên', exact: true }).click();
    await owner.getByLabel('Email', { exact: true }).fill(employeeEmail);
    await owner.getByLabel('Tên hiển thị', { exact: true }).fill('Nhan Vien E2E');
    await owner.getByLabel('Chi nhánh', { exact: true }).selectOption(root);
    await owner.getByRole('checkbox', { name: /SALES/ }).check();
    await owner.getByRole('button', { name: 'Gửi lời mời', exact: true }).click();
    const invitationRow = owner.getByRole('row').filter({ hasText: employeeEmail });
    await expect(invitationRow).toContainText('Đã cấp tài khoản');
    await noOverflow(owner);
    const invitationReadback = await owner.request.get(`${portal}/api/employee-invitations/${root}?branch_id=${root}&page=1&limit=20`);
    expect(invitationReadback.ok()).toBeTruthy();
    expect(unwrap(await invitationReadback.json()).items).toEqual(expect.arrayContaining([
      expect.objectContaining({ email: employeeEmail, status: 'PROVISIONED' }),
    ]));
    // A: employee accepts actual mail through same shared page.
    await accept(employee, (await mail(request, employeeEmail)).url);
    await login(employee, employeeEmail);

    // C: profile PATCH from UI and real cascading location selection.
    await employee.goto(`${portal}/me`);
    await expect(employee.getByLabel('Email', { exact: true })).toHaveValue(employeeEmail, { timeout: 10000 });
    await employee.getByLabel('Số điện thoại', { exact: true }).fill('0901 234 123');
    await employee.getByRole('button', { name: 'Lưu thông tin', exact: true }).click();
    await expect(employee.getByLabel('Số điện thoại', { exact: true })).toHaveValue('+84901234123');
    const provinces = await call(request, 'GET', '/locations/vn/provinces');
    expect(provinces).toHaveLength(34);
    const hanoi = provinces.find((p: any) => p.name === 'Hà Nội');
    expect(hanoi).toBeTruthy();
    const communes = await call(request, 'GET', `/locations/vn/provinces/${hanoi.code}/communes`);
    const commune = communes.find((c: any) => c.unit_type === 'Xã');
    expect(commune, 'real Hanoi commune; never skip D-136').toBeTruthy();
    await employee.getByRole('button', { name: 'Thêm địa chỉ', exact: true }).click();
    await employee.getByLabel('Tên người nhận', { exact: true }).fill('Nhan Vien E2E');
    await employee.getByLabel('Số điện thoại nhận hàng', { exact: true }).fill('0901234123');
    await employee.getByRole('combobox', { name: 'Tỉnh / thành phố', exact: true }).fill('Hà Nội');
    await employee.getByRole('option', { name: 'Hà Nội', exact: true }).click();
    await employee.getByRole('combobox', { name: 'Xã / phường', exact: true }).fill(commune.name);
    await employee.getByRole('option', { name: commune.name, exact: true }).click();
    await employee.getByLabel('Địa chỉ chi tiết', { exact: true }).fill(`12 E2E ${run}`);
    await employee.getByRole('checkbox', { name: 'Địa chỉ mặc định', exact: true }).check();
    await employee.getByRole('button', { name: 'Lưu địa chỉ', exact: true }).click();
    await expect(employee.getByText(`12 E2E ${run}`, { exact: true })).toBeVisible();
    await noOverflow(employee);
    const profileRes = await employee.request.get(`${portal}/api/customer/me`);
    expect(profileRes.ok()).toBeTruthy();
    const profile = unwrap(await profileRes.json());
    expect(profile.phone).toBe('+84901234123');
    expect(profile.addresses).toEqual(expect.arrayContaining([expect.objectContaining({
      province_code: hanoi.code, commune_code: commune.code, line: `12 E2E ${run}`, is_default: true,
    })]));
    const address = profile.addresses.find((a: any) => a.line === `12 E2E ${run}`);
    // Read the real database without assuming an address-table schema omitted by contract.
    const addressRow = sql('customer_db', `SELECT to_jsonb(a)::text FROM customer_addresses a WHERE id=${literal(address.id)}`);
    expect(JSON.parse(addressRow)).toMatchObject({ province_code: hanoi.code, commune_code: commune.code, line: `12 E2E ${run}` });
    expect(sql('customer_db', `SELECT phone FROM customers WHERE id=${literal(profile.id)}`)).toBe('+84901234123');

    // D: staff search/detail + lock dialog; C becomes read-only, then unlock.
    await owner.goto(`${portal}/customers`);
    await owner.getByRole('searchbox', { name: 'Tìm khách hàng', exact: true }).fill(employeeEmail);
    await owner.getByRole('row').filter({ hasText: employeeEmail }).click();
    await expect(owner.getByText('+84901234123', { exact: true })).toBeVisible();
    await owner.getByRole('button', { name: 'Khoá khách hàng', exact: true }).click();
    await owner.getByLabel('Lý do khoá', { exact: true }).fill('e2e khoá thử');
    await owner.getByRole('button', { name: 'Xác nhận khoá', exact: true }).click();
    expect(sql('customer_db', `SELECT status FROM customers WHERE id=${literal(profile.id)}`)).toBe('LOCKED');
    await employee.reload();
    await expect(employee.getByRole('alert')).toContainText('Hồ sơ đã bị khoá');
    await expect(employee.getByRole('button', { name: 'Lưu thông tin', exact: true })).toBeDisabled();
    await expect.poll(() => Number(sql('customer_db', `SELECT count(*) FROM outbox_events WHERE aggregate_id=${literal(profile.id)} AND status='PUBLISHED'`)), { timeout: 10000 }).toBeGreaterThan(0);
    await owner.getByRole('button', { name: 'Mở khoá khách hàng', exact: true }).click();
    expect(sql('customer_db', `SELECT status FROM customers WHERE id=${literal(profile.id)}`)).toBe('ACTIVE');
    await employee.reload();
    await expect(employee.getByRole('button', { name: 'Lưu thông tin', exact: true })).toBeEnabled();

    // E: forgot/reset through real mail and UI, using a fresh unauthenticated tab.
    const recovery = await contexts[2].newPage();
    await recovery.goto(`${portal}/forgot-password`);
    await recovery.getByLabel('Email', { exact: true }).fill(employeeEmail);
    await recovery.getByRole('button', { name: 'Gửi liên kết', exact: true }).click();
    let resetUrl = '';
    await expect.poll(async () => {
      resetUrl = (await mail(request, employeeEmail)).url;
      return new URL(resetUrl).pathname.includes('reset');
    }, { timeout: 15000 }).toBe(true);
    await recovery.goto(resetUrl);
    await recovery.getByLabel('Mật khẩu mới', { exact: true }).fill(nextPassword);
    await recovery.getByLabel('Nhập lại mật khẩu', { exact: true }).fill(nextPassword);
    await recovery.getByRole('button', { name: 'Đặt lại mật khẩu', exact: true }).click();
    await login(recovery, employeeEmail, nextPassword);
    // Attach only non-secret business evidence.
    await testInfo.attach('readback', { body: JSON.stringify({ customerId: profile.id, addressId: address.id, province: hanoi.code, commune: commune.code }), contentType: 'application/json' });
    expect(failures).toEqual([]);
    console.log(`ALL PASS run=${run}: OWNER/staff UI acceptance; Hanoi address GET+DB; lock/unlock`);
  } finally { await Promise.all(contexts.map(context => context.close())); }
});
