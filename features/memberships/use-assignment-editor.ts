"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toast";
import type { Branch } from "@/lib/api/branches-client";
import type { DraftRow } from "./assignment-row";
import { diffAssignments, type Person } from "./people";
import { applyChanges } from "./use-assignment";
import { useRoleCatalog } from "@/features/roles/use-roles";

export type AssignmentEditorProps = {
  person: Person;
  branches: Branch[];
  viewerIsAdmin: boolean;
  isSelf: boolean;
  canUpdate: boolean;
  canCreate: boolean;
  onSaved: () => Promise<unknown>;
  onComplete?: () => void;
  onBusyChange?: (busy: boolean) => void;
};
const fromPerson = (person: Person): DraftRow[] => person.assignments.map((item) => ({ ...item, key: item.branchId }));

export function useAssignmentEditor({ person, branches, isSelf, canUpdate, onSaved, onComplete, onBusyChange }: AssignmentEditorProps) {
  const t = useTranslations("record");
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
    onBusyChange?.(true);
    const failed = await applyChanges(person, changes);
    setErrors(failed);
    await onSaved();
    setBusy(false);
    onBusyChange?.(false);
    if (Object.keys(failed).length === 0) {
      toast.success(t("assignmentSaved", { name: person.name }));
      onComplete?.();
    }
  }

  function reset() {
    setRows(fromPerson(person));
    setAllBranches(person.allBranches);
    setErrors({});
  }

  return { rows, setRows, allBranches, setAllBranches, errors, busy, catalog, readOnly, changes, incomplete, taken, open, patch, addRow, save, reset };
}
