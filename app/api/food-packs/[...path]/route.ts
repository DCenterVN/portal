import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OPERATIONS, type OperationId } from "@/lib/contracts/operations.generated";
import { forwardService } from "@/lib/api/service-bff";

const packIds = [
  "createPackage", "listPackages", "getPackage", "updatePackage", "retirePackage",
  "createFoodSet", "listFoodSets", "getFoodSet", "updateFoodSet", "retireFoodSet",
  "getRawLabels", "updateRawLabels", "createPackageRecipe", "listPackageRecipes",
  "getPackageRecipe", "updatePackageRecipe", "retirePackageRecipe", "evaluateFoodSet",
] satisfies OperationId[];
const packOperations = packIds.map(id => ({ id, ...OPERATIONS[id] }));
const uuid = z.string().uuid();

type Context = { params: Promise<{ path: string[] }> };
function matches(template: string, path: string[]) {
  const segments = template.slice(1).split("/");
  return segments.length === path.length && segments.every((segment, index) => {
    if (segment === "{version}") return /^[1-9][0-9]*$/.test(path[index]);
    if (segment.startsWith("{")) return uuid.safeParse(path[index]).success;
    return segment === path[index];
  });
}

async function forward(request: NextRequest, context: Context) {
  const { path } = await context.params;
  const operation = packOperations.find(op => op.method === request.method && matches(op.path, path));
  if (!operation) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const baseUrl = operation.service === "sales"
    ? process.env.SALES_INTERNAL_URL || process.env.SALES_SERVICE_URL || "http://localhost:8086"
    : process.env.PRODUCTION_INTERNAL_URL || process.env.PRODUCTION_SERVICE_URL || "http://localhost:8087";
  const noBody = operation.method === "GET" || (operation.method === "DELETE" && operation.id !== "retirePackageRecipe");
  return forwardService(request, {
    baseUrl, path: `/${path.join("/")}${request.nextUrl.search}`, method: operation.method,
    bodyPolicy: noBody ? "none" : "required",
    unavailableMessage: "Dịch vụ gói thực phẩm hiện không khả dụng",
  });
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
