"use client";

import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";
import { Badge } from "../primitives/badge";

export interface RegisterViewProps {
  values?: {
    email: string;
    password: string;
    displayName: string;
    phone: string;
  };
  errors?: {
    email?: string;
    password?: string;
    displayName?: string;
    phone?: string;
  };
  isSubmitting?: boolean;
  errorMessage?: string | null;
  isSuccess?: boolean;
  handleChange?: (field: "email" | "password" | "displayName" | "phone", value: string) => void;
  handleSubmit?: (e?: React.FormEvent) => Promise<boolean> | void;
}

export function RegisterView({
  values = { email: "", password: "", displayName: "", phone: "" },
  errors = {},
  isSubmitting = false,
  errorMessage = null,
  isSuccess = false,
  handleChange = () => {},
  handleSubmit = () => {},
}: RegisterViewProps = {}) {
  if (isSuccess) {
    return (
      <div className="w-full space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-[var(--color-ink)]">
            Đăng ký thành công!
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            Chúng tôi đã gửi email kích hoạt đến{" "}
            <span className="font-semibold text-[var(--color-ink)]">
              {values.email}
            </span>
            . Vui lòng kiểm tra hộp thư (hoặc Mailpit) để kích hoạt tài khoản.
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
    <div className="w-full max-w-lg rounded-3xl border border-[var(--color-line)] bg-[var(--color-panel)] p-8 shadow-2xl sm:p-10">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="forest">
            <span className="font-bold tracking-wider">VIỆT SẠCH</span>
          </Badge>
          <span className="text-xs text-[var(--color-muted)]">Đối Tác & Điều Hành</span>
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-ink)]">
          Đăng ký tài khoản
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          Cổng đăng ký thành viên quản lý chuỗi cung ứng, kho lạnh & đối tác
        </p>
      </div>

      {errorMessage && (
        <div className="mt-6">
          <Alert variant="error" title="Đăng ký không thành công">
            {errorMessage}
          </Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <Input
          label="Họ và tên"
          type="text"
          placeholder="Nguyễn Văn A"
          value={values.displayName}
          error={errors.displayName}
          onChange={(e) => handleChange("displayName", e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Email công việc"
          type="email"
          autoComplete="email"
          placeholder="name@vietsach.vn"
          value={values.email}
          error={errors.email}
          onChange={(e) => handleChange("email", e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Số điện thoại (tùy chọn)"
          type="tel"
          placeholder="0912345678"
          value={values.phone}
          error={errors.phone}
          onChange={(e) => handleChange("phone", e.target.value)}
          disabled={isSubmitting}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          value={values.password}
          error={errors.password}
          onChange={(e) => handleChange("password", e.target.value)}
          disabled={isSubmitting}
        />

        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)]/60 p-3 text-xs text-[var(--color-muted)]">
          Bằng việc đăng ký, bạn xác nhận đồng ý với Quy chế kiểm soát chất lượng & Quy trình vận hành an toàn thực phẩm Việt Sạch.
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký tài khoản"}
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-[var(--color-muted)]">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-forest)] hover:underline focus:outline-none"
        >
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
