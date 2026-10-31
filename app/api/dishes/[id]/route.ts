import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loadDishDetail } from "@/lib/dishes/dish-detail";
import { dishServices } from "@/lib/dishes/service";
import { safeMessage } from "@/lib/api/dishes";
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ message: "Món không hợp lệ" }, { status: 400 });
  try { return NextResponse.json(await loadDishDetail(id, dishServices(request).detail), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
    return NextResponse.json({ message: safeMessage(error instanceof Error ? error.message : "Không tải được món") }, { status });
  }
}
