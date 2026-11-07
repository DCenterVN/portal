"use client";

import { UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import type { Membership } from "@/lib/api/platform-client";
import { roleName } from "@/lib/permission-labels";

type Props = { staff?: Membership[]; error: boolean; loading: boolean; onRetry: () => void; branchName: string; onAdd?: () => void };

export function BranchStaffPanel({ staff, error, loading, onRetry, branchName, onAdd }: Props) {
  if (loading) return <LoadingState title="Đang tải nhân viên…" />;
  if (error || !staff) return <ErrorState title="Không tải được danh sách nhân viên." onRetry={onRetry} />;
  const add = onAdd ? <Button onClick={onAdd}><UserPlus className="size-4" />Thêm nhân viên</Button> : undefined;
  if (staff.length === 0) return <EmptyState title={`${branchName} chưa có nhân viên`} description="Thêm người làm việc ở chi nhánh này và chọn vai trò cho họ." action={add} />;
  return (
    <div className="space-y-3">
      {add && <div className="flex justify-end">{add}</div>}
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Tên</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead><TableHead>Trạng thái</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {staff.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.display_name || "—"}</TableCell>
                <TableCell>{member.email || "—"}</TableCell>
                <TableCell><div className="flex flex-wrap gap-1.5">{member.role_codes.map((code) => <Badge key={code} variant="secondary">{roleName(code)}</Badge>)}</div></TableCell>
                <TableCell><StatusBadge tone={member.status === "ACTIVE" ? "success" : "warning"}>{member.status === "ACTIVE" ? "Đang hoạt động" : "Tạm khoá"}</StatusBadge></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
