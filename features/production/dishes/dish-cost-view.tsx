import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/state";
import type { CostPreview } from "@/lib/dishes/types";
const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;
export function DishCostView({ cost, loading, error, onRetry }: { cost: CostPreview | null; loading: boolean; error: string; onRetry: () => void }) {
  return <Card><CardContent className="space-y-3 pt-6"><h2>Giá vốn ước tính</h2><p className="text-sm text-fg-3">Chỉ để xem — giá tham chiếu</p>
    {loading ? <Skeleton title="Đang tính giá vốn…" /> : error ? <div role="alert">{error}<Button variant="outline" onClick={onRetry}>Thử lại</Button></div> : cost ? <>
      <dl>{cost.lines.map((line, i) => <div key={i} className="flex justify-between gap-3 py-2"><dt>{line.name}</dt><dd>{line.missing || line.cost_vnd === null ? "Chưa có giá" : money(line.cost_vnd)}</dd></div>)}</dl>
      <p>Tổng / kit: {money(cost.total_vnd)}{!cost.complete && " · chưa đủ"}</p><p>Tổng / suất: {money(cost.per_serving_vnd)}{!cost.complete && " · chưa đủ"}</p>
    </> : <p>Nhập nguyên liệu và lượng để xem giá vốn ước tính.</p>}
  </CardContent></Card>;
}
