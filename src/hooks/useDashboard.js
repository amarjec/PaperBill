import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { analyticsApi } from '../api/analyticsApi';

export function useDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    grossProfit: 0,
    totalPendingKhata: 0,
    totalBillsGenerated: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getProfitReport();
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      console.error("Dashboard stats error:", error);
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