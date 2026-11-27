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
  for(const label of ["Nguyên liệu","Đơn vị","Số lượng","Đơn giá","Thành tiền","Chưa đủ giá","Chọn nhà cung cấp trước"]) expect(html).toContain(label);
  expect(html).toMatch(/aria-label="Xoá dòng 1"[^>]*disabled/);
  expect(html).not.toContain("Chưa có hợp đồng");
 });
 it("renders total 72500 and editable actual prices", () => {
  const html=renderToStaticMarkup(<ReceiptLinesTable {...props} supplierSelected rows={[{key:"one",sku:"a",quantity:2,unitPrice:25000,amount:50000,uom:"KG"},{key:"two",sku:"b",quantity:1,unitPrice:10000,amount:10000,uom:"CAI"}]} />);
  expect(html).toContain("60.000");
  expect(html).toContain('aria-label="Đơn giá dòng 1"');
  expect(html).toContain('value="25.000"'); expect(html).toContain('value="2"');
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

it("khối số lượng liền một viền, đơn giá có hậu tố đ, xoá là nút biểu tượng", () => {
 const html = renderToStaticMarkup(<ReceiptLinesTable {...props} supplierSelected rows={[{key:"one",sku:"a",quantity:1,unitPrice:12000,referencePrice:12000,amount:12000,uom:"KG"},{key:"two",sku:"b",quantity:6,unitPrice:5000,amount:30000,uom:"KG"}]} />);
 expect(html.match(/data-slot="input-group"/g)).toHaveLength(4);
 expect(html).toMatch(/aria-label="Giảm số lượng dòng 1"[^>]*disabled/);
 expect(html).not.toMatch(/aria-label="Giảm số lượng dòng 2"[^>]*disabled/);
 expect(html).toContain("Giá tham chiếu 12.000 đ");
 expect(html).toContain("2 dòng · Tổng tiền dự kiến");
 expect(html).toContain("42.000 đ");
 expect(html).not.toContain(">Xoá</button>");
});

it("nguyên liệu đã có ở dòng khác hiện mờ, ghi Đã có ở dòng n và không chọn được", async () => {
 const { EntityList } = await import("@/components/patterns/entity-picker");
 const { Command } = await import("@/components/ui/command");
 const html = renderToStaticMarkup(<Command shouldFilter={false}><EntityList options={[{id:"a"},{id:"b"}]} picked={null} onPick={() => {}} emptyMessage="" getId={item => item.id} getLabel={item => item.id} isDisabled={item => item.id === "a"} /></Command>);
 expect(html.match(/aria-disabled="true"/g)).toHaveLength(1);
});
