export const supplierID = "01960000-0000-7000-8000-000000000001";
export const agreementID = "01960000-0000-7000-8000-000000000002";
export const materialID = "01960000-0000-7000-8000-000000000003";
export const documentID = "01960000-0000-7000-8000-000000000004";
export const supplier = { id: supplierID, code: "NCC-GAO", name: "Gạo An Bình", status: "ACTIVE" as const, tax_code: "", contact_name: "Nguyễn An", contact_phone: "0901234567", material_category_codes: ["RICE"], material_categories: [], rating_grade: "B" };
export const agreement = {
  agreement_id: agreementID, version_id: documentID, version: 1, code: "HD-GAO", status: "DRAFT" as const,
  effective_status: "DRAFT", valid_from: "2026-11-01", valid_to: "2026-11-30", document_ref: documentID,
  created_at: "2026-10-25T08:00:00Z", dataset_mode: "REAL" as const,
  lines: [{ sku_ref: materialID, price_line_ref: documentID, uom: "KG", unit_price_vnd: 25000, valid_from: "2026-11-01", valid_to: "2026-11-30", tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED", dataset_mode: "REAL" as const }],
};
export const document = { document_id: documentID, display_name: "bang-gia.png", mime: "image/png", size_bytes: 1024, sha256: "a".repeat(64) };
export const envelope = (data: unknown, code = 200) => ({ code, status: "success", message: "OK", data });
export const material = { id: materialID, sku_code: "GAO-01", name: "Gạo tẻ", category_ref: documentID, uom_code: "KG", selectable: true, season_months: null, season_note: null, reference_price_vnd: 999999, reference_pack_quantity: null, reference_pack_uom: null, reference_observed_at: null, normalized_unit_price: null, price_source: "REFERENCE" };
export const materialPage = { items: [material], categories: [{ id: documentID, name: "Ngũ cốc", slug: "ngu-coc", parent_ref: "" }], next_cursor: "", season_message: "" };
export const supplierActions = ["inventory:supplier:read", "inventory:supplier:create", "inventory:supplier:update", "inventory:goods_receipt:create", "sales:product:read"];
export const employeeContext = { user: { id: supplierID, display_name: "Nhân viên kiểm thử", email: "qa@example.test" }, active_context: { org_id: supplierID, branch_id: materialID }, contexts: [{ org_name: "Kiểm thử", branch_name: "Kho kiểm thử", branch_id: materialID }] };
