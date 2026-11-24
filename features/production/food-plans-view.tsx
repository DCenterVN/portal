"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import type { FoodProductPlan } from "@/lib/api/production";
import { FoodPlanForm } from "./food-plan-form";
import { FoodPlansTable } from "./food-plans-table";
import { useFoodPlans } from "./use-food-plans";

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const s = useFoodPlans(initialPlans, targetId);
  return <PageShell>
    <PageHeading title="Thực đơn và định mức" description="Một hộp gồm nhiều suất. Định mức là lượng nguyên liệu cho một suất; lưu thực đơn chưa xuất bản BOM."
      actions={s.canCreate && targetId ? <Button disabled={s.busy} onClick={() => void s.begin()}>Tạo set</Button> : undefined} />
    {s.error && <InlineAlert>{s.error} <Button variant="outline" onClick={() => void s.load()}>Thử lại</Button></InlineAlert>}
    {s.notice && <p role="status">{s.notice}</p>}
    {s.busy && (!targetId || s.plans.length > 0) && <LoadingState title="Đang tải hoặc lưu set…" />}
    {!targetId && <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0">
      {s.ready && !s.error && s.targets.length === 0
        ? <div className="p-4"><EmptyState title="Chưa có chỉ tiêu" description="Tạo chỉ tiêu sản xuất trước khi lập set." /></div>
        : <>
          <h2 className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">Chọn chỉ tiêu để xem và lập set.</h2>
          <ul className="divide-y divide-border">{s.targets.map(t => <li key={t.id}><Link className="block px-4 py-2.5 text-sm font-medium text-foreground underline-offset-4 hover:bg-muted/30 hover:underline" href={`/production/food-plans?target_id=${encodeURIComponent(t.id)}`}>{t.title}</Link></li>)}</ul>
        </>}
      <div className="border-t bg-muted/20 px-4 py-2.5"><Link className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/production/targets">Danh sách chỉ tiêu</Link></div>
    </CardContent></Card>}
    <FoodPlanForm s={s} />
    {targetId && <FoodPlansTable s={s} />}
  </PageShell>;
}
