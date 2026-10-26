import { afterEach, expect, it, vi } from "vitest";
import { createGoodsReceipt } from "./goods-receipts";
import { envelope, supplierID, materialID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("gửi lượng/UOM/ngày, không gửi giá tự nhập; đọc giá server", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ id: supplierID, status: "DRAFT", total_amount_vnd: 50000 }, 201)));
  vi.stubGlobal("fetch", fetch);
  const receipt = await createGoodsReceipt({ branch_ref: materialID, supplier_ref: supplierID, expected_at: "2026-11-01T05:00:00+07:00", expected_lines: [{ sku_ref: materialID, uom: "KG", expected_quantity: 2, agreement_version_ref: supplierID, price_line_ref: materialID }] });
  expect(receipt.total_amount_vnd).toBe(50000);
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.expected_lines[0]).not.toHaveProperty("unit_cost_vnd");
  expect(body).not.toHaveProperty("total_amount_vnd");
});
