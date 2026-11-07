import { describe, expect, it } from "vitest";
import type { LotRow, StockRow } from "@/lib/api/stock-transfers";
import { FEFO_LOT } from "@/lib/stock-transfer";
import { lotOptions, sendBody, sendSchema } from "./send-form-model";

const id = (n: number) => `0192f3a4-5b6c-7d8e-9f00-${String(n).padStart(12, "0")}`;
const stock: StockRow[] = [{ sku_ref: id(1), branch_ref: id(9), available_quantity: 4.5, uom: "KG" }];
const lot = (n: number, expires: string, remaining = 3, status = "APPROVED"): LotRow => ({ id: id(n), sku_ref: id(1), branch_ref: id(9), supplier_lot_code: `LO-${n}`, remaining_quantity: remaining, uom: "KG", expires_at: expires, status });
const lots = [lot(21, "2099-06-01T00:00:00Z"), lot(22, "2099-01-01T00:00:00Z"), lot(23, "2000-01-01T00:00:00Z"), lot(24, "2099-03-01T00:00:00Z", 0), lot(25, "2099-03-01T00:00:00Z", 3, "RECEIVED")];

describe("lô chọn được", () => {
  it("chỉ lô APPROVED còn hạn còn hàng, hạn gần nhất trước, hiện mã lô", () => {
    expect(lotOptions(lots, id(1)).map(item => item.label)).toEqual(["LO-22", "LO-21"]);
    expect(lotOptions(lots, id(1))[0].meta).toBe("Còn 3 kg");
    expect(lotOptions(lots, id(2))).toEqual([]);
  });
});

describe("kiểm dòng gửi", () => {
  const check = (quantity: string, lotId = FEFO_LOT, sku = id(1)) => sendSchema(stock, lots).safeParse({ to: id(5), lines: [{ sku, quantity, lot: lotId }] });
  const message = (result: ReturnType<typeof check>) => (result.success ? "" : result.error.issues[0].message);

  it("đủ tồn thì qua", () => expect(check("4,5").success).toBe(true));
  it("vượt tồn khả dụng thì báo còn bao nhiêu", () => expect(message(check("4,501"))).toMatch(/Chỉ còn khả dụng 4,5 kg/));
  it("vượt số còn của lô đã chọn thì nêu mã lô", () => expect(message(check("3,5", id(21)))).toMatch(/Lô LO-21 chỉ còn 3 kg/));
  it("số lượng sai hoặc 0 thì báo nhập lại", () => {
    expect(message(check("0"))).toMatch(/lớn hơn 0/);
    expect(message(check("1.2345"))).toMatch(/3 số lẻ/);
    expect(message(check(""))).toMatch(/lớn hơn 0/);
  });
  it("chưa chọn chi nhánh nhận hoặc nguyên liệu thì báo", () => {
    expect(sendSchema(stock, lots).safeParse({ to: "", lines: [{ sku: "", quantity: "1", lot: FEFO_LOT }] }).success).toBe(false);
  });
});

describe("nội dung gửi lên", () => {
  it("số lượng là chuỗi 3 số lẻ; lô tự chọn thì không gửi lot_ref", () => {
    const body = sendBody({ to: id(5), lines: [{ sku: id(1), quantity: "1,5", lot: FEFO_LOT }, { sku: id(1), quantity: "0.25", lot: id(21) }] }, stock);
    expect(body).toEqual({ to_branch_ref: id(5), lines: [{ sku_ref: id(1), uom: "KG", quantity: "1.500" }, { sku_ref: id(1), uom: "KG", quantity: "0.250", lot_ref: id(21) }] });
  });
});
