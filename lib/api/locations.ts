import { z } from "zod";
import { apiFetch } from "@/lib/fetcher";

const locationListSchema = z.array(z.object({ code: z.string(), name: z.string() })).nullable().transform(items => items ?? []);
export async function getLocations(path: string) {
  const response = await apiFetch(path);
  if (!response.ok) throw new Error("Không tải được địa chỉ. Vui lòng thử lại.");
  return locationListSchema.parse(await response.json());
}
