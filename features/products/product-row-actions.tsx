"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { RowActions } from "@/components/patterns/row-actions";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Field } from "@/components/patterns/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { ProductResumeVariantsDialog } from "./product-resume-variants-dialog";
import { deleteProduct, resumeProduct, suspendProduct, updateProduct } from "@/lib/api/product-lifecycle";
import type { Product } from "@/lib/api/sales";

const editSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên sản phẩm").max(200, "Tên tối đa 200 ký tự"),
  description: z.string().trim().max(2000, "Mô tả tối đa 2000 ký tự"),
});
type EditValues = z.infer<typeof editSchema>;
type Mode = "edit" | "suspend" | "resume" | "variants" | "delete" | null;
const failure = (error: unknown) => error instanceof Error ? error.message : "Không thực hiện được. Vui lòng thử lại.";

function EditDialog({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: () => Promise<void> }) {
  const form = useForm<EditValues>({ resolver: zodResolver(editSchema), mode: "onTouched", defaultValues: { name: product.name, description: product.description ?? "" } });
  const { errors, isSubmitting, isDirty } = form.formState;
  async function submit(values: EditValues) {
    try { await updateProduct(product.id, values); toast.success("Đã lưu sản phẩm."); await onDone(); onClose(); }
    catch (error) { form.setError("root", { message: failure(error) }); }
  }
  return <Dialog open onOpenChange={open => !open && !isSubmitting && onClose()}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader><DialogTitle>Sửa sản phẩm</DialogTitle><DialogDescription>{product.sku_code}</DialogDescription></DialogHeader>
      <form id="product-edit" onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
        <Field label="Tên sản phẩm" htmlFor="product-name" error={errors.name?.message}><Input id="product-name" {...form.register("name")} disabled={isSubmitting} /></Field>
        <Field label="Mô tả" htmlFor="product-description" error={errors.description?.message}><Textarea id="product-description" rows={4} {...form.register("description")} disabled={isSubmitting} /></Field>
        {errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}
      </form>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Huỷ</Button>
        <Button type="submit" form="product-edit" disabled={!isDirty || isSubmitting}>{isSubmitting ? "Đang lưu…" : "Lưu"}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}

export function ProductRowActions({ product, canUpdate, canDelete, onChanged }: { product: Product; canUpdate: boolean; canDelete: boolean; onChanged: () => Promise<void> }) {
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<void>, message: string) {
    setBusy(true);
    try { await action(); toast.success(message); setMode(null); await onChanged(); }
    catch (error) { toast.error(failure(error)); }
    finally { setBusy(false); }
  }
  return <>
    <RowActions label={product.name} actions={[
      { label: "Sửa", icon: Pencil, onSelect: () => setMode("edit"), hidden: !canUpdate },
      { label: "Ngừng bán", icon: Ban, onSelect: () => { setReason(""); setMode("suspend"); }, hidden: !canUpdate || product.status !== "ACTIVE" },
      { label: "Mở bán lại", icon: RotateCcw, onSelect: () => { setReason(""); setMode("resume"); }, hidden: !canUpdate || product.status !== "SUSPENDED" },
      { label: "Mở bán lại suất bán", icon: RotateCcw, onSelect: () => setMode("variants"), hidden: !canUpdate || product.status !== "ACTIVE" },
      { label: "Xoá", icon: Trash2, danger: true, onSelect: () => setMode("delete"), hidden: !canDelete || product.status !== "DRAFT" },
    ]} />
    {mode === "edit" && <EditDialog product={product} onClose={() => setMode(null)} onDone={onChanged} />}
    <ConfirmDialog open={mode === "suspend"} onOpenChange={open => !open && setMode(null)} title={`Ngừng bán ${product.name}?`}
      description="Khách sẽ không đặt được sản phẩm này cho tới khi mở bán lại." confirmLabel="Ngừng bán" danger busy={busy}
      confirmDisabled={!reason.trim()} onConfirm={() => void run(() => suspendProduct(product.id, reason.trim()), "Đã ngừng bán sản phẩm.")}>
      <Field label="Lý do" htmlFor="suspend-reason"><Textarea id="suspend-reason" rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ví dụ: hết mùa nguyên liệu" /></Field>
    </ConfirmDialog>
    <ConfirmDialog open={mode === "resume"} onOpenChange={open => !open && setMode(null)} title={`Mở bán lại ${product.name}?`}
      description="Khách đặt được lại sản phẩm này. Các suất bán đã ngừng theo sản phẩm và còn giá hợp lệ cũng được mở lại." confirmLabel="Mở bán lại" busy={busy}
      confirmDisabled={!reason.trim()} onConfirm={() => void run(() => resumeProduct(product.id, reason.trim()), "Đã mở bán lại sản phẩm.")}>
      <Field label="Lý do" htmlFor="resume-reason"><Textarea id="resume-reason" rows={3} value={reason} onChange={event => setReason(event.target.value)} placeholder="Ví dụ: đã có lại nguyên liệu" /></Field>
    </ConfirmDialog>
    {mode === "variants" && <ProductResumeVariantsDialog product={product} onClose={() => setMode(null)} onDone={onChanged} />}
    <ConfirmDialog open={mode === "delete"} onOpenChange={open => !open && setMode(null)} title={`Xoá bản nháp ${product.name}?`}
      description="Bản nháp bị xoá sẽ không khôi phục được." confirmLabel="Xoá" danger busy={busy}
      onConfirm={() => void run(() => deleteProduct(product.id), "Đã xoá bản nháp.")} />
  </>;
}
