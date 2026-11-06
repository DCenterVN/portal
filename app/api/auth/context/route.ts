import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";
import { publicError } from "@/lib/api/public-error";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";
const ORG_SERVICE_URL = process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081";

interface AccessContextItem {
  org_id: string;
  org_name: string;
  branch_id: string;
  branch_name: string;
  membership_id: string;
  member_type: string;
  roles: string[];
  authorization_version: number;
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function activeContext(req: NextRequest, token: string, contexts: AccessContextItem[]) {
  const claims = decodeJwt(token);
  const queryOrgId = req.nextUrl.searchParams.get("org_id");
  const queryBranchId = req.nextUrl.searchParams.get("branch_id");
  const requested = queryOrgId && queryBranchId ? { org_id: queryOrgId, branch_id: queryBranchId } : null;
  const claimed = typeof claims.org_id === "string" && typeof claims.branch_id === "string"
    ? { org_id: claims.org_id, branch_id: claims.branch_id }
    : null;
  const matches = (value: typeof requested) => value && uuidPattern.test(value.branch_id)
    ? contexts.find((context) => context.org_id === value.org_id && context.branch_id === value.branch_id)
    : undefined;
  return matches(requested) ?? matches(claimed) ?? (contexts.length === 1 ? contexts[0] : null);
}

export async function GET(req: NextRequest) {
  let userData: unknown;
  try {
    const accessToken = req.cookies.get("access_token")?.value || "";
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized", message: "Chưa đăng nhập" }, { status: 401 });
    }

    // 1+2. Profile (Auth) and access contexts (Org) are independent: fetch together.
    const headers = { "Authorization": `Bearer ${accessToken}` };
    const [meResult, contextsResult] = await Promise.allSettled([
      fetch(`${AUTH_SERVICE_URL}/auth/me`, { headers }),
      fetch(`${ORG_SERVICE_URL}/org/access-contexts/me`, { headers }),
    ]);
    if (meResult.status === "rejected") throw meResult.reason;
    const meRes = meResult.value;

    if (!meRes.ok) {
      const errData = await meRes.json().catch(() => ({}));
      const projected = errData && typeof errData === "object" && !Array.isArray(errData) ? publicError(errData) : null;
      return NextResponse.json(projected ?? { error: "auth_context_unavailable", message: "Không thể tải thông tin tài khoản" }, { status: meRes.status });
    }

    userData = await meRes.json();

    if (contextsResult.status === "rejected") throw contextsResult.reason;
    let accessContexts: AccessContextItem[] = [];
    const contextsRes = contextsResult.value;
    if (!contextsRes.ok) {
      const details = await contextsRes.json().catch(() => ({}));
      const projected = details && typeof details === "object" && !Array.isArray(details) ? publicError(details) : null;
      return NextResponse.json(
        { user: userData, ...(projected ?? { error: "org_context_unavailable", message: "Không thể tải phạm vi tổ chức" }) },
        { status: contextsRes.status },
      );
    }
    accessContexts = await contextsRes.json();

    const active = activeContext(req, accessToken, accessContexts);
    const activeOrgId = active?.org_id ?? "";
    const activeBranchId = active?.branch_id ?? "";

    let permissions: string[] = [];
    if (activeOrgId && activeBranchId) {
      const params = new URLSearchParams({ org_id: activeOrgId, branch_id: activeBranchId });
      const permsRes = await fetch(`${ORG_SERVICE_URL}/org/permissions/me?${params}`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });
      if (!permsRes.ok) {
        const details = await permsRes.json().catch(() => ({}));
        const projected = details && typeof details === "object" && !Array.isArray(details) ? publicError(details) : null;
        return NextResponse.json(
          { user: userData, ...(projected ?? { error: "permissions_unavailable", message: "Không thể xác minh quyền truy cập" }) },
          { status: permsRes.status },
        );
      }
      const permsData = await permsRes.json();
      permissions = permsData.action_keys || [];
    }

    return NextResponse.json({
      user: userData,
      active_context: {
        org_id: activeOrgId,
        branch_id: activeBranchId,
      },
      contexts: accessContexts,
      permissions: permissions,
    });
  } catch {
    return NextResponse.json({ user: userData, error: "upstream_unavailable", message: "Dịch vụ xác thực hoặc tổ chức hiện không khả dụng" }, { status: 502 });
  }
}
