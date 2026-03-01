import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { categoryApi } from '../api/categoryApi';

export function useCategories(searchTerm = '') {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      if (data.success) setCategories(data.categories);
    } catch (error) {
      Alert.alert("Error", "Could not load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filter categories based on search input
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    return categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [categories, searchTerm]);

  const handleSave = async (name, editingId = null) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await categoryApi.update(editingId, { name });
      } else {
        await categoryApi.create({ name });
      }
      await fetchCategories();
      return true;
    } catch (error) {
      Alert.alert("Error", "Failed to save category.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await categoryApi.delete(id);
      await fetchCategories();
    } catch (error) {
      Alert.alert("Error", "Failed to delete category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { 
    categories: filteredCategories, 
    loading, 
    isSubmitting, 
    handleSave, 
    handleDelete, 
    refresh: fetchCategories 
  };
}