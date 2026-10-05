import { apiFetch } from "@/lib/fetcher";
import { platformMeSchema, decodePlatform } from "@/lib/api/platform-contract";
import { sanitizeRedirectUrl } from "@/lib/auth/client";

const CUSTOMER_PREFIXES = ["/products", "/cart", "/orders", "/me", "/traceability"];

function isCustomerRoute(path: string): boolean {
  return CUSTOMER_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`) || path.startsWith(`${p}?`));
}

export function homeFor(contextCount: number, redirect: string | null | undefined): string {
  const target = sanitizeRedirectUrl(redirect, "");
  if (contextCount === 0) return target && isCustomerRoute(target) ? target : "/";
  if (target) return target;
  return contextCount === 1 ? "/console" : "/switch-branch";
}

type AccessContext = { branch_id?: string; member_type?: string };

// org returns one row per role and legacy CUSTOMER memberships; only distinct EMPLOYEE branches open the console
export function staffBranchCount(contexts: AccessContext[] = []): number {
  return new Set(contexts.filter((c) => c.member_type === "EMPLOYEE").map((c) => c.branch_id)).size;
}

export async function resolveHome(redirect: string | null | undefined): Promise<string> {
  const platform = await apiFetch("/api/platform/me");
  if (platform.ok) {
    return platformHome(platform.status, await platform.json().catch(() => null), redirect) || "/";
  }
  if (platform.status !== 404) return "/";
  const res = await apiFetch("/api/auth/context");
  // ponytail: context unavailable -> least-privilege home; staff re-enter via /switch-branch
  if (!res.ok) return homeFor(0, redirect);
  const data: { contexts?: AccessContext[] } = await res.json().catch(() => ({}));
  return homeFor(staffBranchCount(data.contexts), redirect);
}

export function platformHome(status: number, body: unknown, redirect: string | null | undefined): string | null {
  if (status === 404) return null;
  if (status !== 200) return "/";
  try {
    decodePlatform(body, platformMeSchema);
  } catch {
    return "/";
  }
  return sanitizeRedirectUrl(redirect, "") || "/platform/companies";
}
