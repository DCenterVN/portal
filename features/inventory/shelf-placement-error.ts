import { FetchError } from "@/lib/fetcher";
import { requestErrorMessage } from "@/lib/error-message";

export function placementError(error: unknown): string {
  if (error instanceof FetchError && error.status === 409) {
    if (error.code === "insufficient_stock") return "Số lượng vượt quá lượng đang chờ lên kệ của lô này. Danh sách đã được tải lại để xem số mới.";
    if (error.code === "state_conflict") return "Lô này chưa được duyệt hoặc vừa đổi trạng thái. Danh sách đã được tải lại.";
  }
  return requestErrorMessage(error);
}
