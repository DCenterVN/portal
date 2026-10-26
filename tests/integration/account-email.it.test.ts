import {describe,it,expect} from "vitest";
import {preflightAccount,withAccountLease} from "./account-fixtures";
import {AccountHTTP} from "./account-http";
describe("account-security.email",()=>{
 for(const audience of ["customer","employee"] as const)it(`confirms real Mailpit link for ${audience}, rejects replay/foreign owner and restores email`,async()=>{
  const env=await preflightAccount();const fixture=env.fixtures.find(row=>row.audience===audience)!;
  const other=env.fixtures.find(row=>row.audience!==audience)!;
  await withAccountLease("runtime",async()=>{
   const a=new AccountHTTP(env.portal),b=new AccountHTTP(env.portal),foreign=new AccountHTTP(env.portal);
   await a.login(fixture.email,fixture.password,audience);await b.login(fixture.email,fixture.password,audience);await foreign.login(other.email,other.password,other.audience);
   const oldA=a.copy(),oldB=b.copy();const seen=new Set<string>();let changed=false;
   try {
    const since=Date.now()-1000;
    const response=await a.call("/api/auth/email/change","POST",{current_password:fixture.password,new_email:fixture.emailB});expect(response.status).toBe(202);
    expect((await a.profile()).email===fixture.email).toBe(true);expect((await b.call("/api/auth/me")).status).toBe(200);
    const token=await a.confirmLink(env.mailpit,fixture.emailB,since,seen);
    const wrongOwner=await foreign.call("/api/auth/email/confirm","POST",{token});expect(wrongOwner.status).toBe(400);
    const confirmed=await a.call("/api/auth/email/confirm","POST",{token});if(confirmed.status===200)changed=true;expect(confirmed.status).toBe(200);
    expect((await oldA.call("/api/auth/refresh","POST")).status).toBe(401);expect((await oldB.call("/api/auth/refresh","POST")).status).toBe(401);
    await a.login(fixture.emailB,fixture.password,audience);expect((await a.profile()).email===fixture.emailB).toBe(true);
    const replay=await a.call("/api/auth/email/confirm","POST",{token});expect(replay.status).toBe(400);
    const rejected=new AccountHTTP(env.portal);await expect(rejected.login(fixture.email,fixture.password,audience)).rejects.toThrow("HTTP 401");
   }finally {
    const restore=new AccountHTTP(env.portal);
    if(!changed){try {await restore.login(fixture.emailB,fixture.password,audience);changed=true;}catch {await restore.login(fixture.email,fixture.password,audience);}}
    if(changed){
     await restore.login(fixture.emailB,fixture.password,audience);const since=Date.now()-1000;
     expect((await restore.call("/api/auth/email/change","POST",{current_password:fixture.password,new_email:fixture.email})).status).toBe(202);
     const token=await restore.confirmLink(env.mailpit,fixture.email,since,seen);expect((await restore.call("/api/auth/email/confirm","POST",{token})).status).toBe(200);
    }
    await restore.login(fixture.email,fixture.password,audience);expect((await restore.profile()).email===fixture.email).toBe(true);
   }
  });
 },240000);
});
