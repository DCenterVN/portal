import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessProvider } from "@/lib/access-boundary";
import type { MaterialCategory } from "@/lib/api/material-catalog";
import { CategoryList } from "./material-category-sheet";
import { MaterialGroupFilter } from "./material-group-filter";

const TREE: MaterialCategory[] = [
  { code: "rau", label: "Rau", active: true, groups: [{ code: "rau_la", label: "Rau lá", active: true }, { code: "rau_cu", label: "Rau củ cũ", active: false }] },
  { code: "nam", label: "Nấm", active: true, groups: [] },
  { code: "tra", label: "Trà thử", active: true, groups: [] },
  { code: "xua", label: "Loại xưa", active: false, groups: [] },
];
const COUNTS = { rau: 3, rau_la: 3, nam: 2 };
const render = (props: { counts?: Record<string, number>; showInactive?: boolean; lifecycle?: boolean } = {}) => renderToStaticMarkup(
  <AccessProvider value={{ plane: "company", root: "/employee", actions: new Set(["inventory:material_category:update", ...(props.lifecycle === false ? [] : ["inventory:material_category:lifecycle"])]) }}>
    <CategoryList tree={TREE} counts={props.counts ?? COUNTS} showInactive={props.showInactive ?? false} onMode={() => {}} onToggle={() => {}} onDeleted={() => {}} />
  </AccessProvider>,
);

describe("Quản lý loại: nút hành động là icon", () => {
  it("có aria-label, không nhét chữ vào nút", () => {
    const html = render();
    for (const label of ["Thêm nhóm", "Đổi tên", "Ngừng dùng", "Xoá"]) expect(html).toContain(`aria-label="${label}"`);
    for (const label of ["Thêm nhóm", "Đổi tên", "Ngừng dùng", "Xoá"]) expect(html).not.toContain(`>${label}<`);
    expect(html).toContain("lucide-folder-plus");
    expect(html).toContain("lucide-pencil");
    expect(html).toContain("lucide-ban");
    expect(html).toContain("lucide-trash2");
  });
  it("cái đã ngừng có nút Dùng lại bằng icon", () => {
    const html = render({ showInactive: true });
    expect(html).toContain('aria-label="Dùng lại"');
    expect(html).toContain("lucide-rotate-ccw");
  });
});

describe("bộ lọc Nhóm", () => {
  it("dùng icon lọc, không phải dấu cộng", () => {
    const html = renderToStaticMarkup(<MaterialGroupFilter groups={[{ code: "a", label: "A", active: true }]} selected={[]} counts={{}} onChange={() => {}} />);
    expect(html).toContain("lucide-list-filter");
    expect(html).not.toContain("lucide-circle-plus");
  });
});

describe("ẩn cái đã ngừng", () => {
  it("mặc định chỉ hiện loại và nhóm đang dùng", () => {
    const html = render();
    expect(html).not.toContain("Loại xưa");
    expect(html).not.toContain("Rau củ cũ");
    expect(html).not.toContain("Đã ngừng");
  });
  it("bật lên thì hiện cả cái đã ngừng kèm nhãn", () => {
    const html = render({ showInactive: true });
    expect(html).toContain("Loại xưa");
    expect(html).toContain("Rau củ cũ");
    expect(html).toContain("Đã ngừng");
  });
});

const trashes = (html: string, name: string) => {
  const row = html.split('<div class="flex items-center gap-1').find(part => part.includes(`>${name}<`)) ?? "";
  return row.includes('aria-label="Xoá"');
};

describe("nút Xoá", () => {
  it("chỉ hiện khi không có nhóm con, số nguyên liệu bằng 0 và có quyền", () => {
    const html = render();
    expect(trashes(html, "Rau")).toBe(false);
    expect(trashes(html, "Nấm")).toBe(false);
    expect(trashes(html, "Trà thử")).toBe(true);
  });
  it("nhóm còn nguyên liệu thì không có Xoá, nhóm trống thì có", () => {
    expect(render({ showInactive: true }).match(/aria-label="Xoá"/g)).toHaveLength(3);
  });
  it("loại còn nhóm đã ngừng vẫn không có Xoá", () => {
    expect(trashes(render({ counts: {} }), "Rau")).toBe(false);
  });
  it("không có quyền lifecycle thì không thấy Xoá", () => {
    expect(render({ lifecycle: false })).not.toContain('aria-label="Xoá"');
  });
  it("Xoá mở hộp hỏi lại, không xoá ngay", () => {
    expect(render()).toContain('aria-haspopup="dialog"');
  });
});

describe("icon một mối", () => {
  it("mỗi nút hành động chỉ có 1 svg lucide và không có chữ hiện ra", () => {
    const buttons = render({ showInactive: true }).match(/<button[^>]*>.*?<\/button>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(8);
    for (const button of buttons) {
      expect(button.match(/<svg/g)).toHaveLength(1);
      expect(button).toContain("lucide-");
      expect(button.replace(/<svg.*?<\/svg>/, "").replace(/<[^>]+>/g, "")).toBe("");
      expect(button).toContain(button.includes("aria-label=\"Xoá\"") ? "text-destructive" : "text-muted-foreground");
    }
  });
});
