"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/toast";
import { clearCart, createOrder, getCart, getOrCreateCartId, loadCartItems, recordCartResponse, type Cart, type CartItem } from "@/lib/api/sales";

export function useCart(initialCart?: Cart) {
  const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);
  const [cartId, setCartId] = useState(initialCart?.id ?? "");
  const [loading, setLoading] = useState(!initialCart);
  const [error, setError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (initialCart) return;
    setLoading(true);
    setError("");
    try {
      const id = cartId || getOrCreateCartId();
      setCartId(id);
      setItems(loadCartItems());
      recordCartResponse(await getCart(id));
      setItems(loadCartItems());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải giỏ hàng");
    } finally { setLoading(false); }
  }, [cartId, initialCart]);
  useEffect(() => { void reload(); }, [reload]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price_snapshot_vnd, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const handleCheckout = useCallback(async () => {
    if (!items.length || !cartId) { toast.error("Giỏ hàng trống", { description: "Vui lòng chọn sản phẩm trước khi tạo đơn." }); return; }
    setSubmittingOrder(true);
    try {
      const order = await createOrder(cartId);
      setCreatedOrderCode(order.order_code ?? "");
      toast.success("Tạo đơn hàng thành công", { description: order.order_code ? `Mã đơn: ${order.order_code}` : undefined });
      setItems([]); clearCart(); setCartId("");
    } catch (cause) { toast.error("Không thể tạo đơn hàng", { description: cause instanceof Error ? cause.message : String(cause) }); }
    finally { setSubmittingOrder(false); }
  }, [items.length, cartId]);
  return { items, setItems, cartId, loading, error, reload, submittingOrder, createdOrderCode, setCreatedOrderCode, totalAmount, totalQuantity, handleCheckout };
}
