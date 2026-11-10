export function publicText(value: string | null | undefined, fallback = "Chưa có thông tin") {
  return !value?.trim() || /KHO-|SEED-|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(value) ? fallback : value;
}

export function qualityLabel(status: string) {
  if (["PASS", "PASSED"].includes(status)) return "Đạt kiểm tra chất lượng";
  if (["FAIL", "FAILED"].includes(status)) return "Chưa đạt kiểm tra chất lượng";
  return "Chưa có kết quả kiểm tra";
}

export const stageLabels: Record<string, string> = {
  HANDOFF: "Bàn giao sản xuất", LOT_ALLOCATION: "Cấp phát nguyên liệu",
  PREPARATION: "Sơ chế", COOKING: "Nấu chín", PACKAGING: "Đóng gói",
  QC: "Kiểm tra chất lượng", SHELF_PLACEMENT: "Lên kệ phân phối",
};
