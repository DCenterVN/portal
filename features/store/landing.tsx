import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";
import { FeaturedDishes, type FallbackPreviewCard } from "./featured-dishes";
import { StoreReveal } from "./store-reveal";
import styles from "./store-surface.module.css";

const STEPS = [
  { title: "Hồ sơ nguồn gốc", copy: "Nhà cung cấp, chứng nhận và ngày thu hoạch được gắn vào từng lô." },
  { title: "QC trước nhập kho", copy: "Cảm quan, nhiệt độ, hạn dùng và hồ sơ được đối chiếu tại điểm nhận." },
  { title: "Dữ liệu chuỗi lạnh", copy: "Nhiệt độ kho và hành trình vận chuyển được ghi nhận xuyên suốt." },
  { title: "Xác nhận đến tay", copy: "Mỗi lần bàn giao khép lại một hành trình có thể kiểm chứng." },
];

const TRUST_METRICS = [
  { value: "15–20 phút", label: "Lên mâm tại nhà" },
  { value: "0–4°C", label: "Chuỗi lạnh khép kín" },
  { value: "100%", label: "Truy xuất theo từng lô" },
] as const;

const CURATED_PREVIEW: readonly FallbackPreviewCard[] = [
  {
    title: "Meal kit bữa tối 20 phút",
    subtitle: "Nguyên liệu tươi chia sẵn theo suất, nấu nhanh gọn tại nhà.",
    image: "/images/landing/cat-mealkit.webp",
    alt: "Bữa cơm cá nục kho cà chua cùng bát cơm trắng nóng từ bộ meal kit",
    href: "/products",
  },
  {
    title: "Thịt cá sơ chế sạch",
    subtitle: "Làm sạch, cắt lát chuẩn món và bảo quản mát đồng nhất.",
    image: "/images/landing/cat-prepped.webp",
    alt: "Cá cắt khúc, cải chíp, cà chua bi, gừng sợi và nước sốt chia sẵn theo suất",
    href: "/products",
  },
  {
    title: "Canh & món nóng gia đình",
    subtitle: "Nước dùng thanh, rau củ giữ trọn vị tươi cho bữa cơm.",
    image: "/images/landing/cat-soup.webp",
    alt: "Bát sứ trắng đựng canh rau củ nước dùng trong nóng hổi dưới nắng sáng",
    href: "/products",
  },
  {
    title: "Rau củ rửa sạch theo ngày",
    subtitle: "Cắt sẵn theo khẩu phần, giữ lạnh đồng đều trước khi giao.",
    image: "/images/landing/cat-veggies.webp",
    alt: "Khay inox giữ lạnh rau thơm, xà lách và cà rốt thái sợi tươi sạch",
    href: "/products",
  },
];

const ROLES = [
  {
    title: "Gia đình",
    copy: "Chọn thực phẩm rõ nguồn gốc cho bữa ăn mỗi ngày.",
    action: "Mua sản phẩm",
    href: "/products",
    image: "/images/landing/cat-mealkit.webp",
    alt: "Mâm cơm gia đình nấu nhanh từ meal kit cá nục kho cà chua",
  },
  {
    title: "Bếp ăn và nhà hàng",
    copy: "Nguồn cung ổn định, quy cách rõ ràng và giao hàng theo lịch.",
    action: "Tạo tài khoản",
    href: "/register",
    image: "/images/landing/cat-prepped.webp",
    alt: "Nguyên liệu cá, rau củ và gia vị đã sơ chế chia sẵn theo quy cách bếp",
  },
  {
    title: "Nhà cung cấp",
    copy: "Đồng hành bằng hồ sơ chuẩn hóa và quy trình kiểm định minh bạch.",
    action: "Đăng ký hợp tác",
    href: "/register",
    image: "/images/landing/cat-veggies.webp",
    alt: "Nông sản rau củ tươi sạch được phân loại và giữ lạnh theo tiêu chuẩn đầu vào",
  },
  {
    title: "Đội ngũ vận hành",
    copy: "Quản lý chi nhánh, tồn kho và quyền truy cập trong một hệ thống.",
    action: "Đăng nhập",
    href: "/login",
    image: "/images/landing/trace-coldchain.webp",
    alt: "Quầy sơ chế sạch và kiểm soát chất lượng chuỗi lạnh tại bếp trung tâm",
  },
] as const;

const bleed = "-mx-4 md:-mx-10";
const inner = "px-4 md:px-10";
const h2 = "text-2xl font-semibold text-balance tracking-tight";
const cta = `${buttonVariants({ variant: "default", size: "lg" })} max-md:w-full`;
const ctaSecondary = `${buttonVariants({ variant: "outline", size: "lg" })} max-md:w-full`;

export function Landing() {
  return (
    <>
      <section aria-labelledby="hero-title" className={`${bleed} ${styles.heroBand} py-12 md:py-20`}>
        <div className={`grid items-center gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12 ${inner}`}>
          <div className="max-w-2xl">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${styles.eyebrowPill} ${styles.heroIn}`}>
              <Leaf className="size-3.5" aria-hidden="true" />
              Bếp trung tâm Sunny · Sơ chế trong ngày
            </span>
            <h1 id="hero-title" className={`mt-4 text-3xl font-semibold text-balance tracking-tight md:text-5xl md:leading-[1.12] ${styles.heroIn} ${styles.d1}`}>
              Tươi là một cảm giác. Sạch là điều kiểm chứng được.
            </h1>
            <p className={`mt-4 max-w-[54ch] text-base leading-relaxed text-muted-foreground ${styles.heroIn} ${styles.d2}`}>
              {BRAND_NAME} kết nối nông trại, kho lạnh và bàn ăn bằng một chuỗi cung ứng minh bạch, để mỗi lựa chọn ngon lành cũng là một lựa chọn an tâm.
            </p>
            <div className={`mt-7 flex flex-wrap gap-2.5 ${styles.heroIn} ${styles.d3}`}>
              <Link href="/products" className={cta}>Khám phá sản phẩm</Link>
              <Link href="/register" className={ctaSecondary}>Tạo tài khoản</Link>
            </div>
            <div className={`mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 ${styles.heroIn} ${styles.d3}`}>
              <p className="text-sm text-muted-foreground">
                Đã là thành viên?{" "}
                <Link href="/login" className="inline-flex min-h-11 items-center px-1.5 font-medium text-primary underline underline-offset-4 md:min-h-8">
                  Đăng nhập vào hệ thống
                </Link>
              </p>
            </div>
            <dl className={`mt-8 grid max-w-lg grid-cols-3 gap-4 border-t border-border/70 pt-6 ${styles.heroIn} ${styles.d3}`}>
              {TRUST_METRICS.map(({ value, label }) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums text-foreground sm:text-lg">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <figure className={`overflow-hidden rounded-xl border border-border bg-card ${styles.heroMediaFrame} ${styles.heroMediaAnim}`}>
            <img
              src="/images/landing/hero-meal-kit.webp"
              alt="Bộ nguyên liệu bữa ăn Việt đã sơ chế sẵn kèm món cá nục kho cà chua"
              className="aspect-[4/3] w-full object-cover"
            />
            <figcaption className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground">
              Nguyên liệu rửa sạch, thái sẵn và định lượng theo từng suất · Giao trong ngày
            </figcaption>
          </figure>
        </div>
      </section>

      <section aria-labelledby="featured-title" className="py-14 md:py-20">
        <StoreReveal>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="featured-title" className={h2}>Thực đơn nổi bật tuần này</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">Món tươi từ bếp trung tâm, kèm thông tin dinh dưỡng và truy xuất lô hàng.</p>
            </div>
            <Link href="/products" className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-primary hover:underline md:min-h-8 ${styles.linkCue}`}>
              Xem tất cả
              <ArrowRight className={`size-4 ${styles.arrowCue}`} aria-hidden="true" />
            </Link>
          </div>
        </StoreReveal>
        <FeaturedDishes limit={4} fallbackCards={CURATED_PREVIEW} />
      </section>

      <section id="truy-xuat" aria-labelledby="trace-title" className={`${bleed} ${styles.sageBand} py-14 md:py-20`}>
        <div className={`grid items-start gap-8 md:grid-cols-[.88fr_1.12fr] md:gap-14 ${inner}`}>
          <StoreReveal>
            <div>
              <h2 id="trace-title" className={h2}>Theo dấu thực phẩm, từ nơi bắt đầu</h2>
              <p className="mt-3 max-w-[52ch] text-muted-foreground">
                Thông tin không dừng ở một chiếc tem. Mỗi lô hàng là một hồ sơ nối tiếp từ nguồn cung đến điểm giao nhận.
              </p>
              <Link href="/products" className={`${cta} mt-6 md:w-auto`}>Tra cứu sản phẩm</Link>
              <div className={`mt-6 overflow-hidden rounded-xl border border-border bg-card ${styles.heroMediaFrame}`}>
                <img
                  src="/images/landing/trace-coldchain.webp"
                  alt="Khu sơ chế sạch và kiểm định chất lượng chuỗi lạnh"
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            </div>
          </StoreReveal>
          <ol className="grid gap-3.5">
            {STEPS.map(({ title, copy }, index) => (
              <StoreReveal key={title} delayMs={index * 65}>
                <li className={`flex items-start gap-4 rounded-xl border border-border bg-card p-5 ${styles.liftCard}`}>
                  <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${styles.stepBadge}`}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 max-w-[56ch] text-sm leading-5 text-muted-foreground">{copy}</p>
                  </div>
                </li>
              </StoreReveal>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="paths-title" className={`${bleed} ${styles.warmBand} py-14 md:py-20`}>
        <div className={inner}>
          <StoreReveal>
            <h2 id="paths-title" className={h2}>Dành cho bạn</h2>
          </StoreReveal>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLES.map(({ title, copy, action, href, image, alt }, index) => (
              <StoreReveal key={title} delayMs={index * 60} className="flex">
                <article className={`flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card ${styles.liftCard}`}>
                  <div className={`aspect-[4/3] overflow-hidden bg-muted/40 ${styles.mediaOutline}`}>
                    <img src={image} alt={alt} loading="lazy" className={`size-full object-cover ${styles.cardImg}`} />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{copy}</p>
                    <div className="mt-auto pt-4">
                      <Link href={href} className={`inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline md:min-h-8 ${styles.linkCue}`}>
                        {action}
                        <ArrowRight className={`size-4 ${styles.arrowCue}`} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              </StoreReveal>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Bắt đầu" className="py-12 md:py-16">
        <StoreReveal>
          <div className={`${styles.ctaBand} flex flex-col justify-between gap-x-8 gap-y-6 rounded-xl px-6 py-10 md:flex-row md:items-center md:px-12 md:py-12`}>
            <div>
              <h2 className="text-2xl font-semibold text-balance tracking-tight md:text-3xl">
                Chọn điều lành, hiểu rõ điều mình chọn
              </h2>
              <p className={`mt-2 max-w-[52ch] text-sm md:text-base ${styles.ctaMutedCopy}`}>
                Đặt bữa tối sơ chế trong ngày hoặc mở tài khoản để quản lý đơn và truy xuất nguồn gốc từng lô.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/products"
                className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold max-md:w-full ${styles.ctaLight}`}
              >
                Xem sản phẩm
              </Link>
              <Link
                href="/register"
                className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold max-md:w-full ${styles.ctaGhost}`}
              >
                Đăng ký ngay
              </Link>
            </div>
          </div>
        </StoreReveal>
      </section>
    </>
  );
}
