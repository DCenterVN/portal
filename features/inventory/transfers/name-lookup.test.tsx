import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NamesLoadError } from "./names-load-error";
import { resolveName, skuStatusNote } from "./name-lookup";

const names = new Map([["a", "Cá nục kho"]]);
it("tra tên hỏng thì mã không có trong kết quả hiện Không tải được tên hàng, không hiện chưa rõ tên", () => {
  expect(resolveName(names, true, "b", undefined, "Món chưa rõ tên")).toBe("Không tải được tên hàng");
  expect(resolveName(names, true, "a", undefined, "Món chưa rõ tên")).toBe("Cá nục kho");
});
it("chưa rõ tên chỉ dành cho mã mà lượt tra thành công không có", () => {
  expect(resolveName(names, false, "b", undefined, "Món chưa rõ tên")).toBe("Món chưa rõ tên");
  expect(resolveName(names, false, "b", 2, "Món chưa rõ tên")).toBe("Nguyên liệu dòng 2");
});
it("báo lỗi tải tên hàng có nút thử lại", () => {
  const html = renderToStaticMarkup(<NamesLoadError retry={vi.fn()} />);
  expect(html).toContain("Không tải được tên hàng");
  expect(html).toContain("Thử lại");
});
it("sku_status_note: hàng khác đang bán hiện nhãn trạng thái, hàng đang bán và chưa rõ thì không", () => {
  expect(skuStatusNote("SUSPENDED")).toBe("Tạm ngưng bán");
  expect(skuStatusNote("DRAFT")).toBe("Nháp");
  expect(skuStatusNote("ACTIVE")).toBe("");
  expect(skuStatusNote(undefined)).toBe("");
});
