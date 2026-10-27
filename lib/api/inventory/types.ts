export type MaterialCategoryLeaf = { code: string; name: string; children: never[] };
export type MaterialCategory = { code: string; name: string; children: MaterialCategoryLeaf[] };
export type MaterialCategoryTreeResponse = { items: MaterialCategory[] };
export type PresignSupplierPhotoRequest = { filename: string; content_type: string; size_bytes: number; sha256: string };
export type FinalizeSupplierPhotoRequest = { upload_id: string };

export type CreateGoodsReceiptLineRequest = {
  sku_ref: string; uom: string; expected_quantity: number;
  unit_cost_vnd?: number; agreement_version_ref?: string; price_line_ref?: string;
};
export type CreateGoodsReceiptRequest = {
  branch_ref: string; supplier_ref: string; expected_at: string; notes?: string;
  expected_lines: CreateGoodsReceiptLineRequest[];
};
