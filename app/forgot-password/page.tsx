import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ForgotForm } from "@/features/auth/forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return (
    <AuthShell title="Quên mật khẩu" description="Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.">
      <Suspense>
        <ForgotForm />
      </Suspense>
    </AuthShell>
  );
}
