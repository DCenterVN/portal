import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";
import { apiFetch } from "@/lib/fetcher";

export interface Product { id: string; sku_code: string; name: string; description?: string; barcode?: string; uom: string; base_price_vnd: number; status: "DRAFT" | "ACTIVE" | "SUSPENDED"; created_at: string; updated_at?: string; sku_ref?: string; }
export interface CreateProductInput { sku_code: string; name: string; description?: string; uom: string; base_price_vnd: number; }
export interface CartItem { product_id: string; sku_code: string; name: string; quantity: number; price_snapshot_vnd: number; uom: string; }
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
function mutationHeaders() { return { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }; }

export async function getProducts(): Promise<DataResult<Product[]>> {
  try {
    const res = await apiFetch("/api/sales/products");
    if (!res.ok) return { data: [], source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    const payload = await res.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return { data: items.map(normalizeProduct), source: "api" };
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

interface CatalogEntry { product: { id: string; name: string; description?: string; created_at: string }; variants: Array<{ id: string; sku_code: string; uom_code: string; unit_price_vnd: number }> }
function catalogToProduct({ product, variants }: CatalogEntry): Product {
  const v = variants[0]; // ponytail: first variant stands for the product, variant picker when the store needs it
  return { id: product.id, sku_ref: v?.id, sku_code: v?.sku_code ?? "", name: product.name, description: product.description, uom: v?.uom_code ?? "", base_price_vnd: v?.unit_price_vnd ?? 0, status: "ACTIVE", created_at: product.created_at };
}

export async function getCatalog(): Promise<DataResult<Product[]>> {
  try {
    const res = await fetch("/api/public/catalog?page_size=100");
    if (!res.ok) return { data: [], source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    const payload = await res.json();
    const items: CatalogEntry[] = (payload?.data ?? payload)?.items ?? [];
    return { data: items.map(catalogToProduct), source: "api" };
  } catch (error) {
    return { data: [], source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}

export async function getCatalogProduct(id: string): Promise<DataResult<Product | null>> {
  try {
    const res = await fetch(`/api/public/catalog/${encodeURIComponent(id)}`);
    if (res.status === 404) return { data: null, source: "api" };
    if (!res.ok) return { data: null, source: "unavailable", error: await errorMessage(res, `Sales API trả về ${res.status}`) };
    const payload = await res.json();
    return { data: catalogToProduct(payload?.data ?? payload), source: "api" };
  } catch (error) {
    return { data: null, source: "unavailable", error: error instanceof Error ? error.message : "Không kết nối được Sales API" };
  }
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await apiFetch("/api/sales/products", { method: "POST", headers: mutationHeaders(), body: JSON.stringify({ sku_code: input.sku_code, name: input.name, description: input.description, uom_code: input.uom, base_price_vnd: input.base_price_vnd, temperature_regime: "AMBIENT", sku_type: "SINGLE" }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo sản phẩm"));
  return normalizeProduct(await res.json());
}
export async function activateProduct(id: string): Promise<Product> {
  const res = await apiFetch(`/api/sales/products/${encodeURIComponent(id)}/activate`, { method: "POST", headers: mutationHeaders(), body: "{}" });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể kích hoạt sản phẩm"));
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

export async function addToCart(cartId: string, item: { product_id: string; quantity: number }): Promise<SalesCartResponse> {
  const res = await apiFetch(`/api/sales/carts/${encodeURIComponent(cartId)}/items`, { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ sku_ref: item.product_id, quantity: item.quantity }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể thêm vào giỏ hàng"));
  return res.json();
}
export async function getCart(cartId: string): Promise<SalesCartResponse> {
  const res = await apiFetch(`/api/sales/carts/${encodeURIComponent(cartId)}`);
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tải giỏ hàng"));
  return res.json();
}
export async function createOrder(cartRef: string): Promise<Order> {
  const res = await apiFetch("/api/sales/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ cart_ref: cartRef }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo đơn hàng"));
  return decodePlatform(await res.json(), orderDisplaySchema);
}
const orderDisplaySchema = z.object({
  id: z.string(), order_code: z.string().optional(), cart_ref: z.string(), status: z.string(),
  subtotal_vnd: z.number(), total_vnd: z.number(), branch_ref: z.string().optional(), created_at: z.string(),
});

export async function getOrderDisplay(): Promise<z.infer<typeof orderDisplaySchema>[]>;
export async function getOrderDisplay(id: string): Promise<z.infer<typeof orderDisplaySchema>>;
export async function getOrderDisplay(id?: string) {
  const path = id ? `/api/sales/orders/${encodeURIComponent(id)}` : "/api/sales/orders?page_size=50";
  const res = await apiFetch(path);
  if (!res.ok) throw new Error("Không thể tải đơn hàng. Thử tải lại.");
  const body: unknown = await res.json();
  return id ? decodePlatform(body, orderDisplaySchema) : decodePlatform(body, z.object({ items: z.array(orderDisplaySchema).nullish() })).items ?? [];
}

export async function cancelOrder(id: string, reason: string): Promise<Order> {
  const res = await apiFetch(`/api/sales/orders/${encodeURIComponent(id)}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể huỷ đơn hàng"));
  return res.json();
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
    return { product_id: item.sku_ref, sku_code: product?.sku_code || known?.sku_code || item.sku_ref, name: product?.name || known?.name || `SKU ${item.sku_ref}`, quantity: item.quantity, price_snapshot_vnd: item.price_snapshot_vnd, uom: product?.uom || known?.uom || "—" };
  });
  window.localStorage.setItem(cartItemsKey, JSON.stringify(next));
}
export function clearCart(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartItemsKey);
  window.localStorage.removeItem("vietsach.cart_id");
}
const vndFormatter = new Intl.NumberFormat("vi-VN");
export function formatVND(amount: number): string { return vndFormatter.format(amount) + " ₫"; }

export interface Material {
  id: string; sku_code: string; name: string; category_ref?: string;
  uom_code: string; selectable: boolean; season_months: number[] | null;
  season_note: string | null; reference_price_vnd: number | null;
  reference_pack_quantity: string | null; reference_pack_uom: string | null;
  reference_observed_at: string | null; normalized_unit_price: string | null;
  price_source: string;
}
export interface MaterialPage {
  items: Material[]; categories: Array<{ id: string; slug: string; name: string; parent_ref: string }>;
  next_cursor: string; season_message: string;
}
export async function getMaterials(query = ""): Promise<MaterialPage> {
  const res = await apiFetch(`/api/sales/skus?kind=RAW_MATERIAL&limit=20&${query}`);
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được nguyên liệu (${res.status})`));
  return responseData<MaterialPage>(res);
}
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
  id: z.string().uuid(),
  org_ref: z.string().uuid(),
  branch_ref: z.string().uuid(),
  product_ref: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1),
  kind: z.enum(["PRODUCED_VARIANT"]),
  sellable: z.literal(false),
  status: z.string(),
  updated_at: z.string().datetime({ offset: true })
}).strict();

const ManualHashtagsSchema = z.array(z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$"))).min(3).max(8).refine(items => new Set(items).size === items.length, "Duplicate values");

const FoodSlotSchema = z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]);

const SetOptionSchema = z.object({
  sku_ref: z.string().uuid(),
  quantity: z.number().int().min(1),
  is_default: z.boolean()
}).strict();

const SetSlotSchema = z.object({
  slot: FoodSlotSchema,
  swappable: z.boolean(),
  removable: z.boolean(),
  options: z.array(SetOptionSchema).min(1)
}).strict();

const FoodSetSchema = z.object({
  id: z.string().uuid(),
  org_ref: z.string().uuid(),
  branch_ref: z.string().uuid(),
  product_ref: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1),
  kind: z.enum(["COMMERCIAL_SET"]),
  sku_type: z.enum(["SET"]),
  sellable: z.literal(false),
  status: z.string(),
  tags: ManualHashtagsSchema,
  system_hashtags: z.array(z.string()),
  slots: z.array(SetSlotSchema).max(6),
  updated_at: z.string().datetime({ offset: true })
}).strict();

const RawAllergensSchema = z.object({
  known: z.boolean(),
  contains: z.array(z.enum(["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"])).refine(items => new Set(items).size === items.length, "Duplicate values")
}).strict().refine(value => value.known || value.contains.length === 0, "Unknown allergens must have empty contains");

const RawLabelsViewSchema = z.object({
  sku_ref: z.string().uuid(),
  allergen_summary: RawAllergensSchema,
  avoidance_flags: z.array(z.enum(["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  diet_flags: z.array(z.enum(["VEGETARIAN", "VEGAN"])).refine(items => new Set(items).size === items.length, "Duplicate values").nullable(),
  updated_at: z.string().datetime({ offset: true })
}).strict();

const CreatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(),
  code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1)
}).strict();

const UpdatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(),
  code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1),
  expected_updated_at: z.string().datetime({ offset: true })
}).strict();

const CreateFoodSetRequestSchema = z.object({
  product_ref: z.string().uuid(),
  code: z.string().min(1),
  name: z.string().min(1),
  variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1),
  tags: ManualHashtagsSchema
}).strict();

const ReplaceFoodSetRequestSchema = z.object({
  tags: ManualHashtagsSchema,
  slots: z.array(SetSlotSchema).min(2).max(6),
  expected_updated_at: z.string().datetime({ offset: true })
}).strict();

const UpdateRawLabelsRequestSchema = z.object({
  allergen_summary: RawAllergensSchema,
  avoidance_flags: z.array(z.enum(["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  diet_flags: z.array(z.enum(["VEGETARIAN", "VEGAN"])).refine(items => new Set(items).size === items.length, "Duplicate values").nullable(),
  expected_updated_at: z.string().datetime({ offset: true })
}).strict();

const FoodPackagePageEnvelopeSchema = z.object({
  code: z.number().int(),
  status: z.string(),
  message: z.string(),
  data: z.object({
  items: z.array(FoodPackageSchema),
  next_cursor: z.string().nullable()
}).strict()
}).strict();

const FoodSetPageEnvelopeSchema = z.object({
  code: z.number().int(),
  status: z.string(),
  message: z.string(),
  data: z.object({
  items: z.array(FoodSetSchema),
  next_cursor: z.string().nullable()
}).strict()
}).strict();

export type FoodPackage = z.infer<typeof FoodPackageSchema>;
export type ManualHashtags = z.infer<typeof ManualHashtagsSchema>;
export type FoodSlot = z.infer<typeof FoodSlotSchema>;
export type SetOption = z.infer<typeof SetOptionSchema>;
export type SetSlot = z.infer<typeof SetSlotSchema>;
export type FoodSet = z.infer<typeof FoodSetSchema>;
export type RawAllergens = z.infer<typeof RawAllergensSchema>;
export type RawLabelsView = z.infer<typeof RawLabelsViewSchema>;
export type CreatePackageRequest = z.infer<typeof CreatePackageRequestSchema>;
export type UpdatePackageRequest = z.infer<typeof UpdatePackageRequestSchema>;
export type CreateFoodSetRequest = z.infer<typeof CreateFoodSetRequestSchema>;
export type ReplaceFoodSetRequest = z.infer<typeof ReplaceFoodSetRequestSchema>;
export type UpdateRawLabelsRequest = z.infer<typeof UpdateRawLabelsRequestSchema>;

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
export function getRawLabels(id: string) { return salesPackRequest(`/skus/${encodeURIComponent(id)}/labels`, RawLabelsViewSchema); }
export function updateRawLabels(id: string, input: UpdateRawLabelsRequest) {
  return salesPackRequest(`/skus/${encodeURIComponent(id)}/labels`, RawLabelsViewSchema, "PATCH", UpdateRawLabelsRequestSchema.parse(input));
}
