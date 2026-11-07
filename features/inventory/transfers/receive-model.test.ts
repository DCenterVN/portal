import { describe, expect, it } from "vitest";
import type { StockTransfer } from "@/lib/api/stock-transfers";
import { receiveBody, receiveDefaults, receiveSchema } from "./receive-model";

const id = (n: number) => `0192f3a4-5b6c-7d8e-9f00-${String(n).padStart(12, "0")}`;
const line = (n: number, sent: string) => ({ id: id(n), lot_ref: id(30 + n), sku_ref: id(40 + n), uom: "KG", sent_qty: sent, received_qty: null, variance_reason: null, dest_lot_ref: null });
const transfer: StockTransfer = { id: id(1), code: "CK-261107-0001", from_branch_ref: id(2), to_branch_ref: id(3), status: "IN_TRANSIT", sent_by_ref: id(4), sent_at: "2026-11-07T11:00:00Z", lines: [line(1, "1.500"), line(2, "0.200")], evidence: [] };

describe("phiếu nhận", () => {
  it("ô số nhận điền sẵn số gửi", () => {
    expect(receiveDefaults(transfer).rows.map(row => row.received)).toEqual(["1,5", "0,2"]);
  });

  it("nhận đủ cả hai dòng: không lỗi, không gửi lý do", () => {
    const values = receiveDefaults(transfer);
    expect(receiveSchema(transfer).safeParse(values).success).toBe(true);
    expect(receiveBody(transfer, values, [])).toEqual({ lines: [{ line_id: id(1), received_qty: "1.500" }, { line_id: id(2), received_qty: "0.200" }], evidence_refs: [] });
  });

  it("dòng nhận thiếu bắt buộc lý do, gửi kèm ảnh", () => {
    const values = { rows: [{ received: "1,5", reason: "" }, { received: "0,1", reason: "" }] };
    const result = receiveSchema(transfer).safeParse(values);
    expect(result.success).toBe(false);
    expect(result.success ? [] : result.error.issues.map(issue => issue.path.join("."))).toEqual(["rows.1.reason"]);
    const ok = { rows: [values.rows[0], { received: "0,1", reason: "SHORT" }] };
    expect(receiveBody(transfer, ok, [id(90)]).lines[1]).toEqual({ line_id: id(2), received_qty: "0.100", variance_reason: "SHORT" });
  });
});
