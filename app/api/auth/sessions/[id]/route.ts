import { NextRequest } from "next/server";
import { accountSessions } from "@/lib/api/account-bff";

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return accountSessions(request, id);
}
