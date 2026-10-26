import {describe,it,expect,vi,afterEach} from "vitest";
import {parseAccountFixtures,preflightAccount,withAccountLease} from "./account-fixtures";
const env={ACCOUNT_CUSTOMER_EMAIL:"account-customer@example.test",ACCOUNT_CUSTOMER_PASSWORD:"fixture-only-pass",ACCOUNT_CUSTOMER_EMAIL_B:"account-customer-b@example.test",ACCOUNT_EMPLOYEE_EMAIL:"account-staff@example.test",ACCOUNT_EMPLOYEE_PASSWORD:"fixture-only-pass",ACCOUNT_EMPLOYEE_EMAIL_B:"account-staff-b@example.test"};
afterEach(()=>vi.unstubAllGlobals());
describe("account fixture validation",()=>{
 it("requires both dedicated identities and two distinct emails each",()=>{expect(parseAccountFixtures(env)).toHaveLength(2);for(const key of Object.keys(env)){const invalid={...env,[key]:""};expect(()=>parseAccountFixtures(invalid)).toThrow();}expect(()=>parseAccountFixtures({...env,ACCOUNT_EMPLOYEE_EMAIL:env.ACCOUNT_CUSTOMER_EMAIL})).toThrow();});
 it("fails preflight before network when config is absent",async()=>{vi.stubGlobal("fetch",vi.fn());await expect(preflightAccount({})).rejects.toThrow("QA_ROLE_ENV");expect(fetch).not.toHaveBeenCalled();});
 it("serializes exclusive fixture lease without leaking credentials",async()=>{let release!:()=>void;let started!:()=>void;const ready=new Promise<void>(resolve=>{started=resolve;});const pending=withAccountLease("unit-test",()=>new Promise<void>(resolve=>{release=resolve;started();}));await ready;await expect(withAccountLease("unit-test",async()=>{})).rejects.toThrow("lease");release();await pending;await expect(withAccountLease("unit-test",async()=>42)).resolves.toBe(42);});
});
