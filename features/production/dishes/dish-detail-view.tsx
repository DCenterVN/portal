import { formatDateTime } from "@/lib/format-date";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Copy, Pencil, PenLine, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tip } from "@/components/patterns/tip";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DishDetail, Variant } from "@/lib/dishes/dish-detail";
import { journeyLabels } from "@/lib/dishes/types";
import { DraftList, person } from "./dish-draft-list";

export function DishDetailView(props: {
  detail: DishDetail; selected: string; variant: Variant | undefined; busy: boolean; canCreate: boolean; canRename?: boolean;
  onSelect: (id: string) => void; onBack: () => void; onCopy: () => void; onVariant: () => void; onRevision: () => void;
  onRename?: (name: string) => Promise<void>; onDiscardDraft?: (draftId: string) => Promise<void> | void; children: ReactNode;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState("");
  const sameLabel = (label: string) => props.detail.variants.filter(v => v.variant_label === label).length > 1;
  const isSelling = props.variant?.journey === "SELLING";
  return <div className="space-y-6">
    <Card className="gap-3 py-4"><CardContent className="space-y-4 px-5">
      <div className="flex flex-wrap items-center gap-3">
        <Tip label="Về danh sách món"><Button type="button" variant="ghost" size="icon-sm" aria-label="Về danh sách món" onClick={props.onBack}><ArrowLeft aria-hidden="true" /></Button></Tip>
        {!editingName ? <>
          <h2 className="text-lg font-semibold">{props.detail.product.name}</h2>
          {props.canRename && props.onRename && <Tip label="Đổi tên món"><Button type="button" variant="ghost" size="icon-sm" aria-label="Đổi tên món" disabled={props.busy} onClick={() => { setDraftName(props.detail.product.name); setRenameError(""); setEditingName(true); }}><PenLine aria-hidden="true" /></Button></Tip>}
        </> : <form className="flex min-w-0 flex-1 flex-wrap items-center gap-2" onSubmit={async e => {
          e.preventDefault();
          const trimmed = draftName.trim();
          if (!trimmed || trimmed === props.detail.product.name || !props.onRename || renaming) return;
          setRenaming(true);
          setRenameError("");
          try {
            await props.onRename(trimmed);
            setEditingName(false);
          } catch (err) {
            setRenameError(err instanceof Error ? err.message : "Không đổi được tên món");
          } finally {
            setRenaming(false);
          }
        }}>
          <Input aria-label="Tên món mới" value={draftName} maxLength={150} disabled={renaming} autoFocus onChange={e => { setDraftName(e.target.value); setRenameError(""); }} onKeyDown={e => { if (e.key === "Escape") { setEditingName(false); setRenameError(""); } }} className="max-w-sm" />
          <Button type="submit" size="sm" disabled={renaming || !draftName.trim() || draftName.trim() === props.detail.product.name}>{renaming ? "Đang lưu…" : "Lưu tên"}</Button>
          <Button type="button" variant="outline" size="sm" disabled={renaming} onClick={() => { setEditingName(false); setRenameError(""); }}>Huỷ</Button>
          {renameError && <p role="alert" className="w-full text-xs text-destructive">{renameError}</p>}
        </form>}
        {props.canCreate && props.variant && <div className="ml-auto flex flex-wrap gap-2">
          <Tip label="Nhân bản món">
            <Button type="button" variant="outline" size="icon-sm" aria-label="Nhân bản món" disabled={props.busy} onClick={props.onCopy}>
              <Copy aria-hidden="true" />
            </Button>
          </Tip>
          <Tip label="Tạo biến thể">
            <Button type="button" variant="outline" size="icon-sm" aria-label="Tạo biến thể" disabled={props.busy} onClick={props.onVariant}><Plus aria-hidden="true" /></Button>
          </Tip>
          <Tip label={isSelling ? "Biến thể đang bán — tạo biến thể mới hoặc ngừng bán để sửa" : "Tạo bản sửa"}>
            {isSelling
              ? <span tabIndex={0} className="inline-flex"><Button type="button" variant="outline" size="icon-sm" aria-label="Tạo bản sửa" disabled><Pencil aria-hidden="true" /></Button></span>
              : <Button type="button" variant="outline" size="icon-sm" aria-label="Tạo bản sửa" disabled={props.busy} onClick={props.onRevision}><Pencil aria-hidden="true" /></Button>}
          </Tip>
        </div>}
      </div>
      <Tabs value={props.selected} onValueChange={props.onSelect}>
        <TabsList aria-label="Biến thể món" className="h-auto flex-wrap">{props.detail.variants.map((v, i) => <TabsTrigger key={v.set_ref} value={v.set_ref}>{sameLabel(v.variant_label) ? `${v.name || `#${i + 1}`} · ` : ""}{v.variant_label} · {journeyLabels[v.journey]}</TabsTrigger>)}</TabsList>
        <TabsContent value={props.selected} className="pt-3">{props.variant && props.children}</TabsContent>
      </Tabs>
    </CardContent></Card>
    {props.detail.open_drafts.length > 0 && <DraftList title="Nháp đang mở của món" drafts={props.detail.open_drafts} emptyText="Chưa có nháp đang mở." onDiscard={props.canCreate ? props.onDiscardDraft : undefined} />}
    <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0">
      <h2 className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">Lịch sử bản sửa</h2>
      {props.detail.revision_history.length ? <Table><TableHeader className="bg-muted/30"><TableRow><TableHead>Ngày hoàn tất</TableHead><TableHead>Người sửa</TableHead><TableHead>Lý do</TableHead></TableRow></TableHeader><TableBody>
        {props.detail.revision_history.map(row => <TableRow key={row.id}>
          <TableCell className="tabular-nums">{row.completed_at ? formatDateTime(row.completed_at) : "Chưa có ngày"}</TableCell>
          <TableCell>{person(row.updated_by)}</TableCell>
          <TableCell className="whitespace-normal">{row.reason}</TableCell>
        </TableRow>)}
      </TableBody></Table> : <p className="px-4 py-4 text-sm text-muted-foreground">Chưa có bản sửa đã hoàn tất.</p>}
    </CardContent></Card>
  </div>;
}
