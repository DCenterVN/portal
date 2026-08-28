"use client";

import React, { useState, useMemo } from "react";
import {
  ShieldCheck,
  Search,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Save,
  Check,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageShell, PageHeader } from "@/components/ui/page";

export type ActionType = "V" | "A" | "U" | "D" | "E";

export interface RoleColumn {
  id: string;
  code: string;
  name: string;
  shortName: string;
  isSystem: boolean;
}

export interface PermissionFeature {
  id: string;
  name: string;
  description: string;
  // Map of roleId -> set of allowed actions ('V', 'A', 'U', 'D', 'E')
  defaultPermissions: Record<string, ActionType[]>;
}

export interface PermissionGroup {
  id: string;
  name: string;
  features: PermissionFeature[];
}

export const ROLES_COLUMNS: RoleColumn[] = [
  { id: "vt01", code: "VT-01", name: "Giám đốc chi nhánh", shortName: "GĐ Chi nhánh", isSystem: true },
  { id: "vt02", code: "VT-02", name: "Quản lý kho cấp đông", shortName: "QL Kho Lạnh", isSystem: true },
  { id: "vt23", code: "VT-23", name: "Chuyên viên QC", shortName: "QC Lab", isSystem: true },
  { id: "vt10", code: "VT-10", name: "Nhân viên kiểm nhận", shortName: "NV Tiếp nhận", isSystem: true },
  { id: "vt14", code: "VT-14", name: "Bếp trưởng sơ chế", shortName: "Bếp trưởng", isSystem: true },
  { id: "vt08", code: "VT-08", name: "Tài xế chuỗi lạnh", shortName: "Tài xế -18°C", isSystem: true },
];

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "inventory_coldchain",
    name: "Kho Lạnh & Chuỗi Cung Ứng (-18°C)",
    features: [
      {
        id: "feat_goods_receipt",
        name: "Kiểm nhận hàng hóa đầu vào (Goods Receipt)",
        description: "Đối soát số lượng thực nhận, đo nhiệt độ thùng xe và lập biên bản sai lệch",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V", "A", "U", "E"],
          vt23: ["V", "A", "U"],
          vt10: ["V", "A", "U"],
          vt14: ["V"],
          vt08: ["V"],
        },
      },
      {
        id: "feat_stock_mgmt",
        name: "Quản lý tồn kho & vị trí tủ đông",
        description: "Phân bổ khay kệ, chuyển vị trí kho lạnh và kiểm kê số lượng thực tế",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V", "A", "U", "D", "E"],
          vt23: ["V"],
          vt10: ["V", "U"],
          vt14: ["V"],
          vt08: [],
        },
      },
      {
        id: "feat_cold_chain_iot",
        name: "Giám sát cảm biến IoT nhiệt độ chuỗi lạnh",
        description: "Theo dõi biểu đồ nhiệt độ liên tục -18°C và tiếp nhận cảnh báo vượt ngưỡng",
        defaultPermissions: {
          vt01: ["V", "U", "E"],
          vt02: ["V", "U", "E"],
          vt23: ["V", "E"],
          vt10: ["V"],
          vt14: ["V"],
          vt08: ["V"],
        },
      },
    ],
  },
  {
    id: "qc_inspection",
    name: "Kiểm Định Chất Lượng (QC Lab & Lô Hàng)",
    features: [
      {
        id: "feat_qc_4_criteria",
        name: "Nhập kết quả kiểm nghiệm 4 tiêu chí",
        description: "Ghi nhận cảm quan, nhiệt độ tâm, hạn dùng và lấy mẫu lưu Lab",
        defaultPermissions: {
          vt01: ["V", "A", "U", "E"],
          vt02: ["V"],
          vt23: ["V", "A", "U", "E"],
          vt10: ["V"],
          vt14: ["V"],
          vt08: [],
        },
      },
      {
        id: "feat_qc_decision",
        name: "Quyết định phê duyệt / cách ly lô hàng",
        description: "Cấp phép APPROVED nhập kho thương mại hoặc QUARANTINED chuyển vùng cách ly",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V"],
          vt23: ["V", "A", "U", "E"],
          vt10: [],
          vt14: [],
          vt08: [],
        },
      },
    ],
  },
  {
    id: "supplier_mgmt",
    name: "Nhà Cung Cấp & Đối Tác VietGAP",
    features: [
      {
        id: "feat_supplier_directory",
        name: "Hồ sơ đối tác & chứng chỉ vùng trồng",
        description: "Danh bạ nhà cung cấp, chứng chỉ VietGAP/GlobalGAP và điều kiện vận chuyển",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V", "A", "U"],
          vt23: ["V", "U"],
          vt10: ["V"],
          vt14: ["V"],
          vt08: [],
        },
      },
      {
        id: "feat_supplier_suspend",
        name: "Đánh giá định kỳ & đình chỉ nhà cung cấp",
        description: "Chấm điểm tuân thủ chuỗi lạnh và ban hành quyết định tạm ngừng hợp tác",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V", "U"],
          vt23: ["V", "A", "U", "E"],
          vt10: [],
          vt14: [],
          vt08: [],
        },
      },
    ],
  },
  {
    id: "orders_dispatch",
    name: "Đơn Hàng Bán Lẻ & Điều Phối Giao Hàng",
    features: [
      {
        id: "feat_sales_orders",
        name: "Quản lý đơn hàng & xuất bán lẻ",
        description: "Tiếp nhận đơn hàng online/offline, đóng gói khay lạnh và xuất hóa đơn",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V", "A", "U", "E"],
          vt23: ["V"],
          vt10: ["V", "U"],
          vt14: ["V", "U"],
          vt08: ["V", "U"],
        },
      },
      {
        id: "feat_dispatch_delivery",
        name: "Điều xe tải đông lạnh & hành trình giao hàng",
        description: "Phân bổ tuyến giao, bàn giao thùng giữ nhiệt và ký biên bản giao nhận",
        defaultPermissions: {
          vt01: ["V", "A", "U", "E"],
          vt02: ["V", "A", "U", "E"],
          vt23: ["V"],
          vt10: ["V", "U"],
          vt14: [],
          vt08: ["V", "U", "E"],
        },
      },
    ],
  },
  {
    id: "org_admin",
    name: "Tổ Chức, Nhân Sự & Quản Trị Hệ Thống",
    features: [
      {
        id: "feat_membership_staff",
        name: "Quản lý nhân sự & mời thành viên chi nhánh",
        description: "Mời nhân viên mới, phân bổ vị trí công tác và thu hồi tài khoản",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: ["V"],
          vt23: ["V"],
          vt10: [],
          vt14: [],
          vt08: [],
        },
      },
      {
        id: "feat_rbac_matrix",
        name: "Ma trận phân quyền & thiết lập vai trò",
        description: "Cấu hình quyền hạn chi tiết cho từng nhóm vai trò trong phạm vi chi nhánh",
        defaultPermissions: {
          vt01: ["V", "A", "U", "D", "E"],
          vt02: [],
          vt23: [],
          vt10: [],
          vt14: [],
          vt08: [],
        },
      },
    ],
  },
];

const ACTION_LABELS: Record<ActionType, { name: string; title: string }> = {
  V: { name: "V", title: "View (Xem)" },
  A: { name: "A", title: "Add (Thêm)" },
  U: { name: "U", title: "Update (Sửa)" },
  D: { name: "D", title: "Delete (Xóa)" },
  E: { name: "E", title: "Export / Execute (Duyệt/Xuất)" },
};

export function RolesView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  // State: Record<featureId_roleId_action, boolean>
  const [permissionState, setPermissionState] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((group) => {
      group.features.forEach((feature) => {
        ROLES_COLUMNS.forEach((role) => {
          const allowed = feature.defaultPermissions[role.id] || [];
          (["V", "A", "U", "D", "E"] as ActionType[]).forEach((act) => {
            const key = `${feature.id}_${role.id}_${act}`;
            initial[key] = allowed.includes(act);
          });
        });
      });
    });
    return initial;
  });

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const expandAll = () => setCollapsedGroups({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    PERMISSION_GROUPS.forEach((g) => {
      all[g.id] = true;
    });
    setCollapsedGroups(all);
  };

  const handleToggle = (featureId: string, roleId: string, action: ActionType) => {
    const key = `${featureId}_${roleId}_${action}`;
    setPermissionState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setSavedSuccess(false);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return PERMISSION_GROUPS;
    const term = searchTerm.toLowerCase();
    return PERMISSION_GROUPS.map((g) => ({
      ...g,
      features: g.features.filter(
        (f) => f.name.toLowerCase().includes(term) || f.description.toLowerCase().includes(term)
      ),
    })).filter((g) => g.features.length > 0);
  }, [searchTerm]);

  const totalFeatures = PERMISSION_GROUPS.reduce((acc, g) => acc + g.features.length, 0);

  return (
    <PageShell>
      <PageHeader
        icon={<ShieldCheck />}
        title="Ma Trận Phân Quyền Chi Nhánh"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            RBAC Matrix Table
          </Badge>
        }
        description="Bảng phân quyền chi tiết theo từng chức năng và hành động (V: Xem, A: Thêm, U: Sửa, D: Xóa, E: Duyệt/Xuất)"
        actions={
          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="size-3.5" /> Đã lưu ma trận!
              </span>
            )}
            <Button size="sm" onClick={handleSave} className="gap-1.5 text-xs font-bold shadow-sm">
              <Save className="size-3.5" />
              <span>Lưu ma trận quyền</span>
            </Button>
          </div>
        }
      />

      {/* Filter & Action Toolbar */}
      <div className="pt-6 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm chức năng, phân hệ..."
            className="pl-9 h-9 text-xs rounded-xl bg-[var(--card)]"
          />
        </div>

        <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <span className="font-semibold">
            {PERMISSION_GROUPS.length} nhóm quyền · {totalFeatures} chức năng
          </span>
          <div className="h-3.5 w-px bg-[var(--border)] hidden sm:block" />
          <div className="flex items-center gap-1">
            <Button
              onClick={expandAll}
              type="button"
              variant="link"
              className="h-auto p-0 text-xs text-[var(--primary)] font-medium"
            >
              Mở rộng
            </Button>
            <span>·</span>
            <Button
              onClick={collapseAll}
              type="button"
              variant="link"
              className="h-auto p-0 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium"
            >
              Thu gọn
            </Button>
            <span>·</span>
            <Button
              onClick={() => setSearchTerm("")}
              type="button"
              variant="link"
              className="h-auto p-0 text-xs inline-flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] font-medium"
            >
              <RotateCcw className="size-3" /> Tải lại
            </Button>
          </div>
        </div>
      </div>

      {/* Permission Matrix Grid Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            {/* Table Header */}
            <thead>
              {/* Row 1: Role Group Headers */}
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/50 text-[var(--foreground)] text-xs font-bold">
                <th rowSpan={2} className="p-3.5 pl-5 w-80 min-w-[280px] align-bottom border-r border-[var(--border)]">
                  Chức năng / Phân hệ
                </th>
                {ROLES_COLUMNS.map((role) => (
                  <th
                    key={role.id}
                    colSpan={5}
                    className="p-2.5 text-center border-r border-[var(--border)] last:border-r-0"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="font-mono text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/10 text-[var(--primary)]">
                        {role.code}
                      </span>
                      <span className="text-xs font-bold text-[var(--foreground)]">{role.name}</span>
                    </div>
                  </th>
                ))}
              </tr>

              {/* Row 2: V A U D E Sub-columns */}
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]/30 text-[10px] font-mono font-bold text-[var(--muted-foreground)] text-center">
                {ROLES_COLUMNS.map((role) => (
                  <React.Fragment key={`${role.id}-actions`}>
                    {(["V", "A", "U", "D", "E"] as ActionType[]).map((act) => (
                      <th
                        key={`${role.id}-${act}`}
                        className="py-1.5 px-1 w-8"
                        title={ACTION_LABELS[act].title}
                      >
                        {act}
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            {/* Table Body with Collapsible Groups */}
            <tbody className="divide-y divide-[var(--border)] text-xs">
              {filteredGroups.map((group) => {
                const isCollapsed = !!collapsedGroups[group.id];
                return (
                  <React.Fragment key={group.id}>
                    {/* Group Header Row */}
                    <tr className="bg-[var(--secondary)]/40 hover:bg-[var(--secondary)]/60 transition-colors font-bold text-[var(--foreground)]">
                      <td colSpan={1 + ROLES_COLUMNS.length * 5} className="p-2.5 pl-4">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => toggleGroup(group.id)}
                          className="h-auto p-0 flex items-center gap-2 text-xs font-bold text-[var(--primary)] hover:bg-transparent hover:opacity-80"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          <span>{group.name}</span>
                          <span className="text-[10px] font-normal text-[var(--muted-foreground)] ml-1">
                            ({group.features.length} chức năng)
                          </span>
                        </Button>
                      </td>
                    </tr>

                    {/* Feature Rows */}
                    {!isCollapsed &&
                      group.features.map((feature) => (
                        <tr
                          key={feature.id}
                          className="hover:bg-sky-500/[0.02] transition-colors border-b border-[var(--border)]/60"
                        >
                          {/* Feature Name & Description */}
                          <td className="p-3 pl-8 border-r border-[var(--border)]">
                            <div className="font-semibold text-[var(--foreground)] text-xs">
                              {feature.name}
                            </div>
                            <div className="text-[11px] text-[var(--muted-foreground)] line-clamp-1 mt-0.5 font-normal">
                              {feature.description}
                            </div>
                          </td>

                          {/* Role Checkboxes */}
                          {ROLES_COLUMNS.map((role) => (
                            <React.Fragment key={`${feature.id}-${role.id}`}>
                              {(["V", "A", "U", "D", "E"] as ActionType[]).map((act) => {
                                const key = `${feature.id}_${role.id}_${act}`;
                                const isChecked = !!permissionState[key];
                                return (
                                  <td
                                    key={key}
                                    className="p-1 text-center align-middle hover:bg-sky-500/10 transition-colors"
                                  >
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleToggle(feature.id, role.id, act)}
                                      className="size-5 p-0 rounded flex items-center justify-center mx-auto transition-transform active:scale-95"
                                      title={`${role.name}: ${ACTION_LABELS[act].title} - ${feature.name}`}
                                    >
                                      {isChecked ? (
                                        <div className="size-4 rounded bg-[#0284C7] text-white flex items-center justify-center shadow-xs">
                                          <Check className="size-3 stroke-[3]" />
                                        </div>
                                      ) : (
                                        <div className="size-4 rounded border border-[var(--border)] hover:border-slate-400 dark:hover:border-slate-500 bg-[var(--card)]" />
                                      )}
                                    </Button>
                                  </td>
                                );
                              })}
                            </React.Fragment>
                          ))}
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Matrix Legend Footer */}
        <div className="p-4 border-t border-[var(--border)] bg-[var(--secondary)]/20 flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold text-[var(--foreground)]">Quy ước ký hiệu:</span>
            <span className="flex items-center gap-1.5 font-mono">
              <strong className="text-[var(--primary)] font-bold">V</strong>: Xem (View)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <strong className="text-[var(--primary)] font-bold">A</strong>: Thêm (Add)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <strong className="text-[var(--primary)] font-bold">U</strong>: Sửa (Update)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <strong className="text-[var(--primary)] font-bold">D</strong>: Xóa (Delete)
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <strong className="text-[var(--primary)] font-bold">E</strong>: Duyệt / Xuất dữ liệu (Export)
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <Info className="size-3.5 text-[var(--primary)]" />
            <span>Phân quyền có hiệu lực tức thời cho phiên đăng nhập tiếp theo</span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
