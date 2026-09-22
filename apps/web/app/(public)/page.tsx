import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Việt Sạch — Chuỗi Cung Ứng Thực Phẩm Sạch & Chuỗi Lạnh An Toàn",
  description:
    "Hệ thống phân phối thực phẩm hữu cơ, nông sản đạt chuẩn VietGAP và thực phẩm cấp đông sâu với công nghệ giám sát nhiệt độ chuỗi lạnh liên tục.",
};

export default function LandingPage() {
  return (
    <div>
      <section className="px-6 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold leading-tight text-[var(--color-ink)] md:text-5xl">
          Thực phẩm xanh sạch — từ nông trại hữu cơ đến bàn ăn gia đình
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-[var(--color-muted)]">
          Cam kết kiểm soát nhiệt độ nghiêm ngặt chuẩn chuỗi lạnh, 100% minh
          bạch nguồn gốc lô hàng.
        </p>
      </section>
    </div>
  );
}
