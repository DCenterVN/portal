import { FetchError } from "@/lib/fetcher";

export async function errorMessage(res: Response, fallback: string) {
  if (res.status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
  if (res.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    if (typeof body?.message === "string") return body.message;
  }
  return fallback || "Không tải được dữ liệu. Thử lại sau.";
}

export async function apiFailure(res: Response, message: string) {
  const body = await res.json().catch(() => null);
  const error = new FetchError(message, res.status, body);
  const code = body?.errors?.error_code;
  if (typeof code === "string") error.code = code;
  return error;
}

export async function responseData<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

export function mutationHeaders(key = crypto.randomUUID()) {
  return { "Content-Type": "application/json", "Idempotency-Key": key };
}
