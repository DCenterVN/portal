import { z } from "zod";
import { fetcher, FetchError } from "@/lib/fetcher";
import { decodePlatform } from "./platform-contract";
import { materialNutritionSchema, type MaterialNutrition } from "@/lib/nutrition";

const materialPageSchema = z.object({
  items: z.array(z.object({ id: z.string(), nutrition_facts: z.unknown() })).nullable().transform(items => items ?? []),
  next_cursor: z.string().nullish(),
});

export async function getMaterialNutrition(id: string, name: string): Promise<MaterialNutrition | null> {
  const query = new URLSearchParams({ kind: "RAW_MATERIAL", q: name, include_unknown: "true", limit: "100" });
  let cursor = "";
  do {
    query.set("cursor", cursor);
    const page = decodePlatform(await fetcher(`/api/sales/skus?${query}`), materialPageSchema);
    const material = page.items.find(item => item.id === id);
    if (material) return materialNutritionSchema.nullable().parse(material.nutrition_facts);
    cursor = page.next_cursor ?? "";
  } while (cursor);
  throw new FetchError("Không tìm thấy nguyên liệu", 404, { error: "resource_not_found" });
}

export async function materialNutritionRequest(id: string, input: MaterialNutrition): Promise<MaterialNutrition | null> {
  const envelope = await fetcher(`/api/sales/skus/${encodeURIComponent(id)}/nutrition`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const data = decodePlatform(envelope, z.object({ nutrition_facts: materialNutritionSchema.nullable() }));
  return data.nutrition_facts;
}
export function nutritionErrorMessage(error: unknown) {
  if (!(error instanceof FetchError)) return "Không kết nối được dịch vụ. Thử lại sau ít phút.";
  const info = error.info as { error?: string | { code?: string }; code?: string; errors?: { error_code?: string } } | null;
  const code = info?.errors?.error_code ?? (typeof info?.error === "object" ? info.error?.code : info?.error ?? info?.code);
  if (code === "validation_failed" || error.status === 422) return "Số liệu hoặc nguồn dinh dưỡng chưa hợp lệ. Kiểm tra các ô và lưu lại.";
  if (code === "data_scope_denied" || error.status === 403) return "Tài khoản của bạn chưa có quyền sửa dinh dưỡng nguyên liệu này.";
  if (code === "resource_not_found" || error.status === 404) return "Không tìm thấy nguyên liệu. Hãy chọn lại nguyên liệu rồi tải lại dinh dưỡng.";
  if (code === "state_conflict" || error.status === 409) return "Dữ liệu vừa được người khác sửa. Tải lại để xem bản mới.";
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Đăng nhập lại để tiếp tục.";
  return "Hệ thống tạm bận, thử lại sau ít phút.";
}
