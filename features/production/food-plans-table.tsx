import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { planStatuses } from "./order-status";
import { formatServings } from "@/lib/stock-transfer";
import { statusLabel } from "@/lib/status-labels";
import { variantLabel } from "./food-plan-ratios";
import type { FoodPlansState } from "./use-food-plans";

export function FoodPlansTable({ s }: { s: FoodPlansState }) {
  const { plans, busy, can } = s;
  const showSet = plans.some(plan => variantLabel(plan.variant_sku_code) !== "—");
  const columns = showSet ? 6 : 5;
  return <Card className="overflow-hidden py-0"><CardContent aria-busy={busy} className="p-0"><Table><TableHeader><TableRow><TableHead>Sản phẩm</TableHead>{showSet && <TableHead>Set</TableHead>}<TableHead className="text-right">Tổng suất</TableHead><TableHead className="text-right">{statusLabel("REVISION")}</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
    {!plans.length && <TableRow><TableCell colSpan={columns}>{busy ? <LoadingState title="Đang tải set…" /> : s.ready && !s.error ? <EmptyState title="Chưa có set trong chỉ tiêu này" description="Tạo set để xác định khẩu phần và định mức nguyên liệu cho chỉ tiêu." action={s.canCreate ? <Button onClick={() => void s.begin()}>Tạo set</Button> : undefined} /> : null}</TableCell></TableRow>}
    {plans.map(plan => <TableRow key={plan.id}>
      <TableCell>
        <p className="font-medium text-foreground">{s.products.find(product => product.id === plan.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}</p>
        <Badge variant="outline" className="mt-1 text-xs font-normal">
          {plan.purpose === "PREPARATION" ? "Dự trù định mức" : "Kế hoạch nấu"}
        </Badge>
      </TableCell>
      {showSet && <TableCell className="font-mono text-xs">{variantLabel(plan.variant_sku_code)}</TableCell>}
      <TableCell className="text-right tabular-nums">{formatServings(plan.planned_quantity)}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">{plan.revision ?? ""}</TableCell>
      <TableCell><StatusBadge tone={statusTone(plan.status)}>{planStatuses[plan.status] ?? plan.status}</StatusBadge></TableCell>
      <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2">
        {plan.purpose === "PREPARATION" && s.canUpdate && <Button size="sm" variant="outline" disabled={busy} onClick={() => void s.begin(plan)}>Sửa set</Button>}
        {plan.purpose !== "PREPARATION" && s.canUpdate && ["DRAFT", "REVIEWED", "WAITING_PRICE_APPROVAL"].includes(plan.status) && <Button size="sm" disabled={busy} variant="outline" onClick={() => void s.legacyAction(plan)}>{plan.status === "DRAFT" ? "Thẩm định" : plan.status === "REVIEWED" ? "Công bố" : "Kiểm tra giá và bàn giao"}</Button>}
        {plan.purpose !== "PREPARATION" && plan.status === "PUBLISHED" && can("production:order:read") && <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/production/orders">Xem lệnh sản xuất</Link>}
        {can("production:material_requirement:read") && plan.purpose === "PREPARATION" && <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/production/material-requirements?food_plan_id=${encodeURIComponent(plan.id)}`}>Xem nhu cầu</Link>}
      </div></TableCell>
    </TableRow>)}
  </TableBody></Table></CardContent></Card>;
}
