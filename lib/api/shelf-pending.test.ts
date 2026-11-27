import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { getShelfPendingPage } from "./shelf-pending";
import { placeOnShelf } from "./production";
import { statusLabel } from "@/lib/status-labels";

const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());
const lot = { lot_id: "01a1c619-b770-73b3-86bc-cf03079eda1f", sku_ref: "01a1c616-bce2-78fd-99c4-5e5a604161fb", supplier_lot_code: "LOT-1", uom: "EA", remaining_quantity: 3, pending_quantity: 3, expires_at: "2026-12-10T00:00:00Z", origin: "TRANSFER", source_code: "CK-1" };
const envelope = (data: unknown) => ({ code: 200, status: "success", message: "OK", data });

it("danh sách chờ lên kệ gọi đúng chi nhánh, trang và giới hạn; còn trang sau thì trả con trỏ số trang", async () => {
  fetchMock.mockResolvedValue(Response.json(envelope({ items: [lot], total: 45, page: 1, limit: 20 })));
  const page = await getShelfPendingPage("branch-1", "");
  const url = new URL(String(fetchMock.mock.calls[0][0]), "http://x");
  expect(url.pathname).toBe("/api/inventory/shelf-pending-lots");
  expect(Object.fromEntries(url.searchParams)).toEqual({ branch_ref: "branch-1", page: "1", limit: "20" });
  expect(page.items[0]).toMatchObject({ origin: "TRANSFER", inspection_quantity: 0 });
  expect(page.next_cursor).toBe("2");
});

it("trang cuối không còn con trỏ", async () => {
  fetchMock.mockResolvedValue(Response.json(envelope({ items: [lot], total: 45, page: 3, limit: 20 })));
  expect((await getShelfPendingPage("branch-1", "3")).next_cursor).toBe("");
});

it("nhãn nguồn hàng nằm trong bảng nhãn chung", () => {
  expect(["PRODUCTION", "TRANSFER", "DELIVERY_RETURN"].map(statusLabel)).toEqual(["Sản xuất", "Chuyển kho", "Hàng giao hỏng quay về, cần kiểm"]);
});

it("place_on_shelf_codes_only: xếp kệ bị từ chối chỉ trả mã trạng thái và mã lỗi, không đưa message thô", async () => {
  fetchMock.mockResolvedValue(Response.json({ code: 409, status: "error", message: "chữ thô của backend", errors: { error_code: "state_conflict" } }, { status: 409 }));
  const failed = await placeOnShelf({ finished_lot_ref: "a", branch_ref: "b", shelf_code: "KE-1", placed_quantity: 99 }).catch(error => error);
  expect(failed).toMatchObject({ name: "FetchError", status: 409, code: "state_conflict" });
  expect(failed.message).not.toContain("chữ thô");
});
