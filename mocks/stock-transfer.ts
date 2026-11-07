const pad = (prefix: string, index: number) => `${prefix}-5b6c-7d8e-9f00-${String(index).padStart(12, "0")}`;

export const envelope = (data: unknown) => ({ code: 200, status: "success", message: "OK", data });

export const mockBranches = (count: number) => Array.from({ length: count }, (_, index) => ({
  id: pad("0192f3a4", index + 1), code: `MAU-${index + 1}`, name: `Cửa hàng Mẫu ${index + 1}`, type: "STORE", status: "ACTIVE", employee_count: 0,
}));

export const branchPage = (extra: readonly unknown[], real: readonly unknown[]) => envelope({ items: [...real, ...extra], page: 1, limit: 100 });

export const mockMaterials = (count: number) => Array.from({ length: count }, (_, index) => ({
  id: pad("0192f3a5", index + 1), sku_code: `NL-${index + 1}`, name: `Nguyên liệu mẫu ${index + 1}`, uom_code: "KG", selectable: true,
  season_months: null, season_note: null, reference_price_vnd: null, reference_pack_quantity: null, reference_pack_uom: null,
  reference_observed_at: null, normalized_unit_price: null, price_source: "NONE",
}));

export const materialPage = (items: readonly unknown[]) => envelope({ items, categories: [], next_cursor: "", season_message: "" });

export const mockStock = (count: number, branch: string) => mockMaterials(count).map((material, index) => ({
  id: pad("0192f3a6", index + 1), branch_ref: branch, sku_ref: material.id, on_hand_quantity: index + 1.5, reserved_quantity: 0, available_quantity: index + 1.5, uom: "KG",
  updated_at: "2026-11-07T11:00:00Z",
}));

export const stockPage = (items: readonly unknown[]) => envelope({ items, total: items.length });
