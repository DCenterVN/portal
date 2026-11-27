import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { FeaturedDishes } from "./featured-dishes";
import { StoreReveal } from "./store-reveal";
import styles from "./store-surface.module.css";

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
    sub: "Đủ rau, đạm, nước dùng",
    image: "/images/landing/cat-soup.webp",
    alt: "Bát sứ trắng đựng canh rau củ nước dùng trong nóng hổi dưới nắng sáng",
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

const bleed = "-mx-4 md:-mx-10";
const inner = "px-4 md:px-10";
const h2 = "text-2xl font-semibold text-balance tracking-tight";

export function Home({ name }: { name?: string }) {
  return (
    <>
      <section aria-label="Giới thiệu" className={`${bleed} ${styles.heroBand} py-10 md:py-16`}>
        <div className={`grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12 ${inner}`}>
          <div className="max-w-2xl">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles.eyebrowPill} ${styles.heroIn}`}>
              <Leaf className="size-3.5" aria-hidden="true" />
              Giao trong ngày · Đặt trước 15h
            </span>
            <h1 className={`mt-4 text-3xl font-semibold text-balance tracking-tight md:text-4xl ${styles.heroIn} ${styles.d1}`}>
              {name ? `Chào ${name}, bữa tối 20 phút nhé?` : "Bữa tối 20 phút. Nguyên liệu đã sơ chế sẵn."}
            </h1>
            <p className={`mt-3 max-w-[54ch] text-muted-foreground ${styles.heroIn} ${styles.d2}`}>
              Mỗi hộp có thịt cá, rau củ đã sơ chế, gia vị đã định lượng và công thức từng bước. Đặt trước 15h, giao trong ngày.
            </p>
            <div className={`mt-6 flex flex-wrap gap-2.5 ${styles.heroIn} ${styles.d3}`}>
              <Link href="/products" className={buttonVariants({ variant: "default", size: "lg" })}>Chọn meal kit tuần này</Link>
              <Link href="/products" className={buttonVariants({ variant: "outline", size: "lg" })}>Xem thực đơn</Link>
            </div>
          </div>
          <div className={`overflow-hidden rounded-xl border border-border bg-card ${styles.heroMediaFrame} ${styles.heroMediaAnim}`}>
            <img
              src="/images/landing/hero-meal-kit.webp"
              alt="Bộ nguyên liệu bữa ăn Việt đã sơ chế sẵn kèm món cá nục kho cà chua"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="h-cat" className={`${bleed} ${styles.warmBand} py-12 md:py-16`}>
        <div className={`flex flex-col gap-5 ${inner}`}>
          <StoreReveal>
            <h2 id="h-cat" className={h2}>Mua theo nhóm</h2>
          </StoreReveal>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {CATEGORIES.map(({ name: n, sub, image, alt }, index) => (
              <StoreReveal key={n} delayMs={index * 55} className="flex min-w-0">
                <Link
                  href="/products"
                  className={`group flex min-h-11 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${styles.liftCard}`}
                >
                  <div className={`aspect-[4/3] overflow-hidden bg-muted/40 ${styles.mediaOutline}`}>
                    <img
                      src={image}
                      alt={alt}
                      loading="lazy"
                      className={`size-full object-cover ${styles.cardImg}`}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 p-3.5 sm:p-4">
                    <div className="min-w-0">
                      <span className="block font-semibold group-hover:text-primary">{n}</span>
                      <span className="block text-sm text-muted-foreground">{sub}</span>
                    </div>
                    <ArrowRight className={`size-4 shrink-0 text-muted-foreground group-hover:text-primary ${styles.arrowCue}`} aria-hidden="true" />
                  </div>
                </Link>
              </StoreReveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="h-best" className="flex flex-col gap-5 py-12 md:py-16">
        <StoreReveal>
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="h-best" className={h2}>Bán chạy tuần này</h2>
            <Link href="/products" className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary hover:underline md:min-h-8 ${styles.linkCue}`}>
              Xem tất cả
              <ArrowRight className={`size-4 ${styles.arrowCue}`} aria-hidden="true" />
            </Link>
          </div>
        </StoreReveal>
        <FeaturedDishes limit={8} />
      </section>

      <section aria-labelledby="h-how" className={`${bleed} ${styles.sageBand} py-12 md:py-16`}>
        <div className={`flex flex-col gap-5 ${inner}`}>
          <StoreReveal>
            <h2 id="h-how" className={h2}>Nấu thế nào</h2>
          </StoreReveal>
          <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr] lg:items-stretch">
            <ol className="grid gap-3 md:grid-cols-3 lg:grid-cols-1">
              {STEPS.map(({ title, copy }, index) => (
                <StoreReveal key={title} delayMs={index * 60}>
                  <li className={`flex items-start gap-4 rounded-xl border border-border bg-card p-5 ${styles.liftCard}`}>
                    <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${styles.stepBadge}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{title}</div>
                      <div className="mt-1 max-w-[46ch] text-sm leading-5 text-muted-foreground">{copy}</div>
                    </div>
                  </li>
                </StoreReveal>
              ))}
            </ol>
            <StoreReveal delayMs={120}>
              <div className={`h-full overflow-hidden rounded-xl border border-border bg-card ${styles.heroMediaFrame}`}>
                <img
                  src="/images/landing/trace-coldchain.webp"
                  alt="Khu sơ chế sạch và kiểm định chất lượng chuỗi lạnh"
                  loading="lazy"
                  className="aspect-[4/3] h-full w-full object-cover"
                />
              </div>
            </StoreReveal>
          </div>
        </div>
      </section>
    </>
  );
}
