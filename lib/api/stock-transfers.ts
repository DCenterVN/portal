import { z } from "zod";
import { inventoryMutation, inventoryPages, inventoryRequest } from "./suppliers";
export { fileSHA256, uploadDocument as uploadTransferEvidence, validContractFile } from "./agreement-documents";

const uuid = z.string().uuid();
const lineSchema = z.object({
  id: uuid, lot_ref: uuid, sku_ref: uuid, uom: z.string(), sent_qty: z.string(),
  received_qty: z.string().nullish(), source_lot_code: z.string().nullish(), source_lot_expires_at: z.string().nullish(), variance_reason: z.enum(["SHORT", "DAMAGED", "OTHER"]).nullish(), dest_lot_ref: uuid.nullish(),
});
const evidenceSchema = z.object({ media_ref: uuid, sha256: z.string(), content_type: z.string(), size_bytes: z.number(), attached_at: z.string() });
export const transferSchema = z.object({
  id: uuid, code: z.string(), from_branch_ref: uuid, to_branch_ref: uuid, from_branch_name: z.string().nullish(), to_branch_name: z.string().nullish(), status: z.enum(["IN_TRANSIT", "RECEIVED", "CANCELLED"]),
  sent_by_ref: uuid, sent_at: z.string(), received_by_ref: uuid.nullish(), received_at: z.string().nullish(),
  cancelled_by_ref: uuid.nullish(), cancelled_at: z.string().nullish(),
  lines: z.array(lineSchema).nullish().transform(items => items ?? []),
  evidence: z.array(evidenceSchema).nullish().transform(items => items ?? []),
});
export type StockTransfer = z.infer<typeof transferSchema>;
export type TransferLine = StockTransfer["lines"][number];
const pageSchema = z.object({ items: z.array(transferSchema).nullish().transform(items => items ?? []), next_cursor: z.string().nullish().transform(value => value ?? "") });
const stockSchema = z.object({
  items: z.array(z.object({ sku_ref: uuid, branch_ref: uuid, available_quantity: z.number(), uom: z.string() })).nullish().transform(items => items ?? []),
  total: z.number().optional(),
});
const lotSchema = z.object({
  items: z.array(z.object({ id: uuid, sku_ref: uuid, branch_ref: uuid, supplier_lot_code: z.string(), remaining_quantity: z.number(), uom: z.string(), expires_at: z.string(), status: z.string() })).nullish().transform(items => items ?? []),
  total: z.number().optional(),
});
export type StockRow = z.infer<typeof stockSchema>["items"][number];
export type LotRow = z.infer<typeof lotSchema>["items"][number];
const presignSchema = z.object({ upload_id: uuid, upload_url: z.string().url(), form_fields: z.record(z.string()), expires_in: z.literal(300) });
const finalizedSchema = z.object({ media_ref: uuid });
const downloadSchema = z.object({ download_url: z.string().url() });

export type CreateTransferInput = { to_branch_ref: string; lines: Array<{ sku_ref: string; uom: string; quantity: string; lot_ref?: string }> };
export type ReceiveTransferInput = { lines: Array<{ line_id: string; received_qty: string; variance_reason?: string }>; evidence_refs: string[] };

const base = (id: string) => `stock-transfers/${encodeURIComponent(id)}`;
export const getTransfers = (status = "") => inventoryPages(cursor => inventoryRequest(`stock-transfers?${new URLSearchParams({ page_size: "100", cursor, ...(status ? { status } : {}) })}`, pageSchema));
export const getTransfer = (id: string) => inventoryRequest(base(id), transferSchema);
export const createTransfer = (input: CreateTransferInput, key?: string) => inventoryRequest("stock-transfers", transferSchema, inventoryMutation("POST", input, key));
export const receiveTransfer = (id: string, input: ReceiveTransferInput, key?: string) => inventoryRequest(`${base(id)}/receive`, transferSchema, inventoryMutation("POST", input, key));
export const cancelTransfer = (id: string, key?: string) => inventoryRequest(`${base(id)}/cancel`, transferSchema, inventoryMutation("POST", {}, key));
export const getStockRows = (branch: string) => inventoryRequest(`stock-levels?${new URLSearchParams({ branch_ref: branch })}`, stockSchema).then(page => page.items.filter(item => item.branch_ref === branch));
export const getBranchLots = (branch: string) => inventoryRequest(`inventory-lots?${new URLSearchParams({ branch_ref: branch, page_size: "1000" })}`, lotSchema).then(page => page.items.filter(item => item.branch_ref === branch));
export const presignTransferEvidence = (id: string, file: File, sha256: string, key?: string) =>
  inventoryRequest(`${base(id)}/evidence-uploads`, presignSchema, inventoryMutation("POST", { content_type: file.type, size_bytes: file.size, sha256 }, key));
export const finalizeTransferEvidence = (id: string, upload: string, key?: string) =>
  inventoryRequest(`${base(id)}/evidence-uploads/${encodeURIComponent(upload)}/finalize`, finalizedSchema, inventoryMutation("POST", {}, key)).then(result => result.media_ref);
export const transferEvidenceUrl = (id: string, media: string) =>
  inventoryRequest(`${base(id)}/evidence/${encodeURIComponent(media)}/download`, downloadSchema).then(result => result.download_url);
