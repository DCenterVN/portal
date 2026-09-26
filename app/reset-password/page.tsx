import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

export default function Page() {
  return (
    <AuthShell title="Đặt mật khẩu mới" description="Dùng cho cả khách hàng và nhân viên vừa được cấp tài khoản.">
      <Suspense>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
