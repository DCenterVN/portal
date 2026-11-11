"use client";

import { formatDateTime } from "@/lib/format-date";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { formatVND } from "@/lib/format";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { useOrders } from "./use-orders";

export const orderStatusLabels: Record<string, string> = {
  CANCELLED: "Đã hủy", AWAITING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận", PACKED: "Đã đóng gói", DELIVERING: "Đang giao",
  DELIVERED: "Đã giao", DELIVERY_FAILED: "Giao không thành công", COMPLETED: "Hoàn tất",
};

export function OrdersView() {
  const { orders, loading, error, load } = useOrders();

  return <PageShell className="space-y-6 py-8 border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]">
    <PageHeading title="Đơn hàng của tôi" description="Theo dõi các món bạn đã đặt và tiến độ giao hàng." actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới</Button>} />
    {loading ? <LoadingState title="Đang tải đơn hàng…" className="min-h-48 border-0" /> : error ? <ErrorState title="Không thể tải đơn hàng" description={error} onRetry={() => void load()} /> : orders.length === 0 ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng bạn đặt sẽ hiển thị ở đây." action={<Button asChild variant="outline"><Link href="/products">Chọn sản phẩm</Link></Button>} /> : <div className="grid gap-4">
      {orders.map((order) => <Link key={order.id} className="rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" href={`/orders/${order.id}`}><Card className="border-[var(--color-line)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-input-border)]"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-sm">{order.order_code && <span>{order.order_code} · </span>}{formatDateTime(order.created_at)}</CardTitle></div><StatusBadge tone={order.status === "CANCELLED" ? "danger" : "success"}><span className="text-[var(--color-ink)]">{orderStatusLabels[order.status] ?? "Đang cập nhật"}</span></StatusBadge></CardHeader><CardContent className="flex justify-between text-sm"><strong>{formatVND(order.total_vnd)}</strong></CardContent></Card></Link>)}
    </div>}
  </PageShell>;
}
