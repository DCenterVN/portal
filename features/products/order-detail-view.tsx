"use client";

import { formatDateTime } from "@/lib/format-date";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/patterns/form-field";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { formatVND } from "@/lib/format";

import { orderStatusLabels } from "./orders-view";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/empty-state";
import { useOrderDetail } from "./use-order-detail";

export function OrderDetailView({ id }: { id: string }) {
  const { order, loading, cancelling, reason, setReason, error, load, handleCancel } = useOrderDetail(id);

  if (loading) return <PageShell><LoadingState title="Đang tải…" className="min-h-64 border-0" /></PageShell>;
  if (error) return <PageShell><ErrorState title="Không thể tải đơn hàng" description={error} onRetry={() => void load()} /></PageShell>;
  if (!order) return <PageShell><EmptyState title="Không tìm thấy đơn hàng" /></PageShell>;

  return <PageShell className="space-y-6 py-8"><Link className="inline-flex items-center gap-1 text-sm text-[var(--muted-foreground)]" href="/orders"><ArrowLeft className="size-4" /> Danh sách đơn</Link><PageHeading title={`${order.order_code ? `${order.order_code} · ` : ""}${formatDateTime(order.created_at)} · ${orderStatusLabels[order.status] ?? "Đang cập nhật"} · ${formatVND(order.total_vnd)}`} />
    <Card><CardHeader><CardTitle>Thông tin đơn hàng</CardTitle></CardHeader><CardContent className="grid gap-4 text-sm sm:grid-cols-2"><p><span className="text-[var(--muted-foreground)]">Tạo lúc</span><br/><strong>{formatDateTime(order.created_at)}</strong></p><p><span className="text-[var(--muted-foreground)]">Tạm tính</span><br/><strong>{formatVND(order.subtotal_vnd)}</strong></p><p><span className="text-[var(--muted-foreground)]">Tổng tiền</span><br/><strong>{formatVND(order.total_vnd)}</strong></p></CardContent></Card>
    {order.status === "AWAITING_PAYMENT" && <Card><CardHeader><CardTitle>Huỷ đơn trước xử lý</CardTitle></CardHeader><CardContent className="space-y-3"><Field label="Lý do" htmlFor="cancel-reason"><Textarea id="cancel-reason" maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} /></Field><Button variant="destructive" disabled={cancelling || !reason.trim()} onClick={() => void handleCancel()}>{cancelling ? "Đang huỷ…" : "Huỷ đơn hàng"}</Button></CardContent></Card>}
  </PageShell>;
}
