"use client";

import { z } from "zod";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EntityPicker } from "@/components/ui/entity-picker";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { FoodSetsView, FOOD_SLOTS, isStale, loadPackOptions } from "./food-sets-view";
import { PackagesView } from "./packages-view";
import { MaterialRequirementsView } from "./material-requirements-view";
import { EmptyState, Skeleton } from "@/components/ui/state";
import { MaterialPicker } from "./material-picker";
import { getDraftProducts, listFoodSets, getFoodSet, type FoodSet, type FoodPackage, type DraftProduct } from "@/lib/api/sales";
import { createFoodPlan, getFoodPlan, getFoodPlans, getTargets, getMaterialRequirements, getProductionContext, updateFoodPlan, publishFoodPlan, resumeFoodPlanHandoff, reviewFoodPlan, type FoodProductPlan, type ProductionTarget, type PreparationPlanInput, type PackPlanInput } from "@/lib/api/production";

type ComponentLine = NonNullable<PreparationPlanInput["components"]>[number] & { name: string };
const message = (e: unknown) => e instanceof Error ? e.message : "Không tải được dữ liệu";
const variantLabel = (value: string) => /^VAR-[0-9a-f]{8}-/i.test(value) ? "—" : value;
const positive = (s: string) => /^\d+(\.\d{1,3})?$/.test(s) && /[1-9]/.test(s);

export function FoodPlansView({ initialPlans, targetId }: { initialPlans: FoodProductPlan[]; targetId?: string }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("raw");
  const [sets, setSets] = useState<FoodSet[]>([]);
  const [packs, setPacks] = useState<FoodPackage[]>([]);
  const [chosenSet, setChosenSet] = useState<FoodSet | null>(null);
  const [ratios, setRatios] = useState<Record<string, string>>({});
  const [setCursor, setSetCursor] = useState<string | null>(null);
  const [setQuery, setSetQuery] = useState("");
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
  const [busy, setBusy] = useState(true);
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
  const validRatios = !!chosenSet && chosenSet.slots.length >= 2 && chosenSet.slots.every(slot => ratioTotal(slot.options.map(option => ratios[`${slot.slot}:${option.sku_ref}`] ?? "0").concat(slot.removable ? [ratios[`${slot.slot}:empty`] ?? "0"] : [])) === 1000000n);
  const valid = !!total && BigInt(total) <= 1000000n && !!productRef && !!code.trim() && !!servingSize.trim() && (mode === "pack" ? validRatios : components.length > 0 && components.length <= 100 && components.every(c => positive(c.quantity)));
  const begin = async (plan?: FoodProductPlan) => {
    setError(""); setNotice(""); setBusy(true);
    try {
      const current = plan ? await getFoodPlan(plan.id) : null;
      const requirements = current ? await getMaterialRequirements("food-plans", current.id) : null;
      const pinned = pinnedPlanSchema.parse(current ?? {}).pack_plan;
      setMode(pinned ? "pack" : "raw"); setChosenSet(null); setRatios({});
      if (pinned) {
        const definition = await getFoodSet(pinned.set_ref);
        setSets([definition]);
        if (definition.updated_at !== pinned.set_updated_at) setError("Set đã đổi từ lúc chốt. Chọn lại set trước khi lưu; thực đơn cũ vẫn giữ nguyên.");
        else {
          setChosenSet(definition);
          setRatios(Object.fromEntries(pinned.slot_ratios.flatMap(slot => slot.options.map(option => [`${slot.slot}:${option.sku_ref ?? "empty"}`, ratioPercent(option.ratio)]))));
        }
        setPacks(await loadPackOptions());
      }
      setEditing(current); setProductRef(current?.product_ref ?? availableProducts[0]?.id ?? "");
      setCode(current?.variant_sku_code ?? ""); setServingSize(current?.serving_size ?? "");
      const count = current?.servings_per_set ?? 4;
      setServings(String(count));
      setKits(current ? (BigInt(String(current.planned_quantity).replace(/\.0+$/, "")) / BigInt(count)).toString() : "1");
      setComponents(pinned ? [] : current?.components.map(c => ({ ...c, quantity: String(c.quantity), name: requirements?.all_lines.find(row => row.sku_ref === c.sku_ref)?.name ?? "Nguyên liệu đã chọn" })) ?? []);
      setShowForm(true);
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!targetId || !valid || (editing ? !canUpdate : !canCreate)) return;
    setBusy(true); setError("");
    const common = { product_ref: productRef, variant_sku_code: code.trim(), planned_quantity: total, uom: "EA", serving_size: servingSize, servings_per_set: Number(servings), nutrition_snapshot: editing?.nutrition_snapshot ?? {} };
    const input: PreparationPlanInput = mode === "pack" && chosenSet ? { ...common, pack_plan: {
      schema_version: 1, set_ref: chosenSet.id, set_updated_at: chosenSet.updated_at,
      slot_ratios: chosenSet.slots.map(slot => ({ slot: slot.slot, options: slot.options.map((option): PackPlanInput["slot_ratios"][number]["options"][number] => ({ sku_ref: option.sku_ref, ratio: percentRatio(ratios[`${slot.slot}:${option.sku_ref}`] ?? "0") })).concat(slot.removable ? [{ sku_ref: null, ratio: percentRatio(ratios[`${slot.slot}:empty`] ?? "0") }] : []) })),
    } } : { ...common, components: components.map(({ sku_ref, quantity, uom }) => ({ sku_ref, quantity, uom })) };
    try {
      const revision = editing?.revision;
      if (editing && !revision) throw new Error("Thiếu revision. Tải lại set trước khi sửa.");
      const saved = editing ? await updateFoodPlan(editing.id, { ...input, expected_revision: revision ?? 0 }) : await createFoodPlan(targetId, input);
      setPlans(current => [saved, ...current.filter(p => p.id !== saved.id)]); setShowForm(false); setNotice("Đã lưu set");
    } catch (e) { if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); setShowForm(false); await load(); } else setError(message(e)); }
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
  const chooseSet = async (id: string | null) => {
    if (!id) { setChosenSet(null); return; }
    setBusy(true); setError("");
    try {
      const [definition, options] = await Promise.all([getFoodSet(id), loadPackOptions()]);
      setChosenSet(definition); setPacks(options);
      setRatios(Object.fromEntries(definition.slots.flatMap(slot => slot.options.map(option => [`${slot.slot}:${option.sku_ref}`, option.is_default ? "100" : "0"]))));
    } catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  const loadSets = async (append = false) => {
    setBusy(true); setError("");
    try { const page = await listFoodSets({ q: setQuery, cursor: append ? setCursor ?? undefined : undefined }); setSets(current => append ? [...current, ...page.items] : page.items); setSetCursor(page.next_cursor); }
    catch (e) { setError(message(e)); } finally { setBusy(false); }
  };
  return <PageShell>
    <PageHeader title="Thực đơn và định mức" description="Một kit gồm nhiều suất. Định mức là lượng nguyên liệu cho một suất; lưu set chưa xuất bản BOM."
      actions={canCreate && targetId ? <Button disabled={busy} onClick={() => void begin()}>Tạo set</Button> : undefined} />
    {error && <div role="alert">{error} <Button variant="outline" onClick={() => void load()}>Thử lại</Button></div>}
    {notice && <p role="status">{notice}</p>}
    {busy && (!targetId || plans.length > 0) && <Skeleton title="Đang tải hoặc lưu set…" />}
    {!targetId && <Card><CardContent><p>Chọn chỉ tiêu để xem và lập set.</p><ul>{targets.map(t => <li key={t.id}><Link href={`/production/food-plans?target_id=${encodeURIComponent(t.id)}`}>{t.title}</Link></li>)}</ul><Link href="/production/targets">Danh sách chỉ tiêu</Link></CardContent></Card>}
    {showForm && (editing ? canUpdate : canCreate) && <Card><CardContent className="space-y-4 pt-6">
      <form onSubmit={save} className="space-y-4" aria-label={editing ? "Sửa set" : "Tạo set"}>
        {editing ? <p>Sản phẩm: {products.find(p => p.id === editing.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}. Sản phẩm, mã set và khẩu phần giữ nguyên khi sửa định mức.</p> : <EntityPicker name="product_ref" label="Sản phẩm thuộc chỉ tiêu" value={productRef || null} onChange={id => { setProductRef(id ?? ""); setChosenSet(null); }} items={availableProducts} status={ready ? "ready" : "loading"} getId={p => p.id} getLabel={p => p.name} />}
        <div className="grid gap-3 md:grid-cols-2">
          <label>Mã set<Input value={editing ? variantLabel(code) : code} readOnly={!!editing} required onChange={e => setCode(e.target.value)} /></label>
          <label>Khẩu phần<Input value={servingSize} readOnly={!!editing} required onChange={e => setServingSize(e.target.value)} /></label>
          <label>Số kit<Input inputMode="numeric" value={kits} pattern="[1-9][0-9]*" required onChange={e => setKits(e.target.value)} /></label>
          <label>Số suất mỗi kit<Input inputMode="numeric" value={servings} pattern="[1-9][0-9]*" required onChange={e => setServings(e.target.value)} /></label>
        </div>
        <p>Tổng suất: {total || "Chưa hợp lệ"} EA. Tối đa 1.000.000 suất.</p>
        <label>Nguồn định mức<Select value={mode} onChange={e => { setMode(e.target.value); if (e.target.value === "pack") void loadSets(); }}><option value="raw">Nguyên liệu trực tiếp</option><option value="pack">Theo set và gói</option></Select></label>
        {mode === "pack" && <div className="space-y-4"><div className="flex gap-3"><label className="flex-1">Tìm set món<Input value={setQuery} onChange={e => setSetQuery(e.target.value)} /></label><Button type="button" variant="outline" disabled={busy} onClick={() => void loadSets()}>Tìm set</Button></div>
          <EntityPicker name="plan-food-set" label="Set món trong họ món" items={sets.filter(set => set.product_ref === productRef && set.slots.length >= 2)} status={busy ? "loading" : "ready"} value={chosenSet?.id ?? null} getId={set => set.id} getLabel={set => set.name} onChange={id => void chooseSet(id)} />
          {setCursor && <Button type="button" variant="outline" disabled={busy} onClick={() => void loadSets(true)}>Thêm set từ trang sau</Button>}
          {chosenSet?.slots.map(slot => {
            const values = slot.options.map(option => ratios[`${slot.slot}:${option.sku_ref}`] ?? "0").concat(slot.removable ? [ratios[`${slot.slot}:empty`] ?? "0"] : []);
            const sum = ratioTotal(values);
            return <fieldset key={slot.slot} className="space-y-3 rounded-xl border p-4"><legend>{FOOD_SLOTS.find(item => item.id === slot.slot)?.name}</legend>
              {slot.options.map(option => <label className="block" key={option.sku_ref}>{packs.find(pack => pack.id === option.sku_ref)?.name ?? "Gói đã chọn"} · {option.quantity} EA (%)<Input aria-label={`Tỉ lệ ${FOOD_SLOTS.find(item => item.id === slot.slot)?.name} ${packs.find(pack => pack.id === option.sku_ref)?.name ?? "gói đã chọn"}`} inputMode="decimal" readOnly={!slot.swappable && !slot.removable} value={ratios[`${slot.slot}:${option.sku_ref}`] ?? "0"} onChange={e => setRatios(current => ({ ...current, [`${slot.slot}:${option.sku_ref}`]: e.target.value }))} /></label>)}
              {slot.removable && <label className="block">Để trống ô (%)<Input aria-label={`Tỉ lệ ${FOOD_SLOTS.find(item => item.id === slot.slot)?.name} để trống`} inputMode="decimal" value={ratios[`${slot.slot}:empty`] ?? "0"} onChange={e => setRatios(current => ({ ...current, [`${slot.slot}:empty`]: e.target.value }))} /></label>}
              <p role={sum === 1000000n ? "status" : "alert"}>Tổng {sum === null ? "chưa hợp lệ" : String(Number(sum) / 10000)}% / 100%{sum !== 1000000n && " · Tổng phải bằng 100% từng ô."}</p>
            </fieldset>;
          })}
        </div>}
        {mode === "raw" && components.map((c, i) => <div key={c.sku_ref} className="grid gap-3 md:grid-cols-4"><p>{c.name}</p>
          <label>Định lượng {i + 1}<Input value={c.quantity} inputMode="decimal" pattern="[0-9]+(\.[0-9]{1,3})?" required onChange={e => setComponents(current => current.map((row, index) => index === i ? { ...row, quantity: e.target.value } : row))} /></label>
          <label>Đơn vị {i + 1}<Select value={c.uom} onChange={e => setComponents(current => current.map((row, index) => index === i ? { ...row, uom: e.target.value } : row))}>{(c.uom === "KG" || c.uom === "G" ? ["KG", "G"] : c.uom === "L" || c.uom === "ML" ? ["L", "ML"] : ["EA"]).map(unit => <option key={unit}>{unit}</option>)}</Select></label>
          <Button type="button" variant="outline" onClick={() => setComponents(current => current.filter((_, index) => index !== i))}>Bỏ nguyên liệu {i + 1}</Button>
        </div>)}
        <p>Nhập lượng dương, tối đa 3 số lẻ theo đơn vị đã chọn.</p>
        {!valid && <p role="alert">Chọn họ món, mã, khẩu phần và định mức hợp lệ. Theo set: tổng tỉ lệ mỗi ô phải bằng 100%.</p>}
        <div className="flex gap-3"><Button type="submit" disabled={busy || !valid}>{busy ? "Đang lưu…" : "Lưu set"}</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button></div>
      </form>
      {mode === "raw" && <MaterialPicker onSelect={m => setComponents(current => current.some(c => c.sku_ref === m.id) ? current : [...current, { sku_ref: m.id, name: m.name, quantity: "0.200", uom: m.uom_code }])} />}
    </CardContent></Card>}
    {targetId && <Card><CardContent aria-busy={busy} className="p-0"><Table><TableHeader><TableRow><TableHead>Sản phẩm</TableHead><TableHead>Set</TableHead><TableHead>Tổng suất</TableHead><TableHead>Revision</TableHead><TableHead>Thao tác</TableHead></TableRow></TableHeader><TableBody>
      {!plans.length && <TableRow><TableCell colSpan={5}>{busy ? <Skeleton title="Đang tải set…" /> : ready && !error ? <EmptyState title="Chưa có set trong chỉ tiêu này" description="Tạo set để xác định khẩu phần và định mức nguyên liệu cho chỉ tiêu." action={canCreate ? <Button onClick={() => void begin()}>Tạo set</Button> : undefined} /> : null}</TableCell></TableRow>}
      {plans.map(plan => <TableRow key={plan.id}><TableCell>{products.find(product => product.id === plan.product_ref)?.name ?? "Sản phẩm trong chỉ tiêu"}</TableCell><TableCell>{variantLabel(plan.variant_sku_code)}</TableCell><TableCell>{plan.planned_quantity} {plan.uom}</TableCell><TableCell>{plan.revision ?? ""}</TableCell><TableCell>
        {plan.purpose === "PREPARATION" && canUpdate && <Button variant="outline" disabled={busy} onClick={() => void begin(plan)}>Sửa set</Button>}
        {plan.purpose !== "PREPARATION" && canUpdate && ["DRAFT", "REVIEWED", "WAITING_PRICE_APPROVAL"].includes(plan.status) && <Button disabled={busy} variant="outline" onClick={() => void legacyAction(plan)}>{plan.status === "DRAFT" ? "Thẩm định" : plan.status === "REVIEWED" ? "Publish BOM" : "Kiểm tra & handoff"}</Button>}
        {permissions.includes("production:material_requirement:read") && plan.purpose === "PREPARATION" && <Link href={`/production/material-requirements?food_plan_id=${encodeURIComponent(plan.id)}`}>Xem nhu cầu</Link>}
      </TableCell></TableRow>)}
    </TableBody></Table></CardContent></Card>}
  </PageShell>;
}


const pinnedPlanSchema = z.object({ pack_plan: z.object({
  set_ref: z.string(), set_updated_at: z.string(),
  slot_ratios: z.array(z.object({ slot: z.string(), options: z.array(z.object({ sku_ref: z.string().nullable(), ratio: z.string() })) })),
}).nullable().optional() });
function ratioTotal(values: string[]): bigint | null {
  if (values.some(value => !/^(100(\.0{1,4})?|[0-9]{1,2}(\.[0-9]{1,4})?)$/.test(value))) return null;
  return values.reduce((sum, value) => { const [whole, fraction = ""] = value.split("."); return sum + BigInt(whole) * 10000n + BigInt(fraction.padEnd(4, "0")); }, 0n);
}
function ratioPercent(value: string): string {
  if (!/^(0(\.[0-9]{1,6})?|1(\.0{1,6})?)$/.test(value)) throw new Error("Tỉ lệ đã pin không hợp lệ");
  const [whole, fraction = ""] = value.split(".");
  const scaled = BigInt(whole) * 1000000n + BigInt(fraction.padEnd(6, "0"));
  return `${scaled / 10000n}.${(scaled % 10000n).toString().padStart(4, "0")}`;
}
function percentRatio(value: string): string {
  const amount = ratioTotal([value]);
  if (amount === null) throw new Error("Tỉ lệ phần trăm không hợp lệ");
  return `${amount / 1000000n}.${(amount % 1000000n).toString().padStart(6, "0")}`;
}
export function FoodPackWorkspace({ targetId }: { targetId?: string }) {
  const [tab, setTab] = useState("sets");
  return <div className="space-y-6"><Tabs label="Thiết kế món và thực đơn" idPrefix="food-packs" items={[{ id: "sets", label: "Set" }, { id: "packages", label: "Gói + công thức" }, { id: "plans", label: "Thực đơn" }]} value={tab} onChange={setTab}>
    <div hidden={tab !== "sets"}><FoodSetsView /></div><div hidden={tab !== "packages"}><PackagesView /></div><div hidden={tab !== "plans"}><FoodPlansView initialPlans={[]} targetId={targetId} /></div>
  </Tabs><MaterialRequirementsView targetId={targetId} /></div>;
}
