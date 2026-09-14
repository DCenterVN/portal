import { NextRequest } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const SALES_SERVICE_URL =
  process.env.SALES_INTERNAL_URL ||
  process.env.SALES_SERVICE_URL ||
  "http://localhost:8086";

export async function forwardSales(
  request: NextRequest,
  path: string,
  method: "GET" | "POST",
  bodyPolicy: "none" | "required" = method === "POST" ? "required" : "none",
) {
  return forwardService(request, {
    baseUrl: SALES_SERVICE_URL, path, method, bodyPolicy,
    unavailableMessage: "Dịch vụ bán hàng hiện không khả dụng",
  });
}
