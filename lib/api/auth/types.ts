import {z} from "zod";
export interface UpdateProfileRequest {display_name: string}
export interface ChangePasswordRequest {current_password: string; new_password: string}
export interface RequestEmailChangeRequest {current_password: string; new_email: string}
export interface ConfirmEmailChangeRequest {token: string}
export interface PresignAvatarRequest {file_name: string; content_type: string; file_size: number}
export interface FinalizeAvatarRequest {upload_id: string}
export const updatedProfileSchema = z.object({display_name:z.string()});
export const profileSchema = z.object({
 id:z.string(), email:z.string(), phone:z.string(), display_name:z.string(),
 avatar_key:z.string().nullable().optional().default(null), avatar_url:z.string().nullable().optional().default(null),
 status:z.string(), created_at:z.string(), memberships:z.array(z.object({org_id:z.string(),org_name:z.string(),branch_id:z.string().optional(),branch_name:z.string().optional(),roles:z.array(z.string())})),
});
export type UserProfileResponse = z.infer<typeof profileSchema>;
export const avatarSchema = z.object({avatar_key:z.string(),avatar_url:z.string()});
export const presignAvatarSchema = z.object({upload_id:z.string(),upload_url:z.string(),upload_method:z.string(),form_fields:z.record(z.string()),expires_in:z.number()});
export type PresignAvatarResponse = z.infer<typeof presignAvatarSchema>;
