"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityPicker } from "@/components/ui/entity-picker";
import { MaterialPicker } from "./material-picker";
import { getDraftProducts, type DraftProduct } from "@/lib/api/sales";
import { createFoodPlan, getFoodPlan, getFoodPlans, getTargets, getMaterialRequirements, getProductionContext, updateFoodPlan, publishFoodPlan, resumeFoodPlanHandoff, reviewFoodPlan, type FoodProductPlan, type ProductionTarget, type PreparationPlanInput } from "@/lib/api/production";

type ComponentLine = PreparationPlanInput["components"][number] & { name: string };
const message = (e: unknown) => e instanceof Error ? e.message : "Không tải được dữ liệu";
const positive = (s: string) => /^\d+(\.\d{1,3})?$/.test(s) && /[1-9]/.test(s);

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const [plans, setPlans] = useState(initialPlans);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [targets, setTargets] = useState<ProductionTarget[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FoodProductPlan | null>(null);
  const [productRef, setProductRef] = useState("");
  const [code, setCode] = useState("");
  const [servingSize, setServingSize] = useState("");
  const [kits, setKits] = useState("1");
  const [servings, setServings] = useState("4");
  const [components, setComponents] = useState<ComponentLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    setBusy(true); setError("");
    try {
      const context = await getProductionContext(); setPermissions(context.permissions ?? []);
      const [allTargets, allProducts] = await Promise.all([getTargets(), getDraftProducts()]);
      setTargets(allTargets); setProducts(allProducts);
      if (targetId) setPlans(await getFoodPlans(targetId));
      setReady(true);
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, [targetId]);
  const canCreate = permissions.includes("production:food_plan:create");
  const canUpdate = permissions.includes("production:food_plan:update");
  const target = targets.find(t => t.id === targetId);
  const availableProducts = products.filter(p => target?.lines.some(line => line.product_ref === p.id));
  const validCounts = /^[1-9]\d*$/.test(kits) && /^[1-9]\d*$/.test(servings);
  const total = validCounts ? (BigInt(kits) * BigInt(servings)).toString() : "";
  const valid = !!total && BigInt(total) <= 1000000n && !!productRef && !!code.trim() && !!servingSize.trim() && components.length > 0 && components.length <= 100 && components.every(c => positive(c.quantity));
  const begin = async (plan?: FoodProductPlan) => {
    setError(""); setNotice(""); setBusy(true);
    try {
      const current = plan ? await getFoodPlan(plan.id) : null;
      const requirements = current ? await getMaterialRequirements("food-plans", current.id) : null;
      setEditing(current); setProductRef(current?.product_ref ?? availableProducts[0]?.id ?? "");
      setCode(current?.variant_sku_code ?? ""); setServingSize(current?.serving_size ?? "");
      const count = current?.servings_per_set ?? 4;
      setServings(String(count));
      setKits(current ? (BigInt(String(current.planned_quantity).replace(/\.0+$/, "")) / BigInt(count)).toString() : "1");
      setComponents(current?.components.map(c => ({ ...c, quantity: String(c.quantity), name: requirements?.all_lines.find(row => row.sku_ref === c.sku_ref)?.name ?? "Nguyên liệu đã chọn" })) ?? []);
      setShowForm(true);
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!targetId || !valid || (editing ? !canUpdate : !canCreate)) return;
    setBusy(true); setError("");
    const input: PreparationPlanInput = { product_ref: productRef, variant_sku_code: code.trim(), planned_quantity: total, uom: "EA", serving_size: servingSize, servings_per_set: Number(servings), components: components.map(({ sku_ref, quantity, uom }) => ({ sku_ref, quantity, uom })), nutrition_snapshot: editing?.nutrition_snapshot ?? {} };
    try {
      const revision = editing?.revision;
      if (editing && !revision) throw new Error("Thiếu revision. Tải lại set trước khi sửa.");
      const saved = editing ? await updateFoodPlan(editing.id, { ...input, expected_revision: revision ?? 0 }) : await createFoodPlan(targetId, input);
      setPlans(current => [saved, ...current.filter(p => p.id !== saved.id)]); setShowForm(false); setNotice("Đã lưu set");
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  const legacyAction = async (plan: FoodProductPlan) => {
    setBusy(true); setError("");
    try {
      const updated = plan.status === "DRAFT" ? await reviewFoodPlan(plan.id) : plan.status === "REVIEWED" ? (await publishFoodPlan(plan.id)).food_plan : (await resumeFoodPlanHandoff(plan.id)).food_plan;
      setPlans(current => current.map(p => p.id === updated.id ? updated : p));
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  return <PageShell>
    <PageHeader title="Set và định mức" description="Một kit gồm nhiều suất. Định mức là lượng nguyên liệu cho một suất; lưu set chưa xuất bản BOM."
      actions={canCreate && targetId ? <Button disabled={busy} onClick={() => void begin()}>Tạo set</Button> : undefined} />
    {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load()}>Thử lại</Button></div>}
    {notice && <p role="status">{notice}</p>}
    {busy && <p role="status">Đang tải hoặc lưu set…</p>}
    {!targetId && <Card><CardContent><p>Chọn chỉ tiêu để xem và lập set.</p><ul>{targets.map(t => <li key={t.id}><Link href={`/production/food-plans?target_id=${encodeURIComponent(t.id)}`}>{t.title}</Link></li>)}</ul><Link href="/production/targets">Danh sách chỉ tiêu</Link></CardContent></Card>}
    {showForm && (editing ? canUpdate : canCreate) && <Card><CardContent className="space-y-4 pt-6">
      <form onSubmit={save} className="space-y-4" aria-label={editing ? "Sửa set" : "Tạo set"}>
        {editing ? <p>Sản phẩm: {products.find(p => p.id === editing.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}. Sản phẩm, mã set và khẩu phần giữ nguyên khi sửa định mức.</p> : <EntityPicker name="product_ref" label="Sản phẩm thuộc chỉ tiêu" value={productRef || null} onChange={id => setProductRef(id ?? "")} items={availableProducts} status={ready ? "ready" : "loading"} getId={p => p.id} getLabel={p => p.name} />}
        <div className="grid gap-3 md:grid-cols-2">
          <label>Mã set<Input value={code} readOnly={!!editing} required onChange={e => setCode(e.target.value)} /></label>
          <label>Khẩu phần<Input value={servingSize} readOnly={!!editing} required onChange={e => setServingSize(e.target.value)} /></label>
          <label>Số kit<Input inputMode="numeric" value={kits} pattern="[1-9][0-9]*" required onChange={e => setKits(e.target.value)} /></label>
          <label>Số suất mỗi kit<Input inputMode="numeric" value={servings} pattern="[1-9][0-9]*" required onChange={e => setServings(e.target.value)} /></label>
        </div>
        <p>Tổng suất: {total || "Chưa hợp lệ"} EA. Tối đa 1.000.000 suất.</p>
        {components.map((c, i) => <div key={c.sku_ref} className="grid gap-3 md:grid-cols-4"><p>{c.name}</p>
          <label>Định lượng {i + 1}<Input value={c.quantity} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,3})?" required onChange={e => setComponents(current => current.map((row, index) => index === i ? { ...row, quantity: e.target.value } : row))} /></label>
          <label>Đơn vị {i + 1}<Select value={c.uom} onChange={e => setComponents(current => current.map((row, index) => index === i ? { ...row, uom: e.target.value } : row))}>{(c.uom === "KG" || c.uom === "G" ? ["KG", "G"] : c.uom === "L" || c.uom === "ML" ? ["L", "ML"] : ["EA"]).map(unit => <option key={unit}>{unit}</option>)}</Select></label>
          <Button type="button" variant="outline" onClick={() => setComponents(current => current.filter((_, index) => index !== i))}>Bỏ nguyên liệu {i + 1}</Button>
        </div>)}
        <p>Nhập lượng dương, tối đa 3 số lẻ theo đơn vị đã chọn.</p>
        <div className="flex gap-3"><Button type="submit" disabled={busy || !valid}>{busy ? "Đang lưu…" : "Lưu set"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button></div>
      </form>
      <MaterialPicker onSelect={m => setComponents(current => current.some(c => c.sku_ref === m.id) ? current : [...current, { sku_ref: m.id, name: m.name, quantity: "0.200", uom: m.uom_code }])} />
    </CardContent></Card>}
    {targetId && <Card><CardContent aria-busy={busy} className="p-0"><Table><TableHeader><TableRow><TableHead>Mã kế hoạch</TableHead><TableHead>Set</TableHead><TableHead>Tổng suất</TableHead><TableHead>Revision</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {!plans.length && <TableRow><TableCell colSpan={5}>Chưa có set trong chỉ tiêu này.</TableCell></TableRow>}
      {plans.map(plan => <TableRow key={plan.id}><TableCell>{plan.plan_code}</TableCell><TableCell>{plan.variant_sku_code}</TableCell><TableCell>{plan.planned_quantity} {plan.uom}</TableCell><TableCell>{plan.revision ?? ""}</TableCell><TableCell>
        {plan.purpose === "PREPARATION" && canUpdate && <Button variant="outline" disabled={busy} onClick={() => void begin(plan)}>Sửa set</Button>}
        {plan.purpose !== "PREPARATION" && canUpdate && ["DRAFT", "REVIEWED", "WAITING_PRICE_APPROVAL"].includes(plan.status) && <Button disabled={busy} variant="outline" onClick={() => void legacyAction(plan)}>{plan.status === "DRAFT" ? "Thẩm định" : plan.status === "REVIEWED" ? "Publish BOM" : "Kiểm tra & handoff"}</Button>}
        {permissions.includes("production:material_requirement:read") && plan.purpose === "PREPARATION" && <Link href={`/production/material-requirements?food_plan_id=${encodeURIComponent(plan.id)}`}>Xem nhu cầu</Link>}
      </TableCell></TableRow>)}
    </TableBody></Table></CardContent></Card>}
  </PageShell>;
}
