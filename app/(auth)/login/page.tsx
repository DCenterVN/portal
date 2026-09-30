import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { LoginForm } from "@/features/auth/login-form";

export const metadata: Metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Đăng nhập" subtitle="Một tài khoản cho khách mua hàng và nhân viên chi nhánh." />
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
