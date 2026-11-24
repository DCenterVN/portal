import { FetchError } from "@/lib/fetcher";

export const qcWhoCanDecide = "Chỉ nhân viên Chế biến hoặc Quản trị được kiểm chất lượng thành phẩm.";

export function qcFailureMessage(error: unknown) {
  if (!(error instanceof Error)) return "Lỗi không xác định";
  if (!(error instanceof FetchError) || error.status !== 403) return error.message;
  if (/SoD/i.test(error.serviceMessage)) return "Bạn đã nấu hoặc đóng gói mẻ này nên không tự kiểm được. Nhờ một nhân viên Chế biến khác kiểm thay.";
  return `${qcWhoCanDecide} Nhờ quản trị cấp quyền hoặc đổi sang tài khoản đúng vai.`;
}
