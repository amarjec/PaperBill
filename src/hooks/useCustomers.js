import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { customerApi } from '../api/customerApi';

export function useCustomers(searchTerm = '') {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAll();
      if (data.success) setCustomers(data.customers || []);
    } catch (error) {
      Alert.alert("Error", "Could not load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lowerSearch = searchTerm.toLowerCase();
    // Search by name or phone number
    return customers.filter(c => 
      c.name?.toLowerCase().includes(lowerSearch) || 
      c.phone_number?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  const handleSave = async (formData) => {
    setIsSubmitting(true);
    try {
      const data = await customerApi.create(formData);
      await fetchCustomers();
      return data.customer; // Return the created customer so we can auto-select them
    } catch (error) {
      Alert.alert("Error", "Failed to add new customer.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { customers: filteredCustomers, loading, isSubmitting, handleSave, refresh: fetchCustomers };
}