"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { cancelOrder, formatVND, getOrder, type Order } from "@/lib/api/sales";
import { useToast } from "@/components/ui/toast";

export function OrderDetailView({ id }: { id: string }) {
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrder(await getOrder(id)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng"); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function handleCancel() {
    if (!reason.trim()) { toast.error("Thiếu lý do", "Nhập lý do trước khi huỷ đơn."); return; }
    setCancelling(true);
    try { const updated = await cancelOrder(id, reason.trim()); setOrder(updated); setReason(""); toast.success("Đã huỷ đơn", "Sales đã ghi state history và outbox trong cùng transaction."); }
    catch (cause) { toast.error("Không thể huỷ đơn", cause instanceof Error ? cause.message : String(cause)); }
    finally { setCancelling(false); }
  }

  if (loading) return <PageShell><div className="flex min-h-64 items-center justify-center gap-2"><LoaderCircle className="size-5 animate-spin" /> Đang tải…</div></PageShell>;
  if (error || !order) return <PageShell><div role="alert" className="mt-12 border border-rose-500/40 bg-rose-500/10 p-5"><AlertCircle className="mb-2 size-5" />{error || "Không tìm thấy đơn hàng"}</div></PageShell>;

  return <PageShell className="space-y-6 py-8"><Link className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)]" href="/orders"><ArrowLeft className="size-4" /> Danh sách đơn</Link><PageHeader title={`Đơn ${order.id}`} description={`Trạng thái backend: ${order.status}`} />
    <Card><CardHeader><CardTitle>Thông tin đơn hàng</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><p><span className="text-[var(--muted-foreground)]">Giỏ hàng</span><br/><code>{order.cart_ref}</code></p><p><span className="text-[var(--muted-foreground)]">Tạo lúc</span><br/><strong>{new Date(order.created_at).toLocaleString("vi-VN")}</strong></p><p><span className="text-[var(--muted-foreground)]">Tạm tính</span><br/><strong>{formatVND(order.subtotal_vnd)}</strong></p><p><span className="text-[var(--muted-foreground)]">Tổng backend</span><br/><strong>{formatVND(order.total_vnd)}</strong></p></CardContent></Card>
    {order.status === "CREATED" && <Card><CardHeader><CardTitle>Huỷ đơn trước xử lý</CardTitle></CardHeader><CardContent className="space-y-3"><label className="block text-sm font-bold" htmlFor="cancel-reason">Lý do</label><textarea id="cancel-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 w-full border border-[var(--border)] bg-[var(--background)] p-3 text-sm"/><Button variant="destructive" disabled={cancelling || !reason.trim()} onClick={() => void handleCancel()}>{cancelling ? "Đang huỷ…" : "Huỷ đơn hàng"}</Button></CardContent></Card>}
  </PageShell>;
}
