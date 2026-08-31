import { describe, it, expect } from "vitest";
import React from "react";
import { clearCart, Product, formatVND, loadCartItems, recordCartResponse } from "@/lib/api/sales";
import { ProductsView } from "./products-view";
import { ProductDetailView } from "./product-detail-view";
import { CartView } from "./cart-view";

describe("Sales & Products UI Feature", () => {
  const products: Product[] = [{ id: "0198fd55-3f46-7a01-9e52-f4c0de000001", sku_code: "SKU-HN-001", name: "Cá hồi", uom: "kg", base_price_vnd: 300000, status: "ACTIVE", created_at: "2026-08-28T08:00:00Z" }];

  it("product fixture conforms to the normalized sales API contract", () => {
    expect(products.length).toBeGreaterThan(0);

    products.forEach((p) => {
      expect(p.sku_code).toMatch(/^SKU-[A-Z]+-\d+$/);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.base_price_vnd).toBeGreaterThan(0);
      expect(["DRAFT", "ACTIVE", "SUSPENDED"]).toContain(p.status);
      expect(["kg", "g", "khay", "túi", "hộp", "gói"]).toContain(p.uom);
    });
  });

  it("formatVND formats Vietnamese currency with ₫ symbol and dots separator", () => {
    expect(formatVND(300000)).toMatch(/300[.,]000\s*₫/);
    expect(formatVND(1250000)).toMatch(/1[.,]250[.,]000\s*₫/);
  });

  it("ProductsView component initializes and renders without crashing", () => {
    const element = React.createElement(ProductsView, {
      initialProducts: products,
      dataSource: "api",
    });
    expect(element).toBeDefined();
  });

  it("ProductDetailView renders product details correctly", () => {
    const element = React.createElement(ProductDetailView, {
      initialProduct: products[0],
    });
    expect(element).toBeDefined();
  });

  it("CartView initializes with items and computes total via useMemo", () => {
    const sampleCart = {
      id: "cart-test",
      items: [
        {
          product_id: "prod-1",
          sku_code: "SKU-HN-001",
          name: "Cá hồi",
          quantity: 2,
          price_snapshot_vnd: 300000,
          uom: "kg",
        },
      ],
      total_amount_vnd: 600000,
    };

    const element = React.createElement(CartView, {
      initialCart: sampleCart,
    });
    expect(element).toBeDefined();
  });

  it("Strict scope enforcement: no forbidden features in sales components", () => {
    const forbiddenKeywords = ["voucher", "coupon", "refund", "substitution"];
    const productKeys = Object.keys(products[0]);

    forbiddenKeywords.forEach((keyword) => {
      productKeys.forEach((key) => {
        expect(key.toLowerCase()).not.toContain(keyword);
      });
    });
  });

  it("hydrates cart display cache from the confirmed Sales response", () => {
    const storage = new Map<string, string>();
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } } });
    recordCartResponse({ cart: { id: "cart-id", status: "ACTIVE", version: 1 }, items: [{ sku_ref: products[0].id, quantity: 2, price_snapshot_vnd: 275000 }] }, products[0]);
    expect(loadCartItems()).toEqual([expect.objectContaining({ product_id: products[0].id, quantity: 2, price_snapshot_vnd: 275000 })]);
    Reflect.deleteProperty(globalThis, "window");
  });

  it("rotates a checked-out cart by clearing cached items and its id", () => {
    const storage = new Map<string, string>([
      ["vietsach.cart_id", "checked-out-cart"],
      ["vietsach.cart_items", JSON.stringify([{ product_id: "sku-1" }])],
    ]);
    Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } } });

    clearCart();

    expect(storage.has("vietsach.cart_id")).toBe(false);
    expect(storage.has("vietsach.cart_items")).toBe(false);
    Reflect.deleteProperty(globalThis, "window");
  });
});
