import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Tạo tài khoản mua hàng" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Tạo tài khoản mua hàng" subtitle="Mua thực phẩm rõ nguồn gốc, theo dõi đơn và lô hàng của bạn." />
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
