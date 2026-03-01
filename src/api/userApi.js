import apiClient from './apiClient';

export const userApi = {
  // Matches: router.put('/profile', ownerOnly, updateUserDetails);
  updateProfile: async (profileData) => {
    const response = await apiClient.put('/users/profile', profileData);
    return response.data;
  },

  // Matches: router.post('/set-pin', ownerOnly, setSecurePin);
  setPin: async (pin) => {
    const response = await apiClient.post('/users/set-pin', { new_pin: pin });
    return response.data;
  }
};