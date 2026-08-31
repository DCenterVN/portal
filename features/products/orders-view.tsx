"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, LoaderCircle, PackageCheck, RefreshCw } from "lucide-react";
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

  return <PageShell className="space-y-6 py-8">
    <PageHeader icon={<PackageCheck />} title="Đơn hàng của tôi" description="Danh sách được Sales giới hạn theo chủ giỏ của phiên đăng nhập" actions={<Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""} /> Làm mới</Button>} />
    {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-5 animate-spin" /> Đang tải đơn hàng…</div> : error ? <div role="alert" className="border border-rose-500/40 bg-rose-500/10 p-5"><AlertCircle className="mb-2 size-5 text-rose-600" /><strong>Không thể tải đơn hàng</strong><p className="mt-1 text-sm text-[var(--muted-foreground)]">{error}</p></div> : orders.length === 0 ? <div className="border border-dashed border-[var(--border)] p-10 text-center text-sm text-[var(--muted-foreground)]">Chưa có đơn hàng. <Link className="font-bold text-[var(--primary)]" href="/products">Chọn sản phẩm</Link></div> : <div className="grid gap-4">
      {orders.map((order) => <Link key={order.id} href={`/orders/${order.id}`}><Card className="transition-colors hover:border-emerald-500/50"><CardHeader className="flex-row items-center justify-between"><div><CardTitle className="font-mono text-sm">{order.id}</CardTitle><p className="mt-1 text-xs text-[var(--muted-foreground)]">{new Date(order.created_at).toLocaleString("vi-VN")}</p></div><span className={order.status === "CANCELLED" ? "text-xs font-bold text-rose-600" : "text-xs font-bold text-emerald-600"}>{order.status}</span></CardHeader><CardContent className="flex justify-between text-sm"><span>Giỏ {order.cart_ref}</span><strong>{formatVND(order.total_vnd)}</strong></CardContent></Card></Link>)}
    </div>}
  </PageShell>;
}
