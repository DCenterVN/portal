import { redirect } from "next/navigation";
import { Leaf, CookingPot, ClipboardCheck } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";
import { TraceLookup } from "@/features/traceability/trace-lookup";

export const metadata = { title: `Truy xuất nguồn gốc — ${BRAND_NAME}` };

const steps = [
  { title: "Nguyên liệu", detail: "Nguồn cung và lô nguyên liệu", icon: Leaf },
  { title: "Bếp sản xuất", detail: "Các bước chế biến món ăn", icon: CookingPot },
  { title: "Kiểm tra chất lượng", detail: "Kết quả kiểm định thành phẩm", icon: ClipboardCheck },
];

export default async function TraceabilityLookupPage({ searchParams }: { searchParams: Promise<{ code?: string | string[] }> }) {
  const query = await searchParams;
  const code = (Array.isArray(query.code) ? query.code[0] : query.code)?.trim();
  if (code) redirect(`/traceability/${encodeURIComponent(code)}`);
  return <div className="mx-auto max-w-4xl py-12 md:py-20">
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-primary">Từ nguyên liệu đến hộp món</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Truy xuất nguồn gốc</h1>
      <p className="mt-4 text-base leading-7 text-muted-foreground">Xem nguồn nguyên liệu, hành trình sản xuất và kết quả kiểm tra chất lượng của món ăn bạn chọn.</p>
      <TraceLookup />
    </div>
    <section aria-labelledby="trace-journey" className="mt-14 md:mt-20">
      <h2 id="trace-journey" className="text-lg font-semibold">Một mã, cả hành trình</h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {steps.map(({ title, detail, icon: Icon }, index) => <li key={title} className="rounded-lg bg-muted/40 p-5">
          <div className="flex items-center justify-between text-primary"><Icon className="size-5" aria-hidden="true" /><span className="text-xs font-medium tabular-nums">0{index + 1}</span></div>
          <h3 className="mt-5 text-base font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
        </li>)}
      </ol>
    </section>
  </div>;
}
