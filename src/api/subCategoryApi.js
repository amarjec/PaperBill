import apiClient from './apiClient';

export const subCategoryApi = {
  // Uses the backend route: /api/categories/sub
  getAll: async () => {
    const { data } = await apiClient.get('/subcategories');
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/subcategories', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/subcategories/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/subcategories/${id}`);
    return data;
  }
};