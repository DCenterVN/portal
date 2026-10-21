"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EntityPicker } from "@/components/ui/entity-picker";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { createFoodSet, getFoodSet, listFoodSets, updateFoodSet, retireFoodSet, listPackages, getDraftProducts, type FoodSet, type FoodPackage, type SetSlot, type FoodSlot, type CreateFoodSetRequest, type DraftProduct } from "@/lib/api/sales";
import { evaluateFoodSet, getProductionContext, type EvaluatedFoodSet, type SlotSelection } from "@/lib/api/production";

export const FOOD_SLOTS: { id: FoodSlot; name: string }[] = [
  { id: "TINH_BOT", name: "Tinh bột" }, { id: "DAM", name: "Đạm" }, { id: "RAU", name: "Rau" },
  { id: "COT", name: "Cốt" }, { id: "NUOC_CHAM", name: "Nước chấm" }, { id: "GIA_VI_THEM", name: "Gia vị thêm" },
];
export const packMessage = (error: unknown) => error instanceof Error ? error.message : "Không tải được dữ liệu";
export const isStale = (error: unknown) => (typeof error === "object" && error !== null && "status" in error && error.status === 409) || /409|stale|changed|conflict|đã.*đổi|xung đột/i.test(packMessage(error));
const initialMetadata: CreateFoodSetRequest = { product_ref: "", code: "", name: "", variant_label: "Tiêu chuẩn", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED", tags: [] };
const normalizeFilterTag = (value: string) => value.trim().replace(/^#+/, "").trim().toLowerCase();
const nonRemovable = (slot: FoodSlot) => ["TINH_BOT", "DAM", "COT"].includes(slot);

export async function loadPackOptions() {
  const items: FoodPackage[] = [];
  let cursor: string | undefined;
  do {
    const page = await listPackages({ cursor, limit: 100 });
    items.push(...page.items); cursor = page.next_cursor ?? undefined;
  } while (cursor);
  return items.filter(item => !["RETIRED", "ARCHIVED"].includes(item.status));
}

export function FoodSetsView() {
  const { toast } = useToast();
  const [rows, setRows] = useState<FoodSet[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [packages, setPackages] = useState<FoodPackage[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTagDraft, setFilterTagDraft] = useState("");
  const [seenFilterTags, setSeenFilterTags] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodSet | null>(null);
  const [editing, setEditing] = useState(false);
  const [metadata, setMetadata] = useState(initialMetadata);
  const [tagText, setTagText] = useState("");
  const [slots, setSlots] = useState<SetSlot[]>([]);
  const [selections, setSelections] = useState<SlotSelection[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluatedFoodSet | null>(null);
  const [evaluateError, setEvaluateError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateRetry, setEvaluateRetry] = useState(0);
  const [detailBusy, setDetailBusy] = useState(false);
  const canCreate = permissions.includes("sales:variant:create");
  const canUpdate = permissions.includes("sales:variant:update");
  const canDelete = permissions.includes("sales:variant:delete");
  const [refresh, setRefresh] = useState(0);
  const mounted = useRef(false);
  const loadRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const load = async () => {
    if (!mounted.current) return;
    const request = ++loadRequest.current;
    setBusy(true); setError("");
    try {
      const context = await getProductionContext();
      if (request !== loadRequest.current) return;
      setPermissions(context.permissions ?? []);
      const page = await listFoodSets({ q: search, tags: filterTags, cursor, limit: 20 });
      if (request !== loadRequest.current) return;
      setRows(page.items); setNext(page.next_cursor);
      setSeenFilterTags(current => [...new Set([...current, ...page.items.flatMap(row => row.tags)])]);
    } catch (e) { if (request === loadRequest.current) setError(packMessage(e)); }
    finally { if (request === loadRequest.current) setBusy(false); }
  };
  useEffect(() => {
    void load();
    return () => { loadRequest.current++; };
  }, [search, filterTags, cursor, refresh]);
  useEffect(() => {
    if (!selected || !permissions.includes("production:recipe:read")) return;
    let active = true;
    setEvaluating(true); setEvaluation(null); setEvaluateError("");
    evaluateFoodSet(selected.id, { expected_updated_at: selected.updated_at, selections }).then(value => { if (active) setEvaluation(value); })
      .catch(e => { if (active) setEvaluateError(packMessage(e)); })
      .finally(() => { if (active) setEvaluating(false); });
    return () => { active = false; };
  }, [selected, selections, permissions, evaluateRetry]);
  const open = async (row: FoodSet) => {
    setDetailBusy(true); setError(""); setEvaluation(null); setEvaluateError("");
    try {
      const [current, options] = await Promise.all([getFoodSet(row.id), loadPackOptions()]);
      if (!mounted.current) return;
      setSelected(current); setPackages(options); setTagText(current.tags.join(", "));
      setSlots(current.slots); setSelections([]); setEditing(false);
    } catch (e) { if (mounted.current) setError(packMessage(e)); }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const begin = async (create: boolean) => {
    setDetailBusy(true); setError("");
    try {
      const [families, options] = await Promise.all([getDraftProducts(), loadPackOptions()]);
      if (!mounted.current) return;
      setProducts(families); setPackages(options);
      if (create) { setSelected(null); setMetadata(initialMetadata); setTagText(""); setSlots([]); }
      setEditing(true);
    } catch (e) { if (mounted.current) setError(packMessage(e)); }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const tags = tagText.split(/[,\s]+/).filter(Boolean);
  const tagError = tags.length < 3 || tags.length > 8 ? "Cần 3–8 hashtag." : new Set(tags).size !== tags.length ? "Hashtag bị trùng." : tags.some(tag => selected?.system_hashtags.includes(tag) || ["vegetarian", "vegan"].includes(tag)) ? "Hashtag trùng hashtag hệ thống hoặc chế độ ăn." : tags.some(tag => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag)) ? "Hashtag chỉ dùng chữ thường không dấu, số và dấu gạch nối." : "";
  const validSlots = slots.length >= 2 && ["TINH_BOT", "DAM"].every(slot => slots.some(row => row.slot === slot)) && slots.every(slot => slot.options.length > 0 && slot.options.filter(option => option.is_default).length === 1 && (slot.swappable || slot.options.length === 1) && slot.options.every(option => Number.isInteger(option.quantity) && option.quantity > 0));
  const valid = !tagError && (selected ? validSlots : !!metadata.product_ref && !!metadata.code.trim() && !!metadata.name.trim() && !!metadata.variant_label.trim() && metadata.net_weight_g > 0 && !!metadata.temperature_regime.trim());
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!valid || detailBusy || (selected ? !canUpdate : !canCreate)) return;
    setDetailBusy(true); setError("");
    try {
      const saved = selected ? await updateFoodSet(selected.id, { tags, slots, expected_updated_at: selected.updated_at }) : await createFoodSet({ ...metadata, tags });
      if (!mounted.current) return;
      setSelected(saved); setSlots(saved.slots); setTagText(saved.tags.join(", ")); setSelections([]); setEditing(false);
      toast.success("Đã lưu set"); setRefresh(value => value + 1);
    } catch (e) {
      if (!mounted.current) return;
      if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); setEditing(false); if (selected) await open(selected); if (mounted.current) setRefresh(value => value + 1); }
      else setError(packMessage(e));
    } finally { if (mounted.current) setDetailBusy(false); }
  };
  const retire = async () => {
    if (!selected || !canDelete || detailBusy || !window.confirm(`Ngừng set ${selected.name}?`)) return;
    setDetailBusy(true);
    try {
      await retireFoodSet(selected.id);
      if (!mounted.current) return;
      setSelected(null); setEditing(false); toast.success("Đã ngừng set"); setRefresh(value => value + 1);
    } catch (e) {
      if (!mounted.current) return;
      if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); await open(selected); if (mounted.current) setRefresh(value => value + 1); }
      else setError(packMessage(e));
    }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const changeSlot = (index: number, change: Partial<SetSlot>) => setSlots(current => current.map((row, i) => i === index ? { ...row, ...change } : row));
  const toggleFilterTag = (value: string) => {
    const tag = normalizeFilterTag(value);
    if (!tag) return;
    setCursor(undefined);
    setFilterTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
  };
  const addFilterTags = (value: string) => {
    const tags = value.split(",").map(normalizeFilterTag).filter(Boolean);
    if (!tags.length) return;
    setCursor(undefined);
    setFilterTags(current => [...new Set([...current, ...tags])]);
  };
  const clearTagFilters = () => {
    setCursor(undefined); setFilterTags([]); setFilterTagDraft("");
  };
  const availableTags = [...new Set([...seenFilterTags, ...filterTags, ...(selected?.tags ?? [])])].sort();
  return <section aria-label="Set" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">Set món ăn</h2><p className="text-sm text-muted-foreground">Ghép gói theo từng ô, xem nhãn trên đúng lựa chọn dùng cho bữa ăn.</p></div>{canCreate && <Button disabled={detailBusy} onClick={() => void begin(true)}>Tạo set món</Button>}</div>
    <form className="flex gap-3" onSubmit={e => { e.preventDefault(); setCursor(undefined); setSearch(query); }}><label className="flex-1">Tìm set theo tên<Input value={query} onChange={e => setQuery(e.target.value)} /></label><Button type="submit" variant="outline" disabled={busy}>Tìm set</Button></form>
    <div className="space-y-3"><label className="block">Lọc theo hashtag<Input value={filterTagDraft} list="food-set-filter-tags" aria-describedby="food-set-filter-help" placeholder="Nhập hashtag rồi nhấn Enter" onChange={e => {
      const parts = e.target.value.split(",");
      setFilterTagDraft(parts.pop() ?? "");
      if (parts.length) addFilterTags(parts.join(","));
    }} onKeyDown={e => {
      if (e.nativeEvent.isComposing || (e.key !== "Enter" && e.key !== ",")) return;
      e.preventDefault(); addFilterTags(filterTagDraft); setFilterTagDraft("");
    }} /></label>
      <datalist id="food-set-filter-tags">{availableTags.filter(tag => !filterTags.includes(tag)).map(tag => <option key={tag} value={tag} />)}</datalist>
      <p id="food-set-filter-help" className="text-sm text-muted-foreground">Nhấn Enter hoặc dấu phẩy để thêm hashtag. Kết quả phải có tất cả hashtag đã chọn; tìm tên áp dụng riêng.</p>
      <div className="flex flex-wrap gap-2">{filterTags.map(tag => <Button key={tag} type="button" variant="outline" aria-pressed={true} aria-label={`Bỏ lọc hashtag ${tag}`} onClick={() => toggleFilterTag(tag)}>#{tag} <span aria-hidden="true">×</span></Button>)}{filterTags.length >= 2 && <Button type="button" variant="outline" onClick={clearTagFilters}>Xoá lọc</Button>}</div>
    </div>
    <Card><CardContent className="space-y-3 pt-6" aria-busy={busy}>
      {busy ? <Skeleton title="Đang tải danh sách set…" /> : error ? <ErrorState title="Không tải được set" description={error} onRetry={() => void load()} /> : rows.length === 0 ? <EmptyState title={filterTags.length ? `Không có set nào có hashtag ${filterTags.map(tag => `#${tag}`).join(", ")}` : "Chưa có set món ăn"} description={filterTags.length ? "Bỏ hashtag để xem thêm set món ăn." : "Tạo set nháp, sau đó ghép các gói vào ô tinh bột và đạm."} action={filterTags.length ? <Button onClick={clearTagFilters}>Xoá lọc</Button> : canCreate ? <Button onClick={() => void begin(true)}>Tạo set món</Button> : undefined} /> : <Table><TableHeader><TableRow><TableHead>Tên set</TableHead><TableHead>Trạng thái</TableHead><TableHead>Số ô</TableHead><TableHead>Chi tiết</TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.status}</TableCell><TableCell>{row.slots.length}</TableCell><TableCell><Button variant="outline" disabled={detailBusy} onClick={() => void open(row)}>Xem {row.name}</Button></TableCell></TableRow>)}</TableBody></Table>}
      <div className="flex gap-3"><Button variant="outline" disabled={busy || !cursor} onClick={() => setCursor(undefined)}>Trang đầu</Button><Button variant="outline" disabled={busy || !next} onClick={() => setCursor(next ?? undefined)}>Trang tiếp</Button></div>
    </CardContent></Card>
    {detailBusy && <Skeleton title="Đang tải hoặc lưu set…" />}
    {selected && <Card><CardContent className="space-y-4 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold">{selected.name}</h3><div className="flex gap-3">{canUpdate && <Button variant="outline" disabled={detailBusy} onClick={() => void begin(false)}>Sửa set món</Button>}{canDelete && <Button variant="outline" disabled={detailBusy} onClick={() => void retire()}>Ngừng set</Button>}</div></div>
      {selected.slots.map(slot => <label key={slot.slot} className="block">{FOOD_SLOTS.find(item => item.id === slot.slot)?.name}<Select disabled={!slot.swappable && !slot.removable} value={selections.find(item => item.slot === slot.slot)?.sku_ref ?? (selections.some(item => item.slot === slot.slot) ? "" : slot.options.find(option => option.is_default)?.sku_ref ?? "")} onChange={e => setSelections(current => [...current.filter(item => item.slot !== slot.slot), { slot: slot.slot, sku_ref: e.target.value || null }])}>
        {slot.removable && <option value="">Bỏ ô này</option>}{slot.options.map(option => <option key={option.sku_ref} value={option.sku_ref}>{packages.find(item => item.id === option.sku_ref)?.name ?? "Gói đã chọn"} · {option.quantity} EA</option>)}
      </Select></label>)}
      {evaluating && <Skeleton title="Đang tính nhãn theo lựa chọn…" />}
      {evaluateError && <ErrorState title="Không tính được nhãn" description={evaluateError} onRetry={() => setEvaluateRetry(value => value + 1)} />}
      {!permissions.includes("production:recipe:read") && <p>Chưa có quyền đọc nhãn công thức.</p>}
      {evaluation && <div className="space-y-3" aria-live="polite">
        <p>Dị ứng</p><div className="flex flex-wrap gap-2">{!evaluation.allergen_summary.known && <Badge variant="outline">Dị ứng chưa khai báo</Badge>}{evaluation.allergen_summary.contains.map(value => <Badge variant="outline" key={value}>{value}</Badge>)}</div>
        <p>Kiêng</p><div className="flex flex-wrap gap-2">{evaluation.avoidance_flags.map(value => <Badge variant="outline" key={value}>{value}</Badge>)}</div>
        <p>Chế độ ăn</p><div className="flex flex-wrap gap-2">{evaluation.unknown.some(item => item.fields.includes("diet_flags")) ? <Badge variant="outline">Chế độ ăn chưa khai báo</Badge> : evaluation.diet_flags.map(value => <Badge variant="outline" key={value}>{value === "VEGAN" ? "Thuần chay" : "Chay"}</Badge>)}</div>
        {evaluation.unknown.length > 0 && <p>Có {evaluation.unknown.length} nguyên liệu chưa khai báo đầy đủ nhãn.</p>}
        {[["Hashtag tay", evaluation.manual_hashtags], ["Hashtag hệ thống", evaluation.system_hashtags], ["Hashtag suy ra", evaluation.derived_hashtags]].map(([label, values]) => <div key={String(label)}><p>{label}</p><div className="flex flex-wrap gap-2">{Array.isArray(values) && values.map(value => label === "Hashtag tay" ? <Button key={value} type="button" variant="outline" aria-pressed={filterTags.includes(value)} aria-label={`Lọc hashtag ${value}`} onClick={() => toggleFilterTag(value)}>{value}</Button> : <Badge variant="secondary" key={value}>{value}</Badge>)}</div></div>)}
      </div>}
      <p className="text-sm text-muted-foreground">Nhãn là khai báo của FOOD_DEV, không phải chứng nhận. Có thể xảy ra nhiễm chéo trong bảo quản và chế biến.</p>
    </CardContent></Card>}
    {editing && (selected ? canUpdate : canCreate) && <Card><CardContent className="pt-6"><form aria-label="Biên tập set món" onSubmit={save} className="space-y-4">
      {!selected && <><EntityPicker name="set-family" label="Họ món" value={metadata.product_ref || null} onChange={id => setMetadata(current => ({ ...current, product_ref: id ?? "" }))} items={products} status="ready" getId={item => item.id} getLabel={item => item.name} />
        <div className="grid gap-3 md:grid-cols-2">{([['code', 'Mã set'], ['name', 'Tên set'], ['variant_label', 'Quy cách'], ['temperature_regime', 'Chế độ nhiệt']] satisfies [keyof Pick<CreateFoodSetRequest, 'code' | 'name' | 'variant_label' | 'temperature_regime'>, string][]).map(([key, label]) => <label key={key}>{label}<Input required value={metadata[key]} onChange={e => setMetadata(current => ({ ...current, [key]: e.target.value }))} /></label>)}<label>Khối lượng tịnh (g)<Input type="number" min="1" max="2147483647" value={metadata.net_weight_g} onChange={e => setMetadata(current => ({ ...current, net_weight_g: Number(e.target.value) }))} /></label></div></>}
      <label className="block">Hashtag tay<Input aria-describedby="set-tags-help" aria-invalid={!!tagError} value={tagText} onChange={e => setTagText(e.target.value)} /></label><p id="set-tags-help" role={tagError ? "alert" : "status"}>{tags.length}/8 hashtag · 3–8, cách nhau bằng dấu phẩy. {tagError}</p>
      {!selected && <p>Lưu nháp trước, sau đó thêm ô và gói.</p>}
      {selected && <><p>Mỗi ô có đúng một gói mặc định. Tinh bột, đạm và cốt không được bỏ; ô cố định chỉ có một lựa chọn.</p>{slots.map((slot, index) => <fieldset key={slot.slot} className="space-y-3 rounded-xl border p-4"><legend>{FOOD_SLOTS.find(item => item.id === slot.slot)?.name}</legend>
        <Checkbox label="Cho đổi gói" checked={slot.swappable} onChange={e => changeSlot(index, { swappable: e.target.checked })} /><Checkbox label="Cho bỏ ô" disabled={nonRemovable(slot.slot)} checked={slot.removable} onChange={e => changeSlot(index, { removable: e.target.checked })} />
        {slot.options.map((option, optionIndex) => <div key={option.sku_ref} className="grid gap-3 md:grid-cols-3"><p>{packages.find(item => item.id === option.sku_ref)?.name ?? "Gói đã chọn"}</p><label>Số gói<Input type="number" min="1" value={option.quantity} onChange={e => changeSlot(index, { options: slot.options.map((row, i) => i === optionIndex ? { ...row, quantity: Number(e.target.value) } : row) })} /></label><Checkbox label="Mặc định" checked={option.is_default} onChange={() => changeSlot(index, { options: slot.options.map((row, i) => ({ ...row, is_default: i === optionIndex })) })} /><Button type="button" variant="outline" onClick={() => changeSlot(index, { options: slot.options.filter((_, i) => i !== optionIndex) })}>Bỏ gói {optionIndex + 1}</Button></div>)}
        <EntityPicker name={`set-pack-${slot.slot}`} label="Thêm gói theo tên" items={packages.filter(item => !slot.options.some(option => option.sku_ref === item.id))} status="ready" value={null} getId={item => item.id} getLabel={item => item.name} onChange={id => { if (id) changeSlot(index, { options: [...slot.options, { sku_ref: id, quantity: 1, is_default: slot.options.length === 0 }] }); }} />
        <Button type="button" variant="outline" onClick={() => setSlots(current => current.filter((_, i) => i !== index))}>Xóa ô</Button>
      </fieldset>)}<label>Thêm ô<Select value="" onChange={e => { const slot = FOOD_SLOTS.find(item => item.id === e.target.value); if (slot) setSlots(current => [...current, { slot: slot.id, swappable: false, removable: false, options: [] }]); }}><option value="">Chọn loại ô</option>{FOOD_SLOTS.filter(item => !slots.some(slot => slot.slot === item.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>{!validSlots && <p role="alert">Cần ô tinh bột và đạm, mỗi ô có gói với số lượng dương và đúng một mặc định.</p>}</>}
      <div className="flex gap-3"><Button type="submit" disabled={detailBusy || !valid}>{detailBusy ? "Đang lưu…" : "Lưu set món"}</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Hủy</Button></div>
    </form></CardContent></Card>}
  </section>;
}
