import { afterEach, beforeEach, expect, it, vi } from "vitest";

const fetchMock = vi.fn<typeof fetch>();
const branch = "01a157cd-fef2-72ff-9428-63b4df7d25d0";
const orgBody = { code: 200, status: "success", message: "OK", data: { items: [{ id: branch, code: "MAIN", name: "Sunny", type: "CENTRAL_KITCHEN" }] } };
let GET: typeof import("./route").GET;
beforeEach(async () => { vi.resetModules(); ({ GET } = await import("./route")); vi.stubGlobal("fetch", fetchMock); vi.stubEnv("ORG_INTERNAL_URL", "http://org:8081"); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); fetchMock.mockReset(); });

it("lấy danh sách từ org, không gửi thông tin đăng nhập, không đọc biến cấu hình tay", async () => {
  vi.stubEnv("PORTAL_STORE_BRANCHES", JSON.stringify([{ id: "x", name: "Cũ" }]));
  fetchMock.mockResolvedValue(Response.json(orgBody));
  const response = await GET();
  expect(await response.json()).toEqual([{ id: branch, name: "Sunny", kind: "Bếp trung tâm" }]);
  expect(String(fetchMock.mock.calls[0][0])).toBe("http://org:8081/org/public/branches");
  expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has("Authorization")).toBe(false);
});
it("org trả rỗng thì khách nhận danh sách rỗng", async () => {
  fetchMock.mockResolvedValue(Response.json({ ...orgBody, data: { items: [] } }));
  const response = await GET();
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual([]);
});
it.each([
  ["org tắt", () => { throw new Error("offline"); }],
  ["org trả 503", () => Response.json({ error: "UNAVAILABLE" }, { status: 503 })],
  ["org trả 429", () => Response.json({ message: "limit" }, { status: 429 })],
  ["org trả sai hình dạng", () => Response.json({ hello: 1 })],
])("%s thì báo câu tiếng Việt, không lộ mã lỗi", async (_name, respond) => {
  fetchMock.mockImplementation(async () => respond());
  const response = await GET();
  expect(response.status).toBe(503);
  const { message } = await response.json();
  expect(message).toBe("Chưa tải được danh sách cửa hàng. Vui lòng tải lại trang sau ít phút.");
});
it("giữ kết quả thành công 30 giây rồi hỏi lại org, lỗi thì không giữ", async () => {
  vi.useFakeTimers();
  fetchMock.mockResolvedValueOnce(Response.json(orgBody));
  await GET(); await GET();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  vi.advanceTimersByTime(30_001);
  fetchMock.mockResolvedValueOnce(Response.json({ error: "UNAVAILABLE" }, { status: 503 }));
  expect((await GET()).status).toBe(503);
  fetchMock.mockResolvedValueOnce(Response.json({ ...orgBody, data: { items: [] } }));
  expect(await (await GET()).json()).toEqual([]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
