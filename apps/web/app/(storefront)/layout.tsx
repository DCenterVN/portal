import type { Metadata } from "next";
import { StorefrontShell } from "@dcentervn/ui";

export const metadata: Metadata = {
  title: "Cửa hàng — Việt Sạch",
  description: "Đặt hàng nông sản VietGAP và thực phẩm cấp đông sâu giao hỏa tốc",
};

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StorefrontShell>{children}</StorefrontShell>;
}
