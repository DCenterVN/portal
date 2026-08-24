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
    <div className="relative flex min-h-[90vh] flex-col items-center justify-center p-4">
      {/* Top right theme toggle */}
      <div className="absolute top-2 right-2 sm:top-6 sm:right-6">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className="gap-2 text-xs rounded-xl border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-xs"
        >
          {theme === "dark" ? <Sun className="size-3.5 text-amber-400" /> : <Moon className="size-3.5 text-slate-600" />}
          <span className="font-semibold">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </Button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0284C7] to-[#0F766E] text-white shadow-xl shadow-sky-500/25">
            <Snowflake className="size-7" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
              ColdChain HQ
            </h1>
            <p className="text-xs text-[var(--muted-foreground)] mt-1 font-medium">
              Cổng vận hành chuỗi cung ứng thực phẩm cấp đông & quản trị chi nhánh
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-[var(--border)] shadow-2xl rounded-2xl overflow-hidden bg-[var(--card)] text-[var(--card-foreground)]">
          <CardHeader className="space-y-1.5 pb-4 border-b border-[var(--border)] bg-[var(--muted)]/50">
            <CardTitle className="text-lg font-bold">Đăng nhập tài khoản</CardTitle>
            <CardDescription className="text-xs font-medium">
              Nhập email hoặc số điện thoại định danh để truy cập chi nhánh
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-semibold">Email / Số điện thoại nhân viên</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-2.5 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="name@dcenter.vn hoặc 0901234567"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-10 rounded-xl bg-[var(--card)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="font-semibold">Mật khẩu</Label>
                  <a href="#" className="text-[11px] text-[var(--primary)] hover:underline font-semibold">
                    Quên mật khẩu?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-2.5 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 h-10 rounded-xl bg-[var(--card)]"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  defaultChecked
                  className="size-4 rounded border-slate-300 text-[#0284C7] focus:ring-[#0284C7]"
                />
                <label htmlFor="remember" className="text-xs text-[var(--muted-foreground)] font-medium select-none cursor-pointer">
                  Ghi nhớ phiên đăng nhập chi nhánh này
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-10 mt-2 gap-2 font-bold rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0F766E] hover:opacity-95 text-white shadow-lg shadow-sky-500/20"
                disabled={loading}
              >
                {loading ? "Đang xác thực..." : "Vào hệ thống chi nhánh"}
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center justify-center border-t border-[var(--border)] pt-3.5 pb-3.5 bg-[var(--muted)]/40 text-center">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] font-medium">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Xác thực an toàn đa chi nhánh · Bảo mật RBAC v1.0</span>
            </div>
          </CardFooter>
        </Card>

        {/* Footer info */}
        <p className="text-center text-[11px] text-[var(--muted-foreground)] font-medium">
          Hệ thống quản lý nội bộ dành riêng cho cán bộ & nhân viên DCenterVN.
        </p>
      </div>
    </div>
  );
}
