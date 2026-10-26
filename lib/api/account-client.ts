import {z} from "zod";
import {apiFetch, FetchError} from "../fetcher";
import {decodePlatform} from "./platform-contract";
import {profileSchema, updatedProfileSchema, avatarSchema, presignAvatarSchema} from "./auth/types";
import type {UpdateProfileRequest, ChangePasswordRequest, RequestEmailChangeRequest, ConfirmEmailChangeRequest, PresignAvatarRequest, FinalizeAvatarRequest} from "./auth/types";

export const ACCOUNT_PROFILE_KEY = "/api/auth/me";
const fallback = "Không thể hoàn tất yêu cầu. Vui lòng thử lại.";
const knownAccountErrors=new Set(["invalid_current_password","UNAUTHORIZED","FORBIDDEN","VALIDATION_ERROR","BAD_REQUEST","invalid_token","rate_limit_exceeded","service_busy","FILE_TOO_LARGE","UNSUPPORTED_IMAGE_FORMAT","IMAGE_DIMENSIONS_EXCEEDED","UPLOAD_EXPIRED"]);
export function accountErrorMessage(error: unknown,translate?: (key:string)=>string): string {
 if(translate)return translate(`errors.${error instanceof FetchError && error.code && knownAccountErrors.has(error.code) ? error.code : "fallback"}`);
 if (!(error instanceof FetchError)) return fallback;
 switch(error.code) {
  case "invalid_current_password": return "Mật khẩu hiện tại không đúng.";
  case "UNAUTHORIZED": return "Vui lòng kiểm tra mật khẩu hoặc đăng nhập lại.";
  case "FORBIDDEN": return "Yêu cầu không được phép. Vui lòng tải lại trang.";
  case "VALIDATION_ERROR": case "BAD_REQUEST": return "Thông tin chưa hợp lệ. Vui lòng kiểm tra lại.";
  case "invalid_token": return "Liên kết không hợp lệ hoặc đã hết hạn.";
  case "rate_limit_exceeded": return "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.";
  case "service_busy": return "Hệ thống đang bận. Vui lòng thử lại sau.";
  case "FILE_TOO_LARGE": return "Ảnh không được lớn hơn 2 MB.";
  case "UNSUPPORTED_IMAGE_FORMAT": return "Chọn ảnh JPEG, PNG hoặc WebP.";
  case "IMAGE_DIMENSIONS_EXCEEDED": return "Ảnh tối đa 2048 × 2048 pixels.";
  case "UPLOAD_EXPIRED": return "Phiên tải ảnh đã hết hạn. Vui lòng chọn lại ảnh.";
  default: return fallback;
 }
}
async function request(path: string, method: string, body?: unknown): Promise<Response> {
 const response = await apiFetch(path, {method,cache:"no-store",signal:AbortSignal.timeout(15000),headers:{"Content-Type":"application/json"},...(body===undefined ? {} : {body:JSON.stringify(body)})}, method!=="GET");
 if(response.ok) return response;
 const info = await response.json().catch(()=>null);
 const error = new FetchError(fallback,response.status,info);
 throw error;
}
async function decode<T extends z.ZodTypeAny>(response: Response, schema: T, envelope = false): Promise<z.output<T>> {
 try {
  const body: unknown = await response.json();
  return envelope ? decodePlatform(body,schema) : schema.parse(body);
 } catch {throw new Error("Không thể đọc phản hồi. Vui lòng thử lại.");}
}
export async function getAccountProfile() {
 return decode(await request(ACCOUNT_PROFILE_KEY,"GET"),profileSchema);
}
export async function updateProfile(body: UpdateProfileRequest) {
 return decode(await request("/api/auth/profile","PATCH",body),updatedProfileSchema,true);
}
export async function changePassword(body: ChangePasswordRequest): Promise<void> {
 const response = await request("/api/auth/password/change","POST",body);
 if(response.status!==204) throw new Error(fallback);
}
export async function presignAvatar(body: PresignAvatarRequest) {
 return decode(await request("/api/auth/profile/avatar/presign","POST",body),presignAvatarSchema,true);
}
export async function finalizeAvatar(body: FinalizeAvatarRequest) {
 return decode(await request("/api/auth/profile/avatar/finalize","POST",body),avatarSchema,true);
}
export async function deleteAvatar() {
 return decode(await request("/api/auth/profile/avatar","DELETE"),z.object({message:z.string()}),true);
}
export async function requestEmailChange(body: RequestEmailChangeRequest) {
 const response = await request("/api/auth/email/change","POST",body);
 if(response.status!==202) throw new Error(fallback);
 return decode(response,z.object({status:z.literal("pending")}));
}
export async function confirmEmailChange(body: ConfirmEmailChangeRequest) {
 return decode(await request("/api/auth/email/confirm","POST",body),z.object({status:z.literal("success")}));
}
