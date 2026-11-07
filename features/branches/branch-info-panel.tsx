import type { Branch } from "@/lib/api/branches-client";
import { branchTypeLabel } from "@/lib/branch-label";
import { BRANCH_STATUS } from "./use-branches";

export function BranchInfoPanel({ branch }: { branch: Branch }) {
  const rows: [string, string][] = [
    ["Tên", branch.name],
    ["Mã", branch.code],
    ["Loại", branchTypeLabel(branch.type)],
    ["Trạng thái", BRANCH_STATUS[branch.status].label],
    ["Số nhân viên", String(branch.employee_count)],
  ];
  return (
    <dl className="grid max-w-xl grid-cols-[10rem_1fr] gap-y-3 rounded-xl border border-border bg-card p-4 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className={label === "Mã" ? "font-mono" : "font-medium"}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
