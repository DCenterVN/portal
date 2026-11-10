import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalog, getCatalogProduct, type Product } from "@/lib/api/sales";
import { ProductDetailInfo } from "./product-detail-info";
import { useProductDetail } from "./use-product-detail";

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
afterEach(() => vi.unstubAllGlobals());
const unknown = { known: false, contains: [], unknown: [] };
const fishSoy = { known: true, contains: ["FISH", "SOYBEANS"], unknown: [] };
const variant = { id: "fish", sku_code: "FISH", uom_code: "EA", sellable: true };
async function load(summaries: unknown[], list = false) {
  const entry = {
    product: { id: "meal", name: "Món", created_at: "2026-11-10" },
    variants: summaries.map((allergen_summary, index) => ({ ...variant, id: `portion-${index}`, allergen_summary })),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({
    code: 200, status: "success", message: "OK", data: list ? { items: [entry] } : entry,
  })));
  if (list) {
    const result = await getCatalog();
    expect(result.source).toBe("api");
    return result.data[0];
  }
  const result = await getCatalogProduct("meal");
  expect(result.source).toBe("api");
  return result.data!;
}
function SelectedInfo({ product, sku }: { product: Product; sku?: string }) {
  const detail = useProductDetail(product);
  if (sku && detail.product.sku_ref !== sku) detail.selectVariant(sku);
  return <ProductDetailInfo product={detail.product} />;
}

describe("dị ứng theo quy cách", () => {
  it.each([false, true])("parser giữ aggregate partial trên list=%s, chuẩn hoá legacy", async list => {
    const partial = { known: false, contains: ["FISH", "SOYBEANS"], unknown: ["Rau cải"] };
    const product = await load([partial, undefined, null, {}, { known: true, contains: [], unknown: [] }], list);
    expect(product.variants).toMatchObject([
      { allergen_summary: partial }, { allergen_summary: unknown }, { allergen_summary: unknown },
      { allergen_summary: unknown }, { allergen_summary: { known: true, contains: [], unknown: [] } },
    ]);
  });
  it("hiện Cá và Đậu nành bằng Badge trung tính", async () => {
    const out = renderToStaticMarkup(<SelectedInfo product={await load([fishSoy])} />);
    expect(out).toContain(">Cá</span>");
    expect(out).toContain(">Đậu nành</span>");
    expect(out.match(/data-variant="outline"/g)).toHaveLength(2);
    expect(out).not.toContain("Chưa đủ thông tin");
    expect(out).not.toContain("Chưa có thông tin dị ứng");
  });
  it.each([undefined, null, {}, unknown])("UNKNOWN %j không suy thành không dị ứng", async summary => {
    const out = renderToStaticMarkup(<SelectedInfo product={await load([summary])} />);
    expect(out).toContain("Chưa có thông tin dị ứng");
    expect(out).not.toContain("Không chứa 14 nhóm");
  });
  it("known rỗng chỉ khẳng định theo khai báo", async () => {
    const out = renderToStaticMarkup(<SelectedInfo product={await load([{ known: true, contains: [], unknown: [] }])} />);
    expect(out).toContain("Không chứa 14 nhóm dị ứng phổ biến (theo khai báo)");
    expect(out).not.toContain("Chưa có thông tin dị ứng");
  });
  it("partial giữ nhãn dương và tên nguyên liệu chưa khai báo", async () => {
    const out = renderToStaticMarkup(<SelectedInfo product={await load([{ ...fishSoy, known: false, unknown: ["Rau cải", "Gia vị"] }])} />);
    expect(out).toContain(">Cá</span>");
    expect(out).toContain(">Đậu nành</span>");
    expect(out).toContain("Chưa đủ thông tin: Rau cải, Gia vị");
  });
  it("đổi quy cách thay nhãn, quy cách thiếu field không lấy nhãn khác bù", async () => {
    const product = await load([fishSoy, { known: true, contains: ["MILK"], unknown: [] }, undefined]);
    const first = renderToStaticMarkup(<SelectedInfo product={product} />);
    expect(first).toContain(">Cá</span>");
    const second = renderToStaticMarkup(<SelectedInfo product={product} sku="portion-1" />);
    expect(second).toContain(">Sữa</span>");
    expect(second).not.toContain(">Cá</span>");
    expect(second).not.toContain(">Đậu nành</span>");
    const missing = renderToStaticMarkup(<SelectedInfo product={product} sku="portion-2" />);
    expect(missing).toContain("Chưa có thông tin dị ứng");
    expect(missing).not.toContain('data-slot="badge"');
  });
});
