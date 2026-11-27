import { z } from "zod";
import { fetcher } from "@/lib/fetcher";
import { decodePlatform } from "./platform-contract";

const variantSchema = z.object({
  id: z.string(), name: z.string(), variant_label: z.string().nullish(),
  sku_kind: z.string(), sellable: z.boolean(), status: z.string(), version: z.number().int().positive(),
});
const detailSchema = z.object({
  product: z.object({ id: z.string(), status: z.string(), version: z.number().int().positive() }),
  variants: z.array(variantSchema).nullish().transform(items => items ?? []),
});
export type LifecycleDetail = z.infer<typeof detailSchema>;
export type LifecycleInput = {
  operation_id: string; expected_version: number; to_state: "READY" | "ACTIVE";
  reason: string; activate_variant_refs?: string[];
};
export async function getLifecycleDetail(productId: string) {
  return decodePlatform(await fetcher(`/api/sales/products/${encodeURIComponent(productId)}`), detailSchema);
}
export async function transitionProduct(productId: string, input: LifecycleInput, variantId?: string) {
  const path = `/api/sales/products/${encodeURIComponent(productId)}`
    + (variantId ? `/variants/${encodeURIComponent(variantId)}` : "") + "/lifecycle";
  await fetcher(path, {
    method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": input.operation_id },
    body: JSON.stringify(input),
  });
}
const pricePageSchema = z.object({
  items: z.array(z.object({ status: z.string(), effective_from: z.string().nullable(), effective_until: z.string().nullable() })),
  next_cursor: z.string().nullish(),
});
export async function hasApprovedPrice(variantId: string): Promise<boolean> {
  let cursor = "";
  do {
    const query = new URLSearchParams({ limit: "100", cursor });
    const page = decodePlatform(await fetcher(`/api/sales/price-books/${encodeURIComponent(variantId)}/versions?${query}`), pricePageSchema);
    const now = Date.now();
    if (page.items.some(price => price.status === "ACTIVE"
      && (!price.effective_from || Date.parse(price.effective_from) <= now)
      && (!price.effective_until || Date.parse(price.effective_until) > now))) return true;
    cursor = page.next_cursor ?? "";
  } while (cursor);
  return false;
}

const productPath = (id: string) => `/api/sales/products/${encodeURIComponent(id)}`;
const mutation = (method: string, body?: unknown): RequestInit => ({
  method, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() },
  body: body === undefined ? undefined : JSON.stringify(body),
});
export async function updateProduct(id: string, input: { name: string; description: string }) {
  await fetcher(productPath(id), mutation("PATCH", input));
}
export async function suspendProduct(id: string, reason: string) {
  await fetcher(`${productPath(id)}/suspend`, mutation("POST", { reason }));
}
export async function deleteProduct(id: string) {
  await fetcher(productPath(id), mutation("DELETE"));
}
export async function resumeProduct(id: string, reason: string) {
  await fetcher(`${productPath(id)}/resume`, mutation("POST", { reason }));
}
export async function resumeVariant(productId: string, variantId: string, reason: string) {
  await fetcher(`${productPath(productId)}/variants/${encodeURIComponent(variantId)}/resume`, mutation("POST", { reason }));
}
