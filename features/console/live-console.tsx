"use client";

import useSWR from "swr";
import { AlertCircle, Building2, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { fetcher } from "@/lib/fetcher";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PermissionGrid } from "@/features/platform/permission-grid";
import { resourcesOf } from "@/features/platform/use-role-matrix";

type AccessContext = { org_id: string; org_name: string; branch_id: string; branch_name: string; roles: string[] };
type ConsoleResponse = { user: { id?: string; display_name?: string; email?: string }; contexts: AccessContext[]; active_context: { org_id: string; branch_id: string }; permissions: string[]; limitations: string[] };

export function LiveConsole() {
  const { data, error, isLoading, mutate } = useSWR<ConsoleResponse>("/api/console", fetcher, { revalidateOnFocus: false, errorRetryCount: 1 });
  if (isLoading) return <PageShell><div className="flex min-h-64 items-center justify-center gap-2 text-sm text-[var(--muted-foreground)]"><LoaderCircle className="size-5 animate-spin" /> Đang tải dữ liệu vận hành…</div></PageShell>;
  if (error || !data) return <PageShell><div role="alert" className="mx-auto mt-12 max-w-xl border border-rose-500/40 bg-rose-500/10 p-5"><AlertCircle className="mb-3 size-6 text-rose-600" /><h1 className="font-serif text-xl font-bold">Không thể tải console</h1><p className="mt-2 text-sm text-[var(--muted-foreground)]">{error instanceof Error ? error.message : "Backend không trả về dữ liệu hợp lệ."}</p><Button className="mt-4" variant="outline" onClick={() => void mutate()}>Thử lại</Button></div></PageShell>;
  return <PageShell className="space-y-6 py-8">
    <PageHeader icon={<Building2 />} title="Console vận hành" description="Dữ liệu trực tiếp theo phạm vi tổ chức và quyền của phiên đăng nhập hiện tại" />
    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><UserRound className="size-4" /> Người dùng</CardTitle></CardHeader><CardContent><strong>{data.user.display_name || data.user.email || data.user.id || "Không có tên hiển thị"}</strong></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><Building2 className="size-4" /> Phạm vi</CardTitle></CardHeader><CardContent><strong>{data.contexts.length}</strong><span className="ml-2 text-xs text-[var(--muted-foreground)]">chi nhánh được truy cập</span></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-sm"><KeyRound className="size-4" /> Quyền hiệu lực</CardTitle></CardHeader><CardContent><strong>{data.permissions.length}</strong><span className="ml-2 text-xs text-[var(--muted-foreground)]">action key từ Org</span></CardContent></Card>
    </div>
    <Card><CardHeader><CardTitle className="text-base">Tổ chức và chi nhánh</CardTitle></CardHeader><CardContent className="divide-y divide-[var(--border)]">{data.contexts.length === 0 ? <p className="py-4 text-sm text-[var(--muted-foreground)]">Tài khoản chưa có phạm vi truy cập.</p> : data.contexts.map((context) => <div className="grid gap-1 py-4 sm:grid-cols-3" key={`${context.org_id}:${context.branch_id}`}><strong>{context.org_name}</strong><span>{context.branch_name}</span><span className="text-xs text-[var(--muted-foreground)]">{context.roles.join(", ") || "Chưa gán vai trò"}</span></div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Quyền đã phân giải</CardTitle></CardHeader><CardContent>{data.permissions.length === 0 ? <p className="text-sm text-[var(--muted-foreground)]">Không có action key trong phạm vi đang chọn.</p> : <PermissionGrid actions={data.permissions} resources={resourcesOf({ me: data.permissions })} />}</CardContent></Card>
    <aside className="border-l-4 border-amber-500 bg-amber-500/10 p-4 text-sm"><strong>Giới hạn backend hiện tại</strong><ul className="mt-2 list-disc space-y-1 pl-5">{data.limitations.map((item) => <li key={item}>{item}</li>)}</ul></aside>
  </PageShell>;
}
