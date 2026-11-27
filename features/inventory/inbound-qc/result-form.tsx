"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Checkbox } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ReceiptEvidenceField } from "../receipt-evidence-field";
import type { ReceiptEvidence } from "../use-receipt-evidence-upload";
import type { InboundLot } from "@/lib/api/inbound-qc";

type Option = { value: string; label: string };
type Extra = { label: string; hint?: string; initial: string; schema: z.ZodType<string, z.ZodTypeDef, string> };
type Props = {
  lot: InboundLot; inspection: string; pass: Option; fail: Option; reasonLabel: string; submitLabel: string;
  busy: boolean; extra?: Extra; onSubmit: (value: string, reason: string, evidenceRefs: string[], extra: string) => void;
};

export function ResultForm({ lot, inspection, pass, fail, reasonLabel, submitLabel, busy, extra, onSubmit }: Props) {
  const [evidence, setEvidence] = useState<ReceiptEvidence>();
  const [attempt] = useState(() => crypto.randomUUID());
  const schema = useMemo(() => z.object({ value: z.string(), reason: z.string(), evidence: z.string(), extra: extra?.schema ?? z.string() }).superRefine((data, ctx) => {
    if (data.value !== fail.value) return;
    if (!data.reason.trim()) ctx.addIssue({ code: "custom", path: ["reason"], message: `Nhập ${reasonLabel.toLowerCase()}.` });
    if (!data.evidence) ctx.addIssue({ code: "custom", path: ["evidence"], message: "Tải ảnh lỗi của lô hàng." });
  }), [extra, fail.value, reasonLabel]);
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({ resolver: zodResolver(schema), mode: "onChange", defaultValues: { value: pass.value, reason: "", evidence: "", extra: extra?.initial ?? "" } });
  const failing = form.watch("value") === fail.value;
  const { errors, isValid } = form.formState;
  const submit = form.handleSubmit(values => {
    if (!busy) onSubmit(values.value, failing ? values.reason.trim() : "", failing && values.evidence ? [values.evidence] : [], values.extra);
  });
  const attach = (next?: ReceiptEvidence) => { setEvidence(next); form.setValue("evidence", next?.media_ref ?? "", { shouldValidate: true }); };
  return <form className="grid min-w-0 gap-4" onSubmit={submit} noValidate>
    {extra && <Field label={extra.label} htmlFor="qc-extra" hint={extra.hint} error={errors.extra?.message}><Input id="qc-extra" {...form.register("extra")} /></Field>}
    <Field label="Kết quả" htmlFor="qc-result">
      <NativeSelect id="qc-result" {...form.register("value")}>
        <NativeSelectOption value={pass.value}>{pass.label}</NativeSelectOption>
        <NativeSelectOption value={fail.value}>{fail.label}</NativeSelectOption>
      </NativeSelect>
    </Field>
    {failing && <>
      <Field label={reasonLabel} htmlFor="qc-reason"><Input id="qc-reason" {...form.register("reason")} /></Field>
      {inspection && lot.goods_receipt_line_id
        ? <ReceiptEvidenceField receipt={lot.goods_receipt_ref} line={lot.goods_receipt_line_id} attempt={attempt} inspection={inspection} purpose="QC_DEFECT" label="Ảnh lỗi của lô hàng" accept="image/jpeg,image/png,image/webp" disabled={busy} hashes={[]} evidence={evidence} onReload={() => attach(undefined)} onChange={attach} />
        : <InlineAlert tone="warning">Chưa tìm thấy phiếu kiểm của lô này nên chưa thể tải ảnh lỗi.</InlineAlert>}
    </>}
    <Button type="submit" disabled={!isValid || busy}>{busy ? "Đang lưu…" : submitLabel}</Button>
  </form>;
}

export const allergenLabels: Record<string, string> = {
  GLUTEN: "Gluten", CRUSTACEANS: "Giáp xác", EGGS: "Trứng", FISH: "Cá", PEANUTS: "Đậu phộng", SOYBEANS: "Đậu nành", MILK: "Sữa",
  TREE_NUTS: "Hạt cây", CELERY: "Cần tây", MUSTARD: "Mù tạt", SESAME: "Mè", SULPHITES: "Sunfit", LUPIN: "Đậu lupin", MOLLUSCS: "Động vật thân mềm",
};

const allergenSchema = z.object({ allergens: z.array(z.string()) });

export function AllergenForm({ initial, busy, onSubmit }: { initial: string[]; busy: boolean; onSubmit: (allergens: string[]) => void }) {
  const form = useForm<z.infer<typeof allergenSchema>>({ resolver: zodResolver(allergenSchema), defaultValues: { allergens: initial } });
  const picked = form.watch("allergens");
  const toggle = (code: string, on: boolean) => form.setValue("allergens", on ? [...picked, code] : picked.filter(item => item !== code));
  return <form className="grid gap-4" onSubmit={form.handleSubmit(values => { if (!busy) onSubmit(values.allergens); })}>
    <fieldset className="grid gap-2 sm:grid-cols-2">
      <legend className="mb-2 text-sm font-medium">Lô này có chứa (để trống nếu không có dị nguyên)</legend>
      {Object.entries(allergenLabels).map(([code, label]) => <Checkbox key={code} label={label} checked={picked.includes(code)} onChange={event => toggle(code, event.target.checked)} />)}
    </fieldset>
    <Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Lưu dị nguyên"}</Button>
  </form>;
}

export function TextForm({ label, hint, initial, submitLabel, busy, onSubmit }: { label: string; hint?: string; initial: string; submitLabel: string; busy: boolean; onSubmit: (text: string) => void }) {
  const form = useForm<{ text: string }>({ resolver: zodResolver(z.object({ text: z.string().trim().min(1, `Nhập ${label.toLowerCase()}.`) })), mode: "onChange", defaultValues: { text: initial } });
  return <form className="grid gap-4" onSubmit={form.handleSubmit(values => { if (!busy) onSubmit(values.text.trim()); })} noValidate>
    <Field label={label} htmlFor="qc-text" hint={hint} error={form.formState.errors.text?.message}><Input id="qc-text" {...form.register("text")} /></Field>
    <Button type="submit" disabled={!form.formState.isValid || busy}>{busy ? "Đang lưu…" : submitLabel}</Button>
  </form>;
}
