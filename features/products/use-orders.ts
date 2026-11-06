"use client";

import { useCallback, useEffect, useState } from "react";
import { getOrderDisplay } from "@/lib/api/sales";

export function useOrders() {
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrderDisplay>>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setOrders(await getOrderDisplay()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thể tải đơn hàng"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return { orders, loading, error, load };
}
