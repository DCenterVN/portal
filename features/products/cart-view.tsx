"use client";

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
import type { Cart } from "@/lib/api/sales";
import { useState } from "react";
import { formatVND } from "@/lib/format";
import { CheckoutForm } from "./checkout-form";
import { CartItemRow } from "./cart-item-row";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import type { CartItem } from "@/lib/api/sales";
import { useCart } from "./use-cart";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";

interface CartViewProps {
  initialCart?: Cart;
}

export function CartView({ initialCart }: CartViewProps) {
  const cart = useCart(initialCart);
  const { items, cartId, submittingOrder, createdOrderCode, setCreatedOrderCode, loading, error, reload, totalAmount, totalQuantity, changeCheckoutOpen, itemBusy, changeQuantity, removeItem } = cart;
  const [removing, setRemoving] = useState<CartItem | null>(null);
  if (loading) return <PageShell><LoadingState title="Đang tải giỏ hàng…" /></PageShell>;
  if (error) return <PageShell><ErrorState title="Không thể tải giỏ hàng" description={error} onRetry={reload} /></PageShell>;

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
        description="Kiểm tra món và số lượng trước khi đặt đơn."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card overflow-hidden">
            {items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted">
                    <TableHead className="text-xs font-semibold text-muted-foreground">
                      Món đã chọn
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-muted-foreground text-right">
                      Đơn Giá
                    </TableHead>
                    <TableHead className="w-32 text-xs font-semibold text-muted-foreground text-center">
                      Số Lượng
                    </TableHead>
                    <TableHead className="w-28 text-xs font-semibold text-muted-foreground text-right">
                      Thành Tiền
                    </TableHead>
                    <TableHead className="w-12"><span className="sr-only">Xoá món</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => <CartItemRow key={item.product_id} item={item} busy={itemBusy} onQuantity={(target, quantity) => void changeQuantity(target, quantity)} onRemove={setRemoving} />)}
                </TableBody>
              </Table>
            ) : (
              <EmptyState title="Giỏ hàng hiện đang trống" description="Chọn sản phẩm để bắt đầu tạo đơn hàng." action={<Link href={"/products" as Route}><Button size="sm" variant="outline">Xem danh mục sản phẩm</Button></Link>} />
            )}
          </Card>
        </div>

        <div>
          <Card className="border-border bg-card p-6 space-y-5">
            <CardHeader className="p-0 pb-4 border-b border-border">
              <CardTitle className="text-base font-semibold text-foreground">
                <span>Tóm Tắt Đơn Hàng</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Tổng tiền cuối cùng được xác nhận khi đặt đơn.
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
                onClick={() => changeCheckoutOpen(true)}
                disabled={submittingOrder || items.length === 0 || !cartId}
                className="w-full"
              >
                {submittingOrder ? "Đang tạo đơn hàng..." : "Đặt hàng"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <CheckoutForm {...cart} />
      <ConfirmDialog
        open={removing !== null} onOpenChange={(open) => !open && setRemoving(null)}
        title="Bỏ món khỏi giỏ?" description={removing ? `${removing.name} sẽ được xoá khỏi giỏ hàng.` : undefined}
        confirmLabel="Xoá món" danger busy={itemBusy}
        onConfirm={() => { if (removing) void removeItem(removing).then(() => setRemoving(null)); }}
      />
      <Dialog open={createdOrderCode !== null} onOpenChange={(open) => !open && setCreatedOrderCode(null)}>
        <DialogContent className="bg-card text-center sm:max-w-sm">
          <DialogHeader className="text-center items-center">
            <DialogTitle className="text-lg font-semibold">
              Đã Tạo Đơn Hàng Thành Công!
            </DialogTitle>
            <DialogDescription className="text-center">
              Đơn hàng đã được ghi nhận. Bạn có thể theo dõi trong mục đơn hàng.
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
