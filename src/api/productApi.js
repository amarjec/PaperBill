import apiClient from './apiClient';

export const productApi = {
  // Fetch specific subcategory OR all products
  getAll: async (subId) => {
    const endpoint = subId === 'all' ? '/products' : `/products/subcategory/${subId}`;
    const { data } = await apiClient.get(endpoint);
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/products', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/products/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/products/${id}`);
    return data;
  }
};