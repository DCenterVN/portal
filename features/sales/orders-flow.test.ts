import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { createFormControl, type UseFormProps } from "react-hook-form";
import { useSalesOrders, loadDrivers } from "./use-sales-orders";
import type { StaffOrder } from "@/lib/api/staff-orders";

const hooks = vi.hoisted(() => ({ cursor: 0, slots: [] as unknown[], form: undefined as ReturnType<typeof createFormControl> | undefined, denied: "", userId: "", members: [] as unknown[], setItems: vi.fn() }));
vi.mock("react", async original => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useEffect: (effect: () => void) => effect(), useState: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = initial;
    return [hooks.slots[index], (value: unknown) => { hooks.slots[index] = typeof value === "function" ? value(hooks.slots[index]) : value; }];
  }, useRef: (initial: unknown) => {
    const index = hooks.cursor++;
    if (!(index in hooks.slots)) hooks.slots[index] = { current: initial };
    return hooks.slots[index];
  } };
});
vi.mock("react-hook-form", async original => {
  const actual = await original<typeof import("react-hook-form")>();
  return { ...actual, useForm: (options: UseFormProps) => {
    hooks.form ??= actual.createFormControl(options);
    hooks.form.control._options = options;
    return { ...hooks.form, formState: { errors: {}, isSubmitting: false } };
  } };
});
vi.mock("swr", () => ({ default: (key: unknown) => ({ data: Array.isArray(key) && key[0] === "order-drivers" ? hooks.members : undefined, mutate: vi.fn() }) }));
vi.mock("@/hooks/use-loaded-list", () => ({ useLoadedList: (items: StaffOrder[]) => ({ items, setItems: hooks.setItems, loading: false, error: "", reload: vi.fn() }) }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: (key: string) => hooks.denied !== key, scope: { userId: hooks.userId, branchId: "branch", orgId: "org" } }) }));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const driver = "0198fd55-3f46-7a01-9e52-f4c0de000020";
const order: StaffOrder = { id: "order", order_code: "DH-001", status: "PACKED", payment_method: "COD", payment_status: "PENDING_COD", total_vnd: 100, created_at: "2026-11-11" };
const fetch = vi.fn<typeof globalThis.fetch>();
const envelope = (data: unknown) => Response.json({ code: 200, status: "success", message: "OK", data });
function state() { hooks.cursor = 0; return useSalesOrders([order]); }
async function submit(value: string) {
  const current = state();
  hooks.form!.setValue("value", value);
  await current.submit();
}
beforeEach(() => {
  hooks.cursor = 0; hooks.slots = []; hooks.form = undefined; hooks.denied = ""; hooks.userId = driver;
  hooks.members = [{ user_id: driver, display_name: "Nhân viên An" }]; hooks.setItems.mockReset();
  fetch.mockReset().mockImplementation(async () => envelope({ ...order, status: "DELIVERING" }));
  vi.stubGlobal("fetch", fetch);
});
afterEach(() => vi.unstubAllGlobals());
it("ship submits chosen user id, synchronously prevents double click and updates row", async () => {
  state().act(order, "ship");
  const current = state(); hooks.form!.setValue("value", driver);
  await Promise.all([current.submit(), current.submit()]);
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ driver_ref: driver });
  expect(hooks.setItems).toHaveBeenCalledTimes(1);
  expect(state().pending).toBeNull();
});
it.each([409, 503])("keeps dialog, input and idempotency key after %s and retry", async status => {
  state().act(order, "ship");
  fetch.mockResolvedValueOnce(Response.json({ message: "Thiếu hàng trên kệ" }, { status }));
  await submit(driver);
  expect(state().pending?.action).toBe("ship");
  expect(state().error).toBe("Thiếu hàng trên kệ");
  expect(hooks.form!.getValues("value")).toBe(driver);
  await submit(driver);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][1]?.headers).toEqual(fetch.mock.calls[1][1]?.headers);
  expect(state().pending).toBeNull();
});
it("direct pack double click makes one request and retry keeps key", async () => {
  const confirmed = { ...order, status: "CONFIRMED" };
  const current = state();
  current.act(confirmed, "pack"); current.act(confirmed, "pack");
  await vi.waitFor(() => expect(hooks.setItems).toHaveBeenCalledTimes(1));
  expect(fetch).toHaveBeenCalledTimes(1);
});
it.each(["", "0198fd55-3f46-7a01-9e52-f4c0de000021"])("rejects absent or unlisted driver %s", async value => {
  state().act(order, "ship"); await submit(value);
  expect(fetch).not.toHaveBeenCalled(); expect(state().pending).not.toBeNull();
});
it("empty driver list cannot submit", async () => {
  hooks.members = []; state().act(order, "ship"); await submit(driver);
  expect(fetch).not.toHaveBeenCalled();
});
it.each(["payments/confirm", "delivery-failure", "cancel"] as const)("requires value for %s", async action => {
  const target: StaffOrder = { ...order, status: action === "payments/confirm" ? "AWAITING_PAYMENT" : action === "cancel" ? "CONFIRMED" : "DELIVERING", payment_method: "BANK_TRANSFER", payment_status: "INITIATED" };
  state().act(target, action); await submit("   ");
  expect(fetch).not.toHaveBeenCalled(); expect(hooks.form!.getFieldState("value").invalid).toBe(true);
  expect(state().pending).not.toBeNull();
});
it("missing permission blocks mutation", () => {
  hooks.denied = "sales:order:update"; state().act(order, "ship");
  expect(state().pending).toBeNull(); expect(fetch).not.toHaveBeenCalled();
});
it("drivers reuse company membership pagination, filtering branch, ACTIVE and SALES", async () => {
  const base = { id: driver, user_id: driver, branch_id: driver, display_name: "An", email: "an@test.vn", role_codes: ["SALES"], status: "ACTIVE" };
  fetch.mockResolvedValueOnce(envelope({ items: [base, { ...base, status: "SUSPENDED" }, { ...base, branch_id: "0198fd55-3f46-7a01-9e52-f4c0de000022" }, { ...base, role_codes: ["DRIVER"] }], page: 1, limit: 20, total: 4 }));
  expect(await loadDrivers(driver)).toEqual([expect.objectContaining({ user_id: driver, display_name: "An" })]);
  expect(String(fetch.mock.calls[0][0])).toContain("/api/org/company/memberships?");
});

it("payment confirmation sends trimmed bank reference and retains it on error", async () => {
  const target: StaffOrder = { ...order, status: "AWAITING_PAYMENT", payment_method: "BANK_TRANSFER" };
  state().act(target, "payments/confirm");
  fetch.mockResolvedValueOnce(Response.json({ message: "Chưa tìm thấy giao dịch" }, { status: 409 }));
  await submit("  BANK-2026-001  ");
  expect(JSON.parse(String(fetch.mock.calls[0][1]?.body))).toEqual({ bank_transaction_ref: "BANK-2026-001" });
  expect(hooks.form!.getValues("value")).toBe("  BANK-2026-001  ");
  expect(state().pending?.action).toBe("payments/confirm");
});
it("changed driver starts a new idempotent attempt after failure", async () => {
  const other = "0198fd55-3f46-7a01-9e52-f4c0de000021";
  hooks.members.push({ user_id: other });
  state().act(order, "ship");
  fetch.mockResolvedValueOnce(Response.json({ message: "Thử lại" }, { status: 503 }));
  await submit(driver); await submit(other);
  expect(fetch.mock.calls[0][1]?.headers).not.toEqual(fetch.mock.calls[1][1]?.headers);
});
it("retrying direct pack preserves server message and key", async () => {
  const target: StaffOrder = { ...order, status: "CONFIRMED" };
  fetch.mockResolvedValueOnce(Response.json({ message: "Thiếu hàng trên kệ" }, { status: 503 }));
  state().act(target, "pack");
  await vi.waitFor(() => expect(state().error).toBe("Thiếu hàng trên kệ"));
  state().act(target, "pack");
  await vi.waitFor(() => expect(hooks.setItems).toHaveBeenCalledTimes(1));
  expect(fetch.mock.calls[0][1]?.headers).toEqual(fetch.mock.calls[1][1]?.headers);
});

it("selects current user when membership data arrives and preserves a chosen assignee", () => {
  hooks.members = [];
  state().act(order, "ship");
  state();
  expect(hooks.form!.getValues("value")).toBe("");
  hooks.members = [{ user_id: driver }];
  state();
  expect(hooks.form!.getValues("value")).toBe(driver);
  hooks.form!.setValue("value", "another-user", { shouldDirty: true });
  state();
  expect(hooks.form!.getValues("value")).toBe("another-user");
});
it("does not preselect a user absent from active SALES members", () => {
  hooks.userId = "not-a-sales-member";
  state().act(order, "ship"); state();
  expect(hooks.form!.getValues("value")).toBe("");
});
it.each(["deliver", "delivery-failure"] as const)("blocks %s assigned to another user", async action => {
  state().act({ ...order, status: "DELIVERING", assigned_driver_ref: "another-user" }, action);
  await submit("Không liên hệ được");
  expect(fetch).not.toHaveBeenCalled();
  expect(state().pending).toBeNull();
});
it("shows server 403 message when legacy response omits assignment", async () => {
  fetch.mockResolvedValueOnce(Response.json({ message: "Chỉ người giao được gán mới có thể cập nhật" }, { status: 403 }));
  state().act({ ...order, status: "DELIVERING" }, "deliver");
  await vi.waitFor(() => expect(state().error).toBe("Chỉ người giao được gán mới có thể cập nhật"));
});
