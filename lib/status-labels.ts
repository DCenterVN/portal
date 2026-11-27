const LABELS: Record<string, string> = {
  DRAFT: "Nháp", SUSPENDED: "Tạm ngưng bán", ACTIVE: "Đang dùng", RETIRED: "Đã ngừng", ARCHIVED: "Đã lưu trữ", APPROVED: "Đã duyệt", REVISION: "Lần sửa",
  PASS: "Đạt", FAIL: "Không đạt", PASSED: "Đạt", FAILED: "Không đạt",
  SUPPLIER_PRICE: "Giá nhà cung cấp", CONTRACT: "Giá hợp đồng", SEED_RETAIL_REFERENCE: "Giá bán lẻ tham khảo",
  PRODUCTION: "Sản xuất", TRANSFER: "Chuyển kho", DELIVERY_RETURN: "Hàng giao hỏng quay về, cần kiểm",
};

export const statusLabel = (code: string) => LABELS[code] ?? "Chưa rõ";
