import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MaterialToolbar } from "./material-toolbar";
import { MaterialGroupFilter, GroupChips } from "./material-group-filter";
import { MaterialCard } from "./materials-view-parts";
import { TREE } from "./materials-fixtures";

const groups = TREE[0].groups;
const toolbar = (selected: string[] = []) => renderToStaticMarkup(<MaterialToolbar text="" onText={() => {}} groups={groups} selected={selected} counts={{}} onGroups={() => {}} status="dang-dung" onStatus={() => {}} />);

describe("nút lọc nhóm chỉ icon", () => {
  const filter = (selected: string[]) => renderToStaticMarkup(<MaterialGroupFilter groups={groups} selected={selected} counts={{}} onChange={() => {}} />);
  it("không chữ, có aria-label, không viền đứt", () => {
    const html = filter([]);
    expect(html).toContain('aria-label="Lọc theo nhóm"');
    expect(html).not.toContain(">Nhóm<");
    expect(html).not.toContain("border-dashed");
    expect(html).toContain("lucide-list-filter");
  });
  it("đang lọc thì có số nhóm đã chọn ở góc nút", () => {
    expect(filter([])).not.toContain('data-testid="group-count"');
    expect(filter(["lon", "bo"])).toMatch(/data-testid="group-count"[^>]*>2</);
  });
  it("nhóm đã chọn hiện thành chip có nút xoá", () => {
    const html = renderToStaticMarkup(<GroupChips groups={groups} selected={["lon", "bo"]} onChange={() => {}} />);
    expect(html).toContain("Lợn");
    expect(html).toContain('aria-label="Bỏ lọc Bò"');
    expect(renderToStaticMarkup(<GroupChips groups={groups} selected={[]} onChange={() => {}} />)).toBe("");
  });
});

describe("thanh công cụ thẳng hàng", () => {
  it("ba ô cùng h-9, rounded-md, border-input; ô tìm không pill", () => {
    const html = toolbar();
    for (const id of ["search", "filter", "status"]) {
      const part = html.match(new RegExp(`<[^>]*data-testid="toolbar-${id}"[^>]*>`))?.[0] ?? "";
      expect(part, id).toMatch(/(^|[ "])(h|size)-9[ "]/);
      expect(part, id).toContain("rounded-md");
      expect(part, id).toContain("border-input");
    }
    expect(html).not.toContain("rounded-full");
    expect(html).toContain("w-70");
    expect(html).toContain("items-center gap-2");
  });
  it("thứ tự tìm, lọc, trạng thái", () => {
    const html = toolbar();
    expect(html.indexOf("toolbar-search")).toBeLessThan(html.indexOf("toolbar-filter"));
    expect(html.indexOf("toolbar-filter")).toBeLessThan(html.indexOf("toolbar-status"));
  });
  it("loại không có nhóm thì ẩn nút lọc", () => {
    const html = renderToStaticMarkup(<MaterialToolbar text="" onText={() => {}} groups={[]} selected={[]} counts={{}} onGroups={() => {}} status="dang-dung" onStatus={() => {}} />);
    expect(html).not.toContain("toolbar-filter");
  });
});

describe("ảnh thay thế", () => {
  it("không svg, có chữ cái đầu", () => {
    const html = renderToStaticMarkup(<MaterialCard material={{ id: "1", name: "Bí cô tiên", category: "rau", group: "rau_la", imageUrl: null, status: "ACTIVE", unit: "KG" }} />);
    const box = html.match(/data-testid="material-fallback"[^>]*>(.*?)<\/div>/)?.[1] ?? "";
    expect(box).toBe("B");
    expect(html.match(/<svg/g)).toBeNull();
  });
});
