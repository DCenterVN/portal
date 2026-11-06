export async function errorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  return body.message || body.error || fallback;
}

export async function responseData<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

export function mutationHeaders() {
  return { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() };
}
