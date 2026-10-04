"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, LoaderCircle, PackageCheck, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { formatVND, getOrders, type Order } from "@/lib/api/sales";

export function OrdersView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOrders(await getOrders());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return <PageShell className="space-y-6 py-8 border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]">
    <PageHeader icon={<PackageCheck />} title="Đơn hàng của tôi" description="Danh sách được Sales giới hạn theo chủ giỏ của phiên đăng nhập" actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới</Button>} />
    {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[var(--color-muted)]"><LoaderCircle className="size-5 animate-spin" /> Đang tải đơn hàng…</div> : error ? <div role="alert" className="border border-[var(--color-danger)] bg-[var(--color-tint)] p-5"><AlertCircle className="mb-2 size-5 text-[var(--color-danger)]" /><strong>Không thể tải đơn hàng</strong><p className="mt-1 text-sm text-[var(--color-muted)]">{error}</p></div> : orders.length === 0 ? <div className="border border-dashed border-[var(--color-line)] p-10 text-center text-sm text-[var(--color-muted)]">Chưa có đơn hàng. <Link className="font-bold text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" href="/products">Chọn sản phẩm</Link></div> : <div className="grid gap-4">
      {orders.map((order) => <Link key={order.id} className="rounded-[var(--radius-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]" href={`/orders/${order.id}`}><Card className="border-[var(--color-line)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-input-border)]"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="font-mono text-sm">{order.id}</CardTitle><p className="mt-1 text-xs text-[var(--color-muted)]">{new Date(order.created_at).toLocaleString("vi-VN")}</p></div><Badge variant={order.status === "CANCELLED" ? "revoked" : "active"}><span className="text-[var(--color-ink)]">{order.status}</span></Badge></CardHeader><CardContent className="flex justify-between text-sm"><span>Giỏ {order.cart_ref}</span><strong>{formatVND(order.total_vnd)}</strong></CardContent></Card></Link>)}
    </div>}
  </PageShell>;
}
