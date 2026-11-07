import { test, expect, type Page } from "@playwright/test";
import { credentials, login } from "../account/helpers";

const admin = credentials("ADMIN");
const staff = credentials("FOODDEV");
const dir = "/home/dawn/work/ticket/.cache/e2e/branch-5b";
const name = process.env.E2E_BRANCH_NAME || "Thử đóng";
const nav = (page: Page) => page.getByRole("navigation", { name: "Điều hướng quản trị" });

test("ADMIN mở cửa hàng mới, thêm nhân viên, tạm ngừng rồi đóng", async ({ page }) => {
  test.setTimeout(300_000);
  await login(page, admin.email, admin.password, true);

  await test.step("H1.1 Quản trị › Chi nhánh: bảng chi nhánh và nút Thêm cửa hàng", async () => {
    await page.goto("/console");
    await nav(page).getByRole("button", { name: "Quản trị", exact: true }).click();
    await nav(page).getByRole("link", { name: "Chi nhánh", exact: true }).click();
    await page.waitForURL(/\/branches$/);
    await expect(page.getByRole("heading", { name: "Chi nhánh", exact: true })).toBeVisible();
    await expect(page.getByRole("row", { name: /Bếp trung tâm/ })).toContainText("Đang hoạt động");
    await page.screenshot({ path: `${dir}/1-danh-sach.png` });
  });

  await test.step("H1.2 Thêm cửa hàng: mã tự sinh từ tên, bỏ dấu, viết hoa", async () => {
    await page.getByRole("button", { name: "Thêm cửa hàng" }).click();
    const dialog = page.getByRole("dialog", { name: "Thêm cửa hàng" });
    await dialog.getByLabel("Tên cửa hàng").fill(name);
    await expect(dialog.getByLabel("Mã", { exact: true })).toHaveValue(/^[A-Z0-9-]+$/);
    await page.screenshot({ path: `${dir}/2-hop-thoai-them.png` });
    const created = page.waitForResponse((res) => res.request().method() === "POST" && res.url().endsWith("/company/branches"));
    await dialog.getByRole("button", { name: "Lưu" }).click();
    expect((await created).status()).toBe(201);
  });

  await test.step("H1.3 Chuyển thẳng tới trang chi tiết, thấy bước tiếp: thêm nhân viên", async () => {
    await page.waitForURL(/\/branches\/[0-9a-f-]+\?moi=1/);
    await expect(page.getByRole("heading", { name })).toBeVisible();
    await expect(page.getByText(`Đã tạo ${name}. Bước tiếp: thêm nhân viên.`)).toBeVisible();
    await expect(page.getByRole("tab", { name: "Nhân viên" })).toHaveAttribute("aria-selected", "true");
    await page.screenshot({ path: `${dir}/3-chi-tiet-moi-tao.png` });
  });

  await test.step("H1.4 Thêm nhân viên: tìm người có sẵn, chọn việc, lưu một lần", async () => {
    await page.getByRole("alert").or(page.getByRole("status")).getByRole("button", { name: "Thêm nhân viên" }).first().click();
    const dialog = page.getByRole("dialog", { name: `Thêm nhân viên vào ${name}` });
    await expect(dialog.getByRole("checkbox", { name: /Quản trị hệ thống/ })).toHaveCount(0);
    await dialog.getByRole("button", { name: "Không thấy? Mời người mới" }).click();
    await expect(dialog.getByLabel("Mật khẩu ban đầu")).toBeVisible();
    await page.screenshot({ path: `${dir}/4a-moi-nguoi-moi.png` });
    await dialog.getByRole("button", { name: "Chọn người đã có" }).click();
    await dialog.getByRole("textbox", { name: "Tìm nhân viên" }).fill(staff.email);
    await dialog.getByRole("radio").first().check();
    await dialog.getByRole("checkbox", { name: /^Bán hàng/ }).check();
    await page.screenshot({ path: `${dir}/4-them-nhan-vien.png` });
    const saved = page.waitForResponse((res) => res.request().method() === "POST" && res.url().endsWith("/company/memberships"));
    await dialog.getByRole("button", { name: "Lưu" }).click();
    expect((await saved).status()).toBe(201);
  });

  await test.step("H1.5 Nhân viên hiện trong bảng với chip vai trò", async () => {
    const row = page.getByRole("row").nth(1);
    await expect(row).toContainText("Bán hàng");
    await expect(page.getByText(`Đã tạo ${name}`)).toBeHidden();
    await page.screenshot({ path: `${dir}/5-co-nhan-vien.png` });
    await page.getByRole("tab", { name: "Thông tin" }).click();
    await page.screenshot({ path: `${dir}/6-tab-thong-tin.png` });
    await page.getByRole("tab", { name: "Nhân viên" }).click();
  });

  await test.step("H3.1 Bếp trung tâm không có menu trạng thái", async () => {
    await page.goto("/branches");
    await page.getByRole("row", { name: /Bếp trung tâm/ }).getByRole("link").click();
    await expect(page.getByRole("heading", { name: "QA Fresh" })).toBeVisible();
    await expect(page.getByText("Bếp trung tâm", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Trạng thái" })).toHaveCount(0);
    await page.screenshot({ path: `${dir}/7-bep-khong-co-menu.png` });
    await page.goto("/branches");
    await page.getByRole("link", { name, exact: true }).click();
  });

  await test.step("H3.2 Tạm ngừng: hộp xác nhận nói rõ hậu quả", async () => {
    await page.getByRole("button", { name: "Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Tạm ngừng" }).click();
    const confirm = page.getByRole("alertdialog");
    await expect(confirm).toContainText("Không nhận đơn mới. Đơn đang xử lý và nhân viên vẫn làm được.");
    await page.screenshot({ path: `${dir}/8-xac-nhan-tam-ngung.png` });
    await confirm.getByRole("button", { name: "Tạm ngừng" }).click();
    await expect(page.getByText("Chi nhánh đang tạm ngừng")).toBeVisible();
    await page.screenshot({ path: `${dir}/9-da-tam-ngung.png` });
  });

  await test.step("H3.3 Mở lại", async () => {
    await page.getByRole("button", { name: "Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Mở lại" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Mở lại" }).click();
    await expect(page.getByText("Chi nhánh đang tạm ngừng")).toBeHidden();
  });

  await test.step("H3.4 Đóng: phải gõ đúng tên chi nhánh mới bật nút Đóng", async () => {
    await page.getByRole("button", { name: "Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Đóng chi nhánh" }).click();
    const confirm = page.getByRole("alertdialog");
    const close = confirm.getByRole("button", { name: "Đóng chi nhánh" });
    await expect(confirm).toContainText("Chỉ còn xem, không mở lại được.");
    await expect(close).toBeDisabled();
    await confirm.getByLabel(/Gõ đúng tên/).fill(name.slice(0, -1));
    await expect(close).toBeDisabled();
    await page.screenshot({ path: `${dir}/10-xac-nhan-dong-chua-du.png` });
    await confirm.getByLabel(/Gõ đúng tên/).fill(name);
    await expect(close).toBeEnabled();
    await page.screenshot({ path: `${dir}/11-xac-nhan-dong-du.png` });
    await close.click();
    await expect(page.getByText("Chi nhánh đã đóng. Chỉ còn xem.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Trạng thái" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Thêm nhân viên" })).toHaveCount(0);
    await page.screenshot({ path: `${dir}/12-da-dong.png` });
  });

  await test.step("Danh sách chi nhánh sau cùng", async () => {
    await page.goto("/branches");
    await expect(page.getByRole("row", { name: new RegExp(name) })).toContainText("Đã đóng");
    await page.screenshot({ path: `${dir}/13-danh-sach-cuoi.png` });
  });
});
