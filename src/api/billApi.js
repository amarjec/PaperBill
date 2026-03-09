import apiClient from './apiClient';

export const billApi = {
  create: async (payload) => {
    const { data } = await apiClient.post('/bills', payload);
    return data;
  },
  getAll: async () => {
    const { data } = await apiClient.get('/bills?limit=500');
    return data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/bills/${id}`);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/bills/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/bills/${id}`);
    return data;
  },
  convertBrand: async (id, target_brand) => {
    const { data } = await apiClient.put(`/bills/${id}/convert-brand`, { target_brand });
    return data;
  },
  convertEstimate: async (id, payload) => {
    const { data } = await apiClient.post(`/bills/${id}/convert-estimate`, payload);
    return data;
  }
};