import { Buffer } from "node:buffer";
import { crc32, deflateSync } from "node:zlib";
import { test, expect, type Locator, type Page, type Response } from "@playwright/test";
import { z } from "zod";
import { agreementSchema } from "../../lib/api/supplier-agreements";
import { supplierSchema } from "../../lib/api/suppliers";

const idSchema = z.object({ id: z.string().uuid() });
const numeric = z.union([z.number(), z.string().regex(/^\d+(?:\.\d+)?$/)]).transform(Number);
const stockSchema = z.object({ items: z.array(z.object({ sku_ref: z.string().uuid(), uom: z.string(), on_hand_quantity: numeric, available_quantity: numeric })).nullable() });
const lotsSchema = z.object({ items: z.array(z.object({ id: z.string().uuid(), goods_receipt_ref: z.string().uuid(), goods_receipt_line_id: z.string().uuid(), initial_quantity: numeric, remaining_quantity: numeric, status: z.string() })).nullable() });

function png(red: number) {
  function chunk(type: string, data: Buffer) {
    const payload = Buffer.concat([Buffer.from(type), data]);
    const size = Buffer.alloc(4);
    size.writeUInt32BE(data.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE(crc32(payload));
    return Buffer.concat([size, payload, checksum]);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0); header.writeUInt32BE(1, 4);
  header[8] = 8; header[9] = 6;
  return { name: `kho-${red}.png`, mimeType: "image/png", buffer: Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", header),
    chunk("IDAT", deflateSync(Buffer.from([0, red, 90, 140, 255]))), chunk("IEND", Buffer.alloc(0)),
  ]) };
}

function data(value: unknown): unknown {
  return value && typeof value === "object" && "data" in value ? value.data : value;
}

async function result<S extends z.ZodTypeAny>(response: Response, schema: S, status = 201): Promise<z.output<S>> {
  const body: unknown = await response.json();
  await test.info().attach(new URL(response.url()).pathname, { body: JSON.stringify({ status: response.status(), body }, null, 2), contentType: "application/json" });
  expect(response.status(), JSON.stringify(body)).toBe(status);
  return schema.parse(data(body));
}

function mutation(page: Page, path: string) {
  return page.waitForResponse(response => new URL(response.url()).pathname === path && response.request().method() === "POST");
}

async function pick(scope: Page | Locator, label: string, name: string) {
  const box = scope.getByRole("combobox", { name: label, exact: true });
  await box.fill(name);
  await scope.getByRole("option").filter({ hasText: name }).click();
  await expect(box).toHaveValue(name);
}

test("KHO: bảng giá hai dòng, nhận lệch có ảnh, kiểm lượng tồn và tiền thực nhận", async ({ browser }, info) => {
  test.setTimeout(240_000);
  const context = await browser.newContext({
    storageState: process.env.PORTAL_WAREHOUSE_STATE,
    ...(process.env.E2E_RECORD === "1" && { recordVideo: { dir: info.outputPath("video"), size: { width: 1440, height: 900 }, showActions: { duration: 1500, position: "top", fontSize: 22 } } }),
  });
  const page = await context.newPage();
  async function step(title: string, body: () => Promise<void>) {
    await test.step(title, async () => {
      const overlay = await page.screencast.showOverlay(`<div style="position:absolute;bottom:8px;left:8px;right:8px;padding:12px;background:#222;color:white;font-size:22px">${title}</div>`);
      try { await body(); } finally { await overlay.dispose(); }
    });
  }
  const suffix = Date.now().toString();
  const supplierName = `Kho hành trình ${suffix}`;
  const code = `KHO-${suffix}`;
  const agreementCode = `HD-KHO-${suffix}`;
  const prices = [25000, 40000];
  const expected = [10, 5];
  const actual = [8, 6];
  const names: string[] = [];
  let supplierID = "";
  let receiptID = "";
  let branchID = "";
  let agreement: z.infer<typeof agreementSchema> | undefined;
  let receiveWrites = 0;
  const beforeStocks = new Map<string, { onHand: number; available: number }>();
  const lotIDs: string[] = [];
  page.on("request", request => {
    if (request.method() === "POST" && /\/goods-receipts\/[^/]+\/receive$/.test(new URL(request.url()).pathname)) receiveWrites++;
  });
  async function history() {
    const response = await context.request.get(`/api/inventory/suppliers/${supplierID}/goods-receipts?page_size=20`);
    expect(response.status()).toBe(200);
    const body = z.object({ items: z.array(z.object({ id: z.string(), branch_ref: z.string(), status: z.string(), total_amount_vnd: z.number(), lines: z.array(z.object({ receipt_line_ref: z.string(), sku_ref: z.string(), uom: z.string(), expected_quantity: z.string(), actual_quantity: z.string(), unit_cost_vnd: z.number().nullable(), expected_amount_vnd: z.number().nullable(), actual_amount_vnd: z.number().nullable() })) })) }).parse(data(await response.json()));
    const receipt = body.items.find(item => item.id === receiptID);
    expect(receipt, "Phiếu vừa tạo phải đọc lại được").toBeDefined();
    if (!receipt) throw new Error("Không tìm thấy phiếu vừa tạo");
    return receipt;
  }
  async function inventoryRead<S extends z.ZodTypeAny>(path: string, schema: S): Promise<z.output<S>> {
    const token = (await context.cookies()).find(cookie => cookie.name === "access_token")?.value;
    if (!token) throw new Error("Phiên kho không có access_token");
    const response = await context.request.get(`${process.env.INVENTORY_SERVICE_URL ?? "http://localhost:8085"}/inventory/${path}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status(), `GET inventory/${path}`).toBe(200);
    return schema.parse(data(await response.json()));
  }
  async function stock(sku: string) {
    const body = await inventoryRead(`stock-levels?branch_ref=${branchID}&sku_ref=${sku}`, stockSchema);
    expect((body.items ?? []).length).toBeLessThanOrEqual(1);
    return { onHand: body.items?.[0]?.on_hand_quantity ?? 0, available: body.items?.[0]?.available_quantity ?? 0 };
  }
  async function upload(row: Locator, label: string, color: number) {
    const finalized = page.waitForResponse(response => /\/evidence-uploads\/[^/]+\/finalize$/.test(new URL(response.url()).pathname) && response.request().method() === "POST");
    await row.getByLabel(label, { exact: true }).setInputFiles(png(color));
    await result(await finalized, z.object({ status: z.literal("FINALIZED") }), 200);
  }
  try {
    await step("Bước 1: Kho tạo nhà cung cấp mới", async () => {
      await page.goto("/inventory/suppliers");
      await page.getByRole("button", { name: "Thêm nhà cung cấp", exact: true }).click();
      await page.getByLabel("Mã nhà cung cấp", { exact: true }).fill(code);
      await page.getByLabel("Tên nhà cung cấp", { exact: true }).fill(supplierName);
      const created = mutation(page, "/api/inventory/suppliers");
      await page.getByRole("button", { name: "Lưu nhà cung cấp", exact: true }).click();
      const supplier = await result(await created, supplierSchema);
      expect(supplier.status).toBe("ACTIVE");
      expect(supplier.name).toBe(supplierName);
      supplierID = supplier.id;
      await page.getByLabel("Tìm nhà cung cấp theo tên hoặc mã").fill(code);
      await page.getByRole("link", { name: supplierName, exact: true }).click();
    });
    await step("Bước 2: Lập và áp dụng bảng giá hai nguyên liệu theo kilôgam", async () => {
      await page.getByRole("tab", { name: "Bảng giá", exact: true }).click();
      await page.getByRole("button", { name: "Lập bảng giá mới", exact: true }).click();
      await page.getByLabel("Mã bảng giá", { exact: true }).fill(agreementCode);
      const today = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
      await page.getByLabel("Hiệu lực từ", { exact: true }).fill(today);
      await page.getByLabel("Hiệu lực đến", { exact: true }).fill(`${Number(today.slice(0, 4)) + 1}-12-31`);
      for (let index = 0; index < 2; index++) {
        if (index) await page.getByRole("button", { name: "Thêm dòng giá", exact: true }).click();
        const box = page.getByRole("combobox", { name: "Nguyên liệu", exact: true }).nth(index);
        await box.click();
        const options = page.getByRole("option").filter({ hasText: /· KG/ });
        await expect(options.first()).toBeVisible();
        await options.nth(index).click();
        names.push(await box.inputValue());
        await page.getByLabel("Giá VND / đơn vị", { exact: true }).nth(index).fill(String(prices[index]));
      }
      expect(new Set(names).size).toBe(2);
      await page.getByLabel("Chọn PDF hoặc ảnh, tối đa 5 MiB").setInputFiles(png(40));
      const saved = mutation(page, `/api/inventory/suppliers/${supplierID}/agreements`);
      await page.getByRole("button", { name: "Lưu nháp", exact: true }).click();
      const draft = await result(await saved, agreementSchema);
      expect(draft.status).toBe("DRAFT");
      const card = page.getByRole("article").filter({ hasText: agreementCode });
      await card.getByRole("button", { name: "Mở bản nháp", exact: true }).click();
      const applied = mutation(page, `/api/inventory/suppliers/${supplierID}/agreements/${draft.agreement_id}/versions`);
      await page.getByRole("button", { name: "Áp dụng bảng giá", exact: true }).click();
      agreement = await result(await applied, agreementSchema);
      expect(agreement.status).toBe("ACTIVE");
      expect(agreement.lines.map(line => line.unit_price_vnd)).toEqual(prices);
      await expect(card).toContainText("Đã áp dụng");
    });
    await step("Bước 3: Tạo phiếu nhập 10 kg và 5 kg, tự lấy giá hợp đồng, tổng 450.000 đồng", async () => {
      await page.goto("/inventory/goods-receipts/new");
      await pick(page, "Nhà cung cấp", supplierName);
      for (let index = 0; index < 2; index++) {
        if (index) await page.getByRole("button", { name: "Thêm dòng nhập", exact: true }).click();
        await pick(page, `Nguyên liệu dòng ${index + 1}`, names[index]);
        await page.getByLabel(`Số lượng dòng ${index + 1}`, { exact: true }).fill(String(expected[index]));
        await expect(page.getByLabel(`Đơn giá dòng ${index + 1}`, { exact: true })).toHaveValue(String(prices[index]));
      }
      await expect(page.getByLabel("Tổng tiền dự kiến", { exact: true })).toHaveText("450.000 VND");
      const created = mutation(page, "/api/inventory/goods-receipts");
      await page.getByRole("button", { name: "Tạo phiếu nhập", exact: true }).click();
      const response = await created;
      const submitted = response.request().postDataJSON();
      const receipt = await result(response, idSchema);
      receiptID = receipt.id;
      expect(agreement).toBeDefined();
      expect(submitted.expected_lines).toEqual(agreement?.lines.map((line, index) => ({ sku_ref: line.sku_ref, uom: "KG", expected_quantity: expected[index], unit_cost_vnd: prices[index], agreement_version_ref: agreement?.version_id, price_line_ref: line.price_line_ref })));
      const persisted = await history();
      branchID = persisted.branch_ref;
      expect(persisted.status).toBe("DRAFT");
      expect(persisted.total_amount_vnd).toBe(450000);
      for (const line of persisted.lines) beforeStocks.set(line.sku_ref, await stock(line.sku_ref));
      await page.getByRole("link", { name: "Nhận hàng ngay", exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/inventory/goods-receipts/${receiptID}/receive\\?`));
    });
    await step("Bước 4: Nhập đủ thông tin nhưng thiếu ảnh thì chưa được nhận hàng", async () => {
      for (let index = 0; index < 2; index++) {
        const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: names[index], exact: true }) });
        await row.getByLabel("Mã lô nhà cung cấp", { exact: true }).fill(`LO-${suffix}-${index}`);
        await row.getByLabel("Lượng thực nhận (KG)", { exact: true }).fill(String(actual[index]));
        await row.getByLabel("Hạn sử dụng", { exact: true }).fill(`31/12/${new Date().getFullYear() + 1}`);
        await row.getByLabel("Nhiệt độ nhận (°C)", { exact: true }).fill("4");
        await expect(row.getByRole("button", { name: "Nhận dòng này", exact: true })).toBeDisabled();
      }
      expect(receiveWrites).toBe(0);
      expect((await history()).lines.map(line => Number(line.actual_quantity))).toEqual([0, 0]);
    });
    await step("Bước 5: Tải ảnh hàng, ảnh chứng từ và ảnh lệch; nhận thực tế 8 kg và 6 kg", async () => {
      for (let index = 0; index < 2; index++) {
        const row = page.getByRole("article").filter({ has: page.getByRole("heading", { name: names[index], exact: true }) });
        const button = row.getByRole("button", { name: "Nhận dòng này", exact: true });
        await upload(row, "Ảnh hàng thực nhận", 60 + index);
        await expect(button, "Thiếu ảnh chứng từ vẫn phải chặn").toBeDisabled();
        await upload(row, "Chứng từ giao hàng", 80 + index);
        await expect(button, "Lượng lệch chưa có ảnh giải trình vẫn phải chặn").toBeDisabled();
        await upload(row, "Ảnh lệch số lượng", 100 + index);
        const received = mutation(page, `/api/inventory/goods-receipts/${receiptID}/receive`);
        await button.click();
        const lot = await result(await received, idSchema.extend({ status: z.literal("RECEIVED") }));
        lotIDs.push(lot.id);
        await expect(row.getByRole("status")).toContainText(`Đã nhận · ${actual[index]} KG`);
      }
      expect(receiveWrites).toBe(2);
    });
    await step("Bước 6: Giải trình tổng nhận 14 kg thay vì 15 kg", async () => {
      await page.getByLabel("Giải thích lệch số lượng", { exact: true }).fill("Nhà cung cấp giao thiếu dòng một 2 kg, thừa dòng hai 1 kg; đã cân và chụp ảnh.");
      const recorded = mutation(page, `/api/inventory/goods-receipts/${receiptID}/quantity-variances`);
      await page.getByRole("button", { name: "Ghi lệch số lượng", exact: true }).click();
      const response = await recorded;
      expect(response.request().postDataJSON()).toMatchObject({ expected_quantity: 15, actual_quantity: 14 });
      await result(response, idSchema);
      await expect(page.getByRole("status").filter({ hasText: "Đã ghi lệch số lượng" })).toBeVisible();
    });
    await step("Bước 7: Đọc lại lượng và thành tiền thực nhận 440.000 đồng, đối chiếu từng lô", async () => {
      const receipt = await history();
      await info.attach("phieu-thuc-nhan", { body: JSON.stringify(receipt, null, 2), contentType: "application/json" });
      expect(receipt.status).toBe("RECEIVING");
      for (let index = 0; index < 2; index++) {
        const line = receipt.lines[index];
        expect(Number(line.expected_quantity)).toBe(expected[index]);
        expect(Number(line.actual_quantity)).toBe(actual[index]);
        expect(line.unit_cost_vnd).toBe(prices[index]);
        expect(line.actual_amount_vnd).toBe(actual[index] * prices[index]);
        const lots = await inventoryRead(`inventory-lots?branch_ref=${branchID}&sku_ref=${line.sku_ref}&page_size=1000`, lotsSchema);
        const lot = lots.items?.find(item => item.id === lotIDs[index]);
        expect(lot).toMatchObject({ goods_receipt_ref: receiptID, goods_receipt_line_id: line.receipt_line_ref, initial_quantity: actual[index], remaining_quantity: actual[index], status: "RECEIVED" });
      }
      expect(receipt.lines.reduce((sum, line) => sum + (line.actual_amount_vnd ?? 0), 0)).toBe(440000);
      await page.goto(`/inventory/suppliers/${supplierID}?tab=receipts`);
      await expect(page.getByRole("region", { name: "Lịch sử nhập", exact: true }).getByText("Tổng thực nhận: 440.000 VND", { exact: true })).toBeVisible();
    });
    await step("Bước 8: Kiểm tồn tăng đúng 8 kg và 6 kg theo hành trình KHO", async () => {
      const receipt = await history();
      for (let index = 0; index < 2; index++) {
        const sku = receipt.lines[index].sku_ref;
        const before = beforeStocks.get(sku);
        if (!before) throw new Error("Chưa ghi tồn trước nhận");
        const after = await stock(sku);
        await info.attach(`ton-dong-${index + 1}`, { body: JSON.stringify({ before, after, expectedIncrease: actual[index], note: "Đặc tả yêu cầu QC APPROVED trước khi tăng tồn khả dụng; hành trình UI hiện chỉ có nhận hàng." }), contentType: "application/json" });
        expect(after.onHand - before.onHand, "S4 yêu cầu tăng tồn; lô RECEIVED chưa có màn QC để duyệt").toBe(actual[index]);
        expect(after.available - before.available).toBe(actual[index]);
      }
    });
  } finally {
    await page.screenshot({ path: info.outputPath("kho-cuoi.png"), fullPage: true }).catch(() => {});
    const video = page.video();
    await context.close();
    if (video) await info.attach("video", { path: await video.path(), contentType: "video/webm" });
  }
});
