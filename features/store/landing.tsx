import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BRAND_NAME } from "@/lib/brand";

const STEPS = [
  { title: "Hồ sơ nguồn gốc", copy: "Nhà cung cấp, chứng nhận và ngày thu hoạch được gắn vào từng lô." },
  { title: "QC trước nhập kho", copy: "Cảm quan, nhiệt độ, hạn dùng và hồ sơ được đối chiếu tại điểm nhận." },
  { title: "Dữ liệu chuỗi lạnh", copy: "Nhiệt độ kho và hành trình vận chuyển được ghi nhận xuyên suốt." },
  { title: "Xác nhận đến tay", copy: "Mỗi lần bàn giao khép lại một hành trình có thể kiểm chứng." },
];
const ROLES = [
  { title: "Gia đình", copy: "Chọn thực phẩm rõ nguồn gốc cho bữa ăn mỗi ngày.", action: "Mua sản phẩm", href: "/products" },
  { title: "Bếp ăn và nhà hàng", copy: "Nguồn cung ổn định, quy cách rõ ràng và giao hàng theo lịch.", action: "Tạo tài khoản", href: "/register" },
  { title: "Nhà cung cấp", copy: "Đồng hành bằng hồ sơ chuẩn hóa và quy trình kiểm định minh bạch.", action: "Đăng ký hợp tác", href: "/register" },
  { title: "Đội ngũ vận hành", copy: "Quản lý chi nhánh, tồn kho và quyền truy cập trong một hệ thống.", action: "Đăng nhập", href: "/login" },
] as const;

const bleed = "-mx-4 md:-mx-10";
const inner = "px-4 md:px-10";
const h2 = "text-2xl font-semibold text-balance";
const cta = `${buttonVariants({ variant: "default", size: "lg" })} max-md:w-full`;
const ctaSecondary = `${buttonVariants({ variant: "outline", size: "lg" })} max-md:w-full`;

export function Landing() {
  return (
    <>
      <section aria-labelledby="hero-title" className={`${bleed} border-b border-border py-12 md:py-20`}>
        <div className={`max-w-3xl ${inner}`}>
          <h1 id="hero-title" className="text-3xl font-semibold text-balance md:text-4xl">Tươi là một cảm giác. Sạch là điều kiểm chứng được.</h1>
          <p className="mt-4 max-w-[56ch] text-muted-foreground">{BRAND_NAME} kết nối nông trại, kho lạnh và bàn ăn bằng một chuỗi cung ứng minh bạch, để mỗi lựa chọn ngon lành cũng là một lựa chọn an tâm.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/products" className={cta}>Khám phá sản phẩm</Link>
            <Link href="/register" className={ctaSecondary}>Tạo tài khoản</Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Đã là thành viên? <Link href="/login" className="inline-flex min-h-11 items-center px-1.5 font-medium text-primary underline underline-offset-4 md:min-h-8">Đăng nhập vào hệ thống</Link></p>
        </div>
      </section>

      <section id="truy-xuat" aria-labelledby="trace-title" className="py-12 md:py-16">
        <div className="grid items-start gap-8 md:grid-cols-[.78fr_1.22fr] md:gap-24">
          <div>
            <h2 id="trace-title" className={h2}>Theo dấu thực phẩm, từ nơi bắt đầu</h2>
            <p className="mt-3 max-w-[52ch] text-muted-foreground">Thông tin không dừng ở một chiếc tem. Mỗi lô hàng là một hồ sơ nối tiếp từ nguồn cung đến điểm giao nhận.</p>
            <Link href="/products" className={`${cta} mt-6 md:w-auto`}>Tra cứu sản phẩm</Link>
          </div>
          <ol className="list-decimal pl-5 marker:text-muted-foreground">
            {STEPS.map(({ title, copy }) => (
              <li key={title} className="border-b border-border py-4 pl-2 first:pt-0">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-1 max-w-[56ch] text-sm leading-5 text-muted-foreground">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="paths-title" className="border-t border-border py-12 md:py-16">
        <h2 id="paths-title" className={h2}>Dành cho bạn</h2>
        <div className="mt-6 grid overflow-hidden rounded-lg border border-border md:grid-cols-4">
          {ROLES.map(({ title, copy, action, href }, i) => (
            <article key={title} className={`flex flex-col p-5 ${i < 3 ? "border-b border-border md:border-b-0 md:border-r" : ""}`}>
              <h3 className="font-medium">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{copy}</p>
              <div className="mt-auto pt-4"><Link href={href} className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-4 hover:underline md:min-h-8">{action}</Link></div>
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Bắt đầu" className="border-t border-border py-10 md:py-14">
        <div className="flex flex-col justify-between gap-x-8 gap-y-6 md:flex-row md:items-center">
          <h2 className={h2}>Chọn điều lành, hiểu rõ điều mình chọn</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/products" className={cta}>Xem sản phẩm</Link>
            <Link href="/register" className={ctaSecondary}>Đăng ký ngay</Link>
          </div>
        </div>
      </section>
    </>
  );
}
