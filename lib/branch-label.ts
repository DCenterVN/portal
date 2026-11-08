import { roleName } from "@/lib/permission-labels";

export type BranchType = string;

export function branchTypeLabel(type: BranchType): string {
  if (type === "CENTRAL_KITCHEN") return "Bếp trung tâm";
  return type === "STORE" ? "Cửa hàng" : type;
}

const hasText = (text: string, part: string) => text.toLowerCase().includes(part.toLowerCase());

export function branchLabel(branch: { name: string; type: BranchType; org?: string }): string {
  if (branch.type === "CENTRAL_KITCHEN") {
    const kind = branchTypeLabel(branch.type);
    return hasText(branch.name, kind) ? branch.name : `${branch.name} · ${kind}`;
  }
  return branch.org && !hasText(branch.name, branch.org) ? `${branch.org} · ${branch.name}` : branch.name;
}

export type BranchChoice = { id: string; name: string; type: BranchType; status: "ACTIVE" | "SUSPENDED"; roles?: string[]; org?: string; code?: string };

const STATUS_LABEL = { ACTIVE: "Đang hoạt động", SUSPENDED: "Tạm ngừng", CLOSED: "Đã đóng" } as const;

export function branchStatusLabel(status: keyof typeof STATUS_LABEL): string {
  return STATUS_LABEL[status];
}

export function branchMeta(branch: { type: BranchType; status: keyof typeof STATUS_LABEL; code?: string; name?: string; org?: string }, roles: readonly string[] = []): string {
  const kind = branchTypeLabel(branch.type);
  const said = branch.name !== undefined && hasText(branchLabel({ name: branch.name, type: branch.type, org: branch.org }), kind);
  return [branch.code, said ? "" : kind, branchStatusLabel(branch.status), roles.map(roleName).join(", ")].filter(Boolean).join(" · ");
}
