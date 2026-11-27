import { describe, expect, it } from "vitest";
import { inspectionBlock, pendingRowView } from "./shelf-pending-rules";
import type { ShelfPendingLot } from "@/lib/api/shelf-pending";

const base: ShelfPendingLot = { lot_id: "a", sku_ref: "b", supplier_lot_code: "LOT-1", uom: "EA", remaining_quantity: 5, pending_quantity: 5, inspection_quantity: 0, expires_at: "2026-12-10T00:00:00Z", origin: "PRODUCTION", source_code: "" };

describe("dòng chờ lên kệ", () => {
  it("hàng sản xuất: nhãn nguồn, không mã chứng từ, số chờ lên kệ", () => {
    expect(pendingRowView(base)).toMatchObject({ originLabel: "Sản xuất", source: "", pending: "5 cái", inspection: "" });
  });
  it("hàng chuyển kho: hiện mã phiếu chuyển", () => {
    expect(pendingRowView({ ...base, origin: "TRANSFER", source_code: "CK-261115-0001", pending_quantity: 3 })).toMatchObject({ originLabel: "Chuyển kho", source: "Phiếu chuyển CK-261115-0001", pending: "3 cái", inspection: "" });
  });
  it("hàng giao hỏng quay về: nhãn cần kiểm, lượng cần kiểm lấy từ inspection_quantity, kèm mã đơn", () => {
    const view = pendingRowView({ ...base, origin: "DELIVERY_RETURN", source_code: "DH-261115-00008", pending_quantity: 4, inspection_quantity: 2 });
    expect(view).toMatchObject({ originLabel: "Hàng giao hỏng quay về, cần kiểm", source: "Đơn DH-261115-00008", inspection: "Cần kiểm 2 cái" });
    expect(view.inspection).not.toContain("4");
  });
  it("nguồn khác không bao giờ hiện lượng cần kiểm dù có số", () => {
    expect(pendingRowView({ ...base, inspection_quantity: 2 }).inspection).toBe("");
  });
  it("kg_unit: lô tính bằng kg hiện kg, không hiện hộp", () => {
    expect(pendingRowView({ ...base, uom: "KG", pending_quantity: 2 }).pending).toBe("2 kg");
  });
});

describe("xác nhận đã kiểm hàng giao hỏng", () => {
  const returned = { ...base, origin: "DELIVERY_RETURN" };
  it("inspection_confirm_required: hàng giao hỏng chưa đánh dấu đã kiểm thì bị chặn kèm lý do", () => {
    expect(inspectionBlock(returned, false)).toContain("đánh dấu đã kiểm");
    expect(inspectionBlock(returned, true)).toBe("");
  });
  it("inspection_confirm_other_source: nguồn khác không cần ô này", () => {
    expect(inspectionBlock(base, false)).toBe("");
    expect(inspectionBlock({ ...base, origin: "TRANSFER" }, false)).toBe("");
  });
});
