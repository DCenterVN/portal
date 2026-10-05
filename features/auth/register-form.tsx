"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { register } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/patterns/password-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormNotice } from "./form-alert";

function validate(email: string, phone: string, name: string, password: string): string {
  if (!email && !phone) return "Vui lòng nhập email hoặc số điện thoại.";
  if (name.length > 50) return "Tên hiển thị tối đa 50 ký tự.";
  if ([...password].length < 12) return "Mật khẩu cần ít nhất 12 ký tự.";
  return "";
}

export function RegisterForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const [email, phone, name] = ["email", "phone", "display_name"].map((k) => String(form.get(k) ?? "").trim());
    const password = String(form.get("password") ?? "");
    const invalid = validate(email, phone, name, password);
    if (invalid) return setError(invalid);
    setBusy(true);
    setError("");
    try {
      await register(email, phone, name, password);
      setSentTo(email || phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đăng ký không thành công.");
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <FormNotice title="Kiểm tra hộp thư của bạn">
        <p>Chúng tôi đã gửi liên kết kích hoạt tới <strong className="text-[var(--foreground)]">{sentTo}</strong>. Mở liên kết để hoàn tất đăng ký.</p>
        <p><Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Về trang đăng nhập</Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-1.5">
        <Label htmlFor="display_name">Tên hiển thị</Label>
        <Input id="display_name" name="display_name" autoComplete="name" maxLength={50} disabled={busy} className="h-10" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" disabled={busy} className="h-10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" disabled={busy} className="h-10" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Mật khẩu</Label>
        <PasswordInput id="password" name="password" autoComplete="new-password" aria-describedby="password-hint" disabled={busy} />
        <p id="password-hint" className="text-xs text-[var(--muted-foreground)]">Ít nhất 12 ký tự.</p>
      </div>
      <Button type="submit" variant="accent" disabled={busy} className="w-full">{busy ? "Đang tạo tài khoản…" : "Tạo tài khoản"}</Button>
      <div className="space-y-1 border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
        <p>Đã có tài khoản? <Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Đăng nhập</Link></p>
        <p className="text-xs">Trang này dành cho khách mua hàng. Nhân viên không tự đăng ký, tài khoản do quản trị viên cấp.</p>
      </div>
    </form>
  );
}
