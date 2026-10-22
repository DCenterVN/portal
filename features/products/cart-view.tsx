"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  Package,
  Receipt,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Cart, CartItem, clearCart, createOrder, formatVND, getCart, getOrCreateCartId, loadCartItems, recordCartResponse } from "@/lib/api/sales";
import { PageShell, PageHeader } from "@/components/ui/page";

interface CartViewProps {
  initialCart?: Cart;
}

export function CartView({ initialCart }: CartViewProps) {
  const { toast } = useToast();
  // P0-4 fix: Only store items in state. Total is DERIVED, computed via useMemo.
  const [items, setItems] = useState<CartItem[]>(initialCart?.items ?? []);
  const [cartId, setCartId] = useState(initialCart?.id ?? "");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string | null>(null);

  useEffect(() => {
    if (initialCart) return;
    const activeCartId = cartId || getOrCreateCartId();
    if (!cartId) setCartId(activeCartId);
    setItems(loadCartItems());
    void getCart(activeCartId)
      .then((response) => {
        recordCartResponse(response);
        setItems(loadCartItems());
      })
      .catch(() => {
        // A cart is created lazily by the first add-item command. Until then,
        // the last Sales-confirmed cache is the only displayable read model.
      });
  }, [cartId, initialCart]);

  // Derived: single source of truth for total
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price_snapshot_vnd, 0),
    [items]
  );

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const handleCheckout = useCallback(async () => {
    if (items.length === 0 || !cartId) {
      toast.error("Giỏ hàng trống", "Vui lòng chọn sản phẩm trước khi tạo đơn.");
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await createOrder(cartId);
      setCreatedOrderCode(order.order_code ?? "");
      toast.success("Tạo đơn hàng thành công", order.order_code ? `Mã đơn: ${order.order_code}` : undefined);
      setItems([]);
      clearCart();
      setCartId("");
    } catch (err: unknown) {
      toast.error("Không thể tạo đơn hàng", err instanceof Error ? err.message : String(err));
    } finally {
      setSubmittingOrder(false);
    }
  }, [items.length, cartId, toast]);

  return (
    <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <div className="mb-4">
        <Link
          href={"/products" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-primary-hover)] dark:hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Tiếp tục chọn sản phẩm
        </Link>
      </div>

      <PageHeader
        icon={<ShoppingCart />}
        title="Giỏ Hàng & Tạo Đơn Hàng"
        badge={
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-tint)] text-[var(--color-ink)]">
            {items.length} mặt hàng
          </span>
        }
        description="Giỏ hiển thị cache từ phản hồi Sales; tổng tiền chính thức luôn do backend tính khi tạo đơn"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] overflow-hidden">
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-[var(--color-line)] bg-[var(--color-tint)]">
                    <TableHead className="text-[11px] font-bold uppercase text-[var(--color-muted)]">
                      Mặt Hàng & SKU
                    </TableHead>
                    <TableHead className="w-[120px] text-[11px] font-bold uppercase text-[var(--color-muted)] text-right">
                      Đơn Giá
                    </TableHead>
                    <TableHead className="w-[140px] text-[11px] font-bold uppercase text-[var(--color-muted)] text-center">
                      Số Lượng
                    </TableHead>
                    <TableHead className="w-[130px] text-[11px] font-bold uppercase text-[var(--color-muted)] text-right">
                      Thành Tiền
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.product_id} className="border-b border-[var(--color-line)]">
                      <TableCell>
                        <div className="font-bold text-xs text-[var(--color-ink)]">
                          {item.name}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--color-muted)] mt-0.5">
                          {item.sku_code} · {item.uom}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-serif font-semibold text-xs text-[var(--color-ink)]">
                        {formatVND(item.price_snapshot_vnd)}
                      </TableCell>

                      <TableCell className="text-center text-xs font-bold text-[var(--color-ink)]">
                        {item.quantity}
                      </TableCell>

                      <TableCell className="text-right font-serif font-bold text-xs text-[var(--color-ink)]">
                        {formatVND(item.quantity * item.price_snapshot_vnd)}
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center text-xs text-[var(--color-muted)] space-y-3">
                <Package className="size-10 mx-auto text-[var(--color-muted)]" />
                <p>Giỏ hàng hiện đang trống.</p>
                <Link href={"/products" as Route}>
                  <Button size="sm" variant="outline">
                    Xem danh mục sản phẩm
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Checkout Summary */}
        <div>
          <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-6 space-y-5">
            <CardHeader className="p-0 pb-4 border-b border-[var(--color-line)]">
              <CardTitle className="text-base font-bold text-[var(--color-ink)] flex items-center justify-between">
                <span>Tóm Tắt Đơn Hàng</span>
                <Receipt className="size-4 text-[var(--color-muted)]" />
              </CardTitle>
              <CardDescription className="text-xs text-[var(--color-muted)]">
                Giá trị bên dưới để tham khảo; backend quyết định tổng cuối cùng
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>Số lượng mặt hàng:</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {totalQuantity}
                  </span>
                </div>

                <div className="flex justify-between text-[var(--color-muted)]">
                  <span>Giá trị hàng hóa:</span>
                  <span className="font-bold text-[var(--color-ink)]">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--color-line)] flex justify-between items-baseline">
                <span className="text-xs font-bold text-[var(--color-ink)]">Tạm tính:</span>
                <span className="font-serif text-2xl font-extrabold text-[var(--color-ink)]">
                  {formatVND(totalAmount)}
                </span>
              </div>

              <Button
                type="button"
                variant={createdOrderCode ? "outline" : "default"}
                onClick={handleCheckout}
                disabled={submittingOrder || items.length === 0 || !cartId}
                className="w-full"
              >
                <Sparkles className="size-3.5 mr-1.5" />
                {submittingOrder ? "Đang tạo đơn hàng..." : "Tạo Đơn Hàng"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Created Success Dialog */}
      <Dialog open={createdOrderCode !== null} onOpenChange={(open) => !open && setCreatedOrderCode(null)}>
        <DialogContent size="sm" className="bg-[var(--color-surface)] text-center">
          <DialogHeader className="text-center items-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-tint)] text-[var(--color-leaf)] mb-2">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Đã Tạo Đơn Hàng Thành Công!
            </DialogTitle>
            <DialogDescription className="text-center">
              Đơn hàng đã được backend ghi nhận ở trạng thái CREATED.
            </DialogDescription>
          </DialogHeader>

          {createdOrderCode && <div className="my-4 p-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)] text-center">
            <div className="text-[11px] uppercase font-bold text-[var(--color-muted)]">
              Mã Đơn Hàng
            </div>
            <div className="font-mono text-xl font-extrabold text-[var(--color-ink)] mt-1">
              {createdOrderCode}
            </div>
          </div>}

          <DialogFooter className="sm:justify-center">
            <Link href={"/products" as Route} className="w-full">
              <Button
                type="button"
                onClick={() => setCreatedOrderCode(null)}
                className="w-full"
              >
                Tiếp tục mua hàng
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
