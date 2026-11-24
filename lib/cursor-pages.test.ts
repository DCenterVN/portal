import { describe, expect, it } from "vitest";
import { cursorPagesStart, currentCursor, goNext, goPrevious, hasPrevious, pageNumber, pagerFlags } from "./cursor-pages";

describe("phân trang con trỏ có trang trước", () => {
  it("bắt đầu ở trang 1 không có trang trước", () => {
    expect(pageNumber(cursorPagesStart)).toBe(1);
    expect(hasPrevious(cursorPagesStart)).toBe(false);
    expect(currentCursor(cursorPagesStart)).toBe("");
  });
  it("sang trang sau rồi quay lại đúng con trỏ cũ", () => {
    const second = goNext(cursorPagesStart, "c2");
    const third = goNext(second, "c3");
    expect(pageNumber(third)).toBe(3);
    expect(currentCursor(third)).toBe("c3");
    expect(currentCursor(goPrevious(third))).toBe("c2");
    expect(currentCursor(goPrevious(goPrevious(third)))).toBe("");
  });
  it("không lùi quá trang 1", () => {
    expect(goPrevious(cursorPagesStart)).toEqual(cursorPagesStart);
  });
  it("không còn con trỏ kế thì không sang trang", () => {
    expect(goNext(cursorPagesStart, "")).toEqual(cursorPagesStart);
  });
  it("trang sau mờ khi hết con trỏ kế, cả hai nút mờ khi đang tải", () => {
    const second = goNext(cursorPagesStart, "c2");
    expect(pagerFlags(second, "", false)).toEqual({ hasPrevious: true, hasNext: false });
    expect(pagerFlags(second, "c3", false)).toEqual({ hasPrevious: true, hasNext: true });
    expect(pagerFlags(second, "c3", true)).toEqual({ hasPrevious: false, hasNext: false });
    expect(pagerFlags(cursorPagesStart, "c2", false)).toEqual({ hasPrevious: false, hasNext: true });
  });
});
