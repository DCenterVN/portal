"use client";

import { useState } from "react";
import { ActionButton } from "@/components/patterns/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAccess } from "@/lib/access-boundary";
import type { Loai, Nhom } from "@/lib/api/material-catalog";
import { createLoai, renameLoai, setLoaiActive, viMessage } from "@/lib/api/material-catalog-write";
import { suggestCode } from "./materials-catalog";

type Mode = { kind: "add"; parent?: Loai } | { kind: "rename"; item: Loai | Nhom } | null;

function EditForm({ mode, onDone, onCancel }: { mode: NonNullable<Mode>; onDone: () => void; onCancel: () => void }) {
  const adding = mode.kind === "add";
  const [name, setName] = useState(adding ? "" : mode.item.label);
  const [code, setCode] = useState("");
  const [typed, setTyped] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shown = typed ? code : suggestCode(name);
  const save = async () => {
    setBusy(true); setError("");
    try {
      if (adding) await createLoai({ code: shown, name: name.trim(), ...(mode.parent ? { parent_code: mode.parent.code.toUpperCase() } : {}) });
      else await renameLoai(mode.item.code.toUpperCase(), { name: name.trim() });
      onDone();
    } catch (cause) { setError(viMessage(cause, adding ? "loai-moi" : "loai")); }
    finally { setBusy(false); }
  };
  const heading = adding ? (mode.parent ? `Thêm nhóm vào ${mode.parent.label}` : "Thêm loại") : "Đổi tên";
  return <div className="flex flex-col gap-3 rounded-lg border p-3">
    <p className="text-sm font-medium">{heading}</p>
    <Field><FieldLabel htmlFor="loai-ten">Tên</FieldLabel><Input id="loai-ten" value={name} onChange={event => setName(event.target.value)} /></Field>
    {adding && <Field><FieldLabel htmlFor="loai-ma">Mã</FieldLabel><Input id="loai-ma" value={shown} onChange={event => { setTyped(true); setCode(event.target.value.toUpperCase()); }} /><FieldDescription>Mã gợi ý từ tên, không sửa được sau khi tạo.</FieldDescription></Field>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><ActionButton pending={busy} disabled={!name.trim() || (adding && !shown)} onClick={save}>Lưu</ActionButton><Button variant="outline" disabled={busy} onClick={onCancel}>Huỷ</Button></div>
  </div>;
}

function Row({ item, parent, onMode, onToggle }: { item: Loai | Nhom; parent?: Loai; onMode: (mode: Mode) => void; onToggle: (item: Loai | Nhom) => void }) {
  return <div className="flex items-center gap-2 py-1.5">
    <span className={parent ? "flex-1 pl-5 text-sm" : "flex-1 text-sm font-medium"}>{item.label}</span>
    {!item.active && <Badge variant="secondary">Đã ngừng</Badge>}
    {!parent && item.active && <Button size="sm" variant="ghost" onClick={() => onMode({ kind: "add", parent: item as Loai })}>Thêm nhóm</Button>}
    <Button size="sm" variant="ghost" onClick={() => onMode({ kind: "rename", item })}>Đổi tên</Button>
    <Button size="sm" variant="ghost" onClick={() => onToggle(item)}>{item.active ? "Ngừng dùng" : "Dùng lại"}</Button>
  </div>;
}

export function LoaiManager({ tree, onChanged }: { tree: Loai[]; onChanged: () => void }) {
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState("");
  const toggle = async (item: Loai | Nhom) => {
    setError("");
    try { await setLoaiActive(item.code.toUpperCase(), !item.active); onChanged(); }
    catch (cause) { setError(viMessage(cause, "loai")); }
  };
  const done = () => { setMode(null); onChanged(); };
  return <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
    {mode ? <EditForm key={JSON.stringify(mode.kind === "add" ? mode.parent?.code ?? "new" : mode.item.code)} mode={mode} onDone={done} onCancel={() => setMode(null)} /> : <Button className="self-start" onClick={() => setMode({ kind: "add" })}>Thêm loại</Button>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <ul className="divide-y">{tree.map(loai => <li key={loai.code}>
      <Row item={loai} onMode={setMode} onToggle={toggle} />
      {loai.nhom.map(nhom => <Row key={nhom.code} item={nhom} parent={loai} onMode={setMode} onToggle={toggle} />)}
    </li>)}</ul>
  </div>;
}

export function LoaiSheet({ open, tree, onClose, onChanged }: { open: boolean; tree: Loai[]; onClose: () => void; onChanged: () => void }) {
  const { can } = useAccess();
  if (!can("inventory:material_category:update")) return null;
  return <Sheet open={open} onOpenChange={value => !value && onClose()}>
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader><SheetTitle>Quản lý loại</SheetTitle><SheetDescription>Loại và nhóm nguyên liệu dùng chung cho cả tổ chức.</SheetDescription></SheetHeader>
      <LoaiManager tree={tree} onChanged={onChanged} />
    </SheetContent>
  </Sheet>;
}
