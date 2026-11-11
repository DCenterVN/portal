export async function errorMessage(res: Response, fallback: string) {
  if (res.status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.";
  if (res.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  return fallback || "Không tải được dữ liệu. Thử lại sau.";
}

export async function responseData<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

export function mutationHeaders(key = crypto.randomUUID()) {
  return { "Content-Type": "application/json", "Idempotency-Key": key };
}
