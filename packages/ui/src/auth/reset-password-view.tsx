"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";

export interface ResetPasswordViewProps {
  token?: string;
  setToken?: (val: string) => void;
  newPassword?: string;
  setNewPassword?: (val: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (val: string) => void;
  errors?: {
    token?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleSubmit?: (e?: React.FormEvent) => Promise<boolean> | void;
}

export function ResetPasswordView({
  token = "",
  setToken = () => {},
  newPassword = "",
  setNewPassword = () => {},
  confirmPassword = "",
  setConfirmPassword = () => {},
  errors = {},
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleSubmit = () => {},
}: ResetPasswordViewProps = {}) {
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
            Đổi mật khẩu thành công!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Mật khẩu mới đã được cập nhật. Đang tự động chuyển hướng tới trang đăng nhập...
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
          Đặt lại mật khẩu
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Nhập mã xác thực và thiết lập mật khẩu bảo mật mới
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Không thể đặt lại mật khẩu">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Mã đặt lại (Token)"
          type="text"
          placeholder="Mã xác thực..."
          value={token}
          error={errors.token}
          onChange={(e) => setToken(e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Mật khẩu mới"
          type="password"
          placeholder="Tối thiểu 8 ký tự"
          value={newPassword}
          error={errors.newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Xác nhận mật khẩu mới"
          type="password"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          error={errors.confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang xử lý..." : "Lưu mật khẩu mới"}
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
