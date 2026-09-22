import { ApiResponseError } from "./errors";

declare const process: { env?: Record<string, string | undefined> } | undefined;

const API_BASE = (typeof process !== "undefined" && process?.env?.NEXT_PUBLIC_API_URL) || "";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiResponseError(
      res.status,
      ((body as Record<string, unknown>).code as string) ?? "unknown",
      ((body as Record<string, unknown>).message as string) ?? res.statusText,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
