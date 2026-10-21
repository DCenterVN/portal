"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntityPicker } from "@/components/ui/entity-picker";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { createPackage, getPackage, listPackages, updatePackage, retirePackage, getDraftProducts, getRawLabels, updateRawLabels, type FoodPackage, type CreatePackageRequest, type DraftProduct, type RawLabelsView } from "@/lib/api/sales";
import { getProductionContext, listPackageRecipes, getPackageRecipe, createPackageRecipe, updatePackageRecipe, retirePackageRecipe, type PackageRecipe, type RecipeHistory, type RecipeComponent, type PrepStep } from "@/lib/api/production";
import { MaterialPicker } from "./material-picker";
import { isStale, packMessage } from "./food-sets-view";

const allergens = ["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"] satisfies RawLabelsView["allergen_summary"]["contains"];
const avoidance = ["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"] satisfies RawLabelsView["avoidance_flags"];
const initialMetadata: CreatePackageRequest = { product_ref: "", code: "", name: "", variant_label: "Tiêu chuẩn", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED" };
const positive = (value: string) => /^(?!0(?:\.0{1,3})?$)(0|[1-9][0-9]*)(\.[0-9]{1,3})?$/.test(value);
const yieldValid = (value: string) => /^(100(\.0{1,3})?|[1-9][0-9]?(\.[0-9]{1,3})?|0\.(?!0{1,3}$)[0-9]{1,3})$/.test(value);
type ComponentDraft = { line: RecipeComponent; name: string; units: RecipeComponent["uom"][] };

export function PackagesView() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FoodPackage[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [histories, setHistories] = useState<Record<string, RecipeHistory>>({});
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [cursor, setCursor] = useState<string | undefined>();
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodPackage | null>(null);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [editing, setEditing] = useState(false);
  const [detailBusy, setDetailBusy] = useState(false);
  const [recipe, setRecipe] = useState<PackageRecipe | null>(null);
  const [recipeEditing, setRecipeEditing] = useState(false);
  const [components, setComponents] = useState<ComponentDraft[]>([]);
  const [steps, setSteps] = useState<PrepStep[]>([]);
  const [raw, setRaw] = useState<{ id: string; name: string } | null>(null);
  const [labels, setLabels] = useState<RawLabelsView | null>(null);
  const has = (action: string) => permissions.includes(action);
  const load = async () => {
    setBusy(true); setError("");
    try {
      const context = await getProductionContext(); const actions = context.permissions ?? []; setPermissions(actions);
      const page = await listPackages({ cursor, limit: 20 });
      setRows(page.items); setNext(page.next_cursor);
    } catch (e) { setError(packMessage(e)); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, [cursor]);
  const open = async (row: FoodPackage) => {
    setDetailBusy(true); setDetailError(""); setRecipeEditing(false); setEditing(false);
    setSelected(row); setRecipe(null); setComponents([]);
    try {
      const current = await getPackage(row.id);
      const history = has("production:recipe:read") ? await listPackageRecipes(row.id) : null;
      setSelected(current); setMetadata(current); setRecipe(history?.current ?? null);
      if (history) setHistories(current => ({ ...current, [row.id]: history }));
    } catch (e) { setDetailError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const begin = async (create: boolean) => {
    setDetailBusy(true); setError(""); setDetailError("");
    try { setProducts(await getDraftProducts()); if (create) { setSelected(null); setMetadata(initialMetadata); } else if (selected) setMetadata(selected); setEditing(true); }
    catch (e) { setError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (detailBusy || !(selected ? has("sales:variant:update") : has("sales:variant:create"))) return;
    setDetailBusy(true); setError("");
    const { product_ref, code, name, variant_label, net_weight_g, uom_code, temperature_regime } = metadata;
    const input = { product_ref, code, name, variant_label, net_weight_g, uom_code, temperature_regime };
    try {
      const saved = selected ? await updatePackage(selected.id, { ...input, expected_updated_at: selected.updated_at }) : await createPackage(input);
      setSelected(saved); setEditing(false); setRecipe(null); toast.success("Đã lưu gói"); await load(); await open(saved);
    } catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const failed = async (error: unknown) => {
    if (!isStale(error)) { setError(packMessage(error)); return; }
    toast.error("Dữ liệu đã đổi, tải lại"); setEditing(false); setRecipeEditing(false);
    if (selected) await open(selected); if (raw) await readLabels(raw); await load();
  };
  const retire = async () => {
    if (!selected || !has("sales:variant:delete") || detailBusy || !window.confirm(`Ngừng gói ${selected.name}?`)) return;
    setDetailBusy(true);
    try { await retirePackage(selected.id); setSelected(null); setEditing(false); toast.success("Đã ngừng gói"); await load(); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const beginRecipe = () => {
    setComponents(recipe?.components.map(({ name, ...line }) => ({ line, name: name ?? "Nguyên liệu không còn bán", units: line.uom === "KG" || line.uom === "G" ? ["KG", "G"] : line.uom === "L" || line.uom === "ML" ? ["L", "ML"] : ["EA"] })) ?? []);
    setSteps(recipe?.prep_steps ?? []); setRecipeEditing(true);
  };
  const validRecipe = components.length > 0 && components.length <= 100 && components.every(({ line }) => positive(line.quantity) && yieldValid(line.yield_pct)) && steps.every(step => step.instruction.trim() && Number.isInteger(step.duration_seconds) && step.duration_seconds >= 0);
  const saveRecipe = async (event: FormEvent) => {
    event.preventDefault(); if (!selected || !validRecipe || detailBusy || !(recipe ? has("production:recipe:update") : has("production:recipe:create"))) return;
    setDetailBusy(true); setError("");
    const input = { components: components.map(item => item.line), prep_steps: steps };
    try {
      if (recipe) await updatePackageRecipe(selected.id, recipe.version, { ...input, expected_version: recipe.version });
      else await createPackageRecipe(selected.id, input);
      toast.success("Đã lưu phiên bản công thức"); await open(selected); await load();
    } catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const retireRecipe = async () => {
    if (!selected || !recipe || !has("production:recipe:delete") || detailBusy || !window.confirm("Ngừng công thức đang dùng?")) return;
    setDetailBusy(true);
    try { await retirePackageRecipe(selected.id, recipe.version, { expected_version: recipe.version }); toast.success("Đã ngừng công thức"); await open(selected); await load(); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const readLabels = async (item: { id: string; name: string }) => {
    setDetailBusy(true); setError(""); setLabels(null); setRaw(item);
    try { setLabels(await getRawLabels(item.id)); }
    catch (e) { setError(packMessage(e)); }
    finally { setDetailBusy(false); }
  };
  const saveLabels = async (event: FormEvent) => {
    event.preventDefault(); if (!raw || !labels || !has("sales:product:update") || detailBusy) return;
    setDetailBusy(true); setError("");
    const { allergen_summary, avoidance_flags, diet_flags, updated_at } = labels;
    try { setLabels(await updateRawLabels(raw.id, { allergen_summary, avoidance_flags, diet_flags, expected_updated_at: updated_at })); toast.success("Đã lưu khai báo nguyên liệu"); }
    catch (e) { await failed(e); }
    finally { setDetailBusy(false); }
  };
  const changeComponent = (index: number, change: Partial<RecipeComponent>) => setComponents(current => current.map((item, i) => i === index ? { ...item, line: { ...item.line, ...change } } : item));
  const changeStep = (index: number, change: Partial<PrepStep>) => setSteps(current => current.map((step, i) => i === index ? { ...step, ...change } : step));
  const codeError = [...metadata.code].length > 56 ? "Mã gói tối đa 56 ký tự" : "";
  const validMetadata = !codeError && !!metadata.product_ref && !!metadata.code.trim() && !!metadata.name.trim() && !!metadata.variant_label.trim() && !!metadata.temperature_regime.trim() && Number.isInteger(metadata.net_weight_g) && metadata.net_weight_g > 0 && metadata.net_weight_g <= 2147483647;
  return <section aria-label="Gói và công thức" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Gói + công thức</h2><p className="text-sm text-muted-foreground">Mỗi công thức tạo một gói EA. Lịch sử phiên bản giữ lại cho thực đơn đã chốt.</p></div>{has("sales:variant:create") && <Button disabled={detailBusy} onClick={() => void begin(true)}>Tạo gói</Button>}</div>
    <Card><CardContent className="space-y-3 pt-6" aria-busy={busy}>
      {busy ? <Skeleton title="Đang tải gói và công thức…" /> : error ? <ErrorState title="Không tải được gói hoặc nguyên liệu" description={error} onRetry={() => { void load(); if (raw && !labels) void readLabels(raw); }} /> : rows.length === 0 ? <EmptyState title="Chưa có gói" description="Tạo gói cho họ món, sau đó thêm công thức nguyên liệu." action={has("sales:variant:create") ? <Button onClick={() => void begin(true)}>Tạo gói</Button> : undefined} /> : <Table><TableHeader><TableRow><TableHead>Tên gói</TableHead><TableHead>Quy cách</TableHead><TableHead>Công thức</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.net_weight_g} g · {row.variant_label}</TableCell><TableCell>{!has("production:recipe:read") ? "Chưa có quyền đọc công thức" : !histories[row.id] ? "Chưa tải công thức" : histories[row.id]?.current?.status === "BOM_ACTIVE" ? <Badge variant="outline">v{histories[row.id].current?.version}</Badge> : <Badge variant="outline">chưa có công thức</Badge>}</TableCell><TableCell><Button variant="outline" disabled={detailBusy} onClick={() => void open(row)}>Xem {row.name}</Button></TableCell></TableRow>)}</TableBody></Table>}
      <div className="flex gap-3"><Button variant="outline" disabled={busy || !cursor} onClick={() => setCursor(undefined)}>Trang đầu</Button><Button variant="outline" disabled={busy || !next} onClick={() => setCursor(next ?? undefined)}>Trang tiếp</Button></div>
    </CardContent></Card>
    {detailBusy && <Skeleton title="Đang tải hoặc lưu gói…" />}
    {detailError && <ErrorState title="Không tải được công thức gói" description={detailError} onRetry={() => { if (selected) void open(selected); }} />}
    {selected && !detailError && !detailBusy && <Card><CardContent className="space-y-4 pt-6"><h3 className="text-lg font-bold">{selected.name}</h3>
      <div className="flex flex-wrap gap-3">{has("sales:variant:update") && <Button variant="outline" disabled={detailBusy} onClick={() => void begin(false)}>Sửa gói</Button>}{has("sales:variant:delete") && <Button variant="outline" disabled={detailBusy} onClick={() => void retire()}>Ngừng gói</Button>}{(recipe ? has("production:recipe:update") : has("production:recipe:create")) && <Button variant="outline" disabled={detailBusy || recipe?.status === "BOM_RETIRED"} onClick={beginRecipe}>{recipe ? "Sửa công thức" : "Tạo công thức"}</Button>}{recipe?.status === "BOM_ACTIVE" && has("production:recipe:delete") && <Button variant="outline" disabled={detailBusy} onClick={() => void retireRecipe()}>Ngừng công thức</Button>}</div>
      {has("production:recipe:read") && !recipe && <Badge variant="outline">chưa có công thức</Badge>}
      {recipe && <><p>{recipe.bom_code} · v{recipe.version} · {recipe.status}</p><ul>{recipe.components.map(line => <li key={line.sku_ref}>{line.name ?? "Nguyên liệu không còn bán"} · {line.quantity} {line.uom} · Yield {line.yield_pct}%</li>)}</ul><ol>{recipe.prep_steps.map((step, index) => <li key={index}>{step.instruction} · {step.duration_seconds} giây</li>)}</ol></>}
      {has("production:recipe:read") && <label>Lịch sử phiên bản<Select value={recipe?.version ?? ""} disabled={detailBusy} onChange={async e => { setDetailBusy(true); try { setRecipe(await getPackageRecipe(selected.id, Number(e.target.value))); setRecipeEditing(false); } catch (e) { setDetailError(packMessage(e)); } finally { setDetailBusy(false); } }}><option value="" disabled>Chọn phiên bản</option>{histories[selected.id]?.history.map(version => <option key={version.version} value={version.version}>v{version.version} · {version.status}</option>)}</Select></label>}
    </CardContent></Card>}
    {editing && (selected ? has("sales:variant:update") : has("sales:variant:create")) && <Card><CardContent className="pt-6"><form aria-label="Biên tập gói" onSubmit={save} className="space-y-4">
      <EntityPicker name="package-family" label="Họ món của gói" items={products} status="ready" value={metadata.product_ref || null} getId={item => item.id} getLabel={item => item.name} onChange={id => setMetadata(current => ({ ...current, product_ref: id ?? "" }))} />
      <div className="grid gap-3 md:grid-cols-2">{([['code', 'Mã gói'], ['name', 'Tên gói'], ['variant_label', 'Quy cách gói'], ['temperature_regime', 'Chế độ nhiệt']] satisfies [keyof Pick<CreatePackageRequest, 'code' | 'name' | 'variant_label' | 'temperature_regime'>, string][]).map(([key, label]) => <label key={key}>{label}<Input required maxLength={key === "code" ? 56 : undefined} aria-invalid={key === "code" && !!codeError} value={metadata[key]} onChange={e => setMetadata(current => ({ ...current, [key]: e.target.value }))} /></label>)}<label>Khối lượng gói (g)<Input type="number" min="1" max="2147483647" value={metadata.net_weight_g} onChange={e => setMetadata(current => ({ ...current, net_weight_g: Number(e.target.value) }))} /></label></div>
      {codeError && <p role="alert">{codeError}</p>}
      {!validMetadata && <p>Chọn họ món, nhập mã, tên, quy cách, chế độ nhiệt và khối lượng nguyên dương.</p>}<div className="flex gap-3"><Button type="submit" disabled={detailBusy || !validMetadata}>{detailBusy ? "Đang lưu…" : "Lưu gói"}</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button></div>
    </form></CardContent></Card>}
    {recipeEditing && selected && (recipe ? has("production:recipe:update") : has("production:recipe:create")) && <Card><CardContent className="space-y-4 pt-6"><form aria-label="Biên tập công thức" onSubmit={saveRecipe} className="space-y-4">
      <p>Định lượng hữu ích cho 1 EA. Yield lớn hơn 0 và không quá 100%, tối đa 3 số lẻ. Mã BOM do máy chủ tạo.</p>
      {components.map(({ line, name, units }, index) => <fieldset className="grid gap-3 rounded-xl border p-4 md:grid-cols-4" key={line.sku_ref}><legend>{name}</legend>
        <label>Định lượng {index + 1}<Input required inputMode="decimal" value={line.quantity} onChange={e => changeComponent(index, { quantity: e.target.value })} /></label><label>Đơn vị {index + 1}<Select value={line.uom} onChange={e => { const unit = units.find(unit => unit === e.target.value); if (unit) changeComponent(index, { uom: unit }); }}>{units.map(unit => <option key={unit}>{unit}</option>)}</Select></label><label>Yield % {index + 1}<Input required inputMode="decimal" value={line.yield_pct} onChange={e => changeComponent(index, { yield_pct: e.target.value })} /></label><Button type="button" variant="outline" onClick={() => setComponents(current => current.filter((_, i) => i !== index))}>Bỏ nguyên liệu {index + 1}</Button>
      </fieldset>)}
      {steps.map((step, index) => <div className="grid gap-3 md:grid-cols-3" key={index}><label>Hướng dẫn {index + 1}<Input required value={step.instruction} onChange={e => changeStep(index, { instruction: e.target.value })} /></label><label>Thời gian (giây) {index + 1}<Input type="number" min="0" step="1" value={step.duration_seconds} onChange={e => changeStep(index, { duration_seconds: Number(e.target.value) })} /></label><Button type="button" variant="outline" onClick={() => setSteps(current => current.filter((_, i) => i !== index))}>Bỏ bước {index + 1}</Button></div>)}
      <Button type="button" variant="outline" onClick={() => setSteps(current => [...current, { instruction: "", duration_seconds: 0 }])}>Thêm bước chế biến</Button>
      {!validRecipe && <p role="alert">Thêm 1–100 nguyên liệu, kiểm tra định lượng, yield và thời gian nguyên không âm.</p>}
      <div className="flex gap-3"><Button type="submit" disabled={detailBusy || !validRecipe}>{detailBusy ? "Đang lưu…" : "Lưu công thức"}</Button><Button type="button" variant="outline" onClick={() => setRecipeEditing(false)}>Hủy</Button></div>
    </form><MaterialPicker onSelect={material => {
      if (components.some(item => item.line.sku_ref === material.id)) return;
      const units: RecipeComponent["uom"][] = ["G", "KG"].includes(material.uom_code) ? ["KG", "G"] : ["ML", "L"].includes(material.uom_code) ? ["L", "ML"] : ["EA"];
      setComponents(current => [...current, { name: material.name, units, line: { sku_ref: material.id, quantity: "0.200", uom: units[0], yield_pct: "100" } }]);
    }} /></CardContent></Card>}
    {has("sales:product:read") && <Card><CardContent className="space-y-4 pt-6"><h3 className="text-lg font-bold">Khai báo nhãn nguyên liệu</h3><p>Nhãn là khai báo của FOOD_DEV, không phải chứng nhận. Chưa biết khác với đã kiểm tra và không có chế độ ăn.</p>
      <MaterialPicker onSelect={material => void readLabels(material)} />
      {labels && <form aria-label="Nhãn nguyên liệu" onSubmit={saveLabels} className="space-y-4"><h4>{raw?.name}</h4><fieldset disabled={!has("sales:product:update") || detailBusy} className="space-y-4">
        <Checkbox label="Đã khai báo dị ứng" checked={labels.allergen_summary.known} onChange={e => setLabels(current => current && ({ ...current, allergen_summary: { known: e.target.checked, contains: [] } }))} />
        {!labels.allergen_summary.known && <p>Dị ứng chưa khai báo.</p>}<div className="grid gap-2 md:grid-cols-3">{allergens.map(value => <Checkbox key={value} label={value} disabled={!labels.allergen_summary.known} checked={labels.allergen_summary.contains.includes(value)} onChange={e => setLabels(current => current && ({ ...current, allergen_summary: { ...current.allergen_summary, contains: e.target.checked ? [...current.allergen_summary.contains, value] : current.allergen_summary.contains.filter(item => item !== value) } }))} />)}</div>
        <p>Kiêng</p><div className="grid gap-2 md:grid-cols-3">{avoidance.map(value => <Checkbox key={value} label={value} checked={labels.avoidance_flags.includes(value)} onChange={e => setLabels(current => current && ({ ...current, avoidance_flags: e.target.checked ? [...current.avoidance_flags, value] : current.avoidance_flags.filter(item => item !== value) }))} />)}</div>
        <label>Chế độ ăn nguyên liệu<Select value={labels.diet_flags === null ? "unknown" : labels.diet_flags.includes("VEGAN") ? "VEGAN" : labels.diet_flags.includes("VEGETARIAN") ? "VEGETARIAN" : "none"} onChange={e => { const value = e.target.value; setLabels(current => current && ({ ...current, diet_flags: value === "unknown" ? null : value === "VEGETARIAN" ? ["VEGETARIAN"] : value === "VEGAN" ? ["VEGAN"] : [] })); }}><option value="unknown">Chưa biết</option><option value="none">Không khẳng định chế độ ăn</option><option value="VEGETARIAN">Chay</option><option value="VEGAN">Thuần chay</option></Select></label>
      </fieldset>{has("sales:product:update") && <Button type="submit" disabled={detailBusy}>{detailBusy ? "Đang lưu…" : "Lưu nhãn nguyên liệu"}</Button>}</form>}
    </CardContent></Card>}
  </section>;
}
