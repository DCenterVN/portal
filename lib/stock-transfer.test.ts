import { describe, expect, it } from "vitest";
import { FetchError } from "@/lib/fetcher";
import { formatQuantity, fromMilli, hasVariance, insufficientSku, lotInfo, receiveRowError, shortfall, toMilli, transferEnds, transferError } from "./stock-transfer";

describe("số lượng chuyển hàng đi qua chuỗi, không qua số thực", () => {
  it("đọc cả dấu phẩy và dấu chấm, tối đa 3 số lẻ", () => {
    expect(toMilli("1,5")).toBe(1500);
    expect(toMilli("0.125")).toBe(125);
    expect(toMilli("12")).toBe(12000);
    expect(toMilli("1.2345")).toBeNull();
    expect(toMilli("")).toBeNull();
    expect(toMilli("-1")).toBeNull();
    expect(toMilli("abc")).toBeNull();
  });

  it("0.1 + 0.2 không trôi: 0.300 chính xác", () => {
    expect(fromMilli((toMilli("0.1") ?? 0) + (toMilli("0.2") ?? 0))).toBe("0.300");
  });

  it("hiển thị kiểu Việt, bỏ số 0 thừa, kèm đơn vị", () => {
    expect(formatQuantity("1.500", "KG")).toBe("1,5 kg");
    expect(formatQuantity("2.000")).toBe("2");
    expect(formatQuantity(4.5, "KG")).toBe("4,5 kg");
    expect(formatQuantity("0.125")).toBe("0,125");
  });

  it("hao hụt = số gửi - số nhận, không âm", () => {
    expect(shortfall("0.200", "0,1")).toBe("0.100");
    expect(shortfall("1.000", "1")).toBe("0.000");
    expect(shortfall("1.000", "2")).toBe("0.000");
  });
});

describe("dòng nhận", () => {
  it("nhận đủ: không lỗi, không cần lý do", () => {
    expect(receiveRowError({ sent: "1.500", received: "1,5", reason: "" })).toEqual({});
  });
  it("nhận thiếu mà chưa chọn lý do thì báo ở ô lý do", () => {
    expect(receiveRowError({ sent: "1.500", received: "1", reason: "" }).reason).toMatch(/lý do/);
    expect(receiveRowError({ sent: "1.500", received: "0", reason: "SHORT" })).toEqual({});
  });
  it("nhận nhiều hơn số gửi hoặc nhập sai thì báo ở ô số nhận", () => {
    expect(receiveRowError({ sent: "1.500", received: "2", reason: "" }).received).toMatch(/không được lớn hơn/);
    expect(receiveRowError({ sent: "1.500", received: "x", reason: "" }).received).toMatch(/Nhập số nhận/);
  });
  it("có dòng lệch thì phiếu cần ảnh", () => {
    expect(hasVariance([{ sent: "1.000", received: "1", reason: "" }])).toBe(false);
    expect(hasVariance([{ sent: "1.000", received: "1", reason: "" }, { sent: "1.000", received: "0.9", reason: "" }])).toBe(true);
  });
});

describe("lỗi từ kho", () => {
  it("insufficient_stock: lấy được nguyên liệu sai từ câu lỗi, không hiện câu gốc", () => {
    const error = new FetchError("không đủ tồn để chuyển SKU 01a15f28-7da7-7f25-9e33-1ef14be113ed", 409);
    error.code = "insufficient_stock";
    expect(insufficientSku(error)).toBe("01a15f28-7da7-7f25-9e33-1ef14be113ed");
    expect(transferError(error)).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(transferError(error)).toMatch(/tồn khả dụng/);
  });
  it("mỗi mã trạng thái có câu tiếng Việt riêng", () => {
    for (const status of [403, 404, 409, 422, 503]) expect(transferError(new FetchError("x", status))).toMatch(/[ạảãàáâăêôơưđ]/);
    expect(new Set([403, 404, 409, 422, 503].map(status => transferError(new FetchError("x", status)))).size).toBe(5);
  });
  it("tên chi nhánh lấy từ phiếu, rỗng hoặc thiếu thì hiện —", () => {
    expect(transferEnds({ from_branch_name: "Sunny", to_branch_name: "Cầu Giấy" })).toEqual({ from: "Sunny", to: "Cầu Giấy" });
    expect(transferEnds({ from_branch_name: "", to_branch_name: null })).toEqual({ from: "—", to: "—" });
    expect(transferEnds({})).toEqual({ from: "—", to: "—" });
  });
  it("lô nguồn lấy từ dòng phiếu, không có thì không bịa", () => {
    expect(lotInfo({ source_lot_code: "LO-2", source_lot_expires_at: "2027-02-01T00:00:00Z" })).toEqual({ code: "LO-2", expires: "2027-02-01T00:00:00Z" });
    expect(lotInfo({})).toBeUndefined();
  });
});
