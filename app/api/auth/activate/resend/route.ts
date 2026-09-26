import { NextRequest } from "next/server";
import { forwardService } from "@/lib/api/service-bff";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export function POST(request: NextRequest) {
  return forwardService(request, {
    baseUrl: AUTH_SERVICE_URL,
    path: "/auth/activate/resend",
    method: "POST",
    requireAuth: false,
    unavailableMessage: "Dịch vụ xác thực hiện không khả dụng",
  });
}
