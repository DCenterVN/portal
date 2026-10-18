"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { Building2, LogOut, UserRound } from "lucide-react";
import { getProfile, logoutTo } from "@/lib/auth/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { ErrorState, Skeleton } from "@/components/ui/state";
import { useToast } from "@/components/ui/toast";

export function StaffProfileView() {
  const { data, error, isLoading, mutate } = useSWR("staff-profile", getProfile, { revalidateOnFocus: false });
  const { toast } = useToast();
  const router = useRouter();
  if (isLoading) return <PageShell><Skeleton title="Đang tải hồ sơ nhân viên…" /></PageShell>;
  if (error || !data) return <PageShell><ErrorState title={error instanceof Error ? error.message : "Không thể tải hồ sơ."} onRetry={() => void mutate()} /></PageShell>;
  const fields = [
    ["Họ và tên", data.display_name || "Chưa cập nhật"],
    ["Email", data.email || "—"],
    ["Số điện thoại", data.phone || "—"],
    ["Ngày khởi tạo", data.created_at ? new Date(data.created_at).toLocaleDateString("vi-VN") : "—"],
  ];
  return (
    <PageShell className="space-y-6">
      <PageHeader
        icon={<UserRound />}
        title="Hồ sơ nhân viên"
        badge={<Badge variant="secondary" dot={false}>{data.status === "ACTIVE" ? "Đang hoạt động" : data.status}</Badge>}
        description="Thông tin tài khoản và phạm vi làm việc của bạn"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => router.push("/staff/forgot-password")}>Đổi mật khẩu</Button>
            <Button variant="outline" size="sm" onClick={() => void logoutTo("/staff/login", toast.error)}>
              <LogOut className="size-3.5" aria-hidden="true" /> Đăng xuất
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cá nhân</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-fg-3">{label}</p>
              <p className="text-sm font-semibold text-fg">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Tổ chức và chi nhánh</CardTitle></CardHeader>
        <CardContent className="divide-y divide-line">
          {data.memberships.length === 0 ? (
            <p className="py-2 text-sm text-fg-3">Tài khoản chưa có phạm vi truy cập.</p>
          ) : data.memberships.map((m) => (
            <div key={`${m.org_id}:${m.branch_id ?? ""}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3">
              <Building2 className="size-4 text-fg-3" aria-hidden="true" />
              <strong className="text-sm">{m.org_name || m.org_id}</strong>
              {m.branch_name && <span className="text-sm text-fg-2">{m.branch_name}</span>}
              <span className="ml-auto flex flex-wrap gap-1">
                {m.roles.map((role) => <Badge key={role} variant="secondary">{role}</Badge>)}
              </span>
            </div>
          ))}
          <div className="pt-3">
            <Button size="sm" variant="outline" onClick={() => router.push("/staff/switch-org")}>Đổi tổ chức</Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
