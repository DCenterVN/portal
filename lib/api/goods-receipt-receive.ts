import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";
export { fileSHA256, uploadDocument as uploadReceiptEvidence } from "./agreement-documents";

export type EvidencePurpose = "DELIVERED_GOODS" | "DELIVERY_DOCUMENT" | "QUANTITY_VARIANCE";
export type ReceiptEvidenceInput = {
  goods_receipt_line_id: string; receive_attempt_ref: string; purpose: EvidencePurpose;
  content_type: string; size_bytes: number; sha256: string;
};
export type ReceiveReceiptInput = {
  goods_receipt_line_id: string; receive_attempt_ref: string; evidence_refs: string[];
  supplier_lot_code: string; sku_ref: string; initial_quantity: number; expiry_date: string;
  received_temperature_celsius: number; uom: string;
};
export type QuantityVarianceInput = {
  receive_attempt_ref: string; evidence_refs: string[]; expected_quantity: number; actual_quantity: number; explanation: string;
};
const presignSchema = z.object({ upload_id: z.string().uuid(), upload_url: z.string().url(), form_fields: z.record(z.string()), expires_in: z.literal(300) });
const finalizedSchema = z.object({ media_ref: z.string().uuid(), sha256: z.string().regex(/^[a-fA-F0-9]{64}$/), content_type: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]), size_bytes: z.number().int().positive().max(5242880), status: z.literal("FINALIZED") });
const lotSchema = z.object({ id: z.string().uuid(), status: z.enum(["RECEIVED", "UNDER_QC"]) });
const varianceSchema = z.object({ id: z.string().uuid() });
const base = (receipt: string) => `goods-receipts/${encodeURIComponent(receipt)}`;
export const presignReceiptEvidence = (receipt: string, body: ReceiptEvidenceInput, key: string) => inventoryRequest(`${base(receipt)}/evidence-uploads`, presignSchema, inventoryMutation("POST", body, key));
export const finalizeReceiptEvidence = (receipt: string, upload: string, key: string) => inventoryRequest(`${base(receipt)}/evidence-uploads/${encodeURIComponent(upload)}/finalize`, finalizedSchema, inventoryMutation("POST", {}, key));
export const receiveReceiptLine = (receipt: string, body: ReceiveReceiptInput, key: string) => inventoryRequest(`${base(receipt)}/receive`, lotSchema, inventoryMutation("POST", body, key));
export const recordQuantityVariance = (receipt: string, body: QuantityVarianceInput, key: string) => inventoryRequest(`${base(receipt)}/quantity-variances`, varianceSchema, inventoryMutation("POST", body, key));
