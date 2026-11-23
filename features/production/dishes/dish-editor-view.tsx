import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, RefreshCw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/patterns/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import type { DishContent, DishDraft } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { DishTagsField } from "./dish-tags-field";

const kindLabels: Partial<Record<DishDraft["kind"], string>> = { COPY: "Nhân bản món", VARIANT: "Tạo biến thể", REVISION: "Tạo bản sửa" };

export function DishEditorView(props: {
  draft: DishDraft; content: DishContent; ingredientNames: string[];
  saveState: string; busy: boolean; frozen: boolean; conflict: boolean; errors: DishError[]; validationErrors: DishError[]; existingServings: number[];
  onExistingVariant: (setRef: string) => void; onChange: (content: DishContent) => void; onSave: () => void; onComplete: () => void; onDiscard: () => void; onReload: () => void; onBack: () => void; children: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  const [touched, setTouched] = useState(false);
  const locked = props.draft.kind === "VARIANT" || props.draft.kind === "REVISION";
  const error = (field: string) => props.errors.filter(e => e.field === field && !e.row).map(e => e.message).join(". ");
  const completeBlocked = props.busy || props.conflict || (!props.frozen && props.validationErrors.length > 0);
  return <div className="space-y-4">
    <Card><CardContent className="space-y-4 pt-6">
      {kindLabels[props.draft.kind] && <p className="text-sm text-muted-foreground">{kindLabels[props.draft.kind]}</p>}
      {props.frozen && <p role="status">Đang hoàn tất dở. Nội dung đã khoá; bấm Hoàn tất món để tiếp tục hoặc Bỏ nháp.</p>}
      <div className="flex items-end gap-3">
        <Tip label="Về danh sách món"><Button type="button" variant="ghost" size="icon" aria-label="Về danh sách món" onClick={props.onBack}><ArrowLeft aria-hidden="true" /></Button></Tip>
        <fieldset disabled={props.busy || props.frozen || props.conflict} className="flex min-w-0 flex-1 items-end gap-3">
          <div className="min-w-0 flex-1"><Field htmlFor="dish-name" label="Tên món" error={error("name")}><Input id="dish-name" aria-label="Tên món" value={props.content.name ?? ""} readOnly={locked} maxLength={150} onChange={e => props.onChange({ ...props.content, name: e.target.value })} /></Field></div>
          <div className="w-44 shrink-0">{props.draft.kind === "REVISION"
            ? <label>Số suất mỗi hộp<output aria-label="Số suất mỗi hộp" className="block">{props.content.servings} suất</output></label>
            : <Field htmlFor="dish-servings" label="Số suất mỗi hộp" error={error("servings")}><NativeSelect id="dish-servings" aria-label="Số suất mỗi hộp" value={props.content.servings ?? ""} onChange={e => props.onChange({ ...props.content, servings: e.target.value ? Number(e.target.value) : null })}><NativeSelectOption value="">Chọn số suất</NativeSelectOption>{[1, 2, 3, 4, 6].filter(n => props.draft.kind !== "VARIANT" || !props.existingServings.includes(n)).map(n => <NativeSelectOption key={n} value={n}>{n} suất</NativeSelectOption>)}</NativeSelect></Field>}</div>
        </fieldset>
        <div className="flex shrink-0 items-center gap-1">
          {props.conflict
            ? <Tip label="Tải lại"><Button type="button" variant="outline" size="icon" aria-label="Tải lại" onClick={props.onReload}><RefreshCw aria-hidden="true" /></Button></Tip>
            : <Tip label="Lưu nháp"><Button type="button" variant="outline" size="icon" aria-label="Lưu nháp" disabled={props.busy || props.frozen} onClick={props.onSave}><Save aria-hidden="true" /></Button></Tip>}
          <Tip label="Bỏ nháp"><Button type="button" variant="ghost" size="icon" aria-label="Bỏ nháp" disabled={props.busy} onClick={() => setConfirm(true)}><Trash2 aria-hidden="true" /></Button></Tip>
          <Tip label={props.busy ? "Đang hoàn tất…" : "Hoàn tất món"}><Button type="button" size="icon" aria-label="Hoàn tất món" disabled={completeBlocked} onClick={() => { setTouched(true); props.onComplete(); }}><Check aria-hidden="true" /></Button></Tip>
        </div>
      </div>
      <DishTagsField name={props.content.name ?? ""} ingredientNames={props.ingredientNames} tags={props.content.tags} readOnly={locked || props.busy || props.frozen || props.conflict} error={error("tags")} onChange={tags => props.onChange({ ...props.content, tags })} />
      <p role="status" className="text-sm text-muted-foreground">{props.saveState || "Tự lưu nháp sau 2 giây"}</p>
      {props.draft.kind === "REVISION" && <Field htmlFor="dish-reason" label="Lý do sửa" error={error("reason")}><Input id="dish-reason" aria-label="Lý do sửa" maxLength={300} disabled={props.busy || props.frozen || props.conflict} value={props.content.reason ?? ""} onChange={e => props.onChange({ ...props.content, reason: e.target.value })} /></Field>}
      {props.errors.filter(e => e.existing).map(e => <Button key={e.field} variant="outline" onClick={() => { if (e.existing) props.onExistingVariant(e.existing.set_ref); }}>Mở biến thể đã có: {e.existing?.variant_label}</Button>)}
      {props.errors.filter(e => !e.row && !["name", "tags", "servings", "reason", "ingredients", "removable", "slots"].includes(e.field)).map(e => <InlineAlert key={e.field}>{e.message}</InlineAlert>)}
      {touched && props.errors.length > 0 && <InlineAlert>Kiểm tra các ô được đánh dấu trước khi hoàn tất.</InlineAlert>}
      {!props.frozen && props.validationErrors.length > 0 && <p className="text-sm text-muted-foreground">Còn thiếu: {[...new Set(props.validationErrors.map(e => e.message))].join("; ")}</p>}
    </CardContent></Card>
    <fieldset disabled={props.busy || props.frozen || props.conflict} className="min-w-0">{props.children}</fieldset>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Bỏ nháp món?" description="Nội dung nháp này sẽ bị bỏ." confirmLabel="Bỏ nháp" danger busy={props.busy} onConfirm={props.onDiscard} />
  </div>;
}
