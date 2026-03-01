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
  }
};