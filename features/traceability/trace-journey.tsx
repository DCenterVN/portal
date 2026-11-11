"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import type { PublicTraceability } from "@/lib/api/production";
import { publicText, qualityLabel, stageLabels } from "./trace-presenter";

const STEP_MS = 5000;

type Stage = { title: string; summary: string; body: ReactNode };

const inboundLabel = (decision?: string | null) => decision === "PASS" ? "Đạt" : decision === "FAIL" ? "Không đạt" : "Chưa có thông tin";

function ingredientStage(trace: PublicTraceability): Stage {
  const passed = trace.ingredients.filter(item => item.inbound_qc?.decision === "PASS").length;
  return {
    title: "Lô nguyên liệu",
    summary: trace.ingredients.length ? `${trace.ingredients.length} nguyên liệu · ${passed} đạt QC` : "Chưa có thông tin",
    body: trace.ingredients.length ? <ul className="divide-y divide-border rounded-[var(--r-6)] border border-border">
      {trace.ingredients.map((item, index) => <li key={index}>
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 px-4 py-2 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 flex-1 font-medium">{publicText(item.material_name)}</span>
            <StatusBadge tone={statusTone(item.inbound_qc?.decision ?? "")}>{inboundLabel(item.inbound_qc?.decision)}</StatusBadge>
            <ChevronDown aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid gap-x-6 gap-y-1 px-4 pb-4 text-muted-foreground sm:grid-cols-2">
            <p className="sm:col-span-2">Nhà cung cấp: {publicText(item.supplier_name)}</p>
            <p>Ngày nhập: {formatDate(item.received_at) || "Chưa có thông tin"}</p>
            <p>Hạn dùng: {formatDate(item.expires_at) || "Chưa có thông tin"}</p>
            <p>QC đầu vào: {inboundLabel(item.inbound_qc?.decision)}</p>
            <p>Ngày kiểm: {formatDateTime(item.inbound_qc?.inspected_at) || "Chưa có thông tin"}</p>
          </div>
        </details>
      </li>)}
    </ul> : <p className="text-muted-foreground">Chưa có thông tin nguyên liệu.</p>,
  };
}

function timeRows(steps: PublicTraceability["timeline"], label: (step: PublicTraceability["timeline"][number]) => string) {
  return <div className="space-y-2">{steps.map((step, index) => <div key={index} className="flex flex-wrap justify-between gap-x-4 gap-y-1">
    <span>{label(step)}</span><time className="text-muted-foreground tabular-nums">{formatDateTime(step.timestamp)}</time>
  </div>)}</div>;
}

export function traceStages(trace: PublicTraceability): Stage[] {
  const production = trace.timeline.filter(step => !["QC", "SHELF_PLACEMENT"].includes(step.stage));
  const quality = trace.timeline.filter(step => step.stage === "QC");
  const shelf = trace.timeline.filter(step => step.stage === "SHELF_PLACEMENT");
  const stages: Stage[] = [
    ingredientStage(trace),
    {
      title: "Bếp sản xuất",
      summary: production.length ? `${production.length} bước nấu` : "Chưa có thông tin",
      body: <>
        <p>Bếp sản xuất: {publicText(trace.production_branch_name)}</p>
        {timeRows(production, step => stageLabels[step.stage] ?? "Bước sản xuất")}
      </>,
    },
    {
      title: "Kiểm tra chất lượng thành phẩm",
      summary: qualityLabel(trace.qc_status),
      body: quality.length ? timeRows(quality, step => step.passed ? "Đạt" : "Chưa đạt") : <p className="text-muted-foreground">Chưa có thời điểm kiểm tra trong hồ sơ công khai.</p>,
    },
  ];
  if (shelf.length) stages.push({ title: stageLabels.SHELF_PLACEMENT, summary: formatDateTime(shelf[shelf.length - 1].timestamp), body: timeRows(shelf, () => "Đặt lên kệ") });
  return stages;
}

function StepProgress() {
  const [full, setFull] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setFull(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return <span aria-hidden="true" style={{ transitionDuration: `${STEP_MS}ms` }} className={cn("absolute inset-x-0 bottom-0 h-0.5 origin-left bg-primary transition-transform ease-linear", full ? "scale-x-100" : "scale-x-0")} />;
}

export function TraceJourney({ trace }: { trace: PublicTraceability }) {
  const stages = traceStages(trace);
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const running = auto && active < stages.length - 1;

  useEffect(() => {
    if (!running || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setActive(index => index + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [running, active]);

  const pick = (index: number) => { setActive(index); setAuto(false); };
  const replay = () => { setActive(0); setAuto(true); };

  return <section aria-labelledby="trace-timeline" className="mt-10">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id="trace-timeline" className="text-xl font-semibold">Hành trình hộp món</h2>
        <p className="mt-1 text-sm text-muted-foreground">Qua {stages.length} khâu · {trace.timeline.length} bước ghi nhận · {trace.ingredients.length} nguyên liệu</p>
      </div>
      {running ? <Button variant="outline" size="sm" onClick={() => setAuto(false)}>Dừng tự chuyển</Button>
        : <Button variant="outline" size="sm" onClick={replay}>Xem lại từ đầu</Button>}
    </div>
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stages.map((stage, index) => <li key={stage.title} className="min-w-0">
        <Button type="button" variant="outline" onClick={() => pick(index)} aria-current={index === active ? "step" : undefined} aria-controls={`trace-stage-${index}`}
          className={cn("relative h-full w-full flex-col items-start justify-start gap-1 overflow-hidden whitespace-normal p-3 text-left",
            index === active && "border-primary")}>
          <span className="flex items-start gap-2 text-sm font-semibold">
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs", index <= active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index + 1}</span>
            <span className="line-clamp-2">{stage.title}</span>
          </span>
          <span className="line-clamp-2 text-xs text-muted-foreground tabular-nums">{stage.summary}</span>
          {index === active && running && <StepProgress key={active} />}
        </Button>
      </li>)}
    </ol>
    {stages.map((stage, index) => <div key={stage.title} id={`trace-stage-${index}`} role="region" aria-label={stage.title} hidden={index !== active} className="mt-4 space-y-4 rounded-[var(--r-6)] border border-border p-5 text-sm leading-6">
      <h3 className="text-base font-semibold">{stage.title}</h3>
      {stage.body}
    </div>)}
  </section>;
}
