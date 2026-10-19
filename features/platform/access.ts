import { permissionsSchema } from "@/lib/api/platform-contract";

export type AccessState = { status: "ready"; actions: ReadonlySet<string>; role?: string } | { status: "denied" | "blocked" };

export function platformAccess(status: number, body: unknown): AccessState {
  const access = companyAccess(status, body);
  if (access.status !== "ready") return access;
  return access.actions.has("org:role:update") ? access : { status: "denied" };
}

export function companyAccess(status: number, body: unknown): AccessState {
  if (status !== 200) return { status: status === 401 || status === 403 || status === 404 ? "denied" : "blocked" };
  try {
    return { status: "ready", actions: new Set(permissionsSchema.parse(body).action_keys) };
  } catch {
    return { status: "blocked" };
  }
}

export function hasAction(access: AccessState, action: string): boolean {
  return access.status === "ready" && access.actions.has(action);
}

const timeFormat = new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" });

export function formatTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : timeFormat.format(date);
}

export function errorStatus(error: unknown): number {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === "number" ? status : 0;
}

// Per-operation text for statuses whose meaning depends on the call (409 break-glass vs 409 last admin).
export type ErrorOverrides = Partial<Record<400 | 403 | 404 | 409, string>>;

export function errorText(error: unknown, overrides: ErrorOverrides = {}): string {
  const status = errorStatus(error);
  const override = overrides[status as keyof ErrorOverrides];
  if (override) return override;
  const message = error instanceof Error && error.message ? error.message : "";
  if (status === 400) return message ? `Dữ liệu không hợp lệ: ${message}` : "Dữ liệu không hợp lệ.";
  if (status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy dữ liệu.";
  if (status === 409) return message ? `Xung đột trạng thái: ${message}` : "Xung đột trạng thái, hãy tải lại.";
  if (status === 0 || status === 502 || status === 503 || status === 504) return "Dịch vụ tổ chức hiện không khả dụng. Truy cập bị chặn cho tới khi xác minh lại được.";
  return "Đã xảy ra lỗi không mong muốn. Hãy thử lại.";
}
