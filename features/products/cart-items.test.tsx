import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCart } from "./use-cart";
import { unsellableItem } from "./cart-model";
import { CartView } from "./cart-view";

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const fetchMock = vi.fn<typeof fetch>();
const sku = "0198fd55-3f46-7a01-9e52-f4c0de000002";
const line = { product_id: sku, item_id: "item-1", name: "Bún bò", sku_code: "BB", quantity: 2, price_snapshot_vnd: 50000, uom: "suất" };
const cart = { id: "cart", total_amount_vnd: 100000, items: [line] };
const reply = (quantity: number) => Response.json({ code: 200, status: "success", message: "OK", data: { cart: { id: "cart", status: "ACTIVE", version: 2 }, items: quantity ? [{ id: "item-1", sku_ref: sku, quantity, price_snapshot_vnd: 50000 }] : [] } });
let storage: Map<string, string>;
function hook() {
  let result: ReturnType<typeof useCart>;
  function Probe() { result = useCart(cart); return null; }
  renderToStaticMarkup(<Probe />);
  return result!;
}
beforeEach(() => {
  storage = new Map([["vietsach.cart_branch", "branch"], ["vietsach.cart_id", "cart"], ["vietsach.cart_items", JSON.stringify([line])]]);
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
});
afterEach(() => vi.unstubAllGlobals());
it("đổi số lượng gọi PATCH đúng món và lưu giỏ mới", async () => {
  fetchMock.mockResolvedValueOnce(reply(5));
  await hook().changeQuantity(line, 5);
  const [url, init] = fetchMock.mock.calls[0];
  expect(new URL(String(url), "http://portal").pathname).toBe("/api/sales/carts/cart/items/item-1");
  expect(new URL(String(url), "http://portal").searchParams.get("branch_id")).toBe("branch");
  expect(init?.method).toBe("PATCH");
  expect(JSON.parse(String(init?.body))).toEqual({ quantity: 5 });
  expect(new Headers(init?.headers).get("Idempotency-Key")).toBeTruthy();
  expect(JSON.parse(storage.get("vietsach.cart_items")!)[0]).toMatchObject({ quantity: 5, item_id: "item-1", name: "Bún bò" });
});
it("số lượng không hợp lệ bị chặn trước API", async () => {
  await hook().changeQuantity(line, 0);
  expect(fetchMock).not.toHaveBeenCalled();
});
it("xoá món gọi DELETE và bỏ món khỏi giỏ đã lưu", async () => {
  fetchMock.mockResolvedValueOnce(reply(0));
  await hook().removeItem(line);
  expect(fetchMock.mock.calls[0][1]?.method).toBe("DELETE");
  expect(new URL(String(fetchMock.mock.calls[0][0]), "http://portal").pathname).toBe("/api/sales/carts/cart/items/item-1");
  expect(JSON.parse(storage.get("vietsach.cart_items")!)).toEqual([]);
});
it("nhận ra món ngoài chi nhánh từ câu lỗi", () => {
  const message = 'Món "Bún bò" không bán ở chi nhánh đã chọn, hãy bỏ món này khỏi giỏ.';
  expect(unsellableItem([line], message)).toBe(line);
  expect(unsellableItem([line], "Món Phở không bán ở chi nhánh")).toBeUndefined();
  expect(unsellableItem([line], "")).toBeUndefined();
});
it("giỏ có ô đổi số lượng và nút xoá từng món", () => {
  const html = renderToStaticMarkup(<CartView initialCart={cart} />);
  expect(html).toContain('aria-label="Số lượng Bún bò"');
  expect(html).toContain('aria-label="Xoá Bún bò khỏi giỏ"');
});
