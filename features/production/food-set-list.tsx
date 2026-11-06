import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { FoodSetsState } from "./use-food-sets";

export function FoodSetFilters({ s }: { s: FoodSetsState }) {
  return <>
    <form className="flex gap-3" onSubmit={e => { e.preventDefault(); s.submitSearch(); }}><label className="flex-1">Tìm set theo tên<Input value={s.query} onChange={e => s.setQuery(e.target.value)} /></label><Button type="submit" variant="outline" disabled={s.busy}>Tìm set</Button></form>
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
    {s.busy ? <LoadingState title="Đang tải danh sách set…" /> : s.error ? <ErrorState title="Không tải được set" description={s.error} onRetry={() => void s.load()} /> : s.rows.length === 0 ? <EmptyState title={filtered ? `Không có set nào có hashtag ${s.filterTags.map(tag => `#${tag}`).join(", ")}` : "Chưa có set món ăn"} description={filtered ? "Bỏ hashtag để xem thêm set món ăn." : "Tạo set nháp, sau đó thêm nguyên liệu và ít nhất một gói gia vị không được bỏ."} action={filtered ? <Button onClick={s.clearTagFilters}>Xoá lọc</Button> : s.canCreate ? <Button onClick={() => void s.begin(true)}>Tạo set món</Button> : undefined} /> : <Table><TableHeader><TableRow><TableHead>Tên set</TableHead><TableHead>Trạng thái</TableHead><TableHead>Số ô</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>{s.rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.status}</TableCell><TableCell>{row.slots.length}</TableCell><TableCell><Button variant="outline" disabled={s.detailBusy} onClick={() => void s.open(row)}>Xem {row.name}</Button></TableCell></TableRow>)}</TableBody></Table>}
    <TablePager busy={s.busy} previousLabel="Trang đầu" nextLabel="Trang tiếp" hasPrevious={Boolean(s.cursor)} onPrevious={() => s.setCursor(undefined)} hasNext={Boolean(s.next)} onNext={() => s.setCursor(s.next ?? undefined)} />
  </CardContent></Card>;
}
