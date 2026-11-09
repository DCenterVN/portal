import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nutrientFields, nutritionLabels, nutritionNumber, type CatalogNutrition } from "@/lib/nutrition";

function Labels({ nutrition, limit }: { nutrition: CatalogNutrition; limit?: number }) {
  return <div className="flex flex-wrap gap-2">{nutrition.labels.slice(0, limit).map(label => <Badge key={label} variant="outline">{nutritionLabels[label]}</Badge>)}</div>;
}
export function NutritionChip({ nutrition }: { nutrition?: CatalogNutrition | null }) {
  if (!nutrition || nutrition.missing.length || nutrition.per_serving.kcal === null || nutrition.per_serving.protein_g === null) return <p className="text-xs text-muted-foreground">Chưa đủ dữ liệu dinh dưỡng</p>;
  return <div className="space-y-2"><Badge variant="outline" className="tabular-nums">{nutritionNumber(nutrition.per_serving.kcal)} kcal · {nutritionNumber(nutrition.per_serving.protein_g)} g đạm</Badge><Labels nutrition={nutrition} limit={2} /></div>;
}
export function NutritionDetail({ nutrition }: { nutrition?: CatalogNutrition | null }) {
  return <Card className="mt-6 min-w-0"><CardHeader><CardTitle>Dinh dưỡng mỗi suất</CardTitle></CardHeader><CardContent className="space-y-4">
    {!nutrition ? <p className="text-sm text-muted-foreground">Chưa đủ dữ liệu dinh dưỡng</p> : <>
      <Table><TableHeader><TableRow><TableHead>Chất dinh dưỡng</TableHead><TableHead className="text-right">Mỗi suất</TableHead></TableRow></TableHeader><TableBody>
        {nutrientFields.map(([key, name, unit]) => <TableRow key={key}><TableCell>{name}</TableCell><TableCell className="text-right tabular-nums">{nutritionNumber(nutrition.per_serving[key])}{nutrition.per_serving[key] !== null && ` ${unit}`}</TableCell></TableRow>)}
      </TableBody></Table>
      <Labels nutrition={nutrition} />
      {nutrition.missing.length > 0 && <p className="text-sm text-muted-foreground">Thiếu dữ liệu: {nutrition.missing.join(", ")}</p>}
      {!!nutrition.components?.length && <div className="min-w-0 space-y-2"><h3 className="text-sm font-semibold">Theo ngăn/gói</h3><Table><TableHeader><TableRow>
        {["Ngăn/gói", "Khối lượng (g)", "kcal", "Đạm (g)", "Béo (g)", "Tinh bột (g)"].map((name, index) => <TableHead key={name} className={index ? "text-right" : ""}>{name}</TableHead>)}
      </TableRow></TableHeader><TableBody>{nutrition.components.map((component, index) => <TableRow key={index}><TableCell>{component.name}</TableCell>{(["grams", "kcal", "protein_g", "fat_g", "carb_g"] as const).map(key => <TableCell key={key} className="text-right tabular-nums">{nutritionNumber(component[key])}</TableCell>)}</TableRow>)}</TableBody></Table></div>}
    </>}
    <p className="text-xs text-muted-foreground">Ước tính từ nguyên liệu sống, chưa gồm dầu ăn tự thêm</p>
  </CardContent></Card>;
}
