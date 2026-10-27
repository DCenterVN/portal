import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptDateInput, parseReceiptDate, formatReceiptDate, receiptToday } from "./receipt-date-input";

describe("receipt date calendar and wire roundtrip", () => {
  it.each([["27/10/2026", "2026-10-27"], ["29/02/2028", "2028-02-29"], ["01/01/2000", "2000-01-01"]])("parses %s without browser locale", (text, iso) => {
    expect(parseReceiptDate(text)).toBe(iso);
    expect(formatReceiptDate(iso)).toBe(text);
    expect(`${parseReceiptDate(text)}T12:00:00+07:00`).toBe(`${iso}T12:00:00+07:00`);
  });
  it.each(["", "31/02/2026", "29/02/2027", "31/04/2026", "00/12/2026", "01/13/2026", "1/2/2026", "2026-10-27", "01/01/0000"]) ("rejects invalid or incomplete %s", text => {
    expect(parseReceiptDate(text)).toBe("");
  });
  it("uses the Vietnam date across UTC midnight", () => {
    expect(receiptToday(new Date("2026-10-26T18:00:00Z"))).toBe("2026-10-27");
  });
  it("renders text dd/mm/yyyy, never a locale dependent native date", () => {
    const html = renderToStaticMarkup(<ReceiptDateInput value="2026-10-27" onChange={() => {}} />);
    expect(html).toContain('value="27/10/2026"');
    expect(html).toContain('inputMode="numeric"');
    expect(html).not.toContain('type="date"');
    expect(html).not.toContain('role="alert"');
  });
});
