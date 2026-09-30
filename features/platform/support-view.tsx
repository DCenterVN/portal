"use client";

import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { LifeBuoy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page";
import { Skeleton, EmptyState, ErrorState } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TablePager, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { SupportRequestForm } from "./support-request-form";
import { grantLabels, grantState, useMySupport, type SupportGrant } from "./use-support";

export function GrantTable({ grants, who, actions }: { grants: SupportGrant[]; who: "company" | "user"; actions?: (grant: SupportGrant) => ReactNode }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{who === "company" ? "Công ty (MAIN)" : "Người nền tảng"}</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="hidden md:table-cell">Lý do</TableHead>
          <TableHead className="hidden md:table-cell">Hiệu lực</TableHead>
          {actions && <TableHead className="text-right">Thao tác</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grants.map((grant) => {
          const state = grantLabels[grantState(grant)];
          return (
            <TableRow key={grant.id}>
              <TableCell className="font-mono text-xs">{who === "company" ? grant.root_branch_id : grant.platform_user_id}</TableCell>
              <TableCell>
                <div className="flex flex-col items-start gap-1">
                  <Badge variant={state.variant}>{state.label}</Badge>
                  <span className="text-xs text-[var(--muted-foreground)]">{grant.mode}</span>
                </div>
              </TableCell>
              <TableCell className="hidden max-w-xs md:table-cell">
                <p className="line-clamp-2 text-sm">{grant.reason}</p>
                {grant.ticket_ref && <p className="font-mono text-xs text-[var(--muted-foreground)]">{grant.ticket_ref}</p>}
              </TableCell>
              <TableCell className="hidden text-xs text-[var(--muted-foreground)] md:table-cell">
                {grant.starts_at ? `${formatTime(grant.starts_at)} → ${formatTime(grant.expires_at)}` : `Tạo ${formatTime(grant.created_at)}`}
              </TableCell>
              {actions && <TableCell className="text-right">{actions(grant)}</TableCell>}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function MyGrants() {
  const [page, setPage] = useState(1);
  const { can } = useAccess();
  const { data, error, isLoading, isValidating, mutate } = useMySupport(page);
  return (
    <>
      <PageHeader icon={<LifeBuoy />} title="Hỗ trợ truy cập" description="Quyền ngang OWNER có thời hạn, luôn ghi audit theo công ty." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <SupportRequestForm canBreakGlass={can("platform:support_access:break_glass")} onDone={() => void mutate()} />
        <section aria-labelledby="my-grants" className="space-y-3">
          <h2 id="my-grants" className="text-sm font-semibold">
            Grant của tôi
          </h2>
          {isLoading ? (
            <Skeleton title="Đang tải grant…" />
          ) : error || !data ? (
            <ErrorState title={errorText(error)} onRetry={() => void mutate()} />
          ) : data.items.length === 0 ? (
            <EmptyState title={page > 1 ? "Không còn grant ở trang này." : "Bạn chưa xin quyền hỗ trợ nào."} action={page > 1 && <Button variant="outline" size="touch" onClick={() => setPage(page - 1)}>Trang trước</Button>} />
          ) : (
            <div>
              <GrantTable grants={data.items} who="company" />
              <TablePager page={page} hasNext={data.items.length === data.limit} onPage={setPage} busy={isValidating} />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export function SupportView() {
  return (
    <RequireAction action="platform:support_access:request">
      <MyGrants />
    </RequireAction>
  );
}
