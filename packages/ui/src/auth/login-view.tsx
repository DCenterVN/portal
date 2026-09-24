"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";
import { Alert } from "../primitives/alert";
import { Badge } from "../primitives/badge";

export interface LoginViewProps {
  values?: { email: string; password: string };
  errors?: { email?: string; password?: string };
  isSubmitting?: boolean;
  errorMessage?: string | null;
  handleChange?: (field: "email" | "password", value: string) => void;
  handleSubmit?: (e?: React.FormEvent) => Promise<boolean> | void;
}

export function LoginView({
  values = { email: "", password: "" },
  errors = {},
  isSubmitting = false,
  errorMessage = null,
  handleChange = () => {},
  handleSubmit = () => {},
}: LoginViewProps = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-[var(--color-line)]/70 bg-[var(--color-panel)]/85 backdrop-blur-xl shadow-2xl">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Stitch Forest Green Editorial Brand Showcase */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#2D5A27] via-[#224A1E] to-[#153412] p-8 text-white lg:col-span-5 lg:p-10">
          {/* Ambient organic light glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-amber-400/15 blur-3xl" />

          {/* Top section: Operational status & Brand identity */}
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-black/20 px-3.5 py-1 text-xs font-medium text-emerald-200 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Hệ thống vận hành bình thường
            </div>

            <div className="space-y-3">
              <h2 className="font-serif text-2xl font-bold leading-tight text-white lg:text-3xl">
                Hệ thống Quản trị & Vận hành Chuỗi Thực Phẩm Sạch Việt Sạch
              </h2>
              <p className="text-sm leading-relaxed text-emerald-100/90">
                Hệ sinh thái khép kín từ nông trại VietGAP, kiểm định QC đến
                chuỗi kho lạnh sâu -18,5°C và phân phối đa kênh.
              </p>
            </div>

            {/* Operational Pillars Grid */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="font-serif text-base font-bold text-white">Nông trại</div>
                <div className="text-xs text-emerald-100/80">Canh tác chuẩn mực</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="font-serif text-base font-bold text-white">Kiểm định</div>
                <div className="text-xs text-emerald-100/80">Minh bạch truy xuất</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="font-serif text-base font-bold text-white">Bảo quản</div>
                <div className="text-xs text-emerald-100/80">Chuỗi cung ứng lạnh</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur-sm">
                <div className="font-serif text-base font-bold text-white">Đối tác</div>
                <div className="text-xs text-emerald-100/80">Đồng hành bền vững</div>
              </div>
            </div>

            {/* Feature highlights */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-emerald-100/95">
                <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Quy trình BPM kho & luân chuyển hàng hóa</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100/95">
                <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Giám sát QC kiểm định & An toàn thực phẩm VietGAP</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100/95">
                <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Điều phối Logistics xe lạnh liên tỉnh</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-emerald-100/95">
                <svg className="h-4 w-4 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Đối soát COD, công nợ nhà cung cấp tức thì</span>
              </div>
            </div>
          </div>

          {/* Bottom badge */}
          <div className="relative z-10 mt-8 border-t border-white/15 pt-4 text-xs text-emerald-200/80">
            Tin cậy bởi hơn 300 chuỗi bán lẻ, siêu thị và bếp ăn tiêu chuẩn sạch.
          </div>
        </div>

        {/* Right Column: Clean Editorial Login Form */}
        <div className="flex flex-col justify-center bg-[var(--color-panel)]/85 backdrop-blur-xl p-8 lg:col-span-7 lg:p-12">
          <div className="mx-auto w-full max-w-md space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="forest">
                  <span className="font-bold tracking-wider">VIỆT SẠCH</span>
                </Badge>
                <span className="text-xs text-[var(--color-muted)]">Cổng Quản Trị</span>
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-ink)]">
                Đăng nhập
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                Nhập email công việc và mật khẩu để truy cập cổng vận hành.
              </p>
            </div>

            {errorMessage && (
              <Alert variant="error" title="Đăng nhập không thành công">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

              <div className="space-y-1">
                <Input
                  label="Mật khẩu"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={values.password}
                  error={errors.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  disabled={isSubmitting}
                  endAdornment={
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] focus:outline-none"
                      aria-label={showPassword ? "Ẩn ký tự" : "Hiện ký tự"}
                    >
                      {showPassword ? "Ẩn" : "Hiện"}
                    </button>
                  }
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-[var(--color-ink)]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--color-line)] text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="font-medium text-[var(--color-forest)] hover:underline focus:outline-none"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xác thực..." : "Đăng nhập hệ thống"}
              </Button>
            </form>

            {/* Footer switcher */}
            <div className="text-center text-xs text-[var(--color-muted)]">
              Chưa có tài khoản quản lý hoặc đối tác?{" "}
              <Link
                href="/register"
                className="font-semibold text-[var(--color-forest)] hover:underline focus:outline-none"
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
