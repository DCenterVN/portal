import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ReceiptLinesTable, type ReceiptLinesTableProps } from "./receipt-lines-table";

const props: ReceiptLinesTableProps = {
 rows:[{key:"one",sku:"",quantity:1, amount:null}], materials:[], status:"ready", supplierSelected:false,
 onPrice:vi.fn(), onSku:vi.fn(), onQuantity:vi.fn(), onAdd:vi.fn(), onRemove:vi.fn(), busy:false,
};
describe("receipt child table", () => {
 it("renders six columns, blanks and incomplete total before selection", () => {
  const html = renderToStaticMarkup(<ReceiptLinesTable {...props} />);
  expect(html.match(/<th /g)).toHaveLength(6);
  for(const label of ["Nguyên liệu","ĐVT","SL","Đơn giá","Thành tiền","Chưa đủ giá","Chọn NCC trước"]) expect(html).toContain(label);
  expect(html).toMatch(/aria-label="Xoá dòng 1"[^>]*disabled/);
  expect(html).not.toContain("Chưa có hợp đồng");
 });
 it("renders total 72500 and editable actual prices", () => {
  const html=renderToStaticMarkup(<ReceiptLinesTable {...props} supplierSelected rows={[{key:"one",sku:"a",quantity:2.5,unitPrice:25000,amount:62500,uom:"KG"},{key:"two",sku:"b",quantity:1,unitPrice:10000,amount:10000,uom:"CAI"}]} />);
  expect(html).toContain("72.500");
  expect(html).toContain('aria-label="Đơn giá dòng 1"');
  expect(html).toContain('value="25000"');
  expect(html).not.toContain("readonly");
 });
 it("caps at 100 and locks the entire table while saving", () => {
  const html=renderToStaticMarkup(<ReceiptLinesTable {...props} busy rows={Array.from({length:100},(_,index)=>({...props.rows[0],key:String(index)}))} />);
  expect(html).toContain("Tối đa 100 dòng");
  expect(html).toContain('<fieldset disabled');
 });
});

it("cảnh báo giá lệch không khóa ô giá, giá 0 vẫn là giá hợp lệ", () => {
 const html = renderToStaticMarkup(<ReceiptLinesTable {...props} supplierSelected rows={[{key:"one",sku:"a",quantity:1,unitPrice:120,referencePrice:100,amount:120}]} />);
 expect(html).toContain("Giá nhập khác bảng giá tham chiếu");
 expect(html).toContain("20%");
 expect(html).not.toMatch(/aria-label="Đơn giá dòng 1"[^>]*disabled/);
 const zero = renderToStaticMarkup(<ReceiptLinesTable {...props} supplierSelected rows={[{key:"one",sku:"a",quantity:1,unitPrice:0,amount:0}]} />);
 expect(zero).toContain('value="0"');
});
