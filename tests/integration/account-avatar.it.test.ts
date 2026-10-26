import {describe,it,expect} from "vitest";
import {preflightAccount,withAccountLease,snapshotAccount,restoreProfile} from "./account-fixtures";
import {AccountHTTP} from "./account-http";
const png=Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=","base64"));
describe("account-profile.avatar",()=>{
 for(const audience of ["customer","employee"] as const)it(`uploads, reads back, deletes and restores ${audience} avatar`,async()=>{
  const env=await preflightAccount();const fixture=env.fixtures.find(row=>row.audience===audience)!;
  await withAccountLease("runtime",async()=>{
   const http=new AccountHTTP(env.portal);await http.login(fixture.email,fixture.password,audience);const original=await snapshotAccount(http,env.storage);
   try {
    await http.upload(png,"image/png",env.storage);const profile=await http.profile();expect(Boolean(profile.avatar_key)).toBe(true);expect(Boolean(profile.avatar_url)).toBe(true);
    const uploaded=await http.bytes(profile.avatar_url!,env.storage);expect(uploaded.bytes.length).toBeGreaterThan(0);
    const removed=await http.call("/api/auth/profile/avatar","DELETE");expect(removed.status).toBe(200);expect((await http.profile()).avatar_url).toBeNull();
   }finally {await restoreProfile(http,original,env.storage);}
  });
 },180000);
});
