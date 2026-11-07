"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { branchTypeLabel } from "@/lib/branch-label";
import { AddStaffDialog } from "./add-staff-dialog";
import { BranchInfoPanel } from "./branch-info-panel";
import { BranchStaffPanel } from "./branch-staff-panel";
import { BranchStatusMenu } from "./branch-status-menu";
import { BRANCH_STATUS, useBranchStaff, useBranches } from "./use-branches";

type Props = { branchId: string; justCreated: boolean };

export function BranchDetailView({ branchId, justCreated }: Props) {
  const { can, scope } = useAccess();
  const branches = useBranches(can("org:branch:read"));
  const people = useBranchStaff(can("org:membership:read"), branchId);
  const [adding, setAdding] = useState(false);
  const branch = branches.data?.find((item) => item.id === branchId);
  const open = branch?.status !== "CLOSED";
  const canAdd = open && can("org:employee:create");
  const canChange = open && branch?.type === "STORE" && can("org:branch:update");
  const banner = justCreated && people.staff?.length === 0 && canAdd;

  async function refresh() {
    await Promise.all([branches.mutate(), people.mutate()]);
  }

  return (
    <RequireAction action="org:branch:read">
      <PageShell className="space-y-4">
        <Link href="/branches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Tất cả chi nhánh</Link>
        {branches.isLoading ? <LoadingState title="Đang tải chi nhánh…" />
          : branches.error || !branches.data ? <ErrorState title="Không tải được chi nhánh." onRetry={() => void branches.mutate()} />
          : !branch ? <ErrorState title="Không tìm thấy chi nhánh này." />
          : (
            <>
              <PageHeading
                title={branch.name}
                badge={<><Badge variant="outline">{branchTypeLabel(branch.type)}</Badge><StatusBadge tone={BRANCH_STATUS[branch.status].tone}>{BRANCH_STATUS[branch.status].label}</StatusBadge></>}
                actions={canChange ? <BranchStatusMenu branch={branch} onChanged={branches.mutate} /> : undefined}
              />
              {banner && (
                <InlineAlert tone="info">
                  <span className="flex flex-wrap items-center justify-between gap-3">
                    <span>Đã tạo {branch.name}. Bước tiếp: thêm nhân viên.</span>
                    <Button size="sm" onClick={() => setAdding(true)}><UserPlus className="size-4" />Thêm nhân viên</Button>
                  </span>
                </InlineAlert>
              )}
              {branch.status === "SUSPENDED" && branch.id !== scope?.branchId && <InlineAlert tone="warning">Chi nhánh đang tạm ngừng: không nhận đơn mới, chỉ xử lý đơn đang có.</InlineAlert>}
              {branch.status === "CLOSED" && <InlineAlert tone="info">Chi nhánh đã đóng. Chỉ còn xem.</InlineAlert>}
              <Tabs defaultValue="staff" className="space-y-3">
                <TabsList>
                  <TabsTrigger value="staff">Nhân viên</TabsTrigger>
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                </TabsList>
                <TabsContent value="staff">
                  <BranchStaffPanel staff={people.staff} error={!!people.error} loading={people.isLoading} onRetry={() => void people.mutate()} branchName={branch.name} onAdd={canAdd && !banner ? () => setAdding(true) : undefined} />
                </TabsContent>
                <TabsContent value="info"><BranchInfoPanel branch={branch} /></TabsContent>
              </Tabs>
              <AddStaffDialog open={adding} onOpenChange={setAdding} branch={branch} members={people.data ?? []} onSaved={refresh} />
            </>
          )}
      </PageShell>
    </RequireAction>
  );
}
