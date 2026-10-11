import Link from "next/link";
import { ArrowRight, BadgeCheck, ClipboardCheck, Check, MapPin, PackageCheck, QrCode, ShieldCheck, ShoppingBasket, Snowflake, Sprout, ThermometerSnowflake, Truck, Users, ChefHat } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

const TRUST = [
  { value: "−18°C", label: "Chuỗi lạnh giám sát liên tục", icon: Snowflake },
  { value: "4 lớp", label: "Kiểm soát chất lượng", icon: ShieldCheck },
  { value: "100%", label: "Lô hàng có thể truy xuất", icon: QrCode },
  { value: "3 miền", label: "Mạng lưới kho vận", icon: MapPin },
];
const TILES = [
  { ph: "[ẢNH RAU CỦ THEO MÙA: CÀ CHUA CHÍN TRÊN CÀNH]", sub: "Đà Lạt · VietGAP", name: "Rau củ theo mùa", feat: true },
  { ph: "[ẢNH HẢI SẢN: CÁ HỒI TƯƠI]", sub: "Chuỗi lạnh −18°C", name: "Hải sản tuyển chọn", feat: false },
  { ph: "[ẢNH THỊT MÁT: BÒ CẮT LÁT]", sub: "Kiểm soát theo lô", name: "Thịt mát cao cấp", feat: false },
];
const STEPS = [
  { eyebrow: "01 · Vùng trồng", title: "Hồ sơ nguồn gốc", copy: "Nhà cung cấp, chứng nhận và ngày thu hoạch được gắn vào từng lô.", icon: Sprout },
  { eyebrow: "02 · Kiểm định", title: "QC trước nhập kho", copy: "Cảm quan, nhiệt độ, hạn dùng và hồ sơ được đối chiếu tại điểm nhận.", icon: ClipboardCheck },
  { eyebrow: "03 · Bảo quản", title: "Dữ liệu chuỗi lạnh", copy: "Nhiệt độ kho và hành trình vận chuyển được ghi nhận xuyên suốt.", icon: ThermometerSnowflake },
  { eyebrow: "04 · Giao nhận", title: "Xác nhận đến tay", copy: "Mỗi lần bàn giao khép lại một hành trình có thể kiểm chứng.", icon: PackageCheck },
];
const ROLES = [
  { title: "Gia đình", copy: "Chọn thực phẩm rõ nguồn gốc cho bữa ăn mỗi ngày.", action: "Mua sản phẩm", href: "/products", icon: ShoppingBasket },
  { title: "Bếp ăn & nhà hàng", copy: "Nguồn cung ổn định, quy cách rõ ràng và giao hàng theo lịch.", action: "Tạo tài khoản", href: "/register", icon: ChefHat },
  { title: "Nhà cung cấp", copy: "Đồng hành bằng hồ sơ chuẩn hóa và quy trình kiểm định minh bạch.", action: "Đăng ký hợp tác", href: "/register", icon: Truck },
  { title: "Đội ngũ vận hành", copy: "Quản lý chi nhánh, tồn kho và quyền truy cập trong một hệ thống.", action: "Đăng nhập", href: "/login", icon: Users },
] as const;

const bleed = "-mx-4 md:-mx-10";
const inner = "px-4 md:px-10";
const eyebrow = "text-xs font-extrabold uppercase tracking-widest text-p-text";
const h2 = "mt-2 font-heading text-3xl font-bold text-balance";
const cta = `${buttonVariants({ variant: "primary", size: "lg" })} max-md:w-full`;
const ctaSecondary = `${buttonVariants({ variant: "outline", size: "lg" })} max-md:w-full`;

export function Landing() {
  return (
    <>
      <section aria-labelledby="hero-title" className={`${bleed} border-b border-line py-8 md:py-16`}>
        <div className={`grid items-center gap-10 md:grid-cols-[.9fr_1.1fr] md:gap-16 ${inner}`}>
          <div>
            <p className={`flex items-center gap-2 ${eyebrow}`}><Sprout className="size-4" aria-hidden="true" />Thực phẩm có hành trình rõ ràng</p>
            <h1 id="hero-title" className="mt-4 font-heading text-3xl font-bold text-balance md:text-4xl">
              Tươi là một cảm giác.<br /><span className="text-p-text">Sạch là điều kiểm chứng được.</span>
            </h1>
            <p className="mt-4 max-w-[56ch] text-fg-2">Bếp Tươi kết nối nông trại, kho lạnh và bàn ăn bằng một chuỗi cung ứng minh bạch, để mỗi lựa chọn ngon lành cũng là một lựa chọn an tâm.</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/products" className={cta}>Khám phá sản phẩm<ArrowRight aria-hidden="true" /></Link>
              <Link href="/register" className={ctaSecondary}>Tạo tài khoản</Link>
            </div>
            <p className="mt-3 text-sm text-fg-2">Đã là thành viên? <Link href="/login" className="inline-flex min-h-11 items-center px-1.5 font-bold text-p-text underline underline-offset-4 md:min-h-8">Đăng nhập vào hệ thống</Link></p>
          </div>
          <div role="img" aria-label="Ảnh rau củ tươi được tuyển chọn" className="relative aspect-square rounded-lg bg-l1-2 text-fg-3 md:aspect-[1.2/1]">
            <div className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-bold tracking-wide">[ẢNH HERO: GIAN RAU CỦ TƯƠI ĐẦY MÀU SẮC]</div>
            <div className="absolute -bottom-4 left-3 w-[min(288px,78%)] rounded-lg border border-line bg-l1 px-5 py-4 text-fg shadow-l3 md:-bottom-5 md:-left-9">
              <span className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-p-text"><BadgeCheck className="size-4" aria-hidden="true" />Lô BT–240831</span>
              <strong className="mt-1.5 block font-heading text-xl leading-7">Đã kiểm định đầu vào</strong>
              <small className="mt-0.5 block text-xs leading-4 text-fg-2">Đà Lạt · Thu hoạch 05:30 hôm nay</small>
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-2.5 rounded-lg border border-line bg-l1 px-3.5 py-2.5 text-fg shadow-l3 md:-right-5 md:top-6">
              <Snowflake className="size-5 text-p-text" aria-hidden="true" />
              <span className="flex flex-col text-xs leading-4 text-fg-2"><strong className="text-base leading-6 tabular-nums text-fg">4,2°C</strong>Nhiệt độ bảo quản</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Cam kết của Bếp Tươi" className={`${bleed} border-b border-line bg-l1`}>
        <div className={`grid grid-cols-2 py-5 md:grid-cols-4 ${inner}`}>
          {TRUST.map(({ value, label, icon: Icon }, i) => (
            <div key={label} className={`flex min-w-0 items-center gap-3.5 py-3 pr-2 md:px-6 md:py-1 ${i % 2 === 0 ? "max-md:border-r max-md:border-line" : ""} ${i < 3 ? "md:border-r md:border-line" : ""} ${i < 2 ? "max-md:border-b max-md:border-line" : ""}`}>
              <span className="grid size-12 flex-none place-items-center rounded-sm bg-p-soft text-p-text"><Icon className="size-6" aria-hidden="true" /></span>
              <p className="min-w-0"><strong className="block font-heading text-xl leading-7 tabular-nums">{value}</strong><span className="block text-xs leading-4 text-fg-2">{label}</span></p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="products-title" className="py-12 md:py-18">
        <header className="mb-6 flex flex-col justify-between gap-x-8 gap-y-3 md:flex-row md:items-end">
          <div><p className={eyebrow}>Từ mùa vụ hôm nay</p><h2 id="products-title" className={h2}>Sản phẩm được chọn bằng tiêu chuẩn,<br />không chỉ bằng vẻ ngoài.</h2></div>
          <Link href="/products" className="inline-flex min-h-11 flex-none items-center gap-2 text-sm font-bold md:min-h-8">Xem toàn bộ sản phẩm<ArrowRight className="size-4" aria-hidden="true" /></Link>
        </header>
        <div className="grid gap-4 md:grid-cols-[1.45fr_1fr] md:grid-rows-[256px_256px]">
          {TILES.map((t) => (
            <Link key={t.name} href="/products" className={`flex flex-col overflow-hidden rounded-lg border border-line bg-l1 text-fg transition-colors duration-150 hover:border-line-strong ${t.feat ? "min-h-85 md:row-span-2" : "min-h-60"}`}>
              <span className="grid min-h-30 flex-1 place-items-center bg-l1-2 px-4 text-center text-xs font-bold text-fg-3">{t.ph}</span>
              <span className="block px-5 py-4">
                <small className="block text-xs leading-4 text-fg-3">{t.sub}</small>
                <strong className="mt-0.5 block font-heading text-xl leading-7">{t.name}</strong>
                {t.feat ? <em className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold not-italic text-p-text">Mở bộ sưu tập<ArrowRight className="size-4" aria-hidden="true" /></em> : null}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="truy-xuat" aria-labelledby="trace-title" className={`${bleed} border-y border-line bg-l1 py-12 md:py-18`}>
        <div className={`grid items-start gap-8 md:grid-cols-[.78fr_1.22fr] md:gap-24 ${inner}`}>
          <div>
            <p className={eyebrow}>Một lô hàng · Bốn dấu mốc</p>
            <h2 id="trace-title" className={h2}>Theo dấu thực phẩm,<br />từ nơi bắt đầu.</h2>
            <p className="mt-4 max-w-[52ch] text-fg-2">Thông tin không dừng ở một chiếc tem. Mỗi lô hàng là một hồ sơ nối tiếp từ nguồn cung đến điểm giao nhận.</p>
            <Link href="/products" className={`${cta} mt-6 md:w-auto`}>Tra cứu sản phẩm<ArrowRight aria-hidden="true" /></Link>
          </div>
          <ol>
            {STEPS.map(({ eyebrow: e, title, copy, icon: Icon }) => (
              <li key={title} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-4 border-b border-line py-5">
                <span className="grid size-12 place-items-center rounded-sm bg-p-soft text-p-text"><Icon className="size-6" aria-hidden="true" /></span>
                <div><small className="text-xs font-extrabold uppercase tracking-wider text-p-text">{e}</small><h3 className="mt-1 font-heading text-xl leading-7">{title}</h3><p className="mt-1 max-w-[56ch] text-sm leading-5 text-fg-2">{copy}</p></div>
                <Check className="mt-1 size-5 text-ok" aria-hidden="true" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="paths-title" className="py-12 md:py-18">
        <header className="mb-6 text-center"><p className={eyebrow}>Bếp Tươi dành cho bạn</p><h2 id="paths-title" className={h2}>Một hệ sinh thái, nhiều cách đồng hành.</h2></header>
        <div className="grid overflow-hidden rounded-lg border border-line bg-l1 md:grid-cols-4">
          {ROLES.map(({ title, copy, action, href, icon: Icon }, i) => (
            <article key={title} className={`flex flex-col px-6 py-7 transition-colors duration-100 hover:bg-l1-2 md:min-h-62 ${i < 3 ? "border-b border-line md:border-b-0" : ""} ${i < 3 ? "md:border-r md:border-line" : ""}`}>
              <Icon className="size-6 text-p-text" aria-hidden="true" />
              <h3 className="mt-8 font-heading text-xl leading-7">{title}</h3>
              <p className="mt-2 text-sm leading-5 text-fg-2">{copy}</p>
              <div className="mt-auto pt-4"><Link href={href} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold md:min-h-8">{action}<ArrowRight className="size-4" aria-hidden="true" /></Link></div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Bắt đầu" className={`${bleed} border-t border-line bg-p-soft py-10 md:py-14`}>
        <div className={`flex flex-col justify-between gap-x-8 gap-y-6 md:flex-row md:items-end ${inner}`}>
          <div><p className={eyebrow}>Bắt đầu từ bữa ăn kế tiếp</p><h2 className={h2}>Chọn điều lành,<br />hiểu rõ điều mình chọn.</h2></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className={cta}>Xem sản phẩm<ArrowRight aria-hidden="true" /></Link>
            <Link href="/register" className={ctaSecondary}>Đăng ký ngay</Link>
          </div>
        </div>
      </section>
    </>
  );
}
