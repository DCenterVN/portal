import { z } from "zod";

// org 6c1c0132: service/platform.go and transport/http/platform.go.
const uuid = z.string().uuid();
const timestamp = z.string().datetime({ offset: true });
const optionalTime = timestamp.optional();
const strings = z.array(z.string());
const goList = <T extends z.ZodTypeAny>(row: T) => z.array(row).nullable().transform((items) => items ?? []);

export const platformMeSchema = z.object({ user_id: uuid, role: z.string(), actions: strings });
// permissions_me.go uses response.JSON, not response.Success.
export const permissionsSchema = z.object({ action_keys: strings });
export const companySchema = z.object({
  root_branch_id: uuid, code: z.string(), name: z.string(), status: z.string(), created_at: timestamp,
});
export const moduleSchema = z.object({
  code: z.string(), name: z.string(), always_on: z.boolean(), status: z.string().optional(),
  contract_ref: z.string().optional(), starts_at: optionalTime, ends_at: optionalTime, updated_at: optionalTime,
});
export const modulesSchema = goList(moduleSchema);
export const roleMatrixSchema = z.record(strings);
export const staffSchema = z.object({
  user_id: uuid, role: z.string(), status: z.string(), granted_by_user_id: uuid.optional(),
  granted_at: timestamp, revoked_at: optionalTime,
});
export const supportGrantSchema = z.object({
  id: uuid, root_branch_id: uuid, platform_user_id: uuid, reason: z.string(), ticket_ref: z.string().optional(),
  mode: z.string(), approved_by_user_id: uuid.optional(), starts_at: optionalTime,
  expires_at: optionalTime, revoked_at: optionalTime, created_at: timestamp,
});
export const auditSchema = z.object({
  id: uuid, occurred_at: timestamp, actor_user_id: uuid.optional(), actor_service: z.string().optional(),
  plane: z.string(), action: z.string(), target_type: z.string(), target_id: z.string().optional(),
  root_branch_id: uuid.optional(), on_behalf_of_root_branch_id: uuid.optional(), support_access_grant_id: uuid.optional(),
  contract_ref: z.string().optional(), reason: z.string().optional(), before: z.unknown().optional(), after: z.unknown().optional(),
});
export const consentSchema = z.object({ standing_support_consent: z.boolean() });
export const onboardResultSchema = z.object({
  branch_id: uuid, code: z.string(), status: z.string(), owner_user_id: uuid.optional(),
  owner_membership_id: uuid.optional(), modules: strings.optional(), roles_count: z.number().int(),
  outbox_event_id: uuid, from_idempotency_cache: z.boolean().optional(),
});
export function pageSchema<T extends z.ZodTypeAny>(row: T) {
  return z.object({ items: goList(row), page: z.number().int().positive(), limit: z.number().int().positive() });
}
export function decodePlatform<T>(body: unknown, data: { parse(value: unknown): T }): T {
  const envelope = z.object({ code: z.union([z.literal(200), z.literal(201)]), status: z.literal("success"), message: z.string(), data: z.unknown() }).parse(body);
  return data.parse(envelope.data);
}

export type PlatformMe = z.infer<typeof platformMeSchema>;
export type Company = z.infer<typeof companySchema>;
export type CompanyModule = z.infer<typeof moduleSchema>;
export type PlatformStaff = z.infer<typeof staffSchema>;
export type SupportGrant = z.infer<typeof supportGrantSchema>;
export type AuditEntry = z.infer<typeof auditSchema>;
export type RoleMatrix = z.infer<typeof roleMatrixSchema>;
export type Page<T> = { items: T[]; page: number; limit: number };
export type OnboardCompany = {
  name: string; code: string; contract_ref: string; owner_email: string; owner_display_name: string;
  modules: string[]; timezone?: string; currency?: string;
};
export type ModuleChange = { status: "ACTIVE" | "INACTIVE"; contract_ref: string; starts_at?: string; ends_at?: string | null };
export type SupportRequest = { root_branch_id: string; reason: string; ticket_ref: string };
