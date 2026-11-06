"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  LogOut,
  AlertCircle
} from "lucide-react";
import { getProfile, logout, UserProfile } from "@/lib/auth/client";
import { LoadingState } from "@/components/patterns/empty-state";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function ProfileClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "security">("general");

  const fetchUserProfile = () => {
    setLoading(true);
    setError("");
    setErrorStatus(null);
    getProfile()
      .then((data) => {
        if (data.memberships?.length > 0) {
          router.replace("/account");
          return;
        }
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
      <PageShell className="bg-background text-foreground">
        <LoadingState title="Đang tải hồ sơ người dùng…" className="min-h-[50vh] border-0" />
      </PageShell>
    );
  }

  if (error || !profile) {
    const isAuthExpired = errorStatus === 401 || error.toLowerCase().includes("hết hạn") || error.toLowerCase().includes("unauthorized");
    return (
      <PageShell className="bg-background text-foreground">
        <Card className="bg-card text-foreground max-w-md mx-auto mt-12 text-center p-6 border-border">
          <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">
            {isAuthExpired ? "Phiên làm việc hết hạn" : "Không thể tải hồ sơ"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
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
    <PageShell className="bg-background text-foreground">
      <PageHeading
        title="Hồ sơ & Tài khoản Cá nhân"
        badge={
          <Badge variant="outline">
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
        <Card className="lg:col-span-1 p-5 border-border bg-card text-foreground flex flex-col justify-between">
          <div className="text-center pb-4 border-b border-border">
            <Avatar className="size-20 mx-auto mb-3">
              <AvatarFallback className="text-2xl font-semibold">{profile.display_name?.slice(0, 2).toUpperCase() || "VS"}</AvatarFallback>
            </Avatar>
            <h2 className="text-lg font-semibold text-foreground">{profile.display_name || "Nhân sự Việt Sạch"}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email || profile.phone}</p>
            <Badge variant="outline" className="mt-2.5">
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
            <Card className="border-border bg-card p-6">
              <CardHeader className="p-0 pb-5 border-b border-border">
                <CardTitle className="text-base font-semibold">Thông tin cá nhân</CardTitle>
                <CardDescription className="text-xs">Dữ liệu tài khoản đã được xác thực trên hệ sinh thái DCenter</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Họ và tên</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">{profile.display_name || "Chưa cập nhật"}</p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Email đăng ký</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">{profile.email || "—"}</p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Số điện thoại</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">{profile.phone || "—"}</p>
                </div>

                <div className="p-3.5 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <span>Ngày khởi tạo</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    {profile.created_at ? new Date(profile.created_at).toLocaleDateString("vi-VN") : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card className="border-border bg-card p-6">
              <CardHeader className="p-0 pb-5 border-b border-border">
                <CardTitle className="text-base font-semibold">Bảo mật & Phiên làm việc</CardTitle>
                <CardDescription className="text-xs">Thiết lập mật khẩu mới và kiểm soát an toàn tài khoản</CardDescription>
              </CardHeader>
              <CardContent className="p-0 pt-5 space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Mật khẩu tài khoản</h4>
                      <p className="text-xs text-muted-foreground">Được cập nhật định kỳ để bảo vệ dữ liệu chuỗi lạnh</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => router.push("/forgot-password")} className="text-xs">
                    Đổi mật khẩu
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="text-xs font-semibold text-foreground">Xác thực phiên làm việc BFF</h4>
                      <p className="text-xs text-muted-foreground">HttpOnly cookie an toàn chống XSS & CSRF</p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    Đang bảo vệ
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
