"use client";

import { useEffect, useState } from "react";
import type { PublicTraceability } from "@/lib/api/production";
import { apiFetch } from "@/lib/fetcher";
import { responseData } from "@/lib/api/production-http";

export async function loadPublicTrace(code: string) {
  const response = await apiFetch(`/api/public/traceability/${encodeURIComponent(code)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Không thể tải hồ sơ truy xuất");
  return responseData<PublicTraceability>(response);
}

export function useTrace(code: string) {
  const [trace, setTrace] = useState<PublicTraceability | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!code) return;
    let active = true;
    setTrace(null);
    setLoading(true);
    setError(false);
    loadPublicTrace(code).then(value => {
      if (active) setTrace(value);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [code, attempt]);

  return { trace, error, loading, retry: () => setAttempt(value => value + 1) };
}
