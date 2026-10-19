"use client";

import { useState, type FormEvent } from "react";
import { ScrollText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TablePager, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { RequireAction, useAccess, type PlaneAccess } from "./access-boundary";
import { readAuditFilters, useAudit, type AuditFilters, type AuditEntry } from "./use-audit";

function Change({ entry }: { entry: AuditEntry }) {
  if (entry.before === undefined && entry.after === undefined) return null;
  return (
    <details className="mt-1 text-xs">
      <summary className="inline-flex min-h-11 cursor-pointer items-center text-[var(--primary)]">Xem thay đổi</summary>
      <pre className="max-h-48 overflow-auto rounded-md bg-[var(--secondary)] p-2 font-mono text-xs">
        {JSON.stringify({ before: entry.before ?? null, after: entry.after ?? null }, null, 2)}
      </pre>
    </details>
  );
}

export function AuditLog({ source, root = "" }: { source: PlaneAccess["plane"]; root?: string }) {
  const [filters, setFilters] = useState<AuditFilters>({});
  const [page, setPage] = useState(1);
  const [invalid, setInvalid] = useState("");
  const { data, error, isLoading, isValidating, mutate } = useAudit(source, root, filters, page);

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = readAuditFilters(new FormData(event.currentTarget), false);
    setInvalid(result.error ?? "");
    if (!result.filters) return;
    setFilters(result.filters);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={apply} noValidate className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <Field label="Action" htmlFor={`audit-action-${source}`}>
              <TextInput id={`audit-action-${source}`} name="action" placeholder="vd. break_glass" autoComplete="off" />
            </Field>
            <Field label="Từ" htmlFor={`audit-since-${source}`}>
              <TextInput id={`audit-since-${source}`} name="since" type="datetime-local" />
            </Field>
            <Field label="Đến" htmlFor={`audit-until-${source}`}>
              <TextInput id={`audit-until-${source}`} name="until" type="datetime-local" />
            </Field>
            <Button type="submit" size="touch" variant="outline">
              Lọc
            </Button>
          </form>
          {invalid && <InlineAlert className="mt-3">{invalid}</InlineAlert>}
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton title="Đang tải nhật ký…" />
      ) : error || !data ? (
        <ErrorState title={errorText(error)} onRetry={() => void mutate()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Không có bản ghi audit khớp bộ lọc." action={page > 1 && <Button variant="outline" size="touch" onClick={() => setPage(page - 1)}>Trang trước</Button>} />
      ) : (
        <div>
          <Table aria-busy={isValidating}>
            <TableHeader>
              <TableRow>
                <TableHead>Thời điểm</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Người làm</TableHead>
                <TableHead className="hidden lg:table-cell">Đối tượng</TableHead>
                <TableHead className="hidden md:table-cell">Lý do / hợp đồng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-xs">{formatTime(entry.occurred_at)}</TableCell>
                  <TableCell>
                    <p className="font-mono text-xs font-semibold">{entry.action}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      <Badge variant="outline" dot={false}>{entry.plane}</Badge>
                      {entry.support_access_grant_id && <Badge variant="suspended">qua grant hỗ trợ</Badge>}
                    </div>
                    {source === "company" && <Change entry={entry} />}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{entry.actor_user_id ?? entry.actor_service ?? "—"}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">
                    {entry.target_type}
                    {entry.target_id && <span className="block font-mono text-xs text-[var(--muted-foreground)]">{entry.target_id}</span>}
                  </TableCell>
                  <TableCell className="hidden max-w-xs text-xs md:table-cell">
                    {entry.reason || "—"}
                    {entry.contract_ref && <span className="block font-mono text-xs text-[var(--muted-foreground)]">{entry.contract_ref}</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager page={page} hasNext={data.items.length === data.limit} onPage={setPage} busy={isValidating} />
        </div>
      )}
    </div>
  );
}

export function AuditView() {
  const { root } = useAccess();
  return (
    <RequireAction action="org:company:read">
      <PageHeader icon={<ScrollText />} title="Nhật ký kiểm toán" description="Chỉ đọc. Không sửa, không xoá." />
      <AuditLog source="platform" root={root} />
    </RequireAction>
  );
}
