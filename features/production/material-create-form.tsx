"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox, Select } from "@/components/ui/field";
import { EntityPicker } from "@/components/ui/entity-picker";
const allergens = ["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"] as const;
const avoidance = ["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"] as const;

type MaterialInput = {
  name: string; uom_code: "KG" | "L" | "EA"; material_group_code: string;
  allergens: Array<typeof allergens[number]> | null;
  avoidance_flags: Array<typeof avoidance[number]>;
  diet_flags: Array<"VEGETARIAN" | "VEGAN"> | null; season_months: number[] | null;
};
type Category = { code: string; name: string; children: Array<{ code: string; name: string }> };
type ExistingMaterial = { id: string; code: string; name: string };

export function MaterialCreateForm({ initialName, categories, onCreate, onUseExisting, existing, error, onCancel }: {
  initialName: string; categories: Category[];
  onCreate: (input: MaterialInput) => Promise<void>;
  onUseExisting: (existing: ExistingMaterial) => Promise<void>;
  existing: ExistingMaterial | null; error: string; onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [parent, setParent] = useState("");
  const [leaf, setLeaf] = useState("");
  const [unit, setUnit] = useState<MaterialInput["uom_code"]>("KG");
  const [known, setKnown] = useState(false);
  const [contains, setContains] = useState<NonNullable<MaterialInput["allergens"]>>([]);
  const [flags, setFlags] = useState<MaterialInput["avoidance_flags"]>([]);
  const [diet, setDiet] = useState("unknown");
  const [months, setMonths] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [validationError, setValidationError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!name.trim() || name.trim().length > 150 || !leaf) { setValidationError("Nhập tên và chọn đủ hai cấp nhóm nguyên liệu."); return; }
    setBusy(true); setValidationError("");
    try {
      await onCreate({ name: name.trim(), material_group_code: leaf, uom_code: unit, allergens: known ? contains : null, avoidance_flags: flags, diet_flags: diet === "unknown" ? null : diet === "none" ? [] : diet === "VEGAN" ? ["VEGAN"] : ["VEGETARIAN"], season_months: months.length ? months : null });
    } finally { setBusy(false); }
  };
  const useExisting = async () => {
    if (!existing || busy) return;
    setBusy(true); setValidationError("");
    try { await onUseExisting(existing); }
    finally { setBusy(false); }
  };
  return <form aria-label="Tạo nguyên liệu" className="space-y-4 rounded-xl border p-4" onSubmit={submit}>
    <h3>Tạo nguyên liệu</h3>
    <fieldset disabled={busy} className="space-y-3">
      <label>Tên<Input required maxLength={150} value={name} onChange={e => setName(e.target.value)} /></label>
      <p>Mã nguyên liệu được tạo tự động sau khi lưu.</p>
      <EntityPicker name="material-create-parent" label="Nhóm cấp 1" required items={categories} status="ready" value={parent} getId={item => item.code} getLabel={item => item.name} onChange={id => { setParent(id ?? ""); setLeaf(""); }} />
      <EntityPicker key={parent} name="material-create-leaf" label="Nhóm cấp 2" required items={categories.find(item => item.code === parent)?.children ?? []} status="ready" value={leaf} getId={item => item.code} getLabel={item => item.name} onChange={id => setLeaf(id ?? "")} />
      <label>Đơn vị<Select value={unit} onChange={e => { const value = e.target.value; if (value === "KG" || value === "L" || value === "EA") setUnit(value); }}><option value="KG">Kilôgam</option><option value="L">Lít</option><option value="EA">Cái/gói</option></Select></label>
      <label>Dị ứng<Select value={known ? "known" : "unknown"} onChange={e => setKnown(e.target.value === "known")}><option value="unknown">Chưa biết</option><option value="known">Đã khai báo</option></Select></label>
      {known && <fieldset><legend>Dị ứng đã khai báo (để trống = Không có)</legend>{allergens.map(value => <Checkbox key={value} label={value} checked={contains.includes(value)} onChange={e => setContains(current => e.target.checked ? [...current, value] : current.filter(item => item !== value))} />)}</fieldset>}
      <fieldset><legend>Nhãn kiêng</legend>{avoidance.map(value => <Checkbox key={value} label={value} checked={flags.includes(value)} onChange={e => setFlags(current => e.target.checked ? [...current, value] : current.filter(item => item !== value))} />)}</fieldset>
      <label>Chế độ ăn<Select value={diet} onChange={e => setDiet(e.target.value)}><option value="unknown">Chưa biết</option><option value="none">Không</option><option value="VEGETARIAN">Chay</option><option value="VEGAN">Thuần chay</option></Select></label>
      <fieldset><legend>Tháng mùa</legend><div className="flex flex-wrap gap-3">{Array.from({ length: 12 }, (_, index) => index + 1).map(month => <Checkbox key={month} label={`Tháng ${month}`} checked={months.includes(month)} onChange={e => setMonths(current => e.target.checked ? [...current, month] : current.filter(item => item !== month))} />)}</div></fieldset>
    </fieldset>
    {(validationError || error) && <p role="alert">{validationError || error}</p>}
    {existing && <div role="status"><p>Đã có {existing.name} · {existing.code}</p><Button type="button" variant="outline" disabled={busy} onClick={() => void useExisting()}>Dùng nguyên liệu đã có</Button></div>}
    <div className="flex gap-3"><Button type="submit" disabled={busy}>{busy ? "Đang lưu…" : "Tạo nguyên liệu"}</Button><Button type="button" variant="outline" disabled={busy} onClick={onCancel}>Hủy</Button></div>
  </form>;
}
