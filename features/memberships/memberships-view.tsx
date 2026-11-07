"use client";

import { useMemo, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { branchLabel, branchMeta } from "@/lib/branch-label";
import { roleName } from "@/lib/permission-labels";
import { AddStaffDialog } from "@/features/branches/add-staff-dialog";
import { useBranches } from "@/features/branches/use-branches";
import { useMemberships } from "@/features/roles/use-roles";
import { AssignSheet } from "./assign-sheet";
import { filterPeople, groupByPerson, type Person } from "./people";

function chipText(branchName: string, roles: readonly string[], locked: boolean): string {
  const text = roles.length ? `${branchName} · ${roles.map(roleName).join(", ")}` : branchName;
  return locked ? `${text} (khoá)` : text;
}

export function MembershipsView({ membershipId }: { membershipId?: string }) {
  const { can, scope } = useAccess();
  const members = useMemberships(can("org:membership:read"));
  const branches = useBranches(can("org:branch:read"));
  const [branchId, setBranchId] = useState("");
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<string | null | undefined>(undefined);
  const [adding, setAdding] = useState(false);
  const people = useMemo(() => groupByPerson(members.data ?? [], branches.data ?? []), [members.data, branches.data]);
  const shown = filterPeople(people, branchId, query);
  const fromLink = members.data?.find((member) => member.id === membershipId)?.user_id;
  const selected = people.find((person) => person.userId === (picked === undefined ? fromLink : picked));
  const openBranches = (branches.data ?? []).filter((branch) => branch.status !== "CLOSED");
  const canAdd = can("org:employee:create") && openBranches.length > 0;
  const add = canAdd ? <Button onClick={() => setAdding(true)}><UserPlus className="size-4" />Thêm nhân viên</Button> : undefined;

  function close() {
    setPicked(null);
    if (membershipId) window.history.replaceState(null, "", "/memberships");
  }

  const open = (person: Person) => setPicked(person.userId);

  return (
    <RequireAction action="org:membership:read">
      <PageShell className="space-y-4">
        <PageHeading title="Nhân viên" description="Mỗi người một dòng, làm ở những chi nhánh nào và giữ vai trò gì. Bấm vào một người để phân công." actions={add} />
        <div className="flex flex-wrap items-end gap-3">
          {(branches.data?.length ?? 0) > 0 && (
            <EntityPicker
              className="w-64"
              label="Lọc theo chi nhánh"
              name="memberships-branch-filter"
              serializeValue={false}
              items={branches.data}
              status="ready"
              getId={(branch) => branch.id}
              getLabel={branchLabel}
              getMeta={(branch) => branchMeta(branch)}
              value={branchId || null}
              onChange={(id) => setBranchId(id ?? "")}
              placeholder="Tất cả chi nhánh"
              searchPlaceholder="Gõ tên chi nhánh"
            />
          )}
          <InputGroup className="w-72">
            <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
            <InputGroupInput placeholder="Tìm theo tên hoặc email" aria-label="Tìm nhân viên" value={query} onChange={(event) => setQuery(event.target.value)} />
          </InputGroup>
        </div>
        {members.isLoading ? <LoadingState title="Đang tải nhân viên…" />
          : members.error || !members.data ? <ErrorState title="Không tải được danh sách nhân viên." onRetry={() => void members.mutate()} />
          : shown.length === 0 ? <EmptyState title={people.length === 0 ? "Chưa có nhân viên" : "Không có ai khớp"} description={people.length === 0 ? "Thêm nhân viên và chọn vai trò để bắt đầu làm việc." : "Đổi chi nhánh hoặc từ khoá tìm."} action={people.length === 0 ? add : undefined} />
          : (
            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Nhân viên</TableHead><TableHead>Chi nhánh và vai trò</TableHead><TableHead>Trạng thái</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {shown.map((person) => {
                    const active = person.assignments.some((item) => !item.locked);
                    return (
                      <TableRow key={person.userId} className="cursor-pointer" tabIndex={0} onClick={() => open(person)} onKeyDown={(event) => { if (event.key === "Enter") open(person); }}>
                        <TableCell className="align-top"><span className="block font-medium">{person.name || "—"}</span>{person.email && person.email !== person.name && <span className="block text-xs text-muted-foreground">{person.email}</span>}</TableCell>
                        <TableCell><div className="flex flex-wrap gap-1.5">
                          {person.allBranches && <Badge>Mọi chi nhánh</Badge>}
                          {person.assignments.map((item) => <Badge key={item.branchId} variant="secondary">{chipText(item.branchName, item.roles, item.locked)}</Badge>)}
                        </div></TableCell>
                        <TableCell className="align-top"><StatusBadge tone={active ? "success" : "warning"}>{active ? "Đang hoạt động" : "Tạm khoá"}</StatusBadge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        {selected && (
          <AssignSheet
            key={selected.userId}
            person={selected}
            branches={branches.data ?? []}
            viewerIsAdmin={scope?.roles.includes("ADMIN") ?? false}
            isSelf={selected.userId === scope?.userId}
            canUpdate={can("org:membership:update")}
            canCreate={can("org:employee:create")}
            onSaved={() => members.mutate()}
            onClose={close}
          />
        )}
        {canAdd && <AddStaffDialog open={adding} onOpenChange={setAdding} branch={openBranches.find((branch) => branch.id === branchId) ?? openBranches[0]} branches={openBranches} members={members.data ?? []} onSaved={() => members.mutate()} />}
      </PageShell>
    </RequireAction>
  );
}
