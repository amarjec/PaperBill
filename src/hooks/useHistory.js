import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import { billApi } from "../api/billApi";

export function useHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("Bills"); // 'Bills' | 'Estimates'

  // Date filter: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom'
  const [dateFilter, setDateFilter] = useState("all");
  // payment filter: 'all' | 'Paid' | 'Unpaid' | 'Partial'
  const [paymentFilter, setPaymentFilter] = useState("all");
  // custom range
  const [customRange, setCustomRange] = useState({ start: null, end: null });

  const applyCustomRange = (start, end) => {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const e = new Date(end);
    e.setHours(23, 59, 59, 999);
    setCustomRange({ start: s, end: e });
    setDateFilter("custom");
  };

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billApi.getAll();
      if (res.success) setBills(res.bills || []);
    } catch {
      Alert.alert("Error", "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, []),
  );

  const filteredData = useMemo(() => {
    let filtered = bills;

    // 1. Bills vs Estimates
    filtered =
      activeTab === "Estimates"
        ? filtered.filter((b) => b.is_estimate)
        : filtered.filter((b) => !b.is_estimate);

    // 2. Date filter
    const now = new Date();
    if (dateFilter !== "all") {
      filtered = filtered.filter((b) => {
        const d = new Date(b.createdAt);
        if (dateFilter === "custom" && customRange.start && customRange.end) {
          return d >= customRange.start && d <= customRange.end;
        }
        const start = new Date(now);
        if (dateFilter === "today") {
          start.setHours(0, 0, 0, 0);
          return d >= start;
        }
        if (dateFilter === "week") {
          start.setDate(now.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          return d >= start;
        }
        if (dateFilter === "month") {
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth()
          );
        }
        if (dateFilter === "year") {
          return d.getFullYear() === now.getFullYear();
        }
        return true;
      });
    }

    // 3. Payment filter (bills only)
    if (activeTab === "Bills" && paymentFilter !== "all") {
      filtered = filtered.filter((b) => b.status === paymentFilter);
    }

    // 4. Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.bill_number?.toLowerCase().includes(q) ||
          b.customer_id?.name?.toLowerCase().includes(q),
      );
    }

    // Sort newest first
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [bills, activeTab, dateFilter, paymentFilter, customRange, searchTerm]);

  // summary for current filtered set
  const summary = useMemo(() => {
    if (activeTab === "Estimates") {
      return {
        count: filteredData.length,
        total: filteredData.reduce((s, b) => s + (b.total_amount || 0), 0),
      };
    }
    const paid = filteredData.filter((b) => b.status === "Paid");
    const unpaid = filteredData.filter((b) => b.status === "Unpaid");
    const partial = filteredData.filter((b) => b.status === "Partial");
    return {
      count: filteredData.length,
      total: filteredData.reduce((s, b) => s + (b.total_amount || 0), 0),
      collected: filteredData.reduce((s, b) => s + (b.amount_paid || 0), 0),
      udhaar: filteredData.reduce((s, b) => s + (b.udhaar_amount || 0), 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      partialCount: partial.length,
    };
  }, [filteredData, activeTab]);

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    paymentFilter,
    setPaymentFilter,
    customRange,
    applyCustomRange,
    filteredData,
    summary,
    loading,
    refresh: fetchBills,
  };
}
