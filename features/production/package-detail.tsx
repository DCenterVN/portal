import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Card, CardContent } from "@/components/ui/card";
import type { PackagesState } from "./use-packages";

export function PackageDetail({ s }: { s: PackagesState }) {
  const { selected, recipe, can } = s;
  if (!selected || s.detailError || s.detailBusy) return null;
  return <Card><CardContent className="space-y-4 pt-6"><h3 className="text-lg font-bold">{selected.name}</h3>
    <div className="flex flex-wrap gap-3">{can("sales:variant:update") && <Button variant="outline" disabled={s.detailBusy} onClick={() => void s.begin(false)}>Sửa gói</Button>}{can("sales:variant:delete") && <Button variant="outline" disabled={s.detailBusy} onClick={() => s.setConfirm("package")}>Ngừng gói</Button>}{(recipe ? can("production:recipe:update") : can("production:recipe:create")) && <Button variant="outline" disabled={s.detailBusy || recipe?.status === "BOM_RETIRED"} onClick={s.beginRecipe}>{recipe ? "Sửa công thức" : "Tạo công thức"}</Button>}{recipe?.status === "BOM_ACTIVE" && can("production:recipe:delete") && <Button variant="outline" disabled={s.detailBusy} onClick={() => s.setConfirm("recipe")}>Ngừng công thức</Button>}</div>
    {can("production:recipe:read") && !recipe && <Badge variant="outline">chưa có công thức</Badge>}
    {recipe && <><p>{recipe.bom_code} · v{recipe.version} · {recipe.status}</p><ul>{recipe.components.map(line => <li key={line.sku_ref}>{line.name ?? "Nguyên liệu không còn bán"} · {line.quantity} {line.uom} · Yield {line.yield_pct}%</li>)}</ul><ol>{recipe.prep_steps.map((step, index) => <li key={index}>{step.instruction} · {step.duration_seconds} giây</li>)}</ol></>}
    {can("production:recipe:read") && <label>Lịch sử phiên bản<NativeSelect value={recipe?.version ?? ""} disabled={s.detailBusy} onChange={e => void s.selectVersion(Number(e.target.value))}><NativeSelectOption value="" disabled>Chọn phiên bản</NativeSelectOption>{s.histories[selected.id]?.history.map(version => <NativeSelectOption key={version.version} value={version.version}>v{version.version} · {version.status}</NativeSelectOption>)}</NativeSelect></label>}
  </CardContent></Card>;
}
