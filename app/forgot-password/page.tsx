"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Snowflake, ShieldCheck, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { forgotPassword } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setStatus("error");
      setMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    try {
      const msg = await forgotPassword(email);
      setStatus("success");
      setMessage(msg);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : String(err) || "Lỗi xử lý yêu cầu.");
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
          <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Quên mật khẩu</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)]">
            Nhập email đã đăng ký để nhận liên kết thiết lập lại mật khẩu
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
                <Link href="/login">Quay lại Đăng nhập</Link>
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
                  <Label htmlFor="email" className="text-xs font-semibold text-[var(--foreground)]">
                    Email tài khoản
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[var(--muted-foreground)]" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={status === "submitting"}
                      className="pl-10 h-10 text-xs rounded-xl"
                      placeholder="ten@email.com"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-10 text-xs font-bold rounded-xl mt-2"
                  disabled={status === "submitting"}
                >
                  {status === "submitting" ? "Đang gửi..." : "Gửi liên kết khôi phục"}
                </Button>
              </form>

              <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] font-medium"
                >
                  <ArrowLeft className="size-3.5" /> Quay lại Đăng nhập
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
