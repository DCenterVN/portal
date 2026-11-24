import type { Agreement } from "@/lib/api/supplier-agreements";
import type { Material } from "@/lib/api/sales";

export const EXPIRING_DAYS = 14;
export type PriceRow = { sku: string; name: string; image: string | null; unit_price_vnd: number; uom: string; valid_to: string; expiring: boolean };
export const MISSING_MATERIAL = "Nguyên liệu không còn trong danh mục";

const day = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const isActive = (agreement: Agreement) => agreement.status === "ACTIVE" && (!agreement.effective_status || agreement.effective_status === "ACTIVE");

export function priceRows(agreements: Agreement[], materials: Material[], today: string): { rows: PriceRow[]; drafts: number } {
  const byId = new Map(materials.map(material => [material.id, material]));
  const rows = agreements.filter(isActive).flatMap(agreement => agreement.lines.map(line => {
    const material = byId.get(line.sku_ref);
    return { sku: line.sku_ref, name: material?.name ?? MISSING_MATERIAL, image: material?.image_url ?? null, unit_price_vnd: line.unit_price_vnd, uom: line.uom, valid_to: line.valid_to, expiring: (day(line.valid_to) - day(today)) / 86400000 <= EXPIRING_DAYS };
  })).sort((a, b) => a.name.localeCompare(b.name, "vi"));
  return { rows, drafts: agreements.filter(agreement => agreement.status === "DRAFT").length };
}

export const panelState = (data: unknown, error: unknown): "loading" | "error" | "ready" => data !== undefined ? "ready" : error ? "error" : "loading";
