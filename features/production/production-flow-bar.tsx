import type { Route } from "next";
import Link from "next/link";

type StepId = "targets" | "plans" | "requirements";

export function ProductionFlowBar({ current, targetId, foodPlanId }: { current: StepId; targetId?: string; foodPlanId?: string }) {
  const plansHref = `/production/food-plans${targetId ? `?target_id=${encodeURIComponent(targetId)}` : ""}` as Route;
  const requirementsHref = `/production/material-requirements${foodPlanId ? `?food_plan_id=${encodeURIComponent(foodPlanId)}` : targetId ? `?target_id=${encodeURIComponent(targetId)}` : ""}` as Route;

  const steps: Array<{ id: StepId; step: string; title: string; subtitle: string; href: Route }> = [
    { id: "targets", step: "Bước 1", title: "Chỉ tiêu sản xuất", subtitle: "Chốt món & số suất theo kỳ", href: "/production/targets" },
    { id: "plans", step: "Bước 2", title: "Thực đơn & kế hoạch", subtitle: "Định mức khẩu phần & lệnh nấu", href: plansHref },
    { id: "requirements", step: "Bước 3", title: "Nhu cầu nguyên liệu", subtitle: "Tổng hợp nguyên liệu & giá", href: requirementsHref },
  ];

  return (
    <nav aria-label="Luồng lập kế hoạch sản xuất" className="mb-6 grid gap-2 md:grid-cols-3">
      {steps.map((item) => {
        const active = item.id === current;
        const content = (
          <>
            <div className="flex items-center justify-between gap-2">
              <span className={active ? "text-xs font-semibold text-primary" : "text-xs font-medium text-muted-foreground"}>
                {item.step} · {item.title}
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
