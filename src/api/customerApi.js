import apiClient from './apiClient';

export const customerApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/customers');
    return data;
  },
  create: async (payload) => {
    const { data } = await apiClient.post('/customers', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/customers/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/customers/${id}`);
    return data;
  },
  getKhata: async (id) => {
    const { data } = await apiClient.get(`/customers/${id}/khata`);
    return data;
  },
  recordKhataPayment: async (id, payload) => {
    const { data } = await apiClient.post(`/customers/${id}/khata-payment`, payload);
    return data;
  },
};