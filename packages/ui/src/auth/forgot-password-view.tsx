"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";

export interface ForgotPasswordViewProps {
  email?: string;
  setEmail?: (val: string) => void;
  error?: string;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleSubmit?: (e?: React.FormEvent) => Promise<boolean> | void;
}

export function ForgotPasswordView({
  email = "",
  setEmail = () => {},
  error,
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleSubmit = () => {},
}: ForgotPasswordViewProps = {}) {
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
            Đã gửi yêu cầu đặt lại mật khẩu!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Nếu email <span className="font-semibold text-[var(--color-ink)]">{email}</span> tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hòm thư.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Quay lại Đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-2xl sm:p-10">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Quên mật khẩu?
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Nhập email công việc đã đăng ký với Việt Sạch để nhận liên kết khôi phục
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Gửi yêu cầu thất bại">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Email công việc"
          type="email"
          autoComplete="email"
          placeholder="name@vietsach.vn"
          value={email}
          error={error}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi liên kết đặt lại"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--color-muted)]">
        Nhớ mật khẩu?{" "}
        <Link href="/login" className="font-semibold text-[var(--color-forest)] hover:underline">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
