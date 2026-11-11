import { catalogNutritionSchema, type CatalogNutrition } from "@/lib/nutrition";
import { buildCatalogQuery, type NutritionFilters } from "@/lib/api/catalog-query";
import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";
import { FetchError, apiFetch } from "@/lib/fetcher";
import { allPages } from "./all-pages";
import { RawAllergensSchema } from "./sales-materials";
export { getMaterials, createMaterial, getRawLabels, updateRawLabels } from "./sales-materials";
export type { Material, MaterialPage, CreateMaterialInput, ExistingMaterial, RawAllergens, RawLabelsView, UpdateRawLabelsRequest } from "./sales-materials";
export type ProductVariant = z.infer<typeof catalogEntrySchema>["variants"][number];
export interface Product { allergen_summary?: z.infer<typeof catalogAllergensSchema> | null; variants?: ProductVariant[]; variant_label?: string | null; portion_count?: number | null; net_weight_g?: number | null; nutrition?: CatalogNutrition | null; id: string; sku_code: string; name: string; description?: string; barcode?: string; uom: string; base_price_vnd?: number; status: "DRAFT" | "ACTIVE" | "SUSPENDED"; created_at: string; updated_at?: string; sku_ref?: string; branch_ref?: string; image_urls?: string[]; available_quantity?: number; }
export interface CreateProductInput { sku_code: string; name: string; description?: string; uom: string; base_price_vnd: number; }
export interface CartItem { product_id: string; sku_code: string; name: string; quantity: number; price_snapshot_vnd: number; uom: string; image_url?: string; }
export interface Cart { id: string; items: CartItem[]; total_amount_vnd: number; }
export type Order = z.infer<typeof orderDisplaySchema>;
export interface SalesCartResponse { cart: { id: string; status: "ACTIVE" | "CHECKED_OUT"; version: number }; items: Array<{ sku_ref: string; quantity: number; price_snapshot_vnd: number }> }
export type DataSource = "api" | "unavailable";
export interface DataResult<T> { data: T; source: DataSource; error?: string; }
export interface PricingPreview {
  output_sku_ref: string;
  cost_snapshot_ref: string;
  policy_version_ref: string;
  floor_multiplier_bps: number;
  material_cost_vnd: number;
  full_cost_per_output_vnd: number;
  minimum_sale_price_vnd: number;
  compliance_status: string;
	component_breakdown: Array<{ input_sku_ref: string; quantity: number; uom: string; unit_cost_vnd: number; subtotal_vnd: number }>;
}
export interface PriceFloorPolicy {
  id: string;
  policy_code: string;
  scope: string;
  scope_ref?: string;
  status: string;
  multiplier_bps: number;
}
type SalesProduct = Omit<Product, "uom"> & { uom_code: string };
function normalizeProduct(product: SalesProduct): Product { return { ...product, uom: product.uom_code }; }
async function errorMessage(res: Response, fallback: string) { const body = await res.json().catch(() => ({})); return body.message || body.error || fallback; }
function mutationHeaders(key = crypto.randomUUID()) { return { "Content-Type": "application/json", "Idempotency-Key": key }; }
export async function getProducts(): Promise<DataResult<Product[]>> {
  try {
    // ponytail: Loads all pages; switch to server search + paging when products reach the thousands.
    const items = await allPages(async cursor => {
      const query = new URLSearchParams({ page_size: "100", cursor });
      const res = await apiFetch(`/api/sales/products?${query}`);
      if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
      return decodePlatform(await res.json(), catalogPageSchema);
    });
    return { data: items.map(catalogToProduct), source: "api" };
  } catch (error) {
    return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}
export async function getProductById(id: string): Promise<DataResult<Product | null>> {
  try {
    const res = await apiFetch(`/api/sales/products/${encodeURIComponent(id)}`);
    if (res.status === 404) return { data: null, source: "api" };
    if (!res.ok) return { data: null, source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    return { data: normalizeProduct(await res.json()), source: "api" };
  } catch (error) {
    return { data: null, source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}
const catalogAllergensSchema = z.object({
  known: z.boolean().default(false),
  contains: RawAllergensSchema.innerType().shape.contains.default([]),
  unknown: z.array(z.string()).default([]),
}).nullish().transform(value => value ?? { known: false, contains: [], unknown: [] });
const catalogEntrySchema = z.object({
  nutrition: catalogNutritionSchema.nullish(),
  product: z.object({
    id: z.string(), name: z.string(), description: z.string().nullish(),
    status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED"]).optional(),
    created_at: z.string(), branch_ref: z.string().optional(),
    image_urls: z.array(z.string()).nullish(),
  }),
  variants: z.array(z.object({
    id: z.string(), sku_code: z.string(), uom_code: z.string(),
    base_price_vnd: z.number().optional(), unit_price_vnd: z.number().optional(),
    available_quantity: z.number().nullish(), sellable: z.boolean().optional(),
    variant_label: z.string().nullish(), portion_count: z.number().positive().nullish(), net_weight_g: z.number().positive().nullish(),
    nutrition: catalogNutritionSchema.nullish(),
    allergen_summary: catalogAllergensSchema,
  })).nullable().transform(items => items ?? []),
});
const catalogPageSchema = z.object({
  items: z.array(catalogEntrySchema).nullable().transform(items => items ?? []),
  next_cursor: z.string().nullish(),
});
function catalogToProduct({ product, variants, nutrition }: z.infer<typeof catalogEntrySchema>): Product {
  const sellableVariants = variants.filter(variant => variant.sellable === true);
  const variant = sellableVariants[0];
  return {
    variants: sellableVariants, variant_label: variant?.variant_label, portion_count: variant?.portion_count, net_weight_g: variant?.net_weight_g,
    nutrition: variant?.nutrition ?? nutrition, id: product.id, name: product.name, description: product.description ?? undefined,
    status: product.status ?? "ACTIVE", created_at: product.created_at,
    branch_ref: product.branch_ref, image_urls: product.image_urls ?? [],
    sku_ref: variant?.id, sku_code: variant?.sku_code ?? "", uom: variant?.uom_code ?? "",
    base_price_vnd: variant?.unit_price_vnd ?? variant?.base_price_vnd,
    available_quantity: variant?.available_quantity ?? undefined,
  };
}

export async function getCatalog({ cursor, ...filters }: NutritionFilters & { cursor?: string; branch_id?: string } = {}): Promise<DataResult<Product[]> & { next_cursor?: string }> {
  try {
    const query = buildCatalogQuery(filters, cursor);
    const res = await fetch(`/api/public/catalog?${query}`);
    if (!res.ok) return { data: [], source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    const page = decodePlatform(await res.json(), catalogPageSchema);
    return { data: page.items.map(catalogToProduct), source: "api", next_cursor: page.next_cursor ?? undefined };
  } catch (error) {
    return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}

export async function getCatalogProduct(id: string, branchId?: string): Promise<DataResult<Product | null>> {
  try {
    const res = await fetch(`/api/public/catalog/${encodeURIComponent(id)}${branchId ? `?branch_id=${encodeURIComponent(branchId)}` : ""}`);
    if (res.status === 404) return { data: null, source: "api" };
    if (!res.ok) return { data: null, source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    return { data: catalogToProduct(decodePlatform(await res.json(), catalogEntrySchema)), source: "api" };
  } catch (error) {
    return { data: null, source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await apiFetch("/api/sales/products", { method: "POST", headers: mutationHeaders(), body: JSON.stringify({ sku_code: input.sku_code, name: input.name, description: input.description, uom_code: input.uom, base_price_vnd: input.base_price_vnd, temperature_regime: "AMBIENT", sku_type: "SINGLE" }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo sản phẩm"));
  return normalizeProduct(await res.json());
}
// ---------------- Pricing Floor & Price Book (VT-04 / VT-15) ----------------

async function responseData<T>(res: Response): Promise<T> {
	const payload = await res.json();
	return (payload?.data ?? payload) as T;
}

export async function getPricingPreview(productId: string, variantId: string, input: { bom_ref: string; bom_version: number; branch_ref?: string }): Promise<PricingPreview> {
	const res = await apiFetch(`/api/sales/products/${encodeURIComponent(productId)}/variants/${encodeURIComponent(variantId)}/pricing-preview`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tính giá sàn tối thiểu"));
	return responseData<PricingPreview>(res);
}

export interface PriceBookVersion { id: string; output_sku_ref: string; status: string; proposed_price_vnd: number; minimum_sale_price_vnd: number; }
export async function proposePrice(priceBookId: string, input: { output_sku_ref: string; bom_ref: string; bom_version: number; proposed_price_vnd: number; effective_from: string; reason: string; branch_ref?: string }): Promise<PriceBookVersion> {
  const res = await apiFetch(`/api/sales/price-books/${encodeURIComponent(priceBookId)}/versions`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể đề xuất giá (giá phải >= sàn và có căn cứ định mức)"));
	return responseData<PriceBookVersion>(res);
}

export async function approvePrice(priceBookId: string, versionId: string): Promise<{ status: string }> {
  const res = await apiFetch(`/api/sales/price-books/${encodeURIComponent(priceBookId)}/versions/${encodeURIComponent(versionId)}/approval`, {
    method: "POST",
    headers: mutationHeaders(),
    body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể duyệt giá bán (kiểm tra SoD hoặc vi phạm giá sàn)"));
	return responseData<{ status: string }>(res);
}

export interface PriceFloorPolicyVersion { ID?: string; id?: string; Status?: string; status?: string; }
export async function createPriceFloorPolicy(input: { scope_type: "ORG" | "PRODUCT" | "VARIANT"; scope_ref?: string }): Promise<{ ID?: string; id?: string }> {
	const res = await apiFetch("/api/sales/price-floor-policies", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(input) });
	if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo chính sách giá sàn"));
	return responseData(res);
}
export async function createPriceFloorPolicyVersion(policyId: string, input: { floor_multiplier_bps: number; cost_basis_method: string; rounding_increment_vnd: number; expected_sellable_yield_rate: number; reason: string }): Promise<PriceFloorPolicyVersion> {
	const res = await apiFetch(`/api/sales/price-floor-policies/${encodeURIComponent(policyId)}/versions`, { method: "POST", headers: mutationHeaders(), body: JSON.stringify(input) });
	if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo phiên bản chính sách"));
	return responseData(res);
}
export async function approvePriceFloorPolicyVersion(policyId: string, versionId: string): Promise<{ status: string }> {
	const res = await apiFetch(`/api/sales/price-floor-policies/${encodeURIComponent(policyId)}/versions/${encodeURIComponent(versionId)}/approval`, { method: "POST", headers: mutationHeaders(), body: "{}" });
	if (!res.ok) throw new Error(await errorMessage(res, "Không thể duyệt chính sách"));
	return responseData(res);
}

export async function addToCart(cartId: string, item: { sku_ref: string; branch_id: string; quantity: number }): Promise<SalesCartResponse> {
  if (!item.sku_ref || !item.branch_id) throw new Error("Món chưa đủ thông tin để thêm vào giỏ");
  const query = new URLSearchParams({ branch_id: item.branch_id });
  const res = await apiFetch(`/api/sales/carts/${encodeURIComponent(cartId)}/items?${query}`, {
    method: "POST", headers: mutationHeaders(),
    body: JSON.stringify({ sku_ref: item.sku_ref, quantity: item.quantity }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể thêm vào giỏ hàng"));
  const cart = decodePlatform(await res.json(), salesCartSchema);
  if (typeof window !== "undefined") window.localStorage.setItem("vietsach.cart_branch", item.branch_id);
  return cart;
}
const salesCartSchema = z.object({
  cart: z.object({ id: z.string(), status: z.enum(["ACTIVE", "CHECKED_OUT"]), version: z.number() }),
  items: z.array(z.object({ sku_ref: z.string(), quantity: z.number(), price_snapshot_vnd: z.number() })),
});
export async function getCart(cartId: string): Promise<SalesCartResponse> {
  const branch = getCartBranch();
  const query = branch ? `?${new URLSearchParams({ branch_id: branch })}` : "";
  const res = await apiFetch(`/api/sales/carts/${encodeURIComponent(cartId)}${query}`);
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tải giỏ hàng"));
  return decodePlatform(await res.json(), salesCartSchema);
}
export const checkoutSchema = z.object({
  recipient_name: z.string().trim().min(1, "Nhập họ tên người nhận"),
  recipient_phone: z.string().trim().regex(/^0[35789]\d{8}$/, "Nhập số điện thoại Việt Nam gồm 10 số"),
  province_code: z.string().min(1, "Chọn tỉnh/thành trong danh sách"),
  commune_code: z.string().min(1, "Chọn xã/phường trong danh sách"),
  delivery_address: z.string().trim().min(1, "Nhập số nhà, tên đường hoặc thôn/xóm"),
  delivery_note: z.string().trim(),
  payment_method: z.enum(["COD", "BANK_TRANSFER"]),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export function getCartBranch(): string {
  return typeof window !== "undefined" ? window.localStorage.getItem("vietsach.cart_branch") ?? "" : "";
}
export async function createOrder(cartRef: string, input: CheckoutInput, key: string): Promise<Order> {
  const delivery = checkoutSchema.parse(input);
  const branch = getCartBranch();
  if (!branch) throw new Error("Chọn lại chi nhánh và thêm món vào giỏ trước khi đặt hàng");
  const res = await apiFetch("/api/sales/orders", {
    method: "POST", headers: mutationHeaders(key),
    body: JSON.stringify({ ...delivery, cart_ref: cartRef, branch_ref: branch, channel: "ONLINE", shipping_fee_vnd: 0 }),
  });
  if (res.status !== 201) {
    const body: unknown = await res.json().catch(() => null);
    const error = z.object({ message: z.string().optional(), error: z.string().optional() }).safeParse(body);
    throw new FetchError(error.success ? error.data.message ?? "Không thể tạo đơn hàng. Vui lòng thử lại." : "Không thể tạo đơn hàng. Vui lòng thử lại.", res.status, body);
  }
  return decodePlatform(await res.json(), orderDisplaySchema);
}
const orderDisplaySchema = z.object({
  id: z.string(), order_code: z.string().optional(), cart_ref: z.string(), status: z.string(),
  subtotal_vnd: z.number(), total_vnd: z.number(), branch_ref: z.string().optional(), created_at: z.string(),
});

export async function getOrderDisplay(): Promise<z.infer<typeof orderDisplaySchema>[]>;
export async function getOrderDisplay(id: string): Promise<z.infer<typeof orderDisplaySchema>>;
export async function getOrderDisplay(id?: string) {
  const path = id ? `/api/sales/orders/${encodeURIComponent(id)}` : "/api/sales/orders";
  const query = new URLSearchParams(id ? {} : { page_size: "50" });
  const branch = getCartBranch();
  if (!branch) throw new Error("Chọn chi nhánh mua hàng để xem đơn của bạn");
  query.set("branch_id", branch);
  const res = await apiFetch(`${path}?${query}`);
  if (!res.ok) throw new Error("Không thể tải đơn hàng. Thử tải lại.");
  const body: unknown = await res.json();
  return id ? decodePlatform(body, orderDisplaySchema) : decodePlatform(body, z.object({ items: z.array(orderDisplaySchema).nullish() })).items ?? [];
}

export async function cancelOrder(id: string, reason: string): Promise<Order> {
  const branch = getCartBranch();
  if (!branch) throw new Error("Chọn chi nhánh mua hàng để huỷ đơn của bạn");
  const res = await apiFetch(`/api/sales/orders/${encodeURIComponent(id)}/cancel?${new URLSearchParams({ branch_id: branch })}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể huỷ đơn hàng"));
  return decodePlatform(await res.json(), orderDisplaySchema);
}
export function getOrCreateCartId(): string {
  if (typeof window === "undefined") throw new Error("Cart ID is only available in the browser");
  const key = "vietsach.cart_id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  window.localStorage.setItem(key, created);
  return created;
}
const cartItemsKey = "vietsach.cart_items";
export function loadCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(window.localStorage.getItem(cartItemsKey) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function recordCartResponse(response: SalesCartResponse, knownProduct?: Product): void {
  const previous = loadCartItems();
  const next = response.items.map((item) => {
    const known = previous.find((entry) => entry.product_id === item.sku_ref);
    const product = (knownProduct?.sku_ref ?? knownProduct?.id) === item.sku_ref ? knownProduct : undefined;
    return { product_id: item.sku_ref, sku_code: product?.sku_code || known?.sku_code || "", name: product?.name || (known?.name?.includes(item.sku_ref) ? undefined : known?.name) || "Món đã chọn", quantity: item.quantity, price_snapshot_vnd: item.price_snapshot_vnd, uom: product?.uom || known?.uom || "—", image_url: product?.image_urls?.[0] || known?.image_url };
  });
  window.localStorage.setItem(cartItemsKey, JSON.stringify(next));
}
export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartItemsKey);
  window.localStorage.removeItem("vietsach.cart_id");
}
export { formatVND } from "@/lib/format";

export interface DraftProduct { id: string; name: string; status: string; }
export async function getDraftProducts(): Promise<DraftProduct[]> {
  const products: DraftProduct[] = [];
  let cursor = "";
  do {
    const res = await apiFetch(`/api/sales/products?page_size=100&cursor=${encodeURIComponent(cursor)}`);
    if (!res.ok) throw new Error(await errorMessage(res, `Không tải được sản phẩm (${res.status})`));
    const page = await responseData<{ items: Array<{ product: DraftProduct }>; next_cursor?: string }>(res);
    products.push(...page.items.map(item => item.product));
    cursor = page.next_cursor ?? "";
  } while (cursor);
  return products;
}
export async function createDraftProduct(input: { name: string; slug: string }): Promise<DraftProduct> {
  const res = await apiFetch("/api/sales/products", { method: "POST", headers: mutationHeaders(), body: JSON.stringify(input) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không tạo được sản phẩm nháp"));
  return (await responseData<{ product: DraftProduct }>(res)).product;
}

// PACK schemas follow sales/api/openapi.public.yaml.
const FoodPackageSchema = z.object({
  id: z.string().uuid(), org_ref: z.string().uuid(), branch_ref: z.string().uuid(), product_ref: z.string().uuid(), code: z.string().min(1),
  name: z.string().min(1), variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1), kind: z.enum(["PRODUCED_VARIANT"]), sellable: z.literal(false),
  status: z.string(), updated_at: z.string().datetime({ offset: true })
}).strict();

const ManualHashtagsSchema = z.array(z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$"))).min(3).max(8).refine(items => new Set(items).size === items.length, "Duplicate values");

const FoodSlotSchema = z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]);

const SetOptionSchema = z.object({
  sku_ref: z.string().uuid(), quantity: z.number().int().min(1), is_default: z.boolean()
}).strict();

const SetSlotSchema = z.object({
  slot: FoodSlotSchema, swappable: z.boolean(), removable: z.boolean(), options: z.array(SetOptionSchema).min(1)
}).strict();

const FoodSetSchema = z.object({
  id: z.string().uuid(), org_ref: z.string().uuid(), branch_ref: z.string().uuid(), product_ref: z.string().uuid(), code: z.string().min(1),
  name: z.string().min(1), variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1), kind: z.enum(["COMMERCIAL_SET"]), sku_type: z.enum(["SET"]),
  sellable: z.literal(false), status: z.string(), tags: ManualHashtagsSchema, system_hashtags: z.array(z.string()),
  slots: z.array(SetSlotSchema).max(6), updated_at: z.string().datetime({ offset: true })
}).strict();

const CreatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"), name: z.string().min(1),
  variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1)
}).strict();

const UpdatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"), name: z.string().min(1),
  variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1), expected_updated_at: z.string().datetime({ offset: true })
}).strict();
const CreateFoodSetRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1), name: z.string().min(1), variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1),
  tags: ManualHashtagsSchema
}).strict();
const ReplaceFoodSetRequestSchema = z.object({
  tags: ManualHashtagsSchema, slots: z.array(SetSlotSchema).min(2).max(6), expected_updated_at: z.string().datetime({ offset: true })
}).strict();
const FoodPackagePageEnvelopeSchema = z.object({
  code: z.number().int(), status: z.string(), message: z.string(), data: z.object({
  items: z.array(FoodPackageSchema), next_cursor: z.string().nullable()
}).strict()
}).strict();
const FoodSetPageEnvelopeSchema = z.object({
  code: z.number().int(), status: z.string(), message: z.string(), data: z.object({
  items: z.array(FoodSetSchema), next_cursor: z.string().nullable()
}).strict()
}).strict();
export type FoodPackage = z.infer<typeof FoodPackageSchema>;
export type ManualHashtags = z.infer<typeof ManualHashtagsSchema>;
export type FoodSlot = z.infer<typeof FoodSlotSchema>;
export type SetOption = z.infer<typeof SetOptionSchema>;
export type SetSlot = z.infer<typeof SetSlotSchema>;
export type FoodSet = z.infer<typeof FoodSetSchema>;
export type CreatePackageRequest = z.infer<typeof CreatePackageRequestSchema>;
export type UpdatePackageRequest = z.infer<typeof UpdatePackageRequestSchema>;
export type CreateFoodSetRequest = z.infer<typeof CreateFoodSetRequestSchema>;
export type ReplaceFoodSetRequest = z.infer<typeof ReplaceFoodSetRequestSchema>;
async function salesPackRequest<T>(path: string, schema: z.ZodType<T>, method = "GET", input?: unknown): Promise<T> {
  const res = await apiFetch(`/api/food-packs/sales${path}`, {
    method, ...(input === undefined ? {} : { headers: mutationHeaders(), body: JSON.stringify(input) }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
  const envelope = z.object({ code: z.number().int(), status: z.string(), message: z.string(), data: z.unknown() }).strict().parse(await res.json());
  return decodePlatform(envelope, schema);
}
async function retireSalesPack(path: string): Promise<void> {
  const res = await apiFetch(`/api/food-packs/sales${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
}
export function createPackage(input: CreatePackageRequest) {
  return salesPackRequest("/packages", FoodPackageSchema, "POST", CreatePackageRequestSchema.parse(input));
}
export function listPackages(filters: { product_ref?: string; cursor?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined) query.set(key, String(value));
  return salesPackRequest(`/packages?${query}`, FoodPackagePageEnvelopeSchema.shape.data);
}
export function getPackage(id: string) {
  return salesPackRequest(`/packages/${encodeURIComponent(id)}`, FoodPackageSchema);
}
export function updatePackage(id: string, input: UpdatePackageRequest) {
  return salesPackRequest(`/packages/${encodeURIComponent(id)}`, FoodPackageSchema, "PUT", UpdatePackageRequestSchema.parse(input));
}
export function retirePackage(id: string) { return retireSalesPack(`/packages/${encodeURIComponent(id)}`); }
export function createFoodSet(input: CreateFoodSetRequest) {
  return salesPackRequest("/sets", FoodSetSchema, "POST", CreateFoodSetRequestSchema.parse(input));
}
export function listFoodSets(filters: { q?: string; tags?: string[]; category_slug?: string; month?: number; cursor?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) value.forEach(tag => query.append(key, tag));
    else if (value !== undefined) query.set(key, String(value));
  }
  return salesPackRequest(`/sets?${query}`, FoodSetPageEnvelopeSchema.shape.data);
}
export function getFoodSet(id: string) { return salesPackRequest(`/sets/${encodeURIComponent(id)}`, FoodSetSchema); }
export function updateFoodSet(id: string, input: ReplaceFoodSetRequest) {
  return salesPackRequest(`/sets/${encodeURIComponent(id)}`, FoodSetSchema, "PUT", ReplaceFoodSetRequestSchema.parse(input));
}
export function retireFoodSet(id: string) { return retireSalesPack(`/sets/${encodeURIComponent(id)}`); }
