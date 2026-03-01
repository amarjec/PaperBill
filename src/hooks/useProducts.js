import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { productApi } from '../api/productApi';
import { useApp } from '../context/AppContext'; 

export function useProducts(subId, searchTerm = '') {
  const { list, setList } = useApp(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = async () => {
    if (!subId) return;
    try {
      setLoading(true);
      const data = await productApi.getAll(subId);
      if (data.success) setProducts(data.products || []);
    } catch (error) {
      Alert.alert("Error", "Could not load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [subId]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    // FIX: Match the database key 'item_name'
    return products.filter(p => p.item_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const updateQuantity = (product, delta) => {
    setList(prevList => {
      const updatedList = { ...prevList };
      const currentQty = updatedList[product._id]?.qty || 0;
      const newQty = Math.max(0, currentQty + delta);

      if (newQty === 0) {
        delete updatedList[product._id]; 
      } else {
        updatedList[product._id] = { ...product, qty: newQty };
      }
      return updatedList;
    });
  };

  const handleSave = async (formData, editingId = null) => {
    setIsSubmitting(true);
    try {
      const payload = { ...formData, subcategory_id: subId };
      if (editingId) {
        await productApi.update(editingId, payload);
      } else {
        await productApi.create(payload);
      }
      await fetchProducts();
      return true;
    } catch (error) {
      Alert.alert("Error", "Failed to save product.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setIsSubmitting(true);
    try {
      await productApi.delete(id);
      await fetchProducts();
    } catch (error) {
      Alert.alert("Error", "Failed to delete product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return { products: filteredProducts, cart: list, updateQuantity, loading, isSubmitting, handleSave, handleDelete };
}