import { NextRequest } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const PRODUCTION_SERVICE_URL =
  process.env.PRODUCTION_INTERNAL_URL ||
  process.env.PRODUCTION_SERVICE_URL ||
  "http://localhost:8087";

export async function forwardProduction(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  bodyPolicy: "none" | "required" = method === "GET" ? "none" : "required",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: PRODUCTION_SERVICE_URL, path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ sản xuất hiện không khả dụng",
  });
}
