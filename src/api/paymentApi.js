import apiClient from './apiClient';

export const paymentApi = {
  createOrder: async (planId) => {
    const { data } = await apiClient.post('/payments/order', { planId });
    return data;
  },
  verifyPayment: async (paymentData) => {
    const { data } = await apiClient.post('/payments/verify', paymentData);
    return data;
  }
};