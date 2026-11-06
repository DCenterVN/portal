"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Route } from "next";
import {
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "@/components/ui/toast";
import { Cart, CartItem, clearCart, createOrder, formatVND, getCart, getOrCreateCartId, loadCartItems, recordCartResponse } from "@/lib/api/sales";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";

interface CartViewProps {
  initialCart?: Cart;
}

export function CartView({ initialCart }: CartViewProps) {
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
      toast.error("Giỏ hàng trống", { description: "Vui lòng chọn sản phẩm trước khi tạo đơn." });
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await createOrder(cartId);
      setCreatedOrderCode(order.order_code ?? "");
      toast.success("Tạo đơn hàng thành công", { description: order.order_code ? `Mã đơn: ${order.order_code}` : undefined });
      setItems([]);
      clearCart();
      setCartId("");
    } catch (err: unknown) {
      toast.error("Không thể tạo đơn hàng", { description: err instanceof Error ? err.message : String(err) });
    } finally {
      setSubmittingOrder(false);
    }
  }, [items.length, cartId]);

  return (
    <PageShell className="bg-background text-foreground">
      <div className="mb-4">
        <Link
          href={"/products" as Route}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-semibold transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Tiếp tục chọn sản phẩm
        </Link>
      </div>

      <PageHeading
        title="Giỏ Hàng & Tạo Đơn Hàng"
        badge={
          <Badge variant="outline">
            {items.length} mặt hàng
          </Badge>
        }
        description="Giỏ hiển thị cache từ phản hồi Sales; tổng tiền chính thức luôn do backend tính khi tạo đơn"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column: Cart Items List */}
        <div className="lg:col-span-2">
          <Card className="border-border bg-card overflow-hidden">
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Mặt Hàng & SKU
                    </TableHead>
                    <TableHead className="w-[120px] text-xs font-semibold text-muted-foreground text-right">
                      Đơn Giá
                    </TableHead>
                    <TableHead className="w-[140px] text-xs font-semibold text-muted-foreground text-center">
                      Số Lượng
                    </TableHead>
                    <TableHead className="w-[130px] text-xs font-semibold text-muted-foreground text-right">
                      Thành Tiền
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.product_id} className="border-b border-border">
                      <TableCell>
                        <div className="font-semibold text-xs text-foreground">
                          {item.name}
                        </div>
                        <div className="text-xs font-mono text-muted-foreground mt-0.5">
                          {item.sku_code} · {item.uom}
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-serif font-semibold text-xs text-foreground">
                        {formatVND(item.price_snapshot_vnd)}
                      </TableCell>

                      <TableCell className="text-center text-xs font-semibold text-foreground">
                        {item.quantity}
                      </TableCell>

                      <TableCell className="text-right font-serif font-semibold text-xs text-foreground">
                        {formatVND(item.quantity * item.price_snapshot_vnd)}
                      </TableCell>

                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-16 text-center text-xs text-muted-foreground space-y-3">
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
          <Card className="border-border bg-card p-6 space-y-5">
            <CardHeader className="p-0 pb-4 border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground">
                <span>Tóm Tắt Đơn Hàng</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Giá trị bên dưới để tham khảo; backend quyết định tổng cuối cùng
              </CardDescription>
            </CardHeader>

            <CardContent className="p-0 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Số lượng mặt hàng:</span>
                  <span className="font-semibold text-foreground">
                    {totalQuantity}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Giá trị hàng hóa:</span>
                  <span className="font-semibold text-foreground">
                    {formatVND(totalAmount)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-between items-baseline">
                <span className="text-xs font-semibold text-foreground">Tạm tính:</span>
                <span className="font-serif text-2xl font-semibold text-foreground">
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
                {submittingOrder ? "Đang tạo đơn hàng..." : "Tạo Đơn Hàng"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Created Success Dialog */}
      <Dialog open={createdOrderCode !== null} onOpenChange={(open) => !open && setCreatedOrderCode(null)}>
        <DialogContent className="bg-card text-center sm:max-w-sm">
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-lg font-semibold">
              Đã Tạo Đơn Hàng Thành Công!
            </DialogTitle>
            <DialogDescription className="text-center">
              Đơn hàng đã được backend ghi nhận ở trạng thái CREATED.
            </DialogDescription>
          </DialogHeader>

          {createdOrderCode && <div className="my-4 p-4 rounded-xl border border-border bg-muted text-center">
            <div className="text-xs font-semibold text-muted-foreground">
              Mã Đơn Hàng
            </div>
            <div className="font-mono text-xl font-semibold text-foreground mt-1">
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
