import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, BadgeCheck, Building2, Check, ChefHat, ClipboardCheck, Leaf, MapPin, PackageCheck, QrCode, ShieldCheck, ShoppingBasket, Snowflake, Sprout, ThermometerSnowflake, Truck, Users } from "lucide-react";

export const revalidate = 3600;

const trustItems = [
  { value: "−18°C", label: "Chuỗi lạnh giám sát liên tục", icon: Snowflake },
  { value: "4 lớp", label: "Kiểm soát chất lượng", icon: ShieldCheck },
  { value: "100%", label: "Lô hàng có thể truy xuất", icon: QrCode },
  { value: "3 miền", label: "Mạng lưới kho vận", icon: MapPin },
];
const traceSteps = [
  { eyebrow: "01 · Vùng trồng", title: "Hồ sơ nguồn gốc", copy: "Nhà cung cấp, chứng nhận và ngày thu hoạch được gắn vào từng lô.", icon: Sprout },
  { eyebrow: "02 · Kiểm định", title: "QC trước nhập kho", copy: "Cảm quan, nhiệt độ, hạn dùng và hồ sơ được đối chiếu tại điểm nhận.", icon: ClipboardCheck },
  { eyebrow: "03 · Bảo quản", title: "Dữ liệu chuỗi lạnh", copy: "Nhiệt độ kho và hành trình vận chuyển được ghi nhận xuyên suốt.", icon: ThermometerSnowflake },
  { eyebrow: "04 · Giao nhận", title: "Xác nhận đến tay", copy: "Mỗi lần bàn giao khép lại một hành trình có thể kiểm chứng.", icon: PackageCheck },
];
const rolePaths = [
  { title: "Gia đình", copy: "Chọn thực phẩm rõ nguồn gốc cho bữa ăn mỗi ngày.", action: "Mua sản phẩm", href: "/products", icon: ShoppingBasket },
  { title: "Bếp ăn & nhà hàng", copy: "Nguồn cung ổn định, quy cách rõ ràng và giao hàng theo lịch.", action: "Tạo tài khoản", href: "/register", icon: ChefHat },
  { title: "Nhà cung cấp", copy: "Đồng hành bằng hồ sơ chuẩn hóa và quy trình kiểm định minh bạch.", action: "Đăng ký hợp tác", href: "/register", icon: Truck },
  { title: "Đội ngũ vận hành", copy: "Quản lý chi nhánh, tồn kho và quyền truy cập trong một hệ thống.", action: "Đăng nhập", href: "/login", icon: Users },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <section className="landing-hero" aria-labelledby="hero-title">
        <div className="landing-shell landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-kicker"><Leaf aria-hidden="true" /> Thực phẩm có hành trình rõ ràng</p>
            <h1 id="hero-title">Tươi là một cảm giác.<br /><em>Sạch là điều kiểm chứng được.</em></h1>
            <p className="landing-lead">Việt Sạch kết nối nông trại, kho lạnh và bàn ăn bằng một chuỗi cung ứng minh bạch — để mỗi lựa chọn ngon lành cũng là một lựa chọn an tâm.</p>
            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" href={"/products" as Route}>Khám phá sản phẩm <ArrowRight aria-hidden="true" /></Link>
              <Link className="landing-button landing-button-secondary" href={"/register" as Route}>Tạo tài khoản</Link>
            </div>
            <p className="landing-login">Đã là thành viên? <Link href={"/login" as Route}>Đăng nhập vào hệ thống</Link></p>
          </div>
          <div className="landing-hero-visual" aria-label="Rau củ tươi được tuyển chọn tại Việt Sạch">
            <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=85" alt="Gian rau củ tươi đầy màu sắc" />
            <div className="landing-lot-card"><span><BadgeCheck aria-hidden="true" /> Lô VS–240831</span><strong>Đã kiểm định đầu vào</strong><small>Đà Lạt · Thu hoạch 05:30 hôm nay</small></div>
            <div className="landing-temperature"><Snowflake aria-hidden="true" /><span><strong>4.2°C</strong>Nhiệt độ bảo quản</span></div>
          </div>
        </div>
      </section>

      <section className="landing-trust" aria-label="Cam kết của Việt Sạch"><div className="landing-shell landing-trust-grid">
        {trustItems.map(({ value, label, icon: Icon }) => <div className="landing-trust-item" key={label}><Icon aria-hidden="true" /><p><strong>{value}</strong><span>{label}</span></p></div>)}
      </div></section>

      <section className="landing-section" aria-labelledby="products-title"><div className="landing-shell">
        <header className="landing-section-heading"><div><p className="landing-eyebrow">Từ mùa vụ hôm nay</p><h2 id="products-title">Sản phẩm được chọn bằng tiêu chuẩn,<br />không chỉ bằng vẻ ngoài.</h2></div><Link href={"/products" as Route}>Xem toàn bộ sản phẩm <ArrowRight aria-hidden="true" /></Link></header>
        <div className="landing-product-grid">
          <Link href={"/products" as Route} className="landing-product landing-product-featured"><img src="https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=1200&q=85" alt="Cà chua chín tươi trên cành" /><span className="landing-product-label"><small>Đà Lạt · VietGAP</small><strong>Rau củ theo mùa</strong><em>Mở bộ sưu tập <ArrowRight aria-hidden="true" /></em></span></Link>
          <Link href={"/products" as Route} className="landing-product"><img src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=900&q=85" alt="Cá hồi tươi trên thớt" /><span className="landing-product-label"><small>Chuỗi lạnh −18°C</small><strong>Hải sản tuyển chọn</strong></span></Link>
          <Link href={"/products" as Route} className="landing-product"><img src="https://images.unsplash.com/photo-1603048297172-c92544798d5a?auto=format&fit=crop&w=900&q=85" alt="Thịt bò tươi được cắt lát" /><span className="landing-product-label"><small>Kiểm soát theo lô</small><strong>Thịt mát cao cấp</strong></span></Link>
        </div>
      </div></section>

      <section className="landing-trace" id="truy-xuat" aria-labelledby="trace-title"><div className="landing-shell landing-trace-grid">
        <div className="landing-trace-intro"><p className="landing-eyebrow">Một lô hàng · Bốn dấu mốc</p><h2 id="trace-title">Theo dấu thực phẩm,<br />từ nơi bắt đầu.</h2><p>Thông tin không dừng ở một chiếc tem. Mỗi lô hàng là một hồ sơ nối tiếp từ nguồn cung đến điểm giao nhận.</p><Link className="landing-button landing-button-primary" href={"/products" as Route}>Tra cứu sản phẩm <QrCode aria-hidden="true" /></Link></div>
        <ol className="landing-timeline">{traceSteps.map(({ eyebrow, title, copy, icon: Icon }) => <li key={title}><span className="landing-step-icon"><Icon aria-hidden="true" /></span><div><small>{eyebrow}</small><h3>{title}</h3><p>{copy}</p></div><Check aria-hidden="true" className="landing-step-check" /></li>)}</ol>
      </div></section>

      <section className="landing-section" aria-labelledby="paths-title"><div className="landing-shell">
        <header className="landing-section-heading landing-section-heading-centered"><div><p className="landing-eyebrow">Việt Sạch dành cho bạn</p><h2 id="paths-title">Một hệ sinh thái, nhiều cách đồng hành.</h2></div></header>
        <div className="landing-role-grid">{rolePaths.map(({ title, copy, action, href, icon: Icon }) => <article key={title} className="landing-role-card"><Icon aria-hidden="true" /><h3>{title}</h3><p>{copy}</p><Link href={href as Route}>{action} <ArrowRight aria-hidden="true" /></Link></article>)}</div>
      </div></section>

      <section className="landing-final-cta"><div className="landing-shell landing-final-inner"><div><p className="landing-eyebrow">Bắt đầu từ bữa ăn kế tiếp</p><h2>Chọn điều lành,<br />hiểu rõ điều mình chọn.</h2></div><div className="landing-actions"><Link className="landing-button landing-button-light" href={"/products" as Route}>Xem sản phẩm <ArrowRight aria-hidden="true" /></Link><Link className="landing-button landing-button-outline-light" href={"/register" as Route}>Đăng ký ngay</Link></div></div></section>

      <footer className="landing-footer"><div className="landing-shell landing-footer-grid">
        <div className="landing-footer-brand"><span><Leaf aria-hidden="true" /> Việt Sạch</span><p>Nông sản tử tế. Chuỗi lạnh minh bạch.<br />Một nền tảng cho niềm tin dài lâu.</p></div>
        <nav aria-label="Liên kết mua sắm"><strong>Khám phá</strong><Link href={"/products" as Route}>Sản phẩm</Link><a href="#truy-xuat">Truy xuất nguồn gốc</a><Link href={"/register" as Route}>Tạo tài khoản</Link></nav>
        <nav aria-label="Liên kết hệ thống"><strong>Hệ thống</strong><Link href={"/login" as Route}>Đăng nhập</Link><Link href={"/branches" as Route}>Chi nhánh</Link><Link href={"/memberships" as Route}>Đội ngũ</Link></nav>
        <div><strong>Cam kết</strong><p><Building2 aria-hidden="true" /> Vận hành tại Việt Nam</p><p><ShieldCheck aria-hidden="true" /> Bảo vệ dữ liệu người dùng</p></div>
      </div><div className="landing-shell landing-copyright"><span>© 2026 Việt Sạch</span><span>Nuôi dưỡng niềm tin từ nguồn.</span></div></footer>
    </main>
  );
}
