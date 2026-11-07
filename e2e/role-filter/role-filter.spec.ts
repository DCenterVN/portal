import { test, expect, type Page } from "@playwright/test";
import { credentials, enterFirstBranch, login } from "../account/helpers";
import { oneRole, roleEnvelope, thirtyRoles, twoRoles } from "../../mocks/role-catalog";

const admin = credentials("ADMIN");
const dir = "/home/dawn/work/ticket/.cache/e2e/branch-5f";
const store = "Cửa hàng Cầu Giấy";
const centralLabel = "Sunny · Bếp trung tâm";
const storeLabel = `Sunny · ${store}`;
const central = "Bếp trung tâm";
const kitchenPerson = "kho@sunny.test";
const storePerson = "banhang.caugiay@sunny.test";
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const sheet = (page: Page) => page.getByRole("dialog", { name: /^Phân công:/ });
const roleButtons = (page: Page, branch: string) => sheet(page).getByRole("group", { name: new RegExp(`^Vai trò ở .*${branch}`) }).getByRole("button");
const fits = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
const shown = (page: Page) => page.evaluate(() => document.body.innerText);

async function openPerson(page: Page, email: string) {
  await page.goto("/memberships");
  await page.getByRole("textbox", { name: "Tìm nhân viên" }).fill(email);
  await expect(page.getByRole("row")).toHaveCount(2);
  await page.getByRole("row").nth(1).click();
  await expect(sheet(page)).toBeVisible();
}

async function addBranch(page: Page, branch: string) {
  await sheet(page).getByRole("button", { name: "Thêm chi nhánh" }).click();
  await sheet(page).getByRole("combobox", { name: "Chi nhánh" }).click();
  await page.getByRole("option", { name: new RegExp(branch) }).click();
}

async function withCatalog(page: Page, items: readonly unknown[]) {
  await page.unroute("**/api/org/company/roles").catch(() => undefined);
  await page.route("**/api/org/company/roles", (route) => route.fulfill({ json: roleEnvelope(items) }));
}

test("ADMIN gán vai: chỉ thấy vai hợp với loại chi nhánh; /console và bộ chọn đọc được", async ({ page }) => {
  test.setTimeout(420_000);
  await login(page, admin.email, admin.password, true);
  await page.goto("/console");
  await enterFirstBranch(page);

  await test.step("H1 Gán một người ở bếp sang Cửa hàng Cầu Giấy: chỉ thấy Bán hàng và Kho", async () => {
    await openPerson(page, kitchenPerson);
    await addBranch(page, store);
    await expect(roleButtons(page, store)).toHaveText(["Bán hàng", "Kho"]);
    expect(await shown(page)).not.toMatch(UUID);
    await page.screenshot({ path: `${dir}/1-cau-giay-2-vai.png` });
  });

  await test.step("H2 Org trả 400 thì hiện câu tiếng Việt cạnh ô vai, không hiện mã lỗi", async () => {
    await page.route("**/api/org/company/memberships", (route) =>
      route.request().method() === "POST" ? route.fulfill({ status: 400, json: { error: "VALIDATION_ERROR", message: "role not allowed" } }) : route.continue());
    await roleButtons(page, store).filter({ hasText: "Kho" }).click();
    await sheet(page).getByRole("button", { name: "Lưu", exact: true }).click();
    const alert = sheet(page).getByRole("alert");
    await expect(alert).toHaveText(/Có vai trò không dùng được ở loại chi nhánh này/);
    await expect(alert).not.toContainText(/VALIDATION_ERROR|role not allowed/);
    await page.screenshot({ path: `${dir}/2-loi-400.png` });
    await page.unroute("**/api/org/company/memberships");
    await page.keyboard.press("Escape");
  });

  await test.step("H3 Gán một người ở cửa hàng sang Bếp trung tâm: thấy đủ vai", async () => {
    await openPerson(page, storePerson);
    await addBranch(page, central);
    await expect(roleButtons(page, central)).toHaveText(["Quản trị hệ thống", "Dinh dưỡng", "Chế biến", "Bán hàng", "Kho"]);
    await page.screenshot({ path: `${dir}/3-bep-du-vai.png` });
    await page.keyboard.press("Escape");
  });

  await test.step("H4 Thêm nhân viên: đổi chi nhánh thì vai đổi theo, vai không hợp bị bỏ chọn", async () => {
    await page.goto("/memberships");
    await page.getByRole("button", { name: "Thêm nhân viên" }).click();
    const dialog = page.getByRole("dialog", { name: /^Thêm nhân viên vào/ });
    const roles = dialog.getByRole("group", { name: "Chọn vai trò" }).getByRole("button");
    await expect(dialog.getByRole("combobox", { name: "Chi nhánh" })).toContainText(central);
    await expect(roles).toHaveText(["Dinh dưỡng", "Chế biến", "Bán hàng", "Kho"]);
    await roles.filter({ hasText: "Dinh dưỡng" }).click();
    await roles.filter({ hasText: "Kho" }).click();
    await page.screenshot({ path: `${dir}/4-them-nhan-vien-bep.png` });
    await dialog.getByRole("combobox", { name: "Chi nhánh" }).click();
    await page.getByRole("option", { name: new RegExp(store) }).click();
    await expect(roles).toHaveText(["Bán hàng", "Kho"]);
    await expect(roles.filter({ hasText: "Kho" })).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.getByRole("button", { name: "Dinh dưỡng" })).toHaveCount(0);
    await page.screenshot({ path: `${dir}/5-them-nhan-vien-cua-hang.png` });
    await dialog.getByRole("button", { name: "Huỷ" }).click();
  });

  for (const [title, items, count, file] of [["1 vai", oneRole, 1, "6-1-vai"], ["2 vai", twoRoles, 2, "7-2-vai"], ["30 vai", thirtyRoles, 30, "8-30-vai"]] as const) {
    await test.step(`H5 Ô chọn vai với ${title} (dữ liệu giả trong mocks/, không ghi lên dev)`, async () => {
      await withCatalog(page, items);
      await openPerson(page, kitchenPerson);
      await addBranch(page, store);
      await expect(roleButtons(page, store)).toHaveCount(count);
      expect(await fits(page)).toBe(true);
      if (count < 8) await expect(sheet(page).getByRole("textbox", { name: "Tìm vai trò" })).toHaveCount(0);
      await page.screenshot({ path: `${dir}/${file}.png` });
      if (count === 30) {
        const search = sheet(page).getByRole("textbox", { name: "Tìm vai trò" }).last();
        await expect(search).toBeVisible();
        await search.fill("mau 7");
        await expect(roleButtons(page, store)).toHaveText(["Vai trò mẫu 7"]);
        await page.screenshot({ path: `${dir}/9-30-vai-go-ten.png` });
        await search.fill("");
        await roleButtons(page, store).last().scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${dir}/10-30-vai-cuon.png` });
      }
      await page.keyboard.press("Escape");
    });
  }
  await page.unroute("**/api/org/company/roles");

  await test.step("H6 /console bằng ADMIN: tên vai tiếng Việt, không mã thô, không câu kỹ thuật, không UUID", async () => {
    await page.goto("/console");
    await expect(page.getByRole("heading", { name: "Console vận hành" })).toBeVisible();
    await expect(page.getByText("Quản trị hệ thống").first()).toBeVisible();
    const text = await shown(page);
    expect(text).not.toMatch(/\bADMIN\b|action key|Backend|backend|phân giải|\b[a-z_]+:[a-z_]+:[a-z_]+\b/);
    expect(text).not.toMatch(UUID);
    await page.screenshot({ path: `${dir}/11-console.png`, fullPage: true });
  });

  await test.step("H7 Bộ chọn chi nhánh: dòng phụ hiện đủ chữ, không bị cắt", async () => {
    await page.goto("/staff/switch-branch");
    await expect(page.getByRole("option")).toHaveCount(2);
    const meta = page.getByRole("option").first().locator("span.text-xs");
    await expect(meta).toContainText("Quản trị hệ thống");
    const clipped = await page.getByRole("option").evaluateAll((options) => options.some((option) => [...option.querySelectorAll<HTMLElement>("span")].some((span) => span.scrollWidth > span.clientWidth || getComputedStyle(span).textOverflow === "ellipsis")));
    expect(clipped).toBe(false);
    await page.screenshot({ path: `${dir}/12-chon-chi-nhanh-du-chu.png` });
  });

  await test.step("H8 Nhãn chi nhánh một kiểu: MAIN là Sunny · Bếp trung tâm, cửa hàng là Sunny · tên cửa hàng, không bao giờ Sunny · Sunny", async () => {
    await page.goto("/staff/switch-branch");
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", { name: new RegExp(`^${centralLabel}`) })).toHaveText(/MAIN · Đang hoạt động/);
    await expect(page.getByRole("option", { name: new RegExp(`^${storeLabel}`) })).toHaveText(/CAU-GIAY · Đang hoạt động/);
    expect(await shown(page)).not.toContain("Sunny · Sunny");
    for (const option of await page.getByRole("option").all()) expect(await option.locator("span.text-xs").innerText()).not.toMatch(/Bếp trung tâm|Cửa hàng/);
    await page.screenshot({ path: `${dir}/13-nhan-man-chon.png` });
    await page.getByRole("option", { name: new RegExp(`^${centralLabel}`) }).click();
    await page.waitForURL(/\/(console|platform)/);
    await page.goto("/console");
    const switcher = page.getByRole("button", { name: new RegExp(`^Chi nhánh đang làm việc: ${centralLabel}`) });
    await expect(switcher).toBeVisible();
    await expect(page.getByText(storeLabel).first()).toBeVisible();
    expect(await shown(page)).not.toContain("Sunny · Sunny");
    await page.screenshot({ path: `${dir}/14-nhan-console-sidebar.png`, fullPage: true });
    await switcher.click();
    await expect(page.getByRole("menuitem", { name: centralLabel })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: storeLabel })).toBeVisible();
    await page.screenshot({ path: `${dir}/15-nhan-bo-doi-sidebar.png` });
    await page.keyboard.press("Escape");
    await page.goto("/memberships");
    await page.getByRole("combobox", { name: "Lọc theo chi nhánh" }).click();
    await expect(page.getByRole("option", { name: new RegExp(`^${storeLabel}`) })).toContainText("CAU-GIAY");
    await page.screenshot({ path: `${dir}/16-nhan-loc-nhan-vien.png` });
  });
});
