"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Field } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/patterns/page-heading";
import { LoadingState, EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { TablePager } from "@/components/patterns/table-pager";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import type { PlaneAccess } from "@/lib/access-context";
import { readAuditFilters, useAudit, type AuditFilters, type AuditEntry } from "./use-audit";

function Change({ entry }: { entry: AuditEntry }) {
  if (entry.before === undefined && entry.after === undefined) return null;
  return (
    <Collapsible className="mt-1 text-xs">
      <CollapsibleTrigger asChild>
        <Button variant="link" size="sm">Xem thay đổi</Button>
      </CollapsibleTrigger>
      <CollapsibleContent forceMount>
      <pre className="max-h-48 overflow-auto rounded-md bg-muted p-2 font-mono text-xs">
        {JSON.stringify({ before: entry.before ?? null, after: entry.after ?? null }, (key, value: unknown) => {
          if (/^(?:id|.*_id|.*_ref)$/.test(key) && key !== "contract_ref") return undefined;
          if (typeof value === "string" && /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(value)) return undefined;
          return value;
        }, 2)}
      </pre>
      </CollapsibleContent>
    </Collapsible>
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
              <Input id={`audit-action-${source}`} name="action" placeholder="vd. break_glass" autoComplete="off" />
            </Field>
            <Field label="Từ" htmlFor={`audit-since-${source}`}>
              <Input id={`audit-since-${source}`} name="since" type="datetime-local" />
            </Field>
            <Field label="Đến" htmlFor={`audit-until-${source}`}>
              <Input id={`audit-until-${source}`} name="until" type="datetime-local" />
            </Field>
            <Button type="submit" variant="outline">
              Lọc
            </Button>
          </form>
          {invalid && <InlineAlert className="mt-3">{invalid}</InlineAlert>}
        </CardContent>
      </Card>
      {isLoading ? (
        <LoadingState title="Đang tải nhật ký…" />
      ) : error || !data ? (
        <ErrorState title={errorText(error)} onRetry={() => void mutate()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Không có bản ghi audit khớp bộ lọc." action={page > 1 && <Button variant="outline" onClick={() => setPage(page - 1)}>Trang trước</Button>} />
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
                      <Badge variant="outline">{entry.plane}</Badge>
                      {entry.support_access_grant_id && <StatusBadge tone="warning">qua grant hỗ trợ</StatusBadge>}
                    </div>
                    {source === "company" && <Change entry={entry} />}
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{entry.actor_service ?? "—"}</TableCell>
                  <TableCell className="hidden text-xs lg:table-cell">
                    {entry.target_type}
                  </TableCell>
                  <TableCell className="hidden max-w-xs text-xs md:table-cell">
                    {entry.reason || "—"}
                    {entry.contract_ref && !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(entry.contract_ref) && <p>{entry.contract_ref}</p>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager status={`Trang ${page}`} hasPrevious={page > 1} hasNext={data.items.length === data.limit} onPrevious={() => setPage(page - 1)} onNext={() => setPage(page + 1)} busy={isValidating} />
        </div>
      )}
    </div>
  );
}

export function AuditView() {
  const { root } = useAccess();
  return (
    <RequireAction action="org:company:read">
      <PageHeading title="Nhật ký kiểm toán" description="Chỉ đọc. Không sửa, không xoá." />
      <AuditLog source="platform" root={root} />
    </RequireAction>
  );
}
