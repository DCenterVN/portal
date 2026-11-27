"use client";

import Link from "next/link";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConsoleCharts } from "./console-charts";
import { formatContextBranch, formatContextRoles, useConsoleOverview } from "./use-console-overview";

function OverviewSkeleton() {
  return (
    <PageShell className="space-y-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-lg border bg-card p-4">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="mt-2 h-7 w-14" />
            <Skeleton className="mt-2 h-3.5 w-40" />
          </div>
        ))}
      </div>
      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-b bg-muted/40 px-4 py-2.5">
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-1.5 px-4 py-3">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-3.5 w-36" />
            </div>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}

export function LiveConsole() {
  const {
    data,
    error,
    isLoading,
    mutate,
    activeBranch,
    kpis,
    queues,
    queuesLoading,
    queuesLoaded,
    partialError,
    retryQueues,
    primaryAction,
    canOrg,
    hasQueueWork,
    canProduct,
    canSupplier,
    canProductionOrder,
    canSalesOrder,
    materialBars,
    dishSummary,
    supplierOverview,
    orderSummary,
    salesSummary,
  } = useConsoleOverview();

  if (!data && isLoading) return <OverviewSkeleton />;
  if (error || !data) {
    return (
      <PageShell>
        <ErrorState
          title="Không tải được trang tổng quan"
          description="Hệ thống chưa trả về dữ liệu. Hãy thử lại sau ít phút."
          onRetry={() => void mutate()}
        />
      </PageShell>
    );
  }
  if (data.contexts.length === 0 && data.permissions.length === 0) {
    return (
      <PageShell>
        <EmptyState
          title="Chưa có dữ liệu vận hành"
          description="Tài khoản chưa có phạm vi truy cập hoặc quyền nào."
        />
      </PageShell>
    );
  }

  const branchTitle = activeBranch ? formatContextBranch(activeBranch) : "";
  const branchRoles = activeBranch ? formatContextRoles(activeBranch) : "";
  const subtitle = [branchTitle, branchRoles].filter(Boolean).join(" — ") || "Việc cần xử lý tại chi nhánh đang làm việc";

  return (
    <PageShell className="space-y-6 py-8">
      <PageHeading
        title="Tổng quan"
        description={subtitle}
        actions={primaryAction && <Button asChild><Link href={primaryAction.href}>{primaryAction.label}</Link></Button>}
      />

      {partialError && (
        <InlineAlert tone="warning" className="flex items-center justify-between gap-3">
          <span>Một số đầu việc chưa tải được.</span>
          <Button type="button" variant="outline" size="sm" onClick={retryQueues}>Thử lại</Button>
        </InlineAlert>
      )}

      {kpis.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map(kpi => (
            <Link
              key={kpi.id}
              href={kpi.href}
              className={cn(
                "block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                kpi.count > 0 && "border-t-[3px] border-t-primary"
              )}
            >
              <span className="block text-xs font-medium text-muted-foreground">{kpi.label}</span>
              {queuesLoading ? (
                <Skeleton className="mt-1 h-8 w-12" />
              ) : (
                <span className="mt-1 block text-2xl font-semibold tabular-nums text-foreground">
                  {kpi.error ? "—" : `${kpi.count}${kpi.plus ? "+" : ""}`}
                </span>
              )}
              <span className="mt-1 block text-xs text-muted-foreground">{kpi.hint}</span>
            </Link>
          ))}
        </div>
      )}

      <ConsoleCharts
        loading={queuesLoading}
        canProduct={canProduct}
        canSupplier={canSupplier}
        canProductionOrder={canProductionOrder}
        canSalesOrder={canSalesOrder}
        materialBars={materialBars}
        dishSummary={dishSummary}
        supplierOverview={supplierOverview}
        orderSummary={orderSummary}
        salesSummary={salesSummary}
      />

      {queuesLoading ? (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="space-y-1.5 px-4 py-3">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ))}
          </div>
        </Card>
      ) : queues.length > 0 ? (
        <div className={cn("grid gap-4", queues.length > 1 && "xl:grid-cols-2")}>
          {queues.map(queue => (
            <Card key={queue.id} className="gap-0 overflow-hidden py-0">
              <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
                <h2 className="text-sm font-semibold">{queue.title}</h2>
                <Link href={queue.allHref} className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  Xem tất cả
                </Link>
              </div>
              <div className="divide-y divide-border">
                {queue.rows.map(row => (
                  <Link
                    key={row.id}
                    href={row.href}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {row.badge && <Badge variant="outline" className="shrink-0 font-normal">{row.badge}</Badge>}
                      <span className="min-w-0 truncate font-medium">{row.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{row.subtitle}</span>
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : !hasQueueWork ? (
        <EmptyState
          title={canOrg ? "Quản trị tổ chức" : "Chưa có đầu việc vận hành"}
          description={canOrg ? "Truy cập nhanh quản lý chi nhánh, nhân sự và phân quyền bên dưới." : "Vai trò hiện tại không có hàng đợi tác vụ tại chi nhánh này."}
          action={
            canOrg ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline" size="sm"><Link href="/branches">Chi nhánh</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/memberships">Nhân viên</Link></Button>
                <Button asChild variant="outline" size="sm"><Link href="/roles">Vai trò</Link></Button>
              </div>
            ) : undefined
          }
        />
      ) : queuesLoaded && queues.length === 0 && kpis.every(kpi => !kpi.error && kpi.count === 0) ? (
        <EmptyState
          title="Không còn việc tồn"
          description="Các đầu việc thuộc phạm vi của bạn tại chi nhánh này đều đã được xử lý."
        />
      ) : null}

      {data.contexts.length > 1 && (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <h2 className="text-sm font-semibold">Phạm vi chi nhánh của bạn</h2>
          </div>
          <div className="divide-y divide-border">
            {data.contexts.map(context => (
              <div key={`${context.org_id}:${context.branch_id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="font-medium">{formatContextBranch(context)}</span>
                <span className="text-xs text-muted-foreground">{formatContextRoles(context) || "Chưa gán vai trò"}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </PageShell>
  );
}
