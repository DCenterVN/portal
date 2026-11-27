import { describe, expect, it } from "vitest";
import { FetchError } from "@/lib/fetcher";
import { placementError } from "./shelf-placement-error";

const failure = (status: number, code?: string, message = "chữ thô của backend") => Object.assign(new FetchError(message, status), { code });

describe("xếp kệ bị từ chối", () => {
  it("placement_insufficient: insufficient_stock giữ câu vượt lượng chờ", () => {
    expect(placementError(failure(409, "insufficient_stock"))).toContain("vượt quá lượng đang chờ lên kệ");
  });
  it("placement_state_conflict: state_conflict báo lô chưa duyệt hoặc vừa đổi trạng thái", () => {
    const text = placementError(failure(409, "state_conflict"));
    expect(text).toContain("chưa được duyệt");
    expect(text).not.toContain("vượt quá");
  });
  it("placement_other_code: mã khác dùng câu chung, không lộ message thô", () => {
    const text = placementError(failure(409, "idempotency_conflict"));
    expect(text).not.toContain("chữ thô");
    expect(text).not.toContain("vượt quá");
    expect(placementError(failure(403, undefined))).toContain("chưa có quyền");
  });
});
