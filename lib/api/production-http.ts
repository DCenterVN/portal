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

export class RetryableError extends Error {}

export async function codedFailure(res: Response, fallback: string) {
  if (res.status !== 409) return new Error(await errorMessage(res, fallback));
  const body = await res.clone().json().catch(() => null);
  const error = new FetchError(await errorMessage(res, fallback), 409, body);
  const code = body?.errors?.error_code ?? body?.error_code;
  if (typeof code === "string") error.code = code;
  return error;
}

export async function salesAwareError(res: Response, fallback: string) {
  if (res.status === 503) return new RetryableError("Bán hàng đang lỗi, thử lại sau");
  return codedFailure(res, fallback);
}
