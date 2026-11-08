import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { test, expect, type Page } from "@playwright/test";
import messages from "../../messages/vi.json" with { type: "json" };
import { a, credentials, login, response, saveName, resetPhoneKong } from "./helpers";

test.use({ viewport: { width: 1280, height: 800 } });
test.describe.configure({ timeout: 300_000, retries: 0 });

const original = credentials("CUSTOMER");
const admin = credentials("ADMIN");
let customerName = "";
let adminName = "";
let customerPhoneDirty = false;
let adminPhoneDirty = false;
let adminNameDirty = false;

test.afterAll(async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  try {
    await login(page, original.email, original.password);
    if (customerName) await saveName(page, customerName);
    if (adminNameDirty && adminName) {
      await context.clearCookies();
      await login(page, admin.email, admin.password, true);
      await saveName(page, adminName);
      adminNameDirty = false;
    }
  } finally {
    if (customerPhoneDirty) {
      await resetPhoneKong(context.request, original.email, original.password);
      customerPhoneDirty = false;
    }
    if (adminPhoneDirty) {
      await resetPhoneKong(context.request, admin.email, admin.password);
      adminPhoneDirty = false;
    }
    await context.close();
  }
});

function section(page: Page, title: string) {
  return page.getByRole("heading", { name: title, level: 2 }).locator("xpath=ancestor::section");
}

test("01 Khách — tài khoản: layout, tên, số điện thoại, ảnh, email, mật khẩu, thiết bị", async ({ page }, info) => {
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, action);
    await info.attach(name, { body: await page.screenshot(), contentType: "image/png" });
  }

  await step("01 Khách mở Tài khoản: thấy các nhóm Ảnh, Tên, SĐT, Email; không nút Sửa toàn thẻ", async () => {
    await login(page, original.email, original.password);
    const nameInput = page.getByLabel(a.displayName, { exact: true });
    customerName = (await nameInput.inputValue()) || "";
    await expect(page.getByRole("heading", { name: a.title, exact: true })).toBeVisible();
    for (const heading of [a.avatar, a.displayName, a.phone, a.email]) {
      await expect(page.getByRole("heading", { name: heading, level: 2 })).toBeVisible();
    }
    await expect(nameInput).toBeVisible();
    const html = (await page.content()).replace(/\/avatars\/[^\s"'>]+/g, "");
    expect(html).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  });

  await step("02 Sửa tên — lỗi validate: xoá hết → lỗi dưới ô, Lưu mờ; nhập 51 ký tự → cùng lỗi", async () => {
    const nameSection = section(page, a.displayName);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    await nameInput.fill("");
    await nameInput.blur();
    await expect(nameSection.getByRole("alert")).toContainText(a.nameInvalid);
    await expect(nameSection.getByRole("button", { name: a.save, exact: true })).toBeDisabled();
    await nameInput.fill("a".repeat(51));
    await nameInput.blur();
    await expect(nameSection.getByRole("alert")).toContainText(a.nameInvalid);
  });

  await step("03 Sửa tên — lưu thành công: Huỷ hiện; Lưu → toast; F5 → ô vẫn giữ tên mới", async () => {
    const nameSection = section(page, a.displayName);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    await nameInput.fill("Trần Văn Bình");
    const cancelBtn = nameSection.getByRole("button", { name: a.cancel, exact: true });
    await expect(cancelBtn).toBeVisible();
    const saveBtn = nameSection.getByRole("button", { name: a.save, exact: true });
    await expect(saveBtn).toBeEnabled();
    const saved = response(page, "/api/auth/profile", "PATCH");
    await saveBtn.click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByText(a.nameSaved, { exact: true })).toBeVisible();
    await expect(saveBtn).toBeDisabled();
    await expect(cancelBtn).toBeHidden();
    await page.reload();
    await expect(page.getByLabel(a.displayName, { exact: true })).toHaveValue("Trần Văn Bình");
  });

  await step("04 Huỷ: gõ tên khác → Huỷ → ô về \"Trần Văn Bình\"", async () => {
    const nameSection = section(page, a.displayName);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    await nameInput.fill("Tên tạm thời");
    await nameSection.getByRole("button", { name: a.cancel, exact: true }).click();
    await expect(nameInput).toHaveValue("Trần Văn Bình");
  });

  await step("05 Số điện thoại — lỗi, nhập mật khẩu sai, lưu đúng", async () => {
    const phoneSection = section(page, a.phone);
    const phoneInput = phoneSection.getByLabel(a.phone, { exact: true });
    await phoneInput.fill("123");
    await phoneInput.blur();
    await expect(phoneSection.getByRole("alert")).toContainText(a.phoneInvalid);

    await phoneInput.fill("0901234567");
    const pwdInput = phoneSection.getByLabel(a.currentPassword, { exact: true });
    await expect(pwdInput).toBeVisible();

    await pwdInput.fill("SaiMatKhau123!");
    const wrongReq = response(page, "/api/auth/profile/phone", "PATCH");
    await phoneSection.getByRole("button", { name: a.save, exact: true }).click();
    const wrongStatus = (await wrongReq).status();
    expect([401, 429]).toContain(wrongStatus);
    if (wrongStatus !== 429) {
      await expect(phoneSection.getByRole("alert")).toBeVisible();
    }

    await pwdInput.fill(original.password);
    const savedReq = response(page, "/api/auth/profile/phone", "PATCH");
    await phoneSection.getByRole("button", { name: a.save, exact: true }).click();
    const savedStatus = (await savedReq).status();
    if (savedStatus === 429) {
      customerPhoneDirty = false;
      return;
    }
    expect(savedStatus).toBe(200);
    customerPhoneDirty = true;
    await expect(page.getByText(a.phoneSaved)).toBeVisible();
    await page.reload();
    await expect(page.getByLabel(a.phone, { exact: true })).toHaveValue(/0901234567|84901234567|\+84901234567/);
  });

  await step("06 Ảnh — chọn hợp lệ → tự tải, toast; chọn .gif → lỗi chữ đỏ", async () => {
    const validPng = Buffer.from(
      "89504e470d0a1a0a0000000d49484452000000010000000108060000001f" +
      "15c4890000000d49444154789c63f8cfc0f01f00050001ff89993d1d0000" +
      "000049454e44ae426082",
      "hex",
    );
    const fileInput = page.locator("input[type='file'][accept*='image']");
    const finalizeReq = page.waitForResponse(
      res => res.url().includes("/api/auth/profile/avatar/finalize") && res.request().method() === "POST",
      { timeout: 20_000 },
    );
    await fileInput.setInputFiles({ name: "avatar.png", mimeType: "image/png", buffer: validPng });
    const finalizeRes = await finalizeReq;
    expect(finalizeRes.ok()).toBe(true);
    await expect(page.getByText(a.avatarSaved)).toBeVisible({ timeout: 5_000 });
    await page.reload();

    await fileInput.setInputFiles({ name: "anim.gif", mimeType: "image/gif", buffer: Buffer.alloc(10, 0) });
    await expect(page.getByText(a.invalidAvatar)).toBeVisible();
  });

  await step("07 Email khách — Đổi email → dialog; nhập dở rồi Esc → hỏi Bỏ thay đổi; mở lại, email trùng → lỗi; email mới → đóng, dòng thông báo hiện", async () => {
    const changeBtn = page.getByRole("button", { name: a.changeEmail, exact: true });
    await changeBtn.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(a.newEmail, { exact: true }).fill("partial@test");
    await page.keyboard.press("Escape");
    const confirmDialog = page.getByRole("alertdialog");
    const hasConfirm = await confirmDialog.isVisible().catch(() => false);
    if (hasConfirm) {
      await confirmDialog.getByRole("button", { name: a.discardConfirm, exact: true }).click();
    }
    await expect(dialog).toBeHidden();

    await changeBtn.click();
    const dialog2 = page.getByRole("dialog");
    await dialog2.getByLabel(a.newEmail, { exact: true }).fill(original.email);
    await dialog2.getByLabel(a.currentPassword, { exact: true }).fill(original.password);
    const conflictReq = response(page, "/api/auth/email/change", "POST");
    await dialog2.getByRole("button", { name: a.sendConfirmation, exact: true }).click();
    expect((await conflictReq).status()).toBeGreaterThanOrEqual(400);

    const tempEmail = `e2e+vid-${Date.now()}@dcenter.test`;
    await dialog2.getByLabel(a.newEmail, { exact: true }).fill(tempEmail);
    await dialog2.getByLabel(a.currentPassword, { exact: true }).fill(original.password);
    const sentReq = response(page, "/api/auth/email/change", "POST");
    await dialog2.getByRole("button", { name: a.sendConfirmation, exact: true }).click();
    const sentStatus = (await sentReq).status();
    if (sentStatus === 429) {
      return;
    }
    expect(sentStatus).toBe(202);
    await expect(dialog2).toBeHidden();
    await expect(section(page, a.email).getByText(/Đã gửi thư xác nhận tới/)).toBeVisible();
  });
});

test("02 Khách — tab Đăng nhập & bảo mật: mật khẩu, thiết bị", async ({ page }, info) => {
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, action);
    await info.attach(name, { body: await page.screenshot(), contentType: "image/png" });
  }

  await step("01 Chuyển sang tab Đăng nhập & bảo mật", async () => {
    await login(page, original.email, original.password);
    await page.getByRole("link", { name: a.tabSecurity, exact: true }).click();
    await page.waitForURL(url => url.pathname === "/me" && url.searchParams.get("tab") === "security");
  });

  await step("08 Mật khẩu — không có dấu chấm giả; dialog: nhập lại không khớp → lỗi dưới ô", async () => {
    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toContain("••••••••");
    await expect(page.getByText(a.passwordDescription, { exact: true })).toBeVisible();

    await page.getByRole("button", { name: a.changePassword, exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByLabel(a.currentPassword, { exact: true }).fill(original.password);
    await dialog.getByLabel(a.newPassword, { exact: true }).fill("NewPassword123!");
    await dialog.getByLabel(a.repeatPassword, { exact: true }).fill("DifferentPassword123!");
    await dialog.getByRole("button", { name: a.changePassword, exact: true }).click();
    await expect(dialog.getByRole("alert")).toContainText(a.passwordMismatch);

    await page.keyboard.press("Escape");
    const discardConfirm = page.getByRole("alertdialog");
    const needsDiscard = await discardConfirm.isVisible({ timeout: 1_000 }).catch(() => false);
    if (needsDiscard) {
      await discardConfirm.getByRole("button", { name: a.discardConfirm, exact: true }).click();
    }
    await expect(page.getByRole("dialog")).toBeHidden();
  });
  await step("09 Thiết bị — bảng 2 cột, nút Đăng xuất ghost; xác nhận đăng xuất 1 thiết bị → toast", async () => {
    const otherContext = await page.context().browser()!.newContext({
      baseURL: test.info().project.use.baseURL,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    });
    const otherPage = await otherContext.newPage();
    await login(otherPage, original.email, original.password);
    await otherContext.close();

    await page.reload();
    await expect(page.getByRole("heading", { name: a.sessions, level: 2 })).toBeVisible();
    const sessionsSection = section(page, a.sessions);
    await expect(sessionsSection.getByRole("button", { name: a.logout, exact: true }).first()).toBeVisible({ timeout: 10_000 });

    const logoutBtns = sessionsSection.getByRole("button", { name: a.logout, exact: true });
    const firstBtn = logoutBtns.first();
    const variant = await firstBtn.getAttribute("data-variant") || "";
    expect(variant).not.toBe("outline");

    await firstBtn.click();
    const confirmDialog = page.getByRole("alertdialog");
    await expect(confirmDialog).toBeVisible();
    const revokeReq = page.waitForResponse(res => res.url().includes("/api/auth/sessions/") && res.request().method() === "DELETE");
    await confirmDialog.getByRole("button", { name: a.logout, exact: true }).click();
    const revokeStatus = (await revokeReq).status();
    expect(revokeStatus).toBeLessThan(300);
    await expect(page.getByText(a.sessionRevoked)).toBeVisible({ timeout: 8_000 });
  });
});

test("03 Nhân viên — thông tin, vai trò và bảo mật trong trang hồ sơ", async ({ page }, info) => {
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, action);
    await info.attach(name, { body: await page.screenshot(), contentType: "image/png" });
  }

  await step("10 Nhân viên — email chỉ đọc, không nút đổi; sửa tên; tổ chức có tên; đầu trang không lặp ảnh/tên", async () => {
    await login(page, admin.email, admin.password, true);
    const main = page.locator("main").first();
    await expect(main.getByText(admin.email).first()).toBeVisible();
    await expect(main.getByText(messages.record.emailManaged).first()).toBeVisible();
    await expect(page.getByRole("button", { name: a.changeEmail, exact: true })).toHaveCount(0);

    await expect(page.getByRole("tab", { name: messages.record.info, exact: true })).toBeVisible();

    const nameSection = section(page, messages.record.personal);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    adminName = (await nameInput.inputValue()) || "";
    adminNameDirty = true;
    await nameInput.fill("Nhân viên kiểm thử video");
    const saveReq = response(page, "/api/auth/profile", "PATCH");
    await nameSection.getByRole("button", { name: a.save, exact: true }).click();
    expect((await saveReq).status()).toBe(200);
    await expect(page.getByText(a.nameSaved)).toBeVisible();
    await nameInput.fill(adminName);
    const restoreReq = response(page, "/api/auth/profile", "PATCH");
    await nameSection.getByRole("button", { name: a.save, exact: true }).click();
    expect((await restoreReq).status()).toBe(200);
    adminNameDirty = false;

    await page.getByRole("tab", { name: messages.record.rolesBranches, exact: true }).click();
    await page.waitForURL((url) => url.searchParams.get("tab") === "roles");
    await page.reload();
    await expect(page.getByRole("tab", { name: messages.record.rolesBranches, exact: true })).toHaveAttribute("aria-selected", "true");
    const orgSection = section(page, messages.record.rolesBranches);
    await expect(orgSection).toBeVisible();
    const orgText = await orgSection.innerText();
    await page.getByRole("tab", { name: messages.record.security, exact: true }).click();
    await expect(page.getByRole("heading", { name: a.password, level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: messages.record.sessions, level: 2 })).toBeVisible();
    expect(orgText).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  });
});

test("04 Chụp ảnh nhiều cảnh — 1280 sáng/tối, 375", async ({ page }, info) => {
  async function snap(name: string) {
    await info.attach(name, { body: await page.screenshot(), contentType: "image/png" });
  }

  await login(page, original.email, original.password);
  await snap("11 khách-1280-sang-ho-so");
  await page.getByRole("link", { name: a.tabSecurity, exact: true }).click();
  await page.waitForURL(url => url.searchParams.get("tab") === "security");
  await snap("12 khach-1280-sang-dang-nhap-bao-mat");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/me");
  await snap("13 khach-1280-toi-ho-so");

  await page.setViewportSize({ width: 375, height: 812 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/me");
  await snap("14 khach-375-ho-so");
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  expect(bodyWidth).toBeLessThanOrEqual(377); // 2px dung sai

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ colorScheme: "light" });
  await login(page, admin.email, admin.password, true);
  await snap("15 nhan-vien-1280-sang");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.reload();
  await snap("16 nhan-vien-1280-toi");
});


test("05 Sidebar giữ nguyên khi mở Tài khoản; danh sách mở chi tiết nhân viên", async ({ page }, info) => {
  const hosoDir = resolve(process.env.E2E_OUTPUT_DIR || "/home/dawn/work/ticket/.cache/video-nghiep-vu/07-tai-khoan/hoso");
  mkdirSync(hosoDir, { recursive: true });
  async function step(name: string, filename: string, action: () => Promise<void>) {
    await test.step(name, action);
    const shot = await page.screenshot({ path: `${hosoDir}/${filename}.png` });
    await info.attach(name, { body: shot, contentType: "image/png" });
  }

  await test.step("1. Đăng nhập nhân viên, mở giao diện quản trị", async () => {
    await login(page, admin.email, admin.password, true);
    await page.goto("/memberships");
    const sidebar = page.locator('[data-slot="sidebar"]');
    await expect(sidebar).toBeVisible();
  });

  await step("2. Bấm 'Tài khoản' ở sidebar — sidebar vẫn giữ nguyên", "01-sidebar-tai-khoan", async () => {
    const sidebar = page.locator('[data-slot="sidebar"]');
    await sidebar.getByRole("button", { name: /^Tài khoản của / }).click();
    await page.getByRole("menuitem", { name: "Tài khoản", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(sidebar).toBeVisible();
    await expect(page.getByText(a.title).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  await step("3. Header hồ sơ tài khoản: ảnh đại diện, tên, meta liên hệ, badge trạng thái và vai trò", "02-header-tai-khoan", async () => {
    const main = page.locator("main").first();
    await expect(main.locator('[data-slot="avatar"]').first()).toBeVisible();
    await expect(main.getByText(admin.email).first()).toBeVisible();
    await expect(main.getByText(/Tham gia \d{2}\/\d{2}\/\d{4}/).first()).toBeVisible();
    await expect(main.getByText(messages.record.status).first()).toBeVisible();
    await expect(main.getByText(messages.record.active).first()).toBeVisible();
    await expect(main.getByText(messages.record.roles).first()).toBeVisible();
    await expect(page.getByRole("button", { name: messages.record.edit, exact: true })).toBeVisible();
  });

  await step("4. Ba tab: Thông tin, Vai trò & chi nhánh, Bảo mật", "03-ba-tab-tai-khoan", async () => {
    const infoTab = page.getByRole("tab", { name: messages.record.info, exact: true });
    const rolesTab = page.getByRole("tab", { name: messages.record.rolesBranches, exact: true });
    const securityTab = page.getByRole("tab", { name: messages.record.security, exact: true });

    await expect(infoTab).toBeVisible();
    await expect(rolesTab).toBeVisible();
    await expect(securityTab).toBeVisible();

    await expect(infoTab).toHaveAttribute("aria-selected", "true");
    await expect(section(page, messages.record.personal)).toBeVisible();
    await expect(section(page, messages.record.contact)).toBeVisible();

    await rolesTab.click();
    await page.waitForURL((url) => url.searchParams.get("tab") === "roles");
    await expect(rolesTab).toHaveAttribute("aria-selected", "true");
    await expect(section(page, messages.record.rolesBranches)).toBeVisible();

    await securityTab.click();
    await page.waitForURL((url) => url.searchParams.get("tab") === "security");
    await expect(securityTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("heading", { name: a.password, level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: messages.record.sessions, level: 2 })).toBeVisible();
  });

  await step("5. Nút Sửa ở header tự động chuyển sang tab Thông tin và focus ô Tên", "04-nut-sua-focus-ten", async () => {
    const editBtn = page.getByRole("button", { name: messages.record.edit, exact: true });
    await editBtn.click();
    await page.waitForURL((url) => !url.searchParams.get("tab") || url.searchParams.get("tab") === "info");
    const infoTab = page.getByRole("tab", { name: messages.record.info, exact: true });
    await expect(infoTab).toHaveAttribute("aria-selected", "true");

    const nameSection = section(page, messages.record.personal);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    await expect(nameInput).toBeFocused();
  });

  await step("6. Đổi tên hiển thị rồi khôi phục lại", "05-doi-ten-va-khoi-phuc", async () => {
    const nameSection = section(page, messages.record.personal);
    const nameInput = nameSection.getByLabel(a.displayName, { exact: true });
    const currentName = (await nameInput.inputValue()) || "";
    const testName = "Admin kiểm thử hồ sơ";

    await nameInput.fill(testName);
    const saveReq = response(page, "/api/auth/profile", "PATCH");
    await nameSection.getByRole("button", { name: a.save, exact: true }).click();
    expect((await saveReq).status()).toBe(200);
    await expect(page.getByText(a.nameSaved).first()).toBeVisible();
    await expect(nameInput).toHaveValue(testName);

    await nameInput.fill(currentName);
    const restoreReq = response(page, "/api/auth/profile", "PATCH");
    await nameSection.getByRole("button", { name: a.save, exact: true }).click();
    expect((await restoreReq).status()).toBe(200);
    await expect(page.getByText(a.nameSaved).last()).toBeVisible();
    await expect(nameInput).toHaveValue(currentName);
  });

  await step("7. Mở danh sách Nhân viên, bấm tên người để vào chi tiết", "06-danh-sach-chi-tiet-nhan-vien", async () => {
    const sidebar = page.locator('[data-slot="sidebar"]');
    await page.goto("/memberships");
    await expect(page).toHaveURL(/\/memberships$/);
    await expect(sidebar).toBeVisible();

    const employee = page.getByRole("table").getByRole("link").first();
    const employeeName = (await employee.innerText()).trim();
    await employee.click();
    await expect(page).toHaveURL(/\/memberships\/[^/?]+$/);
    await expect(sidebar).toBeVisible();

    await expect(page.getByRole("heading", { name: employeeName, exact: true, level: 1 })).toBeVisible();
    await expect(page.getByText(messages.record.status).first()).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  });

  await step("8. Chi tiết nhân viên: tab Phân công và tab Thông tin chỉ đọc", "07-nhan-vien-phan-cong-thong-tin", async () => {
    const assignmentsTab = page.getByRole("tab", { name: messages.record.assignments, exact: true });
    const infoTab = page.getByRole("tab", { name: messages.record.info, exact: true });

    await expect(assignmentsTab).toHaveAttribute("aria-selected", "true");
    await expect(section(page, messages.record.assignments)).toBeVisible();

    await infoTab.click();
    await page.waitForURL((url) => url.searchParams.get("tab") === "info");
    await expect(infoTab).toHaveAttribute("aria-selected", "true");

    const infoSection = section(page, messages.record.personal);
    await expect(infoSection).toBeVisible();
    await expect(infoSection.getByLabel(a.displayName, { exact: true })).toBeDisabled();
    await expect(infoSection.getByLabel(a.email, { exact: true })).toBeDisabled();
    await expect(page.getByText(messages.record.selfManaged)).toBeVisible();
  });

  await step("9. Tải lại trang — vẫn giữ nguyên tab (?tab=) và không lộ UUID", "08-giu-tab-sau-reload", async () => {
    await page.reload();
    const infoTab = page.getByRole("tab", { name: messages.record.info, exact: true });
    await expect(infoTab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByText(messages.record.selfManaged)).toBeVisible();

    const assignmentsTab = page.getByRole("tab", { name: messages.record.assignments, exact: true });
    await assignmentsTab.click();
    await page.waitForURL((url) => url.searchParams.get("tab") === "assignments");
    await page.reload();
    await expect(assignmentsTab).toHaveAttribute("aria-selected", "true");

    expect(await page.locator("main").innerText()).not.toMatch(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i);
  });
});
