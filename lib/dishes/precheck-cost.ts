import type { CostPreview, DishContent } from "./types";
import type { DishError } from "./validate-dish";

const noPriceReason = "Chưa có giá vốn — thêm báo giá nhà cung cấp hoặc nhập kho";
const uomReason = "Có báo giá nhưng khác đơn vị — cập nhật báo giá cùng đơn vị hoặc nhập kho";
const noRecipeReason = "Gói chưa có công thức hiệu lực";

const reasonOf = (missing: string | null) => (missing === "NO_RECIPE" ? noRecipeReason : missing === "UOM_MISMATCH" ? uomReason : noPriceReason);
const uomFamily = (uom?: string) => { const u = (uom ?? "").toUpperCase(); return u === "G" || u === "KG" ? "MASS" : u === "ML" || u === "L" ? "VOL" : u; };
const uniqueNames = (names: string[]) => [...new Set(names.map(name => name.trim()).filter(Boolean))];

function collectCostErrors(content: DishContent, preview: CostPreview, onlyBlocking: boolean): DishError[] {
  const allMissing = preview.lines.filter(line => Boolean(line.missing) || line.cost_vnd === null);
  const missingLines = onlyBlocking
    ? allMissing.filter(line => line.missing === "NO_RECIPE" || line.missing === "UOM_MISMATCH")
    : allMissing;
  if (!missingLines.length && (onlyBlocking || preview.complete)) return [];
  const namesOf = (pick: (missing: string | null) => boolean) => uniqueNames(missingLines.filter(line => pick(line.missing)).map(line => line.name ?? ""));
  const uomNames = namesOf(missing => missing === "UOM_MISMATCH");
  const noRecipeNames = namesOf(missing => missing === "NO_RECIPE");
  const noPriceNames = onlyBlocking ? [] : namesOf(missing => missing !== "UOM_MISMATCH" && missing !== "NO_RECIPE");
  const seen = new Set<string>();
  const rowErrors: DishError[] = [];
  const push = (error: DishError & { row: string }) => {
    const key = `${error.row}\0${error.field}\0${error.message}`;
    if (seen.has(key)) return;
    seen.add(key);
    rowErrors.push(error);
  };
  for (const line of missingLines) {
    const reason = reasonOf(line.missing);
    if (line.from === "PACKAGE" || Boolean(line.package_ref)) {
      const ref = line.package_ref ?? line.sku_ref;
      for (const seasoning of content.seasonings.filter(item => item.package_ref === ref)) {
        push({ row: seasoning.row, field: "package_ref", message: line.name ? `${line.name}: ${reason}` : reason });
      }
      continue;
    }
    for (const ingredient of content.ingredients.filter(item => item.sku_ref === line.sku_ref && (!line.uom || uomFamily(item.uom) === uomFamily(line.uom)))) {
      push({ row: ingredient.row, field: "sku_ref", message: reason });
    }
  }
  const parts = [
    noPriceNames.length ? `Chưa có giá vốn cho: ${noPriceNames.join(", ")}. Thêm báo giá nhà cung cấp hoặc nhập kho nguyên liệu trước khi hoàn tất.` : "",
    uomNames.length ? `Khác đơn vị tính giá vốn cho: ${uomNames.join(", ")}. Cập nhật báo giá nhà cung cấp cùng đơn vị hoặc nhập kho.` : "",
    noRecipeNames.length ? `Chưa có công thức hiệu lực cho gói: ${noRecipeNames.join(", ")}.` : "",
  ].filter(Boolean);
  const summary = parts.length
    ? parts.join(" ")
    : "Chưa đủ giá vốn nguyên liệu để hoàn tất món. Thêm báo giá nhà cung cấp hoặc nhập kho rồi thử lại.";
  return [{ field: "cost", message: summary }, ...rowErrors];
}

export function costPreviewErrors(content: DishContent, preview: CostPreview): DishError[] {
  return collectCostErrors(content, preview, false);
}

export function blockingCostErrors(content: DishContent, preview: CostPreview): DishError[] {
  return collectCostErrors(content, preview, true);
}
