"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Snowflake, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { activateAccount } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ActivateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (token) {
      setStatus("submitting");
      activateAccount(token)
        .then(() => setStatus("success"))
        .catch((err: unknown) => {
          setStatus("error");
          setErrorMessage(err instanceof Error ? err.message : String(err) || "Kích hoạt không thành công hoặc mã đã hết hạn.");
        });
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
      <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        <CardHeader className="p-0 pb-6 space-y-1.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Snowflake className="size-4" />
            </div>
            <span className="font-serif text-lg font-bold text-[var(--foreground)]">Việt Sạch</span>
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Kích hoạt tài khoản</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)]">
            Xác thực định danh người dùng trên hệ thống DCenter
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {status === "submitting" && (
            <div className="py-8 space-y-3">
              <div className="size-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--muted-foreground)]">Đang xác thực mã kích hoạt của bạn...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4 py-2">
              <div className="size-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="size-6" />
              </div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                Tài khoản của bạn đã được kích hoạt thành công!
              </p>
              <Button asChild className="w-full text-xs font-bold rounded-xl mt-4">
                <Link href="/login">Đăng nhập ngay</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4 py-2">
              <div
                role="alert"
                aria-live="polite"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5 text-left"
              >
                <ShieldCheck className="size-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
              <Button asChild variant="outline" className="w-full text-xs font-bold rounded-xl">
                <Link href="/login">Quay lại Đăng nhập</Link>
              </Button>
            </div>
          )}

          {status === "idle" && !token && (
            <div className="space-y-4 py-2">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5 text-left">
                <AlertCircle className="size-4 shrink-0 text-amber-500" />
                <span>Không tìm thấy mã xác thực trong đường dẫn.</span>
              </div>
              <Button asChild variant="outline" className="w-full text-xs font-bold rounded-xl">
                <Link href="/login">Quay lại Đăng nhập</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-xs">Đang tải...</div>}>
      <ActivateContent />
    </Suspense>
  );
}
