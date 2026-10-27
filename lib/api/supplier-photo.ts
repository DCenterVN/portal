import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";
import type { PresignSupplierPhotoRequest, FinalizeSupplierPhotoRequest } from "./inventory/types";

const mimeSchema = z.enum(["image/jpeg", "image/png", "image/webp"]);
export const supplierPhotoSchema = z.object({ mime: mimeSchema, size_bytes: z.number().int().min(1).max(5242880), updated_at: z.string().datetime() });
const finalizedSchema = supplierPhotoSchema.extend({ upload_id: z.string().uuid() });
const uploadSchema = z.object({ upload_id: z.string().uuid(), upload_url: z.string().url(), form_fields: z.record(z.string()), expires_in: z.number().int().min(1).max(300) });
const base = (supplier: string) => `suppliers/${encodeURIComponent(supplier)}/photo`;

export function validSupplierPhoto(file: File): boolean {
  return file.size > 0 && file.size <= 5242880 && mimeSchema.safeParse(file.type).success;
}

export function presignSupplierPhoto(supplier: string, file: File, sha256: string, key?: string) {
  if (!validSupplierPhoto(file)) return Promise.reject(new Error("MEDIA_VALIDATION_FAILED"));
  const body: PresignSupplierPhotoRequest = { filename: file.name, content_type: file.type, size_bytes: file.size, sha256 };
  return inventoryRequest(`${base(supplier)}/presign`, uploadSchema, inventoryMutation("POST", body, key));
}

export function finalizeSupplierPhoto(supplier: string, upload: string, key?: string) {
  const body: FinalizeSupplierPhotoRequest = { upload_id: upload };
  return inventoryRequest(`${base(supplier)}/finalize`, finalizedSchema, inventoryMutation("POST", body, key));
}

export async function downloadSupplierPhoto(supplier: string): Promise<string> {
  const result = await inventoryRequest(`${base(supplier)}/download`, z.object({ url: z.string().url(), expires_in: z.literal(300) }));
  return result.url;
}
