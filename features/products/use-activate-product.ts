"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Product } from "@/lib/api/sales";
import { getLifecycleDetail, hasApprovedPrice, transitionProduct, type LifecycleInput } from "@/lib/api/product-lifecycle";
import { FetchError } from "@/lib/fetcher";
import { safeMessage } from "@/lib/api/dishes";
import { useAccess } from "@/lib/access-boundary";

const selectionSchema = z.object({ variantRef: z.string().min(1) });
type Attempt = { variantRef: string; ready?: LifecycleInput; active: LifecycleInput; prepared: boolean; activated: boolean };
function activationError(cause: unknown): string {
  const message = cause instanceof Error ? cause.message : "";
  const code = cause instanceof FetchError ? cause.code : "";
  if (code === "price_not_active") return "Chưa có giá bán đã duyệt";
  if (code === "price_floor_violation") return "Giá bán thấp hơn giá sàn. Kiểm tra và duyệt lại giá bán.";
  if (/BOM|cost|serving configuration/i.test(message)) return "Chưa chuẩn bị định giá";
  if (/[À-ỹĐđ]/.test(message)) return safeMessage(message);
  if (cause instanceof FetchError) {
    if (cause.status === 409) return "Dữ liệu vừa thay đổi. Đóng hộp thoại và mở lại để tải bản mới.";
    if (cause.status === 422) return "Chưa đủ điều kiện mở bán. Kiểm tra tên, danh mục và cấu hình suất bán.";
    if (cause.status === 403) return "Tài khoản của bạn chưa có quyền mở bán sản phẩm.";
    if (cause.status === 503) return "Hệ thống tạm bận, thử lại sau ít phút.";
  }
  return "Không thể mở bán sản phẩm. Vui lòng thử lại sau.";
}

export function useActivateProduct(product: Product, allowed: boolean, onActivated: () => Promise<void>) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const attempt = useRef<Attempt | null>(null);
  const { scope } = useAccess();
  const form = useForm<z.infer<typeof selectionSchema>>({ resolver: zodResolver(selectionSchema), defaultValues: { variantRef: "" } });
  const canActivate = allowed && product.status === "DRAFT";
  const detail = useSWR(open && canActivate ? ["product-lifecycle", product.id, scope?.userId, scope?.orgId, scope?.branchId] : null,
    () => getLifecycleDetail(product.id));
  const variants = detail.data?.variants.filter(variant => variant.sku_kind === "PRODUCED_VARIANT" && variant.sellable && (["DRAFT", "READY"].includes(variant.status) || variant.id === attempt.current?.variantRef)) ?? [];
  const chosenRef = form.watch("variantRef");
  const variantRef = attempt.current?.variantRef || chosenRef || variants[0]?.id || "";
  const price = useSWR(open && canActivate && variantRef ? ["product-lifecycle-price", variantRef, scope?.userId, scope?.orgId, scope?.branchId] : null,
    () => hasApprovedPrice(variantRef));
  const loading = detail.isLoading || price.isLoading;
  const readError = detail.error || price.error;
  function changeOpen(value: boolean) {
    if (pending.current) return;
    if (value !== open) { attempt.current = null; form.reset(); }
    setError("");
    setOpen(value);
  }
  function selectVariant(value: string) {
    if (pending.current || attempt.current) return;
    form.setValue("variantRef", value, { shouldValidate: true });
    setError("");
  }
  async function activate() {
    if (!canActivate || !open || pending.current || loading || readError || (!attempt.current && price.data !== true)) return;
    const selected = variants.find(variant => variant.id === variantRef);
    if (!detail.data || (!attempt.current && (!selected || !selectionSchema.safeParse({ variantRef }).success))) return;
    pending.current = true;
    setSubmitting(true);
    setError("");
    const action = attempt.current ??= {
      variantRef, prepared: selected?.status === "READY", activated: false,
      ready: selected?.status === "DRAFT" ? { operation_id: crypto.randomUUID(), expected_version: selected.version, to_state: "READY", reason: "Chuẩn bị suất bán" } : undefined,
      active: { operation_id: crypto.randomUUID(), expected_version: detail.data.product.version, to_state: "ACTIVE", reason: "Mở bán sản phẩm", activate_variant_refs: [variantRef] },
    };
    try {
      if (!action.prepared && action.ready) {
        await transitionProduct(product.id, action.ready, action.variantRef);
        action.prepared = true;
      }
      if (!action.activated) {
        await transitionProduct(product.id, action.active);
        action.activated = true;
      }
      await onActivated();
      setOpen(false);
    } catch (cause) {
      setError(activationError(cause));
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }
  return { canActivate, open, changeOpen, submitting, error: error || (readError ? activationError(readError) : ""), activate,
    loading, variants, variantRef, selectVariant, selectionLocked: submitting || !!attempt.current,
    needsPrice: price.data === false, canSubmit: !loading && !readError && price.data === true && !!variantRef };
}
