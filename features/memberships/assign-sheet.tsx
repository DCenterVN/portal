"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import type { Branch } from "@/lib/api/branches-client";
import { AssignmentRow, type DraftRow } from "./assignment-row";
import { diffAssignments, type Person } from "./people";
import { applyChanges } from "./use-assignment";
import { useRoleCatalog } from "@/features/roles/use-roles";

type Props = {
  person: Person;
  branches: Branch[];
  viewerIsAdmin: boolean;
  isSelf: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  onSaved: () => Promise<unknown>;
  onClose: () => void;
};

const fromPerson = (person: Person): DraftRow[] => person.assignments.map((item) => ({ ...item, key: item.branchId }));

export function AssignSheet({ person, branches, viewerIsAdmin, isSelf, canUpdate, canCreate, onSaved, onClose }: Props) {
  const [rows, setRows] = useState<DraftRow[]>(() => fromPerson(person));
  const [allBranches, setAllBranches] = useState(person.allBranches);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const catalog = useRoleCatalog();
  useEffect(() => {
    setRows((current) => [...fromPerson(person), ...current.filter((row) => !row.membershipId && errors[row.branchId])]);
    setAllBranches(person.allBranches);
  }, [person]);
  const readOnly = isSelf || !canUpdate || busy;
  const changes = diffAssignments(person, rows, allBranches);
  const incomplete = rows.some((row) => !row.branchId || row.roles.length === 0);
  const taken = new Set(rows.map((row) => row.branchId));
  const open = branches.filter((branch) => branch.status !== "CLOSED");

  const patch = (key: string, next: DraftRow) => setRows((current) => current.map((row) => (row.key === key ? next : row)));
  const addRow = () => setRows((current) => [...current, { key: `new-${current.length}-${Date.now()}`, branchId: "", branchName: "", roles: [], locked: false }]);

  async function save() {
    setBusy(true);
    const failed = await applyChanges(person, changes);
    setErrors(failed);
    await onSaved();
    setBusy(false);
    if (Object.keys(failed).length === 0) {
      toast.success(`Đã lưu phân công của ${person.name}.`);
      onClose();
    }
  }

  function reset() {
    setRows(fromPerson(person));
    setAllBranches(person.allBranches);
    setErrors({});
  }

  return (
    <Sheet open onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
      <SheetContent showCloseButton={false} className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Phân công: {person.name}</SheetTitle>
          <SheetDescription>{person.email}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          {isSelf && <InlineAlert tone="info">Bạn không thể sửa phân công của chính mình.</InlineAlert>}
          {catalog.error && <InlineAlert>Không tải được danh sách vai trò. <Button type="button" variant="outline" size="sm" onClick={() => void catalog.mutate()}>Thử lại</Button></InlineAlert>}
          <ul className="space-y-3">
            {rows.map((row) => (
              <AssignmentRow
                key={row.key}
                row={row}
                branch={branches.find((branch) => branch.id === row.branchId)}
                freeBranches={open.filter((branch) => !taken.has(branch.id))}
                catalog={catalog.data}
                viewerIsAdmin={viewerIsAdmin}
                readOnly={readOnly}
                error={errors[row.branchId]}
                onChange={(next) => patch(row.key, next)}
                onRemove={() => setRows((current) => current.filter((item) => item.key !== row.key))}
              />
            ))}
          </ul>
          {!readOnly && canCreate && <Button type="button" variant="outline" onClick={addRow}><Plus className="size-4" />Thêm chi nhánh</Button>}
          {viewerIsAdmin && (
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm">
              <Switch checked={allBranches} disabled={readOnly || !person.flagMembershipId} onCheckedChange={setAllBranches} />
              <span>
                <span className="block font-medium">Xem mọi chi nhánh</span>
                <span className="block text-muted-foreground">Dùng vai trò ở bếp trung tâm cho mọi cửa hàng.</span>
              </span>
            </label>
          )}
        </div>
        {changes.length > 0 && (
          <SheetFooter className="border-t border-border bg-card sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium">{changes.length} thay đổi chưa lưu{incomplete && <span className="block text-xs font-normal text-muted-foreground">Mỗi chi nhánh cần chọn ít nhất một vai trò.</span>}</p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={reset}>Huỷ</Button>
              <Button type="button" disabled={busy || incomplete} onClick={() => void save()}>{busy ? "Đang lưu…" : "Lưu"}</Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
