import type { Route } from "next";
import Link from "next/link";

type StepId = "plans" | "orders" | "qc";

const steps: Array<{ id: StepId; label: string; subtitle: string; href: Route }> = [
  { id: "plans", label: "Bước 1 · Thực đơn & kế hoạch", subtitle: "Công bố định mức & bàn giao lệnh", href: "/production/food-plans" },
  { id: "orders", label: "Bước 2 · Lệnh sản xuất & chế biến", subtitle: "Tiếp nhận, cấp nguyên liệu, nấu & đóng gói", href: "/production/orders" },
  { id: "qc", label: "Bước 3 · Kiểm định QC thành phẩm", subtitle: "Nghiệm thu cảm quan, -18°C & lên kệ", href: "/production/qc" },
];

export function ExecutionFlowBar({ current }: { current: "orders" | "qc" }) {
  return (
    <nav aria-label="Luồng điều hành chế biến và kiểm định" className="mb-6 grid gap-2 md:grid-cols-3">
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
