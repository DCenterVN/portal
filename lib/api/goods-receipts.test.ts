import { afterEach, expect, it, vi } from "vitest";
import { createGoodsReceipt } from "./goods-receipts";
import { envelope, supplierID, materialID } from "@/mocks/supplier-contract";
afterEach(() => vi.unstubAllGlobals());
it("gửi lượng/UOM/ngày, bỏ trống giá thì đọc giá server", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ id: supplierID, status: "DRAFT", total_amount_vnd: 50000 }, 201)));
  vi.stubGlobal("fetch", fetch);
  const receipt = await createGoodsReceipt({ branch_ref: materialID, supplier_ref: supplierID, expected_at: "2026-11-01T05:00:00+07:00", expected_lines: [{ sku_ref: materialID, uom: "KG", expected_quantity: 2, agreement_version_ref: supplierID, price_line_ref: materialID }] });
  expect(receipt.total_amount_vnd).toBe(50000);
  const body = JSON.parse(fetch.mock.calls[0][1].body);
  expect(body.expected_lines[0]).not.toHaveProperty("unit_cost_vnd");
  expect(body).not.toHaveProperty("total_amount_vnd");
});

it.each([0,101])("giá thực tế %s được gửi khi không có bảng giá tham chiếu", async price => {
  const fetch = vi.fn().mockResolvedValue(Response.json(envelope({ id: supplierID, status: "DRAFT" },201)));
  vi.stubGlobal("fetch",fetch);
  await createGoodsReceipt({branch_ref:materialID,supplier_ref:supplierID,expected_at:"2026-11-01T05:00:00+07:00",expected_lines:[{sku_ref:materialID,uom:"KG",expected_quantity:2.5,unit_cost_vnd:price}]} );
  const line=JSON.parse(fetch.mock.calls[0][1].body).expected_lines[0];
  expect(line.unit_cost_vnd).toBe(price);expect(line).not.toHaveProperty("agreement_version_ref");expect(line).not.toHaveProperty("price_line_ref");
});
it.each([-1,1.5,Number.MAX_SAFE_INTEGER+1])("không gửi giá không hợp lệ %s",price=>{
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  expect(()=>createGoodsReceipt({branch_ref:materialID,supplier_ref:supplierID,expected_at:"2026-11-01T05:00:00+07:00",expected_lines:[{sku_ref:materialID,uom:"KG",expected_quantity:2.5,unit_cost_vnd:price}]})).toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
it("không gửi một nửa cặp tham chiếu",()=>{
  const fetch=vi.fn();vi.stubGlobal("fetch",fetch);
  expect(()=>createGoodsReceipt({branch_ref:materialID,supplier_ref:supplierID,expected_at:"2026-11-01T05:00:00+07:00",expected_lines:[{sku_ref:materialID,uom:"KG",expected_quantity:2.5,agreement_version_ref:supplierID}]})).toThrow();
  expect(fetch).not.toHaveBeenCalled();
});
