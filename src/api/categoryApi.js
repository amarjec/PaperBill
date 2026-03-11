import apiClient from './apiClient';

export const categoryApi = {
  // Matches getAllCategories in category.controller.js
  getAll: async () => {
    const { data } = await apiClient.get('/categories');
    return data;
  },
  // Matches createCategory in category.controller.js
  create: async (payload) => {
    const { data } = await apiClient.post('/categories', payload);
    return data;
  },
  // Matches updateCategory in category.controller.js
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/categories/${id}`, payload);
    return data;
  },
  // Matches softDeleteCategory in category.controller.js
  delete: async (id) => {
    const { data } = await apiClient.delete(`/categories/${id}`);
    return data;
  }
};