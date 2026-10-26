import {describe,it,expect} from "vitest";
import {preflightAccount,withAccountLease} from "./account-fixtures";
import {AccountHTTP} from "./account-http";
describe("account-security.password",()=>{
 for(const audience of ["customer","employee"] as const)it(`revokes both ${audience} sessions and restores password`,async()=>{
  const env=await preflightAccount();const fixture=env.fixtures.find(row=>row.audience===audience)!;
  await withAccountLease("runtime",async()=>{
   const a=new AccountHTTP(env.portal),b=new AccountHTTP(env.portal);
   await a.login(fixture.email,fixture.password,audience);await b.login(fixture.email,fixture.password,audience);
   const oldA=a.copy(),oldB=b.copy();const candidate=`AccountQA!${crypto.randomUUID()}`;
   let changed=false;
   try {
    const invalid=await a.call("/api/auth/password/change","POST",{current_password:"wrong-password",new_password:candidate});expect(invalid.status).toBe(401);expect((await a.call("/api/auth/me")).status).toBe(200);
    const response=await a.call("/api/auth/password/change","POST",{current_password:fixture.password,new_password:candidate});
    if(response.status===204)changed=true;expect(response.status).toBe(204);
    expect((await oldA.call("/api/auth/refresh","POST")).status).toBe(401);expect((await oldB.call("/api/auth/refresh","POST")).status).toBe(401);
    const rejected=new AccountHTTP(env.portal);await expect(rejected.login(fixture.email,fixture.password,audience)).rejects.toThrow("HTTP 401");
    await a.login(fixture.email,candidate,audience);expect((await a.call("/api/auth/me")).status).toBe(200);
   }finally {
    // A lost response may still have committed; probe candidate before choosing cleanup credentials.
    const restore=new AccountHTTP(env.portal);
    if(!changed){try {await restore.login(fixture.email,candidate,audience);changed=true;}catch {await restore.login(fixture.email,fixture.password,audience);}}
    if(changed){await restore.login(fixture.email,candidate,audience);const response=await restore.call("/api/auth/password/change","POST",{current_password:candidate,new_password:fixture.password});expect(response.status).toBe(204);}
    await restore.login(fixture.email,fixture.password,audience);expect((await restore.call("/api/auth/me")).status).toBe(200);
   }
  });
 },180000);
});
