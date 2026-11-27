import { describe, expect, it } from "vitest";
import type { InventoryLotItem, SkuMeta, StockLevelItem } from "@/lib/api/stock-overview";
import {
  buildStockRows,
  classifySkuGroup,
  displaySkuCode,
  evaluateLotHealth,
  formatExpiryDelta,
  lotDisplayStatus,
  summarizeStockRows,
} from "./stock-model";

const BRANCH = "01a157cd-fef2-72ff-9428-63b4df7d25d0";
const NOW = Date.parse("2026-11-26T03:00:00Z");

const stock = (overrides: Partial<StockLevelItem> & Pick<StockLevelItem, "sku_ref" | "uom">): StockLevelItem => ({
  id: overrides.sku_ref,
  branch_ref: BRANCH,
  on_hand_quantity: 0,
  reserved_quantity: 0,
  available_quantity: 0,
  usable_quantity: 0,
  shelf_pending_quantity: 0,
  sellable_quantity: 0,
  updated_at: "2026-11-26T00:00:00Z",
  ...overrides,
});

const lot = (overrides: Partial<InventoryLotItem> & Pick<InventoryLotItem, "id" | "sku_ref" | "supplier_lot_code" | "uom">): InventoryLotItem => ({
  branch_ref: BRANCH,
  storage_location_code: "KHO-LANH-1",
  initial_quantity: 5,
  remaining_quantity: 5,
  received_temperature_celsius: 3,
  expires_at: "2026-12-10T17:00:00Z",
  status: "APPROVED",
  created_at: "2026-11-17T04:00:00Z",
  ...overrides,
});

describe("stock-model", () => {
  it("phát hiện ca tồn sổ 5 kg nhưng dùng được 0 kg vì lô hết hạn", () => {
    const baChi = "01a1e781-f512-7688-bb3c-861483644d7c";
    const meta = new Map<string, SkuMeta>([
      [baChi, { id: baChi, sku_code: "NL-L42F5J", name: "Ba chỉ lợn", uom_code: "KG", kind: "RAW_MATERIAL", status: "ACTIVE" }],
    ]);
    const expiredLot = lot({
      id: "01a1e7d9-ce7f-7c3e-b955-2d1d67b4e514",
      sku_ref: baChi,
      supplier_lot_code: "HL-171126-01",
      uom: "KG",
      expires_at: "2026-11-19T17:00:00Z",
    });

    const rows = buildStockRows({
      stocks: [stock({ sku_ref: baChi, uom: "KG", on_hand_quantity: 5, usable_quantity: 0, available_quantity: 5 })],
      lots: [expiredLot],
      skuMeta: meta,
      nowMs: NOW,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: "Ba chỉ lợn",
      group: "RAW",
      onHand: 5,
      usable: 0,
      unusable: 5,
      expiredQty: 5,
      issueStatus: "UNUSABLE",
    });
    expect(rows[0].issueSummary).toContain("HL-171126-01");
    expect(rows[0].issueSummary).toContain("KHO-LANH-1");
    expect(rows[0].shortDetail).toBe("HL-171126-01 · KHO-LANH-1");
    expect(rows[0].skuCode).toBe("NL-L42F5J");
    expect(lotDisplayStatus(expiredLot, NOW)).toEqual({ tone: "danger", label: "Đã hết hạn" });
    expect(formatExpiryDelta("2026-11-19T17:00:00Z", NOW)).toBe("Quá hạn 6 ngày");
  });

  it("ẩn mã nội bộ chứa UUID nhưng giữ mã SKU ngắn", () => {
    expect(displaySkuCode("NL-L42F5J")).toBe("NL-L42F5J");
    expect(displaySkuCode("BTP-SOT-B892A162")).toBe("BTP-SOT-B892A162");
    expect(displaySkuCode("SV-01a1c5af-3512-74b8-a0d4-40c76b6615d7")).toBe("");
    expect(displaySkuCode("")).toBe("");
  });

  it("không báo âm hoặc không dùng được cho thành phẩm có shelf_pending và usable bằng onHand", () => {
    const monId = "01a1e782-5a39-7679-a72d-4ac543dbfcb8";
    const meta = new Map<string, SkuMeta>([
      [monId, { id: monId, sku_code: "SV-01a1c616", name: "Cá nục kho cà chua", uom_code: "EA", kind: "PRODUCED_VARIANT", status: "ACTIVE" }],
    ]);

    const rows = buildStockRows({
      stocks: [stock({ sku_ref: monId, uom: "EA", on_hand_quantity: 2, usable_quantity: 2, shelf_pending_quantity: 2, sellable_quantity: 0 })],
      lots: [],
      skuMeta: meta,
      nowMs: NOW,
    });

    expect(rows[0]).toMatchObject({ group: "FINISHED", unusable: 0, issueStatus: "OK" });
  });

  it("phân loại đúng Nguyên liệu, Bán thành phẩm BTP-*/VN-PACK-* và Thành phẩm món", () => {
    expect(classifySkuGroup({ id: "1", sku_code: "NL-1", name: "Tỏi", kind: "RAW_MATERIAL" })).toBe("RAW");
    expect(classifySkuGroup({ id: "2", sku_code: "BTP-SOT-B892A162", name: "Sốt kho tàu", kind: "PRODUCED_VARIANT" })).toBe("SEMI");
    expect(classifySkuGroup({ id: "3", sku_code: "VN-PACK-COT-BO", name: "Cốt bò", kind: "PRODUCED_VARIANT" })).toBe("SEMI");
    expect(classifySkuGroup({ id: "4", sku_code: "SV-1234", name: "Bún bò", kind: "PRODUCED_VARIANT" })).toBe("FINISHED");
    expect(classifySkuGroup(undefined, true)).toBe("FINISHED");
    expect(classifySkuGroup(undefined, false)).toBe("UNKNOWN");
  });

  it("gom lô RECEIVED chờ kiểm QC chưa có dòng branch_stocks và sắp lô FEFO", () => {
    const cai = "01a15f28-7dc1-701f-87e5-009678055689";
    const dau = "01a15f28-7dc1-701f-87e5-009678055690";
    const rows = buildStockRows({
      stocks: [stock({ sku_ref: dau, uom: "KG", on_hand_quantity: 10, usable_quantity: 10 })],
      lots: [
        lot({ id: "l1", sku_ref: cai, supplier_lot_code: "LO-QC", uom: "KG", status: "RECEIVED", storage_location_code: "", remaining_quantity: 4 }),
        lot({ id: "l-used", sku_ref: dau, supplier_lot_code: "LO-HET", uom: "KG", status: "CONSUMED", remaining_quantity: 0, expires_at: "2026-11-20T00:00:00Z" }),
        lot({ id: "l-later", sku_ref: dau, supplier_lot_code: "LO-SAU", uom: "KG", status: "APPROVED", remaining_quantity: 6, expires_at: "2026-12-05T17:00:00Z" }),
        lot({ id: "l-soon", sku_ref: dau, supplier_lot_code: "LO-CAN", uom: "KG", status: "APPROVED", remaining_quantity: 4, expires_at: "2026-11-27T17:00:00Z" }),
      ],
      skuMeta: new Map([
        [cai, { id: cai, sku_code: "NL-CAI", name: "Cải ngọt", kind: "RAW_MATERIAL" }],
        [dau, { id: dau, sku_code: "NL-DAU", name: "Đậu xanh", kind: "RAW_MATERIAL" }],
      ]),
      nowMs: NOW,
    });

    expect(rows.map(r => r.skuRef)).toEqual([dau, cai]);
    expect(rows[0].issueStatus).toBe("EXPIRING_SOON");
    expect(rows[0].expiringSoonQty).toBe(4);
    expect(rows[0].lots.map(l => l.supplier_lot_code)).toEqual(["LO-CAN", "LO-SAU", "LO-HET"]);
    expect(evaluateLotHealth(rows[0].lots[0], NOW)).toBe("EXPIRING_SOON");
    expect(rows[1]).toMatchObject({ issueStatus: "PENDING_QC", pendingQcQty: 4, hasStock: true });
    expect(summarizeStockRows(rows)).toEqual({ totalActiveItems: 2, expiringSoonItems: 1, attentionItems: 1 });
  });
});
