"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { activateAccount, resendActivation } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormAlert, FormNotice } from "./form-alert";

type State = "checking" | "done" | "failed" | "resent";

function ResendForm({ onSent }: { onSent: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return setError("Vui lòng nhập email đã đăng ký.");
    setBusy(true);
    try {
      await resendActivation(email);
      onSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi lại được liên kết.");
      setBusy(false);
    }
  };
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-3">
      {error && <FormAlert>{error}</FormAlert>}
      <Label htmlFor="email">Email đã đăng ký</Label>
      <Input id="email" name="email" type="email" autoComplete="email" disabled={busy} className="h-10" />
      <Button type="submit" disabled={busy} className="h-10 w-full">{busy ? "Đang gửi…" : "Gửi lại liên kết kích hoạt"}</Button>
    </form>
  );
}

export function ActivateView() {
  const token = useSearchParams()?.get("token") ?? "";
  const [state, setState] = useState<State>(token ? "checking" : "failed");
  const [error, setError] = useState(token ? "" : "Liên kết kích hoạt thiếu mã xác thực.");

  useEffect(() => {
    if (!token) return;
    // ponytail: no ignore flag on purpose. The token is single-use, and StrictMode runs this effect twice in dev,
    // so an ignore flag would drop the call that consumed it. React 18+ ignores setState after unmount.
    activateAccount(token)
      .then(() => setState("done"))
      .catch(() => {
        setError("Liên kết kích hoạt không hợp lệ, đã dùng hoặc đã hết hạn.");
        setState("failed");
      });
  }, [token]);

  if (state === "checking") return <p aria-busy="true" className="text-center text-sm text-[var(--muted-foreground)]">Đang xác thực liên kết…</p>;
  if (state === "done") {
    return (
      <FormNotice title="Tài khoản đã được kích hoạt">
        <p>Bạn có thể đăng nhập ngay bây giờ.</p>
        <p><Link href={"/login" as Route} className="font-semibold text-[var(--primary)] hover:underline">Đăng nhập</Link></p>
      </FormNotice>
    );
  }
  if (state === "resent") return <FormNotice title="Đã gửi lại liên kết"><p>Nếu email đã đăng ký và chưa kích hoạt, bạn sẽ nhận được liên kết mới trong vài phút.</p></FormNotice>;
  return (
    <div className="space-y-4">
      <FormAlert>{error}</FormAlert>
      <ResendForm onSent={() => setState("resent")} />
    </div>
  );
}
