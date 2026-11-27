import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OrderValueField } from "./order-value-field";

const register = { name: "value", onChange: async () => {}, onBlur: async () => {}, ref: () => {} };
it("ô lý do huỷ dùng khuôn chung: không lỗi thì không trỏ tới phần tử lỗi không có", () => {
  const html = renderToStaticMarkup(<OrderValueField label="Lý do huỷ" register={register} busy={false} />);
  expect(html).toContain("Lý do huỷ");
  expect(html).not.toContain("aria-describedby");
  expect(html).not.toContain(`aria-invalid="true"`);
});
it("ô lý do huỷ có lỗi thì báo đúng chỗ và nối với ô nhập", () => {
  const html = renderToStaticMarkup(<OrderValueField label="Lý do huỷ" register={register} busy={false} error="Nhập lý do" />);
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('aria-describedby="order-action-value-error"');
  expect(html).toMatch(/id="order-action-value-error"[^>]*>Nhập lý do</);
});
