"use client";

import React, { useState } from "react";
import {
  UserPlus,
  Search,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Ban,
  KeyRound,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell, PageHeader } from "@/components/ui/page";

export interface Employee {
  id: string;
  userId: string | null;
  branchId: string;
  name: string;
  phone: string;
  email: string;
  departmentId: string | null;
  departmentName: string;
  roles: { code: string; name: string }[];
  status: "active" | "suspended" | "revoked";
  joinedAt: string;
}

export const INITIAL_EMPLOYEES: Employee[] = [];

interface MembershipsViewProps {
  initialEmployees?: Employee[];
}

export function MembershipsView({ initialEmployees }: MembershipsViewProps) {
  const [employees, setEmployees] = useState<Employee[]>(
    initialEmployees ?? []
  );
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("VT-02");

  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.departmentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (id: string, newStatus: "active" | "suspended" | "revoked") => {
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === id ? { ...emp, status: newStatus } : emp))
    );
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    const roleObj =
      inviteRole === "VT-01"
        ? { code: "VT-01", name: "Giám đốc chi nhánh" }
        : inviteRole === "VT-02"
        ? { code: "VT-02", name: "Nhân viên bán hàng" }
        : { code: "VT-03", name: "Nhân viên kho" };

    const newEmp: Employee = {
      id: `emp-00${employees.length + 1}`,
      userId: `usr-u${employees.length + 1}-new`,
      branchId: "",
      name: inviteName,
      phone: invitePhone,
      email: inviteEmail,
      departmentId: "dept-general",
      departmentName: inviteRole === "VT-03" ? "Bộ phận Kho Lạnh Cấp Đông" : "Bộ phận Bán hàng",
      roles: [roleObj],
      status: "active",
      joinedAt: "Hôm nay",
    };

    setEmployees([newEmp, ...employees]);
    setShowInviteModal(false);
    setInviteName("");
    setInviteEmail("");
    setInvitePhone("");
  };

  return (
    <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <PageHeader
        icon={<Users />}
        title="Quản lý Thành viên Chi nhánh"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            Chi nhánh hiện tại
          </Badge>
        }
        description="Phân quyền nhân sự (Membership), kiểm soát trạng thái hoạt động và vai trò theo chi nhánh"
        actions={
          <Button
            onClick={() => setShowInviteModal(true)}
            size="sm"
          >
            <UserPlus className="size-3.5" />
            <span>Thêm / Mời Thành Viên</span>
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 pb-6">
        <Card className="p-4.5 rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--elevation-shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-muted)] font-semibold">Đang hoạt động (Active)</p>
              <p className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">
                {employees.filter((e) => e.status === "active").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-[var(--color-tint)] flex items-center justify-center text-[var(--color-leaf)] border border-[var(--color-line)]">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--elevation-shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-muted)] font-semibold">Tạm khoá (Suspended)</p>
              <p className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">
                {employees.filter((e) => e.status === "suspended").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-[var(--color-tint)] flex items-center justify-center text-[var(--color-sun)] border border-[var(--color-line)]">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-[var(--elevation-shadow-card)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-muted)] font-semibold">Đã thu hồi (Revoked)</p>
              <p className="text-2xl font-extrabold text-[var(--color-ink)] mt-1">
                {employees.filter((e) => e.status === "revoked").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-[var(--color-tint)] flex items-center justify-center text-[var(--color-danger)] border border-[var(--color-line)]">
              <Ban className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3.5 size-3.5 text-[var(--color-muted)]" />
          <Input
            placeholder="Tìm theo tên, email, SĐT, bộ phận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-11 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-input-border)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[var(--color-muted)] font-semibold">Lọc trạng thái:</span>
          <select
            style={{ borderWidth: "1.5px" }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
          >
            <option value="all">Tất cả ({employees.length})</option>
            <option value="active">Active (Hoạt động)</option>
            <option value="suspended">Suspended (Tạm khoá)</option>
            <option value="revoked">Revoked (Thu hồi)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] overflow-hidden shadow-[var(--elevation-shadow-card)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên / Họ tên</TableHead>
              <TableHead>Liên hệ (SĐT / Email)</TableHead>
              <TableHead>Bộ phận</TableHead>
              <TableHead>Vai trò (Role Catalog)</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-xs text-[var(--color-muted)]">
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-[var(--color-tint)] transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-[var(--color-tint)] flex items-center justify-center font-bold text-xs text-[var(--color-ink)] border border-[var(--color-line)] shadow-[var(--elevation-shadow-card)]">
                        {emp.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--color-ink)]">{emp.name}</p>
                        <p className="text-[10px] font-mono text-[var(--color-muted)]">{emp.id} · {emp.userId}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-xs space-y-0.5 font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--color-ink)]">
                        <Phone className="size-3 text-[var(--color-muted)]" /> {emp.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--color-muted)] text-[11px]">
                        <Mail className="size-3 text-[var(--color-muted)]" /> {emp.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-[var(--color-ink)]">
                      {emp.departmentName}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {emp.roles.map((r) => (
                        <span
                          key={r.code}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--color-tint)] border border-[var(--color-line)] text-[var(--color-ink)] px-2.5 py-0.5 text-[11px] font-bold shadow-[var(--elevation-shadow-card)]"
                        >
                          <KeyRound className="size-3" />
                          <span>{r.code}</span>
                          <span className="font-normal">({r.name.split(" ")[0]})</span>
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant={emp.status}>
                      {emp.status === "active"
                        ? "Active"
                        : emp.status === "suspended"
                        ? "Suspended"
                        : "Revoked"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {emp.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(emp.id, "suspended")}
                        >
                          Tạm khoá
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(emp.id, "active")}
                        >
                          Kích hoạt
                        </Button>
                      )}

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleStatusChange(emp.id, "revoked")}
                        title="Thu hồi toàn bộ quyền"
                      >
                        Thu hồi
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-chrome)]/60 p-4 animate-in fade-in-50">
          <Card className="w-full max-w-md border-[var(--color-line)] shadow-[var(--elevation-shadow-pop)] rounded-2xl bg-[var(--color-surface)] text-[var(--color-ink)] overflow-hidden">
            <CardHeader className="pb-3 border-b border-[var(--color-line)] bg-[var(--color-tint)]">
              <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-base font-bold">Thêm / Mời Thành Viên Mới</CardTitle>
              <CardDescription className="text-xs font-medium">
                Gán nhân sự vào chi nhánh hiện tại
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddMember}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-ink)]">Họ và tên nhân viên *</label>
                  <Input
                    placeholder="Ví dụ: Hoàng Văn An"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    className="rounded-xl bg-[var(--color-surface)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-ink)]">Email công ty *</label>
                  <Input
                    type="email"
                    placeholder="an.hoang@dcenter.vn"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="rounded-xl bg-[var(--color-surface)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-ink)]">Số điện thoại</label>
                  <Input
                    placeholder="0911 222 333"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="rounded-xl bg-[var(--color-surface)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--color-ink)]">Vai trò ban đầu (Role Catalog)</label>
                  <select
                    style={{ borderWidth: "1.5px" }}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-11 rounded-[var(--radius-md)] border border-[var(--color-input-border)] bg-[var(--color-surface)] px-3 text-xs text-[var(--color-ink)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                  >
                    <option value="VT-02">VT-02 — Nhân viên bán hàng (Bán lẻ / POS)</option>
                    <option value="VT-03">VT-03 — Nhân viên kho (Kho lạnh / Nhập xuất)</option>
                    <option value="VT-01">VT-01 — Giám đốc chi nhánh (Toàn quyền)</option>
                  </select>
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--color-line)] bg-[var(--color-tint)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                >
                  Huỷ bỏ
                </Button>
                <Button type="submit" size="sm">
                  Xác nhận thêm
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
