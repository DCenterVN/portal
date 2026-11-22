import { z } from "zod";
import { orderDetailFields } from "@/lib/order-detail";
import type { CursorPage } from "@/lib/api/all-pages";
import { apiFetch } from "@/lib/fetcher";
import { decodePlatform } from "./platform-contract";
import { mutationHeaders } from "./production-http";

const staffOrderSchema = z.object({
  id: z.string(), order_code: z.string().nullish(), status: z.string(), total_vnd: z.number(), created_at: z.string(),
  channel: z.string().nullish(), recipient_name: z.string().nullish(), recipient_phone: z.string().nullish(),
  delivery_address: z.string().nullish(), province_code: z.string().nullish(), commune_code: z.string().nullish(), delivery_note: z.string().nullish(),
  assigned_driver_ref: z.string().nullish(),
  ...orderDetailFields,
});
export type StaffOrder = z.infer<typeof staffOrderSchema>;
async function read(response: Response) {
  const body: unknown = await response.json();
  if (!response.ok) {
    const error = z.object({ message: z.string().optional() }).safeParse(body);
    throw new Error(error.success ? error.data.message ?? "Không thể xử lý đơn hàng" : "Không thể xử lý đơn hàng");
  }
  return body;
}
export async function getStaffOrdersPage({ cursor, status }: { cursor?: string; status?: string } = {}): Promise<CursorPage<StaffOrder>> {
  const query = new URLSearchParams();
  if (cursor) query.set("cursor", cursor);
  if (status) query.set("status", status);
  const page = decodePlatform(await read(await apiFetch(`/api/sales/orders?${query}`)), z.object({ items: z.array(staffOrderSchema).nullish(), next_cursor: z.string().nullish() }));
  return { items: page.items ?? [], next_cursor: page.next_cursor };
}
export async function getStaffOrder(id: string): Promise<StaffOrder> {
  return decodePlatform(await read(await apiFetch(`/api/sales/orders/${encodeURIComponent(id)}`)), staffOrderSchema);
}
export async function mutateStaffOrder(id: string, action: string, input: Record<string, string>, key: string): Promise<StaffOrder> {
  const response = await apiFetch(`/api/sales/orders/${encodeURIComponent(id)}/${action}`, {
    method: "POST", headers: mutationHeaders(key), body: JSON.stringify(input),
  });
  return decodePlatform(await read(response), staffOrderSchema);
}
