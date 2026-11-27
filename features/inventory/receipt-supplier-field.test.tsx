import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { supplier } from "@/mocks/supplier-contract";
import { ReceiptSupplierField, activeSupplierCategories, supplierMatches } from "./receipt-supplier-field";
import { Command } from "@/components/ui/command";
import { EntityList } from "@/components/patterns/entity-picker";

const full = { ...supplier, name: "Đà Lạt Xanh", contact_phone: "0901 234 567", material_category_labels: [
  { code: "LEAFY", name: "Rau ăn lá", parent_code: "VEG", parent_name: "Rau củ" }, { code: "ROOT", name: "Củ", parent_code: "VEG", parent_name: "Rau củ" },
  { code: "BEEF", name: "Thịt bò", parent_code: "MEAT", parent_name: "Thịt" }, { code: "PORK", name: "Thịt heo", parent_code: "MEAT", parent_name: "Thịt" },
] };
const categories = [{ code: "VEG", name: "Rau củ", children: [] }, { code: "MEAT", name: "Thịt", children: [] }];

describe("chọn nhà cung cấp khi nhập", () => {
  it("lọc theo nhóm lớn, theo tên, mã và số điện thoại không dấu", () => {
    expect(supplierMatches(full, "", "VEG")).toBe(true);
    expect(supplierMatches(full, "", "FISH")).toBe(false);
    expect(supplierMatches(full, "da lat", "")).toBe(true);
    expect(supplierMatches(full, "ncc-gao", "")).toBe(true);
    expect(supplierMatches(full, "0901234", "")).toBe(true);
    expect(supplierMatches(full, "0901 234", "")).toBe(true);
    expect(supplierMatches(full, "0999", "")).toBe(false);
  });
  it("thẻ đã chọn có nhóm, liên hệ, số nguyên liệu có giá, Đổi và Xem hồ sơ", () => {
    const html = renderToStaticMarkup(<ReceiptSupplierField suppliers={[full]} categories={categories} status="ready" value={full.id} onChange={() => {}} pricedCount={3} />);
    for (const text of ["Đà Lạt Xanh", "NCC-GAO", "Rau ăn lá, Củ, Thịt bò +1", "Nguyễn An", "0901 234 567", "3 nguyên liệu có giá", "Đổi", "Xem hồ sơ"]) expect(html).toContain(text);
    expect(html).toContain(`/inventory/suppliers/${full.id}`);
  });
  it("chưa chạm thì không báo lỗi đỏ", () => {
    const html = renderToStaticMarkup(<ReceiptSupplierField suppliers={[full]} categories={categories} status="ready" value="" onChange={() => {}} pricedCount={null} />);
    expect(html).not.toContain('role="alert"'); expect(html).not.toContain("Hãy chọn"); expect(html).toContain("Chọn nhà cung cấp");
  });
  it("mỗi lựa chọn vẽ hai dòng", () => {
    const html = renderToStaticMarkup(<Command shouldFilter={false}><EntityList options={[full]} picked={null} onPick={() => {}} emptyMessage="" getId={s => s.id} getLabel={s => s.name}
      renderOption={s => <span>{s.name}|{s.code}|{s.contact_name}</span>} /></Command>);
    expect(html).toContain("Đà Lạt Xanh|NCC-GAO|Nguyễn An");
  });
});

it("nhà đang chọn không có trong danh sách theo ngày thì thẻ báo không có giá", () => {
  const html = renderToStaticMarkup(<ReceiptSupplierField suppliers={[]} selected={full} categories={categories} status="ready" value={full.id} onChange={() => {}} pricedCount={0} />);
  expect(html).toContain("Nhà này không có giá cho ngày đã chọn");
  expect(html).not.toContain("Chưa có giá nào áp dụng");
});

it("chỉ giữ lại các chip nhóm nguyên liệu có nhà cung cấp phù hợp", () => {
  const withEmptyGroup = [...categories, { code: "FISH", name: "Hải sản", children: [] }];
  expect(activeSupplierCategories(withEmptyGroup, [full]).map(cat => cat.code)).toEqual(["VEG", "MEAT"]);
  expect(activeSupplierCategories(withEmptyGroup, [])).toEqual([]);
});

it("nếu mọi nguyên liệu trong bảng giá của nhà đang tạm ngừng sử dụng thì báo rõ lý do", () => {
  const html = renderToStaticMarkup(<ReceiptSupplierField suppliers={[full]} categories={categories} status="ready" value={full.id} onChange={() => {}} pricedCount={0} suspendedPricedCount={1} />);
  expect(html).toContain("Các nguyên liệu trong bảng giá của nhà này đang tạm ngừng sử dụng.");
  expect(html).not.toContain("Chưa có giá nào áp dụng cho ngày dự kiến nhập.");
});
