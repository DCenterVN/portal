import { NextRequest } from "next/server";
import { forwardPlatform } from "@/lib/api/platform-bff";

type Context = { params: Promise<{ path: string[] }> };
async function handle(request: NextRequest, context: Context) {
  const { path } = await context.params;
  return forwardPlatform(request, path);
}
export const GET = handle;
export const POST = handle;
export const PUT = handle;
