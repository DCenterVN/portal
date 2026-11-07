import { writeFileSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { credentials, login } from "../account/helpers";

const admin = credentials("ADMIN");
const dir = "/home/dawn/work/ticket/.cache/e2e/branch-5d";

async function matrix(page: Page) {
  const res = await page.request.get("/api/org/company/role-matrix");
  expect(res.status()).toBe(200);
  const data = (await res.json()).data as Record<string, string[]>;
  return Object.fromEntries(Object.entries(data).sort().map(([role, keys]) => [role, [...keys].sort()]));
}

test("ADMIN chỉnh quyền vai trò Kho rồi trả về như cũ", async ({ page }) => {
  test.setTimeout(240_000);
  const before = await (async () => {
    await login(page, admin.email, admin.password, true);
    return matrix(page);
  })();
  writeFileSync(`${dir}/matrix-before.json`, JSON.stringify(before, null, 1));
  const bar = page.getByText(/\d+ thay đổi/);
  const tick = page.getByRole("checkbox", { name: "Cập nhật chất gây dị ứng của lô" });
  const warehouse = page.getByRole("radio", { name: /^Kho / });

  await test.step("Mở Vai trò & quyền, chọn vai trò Kho, gập mở nhóm, tìm phiếu nhập", async () => {
    await page.goto("/console");
    await page.getByRole("navigation", { name: "Điều hướng quản trị" }).getByRole("button", { name: "Quản trị", exact: true }).click();
    await page.getByRole("navigation", { name: "Điều hướng quản trị" }).getByRole("link", { name: "Vai trò & quyền", exact: true }).click();
    await page.waitForURL(/\/roles/);
    await expect(page.getByRole("heading", { name: "Vai trò & quyền" })).toBeVisible();
    await warehouse.click();
    await expect(page.getByRole("checkbox", { name: /^Chọn cả nhóm Kho/ })).toBeVisible();
    const group = page.getByRole("button", { name: /^Kho, \d+ trên \d+/ });
    await group.click();
    await expect(tick).toBeHidden();
    await page.screenshot({ path: `${dir}/1-gap-nhom.png` });
    await group.click();
    await page.getByRole("textbox", { name: "Tìm quyền" }).fill("phiếu nhập");
    await expect(page.getByText("Tạo phiếu nhập hàng")).toBeVisible();
    await page.screenshot({ path: `${dir}/2-tim-phieu-nhap.png` });
    await page.getByRole("textbox", { name: "Tìm quyền" }).fill("dị ứng");
  });

  await test.step("Tích một quyền, thấy thanh 1 thay đổi, bấm Huỷ", async () => {
    await tick.click();
    await expect(bar).toHaveText(/1 thay đổi/);
    await page.screenshot({ path: `${dir}/3-mot-thay-doi.png` });
    await page.getByRole("button", { name: "Huỷ", exact: true }).click();
    await expect(bar).toBeHidden();
    await expect(tick).not.toBeChecked();
  });

  await test.step("Tích lại và Lưu, rồi bỏ đúng quyền đó và Lưu lần nữa", async () => {
    await tick.click();
    await expect(bar).toHaveText(/1 thay đổi/);
    const saved = page.waitForResponse((res) => res.request().method() === "PUT" && res.url().includes("/role-matrix/roles/WAREHOUSE"));
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await saved).status()).toBe(200);
    await expect(bar).toBeHidden();
    await expect(tick).toBeChecked();
    await page.screenshot({ path: `${dir}/4-da-luu.png` });
    await tick.click();
    await expect(bar).toHaveText(/1 thay đổi/);
    const reverted = page.waitForResponse((res) => res.request().method() === "PUT" && res.url().includes("/role-matrix/roles/WAREHOUSE"));
    await page.getByRole("button", { name: "Lưu", exact: true }).click();
    expect((await reverted).status()).toBe(200);
    await expect(bar).toBeHidden();
    await expect(tick).not.toBeChecked();
  });

  await test.step("Mở tab Ai đang giữ", async () => {
    await page.getByRole("tab", { name: "Ai đang giữ" }).click();
    await expect(page.getByRole("link", { name: /Nhân viên số/ }).first()).toBeVisible();
    await page.screenshot({ path: `${dir}/5-ai-dang-giu.png` });
  });

  await test.step("Mở Nhật ký, thấy 2 dòng vừa sửa", async () => {
    await page.getByRole("navigation", { name: "Điều hướng quản trị" }).getByRole("link", { name: "Nhật ký", exact: true }).click();
    await page.waitForURL(/\/audit/);
    await expect(page.getByRole("heading", { name: "Nhật ký" })).toBeVisible();
    const rows = page.getByRole("row");
    await expect(rows.nth(1)).toBeVisible();
    await expect(rows.nth(1)).toContainText("Sửa quyền của vai trò");
    await expect(rows.nth(2)).toContainText("Sửa quyền của vai trò");
    await page.screenshot({ path: `${dir}/6-nhat-ky.png` });
  });

  const after = await matrix(page);
  writeFileSync(`${dir}/matrix-after.json`, JSON.stringify(after, null, 1));
  expect(after).toEqual(before);
});
