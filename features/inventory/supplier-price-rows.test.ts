import { expect, it } from "vitest";
import { agreement, materialID, material } from "@/mocks/supplier-contract";
import { panelState, priceRows } from "./supplier-price-rows";

const active = { ...agreement, status: "ACTIVE" as const, effective_status: "ACTIVE", valid_from: "2026-11-01", valid_to: "2026-12-31" };
const line = (sku: string, valid_to: string, price = 12000) => ({ ...agreement.lines[0], sku_ref: sku, unit_price_vnd: price, valid_to, uom: "KG" });
const named = [{ ...material, id: materialID, name: "Gạo tẻ" }, { ...material, id: "b", name: "Cà chua" }];

it("chỉ lấy dòng của bảng giá đang áp dụng, xếp theo tên, đếm nháp", () => {
  const draft = { ...agreement, status: "DRAFT" as const, effective_status: "DRAFT", lines: [line("b", "2026-12-31")] };
  const stopped = { ...agreement, agreement_id: "x", status: "SUSPENDED" as const, effective_status: "SUSPENDED", lines: [line("b", "2026-12-31")] };
  const result = priceRows([draft, stopped, { ...active, lines: [line(materialID, "2026-12-31"), line("b", "2026-12-31")] }], named, "2026-11-16");
  expect(result.rows.map(row => row.name)).toEqual(["Cà chua", "Gạo tẻ"]);
  expect(result.drafts).toBe(1);
});

it("còn 14 ngày trở xuống thì sắp hết hạn, 15 ngày thì chưa", () => {
  const result = priceRows([{ ...active, lines: [line(materialID, "2026-11-30"), line("b", "2026-12-01")] }], named, "2026-11-16");
  expect(result.rows.find(row => row.name === "Gạo tẻ")?.expiring).toBe(true);
  expect(result.rows.find(row => row.name === "Cà chua")?.expiring).toBe(false);
});

it("nguyên liệu không tra được tên thì ghi câu thay thế, không lộ mã", () => {
  const result = priceRows([{ ...active, lines: [line("01960000-0000-7000-8000-0000000000ff", "2026-12-31")] }], named, "2026-11-16");
  expect(result.rows[0].name).toBe("Nguyên liệu không còn trong danh mục");
});

it("chỉ hiện đang tải khi chưa có dữ liệu lần nào, tải lại thì giữ dòng cũ", () => {
  expect(panelState(undefined, undefined)).toBe("loading");
  expect(panelState([], undefined)).toBe("ready");
  expect(panelState([active], undefined)).toBe("ready");
  expect(panelState(undefined, new Error("x"))).toBe("error");
  expect(panelState([active], new Error("x"))).toBe("ready");
});
