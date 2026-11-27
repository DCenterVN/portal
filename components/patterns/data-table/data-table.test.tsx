import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Pencil } from "lucide-react";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { vi } from "vitest";
import { DataTable, rowOpenProps, type DataTableProps } from "./data-table";
import { DataTableFooter } from "./data-table-footer";
import type { CursorPagination, DataTableColumn, PagePagination } from "./types";
import { useTableUrlState } from "./use-table-url-state";

const navMocks = vi.hoisted(() => ({ replace: vi.fn(), params: "f.zone=A&f.status=ACTIVE" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: navMocks.replace }),
  usePathname: () => "/items",
  useSearchParams: () => new URLSearchParams(navMocks.params),
}));

type Row = { id: string; name: string; price: number };
const rows: Row[] = [{ id: "1", name: "Gạo", price: 100 }, { id: "2", name: "Đậu", price: 50 }];
const columns: DataTableColumn<Row>[] = [
  { id: "name", header: "Tên", cell: row => row.name, sortable: true, sortValue: row => row.name },
  { id: "price", header: "Giá", cell: row => row.price, align: "right", hideable: true },
  { id: "note", header: "Ghi chú", cell: () => "x", hideBelow: "md" },
];
const base: DataTableProps<Row> = { columns, rows, rowId: row => row.id, rowLabel: row => row.name, mode: "server", empty: { title: "Chưa có dòng" } };
const html = (props: Partial<DataTableProps<Row>> = {}) => renderToStaticMarkup(<DataTable {...base} {...props} />);
const noop = () => {};
const cursor: CursorPagination = { kind: "cursor", pageSize: 20, page: 1, count: 20, total: 104, hasNext: true, onFirst: noop, onPrevious: noop, onNext: noop, onPageSize: noop };
const paged: PagePagination = { kind: "page", pageSize: 20, page: 2, count: 20, total: 104, onPage: noop, onPageSize: noop };
const footer = (pagination: CursorPagination | PagePagination) => renderToStaticMarkup(<DataTableFooter pagination={pagination} />);

describe("DataTable", () => {
  it("khung viền bo, tiêu đề, dòng, cột số canh phải", () => {
    const out = html();
    expect(out).toContain("rounded-lg border");
    expect(out).toContain("Gạo");
    expect(out).toMatch(/text-right tabular-nums/);
    expect(out).toMatch(/hidden md:table-cell/);
  });
  it("đang tải hiện khung xương trong khung, không hiện dòng", () => {
    const out = html({ rows: undefined, status: "loading" });
    expect(out).toContain('data-slot="skeleton"');
    expect(out).not.toContain("Gạo");
  });
  it("initialData vẽ ngay không khung xương", () => {
    const out = html({ rows: undefined, initialData: rows, status: "loading" });
    expect(out).toContain("Gạo");
    expect(out).not.toContain('data-slot="skeleton"');
  });
  it("rỗng và lỗi nằm trong khung", () => {
    expect(html({ rows: [] })).toContain("Chưa có dòng");
    const failed = html({ rows: undefined, status: "error", error: "Hỏng rồi", onRetry: noop });
    expect(failed).toContain("Hỏng rồi");
    expect(failed).toContain("Thử lại");
  });
  it("cột có sắp xếp có nút và aria-sort", () => {
    const out = html({ sort: { id: "name", desc: true } });
    expect(out).toContain('aria-sort="descending"');
    expect(out).toContain("<button");
    expect(html({ columns: columns.map(column => ({ ...column, sortable: false })) })).not.toContain("<button");
  });
  it("chế độ trình duyệt sắp xếp tại chỗ có dấu tiếng Việt", () => {
    const out = html({ mode: "client", defaultSort: { id: "name", desc: false }, rows: [{ id: "1", name: "Đường", price: 1 }, { id: "2", name: "Dưa", price: 2 }, ...rows] });
    expect(out.indexOf("Dưa")).toBeLessThan(out.indexOf("Đường"));
  });
  it("dòng mở ra được: aria-expanded và nội dung con", () => {
    const out = html({ renderExpanded: row => <p>Con của {row.name}</p>, expandedIds: ["1"], onToggleRow: noop });
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain("Con của Gạo");
    expect(out).not.toContain("Con của Đậu");
  });
  it("có cột thao tác khi khai rowActions", () => {
    expect(html({ rowActions: () => [{ label: "Sửa", icon: Pencil, onSelect: noop }] })).toContain("Thao tác cho Gạo");
  });
  it("thanh công cụ: ô tìm, nút lọc gộp, chip khi đang lọc, Xoá lọc chỉ khi đang lọc", () => {
    const toolbar = { search: { value: "", onChange: noop, placeholder: "Tìm", label: "Tìm nhà cung cấp" }, filters: [{ id: "s", title: "Trạng thái", options: [{ value: "A", label: "Đang hợp tác" }], selected: ["A"], onChange: noop }], onClear: noop };
    const out = html({ toolbar });
    expect(out).toContain('aria-label="Tìm nhà cung cấp"');
    expect(out).toContain('aria-label="Lọc theo Trạng thái (1 đang chọn)"');
    expect(out).toContain("text-xs");
    expect(out).not.toContain("text-[10px]");
    expect(out).toContain('aria-label="Cột hiển thị"');
    expect(out).not.toContain("Sắp xếp");
    expect(out).not.toContain("Xoá lọc");
    expect(out).not.toContain("Trạng thái: Đang hợp tác");
    const emptyFilter = html({ toolbar: { ...toolbar, filters: [{ ...toolbar.filters[0], selected: [] }] } });
    expect(emptyFilter).toContain('aria-label="Lọc theo Trạng thái"');
    const activeOut = html({ toolbar: { ...toolbar, active: true } });
    expect(activeOut).toContain("Xoá lọc");
    expect(activeOut).toContain("Trạng thái: Đang hợp tác");
    expect(activeOut).toContain('aria-label="Bỏ lọc Trạng thái: Đang hợp tác"');
  });
  it("không có cột hideable thì không có nút Cột hiển thị", () => {
    expect(html({ columns: columns.map(column => ({ ...column, hideable: false })), toolbar: {} })).not.toContain('aria-label="Cột hiển thị"');
  });
});

describe("DataTableFooter", () => {
  it("con trỏ có tổng: dòng hiển thị, trang trên, ba nút, không có nút trang cuối", () => {
    const out = footer(cursor);
    expect(out).toContain("Hiển thị 1–20 trong 104");
    expect(out).toContain("Trang 1 trên 6");
    expect(out).toContain("Số dòng mỗi trang");
    for (const label of ["Về trang đầu", "Trang trước", "Trang sau"]) expect(out).toContain(`aria-label="${label}"`);
    expect(out).not.toContain("Tới trang cuối");
  });
  it("trang đầu thì khoá về đầu và trang trước, còn trang sau", () => {
    const out = footer(cursor);
    expect(out).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Về trang đầu"|aria-label="Về trang đầu"[^>]*disabled=""/);
    expect(out).not.toMatch(/aria-label="Trang sau"[^>]*disabled=""|disabled=""[^>]*aria-label="Trang sau"/);
  });
  it("hết con trỏ thì khoá trang sau", () => {
    expect(footer({ ...cursor, page: 6, count: 4, hasNext: false })).toMatch(/aria-label="Trang sau"[^>]*disabled=""|disabled=""[^>]*aria-label="Trang sau"/);
  });
  it("kiểu số trang có nút trang cuối; không biết tổng thì chỉ 'Trang n'", () => {
    expect(footer(paged)).toContain("Tới trang cuối");
    expect(footer(paged)).toContain('aria-label="Số trang"');
    expect(footer(paged)).toContain('value="2"');
    expect(footer(cursor)).not.toContain('aria-label="Số trang"');
    expect(footer(paged)).toContain("Hiển thị 21–40 trong 104");
    const unknown = footer({ ...paged, total: undefined, hasNext: true });
    expect(unknown).toContain("Trang 2");
    expect(unknown).not.toContain("trên");
    expect(unknown).not.toContain("Tới trang cuối");
  });
});

describe("ô ngày", () => {
  it("gợi ý Chọn ngày, đã chọn thì dd/MM/yyyy", () => {
    expect(renderToStaticMarkup(<DatePicker value="" onChange={noop} />)).toContain("Chọn ngày");
    expect(renderToStaticMarkup(<DatePicker value="" onChange={noop} />)).not.toContain("dd/mm/yyyy");
    expect(renderToStaticMarkup(<DatePicker value="2026-11-16" onChange={noop} />)).toContain("16/11/2026");
  });
  it("khoảng ngày", () => {
    expect(renderToStaticMarkup(<DateRangePicker from="" to="" onChange={noop} />)).toContain("Chọn khoảng ngày");
    expect(renderToStaticMarkup(<DateRangePicker from="2026-11-01" to="2026-11-16" onChange={noop} />)).toContain("01/11/2026 – 16/11/2026");
  });
});

describe("EntityPicker", () => {
  const props = { label: "Nguyên liệu", name: "m", items: undefined, status: "error" as const, getId: (item: string) => item, getLabel: (item: string) => item, onRetry: noop };
  it("câu lỗi tải dễ hiểu", () => {
    const out = renderToStaticMarkup(<EntityPicker {...props} />);
    expect(out).toContain("Chưa tải được danh sách. Bấm Thử lại.");
    expect(renderToStaticMarkup(<EntityPicker {...props} onRetry={undefined} />)).not.toContain("Thử lại");
  });
  it("ẩn nhãn khỏi mắt nhưng giữ cho trình đọc màn hình", () => {
    expect(renderToStaticMarkup(<EntityPicker {...props} hideLabel />)).toMatch(/sr-only[^>]*>Nguyên liệu|Nguyên liệu<\/label>/);
    expect(renderToStaticMarkup(<EntityPicker {...props} hideLabel />)).toContain("sr-only");
    expect(renderToStaticMarkup(<EntityPicker {...props} />)).not.toMatch(/class="[^"]*\bsr-only\b[^"]*"[^>]*>Nguyên liệu/);
  });
});

describe("dòng bấm được", () => {
  it("có onRowOpen thì dòng vào được bằng Tab và hiện con trỏ tay; không có thì không", () => {
    expect(html({ onRowOpen: () => {} })).toMatch(/<tr[^>]*tabindex="0"[^>]*cursor-pointer|<tr[^>]*cursor-pointer[^>]*tabindex="0"/);
    expect(html()).not.toContain("tabindex");
  });
  it("bấm chỗ nào trên dòng cũng mở; bấm nút bên trong thì không; Enter trên dòng mở", () => {
    const open = vi.fn();
    const props = rowOpenProps(open);
    const row = {};
    props.onClick({ target: { closest: () => null } } as never);
    props.onClick({ target: { closest: () => ({}) } } as never);
    expect(open).toHaveBeenCalledTimes(1);
    props.onKeyDown({ key: "Enter", target: row, currentTarget: row } as never);
    props.onKeyDown({ key: "Enter", target: {}, currentTarget: row } as never);
    props.onKeyDown({ key: "a", target: row, currentTarget: row } as never);
    expect(open).toHaveBeenCalledTimes(2);
  });
});

describe("FilterMenu bỏ chọn nhiều bộ lọc", () => {
  it("xoá lần lượt ≥2 bộ lọc trong cùng 1 sự kiện không bị ghi đè closure cũ", () => {
    navMocks.replace.mockReset();
    navMocks.params = "f.zone=A&f.status=ACTIVE";
    let api: ReturnType<typeof useTableUrlState> | undefined;
    function Probe() {
      api = useTableUrlState({ filterKeys: ["zone", "status"], pageSizes: [10, 20], defaultPageSize: 10 });
      return null;
    }
    renderToStaticMarkup(<Probe />);
    api?.setFilter("zone", []);
    api?.setFilter("status", []);
    expect(navMocks.replace).toHaveBeenNthCalledWith(1, "/items?f.status=ACTIVE", { scroll: false });
    expect(navMocks.replace).toHaveBeenNthCalledWith(2, "/items", { scroll: false });
  });
});
