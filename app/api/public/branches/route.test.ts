import { afterEach, expect, it, vi } from "vitest";
import { GET } from "./route";

afterEach(() => vi.unstubAllEnvs());
it("chỉ công khai mã và tên chi nhánh đã cấu hình", async () => {
  vi.stubEnv("PORTAL_STORE_BRANCHES", JSON.stringify([{ id: "01a157cd-fef2-72ff-9428-63b4df7d25d0", name: "Bếp trung tâm", internal: "ẩn" }]));
  expect(await GET().json()).toEqual([{ id: "01a157cd-fef2-72ff-9428-63b4df7d25d0", name: "Bếp trung tâm" }]);
});
it.each([undefined, "invalid", "[]", JSON.stringify([{ id: "wrong", name: "Kho" }])])("thiếu cấu hình hợp lệ thì đóng bộ chọn: %s", value => {
  vi.stubEnv("PORTAL_STORE_BRANCHES", value);
  expect(GET().status).toBe(503);
});
