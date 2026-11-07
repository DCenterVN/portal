"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import type { Membership } from "@/lib/api/platform-client";
import { roleName } from "@/lib/permission-labels";
import { holdingPeople } from "@/features/memberships/people";

type Props = { role: string; members?: Membership[]; error: boolean; loading: boolean; onRetry: () => void };

export function HoldersPanel({ role, members, error, loading, onRetry }: Props) {
  if (loading) return <LoadingState title="Đang tải danh sách nhân viên…" />;
  if (error || !members) return <ErrorState title="Không tải được danh sách nhân viên." onRetry={onRetry} />;
  const holders = holdingPeople(members, role);
  if (holders.length === 0) return <EmptyState title={`Chưa có ai giữ vai trò ${roleName(role)}`} description="Vào trang Nhân viên để gán vai trò này." action={<Link className="text-sm font-medium underline" href="/memberships">Mở trang Nhân viên</Link>} />;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {holders.map((person) => {
        const codes = [...new Set(person.assignments.flatMap((item) => item.roles))];
        const active = person.assignments.some((item) => !item.locked);
        return (
          <li key={person.userId}>
            <Link href={`/memberships?membership=${person.assignments[0].membershipId}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-muted">
              <span className="min-w-0"><span className="block font-medium">{person.name || "Chưa có tên"}</span>{person.name !== person.email && person.email && <span className="block text-xs text-muted-foreground">{person.email}</span>}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                {codes.map((code) => <Badge key={code} variant={code === role ? "default" : "secondary"}>{roleName(code)}</Badge>)}
                <StatusBadge tone={active ? "success" : "warning"}>{active ? "Đang hoạt động" : "Tạm khoá"}</StatusBadge>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
