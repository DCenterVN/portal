"use client";

import { useEffect, useState } from "react";
import { getPublicTraceability, type PublicTraceability } from "@/lib/api/production";

export function useTrace(code: string) {
  const [trace, setTrace] = useState<PublicTraceability | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    getPublicTraceability(code).then((value) => {
      if (active) setTrace(value);
    }).catch(() => {
      if (active) setError(true);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [code, attempt]);

  return { trace, error, loading, retry: () => setAttempt((value) => value + 1) };
}
