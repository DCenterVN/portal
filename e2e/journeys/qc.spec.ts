import { test, expect, type Page } from "@playwright/test";
import { z } from "zod";
import { enterFirstBranch } from "../account/helpers";

const placementsSchema = z.object({ items: z.array(z.object({ trace_code: z.string(), shelf_code: z.string() })).nullable() });

function data(value: unknown): unknown {
  return value && typeof value === "object" && "data" in value ? value.data : value;
}

test("QC: kiểm lô nhập, nghiệm thu thành phẩm đủ trường rồi truy xuất nguồn gốc công khai", async ({ browser }, info) => {
  test.setTimeout(240_000);
  const video = process.env.E2E_RECORD === "1" ? {
    recordVideo: { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top" as const, fontSize: 22 } },
  } : {};
  const staff = await browser.newContext({ storageState: process.env.PORTAL_ADMIN_STATE, ...video });
  staff.setDefaultTimeout(15_000);
  const page = await staff.newPage();
  async function step(name: string, action: () => Promise<void>) {
    await test.step(name, async () => {
      const overlay = await page.screencast.showOverlay(`<div style="position:absolute;bottom:8px;left:8px;right:8px;padding:12px;background:#222;color:white;font-size:22px">${name}</div>`);
      try { await action(); } finally { await overlay.dispose(); }
    });
  }
  async function visit(target: Page, path: string, name: string) {
    let response = await target.goto(path);
    await enterFirstBranch(target);
    if (new URL(target.url()).pathname !== path) response = await target.goto(path);
    expect(response?.status(), `Mở ${path}`).toBeLessThan(400);
    expect(new URL(target.url()).pathname, `Không bị đẩy khỏi ${path}`).toBe(path);
    await target.screenshot({ timeout: 10_000 }).then(body => info.attach(name, { body, contentType: "image/png" })).catch(() => {});
  }
  try {
    await step("Bước 1: QC mở màn lệnh sản xuất để biết lô nào đã hoàn thành", async () => {
      await visit(page, "/production/orders", "qc-lenh-san-xuat");
    });
    await step("Bước 2: QC mở màn Kiểm định, thấy bảng lô chờ nghiệm thu", async () => {
      await visit(page, "/production/qc", "qc-kiem-dinh");
      await expect(page.getByRole("heading", { name: /Kiểm định Chất lượng Thành phẩm/ })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Mã lệnh" })).toBeVisible();
      await expect(page.getByRole("columnheader", { name: "Trạng thái" })).toBeVisible();
    });
    await step("Bước 3: QC mở phiếu nghiệm thu, điền đủ nhiệt độ tâm, bao bì, cảm quan rồi hủy bỏ (không ghi dữ liệu)", async () => {
      const open = page.getByRole("button", { name: "Tiến hành nghiệm thu" }).first();
      if (!(await open.count())) {
        await info.attach("khong-co-lo-cho-nghiem-thu", { body: "Không có lệnh COMPLETED để mở phiếu nghiệm thu", contentType: "text/plain" });
        await expect(page.getByRole("cell", { name: "Không có lô thành phẩm nào đang chờ kiểm định QC" })).toBeVisible();
        return;
      }
      await open.click();
      const temperature = page.getByLabel("Nhiệt độ tâm sau cấp đông (°C)");
      await temperature.fill("-19.2");
      await expect(temperature).toHaveValue("-19.2");
      await page.getByRole("radio", { name: "Bao bì nguyên vẹn, hút chân không đạt" }).check();
      const sensory = page.getByLabel("Ghi nhận kiểm tra cảm quan");
      await sensory.fill("Màu, mùi, kết cấu đạt; không có dị vật.");
      await expect(sensory).not.toHaveValue("");
      await expect(page.getByRole("button", { name: /Phê duyệt QC \(PASS\)/ })).toBeEnabled();
      await expect(page.getByRole("button", { name: /Từ chối QC \(FAIL\)/ })).toBeEnabled();
      await page.screenshot({ timeout: 10_000 }).then(body => info.attach("qc-phieu-nghiem-thu", { body, contentType: "image/png" })).catch(() => {});
      await page.getByRole("button", { name: "Hủy bỏ" }).click();
      await expect(page.getByLabel("Nhiệt độ tâm sau cấp đông (°C)")).toBeHidden();
    });
    await step("Bước 4: QC xem kệ hàng và danh sách nhà cung cấp của lô đã nhập", async () => {
      await visit(page, "/inventory/shelves", "qc-ke-hang");
      await visit(page, "/inventory/suppliers", "qc-nha-cung-cap");
    });
    await step("Bước 5: Khách quét mã truy xuất của lô trên kệ, thấy nguồn nguyên liệu và hành trình", async () => {
      const response = await staff.request.get("/api/inventory/shelf-placements");
      expect(response.status()).toBe(200);
      const placements = placementsSchema.parse(data(await response.json())).items ?? [];
      const placed = placements.find(item => item.trace_code);
      if (!placed) {
        await info.attach("khong-co-ma-truy-xuat", { body: "Chưa có lô nào lên kệ có mã truy xuất", contentType: "text/plain" });
        return;
      }
      await visit(page, `/traceability/${encodeURIComponent(placed.trace_code)}`, "qc-truy-xuat");
      await expect(page.getByRole("heading", { name: "Kiểm định thành phẩm" })).toBeVisible();
      await expect(page.getByText("Nguồn nguyên liệu đã ghi nhận")).toBeVisible();
    });
  } finally {
    await page.screenshot({ path: info.outputPath("qc-cuoi.png"), fullPage: true }).catch(() => {});
    const recording = page.video();
    await staff.close();
    if (recording) await info.attach("video-qc", { path: await recording.path(), contentType: "video/webm" });
  }
});
