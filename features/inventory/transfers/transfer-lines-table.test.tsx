import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StockTransfer } from "@/lib/api/stock-transfers";
import { TransferHistory, transferHistory } from "./transfer-history";
import { TransferLinesTable } from "./transfer-lines-table";

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-/;
const id = (n: number) => `0192f3a4-5b6c-7d8e-9f00-${String(n).padStart(12, "0")}`;
const base: StockTransfer = {
  id: id(1), code: "CK-261107-0001", from_branch_ref: id(2), to_branch_ref: id(3), status: "RECEIVED", sent_by_ref: id(4), sent_at: "2026-11-07T11:00:00Z",
  received_by_ref: id(5), received_at: "2026-11-07T12:30:00Z", evidence: [],
  lines: [
    { id: id(11), lot_ref: id(21), sku_ref: id(31), uom: "KG", sent_qty: "1.500", received_qty: "1.500", source_lot_code: "LO-1", source_lot_expires_at: "2027-12-30T17:00:00Z", variance_reason: null, dest_lot_ref: id(51) },
    { id: id(12), lot_ref: id(22), sku_ref: id(32), uom: "KG", sent_qty: "0.200", received_qty: "0.100", source_lot_code: "LO-9", source_lot_expires_at: "2027-01-31T00:00:00Z", variance_reason: "SHORT", dest_lot_ref: id(52) },
  ],
};

describe("chi tiết phiếu không lộ UUID", () => {
  it("dòng hàng hiện tên, mã lô, hạn dùng, hao hụt và lý do tiếng Việt", () => {
    const html = renderToStaticMarkup(<TransferLinesTable lines={base.lines} name={sku => (sku === id(31) ? "Thịt bò" : "Cá nục")} />);
    expect(html).not.toMatch(UUID);
    expect(html).toContain("Thịt bò");
    expect(html).toContain("LO-9");
    expect(html).toContain("LO-1");
    expect(html).toContain("Hạn dùng 31/12/2027");
    expect(html).toContain("Hạn dùng 31/01/2027");
    expect(html).toContain("Thiếu hàng");
    expect(html).not.toMatch(/SHORT/);
  });

  it("lịch sử có gửi và nhận, ghi tên chi nhánh, 'Bạn' cho chính mình", () => {
    const html = renderToStaticMarkup(<TransferHistory steps={transferHistory(base, { from: "Sunny · Bếp trung tâm", to: "Sunny · Cầu Giấy" }, id(4))} />);
    expect(html).not.toMatch(UUID);
    expect(html).toContain("Bạn · Sunny · Bếp trung tâm");
    expect(html).toContain("Nhận hàng");
    expect(html).toContain("07/11/2026 18:00");
  });
});
