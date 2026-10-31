import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, Skeleton } from "@/components/ui/state";
import type { DishListRow } from "@/lib/dishes/types";
import type { DraftRow, Journey } from "@/lib/dishes/types";
export const journeyLabels: Record<Journey, string> = { DRAFT: "Nháp", DONE: "Đã hoàn tất", SELLING: "Đang bán", STOPPED: "Ngừng" };
export function DishListView(props: {
  rows: DishListRow[]; drafts: DraftRow[]; categories: { id: string; name: string }[]; q: string; category: string; status: string;
  draftNext: string | null; draftBusy: boolean; onMoreDrafts: () => void;
  busy: boolean; error: string; next: string | null; canCreate: boolean;
  onQ: (q: string) => void; onCategory: (id: string) => void; onStatus: (status: string) => void;
  onCreate: () => void; onOpen: (id: string) => void; onCopy: (id: string) => void; onVariant: (id: string) => void; onDraft: (id: string) => void; onNext: () => void; onRetry: () => void;
}) {
  return <div className="space-y-6" aria-busy={props.busy}>
    <div className="grid gap-3 md:grid-cols-3">
      <label>Tìm món<Input placeholder="Tên món, có hoặc không dấu" value={props.q} onChange={e => props.onQ(e.target.value)} /></label>
      <label>Danh mục<Select value={props.category} onChange={e => props.onCategory(e.target.value)}><option value="">Tất cả danh mục</option>{props.categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>
      <label>Trạng thái<Select value={props.status} onChange={e => props.onStatus(e.target.value)}><option value="">Tất cả trạng thái</option>{Object.entries(journeyLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</Select></label>
    </div>
    {props.canCreate && <Button disabled={props.busy} onClick={props.onCreate}>Tạo món</Button>}
    <Card><CardContent className="pt-6">
      {props.busy ? <Skeleton title="Đang tải danh sách món…" /> : props.error ? <div role="alert">{props.error} <Button variant="outline" onClick={props.onRetry}>Thử lại</Button></div> : !props.rows.length ? <EmptyState title="Chưa có món phù hợp" description="Tạo món mới hoặc đổi bộ lọc để xem món." /> : <Table><TableHeader><TableRow>{["Món", "Danh mục", "Biến thể", "Trạng thái", "Thao tác"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{props.rows.map(row => <TableRow key={row.product.id}>
        <TableCell>{row.product.name}</TableCell><TableCell>{row.product.category_name || "Chưa chọn"}</TableCell><TableCell>{row.variants.map(v => v.variant_label).join(", ")}</TableCell>
        <TableCell><div className="flex flex-wrap gap-2">{Object.entries(journeyLabels).map(([status, label]) => { const count = row.counts[status as Journey]; return count > 0 ? <Badge key={status}>{label}: {count}</Badge> : null; })}</div></TableCell>
        <TableCell><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => props.onOpen(row.product.id)}>Mở</Button>{props.canCreate && <><Button variant="ghost" onClick={() => props.onCopy(row.product.id)}>Nhân bản</Button><Button variant="ghost" onClick={() => props.onVariant(row.product.id)}>Tạo biến thể</Button></>}</div></TableCell>
      </TableRow>)}</TableBody></Table>}
      {props.next && <Button variant="outline" disabled={props.busy} onClick={props.onNext}>Trang sau</Button>}
    </CardContent></Card>
    <Card><CardContent className="space-y-3 pt-6"><h2>Nháp đang soạn</h2>{!props.drafts.length ? <p>Chưa có nháp đang soạn.</p> : props.drafts.map(draft => <div key={draft.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3"><span>{draft.title || "Món chưa đặt tên"} · {draft.updated_by.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "Thành viên chi nhánh")} · {new Date(draft.updated_at).toLocaleString("vi-VN")}</span><Button variant="outline" onClick={() => props.onDraft(draft.id)}>Tiếp tục nháp</Button></div>)}{props.draftNext && <Button variant="outline" disabled={props.busy || props.draftBusy} onClick={props.onMoreDrafts}>{props.draftBusy ? "Đang tải…" : "Tải thêm"}</Button>}</CardContent></Card>
  </div>;
}
