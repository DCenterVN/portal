"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ActionButton } from "@/components/patterns/action-button";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useAccess } from "@/lib/access-boundary";
import type { Loai, Mon, Unit } from "@/lib/api/material-catalog";
import type { NewMon } from "@/lib/api/material-catalog-write";
import { activateMon, createMon, deleteMonImage, suspendMon, updateMon, uploadMonImage, viMessage, NAME_HAS_QUANTITY, UNIT_LOCKED } from "@/lib/api/material-catalog-write";

type Can = (action: string) => boolean;
type Label = "Lưu" | "Duyệt" | "Ngừng dùng…" | "Dùng lại";
const UNITS: { code: Unit; label: string }[] = [{ code: "KG", label: "kg" }, { code: "L", label: "lít" }, { code: "EA", label: "cái" }];

export function actionsFor(mon: Mon, can: Can): Label[] {
  const labels: Label[] = [];
  if (mon.status === "SUSPENDED") return can("sales:material:lifecycle") ? ["Dùng lại"] : labels;
  if (can("sales:material:update")) labels.push("Lưu");
  if (can("sales:material:lifecycle")) labels.push(...(mon.status === "DRAFT" ? ["Duyệt" as const] : []), "Ngừng dùng…");
  return labels;
}

export function NameField({ value, onChange, disabled, error }: { value: string; onChange: (value: string) => void; disabled: boolean; error: string }) {
  return <Field data-invalid={error ? true : undefined}>
    <FieldLabel htmlFor="mon-ten">Tên nguyên liệu</FieldLabel>
    <Input id="mon-ten" value={value} disabled={disabled} aria-invalid={error ? true : undefined} aria-describedby="mon-ten-note" onChange={event => onChange(event.target.value)} />
    <p id="mon-ten-note" className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : undefined}>{error || 'Chỉ ghi tên chung, ví dụ "Ba chỉ lợn". Không ghi khối lượng.'}</p>
  </Field>;
}

export const monPatch = (mon: Mon, body: NewMon): Partial<NewMon> => {
  if (mon.status === "DRAFT") return body;
  const { uom_code: _unit, ...rest } = body;
  return rest;
};

export function UnitField({ locked, value, onChange, error }: { locked: boolean; value: Unit; onChange: (value: Unit) => void; error: string }) {
  return <Field data-invalid={error ? true : undefined}>
    <FieldLabel htmlFor="mon-don-vi">Đơn vị</FieldLabel>
    <NativeSelect id="mon-don-vi" value={value} disabled={locked} aria-invalid={error ? true : undefined} onChange={event => onChange(event.target.value as Unit)}>{UNITS.map(item => <NativeSelectOption key={item.code} value={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect>
    {(locked || error) && <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"} role={error ? "alert" : undefined}>{UNIT_LOCKED}</p>}
  </Field>;
}

export function MonActions({ labels, busy, onAction }: { labels: Label[]; busy: boolean; onAction: (label: Label) => void }) {
  return <>{labels.map(label => <ActionButton key={label} variant={label === "Lưu" || label === "Duyệt" ? "default" : "outline"} pending={busy && label === "Lưu"} disabled={busy} onClick={() => onAction(label)}>{label}</ActionButton>)}</>;
}

function ImageBox({ current, file, canEdit, busy, onPick, onRemove }: { current: string | null; file: File | null; canEdit: boolean; busy: boolean; onPick: (file: File) => void; onRemove: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const pick = (list: FileList | null) => list?.[0] && onPick(list[0]);
  return <div className="flex flex-col gap-2">
    <div role="group" aria-label="Ảnh nguyên liệu" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (canEdit) pick(event.dataTransfer.files); }}
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

function Select({ id, label, value, onChange, children, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode; disabled?: boolean }) {
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><NativeSelect id={id} value={value} disabled={disabled} onChange={event => onChange(event.target.value)}>{children}</NativeSelect></Field>;
}

type Props = { target: Mon | "new" | null; tree: Loai[]; defaultLoai: string; onClose: () => void; onSaved: () => void };

export function MonSheet({ target, tree, defaultLoai, onClose, onSaved }: Props) {
  const { can } = useAccess();
  const mon = target && target !== "new" ? target : null;
  const [ten, setTen] = useState(mon?.ten ?? "");
  const [loai, setLoai] = useState(mon?.loai ?? defaultLoai);
  const [nhom, setNhom] = useState(mon?.nhom ?? "");
  const [donVi, setDonVi] = useState<Unit>(mon?.donVi ?? "KG");
  const [file, setFile] = useState<File | null>(null);
  const [anh, setAnh] = useState(mon?.anh ?? null);
  const [reason, setReason] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const groups = tree.find(item => item.code === loai)?.nhom.filter(item => item.active) ?? [];
  const group = groups.some(item => item.code === nhom) ? nhom : groups[0]?.code ?? "";
  const canEdit = mon ? can("sales:material:update") : true;
  const canImage = can("sales:material:update");
  const ready = ten.trim() !== "" && group !== "" && !busy;

  async function run(job: () => Promise<unknown>, close = true) {
    setBusy(true); setError("");
    try { await job(); onSaved(); if (close) onClose(); }
    catch (cause) { setError(viMessage(cause, "mon")); }
    finally { setBusy(false); }
  }
  const body = { name: ten.trim(), uom_code: donVi, material_group_code: group.toUpperCase() };
  const create = () => run(async () => {
    const made = await createMon(body);
    if (file && canImage) await uploadMonImage(made.id, file);
  });
  const pickImage = (picked: File) => {
    if (!mon) { setFile(picked); return; }
    run(async () => { await uploadMonImage(mon.id, picked); setAnh(URL.createObjectURL(picked)); }, false);
  };
  const onAction = (label: Label) => {
    if (!mon) return;
    if (label === "Lưu") run(() => updateMon(mon.id, monPatch(mon, body)));
    if (label === "Duyệt" || label === "Dùng lại") run(() => activateMon(mon.id));
    if (label === "Ngừng dùng…") setAsking(true);
  };
  const title = mon ? "Chi tiết nguyên liệu" : can("sales:material:update") ? "Thêm nguyên liệu" : "Đề xuất nguyên liệu";

  return <Sheet open={target !== null} onOpenChange={open => !open && !busy && onClose()}>
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader><SheetTitle>{title}</SheetTitle><SheetDescription>{mon ? "Sửa thông tin, đổi ảnh hoặc ngừng dùng nguyên liệu này." : "Nguyên liệu mới của kho ra ở trạng thái nháp, bếp sẽ duyệt."}</SheetDescription></SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
        <ImageBox current={anh} file={file} canEdit={canImage} busy={busy} onPick={pickImage} onRemove={() => run(async () => { await deleteMonImage(mon!.id); setAnh(null); }, false)} />
        <NameField value={ten} onChange={setTen} disabled={!canEdit} error={error === NAME_HAS_QUANTITY ? error : ""} />
        <Select id="mon-loai" label="Loại" value={loai} disabled={!canEdit} onChange={value => { setLoai(value); setNhom(""); }}>{tree.filter(item => item.active).map(item => <NativeSelectOption key={item.code} value={item.code}>{item.label}</NativeSelectOption>)}</Select>
        <Select id="mon-nhom" label="Nhóm" value={group} disabled={!canEdit} onChange={setNhom}>{groups.map(item => <NativeSelectOption key={item.code} value={item.code}>{item.label}</NativeSelectOption>)}</Select>
        <UnitField locked={!!mon && mon.status !== "DRAFT"} value={donVi} onChange={setDonVi} error={error === UNIT_LOCKED ? error : ""} />
        {error && error !== NAME_HAS_QUANTITY && error !== UNIT_LOCKED && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
      <SheetFooter className="flex-row justify-end">
        {mon ? <MonActions labels={actionsFor(mon, can)} busy={busy} onAction={onAction} /> : <ActionButton pending={busy} disabled={!ready} onClick={create}>{title}</ActionButton>}
      </SheetFooter>
      <ConfirmDialog open={asking} onOpenChange={setAsking} title="Ngừng dùng nguyên liệu này?" description="Nguyên liệu sẽ không chọn được nữa. Hãy ghi lý do." confirmLabel="Ngừng dùng" danger busy={busy} confirmDisabled={reason.trim() === ""}
        onConfirm={() => run(() => suspendMon(mon!.id, reason))}>
        <Textarea aria-label="Lý do ngừng dùng" value={reason} onChange={event => setReason(event.target.value)} placeholder="Lý do (bắt buộc)" />
      </ConfirmDialog>
    </SheetContent>
  </Sheet>;
}
