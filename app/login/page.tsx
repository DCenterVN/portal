import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <AuthShell title="Đăng nhập" description="Một tài khoản cho khách mua hàng và nhân viên chi nhánh.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
