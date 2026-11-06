"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/patterns/form-field";
import type { EvidencePurpose } from "@/lib/api/goods-receipt-receive";
import { useReceiptEvidenceUpload, type ReceiptEvidence } from "./use-receipt-evidence-upload";

export type { ReceiptEvidence };
type Props = {
  receipt: string; line: string; attempt: string; purpose: EvidencePurpose; label: string;
  accept: string; disabled: boolean; hashes: string[]; evidence?: ReceiptEvidence;
  previous?: File; onReload: () => void; onChange: (evidence?: ReceiptEvidence) => void;
};

export function ReceiptEvidenceField(props: Props) {
  const { file, preview, error, reload, busy, choose, resetCommand } = useReceiptEvidenceUpload(props);
  const id = `${props.line}-${props.purpose}`;
  return <fieldset disabled={props.disabled || busy} className="grid min-w-0 gap-3 rounded-lg border border-border p-4" aria-busy={busy}>
    <Field label={props.label} htmlFor={id} hint="Tối đa 5 MiB. Chọn tệp để tải lên." error={error || undefined}>
      <Input id={id} type="file" accept={props.accept} onChange={event => {
        const chosen = event.target.files?.[0];
        if (chosen) void choose(chosen);
        event.target.value = "";
      }} />
    </Field>
    {preview && <img src={preview} alt={`Xem trước ${props.label.toLowerCase()}`} className="size-24 rounded-lg object-cover" />}
    {file && <p className="break-words text-sm">{file.name}</p>}
    {busy && <p role="status">Đang tải lên…</p>}
    {props.evidence && <p role="status">Đã tải lên</p>}
    {reload && <Button type="button" variant="outline" onClick={() => { resetCommand(); props.onReload(); }}>Tải lại</Button>}
    {error && file && <Button type="button" variant="outline" onClick={() => void choose(file)}>Thử lại</Button>}
    {props.purpose === "DELIVERY_DOCUMENT" && props.previous && !props.evidence && <Button type="button" variant="outline" onClick={() => { if (props.previous) void choose(props.previous); }}>Dùng chứng từ của dòng trước</Button>}
  </fieldset>;
}
