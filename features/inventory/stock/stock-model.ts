import type { StatusTone } from "@/components/patterns/status-badge";
import type { InventoryLotItem, SkuMeta, StockLevelItem } from "@/lib/api/stock-overview";
import { formatDate, toISODate } from "@/lib/format-date";
import { formatQuantity } from "@/lib/stock-transfer";

export const EXPIRING_SOON_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const roundMilli = (value: number) => Math.max(0, Math.round(value * 1000) / 1000);

export type StockItemGroup = "RAW" | "SEMI" | "FINISHED" | "UNKNOWN";
export type LotHealth = "EXPIRED" | "EXPIRING_SOON" | "PENDING_QC" | "OK" | "DEPLETED";
export type StockIssueStatus = "UNUSABLE" | "EXPIRING_SOON" | "PENDING_QC" | "OK" | "EMPTY";

export const stockGroupLabels: Record<StockItemGroup, string> = {
  RAW: "Nguyên liệu",
  SEMI: "Bán thành phẩm",
  FINISHED: "Thành phẩm món",
  UNKNOWN: "Chưa phân loại",
};

export const stockIssueMeta: Record<StockIssueStatus, { label: string; tone: StatusTone; priority: number }> = {
  UNUSABLE: { label: "Có hàng không dùng được", tone: "danger", priority: 0 },
  EXPIRING_SOON: { label: "Sắp hết hạn", tone: "warning", priority: 1 },
  PENDING_QC: { label: "Chờ kiểm đầu vào", tone: "warning", priority: 2 },
  OK: { label: "Đạt chuẩn", tone: "neutral", priority: 3 },
  EMPTY: { label: "Hết tồn", tone: "neutral", priority: 4 },
};

export function classifySkuGroup(meta?: SkuMeta, fromPublicCatalog = false): StockItemGroup {
  if (!meta) return fromPublicCatalog ? "FINISHED" : "UNKNOWN";
  if (meta.kind === "RAW_MATERIAL") return "RAW";
  if (meta.sku_code.startsWith("BTP-") || meta.sku_code.startsWith("VN-PACK-")) return "SEMI";
  if (meta.kind === "PRODUCED_VARIANT" || meta.kind === "COMMERCIAL_SET") return "FINISHED";
  return "UNKNOWN";
}

const isPendingQcStatus = (status: string) => status === "RECEIVED" || status === "UNDER_QC" || status === "QUARANTINED";
const isClosedLotStatus = (status: string) => status === "CONSUMED" || status === "DISPOSED" || status === "REJECTED";

export function evaluateLotHealth(lot: InventoryLotItem, nowMs = Date.now()): LotHealth {
  if (lot.remaining_quantity <= 0 || isClosedLotStatus(lot.status)) return "DEPLETED";
  if (isPendingQcStatus(lot.status)) return "PENDING_QC";
  if (lot.status === "EXPIRED") return "EXPIRED";
  const expMs = lot.expires_at ? Date.parse(lot.expires_at) : NaN;
  if (!Number.isNaN(expMs)) {
    if (expMs <= nowMs) return "EXPIRED";
    if (expMs - nowMs <= EXPIRING_SOON_DAYS * DAY_MS) return "EXPIRING_SOON";
  }
  return "OK";
}

export function lotDisplayStatus(lot: InventoryLotItem, nowMs = Date.now()): { tone: StatusTone; label: string } {
  const health = evaluateLotHealth(lot, nowMs);
  if (lot.status === "APPROVED") {
    if (health === "EXPIRED") return { tone: "danger", label: "Đã hết hạn" };
    if (health === "EXPIRING_SOON") return { tone: "warning", label: "Sắp hết hạn" };
    return { tone: "neutral", label: "Đạt chuẩn" };
  }
  switch (lot.status) {
    case "RECEIVED": return { tone: "warning", label: "Chờ kiểm đầu vào" };
    case "UNDER_QC": return { tone: "info", label: "Đang kiểm định" };
    case "QUARANTINED": return { tone: "danger", label: "Đang cách ly" };
    case "CONSUMED": return { tone: "neutral", label: "Đã dùng hết" };
    case "DISPOSED": return { tone: "danger", label: "Đã huỷ" };
    case "REJECTED": return { tone: "danger", label: "Không đạt QC" };
    case "EXPIRED": return { tone: "danger", label: "Đã hết hạn" };
    default: return { tone: "neutral", label: lot.status };
  }
}

export function formatExpiryDelta(expiresAt: string, nowMs = Date.now()): string {
  if (!expiresAt) return "Chưa có hạn";
  const expMs = Date.parse(expiresAt);
  if (Number.isNaN(expMs)) return "Chưa rõ hạn";
  const expDay = toISODate(expiresAt);
  const nowDay = toISODate(nowMs);
  if (!expDay || !nowDay) return formatDate(expiresAt);
  const diffDays = Math.round((Date.parse(`${expDay}T00:00:00Z`) - Date.parse(`${nowDay}T00:00:00Z`)) / DAY_MS);
  if (expMs <= nowMs) {
    if (diffDays >= 0) return "Đã hết hạn hôm nay";
    return `Quá hạn ${Math.abs(diffDays)} ngày`;
  }
  if (diffDays <= 0) return "Hết hạn hôm nay";
  return `Còn ${diffDays} ngày`;
}

export type StockRowModel = {
  skuRef: string;
  skuCode: string;
  name: string;
  skuStatus?: string;
  group: StockItemGroup;
  uom: string;
  onHand: number;
  usable: number;
  reserved: number;
  shelfPending: number;
  sellable: number;
  unusable: number;
  pendingQcQty: number;
  expiringSoonQty: number;
  expiredQty: number;
  nearestExpiresAt: string | null;
  issueStatus: StockIssueStatus;
  issueSummary: string;
  hasStock: boolean;
  lots: InventoryLotItem[];
};

const lotFefoCompare = (a: InventoryLotItem, b: InventoryLotItem) => {
  const activeA = a.remaining_quantity > 0 && !isClosedLotStatus(a.status);
  const activeB = b.remaining_quantity > 0 && !isClosedLotStatus(b.status);
  if (activeA !== activeB) return activeA ? -1 : 1;
  const expA = a.expires_at ? Date.parse(a.expires_at) : Number.MAX_SAFE_INTEGER;
  const expB = b.expires_at ? Date.parse(b.expires_at) : Number.MAX_SAFE_INTEGER;
  return (Number.isNaN(expA) ? Number.MAX_SAFE_INTEGER : expA) - (Number.isNaN(expB) ? Number.MAX_SAFE_INTEGER : expB);
};

function buildIssueSummary(
  uom: string,
  unusable: number,
  pendingQcQty: number,
  lots: InventoryLotItem[],
  nowMs: number,
): { status: StockIssueStatus; summary: string } {
  const active = lots.filter(l => l.remaining_quantity > 0 && !isClosedLotStatus(l.status));
  const expiredLot = active.find(l => evaluateLotHealth(l, nowMs) === "EXPIRED");
  const soonLot = active.find(l => evaluateLotHealth(l, nowMs) === "EXPIRING_SOON");
  const qcLot = active.find(l => evaluateLotHealth(l, nowMs) === "PENDING_QC");

  if (unusable > 0) {
    const qtyText = formatQuantity(unusable, uom);
    if (expiredLot) {
      const loc = expiredLot.storage_location_code ? ` · ${expiredLot.storage_location_code}` : "";
      return { status: "UNUSABLE", summary: `${qtyText} không dùng được (lô ${expiredLot.supplier_lot_code}${loc} hết hạn ${formatDate(expiredLot.expires_at)})` };
    }
    return { status: "UNUSABLE", summary: `${qtyText} không dùng được (hết hạn hoặc đang cách ly)` };
  }
  if (soonLot) {
    return { status: "EXPIRING_SOON", summary: `Lô ${soonLot.supplier_lot_code} ${formatExpiryDelta(soonLot.expires_at, nowMs).toLowerCase()} (${formatDate(soonLot.expires_at)})` };
  }
  if (pendingQcQty > 0) {
    const lotLabel = qcLot ? ` (lô ${qcLot.supplier_lot_code})` : "";
    return { status: "PENDING_QC", summary: `${formatQuantity(pendingQcQty, uom)} chờ kiểm đầu vào${lotLabel}` };
  }
  const okLot = active.find(l => evaluateLotHealth(l, nowMs) === "OK" && l.expires_at);
  if (okLot) return { status: "OK", summary: `HSD gần nhất ${formatDate(okLot.expires_at)} (${formatExpiryDelta(okLot.expires_at, nowMs).toLowerCase()})` };
  return { status: "OK", summary: "Sẵn sàng cấp phát" };
}

export function buildStockRows({
  stocks,
  lots,
  skuMeta,
  fallbackNames = new Map<string, string>(),
  nowMs = Date.now(),
}: {
  stocks: StockLevelItem[];
  lots: InventoryLotItem[];
  skuMeta: Map<string, SkuMeta>;
  fallbackNames?: Map<string, string>;
  nowMs?: number;
}): StockRowModel[] {
  const stockBySku = new Map<string, StockLevelItem>();
  for (const item of stocks) stockBySku.set(item.sku_ref, item);

  const lotsBySku = new Map<string, InventoryLotItem[]>();
  for (const lot of lots) {
    const list = lotsBySku.get(lot.sku_ref) ?? [];
    list.push(lot);
    lotsBySku.set(lot.sku_ref, list);
  }

  const allSkus = new Set<string>([...stockBySku.keys(), ...lotsBySku.keys()]);
  const rows: StockRowModel[] = [];

  for (const skuRef of allSkus) {
    const stock = stockBySku.get(skuRef);
    const sortedLots = [...(lotsBySku.get(skuRef) ?? [])].sort(lotFefoCompare);
    const meta = skuMeta.get(skuRef);
    const catalogName = fallbackNames.get(skuRef);
    const uom = stock?.uom ?? sortedLots[0]?.uom ?? meta?.uom_code ?? "";
    const onHand = roundMilli(stock?.on_hand_quantity ?? 0);
    const reserved = roundMilli(stock?.reserved_quantity ?? 0);
    const usable = roundMilli(stock?.usable_quantity ?? stock?.available_quantity ?? 0);
    const shelfPending = roundMilli(stock?.shelf_pending_quantity ?? 0);
    const sellable = roundMilli(stock?.sellable_quantity ?? 0);
    const unusable = stock ? roundMilli(Math.max(0, onHand - usable - reserved)) : 0;

    let pendingQcQty = 0;
    let expiringSoonQty = 0;
    let expiredQty = 0;
    let nearestExpiresAt: string | null = null;

    for (const lot of sortedLots) {
      const health = evaluateLotHealth(lot, nowMs);
      if (health === "PENDING_QC") pendingQcQty += lot.remaining_quantity;
      if (health === "EXPIRING_SOON") expiringSoonQty += lot.remaining_quantity;
      if (health === "EXPIRED") expiredQty += lot.remaining_quantity;
      if (!nearestExpiresAt && health !== "DEPLETED" && lot.expires_at) nearestExpiresAt = lot.expires_at;
    }
    pendingQcQty = roundMilli(pendingQcQty);
    expiringSoonQty = roundMilli(expiringSoonQty);
    expiredQty = roundMilli(expiredQty);

    const hasStock = onHand > 0 || reserved > 0 || pendingQcQty > 0;
    const issue = hasStock
      ? buildIssueSummary(uom, unusable, pendingQcQty, sortedLots, nowMs)
      : { status: "EMPTY" as const, summary: "Đã xuất hết" };

    rows.push({
      skuRef,
      skuCode: meta?.sku_code ?? "",
      name: meta?.name ?? catalogName ?? "Mặt hàng trong kho",
      skuStatus: meta?.status,
      group: classifySkuGroup(meta, Boolean(catalogName)),
      uom,
      onHand,
      usable,
      reserved,
      shelfPending,
      sellable,
      unusable,
      pendingQcQty,
      expiringSoonQty,
      expiredQty,
      nearestExpiresAt,
      issueStatus: issue.status,
      issueSummary: issue.summary,
      hasStock,
      lots: sortedLots,
    });
  }

  return rows.sort((a, b) => {
    const diff = stockIssueMeta[a.issueStatus].priority - stockIssueMeta[b.issueStatus].priority;
    return diff !== 0 ? diff : a.name.localeCompare(b.name, "vi");
  });
}

export function summarizeStockRows(rows: StockRowModel[]) {
  const active = rows.filter(row => row.hasStock);
  return {
    totalActiveItems: active.length,
    expiringSoonItems: active.filter(row => row.expiringSoonQty > 0).length,
    attentionItems: active.filter(row => row.unusable > 0 || row.pendingQcQty > 0).length,
  };
}
