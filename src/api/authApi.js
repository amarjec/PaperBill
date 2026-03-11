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
  },

  // Staff Login Endpoint
  staffLogin: async (phoneNumber, otp, deviceId) => {
    const { data } = await apiClient.post('/auth/staff/verify-otp', { 
      phoneNumber, 
      otp, 
      deviceId 
    });
    return data;
  }
};