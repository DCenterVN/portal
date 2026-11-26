import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Tip } from "@/components/patterns/tip";
import type { CostPreview } from "@/lib/dishes/types";

const money = (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)} ₫`;

export function DishCostView({ cost, packNames = {}, loading, error, onRetry }: { cost: CostPreview | null; packNames?: Record<string, string>; loading: boolean; error: string; onRetry: () => void }) {
  return <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0">
    <div className="flex items-start justify-between gap-2 border-b bg-muted/40 px-4 py-3">
      <div>
        <h2 className="text-sm font-semibold">Giá vốn ước tính</h2>
        <p className="text-xs text-muted-foreground">Chỉ để xem — giá tham chiếu</p>
      </div>
      {cost && <Tip label="Tính lại giá vốn"><Button type="button" variant="ghost" size="icon-xs" aria-label="Tính lại giá vốn" disabled={loading} onClick={onRetry}><RefreshCw className={loading ? "animate-spin" : undefined} aria-hidden="true" /></Button></Tip>}
    </div>
    {loading ? <div className="p-4"><LoadingState title="Đang tính giá vốn…" /></div>
      : error ? <div className="p-4"><InlineAlert>{error} <Button variant="outline" size="sm" onClick={onRetry}>Thử lại</Button></InlineAlert></div>
      : cost ? <>
        <dl className="divide-y divide-border px-4 text-sm">{cost.lines.map((line, i) => {
          const sourcePack = line.package_ref ? packNames[line.package_ref] : undefined;
          return <div key={i} className="flex items-center justify-between gap-3 py-2">
            <dt className="min-w-0 truncate text-muted-foreground">
              {line.name}
              {sourcePack && <span className="text-xs text-muted-foreground/75"> · {sourcePack}</span>}
            </dt>
            <dd className={line.missing || line.cost_vnd === null ? "text-muted-foreground shrink-0" : "font-medium tabular-nums shrink-0"}>{line.missing || line.cost_vnd === null ? "Chưa có giá" : money(line.cost_vnd)}</dd>
          </div>;
        })}</dl>
        <div className="space-y-1.5 border-t bg-muted/30 px-4 py-3 text-sm">
          <p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Tổng / hộp:</span> <span className="font-semibold tabular-nums">{money(cost.total_vnd)}{!cost.complete && " · chưa đủ"}</span></p>
          <p className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Tổng / suất:</span> <span className="font-semibold tabular-nums">{money(cost.per_serving_vnd)}{!cost.complete && " · chưa đủ"}</span></p>
        </div>
      </> : <p className="p-4 text-sm text-muted-foreground">Nhập nguyên liệu và lượng để xem giá vốn ước tính.</p>}
  </CardContent></Card>;
}
