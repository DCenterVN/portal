import { NextRequest, NextResponse } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const ORG_SERVICE_URL = process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081";
type Method = "GET" | "POST" | "PUT";
type Rule = { method: Method; path: RegExp; body: "none" | "required"; query: readonly string[] };
const rules: Rule[] = [
  { method: "GET", path: /^me$/, body: "none", query: [] },
  { method: "GET", path: /^companies$/, body: "none", query: ["page", "limit"] },
  { method: "POST", path: /^companies$/, body: "required", query: [] },
  { method: "GET", path: /^companies\/[0-9a-f-]{36}\/modules$/, body: "none", query: [] },
  { method: "PUT", path: /^companies\/[0-9a-f-]{36}\/modules\/[A-Z][A-Z0-9_]*$/, body: "required", query: [] },
  { method: "GET", path: /^companies\/[0-9a-f-]{36}\/role-matrix$/, body: "none", query: [] },
  { method: "PUT", path: /^companies\/[0-9a-f-]{36}\/role-matrix\/roles\/[A-Z][A-Z0-9_]*$/, body: "required", query: [] },
  { method: "GET", path: /^staff$/, body: "none", query: ["page", "limit"] },
  { method: "POST", path: /^staff$/, body: "required", query: [] },
  { method: "POST", path: /^staff\/[0-9a-f-]{36}\/revoke$/, body: "none", query: [] },
  { method: "GET", path: /^support-access$/, body: "none", query: ["page", "limit"] },
  { method: "POST", path: /^support-access$/, body: "required", query: [] },
  { method: "POST", path: /^support-access\/break-glass$/, body: "required", query: [] },
  { method: "GET", path: /^audit-logs$/, body: "none", query: ["root_branch_id", "action", "since", "until", "page", "limit"] },
];

function queryFor(request: NextRequest, rule: Rule): string | null {
  const params = request.nextUrl.searchParams;
  for (const key of params.keys()) {
    if (!rule.query.includes(key) || params.getAll(key).length !== 1) return null;
  }
  return params.toString();
}

export async function forwardPlatform(request: NextRequest, segments: string[]) {
  if (segments.some((segment) => !segment || segment === "." || segment === ".." || segment.includes("/"))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const relativePath = segments.join("/");
  const rule = rules.find((item) => item.method === request.method && item.path.test(relativePath));
  if (!rule) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const query = queryFor(request, rule);
  if (query === null) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const suffix = query ? `?${query}` : "";
  return forwardService(request, {
    baseUrl: ORG_SERVICE_URL,
    path: `/platform/${relativePath}${suffix}`,
    method: rule.method,
    bodyPolicy: rule.body,
    unavailableMessage: "Dịch vụ tổ chức hiện không khả dụng",
  });
}
