import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { WholeNumberInput, formatWhole, parseWhole } from "./whole-number-input";
import { lineAmount } from "./receipt-lines";

describe("số nguyên kiểu Việt Nam", () => {
  it("gõ 1028 hiện 1.028 và thành tiền tính đúng một nghìn không trăm hai mươi tám", () => {
    expect(parseWhole("1028")).toEqual({ kind: "ok", value: 1028 });
    expect(parseWhole("1.028")).toEqual({ kind: "ok", value: 1028 });
    expect(formatWhole(1028)).toBe("1.028");
    expect(lineAmount(1028, 8)).toBe(8224);
  });
  it("không nhận số lẻ hay chữ", () => {
    for (const text of ["1,5", "1.5", "abc", "1.02", "-3"]) expect(parseWhole(text).kind).toBe("error");
    expect(parseWhole("").kind).toBe("empty");
  });
  it("vẽ số có dấu chấm nghìn, không step thập phân", () => {
    const html = renderToStaticMarkup(<WholeNumberInput label="Số lượng dòng 1" min={1} emptyValue={0} value={1028} onValue={() => {}} />);
    expect(html).toContain('value="1.028"'); expect(html).not.toContain("step="); expect(html).not.toContain('type="number"');
  });
});

describe("nút cộng trừ", () => {
  it("có nút Giảm và Tăng, Giảm tắt ở mức nhỏ nhất", () => {
    const html = renderToStaticMarkup(<WholeNumberInput label="Số lượng dòng 1" min={1} emptyValue={0} value={1} onValue={() => {}} stepper={{ decrease: "Giảm số lượng dòng 1", increase: "Tăng số lượng dòng 1" }} />);
    expect(html).toMatch(/aria-label="Giảm số lượng dòng 1"[^>]*disabled|disabled[^>]*aria-label="Giảm số lượng dòng 1"/);
    expect(html).toContain('aria-label="Tăng số lượng dòng 1"');
  });
});
