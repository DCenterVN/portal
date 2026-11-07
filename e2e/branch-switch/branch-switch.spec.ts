import { test, expect, type Page } from "@playwright/test";
import { credentials, login } from "../account/helpers";

const admin = credentials("ADMIN");
const dir = "/home/dawn/work/ticket/.cache/e2e/branch-5a";
const central = "QA Fresh · Bếp trung tâm";
const store = "Cửa hàng Cầu Giấy";
const switcher = (page: Page) => page.getByRole("button", { name: /^Chi nhánh đang làm việc: .*Đổi chi nhánh$/ });
const bar = (page: Page) => page.getByText("Chi nhánh đang tạm ngừng: chỉ xử lý đơn đang có");

async function pick(page: Page, label: string) {
  await switcher(page).click();
  const switched = page.waitForResponse((res) => new URL(res.url()).pathname === "/api/auth/web/switch-branch" && res.request().method() === "POST");
  await page.getByRole("menuitem", { name: label }).click();
  const reply = await switched;
  expect(reply.status()).toBe(200);
}

test("ADMIN đổi chi nhánh làm việc rồi trả về bếp trung tâm", async ({ page }) => {
  test.setTimeout(300_000);
  await login(page, admin.email, admin.password, true);

  await test.step("H5.1 Đầu sidebar hiện chi nhánh đang làm việc và loại", async () => {
    await page.goto("/console");
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(central));
    await expect(page.locator("[data-slot=sidebar-header]")).toContainText("Bếp trung tâm");
    await expect(page.getByRole("main")).toContainText(central);
    await expect(page.getByRole("main")).not.toContainText("auth:self");
    await expect(page.getByRole("main").getByText("Xem tài khoản của mình")).toBeVisible();
    await page.screenshot({ path: `${dir}/1-dau-sidebar.png` });
  });

  await test.step("H5.2 Lỗi 403 và 503 báo tiếng Việt, giữ chi nhánh cũ", async () => {
    for (const [status, error, text] of [[403, "FORBIDDEN", "Bạn không còn được vào chi nhánh này"], [503, "UNAVAILABLE", "Hệ thống tạm lỗi, thử lại sau"]] as const) {
      await page.route("**/api/auth/web/switch-branch", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify({ error }) }));
      await switcher(page).click();
      await page.getByRole("menuitem", { name: store }).click();
      await expect(page.getByText(text)).toBeVisible();
      await expect(switcher(page)).toHaveAccessibleName(new RegExp(central));
      await page.screenshot({ path: `${dir}/2-loi-${status}.png` });
      await page.unroute("**/api/auth/web/switch-branch");
    }
  });

  await test.step("H5.3 Mở bộ chọn: 2 chi nhánh, chi nhánh đang chọn có dấu tích; chọn Cầu Giấy", async () => {
    await switcher(page).click();
    await expect(page.getByRole("menuitem")).toHaveCount(2);
    await expect(page.getByRole("menuitem", { name: central })).toHaveAttribute("aria-current", "true");
    await page.screenshot({ path: `${dir}/3-bo-chon.png` });
    await page.keyboard.press("Escape");
    await pick(page, store);
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(store));
    await expect(page.locator("[data-slot=sidebar-header]")).toContainText("Cửa hàng");
    await expect(page).toHaveURL(/\/console$/);
    await page.screenshot({ path: `${dir}/4-da-doi.png` });
  });

  await test.step("H5.4 Tải lại cả trình duyệt: vẫn ở Cầu Giấy", async () => {
    await page.reload();
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(store));
    await page.screenshot({ path: `${dir}/5-tai-lai.png` });
  });

  await test.step("H5.5 Tạm ngừng Cầu Giấy: thanh báo hiện; mở lại: thanh báo mất", async () => {
    await page.goto("/branches");
    await page.getByRole("link", { name: store, exact: true }).click();
    await expect(page.getByRole("heading", { name: store })).toBeVisible();
    await expect(bar(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Tạm ngừng" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Tạm ngừng" }).click();
    await expect(bar(page)).toBeVisible();
    await expect(page.locator("[data-slot=sidebar-header]")).toContainText("Tạm ngừng");
    await expect(page.getByText("Chi nhánh đang tạm ngừng: không nhận đơn mới")).toHaveCount(0);
    await page.screenshot({ path: `${dir}/6-thanh-bao.png` });
    await switcher(page).click();
    await expect(page.getByRole("menuitem", { name: new RegExp(`${store}.*Tạm ngừng`) })).toBeVisible();
    await page.screenshot({ path: `${dir}/7-nhan-tam-ngung.png` });
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Trạng thái" }).click();
    await page.getByRole("menuitem", { name: "Mở lại" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Mở lại" }).click();
    await expect(bar(page)).toHaveCount(0);
    await page.screenshot({ path: `${dir}/8-het-thanh-bao.png` });
  });

  await test.step("H5.6 Đổi về bếp trung tâm", async () => {
    await pick(page, central);
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(central));
    await page.screenshot({ path: `${dir}/9-ve-bep.png` });
  });

  await test.step("Sửa sau lô 5c: chip bếp trung tâm ghi loại; Sheet hiện sẵn mô tả vai trò", async () => {
    await page.goto("/memberships");
    await expect(page.getByRole("row").nth(1)).toContainText("Bếp trung tâm");
    await expect(page.getByRole("row").nth(1).getByText(/QA Fresh · Bếp trung tâm/).first()).toBeVisible();
    await page.screenshot({ path: `${dir}/10-chip.png` });
    await page.getByRole("row").nth(1).click();
    const sheet = page.getByRole("dialog", { name: /^Phân công:/ });
    await expect(sheet.getByText("Nhận hàng, kiểm định đầu vào, xếp kệ, kiểm tồn").first()).toBeVisible();
    await page.screenshot({ path: `${dir}/11-sheet-mo-ta.png` });
  });
});
