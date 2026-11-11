import { NextResponse } from "next/server";
import { z } from "zod";

const branches = z.array(z.object({ id: z.string().uuid(), name: z.string().trim().min(1) })).min(1);
export function GET() {
  try {
    return NextResponse.json(branches.parse(JSON.parse(process.env.PORTAL_STORE_BRANCHES ?? "null")));
  } catch {
    return NextResponse.json({ message: "Chưa cấu hình chi nhánh mua hàng. Vui lòng thử lại sau." }, { status: 503 });
  }
}
