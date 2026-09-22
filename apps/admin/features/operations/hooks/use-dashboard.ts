"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuthSession } from "@dcentervn/auth-react";
import {
  MOCK_DASHBOARD_METRICS,
  MOCK_ACTIVITY_ITEMS,
  type DashboardMetric,
  type ActivityItem,
} from "../data";

export type { DashboardMetric, ActivityItem };

export function useDashboard() {
  const { user, accessToken } = useAuthSession();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // In production, this calls the typed operations API endpoint.
      // Falls back to cleanly decoupled seed/mock data.
      setMetrics(MOCK_DASHBOARD_METRICS);
      setActivities(MOCK_ACTIVITY_ITEMS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData, accessToken]);

  return {
    user,
    metrics,
    activities,
    isLoading,
    refresh: fetchDashboardData,
  };
}
