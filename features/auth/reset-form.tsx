"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/patterns/password-input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormNotice } from "./form-alert";

export function ResetForm() {
  const token = useSearchParams()?.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? "" : "Liên kết đặt lại thiếu mã xác thực. Hãy yêu cầu liên kết mới.");
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if ([...password].length < 12) return setError("Mật khẩu cần ít nhất 12 ký tự.");
    if (password !== form.get("confirm")) return setError("Hai mật khẩu không khớp.");
    setBusy(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Liên kết đặt lại không hợp lệ hoặc đã hết hạn.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <FormNotice title="Đã đặt lại mật khẩu">
        <p>Mật khẩu mới đã có hiệu lực, các phiên đăng nhập cũ đã bị đăng xuất.</p>
        <p><Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Đăng nhập</Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu mới</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-describedby="password-hint" disabled={busy || !token} />
        <p id="password-hint" className="text-xs text-[var(--muted-foreground)]">Ít nhất 12 ký tự.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Nhập lại mật khẩu mới</Label>
        <PasswordInput id="confirm" name="confirm" autoComplete="new-password" disabled={busy || !token} />
      </div>
      <Button type="submit" disabled={busy || !token} className="w-full">{busy ? "Đang lưu…" : "Đặt lại mật khẩu"}</Button>
      <p className="border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
        <Link href={"/forgot-password" as Route} className="font-semibold text-[var(--primary)] hover:underline">Yêu cầu liên kết mới</Link>
      </p>
    </form>
  );
}
