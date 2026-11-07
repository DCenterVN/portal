import { test, expect, type Page } from "@playwright/test";
import { credentials, login } from "../account/helpers";

const admin = credentials("ADMIN");
const dir = process.env.E2E_SHOT_DIR || "/home/dawn/work/ticket/.cache/e2e/branch-5e";
const central = "Sunny · Bếp trung tâm";
const store = "Cửa hàng Cầu Giấy";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const shown = (page: Page) => page.evaluate(() => [document.body.innerText, ...[...document.querySelectorAll("[title],[aria-label],[placeholder]")].flatMap((element) => ["title", "aria-label", "placeholder"].map((name) => element.getAttribute(name) ?? ""))].join("\n"));
const switcher = (page: Page) => page.getByRole("button", { name: /^Chi nhánh đang làm việc: .*Đổi chi nhánh$/ });

async function thirtyBranches(page: Page) {
  await page.route("**/api/auth/context", async (route) => {
    const real = await route.fetch();
    const body = await real.json();
    const first = body.contexts[0];
    const extra = Array.from({ length: 28 }, (_, index) => ({
      ...first,
      branch_id: `0192f3a4-5b6c-7d8e-9f00-${String(index + 1).padStart(12, "0")}`,
      branch_name: `Cửa hàng Mẫu ${index + 1}`,
      branch_type: "STORE",
      branch_status: index === 4 ? "SUSPENDED" : "ACTIVE",
      roles: ["SALES"],
    }));
    await route.fulfill({ response: real, json: { ...body, contexts: [...body.contexts, ...extra] } });
  });
}

test("ADMIN có 2 chi nhánh: chọn bằng tên, đổi lại, lọc và phân công bằng cách gõ tên", async ({ page }) => {
  test.setTimeout(300_000);
  await login(page, admin.email, admin.password, true);

  await test.step("H1 Đăng nhập xong vào console ở bếp trung tâm; trang Tài khoản có nút Đổi chi nhánh", async () => {
    await page.goto("/console");
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(central));
    await page.goto("/platform/account");
    await expect(page.getByRole("link", { name: "Đổi công ty" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Đổi chi nhánh", exact: true })).toBeVisible();
    await page.screenshot({ path: `${dir}/1-tai-khoan.png` });
  });

  await test.step("H2 Màn chọn chi nhánh: thấy tên, loại, vai trò; không thấy mã; không có ô tìm vì chỉ 2 mục", async () => {
    await page.getByRole("link", { name: "Đổi chi nhánh", exact: true }).click();
    await page.waitForURL(/\/staff\/switch-branch$/);
    await expect(page.getByRole("heading", { name: "Chọn chi nhánh" })).toBeVisible();
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", { name: new RegExp(central) })).toContainText("Đang hoạt động");
    await expect(page.getByRole("option", { name: new RegExp(store) })).toContainText("Đang hoạt động");
    await expect(page.getByRole("combobox")).toHaveCount(0);
    expect(await shown(page)).not.toMatch(UUID);
    await page.screenshot({ path: `${dir}/2-chon-chi-nhanh.png` });
  });

  await test.step("H3 Chọn Cầu Giấy: vào console ở Cầu Giấy", async () => {
    const switched = page.waitForResponse((res) => new URL(res.url()).pathname === "/api/auth/web/switch-branch" && res.request().method() === "POST");
    await page.getByRole("option", { name: new RegExp(store) }).click();
    expect((await switched).status()).toBe(200);
    await page.waitForURL(/\/console$/);
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(store));
    await page.screenshot({ path: `${dir}/3-o-cau-giay.png` });
  });

  await test.step("H4 Đổi về bếp trung tâm bằng bộ đổi ở sidebar", async () => {
    await switcher(page).click();
    await expect(page.getByRole("menuitem")).toHaveCount(2);
    const switched = page.waitForResponse((res) => new URL(res.url()).pathname === "/api/auth/web/switch-branch" && res.request().method() === "POST");
    await page.getByRole("menuitem", { name: central }).click();
    expect((await switched).status()).toBe(200);
    await expect(switcher(page)).toHaveAccessibleName(new RegExp(central));
    await page.screenshot({ path: `${dir}/4-ve-bep.png` });
  });

  await test.step("H5 Màn Nhân viên: lọc theo chi nhánh bằng cách gõ tên", async () => {
    await page.goto("/memberships");
    const filter = page.getByRole("combobox", { name: "Lọc theo chi nhánh" });
    await expect(filter).toHaveText("Tất cả chi nhánh");
    await filter.click();
    await page.getByPlaceholder("Gõ tên chi nhánh").fill("cau gi");
    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(page.getByRole("option")).toContainText(store);
    expect(await page.getByRole("listbox").innerText()).not.toMatch(UUID);
    await page.screenshot({ path: `${dir}/5-loc-go-ten.png` });
    await page.getByRole("option", { name: new RegExp(store) }).click();
    await expect(filter).toContainText(store);
    await page.screenshot({ path: `${dir}/6-da-loc.png` });
    await filter.click();
    await page.getByRole("option", { name: new RegExp(store) }).click();
    await expect(filter).toHaveText("Tất cả chi nhánh");
  });

  await test.step("H6 Sheet Phân công: ô chọn chi nhánh gõ tên, không chọn thật", async () => {
    await page.getByRole("row").nth(1).click();
    const sheet = page.getByRole("dialog", { name: /^Phân công:/ });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: "Thêm chi nhánh" }).click();
    await sheet.getByRole("combobox", { name: "Chi nhánh" }).click();
    await page.getByPlaceholder("Gõ tên chi nhánh").fill("cau");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.screenshot({ path: `${dir}/7-sheet-go-ten.png` });
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
  });

  await test.step("H7 Giả lập 30 chi nhánh (chỉ trong test): màn chọn có ô tìm, gõ ra đúng mục", async () => {
    await thirtyBranches(page);
    await page.goto("/staff/switch-branch");
    await expect(page.getByRole("option")).toHaveCount(30);
    const search = page.getByRole("combobox", { name: "Tìm chi nhánh" });
    await expect(search).toBeVisible();
    await page.screenshot({ path: `${dir}/8-30-chi-nhanh.png` });
    await search.fill("mau 7");
    await expect(page.getByRole("option")).toHaveCount(1);
    await expect(page.getByRole("option")).toContainText("Cửa hàng Mẫu 7");
    await page.screenshot({ path: `${dir}/9-30-go-ten.png` });
    await search.fill("");
    await page.screenshot({ path: `${dir}/10-30-cuon.png` });
  });

  await test.step("H8 Giả lập 30 chi nhánh: bộ đổi ở sidebar thành ô tìm", async () => {
    await page.goto("/console");
    await switcher(page).click();
    await expect(page.getByRole("option")).toHaveCount(30);
    const search = page.getByRole("combobox", { name: "Tìm chi nhánh" });
    await expect(search).toBeVisible();
    await page.screenshot({ path: `${dir}/11-sidebar-30.png` });
    await search.fill("mau 12");
    await expect(page.getByRole("option")).toHaveCount(1);
    await page.screenshot({ path: `${dir}/12-sidebar-30-go-ten.png` });
    await page.keyboard.press("Escape");
  });
});
