export const productionOrderStatuses: Record<string, string> = {
  HANDED_OFF: "Chờ bếp nhận", ACCEPTED: "Bếp đã nhận", ALLOCATED: "Đã cấp nguyên liệu",
  IN_PROGRESS: "Đang nấu", COMPLETED: "Chờ QC", QC_PASSED: "Đạt QC", QC_FAILED: "Không đạt QC", FAILED: "Hỏng mẻ",
};

export const packStatusLabels: Record<string, string> = { DRAFT: "Nháp", ACTIVE: "Đang dùng", RETIRED: "Đã ngừng" };
