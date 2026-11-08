import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

export async function forwardSales(
  request: NextRequest,
  path: string,
  method: "GET" | "POST",
  bodyPolicy: "none" | "required" = method === "POST" ? "required" : "none",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: serviceUrl("sales"), path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ bán hàng hiện không khả dụng",
  });
}
