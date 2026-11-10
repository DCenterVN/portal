"use client";

import Link from "next/link";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/patterns/empty-state";
import { useTrace } from "./use-trace";
import { TraceLookup } from "./trace-lookup";
import { publicText, qualityLabel, stageLabels } from "./trace-presenter";
import type { PublicTraceability } from "@/lib/api/production";
import type { ReactNode } from "react";

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

function TraceStep({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return <li className="relative pl-12 pb-10 last:pb-0 before:absolute before:bottom-0 before:left-4 before:top-9 before:w-px before:bg-border last:before:hidden">
    <span aria-hidden="true" className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">{number}</span>
    <h3 className="pt-1 text-lg font-semibold">{title}</h3>
    <div className="mt-4 space-y-4 text-sm leading-6">{children}</div>
  </li>;
}

function TraceContent({ trace }: { trace: PublicTraceability }) {
  const production = trace.timeline.filter(step => !["QC", "SHELF_PLACEMENT"].includes(step.stage));
  const quality = trace.timeline.filter(step => step.stage === "QC");
  const shelfPlacement = trace.timeline.filter(step => step.stage === "SHELF_PLACEMENT");
  return <>
    <header className="mt-5">
      <p className="text-sm font-medium text-primary">Hồ sơ nguồn gốc</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{publicText(trace.product_name, "Thông tin món ăn")}</h1>
      <p className="mt-3 text-muted-foreground">{publicText(trace.variant_name)} · Mã {publicText(trace.trace_code, "trên tem hộp món")}</p>
      <p className="mt-2 text-sm text-muted-foreground">Bếp sản xuất: {publicText(trace.production_branch_name)}</p>
    </header>
    <dl className="mt-7 grid gap-5 rounded-[var(--r-6)] bg-muted/40 p-5 sm:grid-cols-3">
      <div><dt className="text-sm text-muted-foreground">Chất lượng thành phẩm</dt><dd className="mt-2 font-medium">{qualityLabel(trace.qc_status)}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Ngày sản xuất</dt><dd className="mt-2 font-medium tabular-nums">{formatDate(trace.produced_at) || "Chưa có thông tin"}</dd></div>
      <div><dt className="text-sm text-muted-foreground">Hạn sử dụng</dt><dd className="mt-2 font-medium tabular-nums">{formatDate(trace.expires_at) || "Chưa có thông tin"}</dd></div>
    </dl>
    <section aria-labelledby="trace-timeline" className="mt-10">
      <h2 id="trace-timeline" className="mb-7 text-xl font-semibold">Hành trình hộp món</h2>
      <ol>
        <TraceStep number="1" title="Lô nguyên liệu">
          {trace.ingredients.length ? trace.ingredients.map((ingredient, index) => <div key={index} className="rounded-[var(--r-6)] bg-muted/40 px-4 py-3">
            <p className="font-medium">{publicText(ingredient.material_name)}</p>
            <p className="mt-1 text-muted-foreground">Nhà cung cấp: {publicText(ingredient.supplier_name)}</p>
            <div className="mt-3 grid gap-x-6 gap-y-1 text-muted-foreground sm:grid-cols-2">
              <p>Ngày nhập: {formatDate(ingredient.received_at) || "Chưa có thông tin"}</p>
              <p>Hạn dùng: {formatDate(ingredient.expires_at) || "Chưa có thông tin"}</p>
              <p>QC đầu vào: {ingredient.inbound_qc?.decision === "PASS" ? "Đạt" : ingredient.inbound_qc?.decision === "FAIL" ? "Không đạt" : "Chưa có thông tin"}</p>
              <p>Ngày kiểm: {formatDateTime(ingredient.inbound_qc?.inspected_at) || "Chưa có thông tin"}</p>
            </div>
          </div>) : <p className="text-muted-foreground">Chưa có thông tin nguyên liệu.</p>}
        </TraceStep>
        <TraceStep number="2" title="Bếp sản xuất">
          <p>Ngày sản xuất: {formatDate(trace.produced_at) || "Chưa có thông tin"}</p>
          {production.map((step, index) => <div key={index} className="flex flex-wrap justify-between gap-x-4 gap-y-1"><span>{stageLabels[step.stage] ?? "Bước sản xuất"}</span><time className="text-muted-foreground tabular-nums">{formatDateTime(step.timestamp)}</time></div>)}
        </TraceStep>
        <TraceStep number="3" title="Kiểm tra chất lượng thành phẩm">
          <p className="font-medium">{qualityLabel(trace.qc_status)}</p>
          {quality.map((step, index) => <p key={index} className="text-muted-foreground">{formatDateTime(step.timestamp)} · {step.passed ? "Đạt" : "Chưa đạt"}</p>)}
          {!quality.length && <p className="text-muted-foreground">Chưa có thời điểm kiểm tra trong hồ sơ công khai.</p>}
        </TraceStep>
        {shelfPlacement.length > 0 && <TraceStep number="4" title={stageLabels.SHELF_PLACEMENT}>
          {shelfPlacement.map((step, index) => <time key={index} className="block text-muted-foreground tabular-nums">{formatDateTime(step.timestamp)}</time>)}
        </TraceStep>}
      </ol>
    </section>
    <section className="mt-12"><h2 className="text-lg font-semibold">Tra cứu hộp món khác</h2><TraceLookup variant="secondary" /></section>
  </>;
}
