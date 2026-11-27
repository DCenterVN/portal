"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "@/components/ui/toast";
import { checkoutSchema, type CheckoutInput, clearCart, createOrder, getCart, getOrCreateCartId, loadCartItems, recordCartResponse, removeCartItem, updateCartItem, type Cart, type CartItem } from "@/lib/api/sales";
import { hasServerCart, orderErrorMessage, unsellableItem, validQuantity } from "./cart-model";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import useSWR from "swr";
import { getLocations } from "@/lib/api/locations";
import { FetchError } from "@/lib/fetcher";
import { safeMessage } from "@/lib/api/dishes";

export function useCart(initialCart?: Cart) {
  const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);
  const [cartId, setCartId] = useState(initialCart?.id ?? "");
  const [loading, setLoading] = useState(!initialCart);
  const [error, setError] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [itemBusy, setItemBusy] = useState(false);
  const pending = useRef(false);
  const completed = useRef(false);
  const orderKey = useRef<string | null>(null);
  const form = useForm<CheckoutInput>({ resolver: zodResolver(checkoutSchema), mode: "onBlur", defaultValues: {
    recipient_name: "", recipient_phone: "", province_code: "", commune_code: "", delivery_address: "", delivery_note: "", payment_method: "COD",
  } });
  const province = form.watch("province_code");
  const provinces = useSWR(checkoutOpen ? "/api/locations/provinces" : null, getLocations);
  const communes = useSWR(checkoutOpen && province ? `/api/locations/provinces/${encodeURIComponent(province)}/communes` : null, getLocations);
  useEffect(() => {
    if (provinces.data?.length === 1 && !province) form.setValue("province_code", provinces.data[0].code);
  }, [provinces.data, province, form]);
  useEffect(() => {
    if (communes.data?.length === 1 && !form.getValues("commune_code")) form.setValue("commune_code", communes.data[0].code);
  }, [communes.data, form]);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (initialCart || completed.current) return;
    setLoading(true);
    setError("");
    try {
      const id = cartId || getOrCreateCartId();
      setCartId(id);
      const local = loadCartItems();
      setItems(local);
      if (!hasServerCart(local)) return;
      recordCartResponse(await getCart(id));
      setItems(loadCartItems());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải giỏ hàng");
    } finally { setLoading(false); }
  }, [cartId, initialCart]);
  useEffect(() => { void reload(); }, [reload]);
  const totalAmount = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.price_snapshot_vnd, 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const handleCheckout = useCallback(async (input: CheckoutInput) => {
    if (pending.current || completed.current) return;
    const parsed = checkoutSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) form.setError(issue.path[0] as keyof CheckoutInput, { message: issue.message });
      return;
    }
    if (!items.length || !cartId) { toast.error("Giỏ hàng trống", { description: "Vui lòng chọn sản phẩm trước khi tạo đơn." }); return; }
    pending.current = true;
    orderKey.current ??= crypto.randomUUID();
    setSubmittingOrder(true);
    setCheckoutError("");
    try {
      const order = await createOrder(cartId, parsed.data, orderKey.current);
      completed.current = true;
      setCheckoutOpen(false);
      setCreatedOrderCode(order.order_code ?? "");
      toast.success("Tạo đơn hàng thành công", { description: order.order_code ? `Mã đơn: ${order.order_code}` : undefined });
      setItems([]); clearCart(); setCartId("");
    } catch (cause) {
      const status = cause instanceof FetchError ? cause.status : 0;
      setCheckoutError(orderErrorMessage(status, cause instanceof FetchError ? cause.code : undefined, cause instanceof Error ? safeMessage(cause.message) : ""));
    } finally { pending.current = false; setSubmittingOrder(false); }
  }, [items.length, cartId, form]);
  async function mutateItem(request: () => ReturnType<typeof updateCartItem>, success: string) {
    if (itemBusy) return false;
    setItemBusy(true);
    try {
      recordCartResponse(await request());
      setItems(loadCartItems());
      setCheckoutError("");
      toast.success(success);
      return true;
    } catch (cause) {
      toast.error("Không cập nhật được giỏ hàng", { description: cause instanceof Error ? safeMessage(cause.message) : undefined });
      return false;
    } finally { setItemBusy(false); }
  }
  async function changeQuantity(item: CartItem, quantity: number) {
    if (!item.item_id || !cartId || quantity === item.quantity) return false;
    if (!validQuantity(quantity)) { toast.error("Số lượng phải là số nguyên từ 1 trở lên"); return false; }
    return mutateItem(() => updateCartItem(cartId, item.item_id!, quantity), "Đã đổi số lượng");
  }
  async function removeItem(item: CartItem) {
    if (!item.item_id || !cartId) return false;
    return mutateItem(() => removeCartItem(cartId, item.item_id!), `Đã bỏ ${item.name} khỏi giỏ`);
  }
  const unsellable = unsellableItem(items, checkoutError);
  function changeCheckoutOpen(open: boolean) {
    if (pending.current) return;
    if (!open && form.formState.isDirty) { setDiscardOpen(true); return; }
    setCheckoutOpen(open);
  }
  function discardCheckout() {
    form.reset();
    setDiscardOpen(false);
    setCheckoutOpen(false);
  }
  function selectProvince(code: string | null) {
    form.setValue("province_code", code ?? "", { shouldDirty: true, shouldValidate: true });
    form.setValue("commune_code", "");
  }
  return { discardOpen, setDiscardOpen, discardCheckout, form, provinces, communes, selectProvince, checkoutOpen, changeCheckoutOpen, checkoutError, items, setItems, cartId, loading, error, reload, submittingOrder, createdOrderCode, setCreatedOrderCode, totalAmount, totalQuantity, handleCheckout, itemBusy, changeQuantity, removeItem, unsellable };
}
