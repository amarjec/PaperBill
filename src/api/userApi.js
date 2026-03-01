import apiClient from './apiClient';

export const userApi = {
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },
  setPin: async (pin) => {
    const response = await apiClient.post('/users/set-pin', { new_pin: pin });
    return response.data;
  },
  verifyPin: async (pin) => {
    const response = await apiClient.post('/users/verify-pin', { pin });
    return response.data;
  },
  getProfile: async () => {
    const { data } = await apiClient.get('/users/profile');
    return data;
  },
  updateProfile: async (payload) => {
    const { data } = await apiClient.put('/users/profile', payload);
    return data;
  },
  setPin: async (new_pin) => {
    const { data } = await apiClient.post('/users/set-pin', { new_pin });
    return data;
  },
  deleteAccount: async () => {
    const { data } = await apiClient.delete('/users');
    return data;
  }
};