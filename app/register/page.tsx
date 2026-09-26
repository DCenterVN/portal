import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Tạo tài khoản mua hàng" };

export default function Page() {
  return (
    <AuthShell title="Tạo tài khoản mua hàng" description="Mua thực phẩm rõ nguồn gốc, theo dõi đơn và lô hàng của bạn.">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
