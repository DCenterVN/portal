import type { Metadata } from "next";
import { AuthShell } from "@dcentervn/ui";

export const metadata: Metadata = {
  title: "Tài khoản — Việt Sạch",
  description: "Cổng xác thực người dùng và đối tác chuỗi thực phẩm sạch Việt Sạch",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthShell>{children}</AuthShell>;
}
