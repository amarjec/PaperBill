import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { analyticsApi } from '../api/analyticsApi';

export function useDashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalProfit: 0,
    totalUdhaar: 0,
    totalBills: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get today's date range for the summary card
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(); // fresh Date, NOT mutating now
      endDate.setHours(23, 59, 59, 999);

      const res = await analyticsApi.getDashboard(
        encodeURIComponent(startDate.toISOString()),
        encodeURIComponent(endDate.toISOString()),
      );

      if (res.success) {
        // Map the actual backend response shape to our state
        setStats({
          totalSales: res.summary?.totalSales || 0,
          totalProfit: res.summary?.totalProfit || 0,
          totalUdhaar: res.summary?.totalUdhaar || 0,
          totalBills: res.summary?.totalBills || 0,
        });
      }
    } catch (error) {
      // Analytics is premium-only — a 403 here is expected for free users
      // We silently fail so the dashboard still loads for free users
      console.log("Dashboard stats error (may be non-premium user):", error?.response?.status);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  return { stats, loading, refresh: fetchStats };
}