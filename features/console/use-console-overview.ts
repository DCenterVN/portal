"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route } from "next";
import useSWR from "swr";
import { z } from "zod";
import { supplierHref } from "@/features/inventory/supplier-routes";
import { useAccess } from "@/lib/access-boundary";
import { listAllDishes, listDishDrafts } from "@/lib/api/dishes";
import { getInboundLots, type InboundLot } from "@/lib/api/inbound-qc";
import { catalogRequest, getMaterialTree, listMaterials } from "@/lib/api/material-catalog";
import { getOrdersPage, getTargetsPage, type ProductionOrder, type ProductionTarget } from "@/lib/api/production";
import { getShelfPendingPage, type ShelfPendingLot } from "@/lib/api/shelf-pending";
import { getStaffOrdersPage, type StaffOrder } from "@/lib/api/staff-orders";
import { getSupplierOverview, type SupplierOverview } from "@/lib/api/supplier-overview";
import { branchLabel, type BranchType } from "@/lib/branch-label";
import { draftKindLabels, type DraftKind, type DraftRow } from "@/lib/dishes/types";
import { fetcher } from "@/lib/fetcher";
import { formatVND } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { materialCategoryRank } from "@/lib/material-category-order";
import { ROLE_INFO, roleName } from "@/lib/permission-labels";
import { uomLabel } from "@/lib/stock-transfer";
import type { DishSummary, MaterialBarItem, StageBarItem } from "./console-charts";

export type AccessContext = {
  org_id: string;
  org_name: string;
  branch_id: string;
  branch_name: string;
  branch_type?: BranchType;
  roles: string[];
};

export type ConsoleResponse = {
  user: { display_name?: string; email?: string };
  active_context?: { org_id?: string; branch_id?: string };
  contexts: AccessContext[];
  permissions: string[];
};

export type ConsoleKpi = {
  id: string;
  label: string;
  count: number;
  plus: boolean;
  error?: boolean;
  hint: string;
  href: Route;
};

export type ConsoleQueueRow = {
  id: string;
  href: Route;
  badge?: string;
  title: string;
  subtitle: string;
};

export type ConsoleQueue = {
  id: string;
  title: string;
  allHref: Route;
  rows: ConsoleQueueRow[];
};

type DraftMaterial = { id: string; name: string; uom_code: string };

type OverviewState = {
  drafts: DraftRow[];
  hasMoreDrafts: boolean;
  draftMaterials: DraftMaterial[];
  hasMoreMaterials: boolean;
  materialBars: MaterialBarItem[];
  dishCounts?: { selling: number; ready: number };
  draftTargets: ProductionTarget[];
  supplierOverview?: SupplierOverview;
  receivedLots: InboundLot[];
  receivedLotsTotal: number;
  shelfPending?: { items: ShelfPendingLot[]; next_cursor: string };
  qcPendingOrders: ProductionOrder[];
  handedOffOrders: ProductionOrder[];
  orderSummary: StageBarItem[];
  pendingSalesOrders?: { items: StaffOrder[]; next_cursor: string | null };
  salesSummary: StageBarItem[];
  failedSources: ReadonlySet<string>;
};

const EMPTY_STATE: OverviewState = {
  drafts: [],
  hasMoreDrafts: false,
  draftMaterials: [],
  hasMoreMaterials: false,
  materialBars: [],
  draftTargets: [],
  receivedLots: [],
  receivedLotsTotal: 0,
  qcPendingOrders: [],
  handedOffOrders: [],
  orderSummary: [],
  salesSummary: [],
  failedSources: new Set(),
};

const draftSkuPageSchema = z.object({
  items: z.array(z.object({ id: z.string(), name: z.string(), uom_code: z.string() })).nullable().transform(items => items ?? []),
  next_cursor: z.string().nullish(),
});

const person = (name: string) => name.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "Thành viên chi nhánh");

export function formatContextBranch(ctx: AccessContext): string {
  return ctx.branch_type ? branchLabel({ name: ctx.branch_name, type: ctx.branch_type, org: ctx.org_name }) : ctx.branch_name;
}

export function formatContextRoles(ctx: AccessContext): string {
  return ctx.roles
    .map(code => {
      const normalized = code.trim().toUpperCase();
      if (Object.hasOwn(ROLE_INFO, normalized)) return roleName(code);
      const label = roleName(code);
      return /^[A-Z0-9_]+$/.test(label) ? "" : label;
    })
    .filter(Boolean)
    .join(", ");
}

export function useConsoleOverview() {
  const { can, scope } = useAccess();
  const { data, error, isLoading, mutate } = useSWR<ConsoleResponse>("/api/console", fetcher, { revalidateOnFocus: false, errorRetryCount: 1 });
  const permissionList = data?.permissions;
  const has = useCallback((key: string) => (scope ? can(key) : Boolean(permissionList?.includes(key))), [can, permissionList, scope]);

  const targetBranchId = scope?.branchId ?? data?.active_context?.branch_id;
  const activeBranch = useMemo(() => {
    const contexts = data?.contexts ?? [];
    if (targetBranchId) return contexts.find(ctx => ctx.branch_id === targetBranchId);
    return contexts.length === 1 ? contexts[0] : undefined;
  }, [data?.contexts, targetBranchId]);

  const branchId = scope?.branchId ?? activeBranch?.branch_id ?? "";
  const isKitchen = activeBranch?.branch_type === "CENTRAL_KITCHEN";
  const hasBranch = Boolean(branchId);
  const canProduct = has("sales:product:read");
  const canGoodsReceiptCreate = has("inventory:goods_receipt:create") && isKitchen;
  const canTarget = has("production:target:read") && hasBranch;
  const canSupplier = has("inventory:supplier:read") && isKitchen;
  const canInboundQc = has("inventory:qc:update") && hasBranch;
  const canShelf = has("inventory:shelf_placement:read") && hasBranch;
  const canProductionQc = has("production:qc:update") && hasBranch;
  const canProductionOrder = has("production:order:read") && hasBranch;
  const canSalesOrder = has("sales:order:read") && hasBranch;
  const canOrg = has("org:membership:read");

  const [state, setState] = useState<OverviewState>(EMPTY_STATE);
  const [queuesLoading, setQueuesLoading] = useState(false);
  const [queuesLoaded, setQueuesLoaded] = useState(false);
  const [partialError, setPartialError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const hasQueueWork = canProduct || canTarget || canSupplier || canInboundQc || canShelf || canProductionQc || canProductionOrder || canSalesOrder;

  useEffect(() => {
    if (!data || !hasQueueWork) {
      setState(EMPTY_STATE);
      setQueuesLoading(false);
      setQueuesLoaded(Boolean(data));
      setPartialError(false);
      return;
    }
    let live = true;
    setQueuesLoading(true);
    setPartialError(false);

    const failed = new Set<string>();
    const nextState: OverviewState = {
      drafts: [],
      hasMoreDrafts: false,
      draftMaterials: [],
      hasMoreMaterials: false,
      materialBars: [],
      draftTargets: [],
      receivedLots: [],
      receivedLotsTotal: 0,
      qcPendingOrders: [],
      handedOffOrders: [],
      orderSummary: [],
      salesSummary: [],
      failedSources: failed,
    };
    const tasks: Array<() => Promise<void>> = [];

    if (canProduct) {
      tasks.push(async () => {
        try {
          const res = await listDishDrafts("status=OPEN&limit=5");
          nextState.drafts = res.items;
          nextState.hasMoreDrafts = Boolean(res.next_cursor);
        } catch {
          failed.add("drafts");
        }
      });
      tasks.push(async () => {
        try {
          const res = await catalogRequest("/api/sales/skus?kind=RAW_MATERIAL&status=DRAFT&limit=6", draftSkuPageSchema);
          nextState.draftMaterials = res.items.slice(0, 5);
          nextState.hasMoreMaterials = res.items.length > 5 || Boolean(res.next_cursor);
        } catch {
          failed.add("materials");
        }
      });
      tasks.push(async () => {
        try {
          const tree = await getMaterialTree();
          const [activeMaterials, draftMaterials] = await Promise.all([
            listMaterials("ACTIVE", tree),
            listMaterials("DRAFT", tree),
          ]);
          const counts = new Map<string, { active: number; draft: number }>();
          for (const item of activeMaterials) {
            if (!item.category) continue;
            const entry = counts.get(item.category) ?? { active: 0, draft: 0 };
            entry.active += 1;
            counts.set(item.category, entry);
          }
          for (const item of draftMaterials) {
            if (!item.category) continue;
            const entry = counts.get(item.category) ?? { active: 0, draft: 0 };
            entry.draft += 1;
            counts.set(item.category, entry);
          }
          nextState.materialBars = [...tree]
            .sort((a, b) => materialCategoryRank(a.code) - materialCategoryRank(b.code))
            .slice(0, 13)
            .map(category => {
              const count = counts.get(category.code) ?? { active: 0, draft: 0 };
              return { code: category.code, label: category.label, active: count.active, draft: count.draft };
            });
        } catch {
          nextState.materialBars = [];
        }
      });
      tasks.push(async () => {
        try {
          const dishes = await listAllDishes();
          let selling = 0;
          let ready = 0;
          for (const dish of dishes) {
            if (dish.counts.SELLING > 0) selling += 1;
            else if (dish.counts.DONE > 0) ready += 1;
          }
          nextState.dishCounts = { selling, ready };
        } catch {
          nextState.dishCounts = undefined;
        }
      });
    }
    if (canTarget) {
      tasks.push(async () => {
        try {
          const res = await getTargetsPage({ status: "DRAFT", pageSize: 6 });
          nextState.draftTargets = res.items;
        } catch {
          failed.add("targets");
        }
      });
    }
    if (canSupplier) {
      tasks.push(async () => {
        try {
          nextState.supplierOverview = await getSupplierOverview();
        } catch {
          failed.add("suppliers");
        }
      });
    }
    if (canInboundQc) {
      tasks.push(async () => {
        try {
          const page = await getInboundLots({ status: "RECEIVED", page: 1, limit: 5 });
          nextState.receivedLots = page.items;
          nextState.receivedLotsTotal = page.pagination?.total_items ?? page.total ?? page.items.length;
        } catch {
          failed.add("inbound-qc");
        }
      });
    }
    if (canShelf && branchId) {
      tasks.push(async () => {
        try {
          nextState.shelfPending = await getShelfPendingPage(branchId, "1");
        } catch {
          failed.add("shelf");
        }
      });
    }
    if (canProductionQc) {
      tasks.push(async () => {
        try {
          const res = await getOrdersPage({ status: "COMPLETED", pageSize: 6 });
          nextState.qcPendingOrders = res.items;
        } catch {
          failed.add("production-qc");
        }
      });
    }
    if (canProductionOrder) {
      tasks.push(async () => {
        try {
          const res = await getOrdersPage({ status: "HANDED_OFF", pageSize: 6 });
          nextState.handedOffOrders = res.items;
        } catch {
          failed.add("production-orders");
        }
      });
      if (!canProduct) {
        tasks.push(async () => {
          try {
            const res = await getOrdersPage({ pageSize: 50 });
            if (res.items.length === 0) return;
            let handedOff = 0;
            let inProgress = 0;
            let completed = 0;
            let qcPassed = 0;
            for (const order of res.items) {
              const status = order.status as string;
              if (status === "HANDED_OFF") handedOff += 1;
              else if (status === "ACCEPTED" || status === "SCHEDULED" || status === "ALLOCATED" || status === "IN_PROGRESS") inProgress += 1;
              else if (status === "COMPLETED") completed += 1;
              else if (status === "QC_PASSED") qcPassed += 1;
            }
            nextState.orderSummary = [
              { id: "handed-off", label: "Chờ tiếp nhận", count: handedOff, colorVar: "--chart-5", href: "/production/orders" as Route },
              { id: "in-progress", label: "Đang sản xuất", count: inProgress, colorVar: "--chart-2", href: "/production/orders" as Route },
              { id: "completed", label: "Chờ kiểm định", count: completed, colorVar: "--chart-3", href: "/production/qc" as Route },
              { id: "qc-passed", label: "Đạt kiểm định", count: qcPassed, colorVar: "--chart-1", href: "/inventory/shelves" as Route },
            ];
          } catch {
            nextState.orderSummary = [];
          }
        });
      }
    }
    if (canSalesOrder) {
      tasks.push(async () => {
        try {
          const res = await getStaffOrdersPage({ status: "AWAITING_PAYMENT" });
          nextState.pendingSalesOrders = { items: res.items, next_cursor: res.next_cursor ?? null };
        } catch {
          failed.add("sales-orders");
        }
      });
      if (!canProduct && !canProductionOrder) {
        tasks.push(async () => {
          try {
            const res = await getStaffOrdersPage();
            if (res.items.length === 0) return;
            let awaitingPayment = 0;
            let placed = 0;
            let active = 0;
            let delivered = 0;
            for (const order of res.items) {
              if (order.status === "AWAITING_PAYMENT") awaitingPayment += 1;
              else if (order.status === "PLACED" || order.status === "PENDING") placed += 1;
              else if (order.status === "CONFIRMED" || order.status === "PACKED" || order.status === "DELIVERING") active += 1;
              else if (order.status === "DELIVERED" || order.status === "COMPLETED") delivered += 1;
            }
            nextState.salesSummary = [
              { id: "awaiting-payment", label: "Chờ thanh toán", count: awaitingPayment, colorVar: "--chart-5", href: "/sales/orders" as Route },
              { id: "placed", label: "Chờ xác nhận", count: placed, colorVar: "--chart-3", href: "/sales/orders" as Route },
              { id: "active", label: "Đang chuẩn bị / giao", count: active, colorVar: "--chart-2", href: "/sales/orders" as Route },
              { id: "delivered", label: "Đã giao / hoàn tất", count: delivered, colorVar: "--chart-1", href: "/sales/orders" as Route },
            ];
          } catch {
            nextState.salesSummary = [];
          }
        });
      }
    }

    void Promise.allSettled(tasks.map(task => task())).then(() => {
      if (!live) return;
      setState(nextState);
      setPartialError(failed.size > 0);
      setQueuesLoading(false);
      setQueuesLoaded(true);
    });

    return () => {
      live = false;
    };
  }, [
    data,
    hasQueueWork,
    branchId,
    canProduct,
    canTarget,
    canSupplier,
    canInboundQc,
    canShelf,
    canProductionQc,
    canProductionOrder,
    canSalesOrder,
    reloadTick,
  ]);

  const kpis = useMemo<ConsoleKpi[]>(() => {
    const all: ConsoleKpi[] = [];
    if (canProduct) {
      const draftsErr = state.failedSources.has("drafts");
      all.push({
        id: "dish-drafts",
        label: "Nháp món đang soạn",
        count: draftsErr ? 0 : state.drafts.length,
        plus: !draftsErr && state.hasMoreDrafts,
        error: draftsErr,
        hint: "Chưa hoàn tất công thức & giá",
        href: "/production/dishes?tab=drafts" as Route,
      });
      const materialsErr = state.failedSources.has("materials");
      all.push({
        id: "draft-materials",
        label: "Nguyên liệu nháp",
        count: materialsErr ? 0 : state.draftMaterials.length,
        plus: !materialsErr && state.hasMoreMaterials,
        error: materialsErr,
        hint: "Chờ hoàn tất trước khi đưa vào món",
        href: "/production/materials?trang_thai=nhap" as Route,
      });
    }
    if (canTarget) {
      const targetsErr = state.failedSources.has("targets");
      all.push({
        id: "draft-targets",
        label: "Chỉ tiêu chờ duyệt",
        count: targetsErr ? 0 : state.draftTargets.slice(0, 5).length,
        plus: !targetsErr && state.draftTargets.length > 5,
        error: targetsErr,
        hint: "Chỉ tiêu sản xuất đang soạn",
        href: "/production/targets" as Route,
      });
    }
    if (canInboundQc) {
      const inboundErr = state.failedSources.has("inbound-qc");
      all.push({
        id: "inbound-qc",
        label: "Lô chờ kiểm đầu vào",
        count: inboundErr ? 0 : state.receivedLotsTotal,
        plus: false,
        error: inboundErr,
        hint: "Vừa nhận kho, chờ kiểm định",
        href: "/inventory/inbound-qc" as Route,
      });
    }
    if (canSupplier) {
      const supplierErr = state.failedSources.has("suppliers");
      all.push({
        id: "suppliers-without-price",
        label: "Nhà cung cấp chưa có giá",
        count: supplierErr ? 0 : (state.supplierOverview?.price_coverage.suppliers_without_active_price ?? 0),
        plus: false,
        error: supplierErr,
        hint: "Chưa lập bảng giá tham chiếu",
        href: "/inventory/suppliers?f.attention=without_price" as Route,
      });
      all.push({
        id: "suppliers-expiring",
        label: "Giá sắp hết hạn",
        count: supplierErr ? 0 : (state.supplierOverview?.agreements.expiring_within_14_days ?? 0),
        plus: false,
        error: supplierErr,
        hint: "Hết hiệu lực trong 14 ngày tới",
        href: "/inventory/suppliers?f.attention=expiring" as Route,
      });
    }
    if (canShelf) {
      const shelfErr = state.failedSources.has("shelf");
      all.push({
        id: "shelf-pending",
        label: "Hàng chờ lên kệ",
        count: shelfErr ? 0 : (state.shelfPending?.items.length ?? 0),
        plus: !shelfErr && Boolean(state.shelfPending?.next_cursor),
        error: shelfErr,
        hint: "Chờ xếp kệ và sinh mã truy xuất",
        href: "/inventory/shelves" as Route,
      });
    }
    if (canProductionQc) {
      const qcErr = state.failedSources.has("production-qc");
      all.push({
        id: "production-qc",
        label: "Mẻ chờ kiểm định",
        count: qcErr ? 0 : state.qcPendingOrders.slice(0, 5).length,
        plus: !qcErr && state.qcPendingOrders.length > 5,
        error: qcErr,
        hint: "Đã nấu xong, chờ nghiệm thu",
        href: "/production/qc" as Route,
      });
    }
    if (canProductionOrder) {
      const orderErr = state.failedSources.has("production-orders");
      all.push({
        id: "production-orders",
        label: "Lệnh sản xuất mới",
        count: orderErr ? 0 : state.handedOffOrders.slice(0, 5).length,
        plus: !orderErr && state.handedOffOrders.length > 5,
        error: orderErr,
        hint: "Chờ bếp tiếp nhận",
        href: "/production/orders" as Route,
      });
    }
    if (canSalesOrder) {
      const salesErr = state.failedSources.has("sales-orders");
      const items = state.pendingSalesOrders?.items ?? [];
      all.push({
        id: "sales-orders",
        label: "Đơn hàng chờ xử lý",
        count: salesErr ? 0 : items.slice(0, 5).length,
        plus: !salesErr && (Boolean(state.pendingSalesOrders?.next_cursor) || items.length > 5),
        error: salesErr,
        hint: "Đơn chờ thanh toán / xác nhận",
        href: "/sales/orders" as Route,
      });
    }
    return all.sort((a, b) => Number(b.count > 0 || Boolean(b.error)) - Number(a.count > 0 || Boolean(a.error))).slice(0, 4);
  }, [
    canProduct,
    canTarget,
    canInboundQc,
    canSupplier,
    canShelf,
    canProductionQc,
    canProductionOrder,
    canSalesOrder,
    state,
  ]);

  const queues = useMemo<ConsoleQueue[]>(() => {
    const list: ConsoleQueue[] = [];
    if (state.drafts.length > 0) {
      list.push({
        id: "dish-drafts",
        title: "Nháp món đang soạn",
        allHref: "/production/dishes?tab=drafts" as Route,
        rows: state.drafts.slice(0, 5).map(draft => ({
          id: draft.id,
          href: `/production/dishes/drafts/${draft.id}?from=drafts` as Route,
          badge: draftKindLabels[draft.kind as DraftKind],
          title: draft.title || "Món chưa đặt tên",
          subtitle: `${draft.updated_by ? person(draft.updated_by) : "Thành viên chi nhánh"} · ${formatDateTime(draft.updated_at)}`,
        })),
      });
    }
    if (state.draftMaterials.length > 0) {
      list.push({
        id: "draft-materials",
        title: "Nguyên liệu nháp chờ duyệt",
        allHref: "/production/materials?trang_thai=nhap" as Route,
        rows: state.draftMaterials.slice(0, 5).map(item => ({
          id: item.id,
          href: `/production/materials?trang_thai=nhap&q=${encodeURIComponent(item.name)}` as Route,
          title: item.name,
          subtitle: uomLabel(item.uom_code),
        })),
      });
    }
    if (state.draftTargets.length > 0) {
      list.push({
        id: "draft-targets",
        title: "Chỉ tiêu sản xuất đang soạn",
        allHref: "/production/targets" as Route,
        rows: state.draftTargets.slice(0, 5).map(target => ({
          id: target.id,
          href: "/production/targets" as Route,
          title: target.title || target.target_code,
          subtitle: `${formatDate(target.period_start)} – ${formatDate(target.period_end)}`,
        })),
      });
    }
    if (state.receivedLots.length > 0) {
      list.push({
        id: "inbound-qc",
        title: "Lô nguyên liệu chờ kiểm đầu vào",
        allHref: "/inventory/inbound-qc" as Route,
        rows: state.receivedLots.slice(0, 5).map(lot => ({
          id: lot.id,
          href: `/inventory/inbound-qc?lot=${encodeURIComponent(lot.id)}` as Route,
          title: `Lô nhận kho · ${lot.initial_quantity.toLocaleString("vi-VN")} ${uomLabel(lot.uom)}`,
          subtitle: `Hạn dùng ${formatDate(lot.expires_at)}`,
        })),
      });
    }
    if (state.supplierOverview) {
      const supplierRows: ConsoleQueueRow[] = [
        ...state.supplierOverview.attention.without_price.map(row => ({
          id: `without-price-${row.supplier_id}`,
          href: supplierHref.newPrice(row.supplier_id),
          title: row.supplier_name,
          subtitle: "Chưa có bảng giá",
        })),
        ...state.supplierOverview.attention.expiring.map(row => ({
          id: `expiring-${row.supplier_id}-${row.agreement_code}`,
          href: supplierHref.tab(row.supplier_id, "agreements"),
          title: row.supplier_name,
          subtitle: `Hết hạn ${formatDate(row.valid_to)}`,
        })),
      ].slice(0, 5);
      if (supplierRows.length > 0) {
        list.push({
          id: "suppliers-attention",
          title: "Nhà cung cấp cần cập nhật giá",
          allHref: (state.supplierOverview.attention.without_price.length > 0
            ? "/inventory/suppliers?f.attention=without_price"
            : "/inventory/suppliers?f.attention=expiring") as Route,
          rows: supplierRows,
        });
      }
    }
    if (state.shelfPending && state.shelfPending.items.length > 0) {
      list.push({
        id: "shelf-pending",
        title: "Hàng chờ lên kệ",
        allHref: "/inventory/shelves" as Route,
        rows: state.shelfPending.items.slice(0, 5).map(lot => ({
          id: lot.lot_id,
          href: "/inventory/shelves" as Route,
          title: lot.source_code ? `Từ ${lot.source_code}` : "Lô chờ xếp kệ",
          subtitle: `${lot.pending_quantity.toLocaleString("vi-VN")} ${uomLabel(lot.uom)}`,
        })),
      });
    }
    if (state.qcPendingOrders.length > 0) {
      list.push({
        id: "production-qc",
        title: "Mẻ thành phẩm chờ kiểm định",
        allHref: "/production/qc" as Route,
        rows: state.qcPendingOrders.slice(0, 5).map(order => ({
          id: order.id,
          href: "/production/qc" as Route,
          title: order.order_code,
          subtitle: `${(order.actual_output_quantity || order.planned_quantity).toLocaleString("vi-VN")} ${uomLabel(order.uom)}`,
        })),
      });
    }
    if (state.handedOffOrders.length > 0) {
      list.push({
        id: "production-orders",
        title: "Lệnh sản xuất chờ tiếp nhận",
        allHref: "/production/orders" as Route,
        rows: state.handedOffOrders.slice(0, 5).map(order => ({
          id: order.id,
          href: "/production/orders" as Route,
          title: order.order_code,
          subtitle: `${order.planned_quantity.toLocaleString("vi-VN")} ${uomLabel(order.uom)}`,
        })),
      });
    }
    const salesItems = state.pendingSalesOrders?.items ?? [];
    if (salesItems.length > 0) {
      list.push({
        id: "sales-orders",
        title: "Đơn hàng chờ xử lý",
        allHref: "/sales/orders" as Route,
        rows: salesItems.slice(0, 5).map(order => ({
          id: order.id,
          href: "/sales/orders" as Route,
          title: order.order_code || "Đơn hàng mới",
          subtitle: formatVND(order.total_vnd),
        })),
      });
    }
    return list.slice(0, 2);
  }, [state]);

  const dishSummary = useMemo<DishSummary | null>(() => {
    if (!canProduct || !state.dishCounts) return null;
    return {
      selling: state.dishCounts.selling,
      ready: state.dishCounts.ready,
      drafts: state.drafts.length,
      hasMoreDrafts: state.hasMoreDrafts,
    };
  }, [canProduct, state.dishCounts, state.drafts.length, state.hasMoreDrafts]);

  const primaryAction = useMemo(() => {
    if (canProduct) return { label: "Mở món ăn", href: "/production/dishes" as Route };
    if (canGoodsReceiptCreate) return { label: "Nhập hàng", href: "/inventory/goods-receipts/new" as Route };
    if (canProductionOrder) return { label: "Lệnh sản xuất", href: "/production/orders" as Route };
    if (canSalesOrder) return { label: "Đơn hàng", href: "/sales/orders" as Route };
    return undefined;
  }, [canGoodsReceiptCreate, canProduct, canProductionOrder, canSalesOrder]);

  return {
    data,
    error,
    isLoading,
    mutate,
    activeBranch,
    kpis,
    queues,
    queuesLoading,
    queuesLoaded,
    partialError,
    retryQueues: () => setReloadTick(value => value + 1),
    primaryAction,
    canOrg,
    hasQueueWork,
    canProduct,
    canSupplier,
    canProductionOrder,
    canSalesOrder,
    materialBars: state.materialBars,
    dishSummary,
    supplierOverview: state.supplierOverview,
    orderSummary: state.orderSummary,
    salesSummary: state.salesSummary,
  };
}
