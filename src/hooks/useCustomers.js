import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { customerApi } from '../api/customerApi';
import { usePermission } from './usePermission';

export function useCustomers(searchTerm = '') {
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { can } = usePermission();

  const fetchCustomers = async () => {
    if (!can('customers', 'read')) {
      setCustomers([]);
      setLoading(false);
      return; 
    }
    try {
      setLoading(true);
      const data = await customerApi.getAll();
      if (data.success) setCustomers(data.customers || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  // Bug #17 fix: search against `phone` not `phone_number`
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lower = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.name?.toLowerCase().includes(lower) ||
      c.phone?.includes(searchTerm)
    );
  }, [customers, searchTerm]);

  // CREATE
  const handleCreate = async (formData) => {
    setIsSubmitting(true);
    try {
      const data = await customerApi.create(formData);
      await fetchCustomers();
      return data.customer;
    } catch (error) {
      Alert.alert('Error', 'Failed to add customer.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATE
  const handleUpdate = async (id, formData) => {
    setIsSubmitting(true);
    try {
      await customerApi.update(id, formData);
      await fetchCustomers();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to update customer.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE
  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await customerApi.delete(id);
      await fetchCustomers();
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to delete customer.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    customers: filteredCustomers,
    loading,
    isSubmitting,
    handleCreate,
    handleUpdate,
    handleDelete,
    refresh: fetchCustomers,
  };
}