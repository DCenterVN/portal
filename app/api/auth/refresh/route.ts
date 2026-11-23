import { NextRequest } from "next/server";
import { rotateSession } from "@/lib/api/session-rotate";

export function POST(req: NextRequest) {
  return rotateSession(req, "/auth/web/refresh", undefined, req.cookies.get("portal_plane")?.value === "employee");
}
