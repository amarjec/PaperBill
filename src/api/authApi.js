import apiClient from './apiClient';

export const authApi = {
  // Matches backend ownerGoogleLogin
  googleLogin: async (idToken, deviceId) => {
    const response = await apiClient.post('/auth/google-login', { idToken, deviceId });
    return response.data;
  },

  // Matches backend logout
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  }
};