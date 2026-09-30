import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { ActivateView } from "@/features/auth/activate-view";

export const metadata: Metadata = { title: "Kích hoạt tài khoản" };

export default function Page() {
  return (
    <>
      <AuthHeading title="Kích hoạt tài khoản" subtitle="Xác nhận email để bắt đầu sử dụng Việt Sạch." />
      <Suspense>
        <ActivateView />
      </Suspense>
    </>
  );
}
