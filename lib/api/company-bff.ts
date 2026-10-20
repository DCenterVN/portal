import { NextRequest, NextResponse } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const ORG_SERVICE_URL = process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081";
type Method = "GET" | "POST" | "PUT" | "PATCH";
type Rule = { method: Method; path: RegExp; body: "none" | "required"; query: readonly string[] };
const rules: Rule[] = [
  { method: "GET", path: /^company\/memberships$/, body: "none", query: ["page", "limit"] },
  { method: "POST", path: /^company\/memberships$/, body: "required", query: [] },
  { method: "PUT", path: /^company\/memberships\/[0-9a-f-]{36}\/roles$/i, body: "required", query: [] },
  { method: "PATCH", path: /^company\/memberships\/[0-9a-f-]{36}$/i, body: "required", query: [] },
  { method: "PUT", path: /^company\/role-matrix\/roles\/[A-Z][A-Z0-9_]*$/, body: "required", query: [] },
  { method: "GET", path: /^permissions\/me$/, body: "none", query: ["org_id", "branch_id"] },
  { method: "GET", path: /^company\/(role-matrix|modules)$/, body: "none", query: [] },
  { method: "GET", path: /^company\/audit-logs$/, body: "none", query: ["page", "limit", "action", "since", "until"] },
  { method: "PUT", path: /^company\/settings$/, body: "required", query: [] },
];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function queryFor(request: NextRequest, rule: Rule): string | null {
  const params = request.nextUrl.searchParams;
  for (const key of params.keys()) {
    if (!rule.query.includes(key) || params.getAll(key).length !== 1) return null;
  }
  if (request.nextUrl.pathname.endsWith("/permissions/me") &&
    (!uuid.test(params.get("org_id") ?? "") || !uuid.test(params.get("branch_id") ?? ""))) return null;
  return params.toString();
}

export async function forwardCompany(request: NextRequest, segments: string[]) {
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/"))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const relativePath = segments.join("/");
  const rule = rules.find((item) => item.method === request.method && item.path.test(relativePath));
  if (!rule) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const query = queryFor(request, rule);
  if (query === null) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const creating = rule.method === "POST" && relativePath === "company/memberships";
  const payload: unknown = creating ? await request.clone().json().catch(() => null) : null;
  const password = payload && typeof payload === "object" && "password" in payload && typeof payload.password === "string" ? payload.password : "";
  const response = await forwardService(request, {
    baseUrl: ORG_SERVICE_URL,
    path: `/org/${relativePath}${query ? `?${query}` : ""}`,
    method: rule.method,
    bodyPolicy: rule.body,
    unavailableMessage: "Dịch vụ tổ chức hiện không khả dụng",
  });
  if (!creating) return response;
  try {
    const body: unknown = await response.json();
    const sanitized = JSON.stringify(body, (key, value: unknown) => {
      if (key === "password") return undefined;
      return typeof value === "string" && password ? value.split(password).join("[REDACTED]") : value;
    });
    return new NextResponse(sanitized, { status: response.status, headers: response.headers });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
