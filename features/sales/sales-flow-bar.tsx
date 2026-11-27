import type { Route } from "next";
import Link from "next/link";

type StepId = "pricing" | "products" | "orders";

const steps: Array<{ id: StepId; label: string; subtitle: string; href: Route }> = [
  { id: "pricing", label: "Bước 1 · Giá sàn & bảng giá", subtitle: "Tính giá vốn từ công thức & duyệt giá bán", href: "/sales/pricing" },
  { id: "products", label: "Bước 2 · Sản phẩm & mở bán", subtitle: "Kích hoạt món đã duyệt giá lên cửa hàng", href: "/sales/products" },
  { id: "orders", label: "Bước 3 · Đơn hàng & giao nhận", subtitle: "Xác nhận đơn khách đặt & điều phối giao", href: "/sales/orders" },
];

export function SalesFlowBar({ current }: { current: StepId }) {
  return (
    <nav aria-label="Luồng định giá, mở bán và đơn hàng" className="mb-6 grid gap-2 md:grid-cols-3">
      {steps.map((item) => {
        const active = item.id === current;
        const content = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className={active ? "text-xs font-semibold text-primary" : "text-xs font-medium text-muted-foreground"}>
                {item.label}
              </span>
              {active && <span className="text-xs font-medium text-primary">Đang xem</span>}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{item.subtitle}</p>
          </>
        );
        if (active) {
          return (
            <div key={item.id} aria-current="step" className="rounded-lg border border-primary/40 border-l-[3px] border-l-primary bg-muted/40 px-3.5 py-2.5">
              {content}
            </div>
          );
        }
        return (
          <Link key={item.id} href={item.href} className="group rounded-lg border border-border bg-card px-3.5 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
