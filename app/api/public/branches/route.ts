import { NextResponse } from "next/server";
import { serviceUrl } from "@/lib/api/service-bff";
import { storeBranches, type StoreBranch } from "@/features/products/store-branches";

const unavailable = { message: "Chưa tải được danh sách cửa hàng. Vui lòng tải lại trang sau ít phút." };
const keepMs = 30_000;
let kept: { at: number; branches: StoreBranch[] } | null = null;

export async function GET() {
  if (kept && Date.now() - kept.at < keepMs) return NextResponse.json(kept.branches);
  try {
    const response = await fetch(`${serviceUrl("org")}/org/public/branches`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!response.ok) throw new Error(String(response.status));
    kept = { at: Date.now(), branches: storeBranches(await response.json()) };
    return NextResponse.json(kept.branches);
  } catch {
    return NextResponse.json(unavailable, { status: 503 });
  }
}
