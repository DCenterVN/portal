import type { Route } from "next";
import Link from "next/link";

type StepId = "receipts" | "inbound-qc" | "transfers" | "shelves";

const steps: Array<{ id: StepId; label: string; subtitle: string; href: Route }> = [
  { id: "receipts", label: "Bước 1 · Nhập hàng", subtitle: "Lập phiếu & nhận hàng thực tế", href: "/inventory/goods-receipts" },
  { id: "inbound-qc", label: "Bước 2 · Kiểm đầu vào", subtitle: "Duyệt lô nguyên liệu & gán vị trí", href: "/inventory/inbound-qc" },
  { id: "transfers", label: "Bước 3 · Chuyển hàng", subtitle: "Điều phối hàng giữa bếp & chi nhánh", href: "/inventory/stock-transfers" },
  { id: "shelves", label: "Bước 4 · Kệ hàng & QR", subtitle: "Xếp kệ bán & sinh tem truy xuất", href: "/inventory/shelves" },
];

export function InventoryFlowBar({ current }: { current: StepId }) {
  return (
    <nav aria-label="Luồng vận hành kho" className="mb-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
