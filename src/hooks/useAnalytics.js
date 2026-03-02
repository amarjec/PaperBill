import { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { analyticsApi } from '../api/analyticsApi';

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Default filter is 'week' (Last 7 Days)
  const [filterType, setFilterType] = useState('year'); 
  
  // Custom date range state (for the future date picker implementation)
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  // Helper function to calculate exact start/end ISO strings based on the filter
  const getDateRange = (filter) => {
    const now = new Date();
    const end = new Date(now.setHours(23, 59, 59, 999)).toISOString();
    let start;

    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    switch (filter) {
      case 'today':
        start = startOfDay.toISOString();
        break;
      case 'week':
        // Last 7 days
        start = new Date(startOfDay.setDate(startOfDay.getDate() - 6)).toISOString();
        break;
      case 'month':
        // 1st day of the current month
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        break;
      case 'year':
        // 1st day of the current year
        start = new Date(now.getFullYear(), 0, 1).toISOString();
        break;
      case 'custom':
        return { start: customRange.start, end: customRange.end };
      default:
        start = new Date(startOfDay.setDate(startOfDay.getDate() - 6)).toISOString();
    }
    return { start, end };
  };

  const fetchAnalytics = useCallback(async () => {
    const { start, end } = getDateRange(filterType);
    
    if (!start || !end) return;

    try {
      setLoading(true);
      const res = await analyticsApi.getDashboard(start, end);
      
      if (res.success) {
        setData(res); // Stores the summary, chartData, topProducts, and topCustomers!
      }
    } catch (error) {
      // If it's a 403 Premium error, our apiClient interceptor will catch it, 
      // but we log it here just in case.
      console.log("Analytics Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, customRange]);


  // NEW: Function to handle the custom date submission
  const applyCustomRange = (startDate, endDate) => {
    // Set the time to beginning of start day and end of end day
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    setCustomRange({ start: start.toISOString(), end: end.toISOString() });
    setFilterType('custom');
  };

  // Refetch whenever the filter changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    filterType,
    setFilterType,
    setCustomRange,
    applyCustomRange,
    refresh: fetchAnalytics
  };
}