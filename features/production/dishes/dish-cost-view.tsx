import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/patterns/empty-state";
import type { CostPreview } from "@/lib/dishes/types";
import { InlineAlert } from "@/components/patterns/inline-alert";
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
export function DishCostView({ cost, loading, error, onRetry }: { cost: CostPreview | null; loading: boolean; error: string; onRetry: () => void }) {
  return <Card><CardContent className="space-y-3 pt-6"><h2>Giá vốn ước tính</h2><p className="text-sm text-muted-foreground">Chỉ để xem — giá tham chiếu</p>
    {loading ? <LoadingState title="Đang tính giá vốn…" /> : error ? <InlineAlert>{error}<Button variant="outline" onClick={onRetry}>Thử lại</Button></InlineAlert> : cost ? <>
      <dl>{cost.lines.map((line, i) => <div key={i} className="flex justify-between gap-3 py-2"><dt>{line.name}</dt><dd>{line.missing || line.cost_vnd === null ? "Chưa có giá" : money(line.cost_vnd)}</dd></div>)}</dl>
      <p>Tổng / kit: {money(cost.total_vnd)}{!cost.complete && " · chưa đủ"}</p><p>Tổng / suất: {money(cost.per_serving_vnd)}{!cost.complete && " · chưa đủ"}</p>
    </> : <p>Nhập nguyên liệu và lượng để xem giá vốn ước tính.</p>}
  </CardContent></Card>;
}
