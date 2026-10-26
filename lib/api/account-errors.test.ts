import {describe,it,expect} from "vitest";
import {accountErrorMessage} from "./account-client";
import {FetchError} from "@/lib/fetcher";
import viMessages from "@/messages/vi.json";
import enMessages from "@/messages/en.json";
describe("account errors and catalogs",()=>{
 it.each(["invalid_current_password","UNAUTHORIZED","FORBIDDEN","BAD_REQUEST","VALIDATION_ERROR","invalid_token","rate_limit_exceeded","service_busy","FILE_TOO_LARGE","UNSUPPORTED_IMAGE_FORMAT","IMAGE_DIMENSIONS_EXCEEDED","UPLOAD_EXPIRED","STORAGE_PROMOTION_FAILED","COMMIT_OUTCOME_UNKNOWN"])("never exposes upstream details for %s",code=>{const message=accountErrorMessage(new FetchError("SQL host password=secret",400,{error:code}));expect(message).not.toMatch(/SQL|secret|host/);expect(message).toMatch(/[àáảãạăâđêôơư]/i);});
 it("has matching translated account keys",()=>{expect(Object.keys(viMessages.accountEdit).sort()).toEqual(Object.keys(enMessages.accountEdit).sort());for(const value of Object.values(enMessages.accountEdit))expect(JSON.stringify(value).length).toBeGreaterThan(0);expect(Object.keys(viMessages.accountEdit.errors).sort()).toEqual(Object.keys(enMessages.accountEdit.errors).sort());});
});
