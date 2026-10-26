import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";

export const contractDocumentSchema = z.object({ document_id: z.string().uuid(), display_name: z.string(), mime: z.string(), size_bytes: z.number().int().positive(), sha256: z.string() });
export type ContractDocument = z.infer<typeof contractDocumentSchema>;
const presignSchema = z.object({ upload_id: z.string().uuid(), upload_url: z.string().url(), form_fields: z.record(z.string()), expires_in: z.literal(300) });
export type DocumentUpload = z.infer<typeof presignSchema>;
const base = (supplier: string) => `suppliers/${encodeURIComponent(supplier)}/contract-documents`;
export const getDocuments = (supplier: string) => inventoryRequest(base(supplier), z.object({ items: z.array(contractDocumentSchema).nullable().transform(items => items ?? []), next_cursor: z.string().optional() }));
export const finalizeDocument = (supplier: string, upload: string, key?: string) => inventoryRequest(`${base(supplier)}/finalize`, contractDocumentSchema, inventoryMutation("POST", { upload_id: upload }, key));
export async function downloadDocument(supplier: string, document: string): Promise<string> {
  const result = await inventoryRequest(`${base(supplier)}/${encodeURIComponent(document)}/download`, z.object({ url: z.string().url(), expires_in: z.number().positive() }));
  return result.url;
}
export async function presignDocument(supplier: string, file: File, sha256: string, key?: string): Promise<DocumentUpload> {
  if (!validContractFile(file)) throw new Error("Chọn PDF, JPEG, PNG hoặc WebP, tối đa 5 MiB");
  return inventoryRequest(`${base(supplier)}/presign`, presignSchema, inventoryMutation("POST", { filename: file.name, content_type: file.type, size_bytes: file.size, sha256 }, key));
}
export function validContractFile(file: File): boolean {
  return file.size > 0 && file.size <= 5 * 1024 * 1024 && ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(file.type);
}
export async function fileSHA256(file: File): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(bytes), byte => byte.toString(16).padStart(2, "0")).join("");
}
export async function uploadDocument(target: DocumentUpload, file: File): Promise<void> {
  const form = new FormData();
  for (const [key, value] of Object.entries(target.form_fields)) form.append(key, value);
  form.append("file", file);
  const response = await fetch(target.upload_url, { method: "POST", body: form, credentials: "omit" });
  if (!response.ok) throw new Error("Không tải được tệp. Hãy chọn tải lại.");
}
