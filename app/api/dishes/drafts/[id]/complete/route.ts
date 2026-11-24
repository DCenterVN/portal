import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { dishServices } from "@/lib/dishes/service";
import { loadDishDetail } from "@/lib/dishes/dish-detail";
import { completeDish } from "@/lib/dishes/complete-dish";
import { prepareComplete } from "@/lib/dishes/prepare-complete";
import { validateDish } from "@/lib/dishes/validate-dish";
import { costPreviewErrors } from "@/lib/dishes/precheck-cost";
import { safeMessage } from "@/lib/api/dishes";
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ message: "Nháp không hợp lệ" }, { status: 400 });
  try {
    const services = dishServices(request);
    const draft = await services.getDraft(id);
    if (draft.status !== "OPEN") return NextResponse.json({ message: "Nháp đã đóng" }, { status: 409 });
    const prepared = await prepareComplete(draft, { loadDetail: productRef => loadDishDetail(productRef, services.detail) });
    if (!prepared.ok) return NextResponse.json({ message: prepared.message }, { status: prepared.status });
    const validation = await services.context(prepared.draft.content);
    const errors = validateDish(prepared.draft.content, { ...validation, kind: draft.kind, existingVariants: prepared.existingVariants, source_journey: prepared.sourceJourney });
    if (errors.length) return NextResponse.json({ message: "Kiểm tra các ô còn thiếu", errors }, { status: errors.some(error => error.existing || error.field === "base") ? 409 : 422 });
    if (Object.keys(prepared.draft.progress).length === 0) {
      try {
        const preview = await services.previewCost(prepared.draft.content);
        const costErrors = costPreviewErrors(prepared.draft.content, preview);
        if (costErrors.length) return NextResponse.json({ message: "Chưa đủ giá vốn để hoàn tất món", errors: costErrors }, { status: 422, headers: { "Cache-Control": "no-store" } });
      } catch (err) {
        const errStatus = err && typeof err === "object" && "status" in err && typeof err.status === "number" ? err.status : 500;
        if (errStatus >= 500) return NextResponse.json({ message: "Không kiểm tra được giá vốn lúc này. Thử hoàn tất món lại sau ít phút." }, { status: 503, headers: { "Cache-Control": "no-store" } });
        if (errStatus !== 422 && errStatus !== 403) return NextResponse.json({ message: safeMessage(err instanceof Error ? err.message : "Không kiểm tra được giá vốn") }, { status: errStatus, headers: { "Cache-Control": "no-store" } });
      }
    }
    const result = await completeDish(prepared.draft, { ...services.complete(validation.tree, validation.skuGroups), sourceProductName: prepared.sourceProductName });
    if (!result.ok) result.error.message = safeMessage(result.error.message);
    return NextResponse.json(result, { status: result.ok ? 200 : result.error.status ?? 500, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
    return NextResponse.json({ failed_step: "validate", error: { status, message: safeMessage(error instanceof Error ? error.message : "Không hoàn tất được món") } }, { status });
  }
}
