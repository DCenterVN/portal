"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { fold } from "@/components/patterns/entity-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format-date";
import type { FoodProductPlan, ProductionTarget } from "@/lib/api/production";
import { FoodPlanForm } from "./food-plan-form";
import { FoodPlansTable } from "./food-plans-table";
import { ProductionPlanForm } from "./production-plan-form";
import { ProductionFlowBar } from "./production-flow-bar";
import { targetStatuses } from "./order-status";
import { useFoodPlans } from "./use-food-plans";

const targetPriority: Record<ProductionTarget["status"], number> = {
  APPROVED: 0,
  IN_PLANNING: 1,
  HANDED_OFF: 2,
  IN_PRODUCTION: 3,
  DRAFT: 4,
  COMPLETED: 5,
  REJECTED: 6,
};

const readyTargetStatuses = new Set<ProductionTarget["status"]>(["APPROVED", "IN_PLANNING", "HANDED_OFF"]);

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const s = useFoodPlans(initialPlans, targetId);
  const [planning, setPlanning] = useState(false);
  const [targetQuery, setTargetQuery] = useState("");
  const [targetGroup, setTargetGroup] = useState<"all" | "ready">("all");
  const canPlan = !!targetId && s.canCreate && !!s.target && ["APPROVED", "IN_PLANNING", "HANDED_OFF", "IN_PRODUCTION"].includes(s.target.status);
  const normalizedQuery = fold(targetQuery).trim();
  const visibleTargets = [...s.targets]
    .sort((a, b) => (targetPriority[a.status] ?? 9) - (targetPriority[b.status] ?? 9))
    .filter((t) => {
      if (targetGroup === "ready" && !readyTargetStatuses.has(t.status)) return false;
      if (!normalizedQuery) return true;
      return fold(t.title).includes(normalizedQuery) || fold(t.target_code).includes(normalizedQuery);
    });

  return <PageShell>
    <PageHeading
      title="Thực đơn và định mức"
      description="Một set gồm nhiều suất. Định mức là lượng nguyên liệu cho một suất; lưu set chưa tạo định mức chính thức."
      actions={<>{canPlan && <Button variant="outline" disabled={s.busy} onClick={() => setPlanning(true)}>Tạo kế hoạch sản xuất</Button>}{s.canCreate && targetId && <Button disabled={s.busy} onClick={() => void s.begin()}>Tạo set</Button>}</>}
    />
    <ProductionFlowBar current="plans" targetId={targetId} />
    {s.error && <InlineAlert>{s.error} <Button variant="outline" onClick={() => s.retry ? s.retry() : void s.load()}>Thử lại</Button></InlineAlert>}
    {s.notice && <p role="status">{s.notice}</p>}
    {s.busy && (!targetId || s.plans.length > 0) && <LoadingState title="Đang tải hoặc lưu set…" />}

    {!targetId && <Card className="gap-0 overflow-hidden py-0">
      {s.ready && !s.error && s.targets.length === 0 ? (
        <CardContent className="p-4">
          <EmptyState title="Chưa có chỉ tiêu" description="Tạo chỉ tiêu sản xuất trước khi lập set." />
        </CardContent>
      ) : (
        <>
          <CardHeader className="flex flex-col gap-3 border-b bg-muted/30 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold">Chọn chỉ tiêu để xem và lập set</CardTitle>
              <p className="text-xs text-muted-foreground">Ưu tiên các chỉ tiêu đã duyệt hoặc đang lập kế hoạch ở đầu danh sách.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                type="search"
                aria-label="Tìm chỉ tiêu lập thực đơn"
                placeholder="Tìm tên hoặc mã chỉ tiêu…"
                value={targetQuery}
                onChange={(event) => setTargetQuery(event.target.value)}
                className="sm:w-56"
              />
              <div className="flex gap-1" role="group" aria-label="Lọc chỉ tiêu">
                <Button type="button" size="sm" variant={targetGroup === "all" ? "secondary" : "ghost"} onClick={() => setTargetGroup("all")}>Tất cả</Button>
                <Button type="button" size="sm" variant={targetGroup === "ready" ? "secondary" : "ghost"} onClick={() => setTargetGroup("ready")}>Đã duyệt &amp; đang lập</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chỉ tiêu</TableHead>
                  <TableHead className="hidden md:table-cell">Kỳ áp dụng</TableHead>
                  <TableHead>Số món</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTargets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <EmptyState
                        title="Không có chỉ tiêu phù hợp"
                        description="Thử đổi từ khóa tìm kiếm hoặc chọn bộ lọc khác."
                        action={<Button type="button" variant="outline" onClick={() => { setTargetQuery(""); setTargetGroup("all"); }}>Hiện tất cả</Button>}
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleTargets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="font-medium text-foreground">{t.title}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">{t.target_code}</p>
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap text-sm text-muted-foreground md:table-cell">
                        {formatDate(t.period_start)} – {formatDate(t.period_end)}
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">{t.lines.length} món</TableCell>
                      <TableCell>
                        <StatusBadge tone={statusTone(t.status)}>{targetStatuses[t.status] ?? t.status}</StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/production/food-plans?target_id=${encodeURIComponent(t.id)}`}>
                          Chọn chỉ tiêu
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </>
      )}
      <div className="border-t bg-muted/20 px-4 py-2.5">
        <Link className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" href="/production/targets">Danh sách chỉ tiêu</Link>
      </div>
    </Card>}

    {targetId && s.target && (
      <Card className="mb-6 border-l-[3px] border-l-primary py-4">
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-foreground">{s.target.title}</p>
              <span className="font-mono text-xs text-muted-foreground">{s.target.target_code}</span>
              <StatusBadge tone={statusTone(s.target.status)}>{targetStatuses[s.target.status] ?? s.target.status}</StatusBadge>
            </div>
            <p className="text-xs text-muted-foreground">
              Kỳ áp dụng: {formatDate(s.target.period_start)} – {formatDate(s.target.period_end)}
            </p>
            {s.target.lines.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {s.target.lines.map((line, index) => (
                  <Badge key={`${line.product_ref}-${index}`} variant="secondary">
                    {s.products.find((p) => p.id === line.product_ref)?.name ?? "Sản phẩm"} · {line.target_quantity} suất
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/production/food-plans">Đổi chỉ tiêu</Link>
            {s.can("production:material_requirement:read") && (
              <Link className={buttonVariants({ size: "sm", variant: "outline" })} href={`/production/material-requirements?target_id=${encodeURIComponent(s.target.id)}`}>
                Tính nhu cầu nguyên liệu
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    )}

    {planning && canPlan && targetId && <ProductionPlanForm targetId={targetId} productRefs={s.target?.lines.map(line => line.product_ref) ?? []} onCreated={() => { setPlanning(false); void s.load(); }} onClose={() => setPlanning(false)} />}
    <FoodPlanForm s={s} />
    {targetId && <FoodPlansTable s={s} />}
  </PageShell>;
}
