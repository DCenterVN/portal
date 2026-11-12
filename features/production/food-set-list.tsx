import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ban, Eye, Pencil } from "lucide-react";
import { RowActions } from "@/components/patterns/row-actions";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { packStatusLabels } from "./order-status";
import type { FoodSetsState } from "./use-food-sets";

export function FoodSetFilters({ s }: { s: FoodSetsState }) {
  return <>
    <form className="flex items-end gap-3" onSubmit={e => { e.preventDefault(); s.submitSearch(); }}><Field label="Tìm set theo tên" htmlFor="food-set-search" className="flex-1"><Input id="food-set-search" value={s.query} onChange={e => s.setQuery(e.target.value)} /></Field><Button type="submit" variant="outline" disabled={s.busy}>Tìm set</Button></form>
    <div className="space-y-3"><label className="block">Lọc theo hashtag<Input value={s.filterTagDraft} list="food-set-filter-tags" aria-describedby="food-set-filter-help" placeholder="Nhập hashtag rồi nhấn Enter" onChange={e => {
      const parts = e.target.value.split(",");
      s.setFilterTagDraft(parts.pop() ?? "");
      if (parts.length) s.addFilterTags(parts.join(","));
    }} onKeyDown={e => {
      if (e.nativeEvent.isComposing || (e.key !== "Enter" && e.key !== ",")) return;
      e.preventDefault(); s.addFilterTags(s.filterTagDraft); s.setFilterTagDraft("");
    }} /></label>
      <datalist id="food-set-filter-tags">{s.availableTags.filter(tag => !s.filterTags.includes(tag)).map(tag => <option key={tag} value={tag} />)}</datalist>
      <p id="food-set-filter-help" className="text-sm text-muted-foreground">Nhấn Enter hoặc dấu phẩy để thêm hashtag. Kết quả phải có tất cả hashtag đã chọn; tìm tên áp dụng riêng.</p>
      <div className="flex flex-wrap gap-2">{s.filterTags.map(tag => <Button key={tag} type="button" variant="outline" aria-pressed={true} aria-label={`Bỏ lọc hashtag ${tag}`} onClick={() => s.toggleFilterTag(tag)}>#{tag} <span aria-hidden="true">×</span></Button>)}{s.filterTags.length >= 2 && <Button type="button" variant="outline" onClick={s.clearTagFilters}>Xoá lọc</Button>}</div>
    </div>
  </>;
}

export function FoodSetTable({ s }: { s: FoodSetsState }) {
  const filtered = s.filterTags.length > 0;
  return <Card><CardContent className="space-y-3 pt-6" aria-busy={s.busy}>
    {s.busy ? <LoadingState title="Đang tải danh sách set…" /> : s.error ? <ErrorState title="Không tải được set" description={s.error} onRetry={() => void s.load()} /> : s.rows.length === 0 ? <EmptyState title={filtered ? `Không có set nào có hashtag ${s.filterTags.map(tag => `#${tag}`).join(", ")}` : "Chưa có set món ăn"} description={filtered ? "Bỏ hashtag để xem thêm set món ăn." : "Tạo set nháp, sau đó thêm nguyên liệu và ít nhất một gói gia vị không được bỏ."} action={filtered ? <Button onClick={s.clearTagFilters}>Xoá lọc</Button> : s.canCreate ? <Button onClick={() => void s.begin(true)}>Tạo set món</Button> : undefined} /> : <Table><TableHeader><TableRow><TableHead>Tên set</TableHead><TableHead>Trạng thái</TableHead><TableHead>Số ô</TableHead><TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead></TableRow></TableHeader><TableBody>{s.rows.map(row => <TableRow key={row.id}><TableCell><Button variant="link" className="h-auto p-0 font-medium text-foreground" disabled={s.detailBusy} onClick={() => void s.open(row)}>{row.name}</Button></TableCell><TableCell><StatusBadge tone={statusTone(row.status)}>{packStatusLabels[row.status] ?? row.status}</StatusBadge></TableCell><TableCell className="tabular-nums">{row.slots.length}</TableCell><TableCell className="text-right"><RowActions label={row.name} actions={[
      { label: s.canUpdate ? "Sửa" : "Xem", icon: s.canUpdate ? Pencil : Eye, onSelect: () => void s.open(row).then(() => s.canUpdate && s.setEditing(true)) },
      { label: "Ngừng set", icon: Ban, danger: true, hidden: !s.canDelete || row.status === "RETIRED", onSelect: () => void s.open(row).then(() => s.setConfirmRetire(true)) },
    ]} /></TableCell></TableRow>)}</TableBody></Table>}
    <TablePager busy={s.busy} previousLabel="Trang đầu" nextLabel="Trang tiếp" hasPrevious={Boolean(s.cursor)} onPrevious={() => s.setCursor(undefined)} hasNext={Boolean(s.next)} onNext={() => s.setCursor(s.next ?? undefined)} />
  </CardContent></Card>;
}
