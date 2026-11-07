import { z } from "zod";

export interface UpdateProfileRequest { display_name: string }
export interface UpdatePhoneRequest { phone: string; current_password: string }
export interface ChangePasswordRequest { current_password: string; new_password: string }
export interface RequestEmailChangeRequest { current_password: string; new_email: string }
export interface ConfirmEmailChangeRequest { token: string }
export interface PresignAvatarRequest { file_name: string; content_type: string; file_size: number }
export interface FinalizeAvatarRequest { upload_id: string }

export const updatedProfileSchema = z.object({ display_name: z.string() });
export const updatedPhoneSchema = z.object({ phone: z.string() });
export const avatarSchema = z.object({ avatar_key: z.string(), avatar_url: z.string() });
export const presignAvatarSchema = z.object({
  upload_id: z.string(),
  upload_url: z.string().url(),
  upload_method: z.literal("POST"),
  form_fields: z.record(z.string()),
  expires_in: z.number().int().min(1).max(300),
});
export type PresignAvatarResponse = z.infer<typeof presignAvatarSchema>;
export const accountResponseSchemas = {
  profile: updatedProfileSchema,
  phone: updatedPhoneSchema,
  presign: presignAvatarSchema,
  finalize: avatarSchema,
  delete: z.object({ message: z.string() }),
};
const sessionSchema = z.object({
  id: z.string(),
  user_agent: z.string().optional(),
  ip_address: z.string().optional(),
  created_at: z.string(),
  expires_at: z.string(),
});
export const sessionsSchema = z.object({
  items: z.array(sessionSchema),
  pagination: z.object({ current_page: z.number(), total_pages: z.number(), total_items: z.number(), limit: z.number() }),
});
export type AccountSession = z.infer<typeof sessionSchema>;
export type AccountSessions = z.infer<typeof sessionsSchema>;
