import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it } from "vitest";
import messages from "@/messages/vi.json";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { SupplierCategoryPicker, SupplierCategoryGroups } from "./supplier-category-picker";
import { categoryCheckState, toggleCategorySelection } from "./use-supplier-form";

const tree: MaterialCategory[] = [
  { code: "THIT", name: "Thịt", children: [{ code: "GA", name: "Gà", children: [] }, { code: "LON", name: "Lợn", children: [] }, { code: "BO", name: "Bò", children: [] }] },
  { code: "THUY_HAI_SAN", name: "Thủy hải sản", children: [{ code: "CA", name: "Cá", children: [] }, { code: "TOM", name: "Tôm", children: [] }] },
];

it("tick cha chọn toàn bộ leaf, bỏ cha giữ lựa chọn ở cha khác", () => {
  const selected = toggleCategorySelection(["CA"], ["GA", "LON", "BO"], true);
  expect(selected).toEqual(["CA", "GA", "LON", "BO"]);
  expect(selected).not.toContain("THIT");
  expect(categoryCheckState(selected, ["GA", "LON", "BO"])).toBe(true);
  expect(toggleCategorySelection(selected, ["GA", "LON", "BO"], false)).toEqual(["CA"]);
  expect(categoryCheckState(["GA", "CA"], ["GA", "LON", "BO"])).toBe("indeterminate");
  expect(categoryCheckState([], [])).toBe(false);
});

it("picker có ô tìm, ô cha mixed và Đã chọn theo cha", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><SupplierCategoryPicker categories={tree} selected={["GA", "LON", "CA", "TOM"]} onChange={() => {}} /></NextIntlClientProvider>);
  expect(html).toContain("Tìm nhóm nguyên liệu");
  expect(html).toContain('aria-checked="mixed"');
  expect(html).toContain("Đã chọn 4 nhóm con");
  expect(html).toContain("Thịt"); expect(html).toContain("Thủy hải sản");
  expect(html).not.toContain("Salad");
});

it("shared renderer uses child chips, parent labels and no raw codes", () => {
 const html=renderToStaticMarkup(<SupplierCategoryGroups categories={tree} selected={["GA","CA"]} />);
 expect(html).toContain("Gà"); expect(html).toContain("Cá");
 expect(html).toContain("rounded-full");
 expect(html).not.toContain(">GA<"); expect(html).not.toContain(">CA<");
});
it("unknown stored codes ask for migration instead of vanishing", () => {
 const html=renderToStaticMarkup(<SupplierCategoryGroups categories={tree} selected={["OLD_CODE"]} />);
 expect(html).toContain("Nhóm cũ cần chọn lại");
 expect(html).not.toContain("OLD_CODE");
});
