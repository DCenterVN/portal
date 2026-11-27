import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { FeaturedDishes } from "./featured-dishes";

const CATEGORIES = [
  {
    name: "Meal kit",
    sub: "Nấu 15–30 phút",
    image: "/images/landing/cat-mealkit.webp",
    alt: "Bữa cơm cá nục kho cà chua cùng bát cơm trắng nóng từ bộ meal kit",
  },
  {
    name: "Sơ chế sẵn",
    sub: "Thịt cá đã rửa, thái",
    image: "/images/landing/cat-prepped.webp",
    alt: "Cá cắt khúc, cải chíp, cà chua bi, gừng sợi và nước sốt chia sẵn theo suất",
  },
  {
    name: "Món canh & xào",
    sub: "Đủ rau, đạm, gia vị",
    image: "/images/landing/cat-soup.webp",
    alt: "Đĩa bò xào cải chíp tươi xanh nóng hổi bày bát sứ trắng",
  },
  {
    name: "Rau củ",
    sub: "Đã rửa, cắt theo món",
    image: "/images/landing/cat-veggies.webp",
    alt: "Khay inox giữ lạnh rau thơm, xà lách và cà rốt thái sợi tươi sạch",
  },
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
      <section aria-label="Giới thiệu" className="-mx-4 border-b border-border px-4 py-10 md:-mx-10 md:px-10 md:py-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold text-balance md:text-4xl">
              {name ? `Chào ${name}, bữa tối 20 phút nhé?` : "Bữa tối 20 phút. Nguyên liệu đã sơ chế sẵn."}
            </h1>
            <p className="mt-3 text-muted-foreground">
              Mỗi hộp có thịt cá, rau củ đã sơ chế, gia vị đã định lượng và công thức từng bước. Đặt trước 15h, giao trong ngày.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/products" className={buttonVariants({ variant: "default", size: "lg" })}>Chọn meal kit tuần này</Link>
              <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" })}>Xem thực đơn</Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-muted">
            <img
              src="/images/landing/hero-meal-kit.webp"
              alt="Bộ nguyên liệu bữa ăn Việt đã sơ chế sẵn kèm món cá nục kho cà chua"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-8 pb-8 pt-6 md:gap-12 md:pb-16 md:pt-12">
        <section aria-labelledby="h-cat" className="flex flex-col gap-4">
          <h2 id="h-cat" className={h2}>Mua theo nhóm</h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {CATEGORIES.map(({ name: n, sub, image, alt }) => (
              <Link
                key={n}
                href="/products"
                className="group flex min-h-11 flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground transition-colors duration-150 hover:border-primary/40 hover:bg-accent"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted/40">
                  <img
                    src={image}
                    alt={alt}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-col p-3.5 sm:p-4">
                  <span className="font-medium">{n}</span>
                  <span className="text-sm text-muted-foreground">{sub}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section aria-labelledby="h-best" className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="h-best" className={h2}>Bán chạy tuần này</h2>
            <Link href="/products" className="inline-flex min-h-11 items-center text-sm font-medium text-primary hover:underline md:min-h-8">Xem tất cả</Link>
          </div>
          <FeaturedDishes limit={8} />
        </section>

        <section aria-labelledby="h-how" className="flex flex-col gap-4">
          <h2 id="h-how" className={h2}>Nấu thế nào</h2>
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-stretch">
            <ol className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {STEPS.map(({ title, copy }, i) => (
                <li key={title} className="rounded-lg border border-border bg-card p-5">
                  <div className="font-medium">{i + 1}. {title}</div>
                  <div className="mt-1 max-w-[46ch] text-sm leading-5 text-muted-foreground">{copy}</div>
                </li>
              ))}
            </ol>
            <div className="overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src="/images/landing/trace-coldchain.webp"
                alt="Khu sơ chế sạch và kiểm định chất lượng chuỗi lạnh"
                loading="lazy"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
