import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { variantLabel } from "./food-plan-ratios";
import type { FoodPlansState } from "./use-food-plans";

export function FoodPlansTable({ s }: { s: FoodPlansState }) {
  const { plans, busy, can } = s;
  return <Card className="gap-0 overflow-hidden py-0"><CardContent aria-busy={busy} className="p-0"><Table><TableHeader className="bg-muted/50"><TableRow><TableHead>Sản phẩm</TableHead><TableHead>Set</TableHead><TableHead className="tabular-nums">Tổng suất</TableHead><TableHead className="tabular-nums">Revision</TableHead><TableHead className="text-right">Thao tác</TableHead></TableRow></TableHeader><TableBody>
    {!plans.length && <TableRow><TableCell colSpan={5} className="p-6">{busy ? <LoadingState title="Đang tải set…" /> : s.ready && !s.error ? <EmptyState title="Chưa có set trong chỉ tiêu này" description="Tạo set để xác định khẩu phần và định mức nguyên liệu cho chỉ tiêu." action={s.canCreate ? <Button onClick={() => void s.begin()}>Tạo set</Button> : undefined} /> : null}</TableCell></TableRow>}
    {plans.map(plan => <TableRow key={plan.id}><TableCell className="font-medium">{s.products.find(product => product.id === plan.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}</TableCell><TableCell>{variantLabel(plan.variant_sku_code)}</TableCell><TableCell className="tabular-nums">{plan.planned_quantity} {plan.uom}</TableCell><TableCell className="tabular-nums">{plan.revision ?? ""}</TableCell><TableCell className="text-right"><div className="flex flex-wrap items-center justify-end gap-2">
      {plan.purpose === "PREPARATION" && s.canUpdate && <Button variant="outline" size="sm" disabled={busy} onClick={() => void s.begin(plan)}>Sửa set</Button>}
      {plan.purpose !== "PREPARATION" && s.canUpdate && ["DRAFT", "REVIEWED", "WAITING_PRICE_APPROVAL"].includes(plan.status) && <Button disabled={busy} size="sm" variant="outline" onClick={() => void s.legacyAction(plan)}>{plan.status === "DRAFT" ? "Thẩm định" : plan.status === "REVIEWED" ? "Publish BOM" : "Kiểm tra & handoff"}</Button>}
      {can("production:material_requirement:read") && plan.purpose === "PREPARATION" && <Link className="text-sm underline-offset-4 hover:underline" href={`/production/material-requirements?food_plan_id=${encodeURIComponent(plan.id)}`}>Xem nhu cầu</Link>}
    </div></TableCell></TableRow>)}
  </TableBody></Table></CardContent></Card>;
}
