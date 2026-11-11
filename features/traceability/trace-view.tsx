"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format-date";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/empty-state";
import { useTrace } from "./use-trace";
import { TraceLookup } from "./trace-lookup";
import { publicText, qualityLabel } from "./trace-presenter";
import { TraceJourney } from "./trace-journey";
import type { PublicTraceability } from "@/lib/api/production";

export function TraceView({ code = "", trace: initialTrace }: { code?: string; trace?: PublicTraceability }) {
  const { trace, error, loading, retry } = useTrace(initialTrace ? "" : code);
  return <div className="mx-auto max-w-3xl bg-background py-10 md:py-14">
    <Link href="/traceability" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline">← Truy xuất nguồn gốc</Link>
    {initialTrace ? <TraceContent trace={initialTrace} /> : trace ? <TraceContent trace={trace} /> : loading ? <LoadingState title="Đang tải thông tin truy xuất…" /> : <div className="mt-6 max-w-2xl">
      <p className="text-sm font-medium text-primary">Tra cứu hộp món</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{error ? "Chưa thể tra cứu lúc này" : "Chưa tìm thấy mã truy xuất"}</h1>
      <p role="status" className="mt-4 leading-7 text-muted-foreground">{error ? "Hệ thống tạm thời chưa tải được hồ sơ. Bạn có thể thử lại sau ít phút hoặc tra cứu mã khác." : "Bạn kiểm tra lại mã in trên tem hộp món, rồi nhập lại bên dưới. Mã có thể chưa được cập nhật vào hệ thống."}</p>
      {error && <Button variant="secondary" size="touch" className="mt-5" onClick={retry}>Thử lại</Button>}
      <TraceLookup />
    </div>}
  </div>;
}

function TraceContent({ trace }: { trace: PublicTraceability }) {
  return <>
    <header className="mt-5">
      <p className="text-sm font-medium text-primary">Hồ sơ nguồn gốc</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{publicText(trace.product_name, "Thông tin món ăn")}</h1>
      <p className="mt-3 text-muted-foreground">{publicText(trace.variant_name)} · Mã {publicText(trace.trace_code, "trên tem hộp món")}</p>
    </header>
    <dl className="mt-7 grid gap-5 rounded-[var(--r-6)] border border-border p-5 sm:grid-cols-3">
      <div><dt className="text-sm text-muted-foreground">Chất lượng thành phẩm</dt><dd className="mt-2"><StatusBadge tone={statusTone(trace.qc_status)}>{qualityLabel(trace.qc_status)}</StatusBadge></dd></div>
      <div><dt className="text-sm text-muted-foreground">Ngày sản xuất</dt><dd className="mt-2 font-medium tabular-nums">{formatDate(trace.produced_at) || "Chưa có thông tin"}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Hạn sử dụng</dt><dd className="mt-2 font-medium tabular-nums">{formatDate(trace.expires_at) || "Chưa có thông tin"}</dd></div>
    </dl>
    <TraceJourney trace={trace} />
    <section className="mt-12"><h2 className="text-lg font-semibold">Tra cứu hộp món khác</h2><TraceLookup variant="secondary" /></section>
  </>;
}
