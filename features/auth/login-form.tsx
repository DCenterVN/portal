"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/patterns/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert } from "./form-alert";
import { resolveHome } from "./home-for";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) return setError("Vui lòng nhập email và mật khẩu.");
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      router.push((await resolveHome(searchParams?.get("redirect") ?? searchParams?.get("next"))) as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng nhập không thành công.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={busy} className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput id="password" name="password" autoComplete="current-password" required disabled={busy} />
        <Link href={"/forgot-password" as Route} className="block text-right text-xs font-medium text-[var(--primary)] hover:underline">Quên mật khẩu?</Link>
      </div>
      <Button type="submit" disabled={busy} className="h-10 w-full">{busy ? "Đang đăng nhập…" : "Đăng nhập"}</Button>
      <div className="space-y-1 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
        <p>Chưa có tài khoản? <Link href={"/register" as Route} className="font-semibold text-[var(--primary)] hover:underline">Đăng ký mua hàng</Link></p>
        <p className="text-xs">Nhân viên dùng tài khoản do quản trị viên cấp qua email.</p>
      </div>
    </form>
  );
}
