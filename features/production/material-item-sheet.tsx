"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ActionButton } from "@/components/patterns/action-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/lib/access-boundary";
import type { MaterialCategory, Material, Unit } from "@/lib/api/material-catalog";
import type { NewMaterial } from "@/lib/api/material-catalog-write";
import { activateMaterial, createMaterial, deleteMaterialImage, suspendMaterial, updateMaterial, uploadMaterialImage, viMessage, NAME_HAS_QUANTITY, UNIT_LOCKED } from "@/lib/api/material-catalog-write";

type Can = (action: string) => boolean;
type Label = "Lưu" | "Duyệt" | "Ngừng dùng…" | "Dùng lại";
const UNITS: { code: Unit; label: string }[] = [{ code: "KG", label: "kg" }, { code: "L", label: "lít" }, { code: "EA", label: "cái" }];

export function actionsFor(material: Material, can: Can): Label[] {
  const labels: Label[] = [];
  if (material.status === "SUSPENDED") return can("sales:material:lifecycle") ? ["Dùng lại"] : labels;
  if (can("sales:material:update")) labels.push("Lưu");
  if (can("sales:material:lifecycle")) labels.push(...(material.status === "DRAFT" ? ["Duyệt" as const] : []), "Ngừng dùng…");
  return labels;
}

export function NameField({ value, onChange, disabled, error }: { value: string; onChange: (value: string) => void; disabled: boolean; error: string }) {
  return <Field data-invalid={error ? true : undefined}>
    <FieldLabel htmlFor="material-name">Tên nguyên liệu</FieldLabel>
    <Input id="material-name" value={value} disabled={disabled} aria-invalid={error ? true : undefined} aria-describedby="material-name-note" onChange={event => onChange(event.target.value)} />
    <p id="material-name-note" className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : undefined}>{error || 'Chỉ ghi tên chung, ví dụ "Ba chỉ lợn". Không ghi khối lượng.'}</p>
  </Field>;
}

export const unitOf = (code: string): Unit | "" => UNITS.find(item => item.code === code)?.code ?? "";

export const locksFor = (material: Material | "new", can: Can) => {
  const open = material === "new" || material.status !== "SUSPENDED";
  return { fields: open && (material === "new" || can("sales:material:update")), image: open && can("sales:material:update") };
};

export function groupChoice(tree: MaterialCategory[], category: string, group: string) {
  const options = (tree.find(item => item.code === category)?.groups ?? []).filter(item => item.active || item.code === group)
    .map(item => ({ code: item.code, label: item.active ? item.label : `${item.label} (đã ngừng)` }));
  return { options, value: options.some(item => item.code === group) ? group : "" };
}

export const materialPatch = (material: Material, body: NewMaterial): Partial<NewMaterial> => {
  const { uom_code: unit, material_group_code: selectedGroup, ...rest } = body;
  return { ...rest, ...(material.status === "DRAFT" ? { uom_code: unit } : {}), ...(selectedGroup.toLowerCase() === material.group ? {} : { material_group_code: selectedGroup }) };
};

export function UnitField({ locked, value, onChange, error }: { locked: boolean; value: Unit | ""; onChange: (value: Unit) => void; error: string }) {
  return <Field data-invalid={error ? true : undefined}>
    <FieldLabel htmlFor="material-don-vi">Đơn vị</FieldLabel>
    <Select value={value} disabled={locked} onValueChange={next => onChange(next as Unit)}>
      <SelectTrigger id="material-don-vi" aria-invalid={error ? true : undefined} className="w-full"><SelectValue placeholder="Chọn đơn vị">{UNITS.find(item => item.code === value)?.label}</SelectValue></SelectTrigger>
      <SelectContent position="popper" align="start">{UNITS.map(item => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
    </Select>
    {(locked || error) && <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : undefined}>{UNIT_LOCKED}</p>}
  </Field>;
}

export function MaterialActions({ labels, busy, blocked = false, onAction }: { labels: Label[]; busy: boolean; blocked?: boolean; onAction: (label: Label) => void }) {
  return <>{labels.map(label => <ActionButton key={label} variant={label === "Lưu" || label === "Duyệt" ? "default" : "outline"} pending={busy && label === "Lưu"} disabled={busy || (blocked && (label === "Lưu" || label === "Duyệt"))} onClick={() => onAction(label)}>{label}</ActionButton>)}</>;
}

function ImageBox({ current, file, canEdit, busy, onPick, onRemove }: { current: string | null; file: File | null; canEdit: boolean; busy: boolean; onPick: (file: File) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const pick = (list: FileList | null) => list?.[0] && onPick(list[0]);
  return <div className="flex flex-col gap-2">
    <div role="selectedGroup" aria-label="Ảnh nguyên liệu" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (canEdit) pick(event.dataTransfer.files); }}
      className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted text-sm text-muted-foreground">
      {current ? <img src={current} alt="Ảnh nguyên liệu" className="size-full object-cover" /> : <span>{file ? file.name : "Kéo ảnh vào đây hoặc chọn file"}</span>}
    </div>
    {canEdit && <div className="flex gap-2">
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Chọn ảnh" onChange={event => pick(event.target.files)} />
      <Button type="button" variant="outline" disabled={busy} onClick={() => input.current?.click()}><ImagePlus aria-hidden="true" />Chọn ảnh</Button>
      {current && <Button type="button" variant="outline" disabled={busy} onClick={onRemove}>Xoá ảnh</Button>}
    </div>}
  </div>;
}

function SelectField({ id, label, value, placeholder, options, onChange, disabled }: { id: string; label: string; value: string; placeholder: string; options: { code: string; label: string }[]; onChange: (value: string) => void; disabled?: boolean }) {
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><Select value={value} disabled={disabled} onValueChange={onChange}>
    <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder}>{options.find(item => item.code === value)?.label}</SelectValue></SelectTrigger>
    <SelectContent position="popper" align="start">{options.map(item => <SelectItem key={item.code} value={item.code}>{item.label}</SelectItem>)}</SelectContent>
  </Select></Field>;
}

type Props = { target: Material | "new" | null; tree: MaterialCategory[]; defaultCategory: string; onClose: () => void; onSaved: () => void };

export function MaterialItemSheet({ target, tree, defaultCategory, onClose, onSaved }: Props) {
  const { can } = useAccess();
  const material = target && target !== "new" ? target : null;
  const [name, setName] = useState(material?.name ?? "");
  const [category, setCategory] = useState(material?.category ?? defaultCategory);
  const [group, setGroup] = useState(material ? material.group : tree.find(item => item.code === defaultCategory)?.groups.find(item => item.active)?.code ?? "");
  const [unit, setUnit] = useState<Unit | "">(material ? unitOf(material.unit) : "KG");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(material?.imageUrl ?? null);
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { options, value: selectedGroup } = groupChoice(tree, category, group);
  const { fields: canEdit, image: canImage } = locksFor(target === "new" ? "new" : material ?? "new", can);
  const ready = name.trim() !== "" && selectedGroup !== "" && unit !== "" && !busy;

  async function run(job: () => Promise<unknown>, close = true) {
    setBusy(true); setError("");
    try { await job(); onSaved(); if (close) onClose(); }
    catch (cause) { setError(viMessage(cause, "material")); }
    finally { setBusy(false); }
  }
  const body = { name: name.trim(), uom_code: unit as Unit, material_group_code: selectedGroup.toUpperCase() };
  const create = () => run(async () => {
    const made = await createMaterial(body);
    if (file && canImage) await uploadMaterialImage(made.id, file);
  });
  const pickImage = (picked: File) => {
    if (!material) { setFile(picked); return; }
    run(async () => { await uploadMaterialImage(material.id, picked); setImageUrl(URL.createObjectURL(picked)); }, false);
  };
  const onAction = (label: Label) => {
    if (!material) return;
    if (label === "Lưu") run(() => updateMaterial(material.id, materialPatch(material, body)));
    if (label === "Duyệt" || label === "Dùng lại") run(() => activateMaterial(material.id));
    if (label === "Ngừng dùng…") setAsking(true);
  };
  const title = material ? "Chi tiết nguyên liệu" : can("sales:material:update") ? "Thêm nguyên liệu" : "Đề xuất nguyên liệu";

  return <Sheet open={target !== null} onOpenChange={open => !open && !busy && onClose()}>
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{material ? "Sửa thông tin, đổi ảnh hoặc ngừng dùng nguyên liệu này." : "Nguyên liệu mới của kho ra ở trạng thái nháp, bếp sẽ duyệt."}</SheetDescription></SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <ImageBox current={imageUrl} file={file} canEdit={canImage} busy={busy} onPick={pickImage} onRemove={() => run(async () => { await deleteMaterialImage(material!.id); setImageUrl(null); }, false)} />
        <NameField value={name} onChange={setName} disabled={!canEdit} error={error === NAME_HAS_QUANTITY ? error : ""} />
        <SelectField id="material-category" label="Loại" value={category} placeholder="Chưa xếp loại" disabled={!canEdit} options={tree.filter(item => item.active)} onChange={value => { setCategory(value); setGroup(tree.find(item => item.code === value)?.groups.find(item => item.active)?.code ?? ""); }} />
        <SelectField id="material-group" label="Nhóm" value={selectedGroup} placeholder="Chọn nhóm" disabled={!canEdit} options={options} onChange={setGroup} />
        <UnitField locked={!!material && material.status !== "DRAFT"} value={unit} onChange={setUnit} error={error === UNIT_LOCKED ? error : ""} />
        {error && error !== NAME_HAS_QUANTITY && error !== UNIT_LOCKED && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <SheetFooter className="flex-row justify-end">
        {material ? <MaterialActions labels={actionsFor(material, can)} busy={busy} blocked={unit === ""} onAction={onAction} /> : <ActionButton pending={busy} disabled={!ready} onClick={create}>{title}</ActionButton>}
      </SheetFooter>
      <ConfirmDialog open={asking} onOpenChange={setAsking} title="Ngừng dùng nguyên liệu này?" description="Nguyên liệu sẽ không chọn được nữa. Hãy ghi lý do." confirmLabel="Ngừng dùng" danger busy={busy} confirmDisabled={reason.trim() === ""}
        onConfirm={() => run(() => suspendMaterial(material!.id, reason))}>
        <Textarea aria-label="Lý do ngừng dùng" value={reason} onChange={event => setReason(event.target.value)} placeholder="Lý do (bắt buộc)" />
      </ConfirmDialog>
    </SheetContent>
  </Sheet>;
}
