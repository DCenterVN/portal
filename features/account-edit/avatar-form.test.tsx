import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {describe,expect,it,vi} from "vitest";
vi.mock("next-intl",async original=>{const actual=await original<typeof import("next-intl")>();const messages:Record<string,unknown>=(await import("@/messages/vi.json")).default;return {...actual,useTranslations:(namespace:string)=>actual.createTranslator({locale:"vi",messages,namespace})};});
import {AvatarForm} from "@/components/patterns/account/avatar-form";
const props={current:"https://storage.example/old",preview:"",pending:false,onSelect:vi.fn(),onSave:vi.fn(),onCancel:vi.fn(),onDelete:vi.fn()};
describe("account avatar form",()=>{
 it("keeps selection separate from save and restricts image types",()=>{const html=renderToStaticMarkup(<AvatarForm {...props}/>);expect(html).toContain('accept="image/jpeg,image/png,image/webp"');expect(html).toContain('for="account-avatar"');expect(html).not.toContain('>Lưu ảnh<');expect(html).toContain('src="https://storage.example/old"');});
 it("renders local preview with explicit save/cancel and pending locks",()=>{const html=renderToStaticMarkup(<AvatarForm {...props} preview="blob:preview" pending/>);expect(html).toContain('src="blob:preview"');expect(html).toContain("Đang lưu");expect(html).toContain("Hủy");expect(html).toContain('aria-busy="true"');expect(html).toContain("disabled");});
 it("associates upload errors with selection",()=>{const html=renderToStaticMarkup(<AvatarForm {...props} error="Ảnh lỗi"/>);expect(html).toContain('aria-invalid="true"');expect(html).toContain('aria-describedby="account-avatar-error"');expect(html).toContain('role="alert"');});
});
