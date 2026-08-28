"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Snowflake, ShieldCheck, Mail, Phone, User, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { register } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email && !phone) {
      setStatus("error");
      setErrorMessage("Vui lòng nhập ít nhất email hoặc số điện thoại.");
      return;
    }
    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("Mật khẩu phải có độ dài tối thiểu 8 ký tự.");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      await register(email, phone, displayName, password);
      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : String(err) || "Đăng ký không thành công.");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] p-8 text-center rounded-2xl shadow-xl">
          <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="font-serif text-xl font-bold text-emerald-700 dark:text-emerald-400">
            Đăng ký thành công!
          </CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)] mt-2 leading-relaxed">
            Chúng tôi đã gửi đường link kích hoạt tài khoản tới <strong className="text-[var(--foreground)]">{email || phone}</strong>. Vui lòng kiểm tra hòm thư và nhấn vào liên kết để hoàn tất kích hoạt.
          </CardDescription>
          <div className="mt-6">
            <Button asChild className="w-full text-xs font-bold rounded-xl">
              <Link href="/login">Quay lại Đăng nhập</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 bg-[var(--background)]">
      <Card className="w-full max-w-lg border-[var(--border)] bg-[var(--card)] shadow-xl rounded-2xl p-6 sm:p-8">
        <CardHeader className="p-0 pb-6 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Snowflake className="size-4" />
            </div>
            <span className="font-serif text-lg font-bold text-[var(--foreground)]">Việt Sạch</span>
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)]">
            Tạo tài khoản đối tác cung ứng hoặc nhân sự vận hành chi nhánh
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
              <Label htmlFor="displayName" className="text-xs font-semibold text-[var(--foreground)]">
                Họ và tên
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={status === "submitting"}
                  className="pl-10 h-10 text-xs rounded-xl"
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-[var(--foreground)]">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "submitting"}
                    className="pl-10 h-10 text-xs rounded-xl"
                    placeholder="ten@email.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold text-[var(--foreground)]">
                  Số điện thoại
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={status === "submitting"}
                    className="pl-10 h-10 text-xs rounded-xl"
                    placeholder="0912 345 678"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-semibold text-[var(--foreground)]">
                Mật khẩu (tối thiểu 8 ký tự)
              </Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
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
              {status === "submitting" ? "Đang xử lý..." : "Đăng ký tài khoản"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--border)] text-center text-xs text-[var(--muted-foreground)]">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-[var(--primary)] hover:underline font-bold">
              Đăng nhập ngay
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
