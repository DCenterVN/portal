"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { branchLabel, type BranchType } from "@/lib/branch-label";
import { groupPermissions, roleName } from "@/lib/permission-labels";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";

type AccessContext = { org_id: string; org_name: string; branch_id: string; branch_name: string; branch_type?: BranchType; roles: string[] };
type ConsoleResponse = { user: { display_name?: string; email?: string }; contexts: AccessContext[]; permissions: string[] };

function PermissionList({ keys }: { keys: string[] }) {
  return (
    <div className="space-y-4">
      {groupPermissions(keys, keys).map((group) => (
        <section key={group.area} className="space-y-2">
          <h3 className="text-sm font-medium">{group.area}<span className="ml-2 text-xs font-normal text-muted-foreground">{group.total} quyền</span></h3>
          <div className="flex flex-wrap gap-1.5">{group.items.map((item) => <Badge key={item.key} variant="secondary">{item.label}</Badge>)}</div>
        </section>
      ))}
    </div>
  );
}

export function LiveConsole() {
  const { data, error, isLoading, mutate } = useSWR<ConsoleResponse>("/api/console", fetcher, { revalidateOnFocus: false, errorRetryCount: 1 });
  if (isLoading) return <PageShell><LoadingState title="Đang tải dữ liệu vận hành…" /></PageShell>;
  if (error || !data) return <PageShell><ErrorState title="Không tải được trang tổng quan" description="Hệ thống chưa trả về dữ liệu. Hãy thử lại sau ít phút." onRetry={() => void mutate()} /></PageShell>;
  if (data.contexts.length === 0 && data.permissions.length === 0) return <PageShell><EmptyState title="Chưa có dữ liệu vận hành" description="Tài khoản chưa có phạm vi truy cập hoặc quyền nào." /></PageShell>;
  return <PageShell className="space-y-6 py-8">
    <PageHeading title="Console vận hành" description="Các chi nhánh bạn được vào và những việc bạn được phép làm ở chi nhánh đang chọn" />
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Người dùng</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.user.display_name || data.user.email || "Chưa có tên hiển thị"}</strong></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Chi nhánh</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.contexts.length}</strong><span className="ml-2 text-xs text-muted-foreground">chi nhánh được vào</span></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Quyền</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.permissions.length}</strong><span className="ml-2 text-xs text-muted-foreground">việc được phép làm</span></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Chi nhánh bạn được vào</CardTitle></CardHeader><CardContent className="divide-y divide-border">{data.contexts.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Tài khoản chưa có phạm vi truy cập.</p> : data.contexts.map((context) => <div className="grid gap-1 py-4 sm:grid-cols-2" key={`${context.org_id}:${context.branch_id}`}><strong>{context.branch_type ? branchLabel({ name: context.branch_name, type: context.branch_type, org: context.org_name }) : context.branch_name}</strong><span className="text-xs text-muted-foreground">{context.roles.map(roleName).join(", ") || "Chưa gán vai trò"}</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Việc bạn được phép làm</CardTitle></CardHeader><CardContent>{data.permissions.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có quyền nào ở chi nhánh đang chọn.</p> : <PermissionList keys={data.permissions} />}</CardContent></Card>
  </PageShell>;
}
