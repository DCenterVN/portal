import {describe,it,expect} from "vitest";
import {preflightAccount,withAccountLease} from "./account-fixtures";
import {AccountHTTP} from "./account-http";
describe("account-profile.name",()=>{
 for(const audience of ["customer","employee"] as const)it(`persists and restores ${audience} name through real BFF`,async()=>{
  const env=await preflightAccount();const fixture=env.fixtures.find(row=>row.audience===audience)!;
  await withAccountLease("runtime",async()=>{
   const http=new AccountHTTP(env.portal);await http.login(fixture.email,fixture.password,audience);const original=await http.profile();
   expect(original.status).toBe("ACTIVE");expect(original.memberships.length===0).toBe(audience==="customer");
   try {
    const response=await http.call("/api/auth/profile","PATCH",{display_name:"  Tên kiểm thử account  "});expect(response.status).toBe(200);
    expect((await http.profile()).display_name).toBe("Tên kiểm thử account");
    const independent=new AccountHTTP(env.portal);await independent.login(fixture.email,fixture.password,audience);expect((await independent.profile()).display_name).toBe("Tên kiểm thử account");
    const rejected=await http.call("/api/auth/profile","PATCH",{display_name:"",user_id:"foreign"});expect(rejected.status).toBe(400);
   }finally {
    const restored=await http.call("/api/auth/profile","PATCH",{display_name:original.display_name});expect(restored.status).toBe(200);expect((await http.profile()).display_name).toBe(original.display_name);
   }
  });
 },120000);
});
