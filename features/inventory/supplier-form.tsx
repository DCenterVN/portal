"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Checkbox } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { getMaterials, type MaterialPage } from "@/lib/api/sales";
import { createSupplier, updateSupplier, type Supplier } from "@/lib/api/suppliers";
import { useAccess } from "@/lib/access-boundary";

export function SupplierForm({ supplier, onClose, onSaved }: { supplier?: Supplier; onClose: () => void; onSaved: (supplier: Supplier) => void }) {
  const { can } = useAccess();
  const allowed = can(supplier ? "inventory:supplier:update" : "inventory:supplier:create");
  const [name, setName] = useState(supplier?.name ?? "");
  const [code, setCode] = useState(supplier?.code ?? "");
  const [tax, setTax] = useState(supplier?.tax_code ?? "");
  const [selected, setSelected] = useState(supplier?.material_categories ?? []);
  const [categories, setCategories] = useState<MaterialPage["categories"] | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const command = useRef({ body: "", key: "" });
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    getMaterials().then(page => { if (live) { setCategories(page.categories); setLookupError(false); } }).catch(() => { if (live) setLookupError(true); });
    return () => { live = false; };
  }, [allowed, attempt]);
  const valid = allowed && name.trim() && code.trim() && categories !== null && !lookupError && selected.every(id => categories.some(category => category.id === id));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || busy) return;
    const body = { code: code.trim(), name: name.trim(), tax_code: tax.trim(), material_categories: selected };
    const encoded = JSON.stringify(body);
    if (command.current.body !== encoded) command.current = { body: encoded, key: crypto.randomUUID() };
    setBusy(true); setError("");
    try {
      const saved = supplier ? await updateSupplier(supplier.id, { name: body.name, tax_code: body.tax_code, material_categories: selected }, command.current.key) : await createSupplier(body, command.current.key);
      onSaved(saved);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không lưu được nhà cung cấp"); }
    finally { setBusy(false); }
  }

  return <>
    <Dialog open onOpenChange={open => { if (!open && !busy) { if (dirty) setDiscard(true); else onClose(); } }}>
      <DialogContent variant="sheet" className="md:fixed md:right-0 md:top-0 md:h-dvh md:rounded-none overflow-y-auto">
        <DialogHeader><DialogTitle>{supplier ? "Sửa nhà cung cấp" : "Thêm nhà cung cấp"}</DialogTitle><DialogDescription>Mã giữ nguyên sau khi tạo. Nhóm nguyên liệu lấy từ danh mục hiện có.</DialogDescription></DialogHeader>
        {!allowed ? <ErrorState denied title="Bạn không có quyền lưu nhà cung cấp" /> : <form onSubmit={submit} onChange={() => setDirty(true)} className="grid gap-4">
          <Field label="Mã nhà cung cấp" htmlFor="supplier-code" hint={supplier ? "Mã không thay đổi sau tạo." : "Ví dụ NCC-GAO-AN-BINH"}><TextInput id="supplier-code" value={code} onChange={event => setCode(event.target.value)} required disabled={Boolean(supplier) || busy} autoFocus /></Field>
          <Field label="Tên nhà cung cấp" htmlFor="supplier-name"><TextInput id="supplier-name" value={name} onChange={event => setName(event.target.value)} required disabled={busy} /></Field>
          <Field label="Mã số thuế" htmlFor="supplier-tax"><TextInput id="supplier-tax" value={tax} onChange={event => setTax(event.target.value)} disabled={busy} /></Field>
          <fieldset disabled={busy} className="grid gap-2"><legend>Nhóm nguyên liệu</legend>
            {lookupError ? <ErrorState title="Không tải được danh mục nhóm nguyên liệu" onRetry={() => setAttempt(value => value + 1)} /> : categories === null ? <Skeleton title="Đang tải nhóm nguyên liệu" /> : categories.length === 0 ? <EmptyState title="Danh mục chưa có nhóm nguyên liệu" /> : categories.map(category => <Checkbox key={category.id} label={category.name} checked={selected.includes(category.id)} onChange={event => setSelected(items => event.target.checked ? [...items, category.id] : items.filter(id => id !== category.id))} />)}
          </fieldset>
          {error && <p role="alert">{error}</p>}
          {!valid && <p className="text-sm text-fg-3">Nhập mã, tên và chờ danh mục nhóm nguyên liệu tải xong để lưu.</p>}
          <DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Huỷ</Button><Button type="submit" disabled={!valid || busy}>{busy ? "Đang lưu…" : "Lưu nhà cung cấp"}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="Bỏ thay đổi nhà cung cấp?" description="Các thông tin chưa lưu sẽ bị bỏ." confirmLabel="Bỏ thay đổi" onConfirm={onClose} />
  </>;
}
