import { describe, expect, it } from "vitest";
import { usableError, usableLabel, usableNote, usableRows } from "./usable-quantity";

const row = { on_hand_quantity: 10, available_quantity: 10, usable_quantity: 6, uom: "EA" };
const old = { available_quantity: 7, uom: "EA" };

describe("số Chuyển được", () => {
  it("usable_quantity_label: hiện Chuyển được theo usable_quantity, không dùng Còn khả dụng", () => {
    expect(usableLabel(row)).toBe("Chuyển được 6 cái");
    expect(usableLabel(row)).not.toContain("khả dụng");
  });
  it("usable_quantity_block: nhập quá số chuyển được thì chặn và nói rõ", () => {
    expect(usableError(row, 6000)).toBe("");
    expect(usableError(row, 6001)).toContain("Chỉ chuyển được 6 cái");
  });
  it("usable_quantity_note: số nhỏ hơn tồn thì giải thích, bằng tồn thì không", () => {
    expect(usableNote(row)).toContain("đang được giữ cho đơn hoặc đang chờ kiểm");
    expect(usableNote({ ...row, usable_quantity: 10 })).toBe("");
  });
  it("usable_quantity_float_noise: 2.3000000000000003 và 2.3 coi là bằng nhau, không dòng giải thích, không đuôi sai số", () => {
    const noisy = { on_hand_quantity: 2.3000000000000003, available_quantity: 2.3000000000000003, usable_quantity: 2.3, uom: "KG" };
    expect(usableNote(noisy)).toBe("");
    expect(usableLabel(noisy)).toBe("Chuyển được 2,3 kg");
    expect(usableError(noisy, 2300)).toBe("");
    expect(usableError(noisy, 2301)).toContain("Chỉ chuyển được 2,3 kg");
  });
  it("usable_quantity_missing: inventory bản cũ không có trường thì không hiện số và không chặn", () => {
    expect(usableLabel(old)).toBe("");
    expect(usableNote(old)).toBe("");
    expect(usableError(old, 999000)).toBe("");
  });
  it("usable_quantity_rows: có trường thì chỉ giữ dòng chuyển được, không có trường thì theo khả dụng", () => {
    expect(usableRows([row, { ...row, usable_quantity: 0 }, old, { ...old, available_quantity: 0 }])).toEqual([row, old]);
  });
});
