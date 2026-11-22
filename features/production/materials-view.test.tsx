import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessProvider } from "@/lib/access-boundary";
import { CategoryBar, MonGrid, NumberedPager } from "./materials-view-parts";
import { NhomFilter, NhomOption } from "./materials-nhom-filter";
import { MaterialsView } from "./materials-view";
import { MONS, TREE } from "./materials-fixtures";
import { PAGE_SIZE, type CatalogState, changeState, countByLoai, countByNhom, filterMon, fold, pageCount, pageOf, readState, stateQuery, statusOf } from "./materials-catalog";

const search = vi.hoisted(() => ({ value: "" }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {} }), usePathname: () => "/production/materials", useSearchParams: () => new URLSearchParams(search.value) }));

const state = (change: Partial<CatalogState> = {}): CatalogState => ({ loai: "thit", nhom: [], trang: 1, q: "", trangThai: "dang-dung", ...change });
const rau = filterMon(MONS, "rau", "");
const screen = (query = "") => {
  search.value = query;
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "/employee", actions: new Set(["sales:product:read"]) }}><MaterialsView /></AccessProvider>);
  search.value = "";
  return html;
};

describe("trạng thái trên URL", () => {
  it("mặc định chọn loại đầu tiên của cây, loại lạ cũng về loại đầu", () => {
    expect(readState(new URLSearchParams(), TREE).loai).toBe("thit");
    expect(readState(new URLSearchParams("loai=la"), TREE).loai).toBe("thit");
    expect(readState(new URLSearchParams("loai=ca"), TREE).loai).toBe("ca");
  });
  it("trang_thai đọc ra nhap và da-ngung, lạ thì về dang-dung", () => {
    expect(readState(new URLSearchParams("trang_thai=nhap"), TREE).trangThai).toBe("nhap");
    expect(readState(new URLSearchParams("trang_thai=da-ngung"), TREE).trangThai).toBe("da-ngung");
    expect(readState(new URLSearchParams("trang_thai=la"), TREE).trangThai).toBe("dang-dung");
  });
  it("trạng thái ứng với status của API", () => {
    expect(statusOf("dang-dung")).toBe("ACTIVE");
    expect(statusOf("nhap")).toBe("DRAFT");
    expect(statusOf("da-ngung")).toBe("SUSPENDED");
  });
  it("trang_thai nằm trên URL khi khác mặc định, đổi trạng thái thì về trang 1 và giữ loại", () => {
    expect(stateQuery(state())).toBe("loai=thit&trang=1&q=");
    const next = changeState(state({ trang: 3, nhom: ["lon"] }), { trangThai: "nhap" });
    expect(stateQuery(next)).toBe("loai=thit&nhom=lon&trang=1&q=&trang_thai=nhap");
  });
  it("bấm loại thì về trang 1 và xoá nhóm", () => {
    expect(stateQuery(changeState(state({ trang: 3, nhom: ["lon"], q: "bò" }), { loai: "rau", q: "" }))).toBe("loai=rau&trang=1&q=");
  });
  it("nhom=lon,bo đọc ra hai nhóm, nhóm lạ hoặc của loại khác bị bỏ", () => {
    expect(readState(new URLSearchParams("loai=thit&nhom=lon,bo"), TREE).nhom).toEqual(["lon", "bo"]);
    expect(readState(new URLSearchParams("loai=thit&nhom=lon,la"), TREE).nhom).toEqual(["lon"]);
    expect(readState(new URLSearchParams("loai=nam&nhom=lon"), TREE).nhom).toEqual([]);
  });
  it("chọn Lợn và Bò thì URL nhom=lon,bo, về trang 1", () => {
    expect(stateQuery(changeState(state({ trang: 3 }), { nhom: ["lon", "bo"] }))).toBe("loai=thit&nhom=lon,bo&trang=1&q=");
  });
});

describe("lọc và đếm", () => {
  it("tìm không dấu, không phân biệt hoa thường, trong loại đang chọn", () => {
    expect(fold("Cải Thìa Đỏ")).toBe("cai thia do");
    expect(filterMon(MONS, "rau", "ca chua").map(item => item.ten)).toEqual(["Cà chua"]);
    expect(filterMon(MONS, "thit", "ca chua")).toHaveLength(0);
  });
  it("lọc nhóm và đếm theo nhóm", () => {
    expect(filterMon(MONS, "thit", "", ["bo"])).toHaveLength(10);
    expect(countByNhom(MONS, "thit")).toEqual({ lon: 20, bo: 10 });
    expect(countByLoai(MONS)).toEqual({ thit: 30, rau: 31, ca: 4 });
  });
  it("phân trang 24 món", () => {
    expect(pageOf(rau, 1)).toHaveLength(PAGE_SIZE);
    expect(pageOf(rau, 2)).toHaveLength(rau.length - PAGE_SIZE);
    expect(pageCount(rau.length)).toBe(2);
  });
});

describe("thanh loại", () => {
  const bar = (current = "thit") => renderToStaticMarkup(<CategoryBar current={current} loai={TREE} counts={countByLoai(MONS)} onSelect={() => {}} />);
  it("mỗi nút loại kèm số món, loại lấy từ cây", () => {
    expect(bar()).toContain('Thịt <span class="opacity-70">30</span>');
    expect(bar().indexOf("Thịt")).toBeLessThan(bar().indexOf("Cá"));
    expect(bar().match(/aria-selected="true"/g)).toHaveLength(1);
  });
  it("có nút Quản lý loại ở cuối khi được truyền hàm, không thì không", () => {
    expect(bar()).not.toContain("Quản lý loại");
    const html = renderToStaticMarkup(<CategoryBar current="thit" loai={TREE} counts={{}} onSelect={() => {}} onManage={() => {}} />);
    expect(html).toContain("Quản lý loại");
    expect(html.indexOf("Nấm")).toBeLessThan(html.indexOf("Quản lý loại"));
  });
  it("nền trượt có hiệu ứng chuyển và tắt khi giảm chuyển động", () => {
    expect(bar()).toContain("transition-[transform,width]");
    expect(bar()).toContain("motion-reduce:transition-none");
  });
});

describe("thẻ món", () => {
  const mon = (change = {}) => ({ id: "1", ten: "Bí cô tiên", loai: "rau", nhom: "rau_la", anh: null, status: "ACTIVE" as const, donVi: "KG" as const, ...change });
  it("không ảnh thì ô thay thế, có ảnh thì alt là tên món và tải lười", () => {
    const none = renderToStaticMarkup(<MonGrid items={[mon()]} />);
    expect(none).toContain('data-testid="mon-fallback"');
    const img = renderToStaticMarkup(<MonGrid items={[mon({ anh: "http://x/a.webp" })]} />);
    expect(img).toContain('alt="Bí cô tiên"');
    expect(img).toContain('loading="lazy"');
  });
  it("món nháp có Badge Nháp, món đang dùng thì không", () => {
    expect(renderToStaticMarkup(<MonGrid items={[mon({ status: "DRAFT" })]} />)).toContain(">Nháp<");
    expect(renderToStaticMarkup(<MonGrid items={[mon()]} />)).not.toContain(">Nháp<");
  });
  it("thẻ là nút bấm mở khung sửa khi có onOpen", () => {
    const html = renderToStaticMarkup(<MonGrid items={[mon()]} onOpen={() => {}} />);
    expect(html).toContain("<button");
    expect(html).toContain("Bí cô tiên");
  });
  it("loại rỗng thì báo chưa có món", () => {
    expect(renderToStaticMarkup(<MonGrid items={[]} />)).toContain("Chưa có nguyên liệu nào trong loại này");
  });
  it("phân trang hiện số trang và đánh dấu trang hiện tại", () => {
    const html = renderToStaticMarkup(<NumberedPager current={2} total={3} onGo={() => {}} />);
    expect(html).toContain('aria-label="Trang 1"');
    expect(html).toContain('aria-current="page"');
  });
});

describe("nút lọc nhóm", () => {
  const filter = (selected: string[]) => renderToStaticMarkup(<NhomFilter nhom={TREE[0].nhom} selected={selected} counts={countByNhom(MONS, "thit")} onChange={() => {}} />);
  it("nút viền nét đứt, một biểu tượng dấu cộng", () => {
    const html = filter([]);
    expect(html).toContain("border-dashed");
    expect(html).toContain("lucide-circle-plus");
    expect(html.match(/<svg/g)).toHaveLength(1);
  });
  it("chọn 1-2 nhóm thì mỗi nhóm một huy hiệu, 3 nhóm trở lên thì gộp", () => {
    expect(filter(["lon", "bo"])).toContain(">Bò<");
    expect(filter(["lon", "bo", "ga"])).toContain(">3 nhóm<");
  });
  it("dòng đã chọn có dấu tích, dòng chưa chọn thì không", () => {
    expect(renderToStaticMarkup(<NhomOption label="Lợn" count={21} checked />)).toContain("lucide-check");
    expect(renderToStaticMarkup(<NhomOption label="Bò" count={13} checked={false} />)).not.toContain("lucide-check");
  });
});

describe("màn hình", () => {
  it("có ô tìm, ô trạng thái Đang dùng, và đang tải khi chưa có dữ liệu", () => {
    const html = screen();
    expect(html).toContain('aria-label="Tìm nguyên liệu"');
    expect(html).toContain("Đang dùng");
    expect(html).toContain("Đang tải danh mục");
    expect(html).toContain("h-10 w-64");
  });
});
