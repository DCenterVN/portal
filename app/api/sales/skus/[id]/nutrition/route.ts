import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return forwardService(request, { baseUrl: serviceUrl("sales"), path: `/sales/skus/${encodeURIComponent(id)}/nutrition`, method: "PATCH", unavailableMessage: "Không lưu được dinh dưỡng nguyên liệu" });
}
