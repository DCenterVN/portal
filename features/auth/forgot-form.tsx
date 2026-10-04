"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { forgotPassword } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormNotice } from "./form-alert";

export function ForgotForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return setError("Vui lòng nhập email.");
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError("Không kết nối được máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  // ponytail: fixed copy, never the server's message — the answer must not reveal whether the email exists
  if (sent) {
    return (
      <FormNotice title="Kiểm tra hộp thư của bạn">
        <p>Nếu email này có tài khoản, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút.</p>
        <p><Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Về trang đăng nhập</Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {error && <FormAlert>{error}</FormAlert>}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" disabled={busy} className="h-10" />
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? "Đang gửi…" : "Gửi liên kết đặt lại"}</Button>
      <p className="border-t border-[var(--border)] pt-4 text-center text-sm text-[var(--muted-foreground)]">
        Nhớ mật khẩu rồi? <Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Đăng nhập</Link>
      </p>
    </form>
  );
}
