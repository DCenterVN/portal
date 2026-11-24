export const productionOrderStatuses: Record<string, string> = {
  HANDED_OFF: "Chờ bếp nhận", ACCEPTED: "Bếp đã nhận", SCHEDULED: "Đã lên lịch", ALLOCATED: "Đã cấp nguyên liệu",
  IN_PROGRESS: "Đang nấu", COMPLETED: "Chờ QC", QC_PASSED: "Đạt QC", QC_FAILED: "Không đạt QC", FAILED: "Hỏng mẻ",
};

export const packStatusLabels: Record<string, string> = { DRAFT: "Nháp", ACTIVE: "Đang dùng", RETIRED: "Đã ngừng" };

export const failableOrderStatuses = ["HANDED_OFF", "ACCEPTED", "SCHEDULED", "ALLOCATED", "IN_PROGRESS"];

export const targetStatuses: Record<string, string> = {
  DRAFT: "Nháp", APPROVED: "Đã duyệt", IN_PLANNING: "Đang lập kế hoạch", HANDED_OFF: "Đã bàn giao",
  IN_PRODUCTION: "Đang sản xuất", COMPLETED: "Hoàn tất", REJECTED: "Bị từ chối",
};

export const planStatuses: Record<string, string> = {
  DRAFT: "Nháp", REVIEWED: "Đã thẩm định", PUBLISHING: "Đang công bố", WAITING_PRICE_APPROVAL: "Chờ duyệt giá",
  READY_FOR_HANDOFF: "Sẵn sàng bàn giao", PUBLISHED: "Đã công bố", REJECTED: "Bị từ chối",
};
