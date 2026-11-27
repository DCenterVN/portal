import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { QuantityInput, parseQuantity } from "./quantity-input";

it.each([["0,5", 0.5], ["0.5", 0.5], ["0.500", 0.5], ["1,25", 1.25], ["abc", null]])("đọc %s là %s", (text, expected) => {
  expect(parseQuantity(text)).toBe(expected);
});

it("vẽ nửa đơn vị là 0,5", () => {
  const html = renderToStaticMarkup(<QuantityInput label="Số lượng" value={0.5} stepper={{ decrease: "Giảm", increase: "Tăng" }} onValue={() => {}} />);
  expect(html).toContain('value="0,5"');
});
