import { NextRequest } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_INTERNAL_URL ||
  process.env.INVENTORY_SERVICE_URL ||
  "http://localhost:8085";

export async function forwardInventory(
  request: NextRequest,
  path: string,
  method: "GET" | "POST" | "PUT" | "PATCH",
  bodyPolicy: "none" | "required" = method === "GET" ? "none" : "required",
  requireAuth: boolean = true,
) {
  return forwardService(request, {
    baseUrl: INVENTORY_SERVICE_URL, path, method, bodyPolicy, requireAuth,
    unavailableMessage: "Dịch vụ kho hiện không khả dụng",
  });
}
