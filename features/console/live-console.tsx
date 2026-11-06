"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PermissionGrid } from "@/features/platform/permission-grid";
import { resourcesOf } from "@/features/platform/use-role-matrix";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";

type AccessContext = { org_id: string; org_name: string; branch_id: string; branch_name: string; roles: string[] };
type ConsoleResponse = { user: { id?: string; display_name?: string; email?: string }; contexts: AccessContext[]; active_context: { org_id: string; branch_id: string }; permissions: string[]; limitations: string[] };

export function LiveConsole() {
  const { data, error, isLoading, mutate } = useSWR<ConsoleResponse>("/api/console", fetcher, { revalidateOnFocus: false, errorRetryCount: 1 });
  if (isLoading) return <PageShell><LoadingState title="Đang tải dữ liệu vận hành…" /></PageShell>;
  if (error || !data) return <PageShell><ErrorState title="Không thể tải console" description={error instanceof Error ? error.message : "Backend không trả về dữ liệu hợp lệ."} onRetry={() => void mutate()} /></PageShell>;
  if (data.contexts.length === 0 && data.permissions.length === 0) return <PageShell><EmptyState title="Chưa có dữ liệu vận hành" description="Tài khoản chưa có phạm vi truy cập hoặc quyền nào." /></PageShell>;
  return <PageShell className="space-y-6 py-8">
    <PageHeading title="Console vận hành" description="Dữ liệu trực tiếp theo phạm vi tổ chức và quyền của phiên đăng nhập hiện tại" />
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Người dùng</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.user.display_name || data.user.email || data.user.id || "Không có tên hiển thị"}</strong></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Phạm vi</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.contexts.length}</strong><span className="ml-2 text-xs text-muted-foreground">chi nhánh được truy cập</span></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-xs font-medium text-muted-foreground">Quyền hiệu lực</CardTitle></CardHeader><CardContent><strong className="text-2xl font-semibold tabular-nums">{data.permissions.length}</strong><span className="ml-2 text-xs text-muted-foreground">action key từ Org</span></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Tổ chức và chi nhánh</CardTitle></CardHeader><CardContent className="divide-y divide-border">{data.contexts.length === 0 ? <p className="py-4 text-sm text-muted-foreground">Tài khoản chưa có phạm vi truy cập.</p> : data.contexts.map((context) => <div className="grid gap-1 py-4 sm:grid-cols-3" key={`${context.org_id}:${context.branch_id}`}><strong>{context.org_name}</strong><span>{context.branch_name}</span><span className="text-xs text-muted-foreground">{context.roles.join(", ") || "Chưa gán vai trò"}</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Quyền đã phân giải</CardTitle></CardHeader><CardContent>{data.permissions.length === 0 ? <p className="text-sm text-muted-foreground">Không có action key trong phạm vi đang chọn.</p> : <PermissionGrid actions={data.permissions} resources={resourcesOf({ me: data.permissions })} />}</CardContent></Card>
    <InlineAlert tone="warning"><strong>Giới hạn backend hiện tại</strong><ul className="mt-2 list-disc space-y-1 pl-5">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul></InlineAlert>
  </PageShell>;
}
