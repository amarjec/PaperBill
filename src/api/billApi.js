import apiClient from './apiClient';

export const billApi = {
  // Matches createBill in bill.controller.js
  create: async (payload) => {
    const { data } = await apiClient.post('/bills', payload);
    return data;
  }
};