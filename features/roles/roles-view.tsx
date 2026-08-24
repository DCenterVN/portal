"use client";

import React, { useState } from "react";
import {
  KeyRound,
  Users,
  Check,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface RoleDef {
  id: string;
  code: string;
  name: string;
  description: string;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

export interface PermissionDef {
  actionKey: string;
  module: string;
  category: "Quản trị Chi nhánh" | "Kho Lạnh & Tồn kho" | "Đơn hàng & POS" | "Báo cáo & Tài chính";
  description: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

export const ROLES: RoleDef[] = [
  {
    id: "role-vt01",
    code: "VT-01",
    name: "Giám đốc chi nhánh",
    description: "Full quyền quản trị vận hành, nhân sự, tài chính và cấu hình trong phạm vi chi nhánh.",
    isSystem: true,
    memberCount: 1,
    permissions: [
      "org:branch:update",
      "org:membership:create",
      "org:membership:list",
      "org:membership:manage",
      "org:membership:update",
      "org:role:create",
      "org:role:manage",
      "order:order:create",
      "order:order:read",
      "order:price:update",
      "inventory:stock:in",
      "inventory:stock:out",
      "report:revenue:read",
    ],
  },
  {
    id: "role-vt02",
    code: "VT-02",
    name: "Nhân viên bán hàng",
    description: "Xem và tạo đơn hàng bán lẻ tại quầy, kiểm tra tồn kho sẵn sàng. Không sửa giá và không xem doanh thu tổng.",
    isSystem: true,
    memberCount: 2,
    permissions: [
      "org:membership:list",
      "order:order:create",
      "order:order:read",
      "inventory:stock:out",
    ],
  },
  {
    id: "role-vt03",
    code: "VT-03",
    name: "Nhân viên kho",
    description: "Thực hiện nhập kho thực phẩm cấp đông, kiểm đếm xuất kho, quản lý vị trí tủ đông. Không xem dữ liệu doanh thu.",
    isSystem: true,
    memberCount: 2,
    permissions: [
      "org:membership:list",
      "inventory:stock:in",
      "inventory:stock:out",
      "order:order:read",
    ],
  },
];

export const PERMISSION_CATALOG: PermissionDef[] = [
  {
    actionKey: "org:branch:update",
    module: "Tổ chức & Chi nhánh",
    category: "Quản trị Chi nhánh",
    description: "Chỉnh sửa thông tin, giờ mở cửa và cấu hình chi nhánh",
    riskLevel: "HIGH",
  },
  {
    actionKey: "org:membership:create",
    module: "Nhân sự & Thành viên",
    category: "Quản trị Chi nhánh",
    description: "Mời nhân viên mới tham gia vào chi nhánh",
    riskLevel: "MEDIUM",
  },
  {
    actionKey: "org:membership:manage",
    module: "Nhân sự & Thành viên",
    category: "Quản trị Chi nhánh",
    description: "Gán và thu hồi các vai trò của nhân viên trong chi nhánh",
    riskLevel: "HIGH",
  },
  {
    actionKey: "org:membership:list",
    module: "Nhân sự & Thành viên",
    category: "Quản trị Chi nhánh",
    description: "Xem danh sách nhân sự và thành viên chi nhánh",
    riskLevel: "LOW",
  },
  {
    actionKey: "org:role:manage",
    module: "Phân quyền & Vai trò",
    category: "Quản trị Chi nhánh",
    description: "Điều chỉnh danh mục quyền hạn gắn với vai trò",
    riskLevel: "HIGH",
  },
  {
    actionKey: "inventory:stock:in",
    module: "Kho Lạnh Cấp Đông",
    category: "Kho Lạnh & Tồn kho",
    description: "Tạo phiếu nhập kho hàng đông lạnh từ xe trung chuyển",
    riskLevel: "MEDIUM",
  },
  {
    actionKey: "inventory:stock:out",
    module: "Kho Lạnh Cấp Đông",
    category: "Kho Lạnh & Tồn kho",
    description: "Xuất kho bán hàng hoặc điều chuyển nội bộ giữa các tủ đông",
    riskLevel: "MEDIUM",
  },
  {
    actionKey: "order:order:create",
    module: "Đơn hàng Bán lẻ",
    category: "Đơn hàng & POS",
    description: "Tạo mới đơn hàng thực phẩm cấp đông tại quầy chi nhánh",
    riskLevel: "LOW",
  },
  {
    actionKey: "order:order:read",
    module: "Đơn hàng Bán lẻ",
    category: "Đơn hàng & POS",
    description: "Tra cứu lịch sử đơn hàng và phiếu xuất hàng hóa",
    riskLevel: "LOW",
  },
  {
    actionKey: "order:price:update",
    module: "Đơn hàng Bán lẻ",
    category: "Đơn hàng & POS",
    description: "Thay đổi đơn giá bán lẻ, áp dụng chiết khấu đặc biệt",
    riskLevel: "HIGH",
  },
  {
    actionKey: "report:revenue:read",
    module: "Báo cáo Tài chính",
    category: "Báo cáo & Tài chính",
    description: "Xem báo cáo doanh số, lợi nhuận ca và tổng kết ngày",
    riskLevel: "HIGH",
  },
];

interface RolesViewProps {
  initialRoles?: RoleDef[];
  initialPermissions?: PermissionDef[];
}

export function RolesView({ initialRoles, initialPermissions }: RolesViewProps) {
  const safeRoles = initialRoles && initialRoles.length > 0 ? initialRoles : ROLES;
  const safePermissions = initialPermissions && initialPermissions.length > 0 ? initialPermissions : PERMISSION_CATALOG;

  const [selectedRole, setSelectedRole] = useState<RoleDef>(safeRoles[0]);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = Array.from(new Set(safePermissions.map((p) => p.category)));

  const filteredPermissions = safePermissions.filter(
    (p) => filterCategory === "all" || p.category === filterCategory
  );

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-[var(--primary)]">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                  Vai trò & Ma trận Phân quyền
                </h1>
                <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Branch RBAC Catalog
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-medium">
                Danh mục vai trò cố định và bảng quyền hạn tương ứng được áp dụng tự động cho nhân sự chi nhánh
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--muted-foreground)] font-semibold">
            Phạm vi: <strong className="text-[var(--foreground)]">CN-HCM-01 (Quận 7)</strong>
          </span>
        </div>
      </div>

      {/* Roles Selection Cards with Semantic Token Theming */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 pb-6">
        {safeRoles.map((role) => {
          const isSelected = selectedRole.id === role.id;
          return (
            <Card
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`cursor-pointer transition-all rounded-2xl border bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden ${
                isSelected
                  ? "border-[var(--primary)] shadow-lg ring-2 ring-sky-500/20 bg-[var(--accent)]"
                  : "border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
              }`}
            >
              <CardHeader className="p-4.5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-sky-500/10 text-[var(--primary)] border border-sky-500/20">
                    {role.code}
                  </span>
                  <span className="text-[11px] text-[var(--muted-foreground)] font-semibold flex items-center gap-1.5 bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                    <Users className="size-3 text-[var(--primary)]" /> {role.memberCount} nhân sự
                  </span>
                </div>
                <CardTitle className="text-base font-bold text-[var(--foreground)] mt-2.5">
                  {role.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4.5 pt-0">
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed font-medium">
                  {role.description}
                </p>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--border)] text-[11px]">
                  <span className="text-[var(--muted-foreground)] font-medium">Quyền kích hoạt:</span>
                  <span className="font-bold text-[var(--primary)] bg-sky-500/10 px-2 py-0.5 rounded-md">
                    {role.permissions.length} / {safePermissions.length} quyền
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Matrix Detail Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--card)] text-[var(--card-foreground)] p-4 rounded-2xl border border-[var(--border)] shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-[var(--primary)] border border-sky-500/20 shadow-2xs">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-[var(--foreground)] flex items-center gap-2">
                Chi tiết Quyền hạn cho vai trò: <span className="text-[var(--primary)] font-mono">{selectedRole.code} — {selectedRole.name}</span>
              </h3>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-medium">
                Ma trận kiểm soát truy cập và chức năng vận hành trong chuỗi cung ứng lạnh
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)] font-semibold">Phân nhóm:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-8.5 rounded-xl border border-[var(--input)] bg-[var(--card)] px-3 text-xs text-[var(--foreground)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="all">Tất cả Phân nhóm</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Trạng thái</TableHead>
                <TableHead>Mã Quyền (Action Key)</TableHead>
                <TableHead>Phân nhóm / Module</TableHead>
                <TableHead>Mô tả Hành động</TableHead>
                <TableHead className="text-right">Mức độ rủi ro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPermissions.map((perm) => {
                const isGranted = selectedRole.permissions.includes(perm.actionKey);
                return (
                  <TableRow
                    key={perm.actionKey}
                    className={`transition-colors ${
                      isGranted
                        ? "bg-sky-500/[0.04]"
                        : "opacity-60 bg-[var(--muted)]/30"
                    }`}
                  >
                    <TableCell className="text-center">
                      {isGranted ? (
                        <div className="inline-flex size-7 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                          <Check className="size-4 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="inline-flex size-7 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--muted-foreground)]">
                          <span className="text-xs font-bold">—</span>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-bold text-[var(--foreground)]">
                        {perm.actionKey}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--tag-bg)] text-[var(--tag-text)] border border-[var(--tag-border)]">
                        {perm.category}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-[var(--foreground)] font-medium">
                        {perm.description}
                      </span>
                    </TableCell>

                    <TableCell className="text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-extrabold rounded-full ${
                          perm.riskLevel === "HIGH"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                            : perm.riskLevel === "MEDIUM"
                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-[var(--muted-foreground)] border border-[var(--border)]"
                        }`}
                      >
                        {perm.riskLevel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  );
}
