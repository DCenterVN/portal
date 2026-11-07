"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { Badge } from "@/components/ui/badge";
import { RolePicker } from "@/components/patterns/role-picker";
import type { RoleCatalogItem } from "@/lib/api/platform-client";
import type { Branch } from "@/lib/api/branches-client";
import { branchLabel, branchMeta } from "@/lib/branch-label";
import { roleOptionsFor } from "@/lib/role-catalog";
import type { Assignment } from "./people";

export type DraftRow = Assignment & { key: string; branchName: string };

type Props = {
  row: DraftRow;
  branch?: Branch;
  freeBranches: Branch[];
  catalog: RoleCatalogItem[] | undefined;
  viewerIsAdmin: boolean;
  readOnly: boolean;
  error?: string;
  onChange: (row: DraftRow) => void;
  onRemove: () => void;
};

export function roleChoices(catalog: readonly RoleCatalogItem[], branch: Branch | undefined, current: readonly string[], viewerIsAdmin: boolean) {
  return roleOptionsFor(catalog, branch?.type, current).filter((option) => option.code !== "ADMIN" || viewerIsAdmin || current.includes("ADMIN"));
}

const branchLabelOf = (branches: readonly Branch[], id: string) => {
  const found = branches.find((item) => item.id === id);
  return found ? branchLabel(found) : "";
};

export function AssignmentRow({ row, branch, freeBranches, catalog, viewerIsAdmin, readOnly, error, onChange, onRemove }: Props) {
  const picking = !row.membershipId && !row.branchId;
  const choices = catalog ? roleChoices(catalog, branch, row.roles, viewerIsAdmin) : [];
  const toggle = (code: string) => onChange({ ...row, roles: row.roles.includes(code) ? row.roles.filter((value) => value !== code) : [...row.roles, code] });
  return (
    <li className="space-y-3 rounded-lg border border-border p-3" data-invalid={error ? true : undefined}>
      <div className="flex items-center justify-between gap-2">
        {picking ? (
          <EntityPicker
            className="min-w-0 flex-1"
            label="Chi nhánh"
            name={`assign-branch-${row.key}`}
            serializeValue={false}
            items={freeBranches}
            status="ready"
            getId={(item) => item.id}
            getLabel={branchLabel}
            getMeta={(item) => branchMeta(item)}
            value={row.branchId || null}
            onChange={(id) => onChange({ ...row, branchId: id ?? "", branchName: id ? branchLabelOf(freeBranches, id) : "" })}
            placeholder="Chọn chi nhánh"
            searchPlaceholder="Gõ tên chi nhánh"
            emptyText="Chưa có chi nhánh nào để chọn."
          />
        ) : <p className="font-medium">{row.branchName}</p>}
        {!readOnly && <Button type="button" variant="ghost" size="sm" aria-label={`Bỏ khỏi ${row.branchName || "chi nhánh này"}`} onClick={onRemove}><Trash2 className="size-4" />Bỏ khỏi chi nhánh</Button>}
      </div>
      {picking ? <p className="text-sm text-muted-foreground">Chọn chi nhánh trước để thấy các vai trò dùng được ở đó.</p>
        : !catalog ? <p className="text-sm text-muted-foreground">Đang tải danh sách vai trò…</p>
        : <RolePicker label={`Vai trò ở ${row.branchName || "chi nhánh mới"}`} options={choices} selected={row.roles} onToggle={toggle} disabled={readOnly} lockedCodes={viewerIsAdmin ? [] : ["ADMIN"]} emptyText="Chi nhánh này chưa có vai trò nào dùng được." />}
      {row.membershipId && (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={row.locked} disabled={readOnly} onCheckedChange={(locked) => onChange({ ...row, locked })} />
          Khoá ở chi nhánh này
          {row.locked && <Badge variant="secondary">Đang khoá</Badge>}
        </label>
      )}
      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
    </li>
  );
}
