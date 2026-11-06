"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/patterns/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { cancelOrder, formatVND, getOrderDisplay } from "@/lib/api/sales";
import { toast } from "@/components/ui/toast";

import { orderStatusLabels } from "./orders-view";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";

export function OrderDetailView({ id }: { id: string }) {
  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderDisplay>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrder(await getOrderDisplay(id)); } catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng"); } finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function handleCancel() {
    if (!reason.trim()) { toast.error("Thiếu lý do", { description: "Nhập lý do trước khi huỷ đơn." }); return; }
    setCancelling(true);
    try { await cancelOrder(id, reason.trim()); await load(); setReason(""); toast.success("Đã huỷ đơn", { description: "Đơn hàng đã được hủy." }); }
    catch (cause) { toast.error("Không thể huỷ đơn", { description: cause instanceof Error ? cause.message : String(cause) }); }
    finally { setCancelling(false); }
  }

  if (loading) return <PageShell><LoadingState title="Đang tải…" className="min-h-64 border-0" /></PageShell>;
  if (error) return <PageShell><InlineAlert>{error}</InlineAlert></PageShell>;
  if (!order) return <PageShell><EmptyState title="Không tìm thấy đơn hàng" /></PageShell>;

  return <PageShell className="space-y-6 py-8"><Link className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)]" href="/orders"><ArrowLeft className="size-4" /> Danh sách đơn</Link><PageHeading title={`${order.order_code ? `${order.order_code} · ` : ""}${new Date(order.created_at).toLocaleString("vi-VN")} · ${orderStatusLabels[order.status] ?? "Đang cập nhật"} · ${formatVND(order.total_vnd)}`} />
    <Card><CardHeader><CardTitle>Thông tin đơn hàng</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><p><span className="text-[var(--muted-foreground)]">Tạo lúc</span><br/><strong>{new Date(order.created_at).toLocaleString("vi-VN")}</strong></p><p><span className="text-[var(--muted-foreground)]">Tạm tính</span><br/><strong>{formatVND(order.subtotal_vnd)}</strong></p><p><span className="text-[var(--muted-foreground)]">Tổng tiền</span><br/><strong>{formatVND(order.total_vnd)}</strong></p></CardContent></Card>
    {order.status === "CREATED" && <Card><CardHeader><CardTitle>Huỷ đơn trước xử lý</CardTitle></CardHeader><CardContent className="space-y-3"><Field label="Lý do" htmlFor="cancel-reason"><Textarea id="cancel-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></Field><Button variant="destructive" disabled={cancelling || !reason.trim()} onClick={() => void handleCancel()}>{cancelling ? "Đang huỷ…" : "Huỷ đơn hàng"}</Button></CardContent></Card>}
  </PageShell>;
}
