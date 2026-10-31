import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, Select } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EntityPicker, fold } from "@/components/ui/entity-picker";
import type { DishContent, DishDraft } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
export function DishEditorView(props: {
  draft: DishDraft; content: DishContent; categories: { id: string; name: string }[]; categoryLoading: boolean;
  saveState: string; busy: boolean; frozen: boolean; conflict: boolean; errors: DishError[]; validationErrors: DishError[]; existingServings: number[];
  onExistingVariant: (setRef: string) => void; onChange: (content: DishContent) => void; onSave: () => void; onComplete: () => void; onDiscard: () => void; onReload: () => void; onBack: () => void; children: ReactNode;
}) {
  const [confirm, setConfirm] = useState(false);
  const [tagText, setTagText] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const locked = props.draft.kind === "VARIANT" || props.draft.kind === "REVISION";
  const error = (field: string) => props.errors.filter(e => e.field === field && !e.row).map(e => e.message).join(". ");
  const suggested = [...new Set(fold(props.content.name ?? "").split(/[^a-z0-9]+/).filter(word => word.length > 1))].slice(0, 8);
  return <div className="space-y-6">
    <Button variant="ghost" onClick={props.onBack}>Về danh sách món</Button>
    <Card><CardContent className="space-y-4 pt-6"><h2>{props.draft.kind === "COPY" ? "Nhân bản món" : props.draft.kind === "VARIANT" ? "Tạo biến thể" : props.draft.kind === "REVISION" ? "Tạo bản sửa" : "Soạn món"}</h2>
      {props.frozen && <p role="status">Đang hoàn tất dở. Nội dung đã khoá; bấm Hoàn tất món để tiếp tục hoặc Bỏ nháp.</p>}
      <fieldset disabled={props.busy || props.frozen || props.conflict} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2"><Field htmlFor="dish-name" label="Tên món" error={error("name")}><Input id="dish-name" aria-label="Tên món" value={props.content.name ?? ""} readOnly={locked} maxLength={150} onChange={e => props.onChange({ ...props.content, name: e.target.value })} /></Field>
          {locked ? <label>Danh mục<output aria-label="Danh mục" className="block">{props.categories.find(item => item.id === props.content.category_ref)?.name ?? "Danh mục món nguồn"}</output></label> : <EntityPicker name="dish-category" label="Danh mục" value={props.content.category_ref} items={props.categories} status={props.categoryLoading ? "loading" : "ready"} getId={item => item.id} getLabel={item => item.name} onChange={id => props.onChange({ ...props.content, category_ref: id })} error={error("category_ref")} serializeValue={false} />}
          <Field htmlFor="dish-tags" label="Hashtag" error={error("tags")}><Input id="dish-tags" aria-label="Hashtag" value={tagText ?? props.content.tags.join(", ")} onChange={e => { setTagText(e.target.value); props.onChange({ ...props.content, tags: e.target.value.split(/[,#]+/).map(tag => tag.trim().replace(/\s+/g, "-")).filter(Boolean) }); }} /><p className="text-sm text-fg-3">3–8 nhãn, ngăn bằng dấu phẩy.</p></Field>
          {props.draft.kind === "REVISION" ? <label>Khẩu phần<output aria-label="Khẩu phần" className="block">{props.content.servings} người</output></label> : <Field htmlFor="dish-servings" label="Khẩu phần" error={error("servings")}><Select id="dish-servings" aria-label="Khẩu phần" value={props.content.servings ?? ""} onChange={e => props.onChange({ ...props.content, servings: e.target.value ? Number(e.target.value) : null })}><option value="">Chọn khẩu phần</option>{[1, 2, 3, 4, 6].filter(n => props.draft.kind !== "VARIANT" || !props.existingServings.includes(n)).map(n => <option key={n} value={n}>{n} người</option>)}</Select></Field>}
        </div>
        {!locked && suggested.length >= 3 && <Button type="button" variant="ghost" onClick={() => { setTagText(null); props.onChange({ ...props.content, tags: suggested }); }}>Dùng hashtag gợi ý: {suggested.join(", ")}</Button>}
        {props.children}
        {props.draft.kind === "REVISION" && <Field htmlFor="dish-reason" label="Lý do sửa" error={error("reason")}><Input id="dish-reason" aria-label="Lý do sửa" maxLength={300} value={props.content.reason ?? ""} onChange={e => props.onChange({ ...props.content, reason: e.target.value })} /></Field>}
      </fieldset>
      {props.errors.filter(e => e.existing).map(e => <Button key={e.field} variant="outline" onClick={() => { if (e.existing) props.onExistingVariant(e.existing.set_ref); }}>Mở biến thể đã có: {e.existing?.variant_label}</Button>)}
      {props.errors.filter(e => !e.row && !["name", "category_ref", "tags", "servings", "reason"].includes(e.field)).map(e => <p key={e.field} role="alert">{e.message}</p>)}
      {touched && props.errors.length > 0 && <p role="alert">Kiểm tra các ô được đánh dấu trước khi hoàn tất.</p>}
      <div className="flex flex-wrap items-center gap-3"><p role="status">{props.saveState || "Tự lưu nháp sau 2 giây"}</p>
        {props.conflict ? <Button variant="outline" onClick={props.onReload}>Tải lại</Button> : <Button variant="outline" disabled={props.busy || props.frozen} onClick={props.onSave}>Lưu nháp</Button>}
        <Button variant="ghost" disabled={props.busy} onClick={() => setConfirm(true)}>Bỏ nháp</Button>
        <Button disabled={props.busy || props.conflict || (!props.frozen && props.validationErrors.length > 0)} onClick={() => { setTouched(true); props.onComplete(); }}>{props.busy ? "Đang hoàn tất…" : "Hoàn tất món"}</Button>
      </div>
      {!props.frozen && props.validationErrors.length > 0 && <p>Còn thiếu: {[...new Set(props.validationErrors.map(e => e.message))].join("; ")}</p>}
    </CardContent></Card>
    <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Bỏ nháp món?" description="Nội dung nháp này sẽ bị bỏ." confirmLabel="Bỏ nháp" danger busy={props.busy} onConfirm={props.onDiscard} />
  </div>;
}
