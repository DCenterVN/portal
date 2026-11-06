import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";

const CATEGORIES = [
  { name: "Meal kit", sub: "Nấu 15–30 phút" },
  { name: "Sơ chế sẵn", sub: "Thịt cá đã ướp, thái" },
  { name: "Đông lạnh", sub: "Chả, há cảo, viên" },
  { name: "Rau củ", sub: "Đã rửa, cắt theo món" },
];
const STEPS = [
  { title: "Chọn món, chọn giờ giao", copy: "Giao từ chi nhánh gần nhất, nhận trong khung 2 giờ." },
  { title: "Mở hộp, làm theo thẻ công thức", copy: "Nguyên liệu đã rửa, thái, ướp sẵn và chia theo từng bước." },
  { title: "Lên mâm sau khoảng 20 phút", copy: "Trên mỗi hộp có ghi hạn dùng và cách bảo quản." },
];
const h2 = "text-xl font-semibold";

export function Home({ name }: { name?: string }) {
  return (
    <>
      <section aria-label="Giới thiệu" className="-mx-4 border-b border-border px-4 py-10 md:-mx-10 md:px-10 md:py-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-balance md:text-4xl">{name ? `Chào ${name}, bữa tối 20 phút nhé?` : "Bữa tối 20 phút. Nguyên liệu đã sơ chế sẵn."}</h1>
          <p className="mt-3 text-muted-foreground">Mỗi hộp có thịt cá, rau củ đã sơ chế, gia vị đã định lượng và công thức từng bước. Đặt trước 15h, giao trong ngày.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/products" className={buttonVariants({ variant: "default", size: "lg" })}>Chọn meal kit tuần này</Link>
            <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" })}>Xem thực đơn</Link>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8 pb-8 pt-6 md:gap-12 md:pb-16 md:pt-12">
        <section aria-labelledby="h-cat" className="flex flex-col gap-4">
          <h2 id="h-cat" className={h2}>Mua theo nhóm</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {CATEGORIES.map(({ name: n, sub }) => (
              <Link key={n} href="/products" className="flex min-h-11 flex-col rounded-lg border border-border bg-card p-4 text-foreground transition-colors duration-150 hover:bg-accent">
                <span className="font-medium">{n}</span>
                <span className="text-sm text-muted-foreground">{sub}</span>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-best" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="h-best" className={h2}>Bán chạy tuần này</h2>
            <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline md:min-h-8">Xem tất cả</Link>
          </div>
          <EmptyState title="Danh sách bán chạy sẽ hiện ở đây" description="Danh mục sản phẩm đang được cập nhật. Bạn vẫn xem được toàn bộ thực đơn." action={<Link href="/products" className={buttonVariants({ variant: "outline" })}>Xem thực đơn</Link>} />
        </section>

        <section aria-labelledby="h-how" className="flex flex-col gap-4">
          <h2 id="h-how" className={h2}>Nấu thế nào</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STEPS.map(({ title, copy }, i) => (
              <li key={title} className="rounded-lg border border-border bg-card p-5">
                <div className="font-medium">{i + 1}. {title}</div>
                <div className="mt-1 max-w-[40ch] text-sm leading-5 text-muted-foreground">{copy}</div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
