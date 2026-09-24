"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Snowflake, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { resetPassword } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("Mã xác thực (token) không tồn tại hoặc đã hết hạn.");
      return;
    }
    if ([...newPassword].length < 12) {
      setStatus("error");
      setMessage("Mật khẩu mới phải có tối thiểu 12 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const msg = await resetPassword(token, newPassword);
      setStatus("success");
      setMessage(msg);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err) || "Đặt lại mật khẩu thất bại.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] shadow-xl rounded-2xl p-6 sm:p-8">
        <CardHeader className="p-0 pb-6 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Snowflake className="size-4" />
            </div>
            <span className="font-serif text-lg font-bold text-[var(--foreground)]">Việt Sạch</span>
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Thiết lập mật khẩu mới</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)]">
            Nhập mật khẩu an toàn mới cho tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{message}</p>
              <Button asChild className="w-full text-xs font-bold rounded-xl">
                <Link href="/login">Đăng nhập với mật khẩu mới</Link>
              </Button>
            </div>
          ) : (
            <>
              {status === "error" && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5"
                >
                  <ShieldCheck className="size-4 shrink-0 text-rose-500" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs font-semibold text-[var(--foreground)]">
                    Mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[var(--foreground)]">
                    Xác nhận mật khẩu mới
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={status === "submitting"}
                      className="pl-10 h-10 text-xs rounded-xl"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-xs font-bold rounded-xl mt-2"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-xs">Đang tải...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
