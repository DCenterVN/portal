import { z } from "zod";
import { apiFetch, FetchError } from "@/lib/fetcher";
import { decodePlatform } from "./platform-contract";

export const supplierSchema = z.object({
  id: z.string().uuid(), code: z.string(), name: z.string(), status: z.enum(["ACTIVE", "SUSPENDED"]),
  tax_code: z.string().nullish(), address: z.union([z.string(), z.record(z.unknown())]).nullish(),
  material_categories: z.array(z.string()).nullish().transform(items => items ?? []),
  food_safety_credential_media_ref: z.string().nullable().optional(), rating_grade: z.string().optional(),
  created_at: z.string().optional(), updated_at: z.string().optional(),
});
export type Supplier = z.infer<typeof supplierSchema>;
export type SupplierInput = { code: string; name: string; tax_code?: string; material_categories: string[] };
export const supplierPageSchema = z.object({ items: z.array(supplierSchema).nullable().transform(items => items ?? []), next_cursor: z.string().nullish().transform(value => value ?? "") });
export type SupplierPage = z.infer<typeof supplierPageSchema>;

export async function inventoryPages<T>(load: (cursor: string) => Promise<{ items: T[]; next_cursor: string }>): Promise<T[]> {
  const items: T[] = [];
  const seen = new Set<string>();
  let cursor = "";
  do {
    const page = await load(cursor);
    items.push(...page.items);
    cursor = page.next_cursor;
    if (cursor && seen.has(cursor)) throw new Error("Danh sách trả lại trang trùng. Hãy thử lại.");
    seen.add(cursor);
  } while (cursor);
  return items;
}

export async function inventoryRequest<T>(path: string, schema: { parse(value: unknown): T }, init?: RequestInit): Promise<T> {
  const response = await apiFetch(`/api/inventory/${path}`, { ...init, cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = z.object({ message: z.string().optional(), errors: z.object({ error_code: z.string().optional(), message: z.string().optional() }).optional() }).safeParse(payload);
    const error = new FetchError(parsed.success ? parsed.data.errors?.message ?? parsed.data.message ?? "Không thể thực hiện yêu cầu kho" : "Không thể thực hiện yêu cầu kho", response.status, payload);
    if (parsed.success) error.code = parsed.data.errors?.error_code;
    throw error;
  }
  return decodePlatform(payload, schema);
}

export function inventoryMutation(method: "POST" | "PATCH", body: unknown, key = crypto.randomUUID(), version?: number): RequestInit {
  return { method, headers: { "Content-Type": "application/json", "Idempotency-Key": key, ...(version === undefined ? {} : { "If-Match": String(version) }) }, body: JSON.stringify(body) };
}

export function getSuppliers({ q = "", status = "", cursor = "" } = {}): Promise<SupplierPage> {
  const query = new URLSearchParams({ limit: "20", q, cursor });
  if (status) query.set("status", status);
  return inventoryRequest(`suppliers?${query}`, supplierPageSchema);
}
export const getSupplier = (id: string) => inventoryRequest(`suppliers/${encodeURIComponent(id)}`, supplierSchema);
export const getActiveSuppliers = () => inventoryPages(cursor => getSuppliers({ status: "ACTIVE", cursor }));
export const createSupplier = (input: SupplierInput, key?: string) => inventoryRequest("suppliers", supplierSchema, inventoryMutation("POST", input, key));
export const updateSupplier = (id: string, input: Partial<Omit<SupplierInput, "code">>, key?: string) => inventoryRequest(`suppliers/${encodeURIComponent(id)}`, supplierSchema, inventoryMutation("PATCH", input, key));
export const suspendSupplier = (id: string, operation: "SUSPEND" | "ACTIVATE", reason: string, key?: string) => inventoryRequest(`suppliers/${encodeURIComponent(id)}/suspend`, supplierSchema, inventoryMutation("POST", { operation, reason }, key));
