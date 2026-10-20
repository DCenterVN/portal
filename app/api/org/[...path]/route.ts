import { NextRequest } from "next/server";
import { forwardCompany } from "@/lib/api/company-bff";

type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return forwardCompany(request, path);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
