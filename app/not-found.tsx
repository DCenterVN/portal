import Link from "next/link";
import { StoreFrame } from "@/features/store/store-frame";

export default function NotFound() {
  return (
    <StoreFrame>
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-semibold">Không tìm thấy trang</h1>
        <p className="mt-4">Trang bạn đang tìm không tồn tại hoặc đã được chuyển.</p>
        <Link className="mt-6 inline-block underline" href="/">
          Về trang chủ
        </Link>
      </section>
    </StoreFrame>
  );
}
