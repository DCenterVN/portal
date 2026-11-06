"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { formatVND, getOrderDisplay } from "@/lib/api/sales";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";

export const orderStatusLabels: Record<string, string> = {
  CREATED: "Đã đặt", CANCELLED: "Đã hủy", AWAITING_PAYMENT: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận", PACKED: "Đã đóng gói", DELIVERING: "Đang giao",
  DELIVERED: "Đã giao", DELIVERY_FAILED: "Giao không thành công", COMPLETED: "Hoàn tất",
};

export function OrdersView() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrderDisplay>>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await getOrderDisplay());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <PageShell className="space-y-6 py-8 border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]">
    <PageHeading title="Đơn hàng của tôi" description="Danh sách được Sales giới hạn theo chủ giỏ của phiên đăng nhập" actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới</Button>} />
    {loading ? <LoadingState title="Đang tải đơn hàng…" className="min-h-48 border-0" /> : error ? <InlineAlert><strong>Không thể tải đơn hàng</strong><p className="mt-1 text-sm text-[var(--color-muted)]">{error}</p></InlineAlert> : orders.length === 0 ? <EmptyState title="Chưa có đơn hàng" description="Đơn hàng bạn đặt sẽ hiển thị ở đây." action={<Button asChild variant="outline"><Link href="/products">Chọn sản phẩm</Link></Button>} /> : <div className="grid gap-4">
      {orders.map((order) => <Link key={order.id} className="rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" href={`/orders/${order.id}`}><Card className="border-[var(--color-line)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-input-border)]"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="text-sm">{order.order_code && <span>{order.order_code} · </span>}{new Date(order.created_at).toLocaleString("vi-VN")}</CardTitle></div><StatusBadge tone={order.status === "CANCELLED" ? "danger" : "success"}><span className="text-[var(--color-ink)]">{orderStatusLabels[order.status] ?? "Đang cập nhật"}</span></StatusBadge></CardHeader><CardContent className="flex justify-between text-sm"><strong>{formatVND(order.total_vnd)}</strong></CardContent></Card></Link>)}
    </div>}
  </PageShell>;
}
