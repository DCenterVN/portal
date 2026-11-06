import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PackagesState } from "./use-packages";

function RecipeCell({ s, id }: { s: PackagesState; id: string }) {
  if (!s.can("production:recipe:read")) return "Chưa có quyền đọc công thức";
  const history = s.histories[id];
  if (!history) return "Chưa tải công thức";
  return history.current?.status === "BOM_ACTIVE" ? <Badge variant="outline">v{history.current?.version}</Badge> : <Badge variant="outline">chưa có công thức</Badge>;
}

export function PackageList({ s }: { s: PackagesState }) {
  return <Card><CardContent className="space-y-3 pt-6" aria-busy={s.busy}>
    {s.busy ? <LoadingState title="Đang tải gói và công thức…" /> : s.error ? <ErrorState title="Không tải được gói hoặc nguyên liệu" description={s.error} onRetry={() => { void s.load(); if (s.raw && !s.labels) void s.readLabels(s.raw); }} /> : s.rows.length === 0 ? <EmptyState title="Chưa có gói" description="Tạo gói cho họ món, sau đó thêm công thức nguyên liệu." action={s.can("sales:variant:create") ? <Button onClick={() => void s.begin(true)}>Tạo gói</Button> : undefined} /> : <Table><TableHeader><TableRow><TableHead>Tên gói</TableHead><TableHead>Quy cách</TableHead><TableHead>Công thức</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>{s.rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.net_weight_g} g · {row.variant_label}</TableCell><TableCell><RecipeCell s={s} id={row.id} /></TableCell><TableCell><Button variant="outline" disabled={s.detailBusy} onClick={() => void s.open(row)}>Xem {row.name}</Button></TableCell></TableRow>)}</TableBody></Table>}
    <TablePager busy={s.busy} previousLabel="Trang đầu" nextLabel="Trang tiếp" hasPrevious={Boolean(s.cursor)} onPrevious={() => s.setCursor(undefined)} hasNext={Boolean(s.next)} onNext={() => s.setCursor(s.next ?? undefined)} />
  </CardContent></Card>;
}
