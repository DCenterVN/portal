"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { branchLabel, branchTypeLabel } from "@/lib/branch-label";
import { BranchFormDialog } from "./branch-form-dialog";
import { BRANCH_STATUS, useBranches } from "./use-branches";

export function BranchesView() {
  const { can } = useAccess();
  const { data, error, isLoading, mutate } = useBranches(can("org:branch:read"));
  const [adding, setAdding] = useState(false);
  const add = can("org:branch:create") ? <Button onClick={() => setAdding(true)}><Plus className="size-4" />Thêm cửa hàng</Button> : undefined;

  return (
    <RequireAction action="org:branch:read">
      <PageShell className="space-y-4">
        <PageHeading title="Chi nhánh" badge={data && <Badge variant="outline">{data.length} chi nhánh</Badge>} description="Bếp trung tâm và các cửa hàng. Bấm vào một dòng để xem nhân viên và trạng thái." actions={add} />
        {isLoading ? <LoadingState title="Đang tải chi nhánh…" />
          : error || !data ? <ErrorState title="Không tải được danh sách chi nhánh." onRetry={() => void mutate()} />
          : data.length === 0 ? <EmptyState title="Chưa có chi nhánh" action={add} />
          : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Tên</TableHead><TableHead>Loại</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Nhân viên</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {data.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell><Link href={`/branches/${branch.id}`} className="font-medium underline-offset-4 hover:underline">{branchLabel(branch)}</Link></TableCell>
                      <TableCell>{branchTypeLabel(branch.type)}</TableCell>
                      <TableCell><StatusBadge tone={BRANCH_STATUS[branch.status].tone}>{BRANCH_STATUS[branch.status].label}</StatusBadge></TableCell>
                      <TableCell className="text-right">{branch.employee_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        <BranchFormDialog open={adding} onOpenChange={setAdding} onCreated={() => mutate()} />
      </PageShell>
    </RequireAction>
  );
}
