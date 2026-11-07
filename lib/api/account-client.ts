import viMessages from "@/messages/vi.json";
import { z } from "zod";
import { apiFetch, FetchError } from "../fetcher";
import { decodePlatform } from "./platform-contract";
import { updatedProfileSchema, updatedPhoneSchema, avatarSchema, presignAvatarSchema, sessionsSchema } from "./account-types";
import type { UpdateProfileRequest, UpdatePhoneRequest, ChangePasswordRequest, RequestEmailChangeRequest, ConfirmEmailChangeRequest, PresignAvatarRequest, FinalizeAvatarRequest, AccountSessions } from "./account-types";

export const ACCOUNT_PROFILE_KEY = "/api/auth/me";
export const ACCOUNT_CHANGED = "account-changed";
const errors: Record<string, string> = viMessages.account.errors;
const fallback = errors.fallback;
export function accountErrorMessage(error: unknown, translate?: (key: string, values?: Record<string, number>) => string) {
  if (error instanceof FetchError && [429, 503].includes(error.status) && error.retryAfterMs !== undefined) {
    const seconds = Math.ceil(error.retryAfterMs / 1000);
    return translate ? translate("retryAfter", { seconds }) : viMessages.account.retryAfter.replace("{seconds}", String(seconds));
  }
  const code = error instanceof FetchError ? error.code : undefined;
  const key = code && errors[code] ? code : "fallback";
  return translate ? translate(`errors.${key}`) : errors[key] || fallback;
}
async function request(path: string, method: string, body?: unknown) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const response = await apiFetch(path, {
    method, cache: "no-store", headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }, method !== "GET");
  if (response.ok) return response;
  const info = await response.json().catch(invalidJson);
  throw new FetchError(fallback, response.status, info, response.headers.get("retry-after"));
}
function invalidJson() { return null; }
async function decode<T extends z.ZodTypeAny>(response: Response, schema: T, envelope = true): Promise<z.output<T>> {
  const body: unknown = await response.json();
  return envelope ? decodePlatform(body, schema) : schema.parse(body);
}
export async function updateProfile(body: UpdateProfileRequest) {
  return decode(await request("/api/auth/profile", "PATCH", body), updatedProfileSchema);
}
export async function updatePhone(body: UpdatePhoneRequest) {
  return decode(await request("/api/auth/profile/phone", "PATCH", body), updatedPhoneSchema);
}
export async function changePassword(body: ChangePasswordRequest) {
  await request("/api/auth/password/change", "POST", body);
}
export async function presignAvatar(body: PresignAvatarRequest) {
  return decode(await request("/api/auth/profile/avatar/presign", "POST", body), presignAvatarSchema);
}
export async function finalizeAvatar(body: FinalizeAvatarRequest) {
  return decode(await request("/api/auth/profile/avatar/finalize", "POST", body), avatarSchema);
}
export async function deleteAvatar() {
  await request("/api/auth/profile/avatar", "DELETE");
}
export async function requestEmailChange(body: RequestEmailChangeRequest) {
  return decode(await request("/api/auth/email/change", "POST", body), z.object({ status: z.literal("pending") }), false);
}
export async function confirmEmailChange(body: ConfirmEmailChangeRequest) {
  return decode(await request("/api/auth/email/confirm", "POST", body), z.object({ status: z.literal("success") }), false);
}
export type { AccountSession } from "./account-types";
export async function getSessions(page: number): Promise<AccountSessions> {
  return decode(await request(`/api/auth/sessions?page=${page}`, "GET"), sessionsSchema, false);
}
export async function revokeSession(id: string) {
  await request(`/api/auth/sessions/${encodeURIComponent(id)}`, "DELETE");
}
export async function logoutAll() {
  await request("/api/auth/logout-all", "POST");
}
export function notifyAccountChanged() {
  window.dispatchEvent(new Event(ACCOUNT_CHANGED));
}
