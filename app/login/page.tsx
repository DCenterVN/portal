"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { Snowflake, ShieldCheck, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { login, sanitizeRedirectUrl } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;

    if (!email || !password) {
      setStatus("error");
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      await login(email, password);
      const rawRedirect = searchParams?.get("redirect") || searchParams?.get("next");
      const target = sanitizeRedirectUrl(rawRedirect, "/branches");
      router.push(target as Route);
      router.refresh();
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : String(err) || "Đăng nhập không thành công.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-[var(--background)]">
      {/* Left Feature Column (Desktop Only) */}
      <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#0c201c] via-[#122824] to-[#081512] text-[#f7f4eb] p-12 flex-col justify-between relative overflow-hidden border-r border-white/10">
        <div className="absolute top-0 right-0 size-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 size-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Snowflake className="size-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold tracking-tight text-white">Việt Sạch</h2>
              <p className="text-xs text-emerald-400/80 font-medium">Hệ Thống Quản Trị Chuỗi Cung Ứng</p>
            </div>
          </div>

          <div className="mt-16 space-y-4">
            <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-3 py-1">
              <Sparkles className="size-3 mr-1.5" /> Chuẩn Chuỗi Lạnh IoT -18°C
            </Badge>
            <h1 className="font-serif text-3xl font-bold leading-tight text-white">
              Kiểm soát chất lượng và điều phối đơn hàng đa chi nhánh
            </h1>
            <p className="text-sm text-zinc-300/80 leading-relaxed">
              Giải pháp toàn diện kết nối nhà cung ứng VietGAP, quản lý tồn kho lạnh, giám sát QC nghiêm ngặt và phân phối tới hộ gia đình.
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="relative z-10 space-y-3 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <CheckCircle className="size-4 text-emerald-400 shrink-0" />
            <span>Phân quyền vai trò chi tiết theo vị trí công việc (VT-01 đến VT-25)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <CheckCircle className="size-4 text-emerald-400 shrink-0" />
            <span>Cơ chế bảo mật fail-closed tự động khóa khi sai lệch nhiệt độ</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <CheckCircle className="size-4 text-emerald-400 shrink-0" />
            <span>Truy xuất nguồn gốc lô hàng theo thời gian thực</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-zinc-400">
          © 2026 Việt Sạch Platform · DCenterVN Architecture
        </div>
      </div>

      {/* Right Form Column */}
      <div className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] shadow-xl shadow-black/5 rounded-2xl p-6 sm:p-8">
          <CardHeader className="p-0 pb-6 text-center space-y-1.5">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-2">
              <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-md">
                <Snowflake className="size-4" />
              </div>
              <span className="font-serif text-lg font-bold text-[var(--foreground)]">Việt Sạch</span>
            </div>
            <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Đăng nhập tài khoản</CardTitle>
            <CardDescription className="text-xs text-[var(--muted-foreground)]">
              Nhập thông tin xác thực để truy cập cổng vận hành chi nhánh
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {status === "error" && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5"
              >
                <ShieldCheck className="size-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[var(--foreground)]">
                  Email hoặc Mã định danh
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    className="pl-10 h-10 text-xs rounded-xl"
                    placeholder="ten@doanhnghiep.vn hoặc VT-02"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-[var(--foreground)]">
                    Mật khẩu
                  </Label>
                  <Link href="/forgot-password" className="text-xs text-[var(--primary)] hover:underline font-medium">
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "submitting"}
                    className="pl-10 pr-10 h-10 text-xs rounded-xl"
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-7 text-[var(--muted-foreground)]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-10 text-xs font-bold rounded-xl mt-2"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <span className="flex items-center gap-2">
                    <span className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang xác thực...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Đăng nhập <ArrowRight className="size-3.5" />
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
              Chưa có tài khoản phân quyền?{" "}
              <Link href="/register" className="text-[var(--primary)] hover:underline font-bold">
                Đăng ký đối tác
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-xs">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}
