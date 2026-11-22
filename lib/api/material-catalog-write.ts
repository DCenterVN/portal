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

export type NewMon = { name: string; uom_code: Unit; material_group_code: string };
export const createMon = (input: NewMon, key?: string) => write("/api/sales/skus", "POST", input, key, z.object({ id: z.string() }));
export const updateMon = (id: string, patch: Partial<NewMon>, key?: string) => write(skus(id), "PATCH", patch, key);
export const activateMon = (id: string) => write(`${skus(id)}/activate`, "POST", {});
export const deleteMonImage = (id: string) => write(`${skus(id)}/image`, "DELETE");

export async function suspendMon(id: string, reason: string) {
  if (!reason.trim()) throw new Error("REASON_REQUIRED");
  return write(`${skus(id)}/suspend`, "POST", { reason: reason.trim() });
}

export async function uploadMonImage(id: string, file: File) {
  const sha256 = await fileSHA256(file);
  const target = grant.parse(await write(`${skus(id)}/image-uploads`, "POST", { content_type: file.type, file_size: file.size, sha256 }));
  await uploadDocument(target, file);
  return write(`${skus(id)}/image-uploads/${encodeURIComponent(target.upload_id)}/finalize`, "POST", {});
}

export const createLoai = (input: { code: string; name: string; parent_code?: string }) => write(categories(), "POST", input);
export const renameLoai = (code: string, patch: { name?: string; parent_code?: string }) => write(categories(code), "PATCH", patch);
export const setLoaiActive = (code: string, active: boolean) => write(`${categories(code)}/${active ? "activate" : "deactivate"}`, "POST", {});

export const NAME_HAS_QUANTITY = 'Tên nguyên liệu không ghi khối lượng hay quy cách, ví dụ bỏ "1kg", "500ml"';

export const UNIT_LOCKED = "Chỉ đổi đơn vị khi nguyên liệu còn là nháp";

export function viMessage(error: unknown, kind: "mon" | "loai"): string {
  const status = error instanceof FetchError ? error.status : 0;
  if (status === 403) return "Bạn không có quyền làm việc này";
  if (status === 409) {
    if (error instanceof FetchError && error.code === "duplicate_resource") return kind === "mon" ? "Đã có nguyên liệu tên này" : "Đã có loại hoặc nhóm này";
    if (kind === "mon" && error instanceof FetchError && /đơn vị gốc/i.test(error.message)) return UNIT_LOCKED;
    return kind === "mon" ? "Nguyên liệu đã đổi trạng thái, hãy tải lại danh sách" : "Loại còn nhóm đang dùng hoặc đang gắn nhà cung cấp";
  }
  if (status === 422 && error instanceof FetchError && error.message.startsWith("name_has_quantity")) return NAME_HAS_QUANTITY;
  if (status === 422) return "Thông tin chưa hợp lệ, hãy kiểm tra lại";
  return "Chưa làm được, hãy thử lại sau";
}
