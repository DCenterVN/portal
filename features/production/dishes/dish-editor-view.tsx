import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/patterns/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import { MAX_VARIANT_NOTE_LENGTH, SERVING_OPTIONS, type DishContent, type DishDraft } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { DishTagsField } from "./dish-tags-field";

const kindLabels: Partial<Record<DishDraft["kind"], string>> = { COPY: "Nhân bản món", VARIANT: "Tạo biến thể", REVISION: "Tạo bản sửa" };

export function DishEditorView(props: {
  draft: DishDraft; content: DishContent; ingredientNames: string[];
  saveState: string; busy: boolean; frozen: boolean; conflict: boolean; canEditName?: boolean; catalogReady?: boolean; backLabel?: string; errors: DishError[]; validationErrors: DishError[]; existingServings: number[];
  onExistingVariant: (setRef: string) => void; onChange: (content: DishContent) => void; onSave: () => void; onComplete: () => void; onDiscard: () => void; onReload: () => void; onBack: () => void; children: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const nameLocked = props.draft.kind === "VARIANT" || (props.draft.kind === "REVISION" && props.canEditName === false);
  const tagsLocked = props.draft.kind === "VARIANT";
  useEffect(() => {
    if (props.draft.kind === "COPY" && !nameLocked && !props.frozen && /\(bản sao\)\s*$/i.test(props.content.name ?? "")) {
      nameRef.current?.focus();
      nameRef.current?.select();
    }
  }, [props.draft.id, props.draft.kind, nameLocked, props.frozen]);
  const error = (field: string) => props.errors.filter(e => e.field === field && !e.row).map(e => e.message).join(". ");
  const completeBlocked = props.busy || props.conflict || (!props.frozen && props.validationErrors.length > 0);
  const existingErrors = props.errors.filter(e => e.existing);
  const missing = !props.frozen ? [...new Set(props.validationErrors.map(e => e.message))] : [];
  const skipGeneral = new Set(["name", "tags", "servings", "variant_note", "reason", "ingredients", "removable", "slots", ...(missing.length > 0 ? ["cost"] : [])]);
  const generalErrors = props.errors.filter(e => !e.row && !skipGeneral.has(e.field));
  const backLabel = props.backLabel ?? "Về danh sách món";
  return <div className="space-y-4">
    <Card className="gap-3 py-4"><CardContent className="space-y-3 px-5">
      <div className="flex flex-wrap items-center gap-2">
        <Tip label={backLabel}><Button type="button" variant="ghost" size="icon-sm" aria-label={backLabel} onClick={props.onBack}><ArrowLeft aria-hidden="true" /></Button></Tip>
        {kindLabels[props.draft.kind] && <span className="text-sm font-medium text-muted-foreground">{kindLabels[props.draft.kind]}</span>}
        <div className="ml-auto flex items-center gap-1.5">
          <span role="status" className="mr-1 text-xs text-muted-foreground">{props.saveState || "Tự lưu nháp sau 2 giây"}</span>
          {props.conflict
            ? <Tip label="Tải lại"><Button type="button" variant="outline" size="icon-sm" aria-label="Tải lại" onClick={props.onReload}><RefreshCw aria-hidden="true" /></Button></Tip>
            : <Tip label="Lưu nháp"><Button type="button" variant="outline" size="icon-sm" aria-label="Lưu nháp" disabled={props.busy || props.frozen} onClick={props.onSave}><Save aria-hidden="true" /></Button></Tip>}
          <Tip label="Bỏ nháp"><Button type="button" variant="ghost" size="icon-sm" aria-label="Bỏ nháp" disabled={props.busy} onClick={() => setConfirm(true)}><Trash2 className="text-destructive" aria-hidden="true" /></Button></Tip>
          <Button type="button" size="sm" disabled={completeBlocked} onClick={() => { setTouched(true); props.onComplete(); }}>
            <Check data-icon="inline-start" aria-hidden="true" />
            {props.busy ? "Đang hoàn tất…" : "Hoàn tất món"}
          </Button>
        </div>
      </div>
      {props.frozen && <InlineAlert tone="info">Đang hoàn tất dở. Nội dung đã khoá; bấm Hoàn tất món để tiếp tục hoặc Bỏ nháp.</InlineAlert>}
      <fieldset disabled={props.busy || props.frozen || props.conflict} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_240px]">
        <Field htmlFor="dish-name" label="Tên món" error={error("name")}><Input ref={nameRef} id="dish-name" aria-label="Tên món" value={props.content.name ?? ""} readOnly={nameLocked} maxLength={150} onChange={e => props.onChange({ ...props.content, name: e.target.value })} /></Field>
        <div>{props.draft.kind === "REVISION"
          ? <div className="grid gap-1.5"><span className="text-sm font-medium">Số suất mỗi hộp</span><output aria-label="Số suất mỗi hộp" className="flex h-9 items-center text-sm font-medium">{props.content.servings} suất</output></div>
          : <Field htmlFor="dish-servings" label="Số suất mỗi hộp" error={error("servings")}><Select disabled={props.busy || props.frozen || props.conflict} value={props.content.servings ? String(props.content.servings) : ""} onValueChange={value => props.onChange({ ...props.content, servings: value ? Number(value) : null })}><SelectTrigger id="dish-servings" aria-label="Số suất mỗi hộp" className="w-full"><SelectValue placeholder="Chọn số suất" /></SelectTrigger><SelectContent position="popper" align="start">{SERVING_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{n} suất</SelectItem>)}</SelectContent></Select></Field>}</div>
        <div>{props.draft.kind === "REVISION"
          ? <div className="grid gap-1.5"><span className="text-sm font-medium">Nhãn biến thể</span><output aria-label="Nhãn biến thể" className="flex h-9 items-center text-sm text-muted-foreground">{props.content.variant_note || "Mặc định"}</output></div>
          : <Field htmlFor="dish-variant-note" label="Nhãn biến thể (tuỳ chọn)" hint="Phân biệt cốt / vị giữa các biến thể" error={error("variant_note")}><Input id="dish-variant-note" aria-label="Nhãn biến thể" placeholder="Ví dụ: Cốt bò, Cốt chua cay…" maxLength={MAX_VARIANT_NOTE_LENGTH} value={props.content.variant_note ?? ""} onChange={e => props.onChange({ ...props.content, variant_note: e.target.value })} /></Field>}</div>
      </fieldset>
      <DishTagsField name={props.content.name ?? ""} ingredientNames={props.ingredientNames} tags={props.content.tags} readOnly={tagsLocked || props.busy || props.frozen || props.conflict} catalogReady={props.catalogReady} error={error("tags")} onChange={tags => props.onChange({ ...props.content, tags })} />
      {props.draft.kind === "REVISION" && <Field htmlFor="dish-reason" label="Lý do sửa" hint="Lưu vào lịch sử bản sửa" error={error("reason")}><Input id="dish-reason" aria-label="Lý do sửa" placeholder="Ví dụ: đổi thăn bò sang bắp, giảm bún còn 180 g" maxLength={300} disabled={props.busy || props.frozen || props.conflict} value={props.content.reason ?? ""} onChange={e => props.onChange({ ...props.content, reason: e.target.value })} /></Field>}
      {existingErrors.map(e => <Button key={e.field} variant="outline" size="sm" onClick={() => { if (e.existing) props.onExistingVariant(e.existing.set_ref); }}>Mở biến thể đã có: {e.existing?.variant_label}</Button>)}
      {generalErrors.map(e => <InlineAlert key={e.field}>{e.message}</InlineAlert>)}
      {missing.length > 0
        ? (touched && props.errors.length > 0
          ? <InlineAlert>Còn thiếu: {missing.join("; ")}</InlineAlert>
          : <p className="text-xs text-muted-foreground">Còn thiếu: {missing.join("; ")}</p>)
        : touched && props.errors.length > 0 && !generalErrors.length && <InlineAlert>Kiểm tra các ô được đánh dấu trước khi hoàn tất.</InlineAlert>}
    </CardContent></Card>
    <div className="min-w-0">{props.children}</div>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Bỏ nháp món?" description="Nội dung nháp này sẽ bị bỏ." confirmLabel="Bỏ nháp" danger busy={props.busy} onConfirm={props.onDiscard} />
  </div>;
}
