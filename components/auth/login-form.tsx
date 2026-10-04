"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Snowflake, ShieldCheck, Lock, Mail, ArrowRight, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";

export function LoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [email, setEmail] = useState("branch.manager@dcenter.vn");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push("/branches");
    }, 400);
  };

  return (
    <div className="bg-[var(--color-bg)] text-[var(--color-ink)] relative flex min-h-[90vh] flex-col items-center justify-center p-4">
      {/* Top right theme toggle */}
      <div className="absolute top-2 right-2 sm:top-6 sm:right-6">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="gap-2"
        >
          {theme === "dark" ? <Sun className="size-3.5 text-[var(--color-muted)]" /> : <Moon className="size-3.5 text-[var(--color-muted)]" />}
          <span className="font-semibold">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-ink)] shadow-[var(--elevation-shadow-pop)]">
            <Snowflake className="size-7" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
              ColdChain HQ
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-1 font-medium">
              Cổng vận hành chuỗi cung ứng thực phẩm cấp đông & quản trị chi nhánh
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-[var(--color-line)] shadow-[var(--elevation-shadow-card)] rounded-2xl overflow-hidden bg-[var(--color-surface)] text-[var(--color-ink)]">
          <CardHeader className="space-y-1.5 pb-4 border-b border-[var(--color-line)] bg-[var(--color-tint)]">
            <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-lg font-bold">Đăng nhập tài khoản</CardTitle>
            <CardDescription className="text-xs font-medium">
              Nhập email hoặc số điện thoại định danh để truy cập chi nhánh
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold">Email / Số điện thoại nhân viên</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 size-4 text-[var(--color-muted)]" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="name@dcenter.vn hoặc 0901234567"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl bg-[var(--color-surface)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold">Mật khẩu</Label>
                  <a href="#" className="text-[11px] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] hover:underline font-semibold">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 size-4 text-[var(--color-muted)]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl bg-[var(--color-surface)]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  defaultChecked
                  className="size-4 rounded border-[var(--color-input-border)] accent-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                />
                <label htmlFor="remember" className="text-xs text-[var(--color-muted)] font-medium select-none cursor-pointer">
                  Ghi nhớ phiên đăng nhập chi nhánh này
                </label>
              </div>

              <Button
                type="submit"
                variant="default"
                size="default"
                className="w-full mt-2 gap-2"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Vào hệ thống chi nhánh"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-[var(--color-line)] pt-3.5 pb-3.5 bg-[var(--color-tint)] text-center">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)] font-medium">
              <ShieldCheck className="size-3.5 text-[var(--color-leaf)]" />
              <span>Xác thực an toàn đa chi nhánh · Bảo mật RBAC v1.0</span>
            </div>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[var(--color-muted)] font-medium">
          Hệ thống quản lý nội bộ dành riêng cho cán bộ & nhân viên DCenterVN.
        </p>
      </div>
    </div>
  );
}
