import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { test, vi } from "vitest";
import { Package, ShoppingCart, Users, Warehouse } from "lucide-react";

vi.mock("next/navigation", () => ({ usePathname: () => "/inventory" }));

import { Button } from "@/components/ui/button";
import { StoreShell } from "@/components/layout/store-shell";
import { ConsoleShell } from "@/components/layout/console-shell";
import { AuthShell } from "@/components/layout/auth-shell";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { STORE_FOOTER, STORE_NAV } from "@/mocks/store";

const variants = ["default", "accent", "secondary", "outline", "ghost", "destructive", "link"] as const;
const sizes = ["sm", "default", "lg"] as const;

function Buttons() {
  return (
    <div className="space-y-3">
      {sizes.map((s) => (
        <div key={s} className="flex flex-wrap items-center gap-3">
          <span className="w-16 text-xs text-[var(--muted-foreground)]">{s}</span>
          {variants.map((v) => (
            <Button key={v} variant={v} size={s}>{v}</Button>
          ))}
          <Button size={s} disabled>disabled</Button>
        </div>
      ))}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <h3 className="mb-2 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10">
      <h2 className="preview-label">{title}</h2>
      <div className="preview-frame">{children}</div>
    </section>
  );
}

test("render kit preview", () => {
  const previewCollapsed = process.env.PREVIEW_WIDTH === "390";
  const store = (
    <StoreShell nav={STORE_NAV} user={null} cartHref="/cart" loginHref="/login" footer={STORE_FOOTER}>
      <div className="py-10 space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-[var(--primary)]">Nông sản sạch mỗi ngày</h1>
        <p className="max-w-xl text-[var(--muted-foreground)]">Nội dung trang chủ minh hoạ bên trong StoreShell.</p>
        <div className="flex gap-3"><Button>Mua ngay</Button><Button variant="secondary">Xem sản phẩm</Button></div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Rau hữu cơ">Card sản phẩm mẫu</Card>
          <Card title="Trái cây">Card sản phẩm mẫu</Card>
          <Card title="Thịt sạch">Card sản phẩm mẫu</Card>
        </div>
      </div>
    </StoreShell>
  );
  const consoleEl = (
    <ConsoleShell
      nav={[
        { title: "Vận hành", items: [
          { href: "/inventory", label: "Kho", match: "/inventory", icon: Warehouse },
          { href: "/products", label: "Sản phẩm", match: "/products", icon: Package },
          { href: "/sales", label: "Bán hàng", match: "/sales", icon: ShoppingCart },
        ] },
        { title: "Tổ chức", items: [{ href: "/memberships", label: "Nhân sự", match: "/memberships", icon: Users }] },
      ]}
      context={{ label: "Chi nhánh mẫu", sublabel: "Tổ chức mẫu" }}
      user={{ name: "Người dùng mẫu", detail: "Nhân viên kho" }}
      statusText="Đã đồng bộ"
      actions={<Button size="sm">Tạo phiếu</Button>}
      defaultCollapsed={previewCollapsed}
    >
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Kho</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Tồn kho">1.240 mục</Card>
          <Card title="Sắp hết hạn">12 lô</Card>
          <Card title="Chờ QC">3 phiếu</Card>
        </div>
        <div className="flex gap-3"><Button>Lưu</Button><Button variant="outline">Huỷ</Button><Button variant="ghost">Bỏ qua</Button></div>
      </div>
    </ConsoleShell>
  );
  const platformEl = (
    <ConsoleShell
      nav={[{ title: "Nền tảng", items: [
        { href: "/platform/companies", label: "Công ty", match: "/platform/companies", icon: Package },
        { href: "/platform/staff", label: "Nhân sự", match: "/platform/staff", icon: Users },
      ] }]}
      context={{ label: "Nền tảng" }}
      user={{ name: "Platform Admin", detail: "Quản trị hệ thống" }}
      statusText="Đã đồng bộ"
      defaultCollapsed={previewCollapsed}
    >
      <div className="space-y-4 p-6">
        <h1 className="text-xl font-semibold">Không gian nền tảng</h1>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Công ty">24 đang hoạt động</Card>
          <Card title="Nhân sự">8 quản trị viên</Card>
          <Card title="Audit">Không có cảnh báo</Card>
        </div>
      </div>
    </ConsoleShell>
  );
  const auth = (
    <AuthShell legalText="© Việt Sạch">
      <AuthHeading title="Đăng nhập" subtitle="Dùng email đã đăng ký" />
      <div className="mt-6 space-y-3">
        <input className="w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--input)] bg-[var(--surface)] px-3" placeholder="Email" />
        <input className="w-full min-h-11 rounded-[var(--radius-md)] border border-[var(--input)] bg-[var(--surface)] px-3" placeholder="Mật khẩu" type="password" />
        <Button className="w-full">Đăng nhập</Button>
        <Button variant="link" className="w-full">Quên mật khẩu?</Button>
      </div>
    </AuthShell>
  );
  const role = process.env.PREVIEW_ROLE ?? "customer";
  const theme = process.env.PREVIEW_THEME ?? "light";
  const selected = role === "employee" ? consoleEl : role === "platform" ? platformEl : store;
  const markup = renderToStaticMarkup(selected);
  writeFileSync(process.env.PREVIEW_OUT!, `<!doctype html>
    <html lang="vi" class="${theme === "dark" ? "dark" : ""}">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="stylesheet" href="http://localhost:3000/_next/static/chunks/%5Broot-of-the-server%5D__0n5r116._.css" />
        <title>${role} ${theme}</title>
      </head>
      <body class="min-h-screen bg-[var(--background)] text-[var(--foreground)]">${markup}</body>
    </html>`);
});
