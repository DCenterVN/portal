import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";

const attachmentSchema = z.object({
  primary_document_ref: z.string().uuid(),
  document_attached_at: z.string().datetime(),
});

export const attachAgreementDocument = (supplierId: string, agreementId: string, documentRef: string, key?: string) =>
  inventoryRequest(`suppliers/${encodeURIComponent(supplierId)}/agreements/${encodeURIComponent(agreementId)}/documents`, attachmentSchema, inventoryMutation("POST", { document_ref: documentRef }, key));
