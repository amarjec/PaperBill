import { useState, useCallback, useEffect } from 'react';
import { analyticsApi } from '../api/analyticsApi';

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Default filter is 'month'
  const [filterType, setFilterType] = useState('month');

  // Custom date range state
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  // ─── THE FIX: Each case creates independent Date objects ─────────────────
  // Never mutate the same `now` object twice — doing so causes the `end`
  // variable to silently hold the wrong time (Bug #7 in the audit report).
  const getDateRange = (filter) => {
    switch (filter) {
      case 'today': {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return { start: start.toISOString(), end: end.toISOString() };
      }

      case 'week': {
        const start = new Date();
        start.setDate(start.getDate() - 6); // 6 days ago
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return { start: start.toISOString(), end: end.toISOString() };
      }

      case 'month': {
        const now = new Date();

        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return { start: start.toISOString(), end: end.toISOString() };
      }

      case 'year': {
        const now = new Date();

        const start = new Date(now.getFullYear(), 0, 1); // Jan 1st
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return { start: start.toISOString(), end: end.toISOString() };
      }

      case 'custom': {
        // These are already ISO strings set by applyCustomRange()
        return { start: customRange.start, end: customRange.end };
      }

      default: {
        // Fallback to current month
        const now = new Date();

        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        return { start: start.toISOString(), end: end.toISOString() };
      }
    }
  };

  const fetchAnalytics = useCallback(async () => {
    const { start, end } = getDateRange(filterType);

    // Guard: custom range selected but dates not yet picked
    if (!start || !end) return;

    try {
      setLoading(true);
      const res = await analyticsApi.getDashboard(
        encodeURIComponent(start), // Bug #23 fix: encode the ISO string
        encodeURIComponent(end)
      );

      if (res.success) {
        setData(res);
      }
    } catch (error) {
      // 403 is expected for free users hitting the premium analytics endpoint.
      // We silently ignore it so the screen doesn't crash.
      if (error?.response?.status !== 403) {
        console.error('Analytics fetch error:', error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [filterType, customRange]);

  // Apply a custom date range — called from the UI date picker
  const applyCustomRange = (startDate, endDate) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    setCustomRange({ start: start.toISOString(), end: end.toISOString() });
    setFilterType('custom'); // This triggers fetchAnalytics via the useEffect below
  };

  // Re-fetch whenever the filter or custom range changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    filterType,
    setFilterType,
    customRange,
    setCustomRange,
    applyCustomRange,
    refresh: fetchAnalytics,
  };
}