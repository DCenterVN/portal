import type { Metadata } from "next";
import { PublicShell } from "@dcentervn/ui";

export const metadata: Metadata = {
  title: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch & Chuỗi Lạnh An Toàn",
  description:
    "Hệ thống phân phối thực phẩm hữu cơ, nông sản đạt chuẩn VietGAP và thực phẩm cấp đông sâu với công nghệ giám sát nhiệt độ chuỗi lạnh liên tục.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PublicShell>{children}</PublicShell>;
}
