import { NextRequest } from "next/server";
import { accountSessions } from "@/lib/api/account-bff";

export function GET(request: NextRequest) {
  return accountSessions(request);
}
