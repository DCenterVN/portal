"use client";

import { useState } from "react";
import { createDraftProduct, type Product } from "@/lib/api/sales";

export function useCreateDraftProduct(onSuccess?: (product: Product) => void) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  async function create(input: { name: string; slug: string }) {
    if (submitting) return undefined;
    setSubmitting(true);
    setError("");
    try {
      const created = await createDraftProduct(input);
      onSuccess?.({ ...created, status: "DRAFT", sku_code: "", uom: "", created_at: "" });
      return created;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không tạo được sản phẩm nháp");
      return undefined;
    } finally {
      setSubmitting(false);
    }
  }
  return { submitting, error, create };
}
