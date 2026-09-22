"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";

export interface ActivateViewProps {
  token?: string;
  setToken?: (val: string) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleSubmit?: (tokenToUse?: string) => Promise<boolean> | void;
}

export function ActivateView({
  token = "",
  setToken = () => {},
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleSubmit = () => {},
}: ActivateViewProps = {}) {
  if (isSuccess) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
            Tài khoản đã được kích hoạt!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Chúc mừng bạn đã kích hoạt tài khoản thành công. Bây giờ bạn có thể đăng nhập vào hệ thống.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-2xl sm:p-10">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Kích hoạt tài khoản
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Nhập mã xác thực được gửi đến email đăng ký của bạn
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Kích hoạt thất bại">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="mt-6 space-y-4">
        <Input
          label="Mã kích hoạt (Token)"
          type="text"
          placeholder="Dán mã kích hoạt tại đây..."
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={isSubmitting || !token.trim()}
        >
          {isSubmitting ? "Đang xác thực..." : "Kích hoạt tài khoản"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--color-muted)]">
        Quay lại{" "}
        <Link href="/login" className="font-semibold text-[var(--color-forest)] hover:underline">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}
