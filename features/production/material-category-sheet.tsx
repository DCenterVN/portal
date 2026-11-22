"use client";

import { useState } from "react";
import { Ban, FolderPlus, Pencil, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/patterns/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useAccess } from "@/lib/access-boundary";
import type { MaterialCategory, MaterialGroup } from "@/lib/api/material-catalog";
import { createCategory, renameCategory, setCategoryActive, viMessage } from "@/lib/api/material-catalog-write";
import { DeleteCategory } from "./material-category-delete";
import { IconAction, IconSlot } from "./icon-action";
import { useCategoryCounts } from "./use-category-counts";
import { suggestCode } from "./materials-catalog";

type Mode = { kind: "add"; parent?: MaterialCategory } | { kind: "rename"; item: MaterialCategory | MaterialGroup } | null;

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
      if (adding) await createCategory({ code: shown, name: name.trim(), ...(mode.parent ? { parent_code: mode.parent.code.toUpperCase() } : {}) });
      else await renameCategory(mode.item.code.toUpperCase(), { name: name.trim() });
      onDone();
    } catch (cause) { setError(viMessage(cause, adding ? "new-category" : "category")); }
    finally { setBusy(false); }
  };
  const heading = adding ? (mode.parent ? `Thêm nhóm vào ${mode.parent.label}` : "Thêm loại") : "Đổi tên";
  return <div className="flex flex-col gap-3 rounded-lg border p-3">
    <p className="text-sm font-medium">{heading}</p>
    <Field><FieldLabel htmlFor="category-name">Tên</FieldLabel><Input id="category-name" value={name} onChange={event => setName(event.target.value)} /></Field>
    {adding && <Field><FieldLabel htmlFor="category-ma">Mã</FieldLabel><Input id="category-ma" value={shown} onChange={event => { setTyped(true); setCode(event.target.value.toUpperCase()); }} /><FieldDescription>Mã gợi ý từ tên, không sửa được sau khi tạo.</FieldDescription></Field>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><ActionButton pending={busy} disabled={!name.trim() || (adding && !shown)} onClick={save}>Lưu</ActionButton><Button variant="outline" disabled={busy} onClick={onCancel}>Huỷ</Button></div>
  </div>;
}

type RowProps = { item: MaterialCategory | MaterialGroup; parent?: MaterialCategory; counts: Record<string, number> | null; hasChildren: boolean; onMode: (mode: Mode) => void; onToggle: (item: MaterialCategory | MaterialGroup) => void; onDeleted: () => void };

function Row({ item, parent, counts, hasChildren, onMode, onToggle, onDeleted }: RowProps) {
  const { can } = useAccess();
  const deletable = can("inventory:material_category:lifecycle") && !hasChildren && counts !== null && !(counts[item.code] ?? 0);
  return <div className="flex items-center gap-1 py-1">
    <span className={parent ? "flex-1 pl-5 text-sm" : "flex-1 text-sm font-medium"}>{item.label}</span>
    {!item.active && <Badge variant="secondary">Đã ngừng</Badge>}
    {!parent && item.active ? <IconAction icon={FolderPlus} label="Thêm nhóm" onClick={() => onMode({ kind: "add", parent: item as MaterialCategory })} /> : <IconSlot />}
    <IconAction icon={Pencil} label="Đổi tên" onClick={() => onMode({ kind: "rename", item })} />
    <IconAction icon={item.active ? Ban : RotateCcw} label={item.active ? "Ngừng dùng" : "Dùng lại"} onClick={() => onToggle(item)} />
    {deletable ? <DeleteCategory code={item.code} label={item.label} onDeleted={onDeleted} /> : <IconSlot />}
  </div>;
}

type ListProps = { tree: MaterialCategory[]; counts: Record<string, number> | null; showInactive: boolean; onMode: (mode: Mode) => void; onToggle: (item: MaterialCategory | MaterialGroup) => void; onDeleted: () => void };

export function CategoryList({ tree, counts, showInactive, ...actions }: ListProps) {
  const shown = (item: { active: boolean }) => showInactive || item.active;
  return <ul className="divide-y">{tree.filter(shown).map(category => <li key={category.code}>
    <Row item={category} counts={counts} hasChildren={category.groups.length > 0} {...actions} />
    {category.groups.filter(shown).map(group => <Row key={group.code} item={group} parent={category} counts={counts} hasChildren={false} {...actions} />)}
  </li>)}</ul>;
}

export function CategoryManager({ tree, counts, onChanged }: { tree: MaterialCategory[]; counts: Record<string, number> | null; onChanged: () => void }) {
  const [mode, setMode] = useState<Mode>(null);
  const [error, setError] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const toggle = async (item: MaterialCategory | MaterialGroup) => {
    setError("");
    try { await setCategoryActive(item.code.toUpperCase(), !item.active); onChanged(); }
    catch (cause) { setError(viMessage(cause, "category")); }
  };
  const done = () => { setMode(null); onChanged(); };
  return <div className="flex flex-col gap-3 overflow-y-auto px-4 pb-4">
    <div className="flex items-center justify-between gap-3">
      {mode ? <span /> : <Button onClick={() => setMode({ kind: "add" })}>Thêm loại</Button>}
      <div className="flex items-center gap-2"><Switch id="category-hien-ngung" checked={showInactive} onCheckedChange={setShowInactive} /><Label htmlFor="category-hien-ngung">Hiện cả cái đã ngừng</Label></div>
    </div>
    {mode && <EditForm key={JSON.stringify(mode.kind === "add" ? mode.parent?.code ?? "new" : mode.item.code)} mode={mode} onDone={done} onCancel={() => setMode(null)} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <CategoryList tree={tree} counts={counts} showInactive={showInactive} onMode={setMode} onToggle={toggle} onDeleted={onChanged} />
  </div>;
}

export function MaterialCategorySheet({ open, tree, onClose, onChanged }: { open: boolean; tree: MaterialCategory[]; onClose: () => void; onChanged: () => void }) {
  const { can } = useAccess();
  const counts = useCategoryCounts(open, tree);
  if (!can("inventory:material_category:update")) return null;
  return <Sheet open={open} onOpenChange={value => !value && onClose()}>
    <SheetContent className="w-full gap-0 sm:max-w-md">
      <SheetHeader><SheetTitle>Quản lý loại</SheetTitle><SheetDescription>Loại và nhóm nguyên liệu dùng chung cho cả tổ chức.</SheetDescription></SheetHeader>
      <CategoryManager tree={tree} counts={counts} onChanged={onChanged} />
    </SheetContent>
  </Sheet>;
}
