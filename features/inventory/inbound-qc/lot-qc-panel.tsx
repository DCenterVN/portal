"use client";

import { Check } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { StatusBadge } from "@/components/patterns/status-badge";
import { formatDate } from "@/lib/format-date";
import { assignStorageLocation, completeInspection, declareAllergens, decideLot, saveSensory, saveShelfLife, saveTemperature, takeSamples, type InboundLot } from "@/lib/api/inbound-qc";
import { parseReceiptDate, formatReceiptDate } from "../receipt-date-input";
import { LocationField } from "./location-field";
import { AllergenForm, ResultForm, TextForm } from "./result-form";
import { lotStatusLabel, lotStatusTone, stepOrder, stepTitle, type StepKey } from "./qc-steps";
import { useLotQc } from "./use-lot-qc";

type Model = ReturnType<typeof useLotQc>;
const pass = { value: "PASS", label: "Đạt" };
const fail = { value: "FAIL", label: "Không đạt" };
const result = (value: string, reason: string, refs: string[]) => ({ result: value === "PASS" ? "PASS" as const : "FAIL" as const, ...(reason ? { failure_reason: reason } : {}), evidence_refs: refs });

const temperature = z.string().trim().regex(/^-?\d+(?:[.,]\d+)?$/, "Nhập nhiệt độ là số.");
const expiry = z.string().refine(text => Boolean(parseReceiptDate(text)), "Nhập ngày hợp lệ theo dd/mm/yyyy.");

function StepForm({ step, model }: { step: StepKey; model: Model }) {
  const { lot, inspection, busy, run } = model;
  const shared = { lot, inspection, pass, fail, reasonLabel: "Lý do không đạt", busy };
  if (step === "allergens") return <AllergenForm initial={lot.allergen_snapshot} busy={busy} onSubmit={list => void run(step, key => declareAllergens(lot.id, list, key), { allergen_snapshot: list })} />;
  if (step === "location") return <LocationField current={lot.storage_location_code} submitLabel="Lưu vị trí" busy={busy} onSubmit={code => void run(step, key => assignStorageLocation(lot.id, code, key), { storage_location_code: code })} />;
  if (step === "samples") return <TextForm label="Ghi chú lấy mẫu" initial="Lấy mẫu đại diện" submitLabel="Xác nhận đã lấy mẫu" busy={busy} onSubmit={note => void run(step, key => takeSamples(inspection, lot.id, note, key), { status: "UNDER_QC" })} />;
  if (step === "sensory") return <ResultForm {...shared} submitLabel="Ghi kết quả cảm quan" onSubmit={(value, reason, refs) => void run(step, key => saveSensory(inspection, result(value, reason, refs), key))} />;
  if (step === "temperature") return <ResultForm {...shared} submitLabel="Ghi kết quả nhiệt độ" extra={{ label: "Nhiệt độ lõi (°C)", initial: "", schema: temperature }} onSubmit={(value, reason, refs, text) => void run(step, key => saveTemperature(inspection, Number(text.replace(",", ".")), result(value, reason, refs), key))} />;
  if (step === "shelfLife") return <ResultForm {...shared} submitLabel="Ghi kết quả hạn dùng" extra={{ label: "Hạn dùng đo được", hint: "dd/mm/yyyy", initial: formatReceiptDate(lot.expires_at.slice(0, 10)), schema: expiry }} onSubmit={(value, reason, refs, text) => void run(step, key => saveShelfLife(inspection, `${parseReceiptDate(text)}T00:00:00+07:00`, result(value, reason, refs), key))} />;
  if (step === "complete") return <ResultForm {...shared} submitLabel="Hoàn tất kiểm" onSubmit={(value, reason, refs) => void run(step, key => completeInspection(inspection, result(value, reason, refs), key))} />;
  return <ResultForm lot={lot} inspection={inspection} pass={{ value: "APPROVE", label: "Duyệt lô" }} fail={{ value: "REJECT", label: "Từ chối lô" }} reasonLabel="Lý do từ chối" submitLabel="Xác nhận quyết định" busy={busy}
    onSubmit={(value, reason, refs) => void run(step, key => decideLot(lot.id, { decision: value === "APPROVE" ? "APPROVE" : "REJECT", reason, evidence_refs: refs }, key), { status: value === "APPROVE" ? "APPROVED" : "QUARANTINED" })} />;
}

export function LotQcPanel({ source, name, onBack }: { source: InboundLot; name: string; onBack: () => void }) {
  const model = useLotQc(source);
  const { lot } = model;
  return <section className="grid min-w-0 gap-4" aria-label="Kiểm đầu vào của lô">
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="outline" onClick={onBack}>Quay lại danh sách</Button>
      <h2 className="text-xl font-semibold">{name}</h2>
      <StatusBadge tone={lotStatusTone[lot.status] ?? "neutral"}>{lotStatusLabel[lot.status] ?? "Đang xử lý"}</StatusBadge>
    </div>
    <p className="text-sm text-muted-foreground">Lô {lot.supplier_lot_code} · {lot.initial_quantity.toLocaleString("vi-VN")} {lot.uom} · Hạn dùng {formatDate(lot.expires_at)}</p>
    {model.inspectionError && <InlineAlert>Không tải được phiếu kiểm của lô này. Tải lại trang để thử lại.</InlineAlert>}
    <ol className="grid gap-3">
      {stepOrder.map(step => {
        const enabled = model.enabled(step);
        const open = model.active === step && enabled;
        return <li key={step} className="grid min-w-0 gap-3 rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">{model.done(step) && <Check className="size-4 text-success" aria-label="Đã xong" />}{stepTitle[step]}</span>
            <Button variant="outline" size="sm" disabled={!enabled} aria-expanded={open} onClick={() => model.open(step)}>{open ? "Đóng" : model.done(step) ? "Làm lại" : "Mở"}</Button>
          </div>
          {open && <StepForm step={step} model={model} />}
        </li>;
      })}
    </ol>
    {model.error && <InlineAlert>{model.error}</InlineAlert>}
  </section>;
}
