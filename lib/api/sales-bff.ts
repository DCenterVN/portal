import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

export async function forwardSales(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  bodyPolicy: "none" | "required" = method === "POST" || method === "PATCH" ? "required" : "none",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: serviceUrl("sales"), path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ bán hàng hiện không khả dụng",
  });
}
