import apiClient from './apiClient';

export const analyticsApi = {
  getProfitReport: async () => {
    const { data } = await apiClient.get('/analytics/profit');
    return data;
  }
};