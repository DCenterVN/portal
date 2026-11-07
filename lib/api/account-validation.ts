import { z } from "zod";

const password = z.string().min(1).refine(withinPasswordBytes);
function withinPasswordBytes(value: string) {
  return new TextEncoder().encode(value).length <= 256;
}
function validName(value: string) {
  return [...value].length <= 50 && !/\p{Cc}/u.test(value);
}
function validPhone(value: string) {
  return /^(\+84|84|0)\d{9}$/.test(value.replace(/[ .-]/g, ""));
}
export const accountOperations = {
  profile: { path: "profile", method: "PATCH", schema: z.object({ display_name: z.string().trim().min(1).refine(validName) }).strict() },
  phone: { path: "profile", method: "PATCH", schema: z.object({ phone: z.string().trim().refine(validPhone), current_password: password }).strict() },
  password: { path: "password/change", method: "POST", schema: z.object({ current_password: password, new_password: password.refine(minPassword) }).strict() },
  presign: { path: "profile/avatar/presign", method: "POST", schema: z.object({ file_name: z.string().trim().min(1).max(255), content_type: z.enum(["image/jpeg", "image/png", "image/webp"]), file_size: z.number().int().min(1).max(2097152) }).strict() },
  finalize: { path: "profile/avatar/finalize", method: "POST", schema: z.object({ upload_id: z.string().min(1).max(256) }).strict() },
  delete: { path: "profile/avatar", method: "DELETE", schema: z.undefined() },
  emailChange: { path: "email/change", method: "POST", schema: z.object({ new_email: z.string().trim().email().max(254), current_password: password }).strict() },
  emailConfirm: { path: "email/confirm", method: "POST", schema: z.object({ token: z.string().min(1).max(4096) }).strict() },
  logoutAll: { path: "logout-all", method: "POST", schema: z.undefined() },
} as const;
export type AccountOperation = keyof typeof accountOperations;
function minPassword(value: string) {
  return [...value].length >= 12;
}
export const nameSchema = accountOperations.profile.schema;
export const phoneSchema = accountOperations.phone.schema;
export const emailSchema = accountOperations.emailChange.schema;
export const passwordSchema = accountOperations.password.schema
  .extend({ repeat: z.string() })
  .refine(value => value.new_password === value.repeat, { path: ["repeat"], message: "repeat" });
