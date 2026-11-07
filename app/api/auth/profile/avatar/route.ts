import { NextRequest } from "next/server";
import { accountMutation } from "@/lib/api/account-bff";

export function DELETE(request: NextRequest) {
  return accountMutation(request, "delete");
}
