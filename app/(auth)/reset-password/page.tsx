import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { ResetForm } from "@/features/auth/reset-form";

export const metadata: Metadata = { title: "Đặt mật khẩu mới" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Đặt mật khẩu mới" subtitle="Dùng cho cả khách hàng và nhân viên vừa được cấp tài khoản." />
      <Suspense>
        <ResetForm />
      </Suspense>
    </>
  );
}
