import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

export async function forwardInventory(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  bodyPolicy: "none" | "required" = method === "GET" ? "none" : "required",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: serviceUrl("inventory"), path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ kho hiện không khả dụng",
  });
}
