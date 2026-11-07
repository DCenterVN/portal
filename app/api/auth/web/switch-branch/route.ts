import { NextRequest, NextResponse } from "next/server";
import { rotateSession } from "@/lib/api/session-rotate";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const branchId = typeof body === "object" && body !== null && "branch_id" in body ? body.branch_id : undefined;
  if (typeof branchId !== "string" || !UUID.test(branchId)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Chi nhánh không hợp lệ" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  return rotateSession(req, "/auth/web/switch-branch", { branch_id: branchId }, true);
}
