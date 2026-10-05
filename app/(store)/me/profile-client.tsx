"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Phone,
  Mail,
  Calendar,
  LogOut,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getProfile, logout, UserProfile } from "@/lib/auth/client";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ProfileClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "security" | "memberships">("general");

  const fetchUserProfile = () => {
    setLoading(true);
    setError("");
    setErrorStatus(null);
    getProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Không thể tải thông tin hồ sơ.");
        const status = (err as { status?: number })?.status || null;
        setErrorStatus(status);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-3">
            <div className="size-8 border-3 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[var(--color-muted)]">Đang tải hồ sơ người dùng...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !profile) {
    const isAuthExpired = errorStatus === 401 || error.toLowerCase().includes("hết hạn") || error.toLowerCase().includes("unauthorized");
    return (
      <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
        <Card className="bg-[var(--color-surface)] text-[var(--color-ink)] max-w-md mx-auto mt-12 text-center p-6 border-[var(--color-line)]">
          <AlertCircle className="size-10 text-[var(--color-danger)] mx-auto mb-3" />
          <h2 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-lg font-bold text-[var(--color-ink)]">
            {isAuthExpired ? "Phiên làm việc hết hạn" : "Không thể tải hồ sơ"}
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-1 mb-4">
            {error || (isAuthExpired ? "Vui lòng đăng nhập lại." : "Vui lòng kiểm tra kết nối mạng và thử lại.")}
          </p>
          {isAuthExpired ? (
            <Button onClick={() => router.push("/login")} className="w-full">
              Đăng nhập lại
            </Button>
          ) : (
            <Button onClick={fetchUserProfile} variant="outline" className="w-full">
              Thử lại
            </Button>
          )}
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <PageHeader
        icon={<User />}
        title="Hồ sơ & Tài khoản Cá nhân"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            {profile.status === "ACTIVE" ? "Đang hoạt động" : profile.status}
          </Badge>
        }
        description="Quản lý thông tin định danh, quyền hạn phân bổ và các thiết lập bảo mật"
        actions={
          <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-1.5">
            <LogOut className="size-3.5" />
            <span>Đăng xuất</span>
          </Button>
        }
      />

      {/* User Hero Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6 pb-6">
        <Card className="lg:col-span-1 p-5 rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] flex flex-col justify-between">
          <div className="text-center pb-4 border-b border-[var(--color-line)]">
            <div className="size-20 rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-ink)] flex items-center justify-center font-extrabold text-2xl shadow-[var(--elevation-shadow-card)] mx-auto mb-3">
              {profile.display_name?.slice(0, 2).toUpperCase() || "VS"}
            </div>
            <h2 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-lg font-bold text-[var(--color-ink)]">{profile.display_name || "Nhân sự Việt Sạch"}</h2>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">{profile.email || profile.phone}</p>
            <Badge variant="secondary" className="mt-2.5 text-xs font-semibold bg-[var(--color-tint)] text-[var(--color-ink)] border border-[var(--color-line)]">
              Mã NV: {profile.id.slice(0, 8)}
            </Badge>
          </div>

          <div className="space-y-1.5 pt-4">
            <Button
              variant={activeTab === "general" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs font-semibold"
              onClick={() => setActiveTab("general")}
            >
              <User className="size-4 mr-2" />
              Thông tin chung
            </Button>
            <Button
              variant={activeTab === "memberships" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs font-semibold"
              onClick={() => setActiveTab("memberships")}
            >
              <Building2 className="size-4 mr-2" />
              Tổ chức & Chi nhánh ({profile.memberships?.length || 0})
            </Button>
            <Button
              variant={activeTab === "security" ? "secondary" : "ghost"}
              className="w-full justify-start text-xs font-semibold"
              onClick={() => setActiveTab("security")}
            >
              <Shield className="size-4 mr-2" />
              Bảo mật & Mật khẩu
            </Button>
          </div>
        </Card>

        {/* Tab Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === "general" && (
            <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <CardHeader className="p-0 pb-5 border-b border-[var(--color-line)]">
                <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-base font-bold">Thông tin cá nhân</CardTitle>
                <CardDescription className="text-xs">Dữ liệu tài khoản đã được xác thực trên hệ sinh thái DCenter</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
                    <User className="size-3.5" />
                    <span>Họ và tên</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-ink)] mt-1">{profile.display_name || "Chưa cập nhật"}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
                    <Mail className="size-3.5" />
                    <span>Email đăng ký</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-ink)] mt-1">{profile.email || "—"}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
                    <Phone className="size-3.5" />
                    <span>Số điện thoại</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-ink)] mt-1">{profile.phone || "—"}</p>
                </div>

                <div className="p-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] font-medium">
                    <Calendar className="size-3.5" />
                    <span>Ngày khởi tạo</span>
                  </div>
                  <p className="text-sm font-bold text-[var(--color-ink)] mt-1">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN") : "27/08/2026"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "memberships" && (
            <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <CardHeader className="p-0 pb-5 border-b border-[var(--color-line)]">
                <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-base font-bold">Danh sách Tổ chức & Phân quyền Chi nhánh</CardTitle>
                <CardDescription className="text-xs">Các ngữ cảnh làm việc được liên kết với tài khoản này</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-5 space-y-3">
                {profile.memberships && profile.memberships.length > 0 ? (
                  profile.memberships.map((m, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="size-4 text-[var(--color-primary)]" />
                          <h4 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-sm font-bold text-[var(--color-ink)]">{m.org_name || m.org_id}</h4>
                        </div>
                        {m.branch_name && (
                          <p className="text-xs text-[var(--color-muted)] mt-1">Chi nhánh: {m.branch_name}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-xs font-bold">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => router.push("/switch-org")} className="text-xs font-semibold">
                        Chuyển ngữ cảnh
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-[var(--color-muted)]">
                    Bạn đang hoạt động dưới quyền Khách hàng vãng lai (CUSTOMER).
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="rounded-2xl border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <CardHeader className="p-0 pb-5 border-b border-[var(--color-line)]">
                <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-base font-bold">Bảo mật & Phiên làm việc</CardTitle>
                <CardDescription className="text-xs">Thiết lập mật khẩu mới và kiểm soát an toàn tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-5 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-[var(--color-tint)] text-[var(--color-primary)] flex items-center justify-center">
                      <KeyRound className="size-4" />
                    </div>
                    <div>
                      <h4 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-xs font-bold text-[var(--color-ink)]">Mật khẩu tài khoản</h4>
                      <p className="text-xs text-[var(--color-muted)]">Được cập nhật định kỳ để bảo vệ dữ liệu chuỗi lạnh</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push("/forgot-password")} className="text-xs">
                    Đổi mật khẩu
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-tint)]">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-[var(--color-tint)] text-[var(--color-info)] flex items-center justify-center">
                      <CheckCircle2 className="size-4 text-[var(--color-leaf)]" />
                    </div>
                    <div>
                      <h4 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-xs font-bold text-[var(--color-ink)]">Xác thực phiên làm việc BFF</h4>
                      <p className="text-xs text-[var(--color-muted)]">HttpOnly cookie an toàn chống XSS & CSRF</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs font-bold text-[var(--color-ink)]">
                    Bảo vệ 100%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  );
}
