import { test, expect, type Page } from "@playwright/test";
import { credentials, login } from "../account/helpers";

const admin = credentials("ADMIN");
const person = credentials("WAREHOUSE");
const dir = process.env.E2E_SHOT_DIR || "/home/dawn/work/ticket/.cache/e2e/branch-5c";
const store = "Cửa hàng Cầu Giấy";
const storeLabel = `Sunny · ${store}`;
const nav = (page: Page) => page.getByRole("navigation", { name: "Điều hướng quản trị" });

test("ADMIN phân công một người ở nhiều chi nhánh rồi trả về như cũ", async ({ page }) => {
  test.setTimeout(300_000);
  await login(page, admin.email, admin.password, true);
  const sheet = page.getByRole("dialog", { name: /^Phân công:/ });

  await test.step("H2.1 Quản trị › Nhân viên: mỗi người một dòng, lọc theo chi nhánh", async () => {
    await page.goto("/console");
    await nav(page).getByRole("button", { name: "Quản trị", exact: true }).click();
    await nav(page).getByRole("link", { name: "Nhân viên", exact: true }).click();
    await page.waitForURL(/\/memberships$/);
    await expect(page.getByRole("heading", { name: "Nhân viên", exact: true })).toBeVisible();
    const filter = page.getByRole("combobox", { name: "Lọc theo chi nhánh" });
    await expect(filter).toHaveText("Tất cả chi nhánh");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.screenshot({ path: `${dir}/1-danh-sach.png` });
    await filter.click();
    await page.getByRole("option", { name: storeLabel }).click();
    await page.screenshot({ path: `${dir}/2-loc.png` });
    await filter.click();
    await page.getByRole("option", { name: storeLabel }).click();
    await expect(filter).toHaveText("Tất cả chi nhánh");
    await page.getByRole("textbox", { name: "Tìm nhân viên" }).fill(person.email);
  });

  await test.step("H2.2 Bấm vào một người: mở Sheet Phân công", async () => {
    await page.getByRole("row").nth(1).click();
    await expect(sheet).toBeVisible();
    await expect(sheet.getByText("Xem mọi chi nhánh")).toBeVisible();
    await expect(sheet.getByText("Khoá ở chi nhánh này")).toBeVisible();
    await page.screenshot({ path: `${dir}/3-sheet.png` });
  });

  await test.step("H2.3 Thêm chi nhánh Cầu Giấy với vai trò Kho", async () => {
    await sheet.getByRole("button", { name: "Thêm chi nhánh" }).click();
    await sheet.getByRole("combobox", { name: "Chi nhánh" }).click();
    await page.getByRole("option", { name: storeLabel }).click();
    await sheet.getByRole("group", { name: `Vai trò ở ${storeLabel}` }).getByRole("button", { name: "Kho" }).click();
    await expect(sheet.getByText("1 thay đổi chưa lưu")).toBeVisible();
    await page.screenshot({ path: `${dir}/4-them-chi-nhanh.png` });
  });

  await test.step("H2.4 Lưu một lần", async () => {
    const saved = page.waitForResponse((res) => res.request().method() === "POST" && res.url().endsWith("/company/memberships"));
    await sheet.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await saved).status()).toBe(201);
    await expect(sheet).toBeHidden();
  });

  await test.step("H2.5 Thấy chip mới trên dòng của người đó", async () => {
    await expect(page.getByRole("row").nth(1)).toContainText(`${store} · Kho`);
    await page.screenshot({ path: `${dir}/5-co-chip.png` });
  });

  await test.step("H2.6 Mở lại, bỏ Cầu Giấy khỏi người này", async () => {
    await page.getByRole("row").nth(1).click();
    await sheet.getByRole("button", { name: `Bỏ khỏi ${storeLabel}` }).click();
    await expect(sheet.getByText("1 thay đổi chưa lưu")).toBeVisible();
    await page.screenshot({ path: `${dir}/6-bo-chi-nhanh.png` });
  });

  await test.step("H2.7 Lưu: người này về như cũ", async () => {
    const removed = page.waitForResponse((res) => res.request().method() === "DELETE" && res.url().includes("/company/memberships/"));
    await sheet.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await removed).status()).toBe(200);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("row").nth(1)).not.toContainText(store);
    await page.screenshot({ path: `${dir}/7-ve-nhu-cu.png` });
  });

  await test.step("H2.8 Không tự sửa chính mình; mời người mới chỉ mở form rồi huỷ", async () => {
    await page.getByRole("textbox", { name: "Tìm nhân viên" }).fill(admin.email);
    await page.getByRole("row").nth(1).click();
    await expect(sheet.getByText("Bạn không thể sửa phân công của chính mình.")).toBeVisible();
    await expect(sheet.getByRole("button", { name: "Thêm chi nhánh" })).toHaveCount(0);
    await page.screenshot({ path: `${dir}/8-tu-sua-minh.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Thêm nhân viên" }).click();
    const dialog = page.getByRole("dialog", { name: /^Thêm nhân viên vào/ });
    await dialog.getByRole("button", { name: "Không thấy? Mời người mới" }).click();
    await expect(dialog.getByText("Họ sẽ nhận thư để tự đặt mật khẩu.")).toBeVisible();
    await page.screenshot({ path: `${dir}/9-moi-nguoi-moi.png` });
    await dialog.getByRole("button", { name: "Huỷ" }).click();
    await expect(dialog).toBeHidden();
  });
});
