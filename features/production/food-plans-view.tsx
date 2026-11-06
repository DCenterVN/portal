"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import type { FoodProductPlan } from "@/lib/api/production";
import { DishesContainer } from "./dishes/dishes-container";
import { FoodSetsView } from "./food-sets-view";
import { PackagesView } from "./packages-view";
import { MaterialRequirementsView } from "./material-requirements-view";
import { FoodPlanForm } from "./food-plan-form";
import { FoodPlansTable } from "./food-plans-table";
import { useFoodPlans } from "./use-food-plans";

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const s = useFoodPlans(initialPlans, targetId);
  return <PageShell>
    <PageHeading title="Thực đơn và định mức" description="Một kit gồm nhiều suất. Định mức là lượng nguyên liệu cho một suất; lưu set chưa xuất bản BOM."
      actions={s.canCreate && targetId ? <Button disabled={s.busy} onClick={() => void s.begin()}>Tạo set</Button> : undefined} />
    {s.error && <InlineAlert>{s.error} <Button variant="outline" onClick={() => void s.load()}>Thử lại</Button></InlineAlert>}
    {s.notice && <p role="status">{s.notice}</p>}
    {s.busy && (!targetId || s.plans.length > 0) && <LoadingState title="Đang tải hoặc lưu set…" />}
    {!targetId && <Card><CardContent>{s.ready && !s.error && s.targets.length === 0 ? <EmptyState title="Chưa có chỉ tiêu" description="Tạo chỉ tiêu sản xuất trước khi lập set." /> : <><p>Chọn chỉ tiêu để xem và lập set.</p><ul>{s.targets.map(t => <li key={t.id}><Link href={`/production/food-plans?target_id=${encodeURIComponent(t.id)}`}>{t.title}</Link></li>)}</ul></>}<Link href="/production/targets">Danh sách chỉ tiêu</Link></CardContent></Card>}
    <FoodPlanForm s={s} />
    {targetId && <FoodPlansTable s={s} />}
  </PageShell>;
}

export function FoodPackWorkspace({ targetId, tab: initialTab, mon, mode, draft }: { targetId?: string; tab?: string; mon?: string; mode?: string; draft?: string }) {
  const router = useRouter();
  const tab = initialTab || "dishes";
  // Tabs hold unsaved form drafts, so a visited tab stays mounted (hidden); tabs never opened are not mounted or fetched.
  const [visited, setVisited] = useState(() => new Set([tab]));
  const seen = visited.has(tab) ? visited : new Set(visited).add(tab);
  if (seen !== visited) setVisited(seen);
  return <div className="space-y-6"><Tabs value={tab} onValueChange={next => { const query = new URLSearchParams({ tab: String(next) }); if (targetId) query.set("target_id", targetId); router.push(`/production/food-plans?${query}`); }}>
    <TabsList aria-label="Thiết kế món và thực đơn"><TabsTrigger value="dishes">Món</TabsTrigger><TabsTrigger value="sets">Set (nâng cao)</TabsTrigger><TabsTrigger value="packages">Gói + công thức</TabsTrigger><TabsTrigger value="plans">Thực đơn</TabsTrigger></TabsList>
    <TabsContent value={tab}>{tab === "dishes" && <DishesContainer mon={mon} mode={mode} draft={draft} />}
    {seen.has("sets") && <div hidden={tab !== "sets"}><FoodSetsView /></div>}{seen.has("packages") && <div hidden={tab !== "packages"}><PackagesView /></div>}{seen.has("plans") && <div hidden={tab !== "plans"}><FoodPlansView initialPlans={[]} targetId={targetId} /></div>}</TabsContent>
  </Tabs>{tab !== "dishes" && <MaterialRequirementsView targetId={targetId} />}</div>;
}
