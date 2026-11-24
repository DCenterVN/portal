export const supplierSuspendReasons = [
  { code: "QUALITY", label: "Chất lượng hàng không đạt" },
  { code: "DELIVERY", label: "Giao hàng chậm hoặc thiếu" },
  { code: "DOCUMENTS", label: "Thiếu hoặc sai chứng từ" },
  { code: "BUSINESS_CLOSED", label: "Ngừng kinh doanh" },
  { code: "OTHER", label: "Lý do khác" },
] as const;

export function supplierReasonNoteRequired(operation: "SUSPEND" | "ACTIVATE", code: string): boolean {
  return operation === "ACTIVATE" || code === "OTHER";
}
