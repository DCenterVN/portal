export class FetchError extends Error {
  info: unknown;
  status: number;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

export async function fetcher<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);

  if (!res.ok) {
    let errorInfo: Record<string, unknown> | null = null;
    try {
      errorInfo = (await res.json()) as Record<string, unknown>;
    } catch {
      errorInfo = { message: res.statusText };
    }

    const message =
      (errorInfo && typeof errorInfo.message === "string" && errorInfo.message) ||
      (errorInfo && typeof errorInfo.error === "string" && errorInfo.error) ||
      `An error occurred while fetching data (${res.status})`;

    throw new FetchError(message, res.status, errorInfo);
  }

  return (await res.json()) as T;
}

export async function mutationFetcher<T = unknown, Extra = unknown>(
  url: string,
  { arg }: { arg?: Extra }
): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: arg !== undefined ? JSON.stringify(arg) : undefined,
  });
}
