import { z } from "zod";
import { FetchError } from "@/lib/fetcher";
import { fileSHA256, uploadDocument } from "@/lib/api/agreement-documents";
import { catalogRequest, type Unit } from "@/lib/api/material-catalog";

const any = z.unknown();
const grant = z.object({ upload_id: z.string(), upload_url: z.string().url(), form_fields: z.record(z.string()) });
const skus = (id: string) => `/api/sales/skus/${encodeURIComponent(id)}`;
const categories = (code = "") => `/api/inventory/material-categories${code && `/${encodeURIComponent(code)}`}`;

function write<T = unknown>(url: string, method: "POST" | "PATCH" | "DELETE", body?: unknown, key = crypto.randomUUID(), schema: { parse(value: unknown): T } = any as never) {
  return catalogRequest(url, schema, { method, headers: { "Content-Type": "application/json", "Idempotency-Key": key }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}

export type NewMaterial = { name: string; uom_code: Unit; material_group_code: string };
export const createMaterial = (input: NewMaterial, key?: string) => write("/api/sales/skus", "POST", input, key, z.object({ id: z.string() }));
export const updateMaterial = (id: string, patch: Partial<NewMaterial>, key?: string) => write(skus(id), "PATCH", patch, key);
export const deleteMaterial = (id: string) => write(skus(id), "DELETE");
export const activateMaterial = (id: string) => write(`${skus(id)}/activate`, "POST", {});
export const deleteMaterialImage = (id: string) => write(`${skus(id)}/image`, "DELETE");

export async function suspendMaterial(id: string, reason: string) {
  if (!reason.trim()) throw new Error("REASON_REQUIRED");
  return write(`${skus(id)}/suspend`, "POST", { reason: reason.trim() });
}

export async function uploadMaterialImage(id: string, file: File) {
  const sha256 = await fileSHA256(file);
  const target = grant.parse(await write(`${skus(id)}/image-uploads`, "POST", { content_type: file.type, file_size: file.size, sha256 }));
  await uploadDocument(target, file);
  return write(`${skus(id)}/image-uploads/${encodeURIComponent(target.upload_id)}/finalize`, "POST", {});
}

export const createCategory = (input: { code: string; name: string; parent_code?: string }) => write(categories(), "POST", input);
export const renameCategory = (code: string, patch: { name?: string; parent_code?: string }) => write(categories(code), "PATCH", patch);
export const deleteCategory = (code: string) => write(categories(code), "DELETE");
export const setCategoryActive = (code: string, active: boolean) => write(`${categories(code)}/${active ? "activate" : "deactivate"}`, "POST", {});

export const NAME_HAS_QUANTITY = 'Tên nguyên liệu không ghi khối lượng hay quy cách, ví dụ bỏ "1kg", "500ml"';

export const UNIT_LOCKED = "Chỉ đổi đơn vị khi nguyên liệu còn là nháp";

function errorCodeOf(error: unknown): string {
  if (!(error instanceof FetchError)) return "";
  if (error.code) return error.code;
  const info = error.info as { errors?: { error_code?: unknown }; error_code?: unknown } | undefined;
  if (typeof info?.errors?.error_code === "string") return info.errors.error_code;
  return typeof info?.error_code === "string" ? info.error_code : "";
}

export function viMessage(error: unknown, kind: "material" | "category" | "new-category" | "delete-material"): string {
  const status = error instanceof FetchError ? error.status : 0;
  const code = errorCodeOf(error);
  if (status === 403) return "Bạn không có quyền làm việc này";
  if (status === 409) {
    if (kind === "delete-material") {
      if (code === "resource_in_use" || code === "conflict") return "Chưa xoá được: nguyên liệu đang được dùng trong công thức hoặc bảng giá";
      if (code === "state_conflict" && error instanceof FetchError && /active|đang dùng|ngừng/i.test(error.message)) return "Cần ngừng dùng nguyên liệu trước khi xoá";
      return "Chưa xoá được: nguyên liệu đang được dùng hoặc đã đổi trạng thái, hãy tải lại danh sách";
    }
    if (kind === "new-category") return "Đã có loại hoặc nhóm mã này";
    if (kind === "material" && code === "duplicate_resource") return "Đã có nguyên liệu tên này";
    if (kind === "material" && error instanceof FetchError && /đơn vị gốc/i.test(error.message)) return UNIT_LOCKED;
    return kind === "material" ? "Nguyên liệu đã đổi trạng thái, hãy tải lại danh sách" : "Loại còn nhóm đang dùng hoặc đang gắn nhà cung cấp";
  }
  if (status === 422 && error instanceof FetchError && error.message.startsWith("name_has_quantity")) return NAME_HAS_QUANTITY;
  if (status === 422) return "Thông tin chưa hợp lệ, hãy kiểm tra lại";
  return "Chưa làm được, hãy thử lại sau";
}
