import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogProduct } from "@/lib/api/sales";
import messages from "@/messages/vi.json";
import { productComponents } from "./use-product-detail";
import { ProductDetailInfo } from "./product-detail-info";
import { ProductDetailView } from "./product-detail-view";
import { CatalogProductCard } from "./catalog-product-card";

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const variant = { id: "sku-two", sku_code: "TWO", uom_code: "EA", variant_label: "2 người", portion_count: 2, net_weight_g: 1100, unit_price_vnd: 85100, base_price_vnd: 90000, available_quantity: 3, sellable: true };
const nutrition = { per_serving: { kcal: "243", protein_g: "36", fat_g: "9", carb_g: "4", fiber_g: "1", sugar_g: "2", sodium_mg: "484" }, missing: [], labels: [], summary: "", components: [] };
async function load(variants: object[]) {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 200, status: "success", message: "OK", data: {
    product: { id: "meal", name: "Cá nục", created_at: "2026-11-10", branch_ref: "branch" }, variants, nutrition,
  } }) }));
  const result = await getCatalogProduct("meal");
  expect(result.source).toBe("api");
  return result.data!;
}
afterEach(() => vi.unstubAllGlobals());

describe("quy cách và số người ăn", () => {
  it("giữ variant bán được và lấy giá, tồn, SKU đầu tiên bán được", async () => {
    const product = await load([{ ...variant, id: "hidden", sellable: false }, variant]);
    expect(product).toMatchObject({ sku_ref: "sku-two", portion_count: 2, net_weight_g: 1100, base_price_vnd: 85100, available_quantity: 3 });
    expect(product.variants).toHaveLength(1);
    const out = renderToStaticMarkup(<ProductDetailView initialProduct={product} />);
    expect(out).toContain("2 người · 1.100 g");
    expect(out).toContain("Cho 2 người · 1.100 g · 243 kcal/người · 36 g đạm/người");
    expect(out).toContain("/ gói 2 người");
    expect(out).toContain("≈ 42.600");
    expect(out).toContain("Dinh dưỡng mỗi người (1 suất)");
    expect(out).toContain("Lượng cho 1 người");
    expect(out).not.toContain('value="hidden"');
    const card = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh"><CatalogProductCard product={product} /></NextIntlClientProvider>);
    expect(card).toContain(">2 người</p>");
  });
  it("thiếu số người thì chỉ ghi giá mỗi gói và không đoán số người", async () => {
    const product = await load([{ ...variant, portion_count: undefined }]);
    const out = renderToStaticMarkup(<ProductDetailView initialProduct={product} />);
    expect(out).toContain("/ gói</span>");
    expect(out).not.toContain("≈");
    expect(out).not.toContain("Cho 2 người");
  });
  it("không có variant bán được thì không chọn SKU hay hiện giá của variant ẩn", async () => {
    const product = await load([{ ...variant, sellable: false }]);
    expect(product.sku_ref).toBeUndefined();
    expect(product.base_price_vnd).toBeUndefined();
    const out = renderToStaticMarkup(<ProductDetailView initialProduct={product} />);
    expect(out).toContain("Chưa có quy cách");
    expect(out).toContain("Chưa có giá");
  });
});

describe("ngăn dinh dưỡng vệ tinh", () => {
  const components = [{ name: "Gói đạm 175 g", grams: "175", kcal: "120", protein_g: "24", fat_g: null, carb_g: "0" }];
  it("giữ lượng mỗi người, tỉ lệ kcal và số thiếu khi mở thẻ ngăn", async () => {
    const product = await load([variant]);
    product.nutrition = { ...nutrition, per_serving: { ...nutrition.per_serving, kcal: "240" }, components };
    const [selected] = productComponents(product.nutrition, product.name);
    expect(selected.name).toBe("Gói đạm");
    expect(selected.grams).toBe("175");
    expect(selected.share).toBe("50% kcal của món");
    expect(selected.nutrients).toEqual([
      { key: "kcal", label: "Năng lượng", value: "120 kcal" },
      { key: "protein_g", label: "Đạm", value: "24 g" },
      { key: "fat_g", label: "Béo", value: "Chưa có" },
      { key: "carb_g", label: "Tinh bột", value: "0 g" },
    ]);
    const out = renderToStaticMarkup(<ProductDetailInfo product={product} />);
    expect(out).not.toContain("Ngăn Gói đạm");
    expect(out).not.toContain("selected-compartment");
  });
  it("không đoán tỉ lệ khi kcal món bằng 0 hoặc thiếu", () => {
    for (const kcal of ["0", null]) {
      expect(productComponents({ ...nutrition, per_serving: { ...nutrition.per_serving, kcal }, components }, "Món")[0].share).toBe("Chưa có tỉ lệ kcal");
    }
    expect(productComponents(null, "Món")).toEqual([]);
  });
  it("vòng mặc định có nút ngăn và chưa có vòng dinh dưỡng", async () => {
    const product = await load([variant]);
    product.nutrition = { ...nutrition, components };
    const out = renderToStaticMarkup(<ProductDetailView initialProduct={product} />);
    expect(out).toContain('aria-label="Ngăn Gói đạm, 175 g/người, xem dinh dưỡng"');
    expect(out).toContain('aria-pressed="false"');
    expect(out).not.toContain('aria-label="Dinh dưỡng ngăn');
    expect(out).toContain('data-slot="select-trigger"');
  });
});
