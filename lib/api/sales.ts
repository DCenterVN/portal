import { apiFetch } from "@/lib/fetcher";

export interface Product { id: string; sku_code: string; name: string; description?: string; barcode?: string; uom: string; base_price_vnd: number; status: "DRAFT" | "ACTIVE" | "SUSPENDED"; created_at: string; updated_at?: string; }
export interface CreateProductInput { sku_code: string; name: string; description?: string; uom: string; base_price_vnd: number; }
export interface CartItem { product_id: string; sku_code: string; name: string; quantity: number; price_snapshot_vnd: number; uom: string; }
export interface Cart { id: string; items: CartItem[]; total_amount_vnd: number; }
export interface Order { id: string; cart_ref: string; status: "CREATED" | "CANCELLED"; subtotal_vnd: number; total_vnd: number; branch_ref?: string; created_at: string; }
export interface SalesCartResponse { cart: { id: string; status: "ACTIVE" | "CHECKED_OUT"; version: number }; items: Array<{ sku_ref: string; quantity: number; price_snapshot_vnd: number }> }
export type DataSource = "api" | "unavailable";
export interface DataResult<T> { data: T; source: DataSource; error?: string; }

type SalesProduct = Omit<Product, "uom"> & { uom_code: string };
function normalizeProduct(product: SalesProduct): Product { return { ...product, uom: product.uom_code }; }
async function errorMessage(res: Response, fallback: string) { const body = await res.json().catch(() => ({})); return body.message || body.error || fallback; }

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

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const res = await apiFetch("/api/sales/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_code: input.sku_code, name: input.name, description: input.description, uom_code: input.uom, base_price_vnd: input.base_price_vnd, temperature_regime: "AMBIENT", sku_type: "SINGLE" }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo sản phẩm"));
  return normalizeProduct(await res.json());
}
export async function activateProduct(id: string): Promise<Product> {
  const res = await apiFetch(`/api/sales/products/${encodeURIComponent(id)}/activate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể kích hoạt sản phẩm"));
  return normalizeProduct(await res.json());
}
export async function addToCart(cartId: string, item: { product_id: string; quantity: number }): Promise<SalesCartResponse> {
  const res = await apiFetch(`/api/sales/carts/${encodeURIComponent(cartId)}/items`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sku_ref: item.product_id, quantity: item.quantity }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể thêm vào giỏ hàng"));
  return res.json();
}
export async function createOrder(cartRef: string): Promise<Order> {
  const res = await apiFetch("/api/sales/orders", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify({ cart_ref: cartRef }) });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo đơn hàng"));
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
    const product = knownProduct?.id === item.sku_ref ? knownProduct : undefined;
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
