import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

export async function forwardProduction(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  bodyPolicy: "none" | "required" = method === "GET" || method === "DELETE" ? "none" : "required",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: serviceUrl("production"), path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ sản xuất hiện không khả dụng",
  });
}
