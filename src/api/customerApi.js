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
  // NEW KHATA ENDPOINTS
  getKhata: async (id) => {
    const { data } = await apiClient.get(`/customers/${id}/khata`);
    return data;
  },
  recordKhataPayment: async (id, payload) => {
    const { data } = await apiClient.post(`/customers/${id}/khata-payment`, payload);
    return data;
  }
};