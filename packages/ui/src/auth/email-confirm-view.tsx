"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";

export interface EmailConfirmViewProps {
  token?: string;
  setToken?: (val: string) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleSubmit?: (tokenToUse?: string) => Promise<boolean> | void;
}

export function EmailConfirmView({
  token = "",
  setToken = () => {},
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleSubmit = () => {},
}: EmailConfirmViewProps = {}) {
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
            Email đã được cập nhật thành công!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Vì lý do an toàn bảo mật, toàn bộ phiên đăng nhập cũ đã bị thu hồi. Vui lòng đăng nhập lại bằng email mới.
          </p>
        </div>
        <div className="pt-4">
          <Link href="/login">
            <Button variant="primary" className="w-full">
              Đăng nhập lại ngay
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
          Xác nhận đổi email
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Xác thực mã bảo mật gửi tới hòm thư mới để hoàn tất
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Xác nhận thất bại">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="mt-6 space-y-4">
        <Input
          label="Mã xác nhận (Token)"
          type="text"
          placeholder="Dán mã xác nhận tại đây..."
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
          {isSubmitting ? "Đang xác thực..." : "Xác nhận đổi email"}
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
