import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { ForgotForm } from "@/features/auth/forgot-form";

export const metadata: Metadata = { title: "Quên mật khẩu" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Quên mật khẩu" subtitle="Nhập email, chúng tôi sẽ gửi liên kết đặt lại mật khẩu." />
      <Suspense>
        <ForgotForm />
      </Suspense>
    </>
  );
}
