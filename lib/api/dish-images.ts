import { z } from "zod";
import { fileSHA256, uploadDocument } from "@/lib/api/agreement-documents";
import { catalogRequest } from "@/lib/api/material-catalog";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const grant = z.object({ upload_id: z.string(), upload_url: z.string().url(), form_fields: z.record(z.string()) });
const productMediaSchema = z.object({ product: z.object({ id: z.string(), image_urls: z.array(z.string()).nullish().transform(list => list ?? []), updated_at: z.string() }) });
const product = (id: string) => `/api/sales/products/${encodeURIComponent(id)}`;
const media = (value: z.infer<typeof productMediaSchema>) => ({ imageUrls: value.product.image_urls, updatedAt: value.product.updated_at });
const write = <T>(url: string, body: unknown, schema: { parse(value: unknown): T }, method = "POST") =>
  catalogRequest(url, schema, { method, headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(body) });

export type DishMedia = { imageUrls: string[]; updatedAt: string };

export function validateDishImage(file: File) {
  if (!TYPES.includes(file.type) || file.size <= 0 || file.size > MAX_BYTES) throw new Error("Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MB");
}

export const fetchDishMedia = async (productId: string): Promise<DishMedia> => media(await catalogRequest(product(productId), productMediaSchema));

const reorder = (productId: string, expectedUpdatedAt: string, order: ({ upload_id: string } | { position: number })[]) =>
  write(product(productId), { expected_updated_at: expectedUpdatedAt, image_order: order }, productMediaSchema, "PATCH").then(media);

export async function uploadDishImage(productId: string, file: File, expectedUpdatedAt?: string, existingCount?: number): Promise<DishMedia> {
  validateDishImage(file);
  const current = expectedUpdatedAt === undefined || existingCount === undefined ? await fetchDishMedia(productId) : null;
  const updatedAt = expectedUpdatedAt ?? current?.updatedAt ?? "";
  const count = existingCount ?? current?.imageUrls.length ?? 0;
  const sha256 = await fileSHA256(file);
  const target = await write(`${product(productId)}/image-uploads`, { content_type: file.type, file_size: file.size, sha256 }, grant);
  await uploadDocument(target, file);
  await write(`${product(productId)}/image-uploads/${encodeURIComponent(target.upload_id)}/finalize`, {}, z.unknown());
  return reorder(productId, updatedAt, [{ upload_id: target.upload_id }, ...Array.from({ length: Math.min(count, 3) }, (_, position) => ({ position }))]);
}

export function removeDishImage(productId: string, removeIndex: number, existingCount: number, expectedUpdatedAt: string): Promise<DishMedia> {
  const order = Array.from({ length: existingCount }, (_, index) => index).filter(index => index !== removeIndex).map(position => ({ position }));
  return reorder(productId, expectedUpdatedAt, order);
}
