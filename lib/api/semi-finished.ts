import { z } from "zod";
import { apiFetch, FetchError } from "@/lib/fetcher";
import { safeMessage } from "@/lib/api/dishes";
import { MAX_PREP_NOTE_LENGTH, type Line } from "@/lib/dishes/types";

export const SEMI_SLOTS = ["COT", "NUOC_CHAM", "DO_CHUA"] as const;
export type SemiSlot = (typeof SEMI_SLOTS)[number];

export const SEMI_KINDS = ["COT", "SOT", "NUOC_CHAM", "DO_CHUA"] as const;
export type SemiKind = (typeof SEMI_KINDS)[number];

export const semiSlotLabels: Record<SemiSlot, string> = {
  COT: "Cốt & sốt nấu",
  NUOC_CHAM: "Nước chấm / trộn",
  DO_CHUA: "Đồ chua muối bếp",
};

export const semiKindLabels: Record<SemiKind, string> = {
  COT: "Cốt nước dùng",
  SOT: "Sốt nấu / ướp",
  NUOC_CHAM: "Nước chấm / trộn",
  DO_CHUA: "Đồ chua muối bếp",
};

export const slotOfSemiKind = (kind: SemiKind): SemiSlot => (kind === "SOT" ? "COT" : kind);

export type SemiFinishedLine = Line & { name?: string | null; inactive?: boolean };

export type SemiFinishedItem = {
  id: string;
  code: string;
  name: string;
  slot: SemiSlot;
  kind?: SemiKind;
  variant_label: string;
  net_weight_g: number;
  updated_at: string;
  components: SemiFinishedLine[];
  instruction: string | null;
  allergens: string[] | null;
};

export type CreateSemiFinishedInput = {
  slot: SemiSlot;
  kind?: SemiKind;
  name: string;
  net_weight_g: number;
  components: Line[];
  instruction?: string;
};

const SemiFinishedLineSchema = z.object({
  sku_ref: z.string(),
  name: z.string().nullable().optional(),
  inactive: z.boolean().optional(),
  quantity: z.string(),
  uom: z.string(),
  yield_pct: z.string(),
  prep_note: z.string().optional(),
});

const SemiFinishedItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  slot: z.enum(SEMI_SLOTS),
  kind: z.enum(SEMI_KINDS).optional(),
  variant_label: z.string(),
  net_weight_g: z.number(),
  updated_at: z.string(),
  components: z.array(SemiFinishedLineSchema),
  instruction: z.string().nullable(),
  allergens: z.array(z.string()).nullable(),
});

export const createSemiFinishedSchema = z.object({
  slot: z.enum(SEMI_SLOTS).optional(),
  kind: z.enum(SEMI_KINDS).optional(),
  name: z.string().trim().min(1, "Nhập tên bán thành phẩm").max(120, "Tên tối đa 120 ký tự"),
  net_weight_g: z.number().int().min(1, "Khối lượng mỗi túi phải > 0 g").max(2147483647),
  components: z.array(z.object({
    sku_ref: z.string().uuid("Chọn nguyên liệu tươi"),
    quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, "Lượng phải > 0, tối đa 3 số lẻ").refine(v => Number(v) > 0, "Lượng phải > 0"),
    uom: z.enum(["KG", "G", "L", "ML", "EA"]),
    yield_pct: z.string().regex(/^\d+(\.\d{1,3})?$/).refine(v => Number(v) >= 1 && Number(v) <= 100, "Thu hồi từ 1 đến 100%"),
    prep_note: z.string().max(MAX_PREP_NOTE_LENGTH).optional(),
  })).min(1, "Thêm ít nhất một nguyên liệu tươi"),
  instruction: z.string().max(300, "Hướng dẫn tối đa 300 ký tự").optional(),
}).refine(v => Boolean(v.slot ?? v.kind), { message: "Chọn nhóm bán thành phẩm", path: ["slot"] });

export async function listSemiFinished(): Promise<SemiFinishedItem[]> {
  const res = await apiFetch("/api/dishes/semi-finished");
  const body = await res.json();
  if (!res.ok) throw new FetchError(safeMessage(typeof body.message === "string" ? body.message : "Không tải được bán thành phẩm."), res.status, body);
  return z.object({ items: z.array(SemiFinishedItemSchema) }).parse(body).items;
}

export async function createSemiFinished(input: CreateSemiFinishedInput, idempotencyKey = crypto.randomUUID()): Promise<SemiFinishedItem> {
  const parsed = createSemiFinishedSchema.parse(input);
  const res = await apiFetch("/api/dishes/semi-finished", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify(parsed),
  });
  const body = await res.json();
  if (!res.ok) throw new FetchError(safeMessage(typeof body.message === "string" ? body.message : "Không tạo được bán thành phẩm."), res.status, body);
  return SemiFinishedItemSchema.parse(body.item);
}
