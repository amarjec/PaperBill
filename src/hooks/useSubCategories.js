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
        const allSubs = data.subcategories || data.subs || [];

        // FIX: Safely extract the ID from category_id regardless of its shape.
        // It can be:
        //   - a plain string: "abc123"
        //   - a MongoDB ObjectId (has .toString()): ObjectId("abc123")
        //   - a populated object (has ._id): { _id: "abc123", name: "Hardware" }
        const filtered = allSubs.filter(s => {
          const subCatId =
            typeof s.category_id === 'object' && s.category_id !== null
              ? String(s.category_id._id ?? s.category_id) // handle populated or ObjectId
              : String(s.category_id);                      // handle plain string

          return subCatId === String(categoryId);
        });

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

  const filteredData = useMemo(() => {
    if (!searchTerm) return subCategories;
    return subCategories.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
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

  return {
    subCategories: filteredData,
    loading,
    isSubmitting,
    handleSave,
    handleDelete,
    refresh: fetchSubCategories
  };
}