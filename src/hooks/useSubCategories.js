import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { subCategoryApi } from '../api/subCategoryApi';

export function useSubCategories(categoryId, searchTerm = '') {
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const data = await subCategoryApi.getAll();
      if (data.success) {
        // Fallback checks for property names based on your backend response
        const allSubs = data.subcategories || data.subs || [];
        // Only keep subcategories that belong to the current category ID
        const filtered = allSubs.filter(s => s.category_id === categoryId);
        setSubCategories(filtered);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load sub-categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categoryId) fetchSubCategories();
  }, [categoryId]);

  // Real-time Search Filtering
  const filteredData = useMemo(() => {
    if (!searchTerm) return subCategories;
    return subCategories.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subCategories, searchTerm]);

  const handleSave = async (name, editingId = null) => {
    setIsSubmitting(true);
    try {
      if (editingId) {
        await subCategoryApi.update(editingId, { name, category_id: categoryId });
      } else {
        await subCategoryApi.create({ name, category_id: categoryId });
      }
      await fetchSubCategories();
      return true;
    } catch (error) {
      Alert.alert("Error", "Failed to save sub-category.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await subCategoryApi.delete(id);
      await fetchSubCategories();
    } catch (error) {
      Alert.alert("Error", "Failed to delete sub-category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { subCategories: filteredData, loading, isSubmitting, handleSave, handleDelete, refresh: fetchSubCategories };
}