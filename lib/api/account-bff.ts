import {z} from "zod";
import {NextRequest, NextResponse} from "next/server";
import {decodePlatform} from "./platform-contract";
import {profileSchema, updatedProfileSchema, presignAvatarSchema, avatarSchema} from "./auth/types";
import {authHeaders, resolveClientIP} from "./client-ip";
const headers = {"Cache-Control":"no-store"};
const error = (code: string, status: number) => NextResponse.json({error:code,message:"Không thể hoàn tất yêu cầu. Vui lòng kiểm tra thông tin hoặc thử lại."},{status,headers});
const unavailable = () => error("INTERNAL_ERROR",503);
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function trusted(req: NextRequest): boolean {
 try {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  const origin = new URL(configured);
  return ["http:","https:"].includes(origin.protocol) && !origin.username && !origin.password && req.headers.get("origin") === origin.origin && [null,"same-origin"].includes(req.headers.get("sec-fetch-site")) && req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() === "application/json";
 } catch {return false;}
}
type Operation = "profile" | "password" | "presign" | "finalize" | "delete" | "emailChange" | "emailConfirm";
const paths: Record<Operation,string>={profile:"profile",password:"password/change",presign:"profile/avatar/presign",finalize:"profile/avatar/finalize",delete:"profile/avatar",emailChange:"email/change",emailConfirm:"email/confirm"};
async function fields(req: NextRequest, operation: Operation) {
 if(!trusted(req)) return error("FORBIDDEN",403);
 if(!req.cookies.get("access_token")?.value) return error("UNAUTHORIZED",401);
 if(operation==="delete") return (await req.text()) ? error("BAD_REQUEST",400) : undefined;
 const raw = await req.text();
 if(new TextEncoder().encode(raw).length > 16384) return error("BAD_REQUEST",400);
 let body: unknown;
 try {body=JSON.parse(raw);} catch {return error("BAD_REQUEST",400);}
 if(!object(body)) return error("VALIDATION_ERROR",400);
 if(operation==="emailChange" || operation==="emailConfirm") {
  const schema=operation==="emailChange" ? z.object({current_password:z.string().min(1).refine(value=>new TextEncoder().encode(value).length<=256),new_email:z.string().trim().email().max(254)}).strict() : z.object({token:z.string().min(1).max(4096)}).strict();
  const parsed=schema.safeParse(body);
  return parsed.success ? parsed.data : error("VALIDATION_ERROR",400);
 }
 if(operation==="presign" || operation==="finalize") {
  const schema: z.ZodTypeAny=operation==="presign" ? z.object({file_name:z.string().trim().min(1).max(255),content_type:z.enum(["image/jpeg","image/png","image/webp"]),file_size:z.number().int().min(1).max(2097152)}).strict() : z.object({upload_id:z.string().trim().min(1).max(256)}).strict();
  const parsed=schema.safeParse(body);
  return parsed.success ? parsed.data : error("VALIDATION_ERROR",400);
 }
 const password=operation==="password";
 const allowed = password ? ["current_password","new_password"] : ["display_name"];
 if(Object.keys(body).some(key=>!allowed.includes(key))) return error("BAD_REQUEST",400);
 if(allowed.some(key=>typeof body[key] !== "string")) return error("VALIDATION_ERROR",400);
 if(password) {
  const current = body.current_password as string, next = body.new_password as string;
  if(!current || new TextEncoder().encode(current).length>256 || [...next].length<12 || new TextEncoder().encode(next).length>256 || current===next) return error("VALIDATION_ERROR",400);
  return {current_password:current,new_password:next};
 }
 const name = (body.display_name as string).normalize("NFC").trim();
 if(!name || [...name].length>50 || /\p{Cc}/u.test(body.display_name as string)) return error("VALIDATION_ERROR",400);
 return {display_name:name};
}
async function failure(upstream: Response) {
 const body: unknown = await upstream.json();
 if(!object(body)) return unavailable();
 const code = object(body.errors) ? body.errors.error_code : body.error;
 if(typeof code!=="string" || !/^[A-Za-z_]{1,80}$/.test(code)) return unavailable();
 const result = error(code,upstream.status);
 const retry=upstream.headers.get("retry-after"); if(retry) result.headers.set("Retry-After",retry);
 return result;
}
function clearSession(result: NextResponse) {
 for(const name of ["access_token","refresh_token","__Host-refresh_token","CSRF-Token","portal_plane"]) {
  result.cookies.set(name,"",{path:"/",maxAge:0,expires:new Date(0),secure:name.startsWith("__Host-") || process.env.NODE_ENV==="production",sameSite:"strict",httpOnly:name!=="CSRF-Token"});
 }
 return result;
}
export async function accountProfile(req: NextRequest) {
 if(!req.cookies.get("access_token")?.value) return error("UNAUTHORIZED",401);
 try {
  const upstream=await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/me`,{cache:"no-store",signal:AbortSignal.timeout(10000),headers:authHeaders(resolveClientIP(req.headers),{Authorization:`Bearer ${req.cookies.get("access_token")!.value}`})});
  if(!upstream.ok) return await failure(upstream);
  return NextResponse.json(profileSchema.parse(await upstream.json()),{headers});
 } catch {return unavailable();}
}
export async function accountMutation(req: NextRequest, operation: Operation) {
 try {
  const body=await fields(req,operation); if(body instanceof NextResponse) return body;
  const upstream=await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/${paths[operation]}`,{
   method:operation==="profile" ? "PATCH" : operation==="delete" ? "DELETE" : "POST", cache:"no-store",signal:AbortSignal.timeout(10000),
   headers:authHeaders(resolveClientIP(req.headers),{"Content-Type":"application/json",Authorization:`Bearer ${req.cookies.get("access_token")!.value}`}),...(body===undefined ? {} : {body:JSON.stringify(body)}),
  });
  if(!upstream.ok) return await failure(upstream);
  if(operation==="password") return upstream.status===204 ? clearSession(new NextResponse(null,{status:204,headers})) : unavailable();
  if(operation==="emailChange" || operation==="emailConfirm") {
   const status=operation==="emailChange" ? "pending" : "success";
   if(upstream.status!==(operation==="emailChange" ? 202 : 200))return unavailable();
   const data=z.object({status:z.literal(status)}).parse(await upstream.json());
   const result=NextResponse.json(data,{status:upstream.status,headers});
   return operation==="emailConfirm" ? clearSession(result) : result;
  }
  const schema: z.ZodTypeAny=operation==="presign" ? presignAvatarSchema : operation==="finalize" ? avatarSchema : operation==="delete" ? z.object({message:z.string()}) : updatedProfileSchema;
  const data=decodePlatform(await upstream.json(),schema);
  return NextResponse.json({code:200,status:"success",message:"",data},{headers});
 } catch {return unavailable();}
}
