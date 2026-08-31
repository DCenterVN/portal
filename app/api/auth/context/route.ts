import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value || "";
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized", message: "Chưa đăng nhập" }, { status: 401 });
    }

    // 1. Fetch user profile from Auth service
    const meRes = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    if (!meRes.ok) {
      const errData = await meRes.json().catch(() => ({}));
      return NextResponse.json(errData, { status: meRes.status });
    }

    const userData = await meRes.json();

    // 2. Fetch user's access contexts from Org service
    let accessContexts: AccessContextItem[] = [];
    const contextsRes = await fetch(`${ORG_SERVICE_URL}/org/access-contexts/me`, {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });
    if (!contextsRes.ok) {
      const details = await contextsRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "org_context_unavailable", message: "Không thể tải phạm vi tổ chức", details },
        { status: contextsRes.status },
      );
    }
    accessContexts = await contextsRes.json();

    // 3. Extract active org_id & branch_id if available from query or contexts
    const activeOrgId = req.nextUrl.searchParams.get("org_id") || (accessContexts.length > 0 ? accessContexts[0].org_id : "");
    const activeBranchId = req.nextUrl.searchParams.get("branch_id") || (accessContexts.length > 0 ? accessContexts[0].branch_id : "");

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
        return NextResponse.json(
          { error: "permissions_unavailable", message: "Không thể xác minh quyền truy cập", details },
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
    return NextResponse.json({ error: "upstream_unavailable", message: "Dịch vụ xác thực hoặc tổ chức hiện không khả dụng" }, { status: 502 });
  }
}
