import { allPages } from "@/lib/api/all-pages";
import { dishRequest, listDishes, safeMessage, type DishListRow, type Page } from "@/lib/api/dishes";
import { FetchError } from "@/lib/fetcher";

export interface PriceableVariant { id: string; productId: string; label: string; meta: string }
export interface PendingPriceRow { id: string; price_book_id: string; product_name: string; variant_label: string | null; proposed_price_vnd: number; minimum_sale_price_vnd: number; created_at: string; authored_by_name: string; authored_by_is_me: boolean }
export interface VariantBom { id: string; bom_ref: string; bom_version: number }
interface VariantRow { id: string; sku_kind?: string; variant_label?: string; bom_ref?: string | null; bom_version?: number | null; created_at?: string }

export const priceableVariants = (rows: DishListRow[]): PriceableVariant[] =>
  rows.flatMap((row) => row.variants.map((variant) => ({ id: variant.set_ref, productId: row.product.id, label: row.product.name, meta: variant.variant_label })));

export const proposerLabel = (row: Pick<PendingPriceRow, "authored_by_name" | "authored_by_is_me">) =>
  row.authored_by_name || (row.authored_by_is_me ? "Bạn" : "Đồng nghiệp");

export const loadPriceableVariants = async () =>
  priceableVariants(await allPages((cursor) => listDishes(`limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`)));

export function pricedVariant(rows: VariantRow[], setRef: string): VariantBom | null {
  const set = rows.find((row) => row.id === setRef);
  if (!set) return null;
  const found = rows
    .filter((row) => row.sku_kind === "PRODUCED_VARIANT" && row.variant_label === set.variant_label && row.bom_ref)
    .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")).at(-1);
  return found ? { id: found.id, bom_ref: found.bom_ref!, bom_version: found.bom_version ?? 1 } : null;
}

export async function getVariantBom(productId: string, setRef: string): Promise<VariantBom | null> {
  const page = await dishRequest<Page<VariantRow>>(`/api/sales/products/${encodeURIComponent(productId)}/variants`);
  return pricedVariant(page.items, setRef);
}

export const listPendingPrices = (cursor = "") =>
  dishRequest<Page<PendingPriceRow>>(`/api/sales/price-book-versions?status=DRAFT&page_size=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);

export const approveFailureMessage = (error: unknown) =>
  error instanceof FetchError && error.status === 409 ? "Người đề xuất không tự duyệt được, nhờ người khác duyệt."
    : safeMessage(error instanceof Error ? error.message : "Lỗi không xác định");
