import {z} from "zod";
import {profileSchema,presignAvatarSchema} from "@/lib/api/auth/types";
import {decodePlatform} from "@/lib/api/platform-contract";
export class AccountHTTP {
 private jar=new Map<string,string>();
 constructor(readonly base:string,private transport:typeof fetch=globalThis.fetch){}
 copy(){const copy=new AccountHTTP(this.base,this.transport);copy.jar=new Map(this.jar);return copy;}
 async call(path:string,method="GET",body?:unknown){
  const headers=new Headers({Origin:new URL(this.base).origin,"Content-Type":"application/json","Sec-Fetch-Site":"same-origin"});
  headers.set("Cookie",[...this.jar].map(([k,v])=>`${k}=${v}`).join("; "));
  const csrf=this.jar.get("CSRF-Token");if(csrf)headers.set("X-CSRF-Token",csrf);
  let result:Response;
  try {result=await this.transport(new URL(path,this.base),{method,headers,redirect:"manual",signal:AbortSignal.timeout(30000),...(body===undefined ? {} : {body:JSON.stringify(body)})});}
  catch {throw Error("account HTTP transport failed");}
  for(const cookie of result.headers.getSetCookie()){
   const pair=cookie.split(";",1)[0],separator=pair.indexOf("=");if(separator<1)continue;
   const key=pair.slice(0,separator),value=pair.slice(separator+1);
   if(!value || /;\s*Max-Age=0(?:;|$)/i.test(cookie))this.jar.delete(key);else this.jar.set(key,value);
  }
  return result;
 }
 async login(email:string,password:string,audience:"customer"|"employee"){
  const response=await this.call(audience==="customer" ? "/api/auth/login" : "/api/auth/staff/login","POST",{identifier:email,password});
  if(response.status!==200)throw Error(`account fixture login failed: HTTP ${response.status}`);
 }
 async profile(){const response=await this.call("/api/auth/me");if(response.status!==200)throw Error(`account read-back failed: HTTP ${response.status}`);return profileSchema.parse(await response.json());}
 async upload(bytes:Uint8Array,mime:string,storageOrigin:string){
  const response=await this.call("/api/auth/profile/avatar/presign","POST",{file_name:"account-qa.png",content_type:mime,file_size:bytes.byteLength});
  if(response.status!==200)throw Error(`account presign failed: HTTP ${response.status}`);
  const grant=decodePlatform(await response.json(),presignAvatarSchema);
  const url=new URL(grant.upload_url);if(url.origin!==new URL(storageOrigin).origin || url.username || url.password)throw Error("account storage origin mismatch");
  const form=new FormData();for(const [key,value] of Object.entries(grant.form_fields))form.append(key,value);
  const blob=new Blob([new Uint8Array(bytes)],{type:mime});form.append("file",blob,"account-qa.png");
  if(!["POST","PUT"].includes(grant.upload_method))throw Error("account unsupported upload method");
  const uploaded=await this.transport(url,{method:grant.upload_method,body:grant.upload_method==="POST" ? form : blob,credentials:"omit",redirect:"error",signal:AbortSignal.timeout(30000),...(grant.upload_method==="PUT" ? {headers:{"Content-Type":mime}} : {})});
  if(!uploaded.ok)throw Error(`account storage upload failed: HTTP ${uploaded.status}`);
  const finalized=await this.call("/api/auth/profile/avatar/finalize","POST",{upload_id:grant.upload_id});
  if(finalized.status!==200)throw Error(`account finalize failed: HTTP ${finalized.status}`);
 }
 async bytes(url:string,storageOrigin:string){
  const parsed=new URL(url);if(parsed.origin!==new URL(storageOrigin).origin || parsed.username || parsed.password)throw Error("account avatar snapshot origin mismatch");
  const response=await this.transport(parsed,{credentials:"omit",redirect:"error",signal:AbortSignal.timeout(30000)});
  const mime=response.headers.get("content-type")?.split(";",1)[0] || "";
  if(!response.ok || !["image/jpeg","image/png","image/webp"].includes(mime))throw Error("account avatar snapshot failed");
  const bytes=new Uint8Array(await response.arrayBuffer());if(!bytes.length || bytes.length>2097152)throw Error("account avatar snapshot size invalid");return {bytes,mime};
 }
 async confirmLink(mailpit:string,email:string,since:number,seen:Set<string>){
  const summary=z.object({messages:z.array(z.object({ID:z.string(),Created:z.string()}))});
  const message=z.object({ID:z.string(),Text:z.string(),HTML:z.string().optional(),To:z.array(z.object({Address:z.string()}))});
  const deadline=Date.now()+45000;
  while(Date.now()<deadline){
   const query=new URL("/api/v1/search",mailpit);query.searchParams.set("query",`to:${email}`);
   const found=summary.parse(await (await this.transport(query,{signal:AbortSignal.timeout(10000)})).json());
   const row=found.messages.find(item=>!seen.has(item.ID) && new Date(item.Created).getTime()>=since);
   if(!row){await new Promise(resolve=>setTimeout(resolve,1000));continue;}
   seen.add(row.ID);
   const data=message.parse(await (await this.transport(new URL(`/api/v1/message/${encodeURIComponent(row.ID)}`,mailpit),{signal:AbortSignal.timeout(10000)})).json());
   if(!data.To.some(to=>to.Address.toLowerCase()===email.toLowerCase()))continue;
   const links=(data.Text+" "+(data.HTML || "")).match(/https?:\/\/[^\s<>"')]+/g) || [];
   const link=links.map(value=>new URL(value.replaceAll("&amp;","&"))).find(url=>url.origin===new URL(this.base).origin && url.pathname==="/email/confirm");
   if(!link)throw Error("OD-1: delivered email has no real confirmation link");
   const token=link.searchParams.get("token") || new URLSearchParams(link.hash.slice(1)).get("token");
   if(!token)throw Error("account mail confirmation token missing");
   return token;
  }
  throw Error("account confirmation email timeout");
 }
}
