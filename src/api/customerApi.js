import apiClient from './apiClient';

export const customerApi = {
  // Matches getAllCustomers in customer.controller.js
  getAll: async () => {
    const { data } = await apiClient.get('/customers');
    return data;
  },
  // Matches createCustomer in customer.controller.js
  create: async (payload) => {
    const { data } = await apiClient.post('/customers', payload);
    return data;
  }
};