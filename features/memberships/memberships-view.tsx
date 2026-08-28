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

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: "emp-001",
    userId: "usr-u1-893",
    branchId: "br-01-q7",
    name: "Nguyễn Văn Quản",
    phone: "0908 123 456",
    email: "quan.nguyen@dcenter.vn",
    departmentId: "dept-mgmt",
    departmentName: "Ban Giám Đốc Chi Nhánh",
    roles: [{ code: "VT-01", name: "Giám đốc chi nhánh" }],
    status: "active",
    joinedAt: "10/08/2026",
  },
  {
    id: "emp-002",
    userId: "usr-u2-442",
    branchId: "br-01-q7",
    name: "Trần Thị Thu Hà",
    phone: "0912 345 678",
    email: "ha.tran@dcenter.vn",
    departmentId: "dept-sales",
    departmentName: "Bộ phận Bán hàng & Thu ngân",
    roles: [{ code: "VT-02", name: "Nhân viên bán hàng" }],
    status: "active",
    joinedAt: "12/08/2026",
  },
  {
    id: "emp-003",
    userId: "usr-u3-918",
    branchId: "br-01-q7",
    name: "Lê Hoàng Kho",
    phone: "0938 765 432",
    email: "kho.le@dcenter.vn",
    departmentId: "dept-wh",
    departmentName: "Bộ phận Kho Lạnh Cấp Đông",
    roles: [{ code: "VT-03", name: "Nhân viên kho" }],
    status: "active",
    joinedAt: "15/08/2026",
  },
  {
    id: "emp-004",
    userId: "usr-u4-102",
    branchId: "br-01-q7",
    name: "Phạm Minh Tâm",
    phone: "0977 889 900",
    email: "tam.pham@dcenter.vn",
    departmentId: "dept-sales",
    departmentName: "Bộ phận Bán hàng & Thu ngân",
    roles: [{ code: "VT-02", name: "Nhân viên bán hàng" }],
    status: "suspended",
    joinedAt: "18/08/2026",
  },
  {
    id: "emp-005",
    userId: "usr-u5-667",
    branchId: "br-01-q7",
    name: "Đặng Thị Mai",
    phone: "0988 112 233",
    email: "mai.dang@dcenter.vn",
    departmentId: "dept-wh",
    departmentName: "Bộ phận Kho Lạnh Cấp Đông",
    roles: [{ code: "VT-03", name: "Nhân viên kho" }],
    status: "revoked",
    joinedAt: "05/08/2026",
  },
];

interface MembershipsViewProps {
  initialEmployees?: Employee[];
}

export function MembershipsView({ initialEmployees }: MembershipsViewProps) {
  const [employees, setEmployees] = useState<Employee[]>(
    initialEmployees && initialEmployees.length > 0 ? initialEmployees : INITIAL_EMPLOYEES
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
      branchId: "br-01-q7",
      name: inviteName,
      phone: invitePhone || "0900 000 000",
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
    <PageShell>
      <PageHeader
        icon={<Users />}
        title="Quản lý Thành viên Chi nhánh"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            CN-HCM-01 · Quận 7
          </Badge>
        }
        description="Phân quyền nhân sự (Membership), kiểm soát trạng thái hoạt động và vai trò theo chi nhánh"
        actions={
          <Button
            onClick={() => setShowInviteModal(true)}
            className="gap-1.5 text-xs h-9 font-bold rounded-xl bg-gradient-to-r from-[#0284C7] to-emerald-600 hover:opacity-95 text-white shadow-md shadow-sky-500/15"
          >
            <UserPlus className="size-3.5" />
            <span>Thêm / Mời Thành Viên</span>
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 pb-6">
        <Card className="p-4.5 rounded-2xl border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-foreground)] font-semibold">Đang hoạt động (Active)</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {employees.filter((e) => e.status === "active").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-foreground)] font-semibold">Tạm khoá (Suspended)</p>
              <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {employees.filter((e) => e.status === "suspended").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4.5 rounded-2xl border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--muted-foreground)] font-semibold">Đã thu hồi (Revoked)</p>
              <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {employees.filter((e) => e.status === "revoked").length}
              </p>
            </div>
            <div className="size-11 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Ban className="size-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 size-3.5 text-[var(--muted-foreground)]" />
          <Input
            placeholder="Tìm theo tên, email, SĐT, bộ phận..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[var(--muted-foreground)] font-semibold">Lọc trạng thái:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 py-1 text-xs text-[var(--foreground)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="all">Tất cả ({employees.length})</option>
            <option value="active">Active (Hoạt động)</option>
            <option value="suspended">Suspended (Tạm khoá)</option>
            <option value="revoked">Revoked (Thu hồi)</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden shadow-xs">
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
                <TableCell colSpan={6} className="text-center py-10 text-xs text-[var(--muted-foreground)]">
                  Không tìm thấy nhân viên nào phù hợp với bộ lọc.
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((emp) => (
                <TableRow key={emp.id} className="hover:bg-[var(--muted)] transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-sky-500/10 flex items-center justify-center font-bold text-xs text-[var(--primary)] border border-sky-500/20 shadow-2xs">
                        {emp.name.split(" ").slice(-2).map((w) => w[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--foreground)]">{emp.name}</p>
                        <p className="text-[10px] font-mono text-[var(--muted-foreground)]">{emp.id} · {emp.userId}</p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col text-xs space-y-0.5 font-medium">
                      <span className="flex items-center gap-1.5 text-[var(--foreground)]">
                        <Phone className="size-3 text-[var(--muted-foreground)]" /> {emp.phone}
                      </span>
                      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)] text-[11px]">
                        <Mail className="size-3 text-[var(--muted-foreground)]" /> {emp.email}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {emp.departmentName}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {emp.roles.map((r) => (
                        <span
                          key={r.code}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] border border-[var(--primary)]/20 text-[var(--accent-foreground)] px-2.5 py-0.5 text-[11px] font-bold shadow-2xs"
                        >
                          <KeyRound className="size-3" />
                          <span>{r.code}</span>
                          <span className="font-normal opacity-80">({r.name.split(" ")[0]})</span>
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
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 border-amber-200/60 dark:border-amber-800/60"
                        >
                          Tạm khoá
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusChange(emp.id, "active")}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/60"
                        >
                          Kích hoạt
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(emp.id, "revoked")}
                        className="h-7 px-2.5 text-[11px] font-bold rounded-lg text-[var(--destructive)] hover:bg-rose-50 dark:hover:bg-rose-950/40"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in-50">
          <Card className="w-full max-w-md border-[var(--border)] shadow-2xl rounded-2xl bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden">
            <CardHeader className="pb-3 border-b border-[var(--border)] bg-[var(--muted)]/50">
              <CardTitle className="text-base font-bold">Thêm / Mời Thành Viên Mới</CardTitle>
              <CardDescription className="text-xs font-medium">
                Gán nhân sự vào chi nhánh <strong className="text-[var(--foreground)]">CN-HCM-01 (Quận 7)</strong>
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddMember}>
              <CardContent className="space-y-3.5 pt-4 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-[var(--foreground)]">Họ và tên nhân viên *</label>
                  <Input
                    placeholder="Ví dụ: Hoàng Văn An"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                    className="rounded-xl bg-[var(--card)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--foreground)]">Email công ty *</label>
                  <Input
                    type="email"
                    placeholder="an.hoang@dcenter.vn"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    className="rounded-xl bg-[var(--card)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--foreground)]">Số điện thoại</label>
                  <Input
                    placeholder="0911 222 333"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                    className="rounded-xl bg-[var(--card)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-[var(--foreground)]">Vai trò ban đầu (Role Catalog)</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full h-9 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-xs text-[var(--foreground)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  >
                    <option value="VT-02">VT-02 — Nhân viên bán hàng (Bán lẻ / POS)</option>
                    <option value="VT-03">VT-03 — Nhân viên kho (Kho lạnh / Nhập xuất)</option>
                    <option value="VT-01">VT-01 — Giám đốc chi nhánh (Toàn quyền)</option>
                  </select>
                </div>
              </CardContent>
              <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border)] bg-[var(--muted)]/50">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(false)}
                  className="rounded-xl"
                >
                  Huỷ bỏ
                </Button>
                <Button type="submit" size="sm" className="font-bold rounded-xl bg-gradient-to-r from-[#0284C7] to-emerald-600 text-white">
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
