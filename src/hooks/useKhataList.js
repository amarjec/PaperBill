import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { customerApi } from '../api/customerApi';

export function useKhataList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAll();
      if (data.success) {
        // Only keep customers who actually owe money
        const debtors = (data.customers || []).filter(c => (c.total_debt || 0) > 0);
        setCustomers(debtors);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load Khata records.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh every time the tab is opened
  useFocusEffect(
    useCallback(() => {
      fetchCustomers();
    }, [])
  );

  const filteredDebtors = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerSearch = searchTerm.toLowerCase();
    return customers.filter(c => 
      c.name?.toLowerCase().includes(lowerSearch) || 
      c.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // Calculate global shop pending amount
  const totalMarketDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);
  }, [customers]);

  return { 
    debtors: filteredDebtors, 
    totalMarketDebt, 
    loading, 
    searchTerm, 
    setSearchTerm, 
    refresh: fetchCustomers 
  };
}