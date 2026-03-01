import apiClient from './apiClient';

export const subCategoryApi = {
  // Uses the backend route: /api/categories/sub
  getAll: async () => {
    const { data } = await apiClient.get('/categories/sub');
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/categories/sub', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/categories/sub/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/categories/sub/${id}`);
    return data;
  }
};