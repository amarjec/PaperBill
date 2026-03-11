import apiClient from './apiClient';

export const staffApi = {
  getAll: async () => {
    const { data } = await apiClient.get('/staff');
    return data;
  },
  add: async (payload) => {
    const { data } = await apiClient.post('/staff', payload);
    return data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/staff/${id}`, payload);
    return data;
  },
  delete: async (id) => {
    const { data } = await apiClient.delete(`/staff/${id}`);
    return data;
  }
};