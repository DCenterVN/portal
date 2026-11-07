import { writeFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { branchPage, mockBranches, mockMaterials, materialPage, mockStock, stockPage } from "../../mocks/stock-transfer";
import { branchStock, dir, fits, hideDevBadge, loginAs, loginDirect, loginToChooser, openTransfers, photo, shown, UUID } from "./helpers";

const X = "01a15f28-7da7-7f25-9e33-1ef14be113ed";
const NAME_X = /Má đào lợn bản/;
const created: Record<string, string> = {};
const clean = async (page: Page) => expect(await shown(page)).not.toMatch(UUID);
const shot = (page: Page, name: string) => page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
const pick = async (page: Page, label: string, option: RegExp | string) => {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option }).click();
};

test.beforeEach(async ({ page }) => { await hideDevBadge(page); });

test("Chuyển hàng: bếp gửi 0,25 kg, Cầu Giấy đăng nhập thẳng và nhận, quản trị chọn chi nhánh, bán hàng bị chặn", async ({ page }) => {
  test.setTimeout(900_000);
  let kitchenBefore: Record<string, number> = {};
  let storeBefore: Record<string, number> = {};
  let transferUrl = "";
  let code = "";

  await test.step("1. Kho bếp đăng nhập, mở Kho, thấy Chuyển hàng", async () => {
    await loginAs(page, "WAREHOUSE");
    await openTransfers(page);
    await expect(page.getByRole("tab", { name: /Đang đến/ })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Đã gửi/ })).toBeVisible();
    await page.getByRole("tab", { name: /Đã gửi/ }).click();
    await expect(page.getByRole("row", { name: /CK-\d{6}-\d{4}.*Sunny → Cửa hàng Cầu Giấy/ }).first()).toBeVisible();
    await clean(page);
    await shot(page, "1-bep-danh-sach-da-gui");
  });

  await test.step("2. Gửi 0,25 kg sang Cầu Giấy: vượt tồn báo ngay dòng sai, lỗi server gắn đúng dòng, rồi gửi thật và thấy mã CK", async () => {
    kitchenBefore = await branchStock(page);
    await page.getByRole("link", { name: "Gửi hàng" }).click();
    await expect(page.getByRole("heading", { name: "Gửi hàng sang chi nhánh khác" })).toBeVisible();
    await expect(page.getByRole("combobox", { name: "Chi nhánh nhận" })).toContainText("Cửa hàng Cầu Giấy");
    await pick(page, "Nguyên liệu dòng 1", NAME_X);
    await expect(page.getByRole("combobox", { name: "Lô dòng 1" })).toContainText("Tự chọn lô hết hạn trước");
    const quantity = page.getByRole("textbox", { name: "Số lượng dòng 1" });
    await quantity.fill("99");
    await quantity.blur();
    await expect(page.getByText(/Chỉ còn khả dụng .* kg\. Giảm số lượng\./)).toBeVisible();
    await shot(page, "2-gui-vuot-ton");
    await quantity.fill("0,25");
    await page.getByRole("combobox", { name: "Lô dòng 1" }).click();
    await expect(page.getByRole("option", { name: /Tự chọn lô hết hạn trước/ })).toBeVisible();
    await shot(page, "3-gui-chon-lo");
    await page.getByRole("option", { name: /LO-/ }).first().click();
    await expect(page.getByRole("combobox", { name: "Lô dòng 1" })).toContainText("LO-");
    await clean(page);
    await shot(page, "4-gui-0-25-kg");

    await page.route("**/api/inventory/stock-transfers", async route => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({ status: 409, json: { code: 409, status: "error", message: `không đủ tồn để chuyển SKU ${X}`, errors: { error_code: "insufficient_stock" }, retryable: false } });
    }, { times: 1 });
    await page.getByRole("button", { name: "Gửi hàng" }).click();
    await expect(page.getByText(/Không đủ tồn để gửi: chỉ còn .* kg/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Số lượng dòng 1" })).toHaveValue("0,25");
    await clean(page);
    await shot(page, "5-gui-loi-het-hang-tren-dong");

    await page.getByRole("button", { name: "Gửi hàng" }).click();
    await page.waitForURL(/\/inventory\/stock-transfers\/[0-9a-f-]{36}$/);
    transferUrl = new URL(page.url()).pathname;
    created.transferReceived = transferUrl.split("/").pop() ?? "";
    const heading = page.getByRole("heading", { name: /^Phiếu chuyển hàng CK-\d{6}-\d{4}$/ });
    await expect(heading).toBeVisible();
    code = (await heading.innerText()).replace("Phiếu chuyển hàng ", "").trim();
    created.code = code;
    await expect(page.getByText("Đang chuyển", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Nhận hàng" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Huỷ phiếu" })).toBeVisible();
    await expect(page.getByText("Bạn đang ở chi nhánh gửi.")).toBeVisible();
    await clean(page);
    await shot(page, "6-phieu-dang-chuyen-co-ma-ck");
    expect(kitchenBefore[X] - (await branchStock(page))[X]).toBe(250);
  });

  await test.step("3. Kho Cầu Giấy đăng nhập vào thẳng Cầu Giấy, mở phiếu: mã phiếu, Sunny gửi, mã lô, hạn dùng, nhận hàng", async () => {
    await loginDirect(page, "WAREHOUSE_CAUGIAY");
    storeBefore = await branchStock(page);
    await shot(page, "7-cau-giay-vao-thang-console");
    await openTransfers(page);
    await expect(page.getByRole("tab", { name: /Đang đến/ })).toHaveAttribute("data-state", "active");
    await page.getByRole("combobox", { name: "Trạng thái" }).selectOption({ label: "Đang chuyển" });
    await expect(page.getByRole("button", { name: /Bỏ lọc trạng thái/ })).toBeVisible();
    const row = page.getByRole("row", { name: new RegExp(code) });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText("Sunny");
    await clean(page);
    await shot(page, "8-cua-hang-dang-den");
    await row.getByRole("link").click();
    await expect(page.getByRole("heading", { name: `Phiếu chuyển hàng ${code}` })).toBeVisible();
    await expect(page.locator("dt", { hasText: "Người gửi" }).locator("xpath=following-sibling::dd")).toContainText("Sunny");
    await expect(page.getByText(/LO-/).first()).toBeVisible();
    await expect(page.getByText(/Hạn dùng \d{2}\/\d{2}\/\d{4}/).first()).toBeVisible();
    await clean(page);
    await shot(page, "9-phieu-co-ma-lo-han-dung");
    await page.getByRole("link", { name: "Nhận hàng" }).click();
    await expect(page.getByRole("heading", { name: `Nhận hàng · ${code}` })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Số nhận dòng 1" })).toHaveValue("0,25");
    await shot(page, "10-nhan-dien-san-so-gui");
    const received = page.getByRole("textbox", { name: "Số nhận dòng 1" });
    await received.fill("0,2");
    await received.blur();
    await expect(page.getByRole("combobox", { name: "Lý do lệch dòng 1" })).toBeVisible();
    await expect(page.getByRole("cell", { name: /^0,05 kg$/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xác nhận đã nhận" })).toBeDisabled();
    await expect(page.getByText("Thêm ít nhất 1 ảnh vì có dòng nhận thiếu.")).toBeVisible();
    await shot(page, "11-nhan-thieu-can-ly-do-va-anh");
    await pick(page, "Lý do lệch dòng 1", "Thiếu hàng");
    await page.locator("#receive-photos").setInputFiles({ name: "hang-nhan.png", mimeType: "image/png", buffer: photo(200, 90, 60) });
    await expect(page.getByRole("img", { name: "Ảnh nhận hàng 1" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Xác nhận đã nhận" })).toBeEnabled();
    await clean(page);
    await shot(page, "12-nhan-day-du");
    await page.getByRole("button", { name: "Xác nhận đã nhận" }).click();
    await page.waitForURL(url => url.pathname === transferUrl);
    await expect(page.getByText("Đã nhận", { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("img", { name: "Ảnh bằng chứng 1" })).toBeVisible();
    await expect(page.getByText("Thiếu hàng", { exact: true })).toBeVisible();
    await expect(page.getByRole("list", { name: "Lịch sử trạng thái" })).toContainText("Nhận hàng");
    await clean(page);
    await shot(page, "13-phieu-da-nhan");
    expect((await branchStock(page))[X] - (storeBefore[X] ?? 0)).toBe(200);
  });

  await test.step("4. Quản trị đăng nhập: thấy màn chọn chi nhánh", async () => {
    await loginToChooser(page, "ADMIN");
    await expect(page.getByRole("option")).toHaveCount(2);
    await expect(page.getByRole("option", { name: /Bếp trung tâm/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /Cửa hàng Cầu Giấy/ })).toBeVisible();
    await clean(page);
    await shot(page, "14-quan-tri-man-chon-chi-nhanh");
  });

  await test.step("5. Bán hàng Cầu Giấy: không thấy menu Chuyển hàng, vào thẳng bị chặn", async () => {
    await loginAs(page, "SALES_CAUGIAY");
    await expect(page.getByRole("link", { name: "Chuyển hàng", exact: true })).toHaveCount(0);
    await shot(page, "15-ban-hang-khong-co-menu");
    await page.goto("/inventory/stock-transfers");
    await expect(page.getByText("Không có quyền truy cập")).toBeVisible();
    await shot(page, "16-ban-hang-vao-thang-bi-chan");
  });

  writeFileSync(`${dir}/du-lieu-thu.json`, JSON.stringify(created, null, 2));
});

test("Ô chọn chi nhánh nhận và ô chọn món: 1, 2 và 30 mục (dữ liệu giả trong mocks/, không ghi lên dev)", async ({ page }) => {
  test.setTimeout(600_000);
  await loginAs(page, "WAREHOUSE");
  const branch: string = (await (await page.request.get("/api/auth/context")).json()).active_context.branch_id;
  const realBranches = await (await page.request.get("/api/org/company/branches?page=1&limit=100")).json();
  const kitchen = (realBranches.data.items as Array<{ type: string }>).filter(item => item.type === "CENTRAL_KITCHEN");

  for (const [count, file] of [[1, "17"], [2, "18"], [30, "19"]] as const) {
    await test.step(`Ô chọn chi nhánh nhận với ${count} chi nhánh`, async () => {
      await page.unroute("**/api/org/company/branches*").catch(() => undefined);
      await page.route("**/api/org/company/branches*", route => route.fulfill({ json: branchPage(mockBranches(count), kitchen) }));
      await page.goto("/inventory/stock-transfers/new");
      const target = page.getByRole("combobox", { name: "Chi nhánh nhận" });
      if (count === 1) await expect(target).toContainText("Cửa hàng Mẫu 1");
      else await expect(target).toContainText("Chọn chi nhánh nhận");
      await target.click();
      await expect(page.getByPlaceholder("Gõ tên chi nhánh")).toBeVisible();
      expect(await page.getByRole("option").count()).toBe(Math.min(count, 20));
      await shot(page, `${file}-chi-nhanh-nhan-${count}`);
      if (count === 30) {
        await page.getByPlaceholder("Gõ tên chi nhánh").fill("mau 7");
        await expect(page.getByRole("option")).toHaveCount(1);
        await expect(page.getByRole("option")).toContainText("Mẫu 7");
        await shot(page, "19-chi-nhanh-nhan-30-go-ten");
      }
      await page.keyboard.press("Escape");
      expect(await fits(page)).toBe(true);
      await clean(page);
    });
  }

  for (const [count, file] of [[1, "20"], [2, "21"], [30, "22"]] as const) {
    await test.step(`Ô chọn món với ${count} nguyên liệu có tồn`, async () => {
      await page.unroute("**/api/inventory/stock-levels*").catch(() => undefined);
      await page.unroute("**/api/sales/skus*").catch(() => undefined);
      await page.route("**/api/inventory/stock-levels*", route => route.fulfill({ json: stockPage(mockStock(count, branch)) }));
      await page.route("**/api/sales/skus*", route => route.fulfill({ json: materialPage(mockMaterials(30)) }));
      await page.goto("/inventory/stock-transfers/new");
      const material = page.getByRole("combobox", { name: "Nguyên liệu dòng 1" });
      if (count === 1) await expect(material).toContainText("Nguyên liệu mẫu 1");
      else await expect(material).toContainText("Chọn nguyên liệu");
      await material.click();
      await expect(page.getByPlaceholder("Gõ tên nguyên liệu")).toBeVisible();
      expect(await page.getByRole("option").count()).toBe(Math.min(count, 20));
      await shot(page, `${file}-mon-${count}`);
      if (count === 30) {
        await page.getByPlaceholder("Gõ tên nguyên liệu").fill("mau 23");
        await expect(page.getByRole("option")).toHaveCount(1);
        await expect(page.getByRole("option")).toContainText("Nguyên liệu mẫu 23");
        await shot(page, "22-mon-30-go-ten");
      }
      await page.keyboard.press("Escape");
      expect(await fits(page)).toBe(true);
      await clean(page);
    });
  }
});
