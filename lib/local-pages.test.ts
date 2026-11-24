import { describe, expect, it } from "vitest";
import { localPage, localPageSize } from "./local-pages";

const rows = Array.from({ length: 45 }, (_, i) => i + 1);

describe("cắt trang tại máy", () => {
  it("20 dòng mỗi trang, trang 2 khác trang 1", () => {
    expect(localPageSize).toBe(20);
    const first = localPage(rows, 1), second = localPage(rows, 2);
    expect(first.rows).toHaveLength(20);
    expect(second.rows[0]).toBe(21);
    expect(first).toMatchObject({ page: 1, hasPrevious: false, hasNext: true });
    expect(second).toMatchObject({ page: 2, hasPrevious: true, hasNext: true });
  });
  it("trang cuối không còn Trang sau", () => {
    expect(localPage(rows, 3)).toMatchObject({ page: 3, hasNext: false, rows: [41, 42, 43, 44, 45] });
  });
  it("danh sách co lại thì lùi về trang cuối có dòng, rỗng thì trang 1", () => {
    expect(localPage(rows.slice(0, 25), 3).page).toBe(2);
    expect(localPage([], 5)).toMatchObject({ page: 1, rows: [], hasNext: false, hasPrevious: false });
  });
});
