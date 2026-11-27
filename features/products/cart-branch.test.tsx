import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addToCart, type Product } from "@/lib/api/sales";
import { useCatalogCart } from "./use-catalog";
import { useProductDetail } from "./use-product-detail";

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("@/lib/api/sales", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/api/sales")>()),
  addToCart: vi.fn().mockResolvedValue({ cart: { id: "c", status: "ACTIVE", version: 1 }, items: [] }),
  getOrCreateCartId: () => "cart",
  recordCartResponse: vi.fn(),
}));

const kitchen = "kitchen-branch";
const store = "store-branch";
const product: Product = { id: "p", sku_code: "S", name: "Món", uom: "EA", status: "ACTIVE", created_at: "2026-11-14", sku_ref: "sku", branch_ref: kitchen, base_price_vnd: 1000, available_quantity: 5 };
beforeEach(() => vi.mocked(addToCart).mockClear());

function run<T>(use: () => T): T {
  let out!: T;
  renderToStaticMarkup(React.createElement(() => { out = use(); return null; }));
  return out;
}

describe("giỏ ghi vào cửa hàng khách chọn", () => {
  it("danh mục: thêm giỏ gửi cửa hàng đã chọn", async () => {
    await run(() => useCatalogCart(product, store)).add();
    expect(addToCart).toHaveBeenCalledWith("cart", { sku_ref: "sku", branch_id: store, quantity: 1 });
  });
  it("danh mục: không chọn thì giữ chi nhánh của món", async () => {
    await run(() => useCatalogCart(product)).add();
    expect(addToCart).toHaveBeenCalledWith("cart", { sku_ref: "sku", branch_id: kitchen, quantity: 1 });
  });
  it("chi tiết món: thêm giỏ gửi cửa hàng đã chọn", async () => {
    await run(() => useProductDetail(product, store)).handleAddToCart();
    expect(addToCart).toHaveBeenCalledWith("cart", { sku_ref: "sku", branch_id: store, quantity: 1 });
  });
  it("chi tiết món: không chọn thì giữ chi nhánh của món", async () => {
    await run(() => useProductDetail(product)).handleAddToCart();
    expect(addToCart).toHaveBeenCalledWith("cart", { sku_ref: "sku", branch_id: kitchen, quantity: 1 });
  });
});
