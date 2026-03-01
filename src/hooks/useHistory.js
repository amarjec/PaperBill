import { useState, useMemo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { billApi } from '../api/billApi';

export function useHistory() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('Bills'); // 'Bills' or 'Estimates'

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await billApi.getAll();
      if (res.success) {
        setBills(res.bills || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // Refreshes the data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchBills();
    }, [])
  );

  const filteredData = useMemo(() => {
    let filtered = bills;

    // 1. Separate Bills from Estimates
    if (activeTab === 'Estimates') {
      filtered = filtered.filter(b => b.is_estimate);
    } else {
      filtered = filtered.filter(b => !b.is_estimate);
    }

    // 2. Handle Search by Bill Number or Customer Name
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        b.bill_number?.toLowerCase().includes(lowerSearch) || 
        b.customer_id?.name?.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [bills, activeTab, searchTerm]);

  return { activeTab, setActiveTab, searchTerm, setSearchTerm, filteredData, loading, refresh: fetchBills };
}