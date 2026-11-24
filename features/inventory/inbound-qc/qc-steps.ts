import type { StatusTone } from "@/components/patterns/status-badge";

export type StepKey = "allergens" | "location" | "samples" | "sensory" | "temperature" | "shelfLife" | "complete" | "decide";
type LotView = { status: string; storage_location_code: string };
export type Progress = { sample_taken: boolean; sensory_checked: boolean; temperature_checked: boolean; shelf_life_checked: boolean; decision: string | null };
const checked = { sensory: "sensory_checked", temperature: "temperature_checked", shelfLife: "shelf_life_checked" } as const;

export const lotStatusLabel: Record<string, string> = { RECEIVED: "Đã nhận", UNDER_QC: "Đang kiểm", APPROVED: "Đã duyệt", QUARANTINED: "Cách ly", EXPIRED: "Hết hạn", CONSUMED: "Đã dùng hết", DISPOSED: "Đã huỷ" };
export const lotStatusTone: Record<string, StatusTone> = { RECEIVED: "warning", UNDER_QC: "warning", APPROVED: "success", QUARANTINED: "danger", EXPIRED: "danger", CONSUMED: "success", DISPOSED: "neutral" };
export const stepTitle: Record<StepKey, string> = {
  allergens: "Khai báo dị nguyên", location: "Gán vị trí kho", samples: "Lấy mẫu", sensory: "Kiểm cảm quan",
  temperature: "Kiểm nhiệt độ", shelfLife: "Kiểm hạn dùng", complete: "Hoàn tất kiểm", decide: "Duyệt hoặc từ chối lô",
};
export const stepOrder: StepKey[] = ["allergens", "location", "samples", "sensory", "temperature", "shelfLife", "complete", "decide"];
const actions: Record<StepKey, string> = {
  allergens: "inventory:lot_allergen:update", location: "inventory:lot:update", samples: "inventory:qc:update", sensory: "inventory:qc:update",
  temperature: "inventory:qc:update", shelfLife: "inventory:qc:update", complete: "inventory:qc:update", decide: "inventory:lot_qc_decision:create",
};

export function stepEnabled(step: StepKey, lot: LotView, can: (action: string) => boolean): boolean {
  if (!can(actions[step])) return false;
  const underQC = lot.status === "UNDER_QC";
  if (step === "allergens" || step === "location") return underQC || lot.status === "RECEIVED";
  if (step === "samples") return lot.status === "RECEIVED" && lot.storage_location_code.trim() !== "";
  return underQC;
}

export function stepDone(step: StepKey, lot: LotView, session: ReadonlySet<StepKey>, progress?: Progress | null): boolean {
  if (step === "location") return lot.storage_location_code.trim() !== "";
  if (step === "samples") return lot.status !== "RECEIVED";
  if (step === "decide") return lot.status === "APPROVED" || lot.status === "QUARANTINED";
  if (session.has(step)) return true;
  if (step === "complete") return Boolean(progress?.decision);
  return step in checked && Boolean(progress?.[checked[step as keyof typeof checked]]);
}
