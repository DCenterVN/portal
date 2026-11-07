import { NextRequest } from "next/server";
import { rotateSession } from "@/lib/api/session-rotate";

export function POST(req: NextRequest) {
  return rotateSession(req, "/auth/web/refresh");
}
