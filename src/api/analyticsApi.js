import apiClient from './apiClient';

export const analyticsApi = {
  getDashboard: async (startDate, endDate) => {
    // Passes the exact ISO date strings to our backend pipeline
    const { data } = await apiClient.get(`/analytics/dashboard?startDate=${startDate}&endDate=${endDate}`);
    return data;
  }
};