import {readFile,open,mkdir,unlink} from "node:fs/promises";
import {join} from "node:path";
import {z} from "zod";
import {AccountHTTP} from "./account-http";
type FixtureEnv=Readonly<Record<string,string|undefined>>;
const identity=z.object({audience:z.enum(["customer","employee"]),email:z.string().email(),password:z.string().min(12),emailB:z.string().email()});
export type AccountFixture=z.infer<typeof identity>;
export function parseAccountFixtures(env:FixtureEnv){
 const fixtures=(["customer","employee"] as const).map(audience=>{
  const prefix=`ACCOUNT_${audience.toUpperCase()}`;
  const parsed=identity.safeParse({audience,email:env[`${prefix}_EMAIL`],password:env[`${prefix}_PASSWORD`],emailB:env[`${prefix}_EMAIL_B`]});
  if(!parsed.success)throw Error(`account dedicated ${audience} fixture missing or invalid`);
  return parsed.data;
 });
 const emails=fixtures.flatMap(f=>[f.email.toLowerCase(),f.emailB.toLowerCase()]);
 if(new Set(emails).size!==4)throw Error("account fixture emails must be distinct");
 return fixtures;
}
export async function preflightAccount(env:FixtureEnv=process.env){
 if(!env.QA_ROLE_ENV)throw Error("QA_ROLE_ENV is required");
 const raw=await readFile(env.QA_ROLE_ENV,"utf8").catch(()=>{throw Error("QA_ROLE_ENV cannot be read");});
 const parsed:Record<string,string>={};
 for(const line of raw.split("\n")){
  const match=line.match(/^(?:export\s+)?([A-Z_][A-Z0-9_]*)=(.*)$/);if(!match)continue;
  parsed[match[1]]=match[2].replace(/^(['"])(.*)\1$/,"$2");
 }
 const fixtures=parseAccountFixtures({...parsed,...env});
 for(const key of ["PORTAL_IT_BASE","MAILPIT_BASE","ACCOUNT_STORAGE_ORIGIN"]){
  const value=env[key];if(!value)throw Error(`${key} is required`);
  const url=new URL(value);if(!["http:","https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash)throw Error(`invalid ${key}`);
 }
 if(env.ACCOUNT_E2E!=="1")throw Error("ACCOUNT_E2E=1 is required for live account mutations");
 return {fixtures,portal:env.PORTAL_IT_BASE!,mailpit:env.MAILPIT_BASE!,storage:env.ACCOUNT_STORAGE_ORIGIN!};
}
export async function withAccountLease<T>(key:string,action:()=>Promise<T>):Promise<T>{
 const base=process.env.TMPDIR || "/home/dawn/work/ticket/.cache/tmp";await mkdir(base,{recursive:true});
 const lock=join(base,`account-edit-${key.replace(/[^a-z0-9-]/gi,"_")}.lock`);
 const handle=await open(lock,"wx").catch(()=>{throw Error("account fixture lease is already held; inspect owner before retry");});
 try{return await action();}finally {await handle.close();await unlink(lock);}
}
export async function snapshotAccount(http:AccountHTTP,storage:string){
 const profile=await http.profile();
 const avatar=profile.avatar_url ? await http.bytes(profile.avatar_url,storage) : null;
 return {profile,avatar};
}
export async function restoreProfile(http:AccountHTTP,snapshot:Awaited<ReturnType<typeof snapshotAccount>>,storage:string){
 const response=await http.call("/api/auth/profile","PATCH",{display_name:snapshot.profile.display_name});
 if(response.status!==200)throw Error("account name cleanup failed");
 if(snapshot.avatar)await http.upload(snapshot.avatar.bytes,snapshot.avatar.mime,storage);
 else if((await http.call("/api/auth/profile/avatar","DELETE")).status!==200)throw Error("account avatar cleanup failed");
 const profile=await http.profile();if(profile.display_name!==snapshot.profile.display_name || Boolean(profile.avatar_url)!==Boolean(snapshot.avatar))throw Error("account profile cleanup read-back failed");
}
