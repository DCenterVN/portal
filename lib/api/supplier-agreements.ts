import { z } from "zod";
import { inventoryMutation, inventoryRequest, inventoryPages } from "./suppliers";
import { getMaterials, type Material } from "./sales";
import { FetchError } from "@/lib/fetcher";

export const agreementLineSchema = z.object({
  sku_ref: z.string().uuid(), uom: z.string(), unit_price_vnd: z.number().int().nonnegative(),
  valid_from: z.string(), valid_to: z.string(), tax_treatment: z.string(), delivery_treatment: z.string(),
  dataset_mode: z.enum(["REAL", "DEMO"]).optional(), price_line_ref: z.string().optional(),
  price_source_evidence: z.object({ url: z.string(), sha256: z.string(), quote: z.string(), observed_at: z.string() }).optional(),
});
export const agreementSchema = z.object({
  agreement_id: z.string().uuid(), version_id: z.string().uuid(), version: z.number().int().positive(),
  code: z.string(), status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "EXPIRED"]), effective_status: z.string().optional(),
  valid_from: z.string(), valid_to: z.string(),
  // ponytail: inventory trả nil UUID (D-307), gỡ khi inventory trả null
  document_ref: z.string().uuid().nullish().transform(value => value === "00000000-0000-0000-0000-000000000000" ? null : value),
  primary_document_ref: z.string().uuid().nullish(), document_attached_at: z.string().datetime().nullish(),
  status_reason: z.string().nullish(), created_at: z.string(), lines: z.array(agreementLineSchema),
});
export type Agreement = z.infer<typeof agreementSchema>;
export type AgreementLine = z.infer<typeof agreementLineSchema>;
export type AgreementInput = {
  code: string; status: "DRAFT" | "ACTIVE" | "SUSPENDED"; valid_from: string; valid_to: string;
  document_ref?: string | null; status_reason?: string; dataset_mode: "REAL" | "DEMO"; lines: AgreementLine[];
};
const page = z.object({ items: z.array(agreementSchema).nullable().transform(items => items ?? []), next_cursor: z.string().nullish().transform(value => value ?? "") });
const base = (supplier: string) => `suppliers/${encodeURIComponent(supplier)}/agreements`;
export const getAgreements = (supplier: string, cursor = "") => inventoryRequest(`${base(supplier)}?${new URLSearchParams({ limit: "100", cursor })}`, page);
export const getAllAgreements = (supplier: string) => inventoryPages(cursor => getAgreements(supplier, cursor));
export const getAgreementVersions = (supplier: string, id: string) => inventoryRequest(`${base(supplier)}/${encodeURIComponent(id)}/versions`, page);
export const createAgreement = (supplier: string, input: AgreementInput, key?: string) => inventoryRequest(base(supplier), agreementSchema, inventoryMutation("POST", input, key));
export const saveAgreementVersion = (supplier: string, id: string, version: number, input: AgreementInput, key?: string) => inventoryRequest(`${base(supplier)}/${encodeURIComponent(id)}/versions`, agreementSchema, inventoryMutation("POST", input, key, version));

export function agreementInput(agreement: Agreement, status: AgreementInput["status"], reason?: string): AgreementInput {
  return { code: agreement.code, status, valid_from: agreement.valid_from, valid_to: agreement.valid_to, document_ref: agreement.document_ref,
    ...(reason === undefined ? {} : { status_reason: reason }), dataset_mode: agreement.lines[0]?.dataset_mode ?? "REAL",
    lines: agreement.lines.map(({ dataset_mode: _mode, price_line_ref: _ref, ...line }) => line) };
}

export type AgreementPriceScope = { sku: string; uom: string; date: string };
export type ResolvedAgreementPrice = AgreementLine & { agreement_version_ref: string };
export type ReceiptReferencePrice = { found: false } | { found: true; price: ResolvedAgreementPrice };
function agreementPriceMatches(agreements: Agreement[], { sku, uom, date }: AgreementPriceScope): ResolvedAgreementPrice[] {
  return agreements.filter(agreement => agreement.status === "ACTIVE" && (!agreement.effective_status || agreement.effective_status === "ACTIVE") && agreement.valid_from <= date && agreement.valid_to >= date)
    .flatMap(agreement => agreement.lines.filter(line => line.sku_ref === sku && line.uom === uom && line.valid_from <= date && line.valid_to >= date).map(line => ({ ...line, agreement_version_ref: agreement.version_id })));
}
export function resolveAgreementPrice(agreements: Agreement[], scope: AgreementPriceScope): ResolvedAgreementPrice | null {
  const matches = agreementPriceMatches(agreements.filter(agreement => Boolean(agreement.document_ref)), scope);
  return matches.length === 1 ? matches[0] : null;
}

export function resolveReceiptReferencePrice(agreements: Agreement[], scope: AgreementPriceScope): ReceiptReferencePrice {
  const matches = agreementPriceMatches(agreements, scope);
  if (matches.length > 1) {
    const error = new FetchError("Có nhiều bảng giá cùng hiệu lực. Tải lại để kiểm tra.", 409);
    error.code = "STATE_CONFLICT";
    throw error;
  }
  return matches.length ? { found: true, price: matches[0] } : { found: false };
}

export const getContractMaterials = (): Promise<Material[]> => inventoryPages(cursor => getMaterials(new URLSearchParams({ cursor }).toString()));
