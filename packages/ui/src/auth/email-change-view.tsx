"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";

export interface EmailChangeViewProps {
  newEmail?: string;
  setNewEmail?: (val: string) => void;
  currentPassword?: string;
  setCurrentPassword?: (val: string) => void;
  errors?: {
    newEmail?: string;
    currentPassword?: string;
  };
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleSubmit?: (e?: React.FormEvent) => Promise<boolean> | void;
}

export function EmailChangeView({
  newEmail = "",
  setNewEmail = () => {},
  currentPassword = "",
  setCurrentPassword = () => {},
  errors = {},
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleSubmit = () => {},
}: EmailChangeViewProps = {}) {
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
            Đã gửi email xác nhận!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Liên kết xác nhận thay đổi đã được gửi tới địa chỉ mới{" "}
            <span className="font-semibold text-[var(--color-ink)]">{newEmail}</span>. Vui lòng mở email để hoàn tất.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/ops/dashboard">
            <Button variant="primary" className="w-full">
              Quay lại Bảng điều khiển
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
          Đổi địa chỉ email
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Xác thực mật khẩu hiện tại và chỉ định địa chỉ email công việc mới
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Không thể đổi email">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Mật khẩu hiện tại"
          type="password"
          placeholder="••••••••"
          value={currentPassword}
          error={errors.currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Email mới"
          type="email"
          autoComplete="email"
          placeholder="new-email@vietsach.vn"
          value={newEmail}
          error={errors.newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu đổi email"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--color-muted)]">
        <Link href="/ops/dashboard" className="font-semibold text-[var(--color-forest)] hover:underline">
          Hủy và quay lại
        </Link>
      </div>
    </div>
  );
}
