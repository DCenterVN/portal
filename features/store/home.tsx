import Link from "next/link";
import { Box, Carrot, Snowflake, Utensils } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";

const CATEGORIES = [
  { name: "Meal kit", sub: "Nấu 15–30 phút", icon: Box },
  { name: "Sơ chế sẵn", sub: "Thịt cá đã ướp, thái", icon: Utensils },
  { name: "Đông lạnh", sub: "Chả, há cảo, viên", icon: Snowflake },
  { name: "Rau củ", sub: "Đã rửa, cắt theo món", icon: Carrot },
];
const STEPS = [
  { title: "Chọn món, chọn giờ giao", copy: "Giao từ chi nhánh gần nhất, nhận trong khung 2 giờ." },
  { title: "Mở hộp, làm theo thẻ công thức", copy: "Nguyên liệu đã rửa, thái, ướp sẵn và chia theo từng bước." },
  { title: "Lên mâm sau khoảng 20 phút", copy: "Trên mỗi hộp có ghi hạn dùng và cách bảo quản." },
];
const h2 = "font-heading text-2xl font-bold leading-8";

export function Home({ name }: { name?: string }) {
  return (
    <>
      <section aria-label="Giới thiệu" className="relative -mx-4 h-130 overflow-hidden bg-l1-2 md:-mx-10 md:h-140">
        <div className="absolute inset-0 grid place-items-center text-sm font-bold tracking-wide text-fg-3">[ẢNH HERO: MÂM MEAL KIT THẬT, TRÀN VIỀN]</div>
        <div className="absolute inset-x-4 bottom-4 max-w-140 rounded-xl border border-line bg-l1 p-5 shadow-l3 md:bottom-12 md:left-10 md:right-auto md:p-8">
          <span className="inline-flex h-6 items-center rounded-sm border border-line bg-l1 px-2.5 text-xs font-bold text-fg-2">Đặt trước 15h · giao trong ngày</span>
          <h1 className="mt-3 font-heading text-3xl font-bold md:text-4xl">{name ? `Chào ${name}, bữa tối 20 phút nhé?` : "Bữa tối 20 phút. Nguyên liệu đã sơ chế sẵn."}</h1>
          <p className="mt-2 text-fg-2">Mỗi hộp có thịt cá, rau củ đã sơ chế, gia vị đã định lượng và công thức từng bước.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/products" className={buttonVariants({ variant: "primary", size: "lg" })}>Chọn meal kit tuần này</Link>
            <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" })}>Xem thực đơn</Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8 pb-8 pt-6 md:gap-12 md:pb-16 md:pt-12">
        <section aria-labelledby="h-cat" className="flex flex-col gap-4">
          <h2 id="h-cat" className={h2}>Mua theo nhóm</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map(({ name: n, sub, icon: Icon }) => (
              <Link key={n} href="/products" className="flex min-h-11 items-center gap-3.5 rounded-lg border border-line bg-l1 p-3.5 text-fg transition-colors duration-150 hover:border-line-strong">
                <span className="grid size-12 flex-none place-items-center rounded-sm bg-p-soft text-p-text"><Icon className="size-6" aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block font-bold">{n}</span><span className="block text-sm text-fg-3">{sub}</span></span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-best" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="h-best" className={h2}>Bán chạy tuần này</h2>
            <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-bold md:min-h-8">Xem tất cả</Link>
          </div>
          <EmptyState title="Danh sách bán chạy sẽ hiện ở đây" description="Danh mục sản phẩm đang được cập nhật. Bạn vẫn xem được toàn bộ thực đơn." action={<Link href="/products" className={buttonVariants({ variant: "outline", size: "md" })}>Xem thực đơn</Link>} />
        </section>

        <section aria-labelledby="h-how" className="flex flex-col gap-4">
          <h2 id="h-how" className={h2}>Nấu thế nào</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map(({ title, copy }, i) => (
              <li key={title} className="rounded-lg border border-line bg-l1 p-5">
                <div className="text-xs font-extrabold tracking-wider text-p-text">BƯỚC {i + 1}</div>
                <div className="mt-1 font-bold">{title}</div>
                <div className="mt-1 max-w-[40ch] text-sm leading-5 text-fg-2">{copy}</div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
