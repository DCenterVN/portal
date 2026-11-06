import { useState } from "react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { ChevronDown } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MaterialPicker } from "../material-picker";
import { slotLabels, slotOf, type DishContent, type GroupNode } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";

import type { MaterialInfo, Material } from "./use-dish-data";
export function DishIngredientsView({ content, materials, tree, errors = [], readOnly = false, onChange, onMaterial }: {
  content: DishContent; materials: Record<string, MaterialInfo>; tree: GroupNode[]; errors?: DishError[]; readOnly?: boolean;
  onChange: (content: DishContent) => void; onMaterial: (material: Material) => void;
}) {
  const [picking, setPicking] = useState<string | null>(null);
  const update = (row: string, patch: Partial<DishContent["ingredients"][number]>) => onChange({ ...content, ingredients: content.ingredients.map(line => line.row === row ? { ...line, ...patch } : line) });
  const select = (material: Material) => {
    const duplicate = content.ingredients.find(line => line.sku_ref === material.id);
    if (duplicate && duplicate.row !== picking) { setPicking(duplicate.row); return; }
    onMaterial(material);
    if (picking) update(picking, { sku_ref: material.id, uom: material.uom_code === "KG" ? "G" : material.uom_code === "L" ? "ML" : material.uom_code });
    else onChange({ ...content, ingredients: [...content.ingredients, { row: crypto.randomUUID(), sku_ref: material.id, quantity: "", uom: material.uom_code === "KG" ? "G" : material.uom_code === "L" ? "ML" : material.uom_code, yield_pct: "100" }] });
    setPicking(null);
  };
  const totals = ["G", "ML", "EA"].flatMap(uom => {
    const amount = content.ingredients.filter(line => line.uom === uom).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0);
    return amount ? [`${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(amount)} ${uom === "G" ? "g" : uom === "ML" ? "ml" : "cái"}`] : [];
  });
  const kit = ["G", "ML", "EA"].flatMap(uom => {
    const amount = content.ingredients.filter(line => line.uom === uom).reduce((sum, line) => sum + (Number(line.quantity) || 0), 0) * (content.servings ?? 0);
    return amount ? [`${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(amount)} ${uom === "G" ? "g" : uom === "ML" ? "ml" : "cái"}`] : [];
  });
  return <section className="space-y-3" aria-label="Nguyên liệu món"><h2>Nguyên liệu</h2><p>Định lượng cho 1 suất. Lượng kit tự nhân theo khẩu phần, chưa gồm gia vị.</p>
    <Table><TableHeader><TableRow>{["Nguyên liệu", "Lượng / suất", "Đơn vị", "Hao hụt %", "Ngăn đóng gói", "Lượng / kit", "Dị ứng"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader><TableBody>{content.ingredients.map((line, index) => {
      const material = line.sku_ref ? materials[line.sku_ref] : null;
      return <TableRow key={line.row}><TableCell><div className="space-y-2"><span>{material?.name ?? (line.sku_ref ? "Nguyên liệu chưa tải được tên" : "Chọn nguyên liệu")}</span>{!readOnly && <div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setPicking(line.row)}>Chọn / thay nguyên liệu dòng {index + 1}<ChevronDown aria-hidden="true" className="size-4" /></Button><Button type="button" variant="ghost" onClick={() => onChange({ ...content, ingredients: content.ingredients.filter(item => item.row !== line.row) })}>Bỏ dòng {index + 1}</Button></div>}{errors.filter(e => e.row === line.row && e.field === "sku_ref").map(e => <InlineAlert key={e.field}>{e.message}</InlineAlert>)}</div></TableCell>
        <TableCell>{readOnly ? line.quantity : <Input aria-label={`Lượng / suất dòng ${index + 1}`} inputMode="decimal" value={line.quantity} onChange={e => update(line.row, { quantity: e.target.value })} />}{errors.filter(e => e.row === line.row && e.field === "quantity").map(e => <InlineAlert key={e.field}>{e.message}</InlineAlert>)}</TableCell>
        <TableCell>{line.uom === "G" ? "g" : line.uom === "ML" ? "ml" : "cái"}</TableCell>
        <TableCell>{readOnly ? 100 - Number(line.yield_pct) : <Input aria-label={`Hao hụt % dòng ${index + 1}`} inputMode="decimal" type="number" min={0} max={99} value={line.yield_pct === "" ? "" : 100 - Number(line.yield_pct)} onChange={e => update(line.row, { yield_pct: e.target.value === "" ? "" : String(100 - Number(e.target.value)) })} />}{errors.filter(e => e.row === line.row && e.field === "yield_pct").map(e => <InlineAlert key={e.field}>{e.message}</InlineAlert>)}</TableCell>
        <TableCell>{material?.group && tree.some(node => node.code === material.group) ? slotLabels[slotOf(material.group, tree)] : "Chưa có nhóm"}</TableCell><TableCell className="text-right tabular-nums">{line.quantity && content.servings ? new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(Number(line.quantity) * content.servings) : "—"}</TableCell><TableCell>{material?.allergens ?? "Chưa khai báo"}</TableCell>
      </TableRow>;
    })}</TableBody></Table>
    <p>Tổng / suất: {totals.join(" + ") || "Chưa có lượng"}. Tổng / kit: {kit.join(" + ") || "Chưa có lượng"}.</p>
    {!readOnly && <><Button type="button" variant="outline" onClick={() => { const row = crypto.randomUUID(); onChange({ ...content, ingredients: [...content.ingredients, { row, sku_ref: null, quantity: "", uom: "G", yield_pct: "100" }] }); setPicking(row); }}>Thêm dòng nguyên liệu</Button>{picking && <div className="space-y-2"><MaterialPicker onSelect={select} /><Button type="button" variant="ghost" onClick={() => setPicking(null)}>Đóng chọn nguyên liệu</Button></div>}</>}
  </section>;
}
