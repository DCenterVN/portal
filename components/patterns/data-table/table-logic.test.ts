import { describe, expect, it } from "vitest";
import { buildTableUrl, clampPage, commitPageText, withPage, footerText, pageCount, pageText, parseTableUrl, sortRows, sliceRows, toggleHidden, visibleColumns, withFilter, withNextCursor, withPageSize, withPreviousCursor, withQuery, withSort, type TableUrlConfig } from "./table-logic";

const cfg: TableUrlConfig = { filterKeys: ["status", "category"], pageSizes: [10, 20, 50, 100], defaultPageSize: 20 };
const start = parseTableUrl("", cfg);

describe("sắp xếp có dấu tiếng Việt", () => {
  const rows = [{ n: "Đường" }, { n: "Đậu" }, { n: "Dưa" }, { n: "An" }, { n: null }];
  it("xếp đúng thứ tự chữ cái, giá trị rỗng xuống cuối", () => {
    expect(sortRows(rows, row => row.n, false).map(row => row.n)).toEqual(["An", "Dưa", "Đậu", "Đường", null]);
    expect(sortRows(rows, row => row.n, true).map(row => row.n)).toEqual(["Đường", "Đậu", "Dưa", "An", null]);
  });
  it("xếp số theo giá trị, không theo chữ", () => {
    expect(sortRows([{ p: 10 }, { p: 9 }, { p: 100 }], row => row.p, false).map(row => row.p)).toEqual([9, 10, 100]);
  });
  it("không đổi mảng gốc", () => {
    const original = [{ p: 2 }, { p: 1 }];
    sortRows(original, row => row.p, false);
    expect(original[0].p).toBe(2);
  });
});

describe("chia trang tại chỗ", () => {
  const items = Array.from({ length: 45 }, (_, index) => index);
  it("cắt đúng trang và kẹp trang vượt biên", () => {
    expect(sliceRows(items, 1, 20)).toHaveLength(20);
    expect(sliceRows(items, 3, 20)).toEqual([40, 41, 42, 43, 44]);
    expect(sliceRows(items, 9, 20)).toEqual([40, 41, 42, 43, 44]);
  });
  it("đếm số trang", () => {
    expect(pageCount(104, 20)).toBe(6);
    expect(pageCount(0, 20)).toBe(1);
  });
});

describe("chữ ở chân bảng", () => {
  it("biết tổng", () => {
    expect(footerText({ page: 1, pageSize: 20, count: 20, total: 104 })).toBe("Hiển thị 1–20 trong 104");
    expect(footerText({ page: 6, pageSize: 20, count: 4, total: 104 })).toBe("Hiển thị 101–104 trong 104");
    expect(pageText({ page: 1, pageSize: 20, total: 104 })).toBe("Trang 1 trên 6");
  });
  it("không biết tổng", () => {
    expect(footerText({ page: 2, pageSize: 20, count: 20 })).toBe("Hiển thị 21–40");
    expect(pageText({ page: 2, pageSize: 20 })).toBe("Trang 2");
  });
  it("không có dòng", () => {
    expect(footerText({ page: 1, pageSize: 20, count: 0, total: 0 })).toBe("Hiển thị 0 trong 0");
  });
});

describe("ẩn hiện cột", () => {
  const columns = [{ id: "a", hideable: true }, { id: "b" }, { id: "c", hideable: true }];
  it("bật tắt một cột", () => {
    expect(toggleHidden([], "a")).toEqual(["a"]);
    expect(toggleHidden(["a"], "a")).toEqual([]);
  });
  it("cột không ẩn được thì luôn hiện", () => {
    expect(visibleColumns(columns, ["a", "b"]).map(column => column.id)).toEqual(["b", "c"]);
  });
});

describe("trạng thái trên địa chỉ", () => {
  it("địa chỉ rỗng ra trạng thái mặc định", () => {
    expect(start).toEqual({ q: "", pageSize: 20, page: 1, cursors: [], sort: null, filters: {} });
    expect(buildTableUrl(start, cfg)).toBe("");
  });
  it("đi vòng không mất gì", () => {
    let state = withQuery(start, "gạo");
    state = withFilter(state, "status", ["ACTIVE", "SUSPENDED"]);
    state = withSort(state, { id: "name", desc: true });
    state = withPageSize(state, 50);
    state = withNextCursor(state, "abc=");
    state = withNextCursor(state, "d~e");
    const url = buildTableUrl(state, cfg);
    expect(parseTableUrl(url, cfg)).toEqual(state);
  });
  it("bỏ giá trị lạ: cỡ trang ngoài danh sách, khoá lọc lạ, sắp xếp rỗng", () => {
    const state = parseTableUrl("size=7&f.zzz=1&sort=-&page=0&cursors=khong-phai-json", cfg);
    expect(state).toEqual(start);
  });
  it("đổi ô tìm, bộ lọc, sắp xếp, cỡ trang đều về trang đầu", () => {
    const deep = withNextCursor({ ...start, page: 4 }, "x");
    for (const next of [withQuery(deep, "a"), withFilter(deep, "status", ["A"]), withSort(deep, { id: "name", desc: false }), withPageSize(deep, 10)]) {
      expect(next.cursors).toEqual([]);
      expect(next.page).toBe(1);
    }
  });
  it("con trỏ: tới rồi lùi lại đúng chỗ cũ", () => {
    const one = withNextCursor(start, "c1");
    const two = withNextCursor(one, "c2");
    expect(two.cursors).toEqual(["c1", "c2"]);
    expect(withPreviousCursor(two)).toEqual(one);
    expect(withPreviousCursor(start)).toEqual(start);
  });
});

describe("số trang trên địa chỉ", () => {
  it("đọc page, bỏ qua giá trị sai", () => {
    expect(parseTableUrl("page=3", cfg).page).toBe(3);
    expect(parseTableUrl("page=abc", cfg).page).toBe(1);
    expect(parseTableUrl("page=-2", cfg).page).toBe(1);
  });
  it("đổi trang ghi page, bỏ cursors; đổi lọc, tìm, sắp xếp, số dòng thì về trang 1", () => {
    const at = withPage({ ...start, cursors: ["x"] }, 3);
    expect(buildTableUrl(at, cfg)).toBe("page=3");
    expect(withQuery(at, "gạo").page).toBe(1);
    expect(withSort(at, { id: "name", desc: false }).page).toBe(1);
    expect(withPageSize(at, 50).page).toBe(1);
    expect(withFilter(at, "status", ["ACTIVE"]).page).toBe(1);
  });
  it("kẹp số trang trong 1..tổng", () => {
    expect(clampPage(0, 104, 20)).toBe(1);
    expect(clampPage(99, 104, 20)).toBe(6);
    expect(clampPage(3, 104, 20)).toBe(3);
    expect(clampPage(Number.NaN, 104, 20)).toBe(1);
  });
  it("ô số trang: gõ số gọi onPage, ngoài khoảng thì kẹp, chữ thì trả số cũ", () => {
    const calls: number[] = [];
    const go = (text: string) => commitPageText(text, 2, 6, page => calls.push(page));
    expect(go("3")).toBe("3");
    expect(go("99")).toBe("6");
    expect(go("0")).toBe("1");
    expect(go("abc")).toBe("2");
    expect(go("2")).toBe("2");
    expect(calls).toEqual([3, 6, 1]);
  });
});
