import { cookies } from "next/headers";
import { serviceUrl } from "@/lib/api/service-bff";
import { decodePlatform } from "@/lib/api/platform-contract";

export async function inventoryServerGet<T>(path: string, schema: { parse(value: unknown): T }): Promise<T | undefined> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return undefined;
  try {
    const response = await fetch(`${serviceUrl("inventory")}${path}`, { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) return undefined;
    return decodePlatform(await response.json(), schema);
  } catch {
    return undefined;
  }
}
