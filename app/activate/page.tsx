import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/layout/auth-shell";
import { ActivateView } from "@/features/auth/activate-view";

export const metadata: Metadata = { title: "Kích hoạt tài khoản" };

export default function Page() {
  return (
    <AuthShell title="Kích hoạt tài khoản" description="Xác nhận email để bắt đầu sử dụng Việt Sạch.">
      <Suspense>
        <ActivateView />
      </Suspense>
    </AuthShell>
  );
}
