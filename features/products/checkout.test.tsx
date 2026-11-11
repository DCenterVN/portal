import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useCart } from "./use-cart";
import { cancelOrder, getOrderDisplay } from "@/lib/api/sales";

vi.mock("@/components/ui/toast", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
const fetchMock = vi.fn<typeof fetch>();
const values = { recipient_name: "Nguyễn An", recipient_phone: "0912345678", province_code: "01", commune_code: "00001", delivery_address: "12 Lê Lợi", delivery_note: "Gọi trước", payment_method: "COD" as const };
const order = { id: "order", order_code: "DH-001", cart_ref: "cart", status: "AWAITING_PAYMENT", subtotal_vnd: 50000, total_vnd: 50000, created_at: "2026-11-11T00:00:00Z" };
const success = (data: unknown, status = 201) => Response.json({ code: status, status: "success", message: "OK", data }, { status });
let storage: Map<string, string>;
function cartHook() {
  let result: ReturnType<typeof useCart>;
  function Probe() { result = useCart({ id: "cart", total_amount_vnd: 50000, items: [{ product_id: "sku", name: "Bún bò", sku_code: "BB", quantity: 1, price_snapshot_vnd: 50000, uom: "suất" }] }); return null; }
  renderToStaticMarkup(<Probe />);
  return result!;
}
beforeEach(() => {
  storage = new Map([["vietsach.cart_branch", "branch"], ["vietsach.cart_id", "cart"]]);
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset().mockImplementation(async () => success(order));
});
afterEach(() => vi.unstubAllGlobals());
it("gửi đủ checkout ONLINE, phí giao 0, double click chỉ một request", async () => {
  const hook = cartHook();
  await Promise.all([hook.handleCheckout(values), hook.handleCheckout(values)]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ ...values, cart_ref: "cart", branch_ref: "branch", channel: "ONLINE", shipping_fee_vnd: 0 });
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get("Idempotency-Key")).toBeTruthy();
  await hook.handleCheckout(values);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(storage.has("vietsach.cart_id")).toBe(false);
  expect(storage.get("vietsach.cart_branch")).toBe("branch");
});
it.each(["recipient_name", "recipient_phone", "province_code", "commune_code", "delivery_address"])("thiếu %s chặn trước API", async field => {
  await cartHook().handleCheckout({ ...values, [field]: "" });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("số điện thoại sai bị chặn", async () => {
  await cartHook().handleCheckout({ ...values, recipient_phone: "1234567890" });
  expect(fetchMock).not.toHaveBeenCalled();
});
it.each([409, 200])("lỗi hoặc response %s giữ giỏ, retry dùng cùng key", async status => {
  fetchMock.mockResolvedValueOnce(status === 409 ? Response.json({ error: "out_of_stock", message: "Món Bún bò không đủ hàng" }, { status }) : success(order, status));
  const hook = cartHook();
  await hook.handleCheckout(values);
  expect(storage.get("vietsach.cart_id")).toBe("cart");
  await hook.handleCheckout(values);
  expect(fetchMock.mock.calls[0][1]?.headers).toEqual(fetchMock.mock.calls[1][1]?.headers);
});
it("list/detail/cancel gửi branch_id sau khi đặt hàng", async () => {
  fetchMock.mockResolvedValueOnce(success({ items: [order] }, 200)).mockResolvedValueOnce(success(order, 200)).mockResolvedValueOnce(success(order, 200));
  await getOrderDisplay(); await getOrderDisplay("order"); await cancelOrder("order", "Đổi ý");
  for (const [url] of fetchMock.mock.calls) expect(new URL(String(url), "http://portal").searchParams.get("branch_id")).toBe("branch");
});

it("lỗi hết hàng giữ toàn bộ thông tin đã nhập", async () => {
  fetchMock.mockResolvedValueOnce(Response.json({ error: "out_of_stock", message: "Món Bún bò không đủ hàng" }, { status: 409 }));
  const hook = cartHook();
  hook.form.reset(values);
  await hook.handleCheckout(hook.form.getValues());
  expect(hook.form.getValues()).toEqual(values);
  expect(storage.get("vietsach.cart_id")).toBe("cart");
});
it("thiếu chi nhánh chặn trước API và giữ giỏ", async () => {
  storage.delete("vietsach.cart_branch");
  await cartHook().handleCheckout(values);
  expect(fetchMock).not.toHaveBeenCalled();
  expect(storage.get("vietsach.cart_id")).toBe("cart");
});
